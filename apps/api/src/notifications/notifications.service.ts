import { Injectable, Logger } from '@nestjs/common';
import { PlatformBranding } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailProvider, SendEmailInput, SendEmailResult } from './email-provider';
import { ResendAdapter } from './resend.adapter';
import { paragraph, renderSystemEmailHtml } from './email-layout';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private provider: EmailProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.provider = new ResendAdapter(
      process.env.RESEND_API_KEY ?? '',
      process.env.EMAIL_FROM ?? '',
    );
  }

  /** Test hook only. */
  setProviderForTests(provider: EmailProvider) {
    this.provider = provider;
  }

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
  }

  private disabled(): boolean {
    return process.env.NOTIFICATIONS_DISABLED === '1';
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult | null> {
    if (this.disabled()) return null;
    if (!this.isConfigured() && this.provider.name === 'resend') {
      this.logger.debug('Email skipped — Resend not configured');
      return null;
    }
    return this.provider.send(input);
  }

  private async loadBranding(): Promise<PlatformBranding> {
    return this.prisma.platformBranding.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
  }

  private async sendBranded(input: {
    to: string | string[];
    subject: string;
    text: string;
    title: string;
    bodyHtml: string;
  }) {
    const branding = await this.loadBranding();
    const html = renderSystemEmailHtml({
      branding,
      title: input.title,
      bodyHtml: input.bodyHtml,
    });
    return this.sendEmail({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html,
    });
  }

  async notifyJobComplete(input: {
    organizationId: string;
    jobId: string;
    type: string;
    status: 'succeeded' | 'failed';
    error?: string;
  }) {
    if (this.disabled()) return;

    try {
      const recipients = await this.ownerAdminEmails(input.organizationId);
      if (recipients.length === 0) return;

      const subject =
        input.status === 'succeeded'
          ? `Lugemi job succeeded (${input.type})`
          : `Lugemi job failed (${input.type})`;
      const text =
        input.status === 'succeeded'
          ? `Job ${input.jobId} (${input.type}) completed successfully.`
          : `Job ${input.jobId} (${input.type}) failed: ${input.error ?? 'unknown error'}`;

      const result = await this.sendBranded({
        to: recipients,
        subject,
        text,
        title: subject,
        bodyHtml: paragraph(text),
      });
      if (!result) return;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.job_complete_sent',
        route: 'jobs.worker',
        metadata: { jobId: input.jobId, status: input.status, provider: result.provider, emailId: result.id },
      });
    } catch (error) {
      this.logger.warn(
        `Job notification failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async maybeNotifyUsageThresholds(organizationId: string) {
    if (this.disabled()) return;

    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, characterQuota: true, name: true },
      });
      if (!org || org.characterQuota <= 0) return;

      const periodStart = new Date();
      periodStart.setUTCDate(1);
      periodStart.setUTCHours(0, 0, 0, 0);

      const translateEvents = await this.prisma.usageEvent.findMany({
        where: {
          organizationId,
          feature: 'translate',
          createdAt: { gte: periodStart },
        },
        select: { units: true },
      });
      const characters = translateEvents.reduce((sum, event) => sum + event.units, 0);

      const thresholds: Array<{ pct: number; action: string }> = [
        { pct: 100, action: 'usage.threshold_100' },
        { pct: 80, action: 'usage.threshold_80' },
      ];

      for (const threshold of thresholds) {
        const triggerAt = Math.ceil((org.characterQuota * threshold.pct) / 100);
        if (characters < triggerAt) continue;

        const already = await this.prisma.auditEvent.findFirst({
          where: {
            organizationId,
            action: threshold.action,
            createdAt: { gte: periodStart },
          },
          select: { id: true },
        });
        if (already) continue;

        const recipients = await this.ownerAdminEmails(organizationId);
        if (recipients.length === 0) {
          await this.audit.record({
            organizationId,
            action: threshold.action,
            route: 'notifications.usage',
            metadata: { characters, quota: org.characterQuota, emailed: false },
          });
          continue;
        }

        try {
          const text = `Your organization "${org.name}" has used ${characters.toLocaleString()} of ${org.characterQuota.toLocaleString()} monthly characters (${threshold.pct}% threshold).`;
          const result = await this.sendBranded({
            to: recipients,
            subject: `Lugemi usage at ${threshold.pct}% — ${org.name}`,
            text,
            title: `Usage at ${threshold.pct}%`,
            bodyHtml: paragraph(text),
          });

          await this.audit.record({
            organizationId,
            action: threshold.action,
            route: 'notifications.usage',
            metadata: {
              characters,
              quota: org.characterQuota,
              emailed: Boolean(result),
              emailId: result?.id,
            },
          });

          if (result) {
            await this.audit.record({
              organizationId,
              action: 'notification.usage_threshold_sent',
              route: 'notifications.usage',
              metadata: { threshold: threshold.pct, emailId: result.id },
            });
          }
        } catch (error) {
          this.logger.warn(
            `Usage threshold notification failed: ${error instanceof Error ? error.message : error}`,
          );
        }
      }
    } catch (error) {
      this.logger.debug(
        `Usage threshold check skipped: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async notifyMemberAdded(input: {
    organizationId: string;
    organizationName: string;
    email: string;
    role: string;
  }) {
    if (this.disabled() || !input.email) return;

    try {
      const text = `You now have ${input.role} access to "${input.organizationName}" on Lugemi. Sign in with the same email to open the console.`;
      const result = await this.sendBranded({
        to: input.email,
        subject: `You've been added to ${input.organizationName} on Lugemi`,
        text,
        title: `Welcome to ${input.organizationName}`,
        bodyHtml: paragraph(text),
      });
      if (!result) return;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.member_added_sent',
        route: 'identity.ensureSession',
        metadata: { email: input.email, role: input.role, emailId: result.id },
      });
    } catch (error) {
      this.logger.warn(
        `Member-added notification failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async notifyInvite(input: {
    organizationId: string;
    organizationName: string;
    email: string;
    role: string;
    token: string;
    expiresAt: Date;
  }) {
    if (this.disabled() || !input.email) return;

    const publicBase =
      process.env.APP_URL?.trim() ||
      process.env.APP_PUBLIC_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      'http://127.0.0.1:43123';
    const signInUrl = `${publicBase.replace(/\/$/, '')}/sign-in`;
    const text = `You've been invited to join "${input.organizationName}" on Lugemi as ${input.role}. Sign in with ${input.email} to accept: ${signInUrl}. Invite expires ${input.expiresAt.toISOString()}.`;

    try {
      const result = await this.sendBranded({
        to: input.email,
        subject: `Join ${input.organizationName} on Lugemi`,
        text,
        title: `You're invited to ${input.organizationName}`,
        bodyHtml: [
          paragraph(
            `You've been invited to join "${input.organizationName}" on Lugemi as ${input.role}.`,
          ),
          paragraph(`Sign in with ${input.email} to accept the invite and open the shared workspace.`),
          `<p style="margin:0 0 12px;"><a href="${signInUrl}" style="display:inline-block;padding:10px 16px;background:#007c78;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept invite</a></p>`,
          paragraph(`This invite expires on ${input.expiresAt.toUTCString()}.`),
        ].join(''),
      });
      if (!result) return;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.invite_sent',
        route: 'organization.invites',
        metadata: {
          email: input.email,
          role: input.role,
          emailId: result.id,
          tokenSuffix: input.token.slice(-6),
        },
      });
    } catch (error) {
      this.logger.warn(`Invite notification failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Explicit workflow notify step (owners/admins). */
  async notifyWorkflowMessage(input: {
    organizationId: string;
    jobId: string;
    stepId: string;
    subject: string;
    message: string;
  }) {
    if (this.disabled()) return null;
    const recipients = await this.ownerAdminEmails(input.organizationId);
    if (recipients.length === 0) return null;

    try {
      const result = await this.sendBranded({
        to: recipients,
        subject: input.subject,
        text: input.message,
        title: input.subject,
        bodyHtml: paragraph(input.message),
      });
      if (!result) return null;
      await this.audit.record({
        organizationId: input.organizationId,
        action: 'notification.workflow_step_sent',
        route: 'jobs.worker',
        metadata: {
          jobId: input.jobId,
          stepId: input.stepId,
          provider: result.provider,
          emailId: result.id,
        },
      });
      return result;
    } catch (error) {
      this.logger.warn(
        `Workflow notify failed: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async ownerAdminEmails(organizationId: string): Promise<string[]> {
    const members = await this.prisma.membership.findMany({
      where: {
        organizationId,
        role: { in: ['owner', 'admin'] },
      },
      include: { user: { select: { email: true } } },
    });
    return [
      ...new Set(
        members
          .map((m) => m.user.email?.trim())
          .filter((email): email is string => Boolean(email)),
      ),
    ];
  }
}
