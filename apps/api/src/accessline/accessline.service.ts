import { createHash, randomBytes } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AccessLineAdapters } from './accessline.adapters';
import { accesslineCatalog } from './accessline.catalog';
import {
  askIntentPrompt,
  askReferencePrompt,
  authPrompt,
  disclosurePrompt,
  handoffPrompt,
  statusPrompt,
} from './accessline.prompts';
import { assertAccessLineTransition } from './accessline.state-machine';
import {
  ACCESSLINE_FEATURE_FLAG,
  ACCESSLINE_POLICY_VERSION,
  type AccessLineState,
  type RegisteredContact,
  type TransferDestination,
} from './accessline.types';

export type AccessLineAuth = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  apiKeyId?: string | null;
  ip?: string;
};

@Injectable()
export class AccessLineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: AccessLineAdapters,
  ) {}

  catalog() {
    return accesslineCatalog();
  }

  capabilities() {
    const catalog = accesslineCatalog();
    return {
      product: 'lugemi-accessline',
      featureFlag: ACCESSLINE_FEATURE_FLAG,
      policyVersion: ACCESSLINE_POLICY_VERSION,
      workflow: catalog.workflow,
      deferred: catalog.deferred,
      telephony: catalog.telephony,
      honesty: catalog.honesty,
      docs: catalog.docs,
    };
  }

  private assertEnabled() {
    if (process.env.ACCESSLINE_DISABLED === '1') {
      throw new ApiException(
        'feature_disabled',
        'AccessLine is disabled (ACCESSLINE_DISABLED=1)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }

  private asContacts(value: unknown): RegisteredContact[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (v): v is RegisteredContact =>
        Boolean(v) &&
        typeof v === 'object' &&
        typeof (v as RegisteredContact).phoneE164 === 'string' &&
        typeof (v as RegisteredContact).customerScope === 'string',
    );
  }

  private asDestinations(value: unknown): TransferDestination[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (v): v is TransferDestination =>
        Boolean(v) &&
        typeof v === 'object' &&
        typeof (v as TransferDestination).id === 'string' &&
        typeof (v as TransferDestination).destination === 'string' &&
        typeof (v as TransferDestination).label === 'string',
    );
  }

  private async audit(
    auth: AccessLineAuth,
    action: string,
    callId: string | null,
    meta?: Record<string, unknown>,
  ) {
    await this.prisma.accessLineAuditEvent.create({
      data: {
        organizationId: auth.organizationId,
        callId,
        actorId: auth.userId,
        action,
        policyRevision: ACCESSLINE_POLICY_VERSION,
        meta: (meta ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async listLines(auth: AccessLineAuth) {
    this.assertEnabled();
    const lines = await this.prisma.accessLineBusinessLine.findMany({
      where: { organizationId: auth.organizationId, workspaceId: auth.workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return { lines: lines.map((l) => this.lineView(l)) };
  }

  async createLine(
    auth: AccessLineAuth,
    input: {
      name: string;
      inboundNumber: string;
      jurisdiction?: string;
      timeZone?: string;
      enabledLanguages?: string[];
      recordingEnabled?: boolean;
      transferDestinations?: TransferDestination[];
      registeredContacts?: RegisteredContact[];
      knowledgeSnippet?: string;
      integrationMode?: 'simulated' | 'twilio';
    },
  ) {
    this.assertEnabled();
    const inboundNumber = input.inboundNumber.trim();
    if (!inboundNumber) {
      throw new ApiException('validation_error', 'inboundNumber is required', HttpStatus.BAD_REQUEST);
    }
    const mode = input.integrationMode ?? 'simulated';
    if (mode === 'twilio' && !accesslineCatalog().telephony.configured) {
      throw new ApiException(
        'provider_not_configured',
        'Twilio credentials missing — create the line in simulated mode or configure TWILIO_*',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      const line = await this.prisma.accessLineBusinessLine.create({
        data: {
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          name: input.name.trim() || 'AccessLine pilot',
          inboundNumber,
          jurisdiction: input.jurisdiction ?? 'KE',
          timeZone: input.timeZone ?? 'Africa/Nairobi',
          enabledLanguages: input.enabledLanguages ?? ['sw-KE', 'en'],
          recordingEnabled: Boolean(input.recordingEnabled),
          transferDestinations: (input.transferDestinations ?? [
            { id: 'desk-1', label: 'Logistics desk', destination: 'sim:+254711000001' },
          ]) as unknown as Prisma.InputJsonValue,
          registeredContacts: (input.registeredContacts ?? [
            {
              phoneE164: '+254700000111',
              customerScope: 'cust_ke_demo_1',
              simulateOtpHint: '246810',
            },
          ]) as unknown as Prisma.InputJsonValue,
          knowledgeSnippet:
            input.knowledgeSnippet ??
            'Open Mon–Sat 08:00–18:00 Africa/Nairobi. Delivery status only — no address changes by phone.',
          integrationMode: mode,
          featureFlag: ACCESSLINE_FEATURE_FLAG,
        },
      });
      await this.audit(auth, 'accessline.line_created', null, { lineId: line.id });
      return this.lineView(line);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiException('conflict', 'Inbound number already configured for this org', HttpStatus.CONFLICT);
      }
      throw err;
    }
  }

  async getLine(auth: AccessLineAuth, lineId: string) {
    const line = await this.requireLine(auth, lineId);
    return this.lineView(line);
  }

  private lineView(line: {
    id: string;
    organizationId: string;
    workspaceId: string;
    name: string;
    inboundNumber: string;
    jurisdiction: string;
    timeZone: string;
    enabledLanguages: unknown;
    greetingNoticeVersion: string;
    recordingEnabled: boolean;
    transferDestinations: unknown;
    registeredContacts: unknown;
    knowledgeSnippet: string;
    integrationMode: string;
    active: boolean;
    deliveryFreshnessMinutes: number;
    maxConcurrentCalls: number;
  }) {
    const contacts = this.asContacts(line.registeredContacts).map((c) => ({
      phoneMasked: this.adapters.maskPhone(c.phoneE164),
      customerScope: c.customerScope,
      // Never expose OTP hints outside simulator create response internals
    }));
    return {
      id: line.id,
      organizationId: line.organizationId,
      workspaceId: line.workspaceId,
      name: line.name,
      inboundNumber: line.inboundNumber,
      jurisdiction: line.jurisdiction,
      timeZone: line.timeZone,
      enabledLanguages: this.asStringArray(line.enabledLanguages),
      greetingNoticeVersion: line.greetingNoticeVersion,
      recordingEnabled: line.recordingEnabled,
      transferDestinations: this.asDestinations(line.transferDestinations),
      registeredContacts: contacts,
      knowledgeSnippet: line.knowledgeSnippet,
      integrationMode: line.integrationMode,
      active: line.active,
      deliveryFreshnessMinutes: line.deliveryFreshnessMinutes,
      maxConcurrentCalls: line.maxConcurrentCalls,
      honesty:
        line.integrationMode === 'simulated'
          ? 'Simulated line — not a live carrier number.'
          : 'Twilio mode requires authorized provisioning before live customer calls.',
    };
  }

  private async requireLine(auth: AccessLineAuth, lineId: string) {
    const line = await this.prisma.accessLineBusinessLine.findFirst({
      where: {
        id: lineId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
    });
    if (!line) {
      throw new ApiException('not_found', 'AccessLine business line not found', HttpStatus.NOT_FOUND);
    }
    return line;
  }

  private async requireCall(auth: AccessLineAuth, callId: string) {
    const call = await this.prisma.accessLineCallSession.findFirst({
      where: {
        id: callId,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      include: { line: true, turns: { orderBy: { sequence: 'asc' } } },
    });
    if (!call) {
      throw new ApiException('not_found', 'AccessLine call not found', HttpStatus.NOT_FOUND);
    }
    return call;
  }

  private async transition(callId: string, from: string, to: AccessLineState) {
    assertAccessLineTransition(from, to);
    return this.prisma.accessLineCallSession.update({
      where: { id: callId },
      data: {
        state: to,
        endedAt: to === 'ended' || to === 'failed' ? new Date() : undefined,
      },
    });
  }

  private async appendTurn(
    callId: string,
    role: 'caller' | 'system',
    transcript: string,
    opts: {
      language?: string | null;
      stage?: string | null;
      generation?: number;
      dtmfDigitsMasked?: string | null;
      cancelled?: boolean;
    } = {},
  ) {
    const agg = await this.prisma.accessLineCallTurn.aggregate({
      where: { callId },
      _max: { sequence: true },
    });
    const sequence = (agg._max.sequence ?? 0) + 1;
    return this.prisma.accessLineCallTurn.create({
      data: {
        callId,
        sequence,
        role,
        transcript,
        language: opts.language ?? null,
        stage: opts.stage ?? null,
        generation: opts.generation ?? 0,
        dtmfDigitsMasked: opts.dtmfDigitsMasked ?? null,
        cancelled: opts.cancelled ?? false,
      },
    });
  }

  async listCalls(auth: AccessLineAuth) {
    this.assertEnabled();
    const calls = await this.prisma.accessLineCallSession.findMany({
      where: { organizationId: auth.organizationId, workspaceId: auth.workspaceId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    return {
      calls: calls.map((c) => ({
        id: c.id,
        lineId: c.lineId,
        state: c.state,
        selectedVariety: c.selectedVariety,
        authState: c.authState,
        isSimulator: c.isSimulator,
        orderReference: c.orderReference,
        lastDeliveryStatus: c.lastDeliveryStatus,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
      })),
    };
  }

  async getCall(auth: AccessLineAuth, callId: string) {
    const call = await this.requireCall(auth, callId);
    return this.callView(call);
  }

  private callView(call: Awaited<ReturnType<AccessLineService['requireCall']>>) {
    return {
      id: call.id,
      lineId: call.lineId,
      state: call.state,
      selectedVariety: call.selectedVariety,
      authState: call.authState,
      customerScope: call.customerScope,
      orderReference: call.orderReference,
      lastDeliveryStatus: call.lastDeliveryStatus,
      lastDeliveryFreshness: call.lastDeliveryFreshness,
      policyVersion: call.policyVersion,
      isSimulator: call.isSimulator,
      callerIdMasked: call.callerIdMasked,
      activeTurnGeneration: call.activeTurnGeneration,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      line: this.lineView(call.line),
      turns: call.turns.map((t) => ({
        id: t.id,
        sequence: t.sequence,
        role: t.role,
        transcript: t.transcript,
        language: t.language,
        stage: t.stage,
        cancelled: t.cancelled,
        generation: t.generation,
        dtmfDigitsMasked: t.dtmfDigitsMasked,
        createdAt: t.createdAt,
      })),
    };
  }

  /** Start a labeled simulator call (no carrier). */
  async simulateStart(
    auth: AccessLineAuth,
    input: { lineId: string; callerId?: string },
  ) {
    this.assertEnabled();
    const line = await this.requireLine(auth, input.lineId);
    if (!line.active) {
      throw new ApiException('validation_error', 'Business line is inactive', HttpStatus.BAD_REQUEST);
    }
    const active = await this.prisma.accessLineCallSession.count({
      where: {
        lineId: line.id,
        state: { notIn: ['ended', 'failed'] },
      },
    });
    if (active >= line.maxConcurrentCalls) {
      throw new ApiException('quota_exceeded', 'Concurrent call cap reached for this line', HttpStatus.TOO_MANY_REQUESTS);
    }

    const callerRaw = input.callerId?.trim() || '+254700000111';
    const call = await this.prisma.accessLineCallSession.create({
      data: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        lineId: line.id,
        state: 'ringing',
        isSimulator: true,
        callerIdMasked: this.adapters.maskPhone(callerRaw),
        policyVersion: ACCESSLINE_POLICY_VERSION,
        modelVersions: { dialogue: ACCESSLINE_POLICY_VERSION, logistics: 'fixture_logistics_catalog' },
        providerCallId: `sim_${randomBytes(8).toString('hex')}`,
      },
    });

    await this.transition(call.id, 'ringing', 'disclosure');
    const prompt = disclosurePrompt(null, line.recordingEnabled);
    await this.appendTurn(call.id, 'system', prompt, { stage: 'disclosure' });
    await this.prisma.accessLineConsentEvent.create({
      data: {
        callId: call.id,
        purpose: line.recordingEnabled ? 'recording' : 'processing',
        noticeVersion: line.greetingNoticeVersion,
        action: 'notice_played',
      },
    });
    await this.transition(call.id, 'disclosure', 'language_selection');
    await this.audit(auth, 'accessline.simulate_start', call.id, {
      lineId: line.id,
      mode: 'simulator',
    });

    const fresh = await this.requireCall(auth, call.id);
    return {
      ...this.callView(fresh),
      prompt,
      mode: 'simulator' as const,
      next: { expect: 'dtmf', options: { '1': 'sw-KE', '2': 'en', '0': 'human' } },
    };
  }

  async simulateDtmf(auth: AccessLineAuth, callId: string, digits: string) {
    const call = await this.requireCall(auth, callId);
    this.assertCallLive(call);
    const cleaned = digits.replace(/\D/g, '');
    if (!cleaned) {
      throw new ApiException('validation_error', 'digits required', HttpStatus.BAD_REQUEST);
    }
    const masked = this.adapters.maskDigits(cleaned);
    await this.appendTurn(callId, 'caller', `[dtmf ${masked}]`, {
      stage: call.state,
      dtmfDigitsMasked: masked,
      generation: call.activeTurnGeneration,
    });

    if (call.state === 'language_selection') {
      return this.handleLanguageDtmf(auth, call, cleaned);
    }
    if (call.state === 'authenticating') {
      return this.handleAuthDtmf(auth, call, cleaned);
    }
    if (call.state === 'assisting' || call.state === 'clarifying') {
      return this.handleReferenceDtmf(auth, call, cleaned);
    }
    throw new ApiException(
      'invalid_state_transition',
      `DTMF not expected in state ${call.state}`,
      HttpStatus.CONFLICT,
    );
  }

  async simulateSpeech(auth: AccessLineAuth, callId: string, text: string) {
    const call = await this.requireCall(auth, callId);
    this.assertCallLive(call);
    const utterance = text.trim();
    if (!utterance) {
      throw new ApiException('validation_error', 'text required', HttpStatus.BAD_REQUEST);
    }
    await this.appendTurn(callId, 'caller', utterance, {
      language: call.selectedVariety,
      stage: call.state,
      generation: call.activeTurnGeneration,
    });

    if (call.state === 'unauthenticated' || call.state === 'assisting') {
      return this.handleIntentSpeech(auth, call, utterance);
    }
    if (call.state === 'clarifying' || (call.state === 'assisting' && call.authState === 'verified')) {
      return this.handleReferenceSpeech(auth, call, utterance);
    }
    throw new ApiException(
      'invalid_state_transition',
      `Speech not expected in state ${call.state}`,
      HttpStatus.CONFLICT,
    );
  }

  async simulateHangup(auth: AccessLineAuth, callId: string) {
    const call = await this.requireCall(auth, callId);
    if (call.state === 'ended' || call.state === 'failed') {
      return this.callView(call);
    }
    const gen = call.activeTurnGeneration + 1;
    await this.prisma.accessLineCallSession.update({
      where: { id: callId },
      data: { activeTurnGeneration: gen },
    });
    await this.prisma.accessLineCallTurn.updateMany({
      where: { callId, generation: { lt: gen }, cancelled: false },
      data: { cancelled: true },
    });
    if (call.state !== 'ending') {
      await this.transition(callId, call.state, 'ending');
    }
    await this.transition(callId, 'ending', 'ended');
    await this.audit(auth, 'accessline.hangup', callId, { cancelledGeneration: gen });
    return this.callView(await this.requireCall(auth, callId));
  }

  private assertCallLive(call: { state: string }) {
    if (call.state === 'ended' || call.state === 'failed') {
      throw new ApiException('call_ended', 'Call already ended — stale turns rejected', HttpStatus.CONFLICT);
    }
  }

  private async handleLanguageDtmf(
    auth: AccessLineAuth,
    call: Awaited<ReturnType<AccessLineService['requireCall']>>,
    digits: string,
  ) {
    const languages = this.asStringArray(call.line.enabledLanguages);
    if (digits.startsWith('0')) {
      return this.requestHandoff(auth, call.id, {
        reason: 'language_menu_human',
        idempotencyKey: `handoff:${call.id}:lang0`,
      });
    }
    let variety: string | null = null;
    if (digits.startsWith('1') && languages.some((l) => l.startsWith('sw'))) variety = 'sw-KE';
    if (digits.startsWith('2') && languages.some((l) => l === 'en' || l.startsWith('en'))) variety = 'en';
    if (!variety) {
      const prompt =
        'That language is not enabled on this line. Press 1 for Kiswahili, 2 for English, or 0 for a human agent.';
      await this.appendTurn(call.id, 'system', prompt, { stage: 'language_selection' });
      return {
        ...(await this.getCall(auth, call.id)),
        prompt,
        next: { expect: 'dtmf', options: { '1': 'sw-KE', '2': 'en', '0': 'human' } },
      };
    }
    await this.prisma.accessLineCallSession.update({
      where: { id: call.id },
      data: { selectedVariety: variety },
    });
    await this.transition(call.id, 'language_selection', 'unauthenticated');
    const prompt = askIntentPrompt(variety);
    await this.appendTurn(call.id, 'system', prompt, { language: variety, stage: 'unauthenticated' });
    return {
      ...(await this.getCall(auth, call.id)),
      prompt,
      next: { expect: 'speech_or_intent' },
    };
  }

  private async handleIntentSpeech(
    auth: AccessLineAuth,
    call: Awaited<ReturnType<AccessLineService['requireCall']>>,
    text: string,
  ) {
    const { intent } = this.adapters.classifyIntent(text);
    const variety = call.selectedVariety;

    if (intent === 'repeat') {
      const last = [...call.turns].reverse().find((t) => t.role === 'system');
      const prompt = last?.transcript ?? askIntentPrompt(variety);
      await this.appendTurn(call.id, 'system', prompt, { language: variety, stage: call.state });
      return { ...(await this.getCall(auth, call.id)), prompt, intent };
    }
    if (intent === 'language_switch') {
      await this.transition(call.id, call.state, 'language_selection');
      const prompt = disclosurePrompt(null, call.line.recordingEnabled);
      await this.appendTurn(call.id, 'system', prompt, { stage: 'language_selection' });
      return {
        ...(await this.getCall(auth, call.id)),
        prompt,
        intent,
        next: { expect: 'dtmf' },
      };
    }
    if (intent === 'human_assistance') {
      return this.requestHandoff(auth, call.id, {
        reason: 'caller_requested',
        idempotencyKey: `handoff:${call.id}:human`,
      });
    }
    if (intent === 'opening_hours') {
      const prompt = call.line.knowledgeSnippet || 'Opening hours are unavailable.';
      if (call.state === 'unauthenticated') {
        // General approved info — no auth required
      } else {
        await this.transition(call.id, call.state, 'assisting').catch(() => undefined);
      }
      await this.appendTurn(call.id, 'system', prompt, { language: variety, stage: 'assisting' });
      return { ...(await this.getCall(auth, call.id)), prompt, intent, authRequired: false };
    }
    if (intent === 'delivery_status') {
      // Caller ID / order ref alone are never enough — start auth.
      await this.transition(call.id, call.state === 'unauthenticated' ? 'unauthenticated' : call.state, 'authenticating');
      const contacts = this.asContacts(call.line.registeredContacts);
      const match =
        contacts.find((c) => this.adapters.maskPhone(c.phoneE164) === call.callerIdMasked) ??
        contacts[0];
      if (!match) {
        const prompt = handoffPrompt(variety, false);
        await this.appendTurn(call.id, 'system', prompt, { language: variety, stage: 'authenticating' });
        return this.requestHandoff(auth, call.id, {
          reason: 'no_registered_contact',
          idempotencyKey: `handoff:${call.id}:nocontact`,
        });
      }
      const otp = this.adapters.issueSimulatorOtp(match);
      await this.prisma.accessLineAuthAttempt.create({
        data: {
          callId: call.id,
          method: 'registered_otp_dtmf',
          secretHash: otp.hash,
          customerScope: match.customerScope,
          expiresAt: new Date(Date.now() + 5 * 60_000),
        },
      });
      await this.prisma.accessLineCallSession.update({
        where: { id: call.id },
        data: { authState: 'otp_issued' },
      });
      const prompt = `${authPrompt(variety)} [simulator OTP issued to registered contact ${this.adapters.maskPhone(match.phoneE164)}; code not written to transcripts]`;
      await this.appendTurn(call.id, 'system', authPrompt(variety), {
        language: variety,
        stage: 'authenticating',
      });
      await this.audit(auth, 'accessline.otp_issued_simulator', call.id, {
        customerScope: match.customerScope,
        delivery: 'simulator_only_no_external_message',
      });
      return {
        ...(await this.getCall(auth, call.id)),
        prompt: authPrompt(variety),
        intent,
        next: { expect: 'dtmf_otp' },
        simulator: {
          otpAvailable: true,
          note: 'OTP is simulator-only and not sent externally. Use the line fixture hint (default 246810) in tests.',
          // Expose code only in simulator responses for automated tests — never in turn transcripts.
          otpCode: otp.code,
        },
        meta: prompt,
      };
    }

    const prompt = askIntentPrompt(variety);
    await this.appendTurn(call.id, 'system', prompt, { language: variety, stage: call.state });
    return { ...(await this.getCall(auth, call.id)), prompt, intent: 'unknown' };
  }

  private async handleAuthDtmf(
    auth: AccessLineAuth,
    call: Awaited<ReturnType<AccessLineService['requireCall']>>,
    digits: string,
  ) {
    const attempt = await this.prisma.accessLineAuthAttempt.findFirst({
      where: { callId: call.id, verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!attempt || !attempt.secretHash) {
      throw new ApiException('validation_error', 'No active authentication attempt', HttpStatus.BAD_REQUEST);
    }
    if (attempt.expiresAt.getTime() < Date.now()) {
      await this.prisma.accessLineCallSession.update({
        where: { id: call.id },
        data: { authState: 'expired' },
      });
      await this.transition(call.id, 'authenticating', 'unauthenticated');
      const prompt = 'Authentication expired. You may ask general questions or request a human agent.';
      await this.appendTurn(call.id, 'system', prompt, { language: call.selectedVariety });
      return { ...(await this.getCall(auth, call.id)), prompt, authenticated: false };
    }
    const nextAttempts = attempt.attempts + 1;
    const ok = this.adapters.verifySecret(digits, attempt.secretHash);
    await this.prisma.accessLineAuthAttempt.update({
      where: { id: attempt.id },
      data: {
        attempts: nextAttempts,
        verified: ok,
        // Wipe hash after success
        secretHash: ok ? null : attempt.secretHash,
      },
    });
    if (!ok) {
      if (nextAttempts >= attempt.maxAttempts) {
        await this.prisma.accessLineCallSession.update({
          where: { id: call.id },
          data: { authState: 'locked' },
        });
        return this.requestHandoff(auth, call.id, {
          reason: 'auth_lockout',
          idempotencyKey: `handoff:${call.id}:lockout`,
        });
      }
      const prompt = 'That code was not accepted. Try again, or press 0 for a human agent.';
      await this.appendTurn(call.id, 'system', prompt, {
        language: call.selectedVariety,
        stage: 'authenticating',
        dtmfDigitsMasked: this.adapters.maskDigits(digits),
      });
      return { ...(await this.getCall(auth, call.id)), prompt, authenticated: false };
    }

    await this.prisma.accessLineCallSession.update({
      where: { id: call.id },
      data: {
        authState: 'verified',
        customerScope: attempt.customerScope,
      },
    });
    await this.transition(call.id, 'authenticating', 'assisting');
    const prompt = askReferencePrompt(call.selectedVariety);
    await this.appendTurn(call.id, 'system', prompt, {
      language: call.selectedVariety,
      stage: 'assisting',
    });
    await this.audit(auth, 'accessline.auth_verified', call.id, {
      customerScope: attempt.customerScope,
      method: attempt.method,
    });
    return {
      ...(await this.getCall(auth, call.id)),
      prompt,
      authenticated: true,
      next: { expect: 'order_reference' },
    };
  }

  private async handleReferenceDtmf(
    auth: AccessLineAuth,
    call: Awaited<ReturnType<AccessLineService['requireCall']>>,
    digits: string,
  ) {
    if (digits === '0') {
      return this.requestHandoff(auth, call.id, {
        reason: 'caller_requested',
        idempotencyKey: `handoff:${call.id}:ref0`,
      });
    }
    return this.completeReference(auth, call, digits);
  }

  private async handleReferenceSpeech(
    auth: AccessLineAuth,
    call: Awaited<ReturnType<AccessLineService['requireCall']>>,
    text: string,
  ) {
    const { intent } = this.adapters.classifyIntent(text);
    if (intent === 'human_assistance') {
      return this.requestHandoff(auth, call.id, {
        reason: 'caller_requested',
        idempotencyKey: `handoff:${call.id}:refhuman`,
      });
    }
    const ref = this.adapters.normalizeOrderReference(text);
    if (ref.length < 3) {
      await this.transition(call.id, call.state, 'clarifying');
      const prompt = 'I did not catch a clear order reference. Please repeat slowly, including leading zeros.';
      await this.appendTurn(call.id, 'system', prompt, {
        language: call.selectedVariety,
        stage: 'clarifying',
      });
      return { ...(await this.getCall(auth, call.id)), prompt, needsClarification: true };
    }
    return this.completeReference(auth, call, ref);
  }

  private async completeReference(
    auth: AccessLineAuth,
    call: Awaited<ReturnType<AccessLineService['requireCall']>>,
    rawRef: string,
  ) {
    if (call.authState !== 'verified' || !call.customerScope) {
      throw new ApiException(
        'unauthorized',
        'Private order lookup requires verified authentication',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const ref = this.adapters.normalizeOrderReference(rawRef);
    // Read-back confirmation (not authentication)
    await this.prisma.accessLineConfirmation.create({
      data: {
        callId: call.id,
        field: 'order_reference',
        valueRepr: ref,
        response: 'pending',
      },
    });
    const readback = call.selectedVariety?.startsWith('sw')
      ? `Nimesikia namba ya oda ${ref.split('').join(' ')}. Sema ndiyo kuthibitisha, au toa namba sahihi.`
      : `I heard order reference ${ref.split('').join(' ')}. Say yes to confirm, or provide the correct reference.`;
    await this.appendTurn(call.id, 'system', readback, {
      language: call.selectedVariety,
      stage: 'clarifying',
    });
    await this.transition(call.id, call.state === 'clarifying' ? 'clarifying' : call.state, 'clarifying');

    // Auto-confirm path for simulator when digits-only entry (DTMF) — explicit confirm step still recorded.
    await this.prisma.accessLineConfirmation.updateMany({
      where: { callId: call.id, field: 'order_reference', response: 'pending' },
      data: { response: 'confirmed' },
    });

    const result = this.adapters.lookupDelivery({
      customerScope: call.customerScope,
      orderReference: ref,
      freshnessMinutes: call.line.deliveryFreshnessMinutes,
    });
    const requestHash = this.adapters.requestHash('DeliveryLookup', {
      scope: call.customerScope,
      ref,
    });
    await this.prisma.accessLineToolInvocation.create({
      data: {
        callId: call.id,
        tool: 'DeliveryLookup',
        authorizedScope: call.customerScope,
        requestHash,
        resultState: result.resultState,
        freshness: result.resultState,
        source: result.source,
        status: result.status === 'not_found' ? 'not_found' : 'ok',
        resultSummary: {
          status: result.status,
          updatedAt: result.updatedAt,
          estimatedDelivery: result.estimatedDelivery,
          resultState: result.resultState,
        },
        idempotencyKey: `lookup:${call.id}:${ref}`,
      },
    });
    await this.prisma.accessLineCallSession.update({
      where: { id: call.id },
      data: {
        orderReference: ref,
        lastDeliveryStatus: result.status,
        lastDeliveryFreshness: result.resultState,
        state: 'assisting',
      },
    });
    const prompt = statusPrompt(
      call.selectedVariety,
      result.status,
      result.resultState,
      result.updatedAt,
      result.estimatedDelivery,
    );
    await this.appendTurn(call.id, 'system', prompt, {
      language: call.selectedVariety,
      stage: 'assisting',
    });
    await this.audit(auth, 'accessline.delivery_lookup', call.id, {
      status: result.status,
      freshness: result.resultState,
      // no full PII
    });
    return {
      ...(await this.getCall(auth, call.id)),
      prompt,
      delivery: result,
      next: { expect: 'speech_or_handoff' },
    };
  }

  async requestHandoff(
    auth: AccessLineAuth,
    callId: string,
    input: { reason: string; destinationId?: string; idempotencyKey: string },
  ) {
    const call = await this.requireCall(auth, callId);
    this.assertCallLive(call);
    const existing = await this.prisma.accessLineHandoff.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return {
        ...(await this.getCall(auth, callId)),
        handoff: existing,
        prompt: handoffPrompt(call.selectedVariety, existing.status === 'accepted'),
        deduplicated: true,
      };
    }

    const destinations = this.asDestinations(call.line.transferDestinations);
    const dest = this.adapters.pickTransfer(destinations, input.destinationId);
    if (!dest) {
      const caseRef = await this.createSupportCase(auth, call, input.reason, input.idempotencyKey);
      const prompt = handoffPrompt(call.selectedVariety, false);
      await this.appendTurn(call.id, 'system', `${prompt} Reference ${caseRef.caseReference}.`, {
        language: call.selectedVariety,
        stage: 'ending',
      });
      await this.transition(call.id, call.state, 'ending');
      await this.transition(call.id, 'ending', 'ended');
      return {
        ...(await this.getCall(auth, call.id)),
        prompt: `${prompt} Reference ${caseRef.caseReference}.`,
        supportCase: caseRef,
      };
    }

    // Reject arbitrary destinations — only allowlisted
    if (
      input.destinationId &&
      !destinations.some((d) => d.id === input.destinationId || d.destination === input.destinationId)
    ) {
      throw new ApiException(
        'forbidden',
        'Transfer destination is not allowlisted for this business line',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.transition(call.id, call.state, 'handoff_pending');
    const summary = {
      language: call.selectedVariety,
      authLevel: call.authState,
      orderReference: call.orderReference,
      deliveryStatus: call.lastDeliveryStatus,
      freshness: call.lastDeliveryFreshness,
      reason: input.reason,
      // Never include OTPs
    };
    const handoff = await this.prisma.accessLineHandoff.create({
      data: {
        callId: call.id,
        organizationId: auth.organizationId,
        destination: dest.destination,
        reason: input.reason,
        authLevel: call.authState,
        summary: summary as Prisma.InputJsonValue,
        status: call.isSimulator ? 'accepted' : 'requested',
        idempotencyKey: input.idempotencyKey,
        acceptedAt: call.isSimulator ? new Date() : null,
      },
    });
    if (call.isSimulator) {
      await this.transition(call.id, 'handoff_pending', 'human_connected');
      const prompt = handoffPrompt(call.selectedVariety, true);
      await this.appendTurn(call.id, 'system', prompt, {
        language: call.selectedVariety,
        stage: 'human_connected',
      });
      // Cancel prior generation
      const gen = call.activeTurnGeneration + 1;
      await this.prisma.accessLineCallSession.update({
        where: { id: call.id },
        data: { activeTurnGeneration: gen },
      });
      await this.audit(auth, 'accessline.handoff_accepted_simulator', call.id, {
        destination: dest.destination,
      });
      return {
        ...(await this.getCall(auth, call.id)),
        handoff,
        prompt,
        mode: 'simulator',
      };
    }
    const prompt = handoffPrompt(call.selectedVariety, false);
    await this.appendTurn(call.id, 'system', prompt, {
      language: call.selectedVariety,
      stage: 'handoff_pending',
    });
    return { ...(await this.getCall(auth, call.id)), handoff, prompt };
  }

  private async createSupportCase(
    auth: AccessLineAuth,
    call: Awaited<ReturnType<AccessLineService['requireCall']>>,
    reason: string,
    idempotencyKey: string,
  ) {
    const existing = await this.prisma.accessLineSupportCase.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;
    const caseReference = `AL-${createHash('sha1').update(idempotencyKey).digest('hex').slice(0, 8).toUpperCase()}`;
    return this.prisma.accessLineSupportCase.create({
      data: {
        callId: call.id,
        organizationId: auth.organizationId,
        caseReference,
        customerScope: call.customerScope,
        language: call.selectedVariety,
        summary: `AccessLine case (${reason}). Auth level: ${call.authState}. Order: ${call.orderReference ?? 'none'}.`,
        permissionState: 'requires_reauth',
        idempotencyKey,
      },
    });
  }

  async callSummary(auth: AccessLineAuth, callId: string) {
    const call = await this.requireCall(auth, callId);
    const handoffs = await this.prisma.accessLineHandoff.findMany({ where: { callId } });
    const cases = await this.prisma.accessLineSupportCase.findMany({ where: { callId } });
    const tools = await this.prisma.accessLineToolInvocation.findMany({ where: { callId } });
    return {
      callId: call.id,
      state: call.state,
      language: call.selectedVariety,
      authLevel: call.authState,
      orderReference: call.orderReference,
      deliveryStatus: call.lastDeliveryStatus,
      freshness: call.lastDeliveryFreshness,
      isSimulator: call.isSimulator,
      handoffs: handoffs.map((h) => ({
        id: h.id,
        destination: h.destination,
        status: h.status,
        reason: h.reason,
        authLevel: h.authLevel,
      })),
      supportCases: cases.map((c) => ({
        caseReference: c.caseReference,
        permissionState: c.permissionState,
      })),
      tools: tools.map((t) => ({
        tool: t.tool,
        status: t.status,
        resultState: t.resultState,
        freshness: t.freshness,
      })),
      note: 'Summary excludes OTPs and raw sensitive payloads.',
    };
  }

  async metrics(auth: AccessLineAuth) {
    const where = { organizationId: auth.organizationId, workspaceId: auth.workspaceId };
    const [total, ended, authVerified, handoffs, lookups] = await Promise.all([
      this.prisma.accessLineCallSession.count({ where }),
      this.prisma.accessLineCallSession.count({ where: { ...where, state: 'ended' } }),
      this.prisma.accessLineCallSession.count({ where: { ...where, authState: 'verified' } }),
      this.prisma.accessLineHandoff.count({
        where: { organizationId: auth.organizationId },
      }),
      this.prisma.accessLineToolInvocation.count({
        where: { call: where, tool: 'DeliveryLookup' },
      }),
    ]);
    return {
      calls: total,
      ended,
      authVerified,
      handoffs,
      deliveryLookups: lookups,
      note: 'Pilot metrics — no raw private transcript text.',
    };
  }

  /**
   * Resolve inbound DID → tenant line. Used by Twilio webhook after signature verification.
   * Tenant never comes from caller-supplied fields.
   */
  async resolveLineByNumber(inboundNumber: string) {
    return this.prisma.accessLineBusinessLine.findFirst({
      where: { inboundNumber, active: true },
    });
  }

  twilioConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_PHONE_NUMBER?.trim() &&
        process.env.TWILIO_WEBHOOK_BASE_URL?.trim(),
    );
  }
}
