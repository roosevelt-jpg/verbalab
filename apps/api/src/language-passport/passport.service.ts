import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { languagePassportCatalog } from './passport.catalog';
import {
  isKnownVariety,
  isKnownVoiceId,
  passportModelSyncSummary,
} from './passport.model-sync';
import { decimalSafeQuantity, entryKeyFor, normalizeSourceForm } from './passport.normalize';
import { hashSnapshotPayload, resolvePassportPlan, type ResolvableEntry } from './passport.resolver';
import {
  PASSPORT_ENTRY_TYPES,
  PASSPORT_RESOLVER_VERSION,
  PASSPORT_SCHEMA_VERSION,
  type ApprovedMeaning,
  type ContextScope,
  type PassportActor,
  type PassportEntryType,
  type ResolveRequest,
} from './passport.types';

const MAX_ENTRIES = 2000;
const MAX_IMPORT_BYTES = 512_000;
const MAX_IMPORT_ENTRIES = 500;

@Injectable()
export class LanguagePassportService {
  constructor(private readonly prisma: PrismaService) {}

  catalog() {
    return languagePassportCatalog();
  }

  modelSync() {
    return passportModelSyncSummary();
  }

  async getOrCreate(actor: PassportActor) {
    const existing = await this.prisma.languagePassport.findUnique({
      where: {
        organizationId_ownerUserId: {
          organizationId: actor.organizationId,
          ownerUserId: actor.userId,
        },
      },
      include: {
        entries: {
          where: { deletedAt: null },
          include: {
            revisions: { orderBy: { revision: 'desc' }, take: 1 },
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        },
        grants: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (existing && !existing.deletedAt) {
      return this.serializePassport(existing);
    }

    const created = await this.prisma.languagePassport.create({
      data: {
        organizationId: actor.organizationId,
        workspaceId: actor.workspaceId,
        ownerUserId: actor.userId,
        state: 'active',
        personalizationEnabled: true,
        preferredVarieties: [],
        preferredVoiceIds: [],
      },
      include: { entries: true, grants: true },
    });
    await this.audit(actor, created.id, 'passport.created', {});
    return this.serializePassport(created);
  }

  async patchPreferences(
    actor: PassportActor,
    patch: {
      personalizationEnabled?: boolean;
      preferredVarieties?: string[];
      preferredVoiceIds?: string[];
      retentionDays?: number;
      trainingConsent?: boolean;
      expectedPreferencesRevision?: number;
    },
  ) {
    const passport = await this.requirePassport(actor);
    if (
      patch.expectedPreferencesRevision != null &&
      patch.expectedPreferencesRevision !== passport.preferencesRevision
    ) {
      throw new ApiException(
        'revision_conflict',
        'Preferences revision mismatch — reload and retry',
        HttpStatus.CONFLICT,
      );
    }

    const varieties = patch.preferredVarieties?.map((v) => v.trim()).filter(Boolean);
    if (varieties) {
      for (const v of varieties) {
        if (!isKnownVariety(v)) {
          throw new ApiException(
            'unsupported_variety',
            `Variety “${v}” is not in the Accent Identity / speechVariety catalog`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
    const voices = patch.preferredVoiceIds?.map((v) => v.trim()).filter(Boolean);
    if (voices) {
      for (const v of voices) {
        if (!isKnownVoiceId(v)) {
          throw new ApiException(
            'unsupported_voice',
            `Voice “${v}” is not in the OWN TTS registry`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    const updated = await this.prisma.languagePassport.update({
      where: { id: passport.id },
      data: {
        ...(patch.personalizationEnabled !== undefined
          ? {
              personalizationEnabled: patch.personalizationEnabled,
              state: patch.personalizationEnabled ? 'active' : 'paused',
            }
          : {}),
        ...(varieties ? { preferredVarieties: varieties } : {}),
        ...(voices ? { preferredVoiceIds: voices } : {}),
        ...(patch.retentionDays !== undefined ? { retentionDays: patch.retentionDays } : {}),
        ...(patch.trainingConsent !== undefined ? { trainingConsent: patch.trainingConsent } : {}),
        preferencesRevision: { increment: 1 },
      },
      include: {
        entries: {
          where: { deletedAt: null },
          include: { revisions: { orderBy: { revision: 'desc' }, take: 1 } },
          take: 100,
        },
        grants: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, take: 50 },
      },
    });
    await this.audit(actor, passport.id, 'passport.preferences_updated', {
      preferencesRevision: updated.preferencesRevision,
    });
    return this.serializePassport(updated);
  }

  async createEntry(
    actor: PassportActor,
    body: {
      type: PassportEntryType;
      sourceForm: string;
      languageVariety: string;
      sourceLang?: string;
      targetLang?: string;
      direction?: string;
      approvedValue: ApprovedMeaning;
      context?: ContextScope;
      examples?: unknown[];
      provenance?: Record<string, unknown>;
      trainingPermission?: boolean;
      /** When true, creates awaiting_user_approval; approval is a separate step. */
      autoApprove?: boolean;
      idempotencyKey?: string;
    },
  ) {
    if (!PASSPORT_ENTRY_TYPES.includes(body.type)) {
      throw new ApiException('validation_error', 'Invalid entry type', HttpStatus.BAD_REQUEST);
    }
    const sourceForm = normalizeSourceForm(body.sourceForm);
    if (!sourceForm) {
      throw new ApiException('validation_error', 'sourceForm is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.languageVariety?.trim()) {
      throw new ApiException('validation_error', 'languageVariety is required', HttpStatus.BAD_REQUEST);
    }
    if (body.languageVariety !== 'any' && !isKnownVariety(body.languageVariety)) {
      throw new ApiException(
        'unsupported_variety',
        `languageVariety “${body.languageVariety}” is not in the Accent Identity catalog`,
        HttpStatus.BAD_REQUEST,
      );
    }
    this.assertApprovedValue(body.type, body.approvedValue);

    const passport = await this.requirePassport(actor);
    const count = await this.prisma.languagePassportEntry.count({
      where: { passportId: passport.id, deletedAt: null },
    });
    if (count >= MAX_ENTRIES) {
      throw new ApiException('quota_exceeded', `Passport entry limit (${MAX_ENTRIES}) reached`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const entryKey = entryKeyFor(body.type, sourceForm, body.languageVariety);
    const existing = await this.prisma.languagePassportEntry.findUnique({
      where: { passportId_entryKey: { passportId: passport.id, entryKey } },
    });
    if (existing && !existing.deletedAt) {
      throw new ApiException(
        'conflict',
        'An entry with this type, variety, and source form already exists — create a revision instead',
        HttpStatus.CONFLICT,
      );
    }

    const approveNow = Boolean(body.autoApprove);
    const entry = await this.prisma.$transaction(async (tx) => {
      const row = existing
        ? await tx.languagePassportEntry.update({
            where: { id: existing.id },
            data: {
              deletedAt: null,
              status: approveNow ? 'approved' : 'awaiting_user_approval',
              currentRevision: 1,
              type: body.type,
            },
          })
        : await tx.languagePassportEntry.create({
            data: {
              passportId: passport.id,
              entryKey,
              type: body.type,
              status: approveNow ? 'approved' : 'awaiting_user_approval',
              currentRevision: 1,
            },
          });

      await tx.languagePassportEntryRevision.create({
        data: {
          entryId: row.id,
          revision: 1,
          sourceForm,
          languageVariety: body.languageVariety.trim(),
          sourceLang: body.sourceLang?.trim() || null,
          targetLang: body.targetLang?.trim() || null,
          direction: body.direction ?? 'bidirectional',
          approvedValue: body.approvedValue as Prisma.InputJsonValue,
          context: (body.context ?? {}) as Prisma.InputJsonValue,
          examples: (body.examples ?? []) as Prisma.InputJsonValue,
          provenance: {
            ...(body.provenance ?? {}),
            idempotencyKey: body.idempotencyKey ?? null,
            createdBy: actor.userId,
          } as Prisma.InputJsonValue,
          trainingPermission: Boolean(body.trainingPermission),
          approvedAt: approveNow ? new Date() : null,
          approvedById: approveNow ? actor.userId : null,
        },
      });
      return row;
    });

    await this.audit(actor, passport.id, 'passport.entry_created', {
      entryId: entry.id,
      type: body.type,
      status: entry.status,
    });

    if (approveNow) {
      await this.syncApprovedEntryToWorkspace(actor, entry.id);
    }

    return this.getEntry(actor, entry.id);
  }

  async createRevision(
    actor: PassportActor,
    entryId: string,
    body: {
      sourceForm?: string;
      languageVariety?: string;
      sourceLang?: string;
      targetLang?: string;
      direction?: string;
      approvedValue: ApprovedMeaning;
      context?: ContextScope;
      examples?: unknown[];
      provenance?: Record<string, unknown>;
      trainingPermission?: boolean;
      expectedRevision?: number;
      autoApprove?: boolean;
    },
  ) {
    const passport = await this.requirePassport(actor);
    const entry = await this.prisma.languagePassportEntry.findFirst({
      where: { id: entryId, passportId: passport.id, deletedAt: null },
    });
    if (!entry) throw new ApiException('not_found', 'Entry not found', HttpStatus.NOT_FOUND);
    if (body.expectedRevision != null && body.expectedRevision !== entry.currentRevision) {
      throw new ApiException('revision_conflict', 'Entry revision mismatch', HttpStatus.CONFLICT);
    }
    this.assertApprovedValue(entry.type as PassportEntryType, body.approvedValue);

    const latest = await this.prisma.languagePassportEntryRevision.findFirst({
      where: { entryId: entry.id },
      orderBy: { revision: 'desc' },
    });
    const nextRev = (latest?.revision ?? 0) + 1;
    const sourceForm = normalizeSourceForm(body.sourceForm ?? latest?.sourceForm ?? '');
    const languageVariety = (body.languageVariety ?? latest?.languageVariety ?? 'any').trim();
    if (languageVariety !== 'any' && !isKnownVariety(languageVariety)) {
      throw new ApiException('unsupported_variety', `Unknown languageVariety “${languageVariety}”`, HttpStatus.BAD_REQUEST);
    }

    const approveNow = Boolean(body.autoApprove);
    await this.prisma.$transaction(async (tx) => {
      await tx.languagePassportEntryRevision.create({
        data: {
          entryId: entry.id,
          revision: nextRev,
          sourceForm,
          languageVariety,
          sourceLang: body.sourceLang ?? latest?.sourceLang ?? null,
          targetLang: body.targetLang ?? latest?.targetLang ?? null,
          direction: body.direction ?? latest?.direction ?? 'bidirectional',
          approvedValue: body.approvedValue as Prisma.InputJsonValue,
          context: (body.context ?? (latest?.context as object) ?? {}) as Prisma.InputJsonValue,
          examples: (body.examples ?? (latest?.examples as unknown[]) ?? []) as Prisma.InputJsonValue,
          provenance: {
            ...(body.provenance ?? {}),
            priorRevision: latest?.revision ?? 0,
            createdBy: actor.userId,
          } as Prisma.InputJsonValue,
          trainingPermission: body.trainingPermission ?? false,
          approvedAt: approveNow ? new Date() : null,
          approvedById: approveNow ? actor.userId : null,
        },
      });
      await tx.languagePassportEntry.update({
        where: { id: entry.id },
        data: {
          currentRevision: nextRev,
          status: approveNow ? 'approved' : 'awaiting_user_approval',
          entryKey: entryKeyFor(entry.type, sourceForm, languageVariety),
        },
      });
    });

    await this.audit(actor, passport.id, 'passport.entry_revised', { entryId, revision: nextRev });
    if (approveNow) await this.syncApprovedEntryToWorkspace(actor, entryId);
    return this.getEntry(actor, entryId);
  }

  async approveEntry(actor: PassportActor, entryId: string, expectedRevision?: number) {
    const passport = await this.requirePassport(actor);
    const entry = await this.prisma.languagePassportEntry.findFirst({
      where: { id: entryId, passportId: passport.id, deletedAt: null },
      include: { revisions: { orderBy: { revision: 'desc' }, take: 1 } },
    });
    if (!entry) throw new ApiException('not_found', 'Entry not found', HttpStatus.NOT_FOUND);
    if (expectedRevision != null && expectedRevision !== entry.currentRevision) {
      throw new ApiException('revision_conflict', 'Entry revision mismatch', HttpStatus.CONFLICT);
    }
    const rev = entry.revisions[0];
    if (!rev) throw new ApiException('not_found', 'Entry has no revisions', HttpStatus.NOT_FOUND);

    await this.prisma.$transaction(async (tx) => {
      await tx.languagePassportEntryRevision.update({
        where: { id: rev.id },
        data: { approvedAt: new Date(), approvedById: actor.userId },
      });
      await tx.languagePassportEntry.update({
        where: { id: entry.id },
        data: { status: 'approved' },
      });
    });
    await this.audit(actor, passport.id, 'passport.entry_approved', {
      entryId,
      revision: rev.revision,
    });
    await this.syncApprovedEntryToWorkspace(actor, entryId);
    return this.getEntry(actor, entryId);
  }

  async deleteEntry(actor: PassportActor, entryId: string) {
    const passport = await this.requirePassport(actor);
    const entry = await this.prisma.languagePassportEntry.findFirst({
      where: { id: entryId, passportId: passport.id, deletedAt: null },
    });
    if (!entry) throw new ApiException('not_found', 'Entry not found', HttpStatus.NOT_FOUND);
    await this.prisma.languagePassportEntry.update({
      where: { id: entry.id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });
    await this.audit(actor, passport.id, 'passport.entry_deleted', { entryId });
    return { deleted: true, entryId, tombstone: true };
  }

  async getEntry(actor: PassportActor, entryId: string) {
    const passport = await this.requirePassport(actor);
    const entry = await this.prisma.languagePassportEntry.findFirst({
      where: { id: entryId, passportId: passport.id },
      include: { revisions: { orderBy: { revision: 'desc' } } },
    });
    if (!entry || entry.deletedAt) {
      throw new ApiException('not_found', 'Entry not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: entry.id,
      type: entry.type,
      status: entry.status,
      currentRevision: entry.currentRevision,
      entryKey: entry.entryKey,
      revisions: entry.revisions,
    };
  }

  async resolve(actor: PassportActor, req: ResolveRequest) {
    const passport = await this.requirePassport(actor);
    if (req.text && req.text.length > 20_000) {
      throw new ApiException('validation_error', 'text exceeds 20000 characters', HttpStatus.BAD_REQUEST);
    }

    // Caller-ID / anonymous resource paths cannot resolve private passport by phone.
    if (req.grantId) {
      const grant = await this.prisma.languagePassportShareGrant.findFirst({
        where: { id: req.grantId, passportId: passport.id },
      });
      if (!grant || grant.revokedAt || grant.expiresAt.getTime() <= Date.now()) {
        throw new ApiException('grant_invalid', 'Share grant revoked or expired', HttpStatus.FORBIDDEN);
      }
      const products = grant.permittedProducts as string[];
      if (!products.includes(String(req.product))) {
        throw new ApiException('grant_invalid', 'Product not permitted by grant', HttpStatus.FORBIDDEN);
      }
    }

    const entries = await this.loadResolvableEntries(passport.id, req);
    const plan = resolvePassportPlan({
      text: req.text ?? '',
      product: String(req.product),
      sourceLang: req.sourceLang,
      targetLang: req.targetLang,
      languageVariety: req.languageVariety,
      context: req.context,
      personalizationEnabled: passport.personalizationEnabled && passport.state === 'active',
      entries,
      taskOverrides: req.taskOverrides,
    });

    let snapshotId: string | null = null;
    if (req.pinSnapshot && plan.outcome === 'applied') {
      const pins = plan.matched
        .filter((m) => m.entryId !== 'task_override')
        .map((m) => ({ entryId: m.entryId, revision: m.revision }));
      const contentHash = hashSnapshotPayload({
        pins,
        preferencesRevision: passport.preferencesRevision,
        resolverVersion: PASSPORT_RESOLVER_VERSION,
      });
      const snap = await this.prisma.languagePassportSnapshot.create({
        data: {
          passportId: passport.id,
          resolverVersion: PASSPORT_RESOLVER_VERSION,
          purpose: String(req.product),
          entryRevisions: pins,
          preferencesRevision: passport.preferencesRevision,
          contentHash,
        },
      });
      snapshotId = snap.id;
    }

    const resolution = await this.prisma.languagePassportResolution.create({
      data: {
        passportId: passport.id,
        snapshotId,
        product: String(req.product),
        requestKey: req.requestKey ?? createHash('sha256').update(`${req.product}:${req.text}`).digest('hex').slice(0, 32),
        matched: plan.matched as Prisma.InputJsonValue,
        conflicts: plan.conflicts as Prisma.InputJsonValue,
        outcome: plan.outcome,
      },
    });

    return {
      resolutionId: resolution.id,
      snapshotId,
      ...plan,
      preferences: {
        personalizationEnabled: passport.personalizationEnabled,
        preferredVarieties: passport.preferredVarieties,
        preferredVoiceIds: passport.preferredVoiceIds,
        preferencesRevision: passport.preferencesRevision,
      },
    };
  }

  async createGrant(
    actor: PassportActor,
    body: {
      entryIds: string[];
      purpose: string;
      permittedProducts: string[];
      granteeUserId?: string;
      granteeResource?: string;
      ttlHours?: number;
    },
  ) {
    const passport = await this.requirePassport(actor);
    if (!body.entryIds?.length) {
      throw new ApiException('validation_error', 'entryIds required', HttpStatus.BAD_REQUEST);
    }
    if (!body.purpose?.trim()) {
      throw new ApiException('validation_error', 'purpose required', HttpStatus.BAD_REQUEST);
    }
    if (!body.permittedProducts?.length) {
      throw new ApiException('validation_error', 'permittedProducts required', HttpStatus.BAD_REQUEST);
    }
    const ttlHours = Math.min(Math.max(body.ttlHours ?? 24, 1), 90 * 24);
    const entries = await this.prisma.languagePassportEntry.findMany({
      where: { passportId: passport.id, id: { in: body.entryIds }, deletedAt: null, status: 'approved' },
    });
    if (entries.length !== body.entryIds.length) {
      throw new ApiException('validation_error', 'All entryIds must be approved owner entries', HttpStatus.BAD_REQUEST);
    }

    const grant = await this.prisma.languagePassportShareGrant.create({
      data: {
        passportId: passport.id,
        granteeUserId: body.granteeUserId ?? null,
        granteeResource: body.granteeResource ?? null,
        purpose: body.purpose.trim(),
        permittedProducts: body.permittedProducts,
        entryIds: body.entryIds,
        expiresAt: new Date(Date.now() + ttlHours * 3600_000),
      },
    });
    await this.audit(actor, passport.id, 'passport.grant_created', { grantId: grant.id });
    return grant;
  }

  async revokeGrant(actor: PassportActor, grantId: string) {
    const passport = await this.requirePassport(actor);
    const grant = await this.prisma.languagePassportShareGrant.findFirst({
      where: { id: grantId, passportId: passport.id },
    });
    if (!grant) throw new ApiException('not_found', 'Grant not found', HttpStatus.NOT_FOUND);
    const updated = await this.prisma.languagePassportShareGrant.update({
      where: { id: grant.id },
      data: { revokedAt: new Date(), revision: { increment: 1 } },
    });
    await this.audit(actor, passport.id, 'passport.grant_revoked', { grantId });
    return updated;
  }

  async exportPassport(actor: PassportActor, entryIds?: string[]) {
    const passport = await this.requirePassport(actor);
    const entries = await this.prisma.languagePassportEntry.findMany({
      where: {
        passportId: passport.id,
        deletedAt: null,
        status: 'approved',
        ...(entryIds?.length ? { id: { in: entryIds } } : {}),
      },
      include: {
        revisions: {
          where: { approvedAt: { not: null } },
          orderBy: { revision: 'desc' },
          take: 1,
        },
      },
    });

    const payload = {
      schemaVersion: PASSPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      preferences: {
        preferredVarieties: passport.preferredVarieties,
        preferredVoiceIds: passport.preferredVoiceIds,
        personalizationEnabled: passport.personalizationEnabled,
        trainingConsent: false, // never export training as granted elsewhere
      },
      entries: entries.map((e) => {
        const rev = e.revisions[0]!;
        return {
          type: e.type,
          sourceForm: rev.sourceForm,
          languageVariety: rev.languageVariety,
          sourceLang: rev.sourceLang,
          targetLang: rev.targetLang,
          direction: rev.direction,
          approvedValue: rev.approvedValue,
          context: rev.context,
          examples: rev.examples,
          revision: rev.revision,
        };
      }),
    };
    const checksum = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    await this.audit(actor, passport.id, 'passport.exported', { entryCount: entries.length, checksum });
    return { ...payload, checksum };
  }

  async createImportPreview(actor: PassportActor, body: unknown) {
    const passport = await this.requirePassport(actor);
    const raw = JSON.stringify(body ?? {});
    if (raw.length > MAX_IMPORT_BYTES) {
      throw new ApiException('validation_error', 'Import payload too large', HttpStatus.BAD_REQUEST);
    }
    const doc = body as {
      schemaVersion?: string;
      entries?: Array<Record<string, unknown>>;
      preferences?: Record<string, unknown>;
      grants?: unknown;
      checksum?: string;
    };
    if (doc.schemaVersion !== PASSPORT_SCHEMA_VERSION) {
      throw new ApiException(
        'validation_error',
        `Unsupported schemaVersion (expected ${PASSPORT_SCHEMA_VERSION})`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (doc.grants) {
      throw new ApiException(
        'validation_error',
        'Foreign grants cannot be imported — share grants must be created locally',
        HttpStatus.BAD_REQUEST,
      );
    }
    const entries = Array.isArray(doc.entries) ? doc.entries : [];
    if (entries.length > MAX_IMPORT_ENTRIES) {
      throw new ApiException('validation_error', `Too many entries (max ${MAX_IMPORT_ENTRIES})`, HttpStatus.BAD_REQUEST);
    }

    const conflicts: Array<{ index: number; reason: string }> = [];
    const selectedChanges: Array<{ index: number; action: 'create_pending'; type: string; sourceForm: string }> = [];
    entries.forEach((e, index) => {
      const type = String(e.type ?? '');
      const sourceForm = normalizeSourceForm(String(e.sourceForm ?? ''));
      if (!PASSPORT_ENTRY_TYPES.includes(type as PassportEntryType) || !sourceForm) {
        conflicts.push({ index, reason: 'invalid_entry' });
        return;
      }
      if (e.trainingPermission === true) {
        conflicts.push({ index, reason: 'foreign_training_permission_stripped' });
      }
      selectedChanges.push({ index, action: 'create_pending', type, sourceForm });
    });

    const preview = await this.prisma.languagePassportImportPreview.create({
      data: {
        passportId: passport.id,
        schemaVersion: PASSPORT_SCHEMA_VERSION,
        payload: body as Prisma.InputJsonValue,
        conflicts,
        selectedChanges,
        status: 'pending',
      },
    });
    await this.audit(actor, passport.id, 'passport.import_preview', { previewId: preview.id });
    return preview;
  }

  async confirmImport(actor: PassportActor, previewId: string) {
    const passport = await this.requirePassport(actor);
    const preview = await this.prisma.languagePassportImportPreview.findFirst({
      where: { id: previewId, passportId: passport.id, status: 'pending' },
    });
    if (!preview) throw new ApiException('not_found', 'Import preview not found', HttpStatus.NOT_FOUND);

    const payload = preview.payload as {
      entries?: Array<Record<string, unknown>>;
      preferences?: { preferredVarieties?: string[]; preferredVoiceIds?: string[] };
    };
    const created: string[] = [];
    for (const e of payload.entries ?? []) {
      const type = String(e.type) as PassportEntryType;
      if (!PASSPORT_ENTRY_TYPES.includes(type)) continue;
      try {
        const row = await this.createEntry(actor, {
          type,
          sourceForm: String(e.sourceForm ?? ''),
          languageVariety: String(e.languageVariety ?? 'any'),
          sourceLang: e.sourceLang ? String(e.sourceLang) : undefined,
          targetLang: e.targetLang ? String(e.targetLang) : undefined,
          direction: e.direction ? String(e.direction) : undefined,
          approvedValue: (e.approvedValue ?? { kind: 'text', value: '' }) as ApprovedMeaning,
          context: (e.context as ContextScope) ?? {},
          examples: Array.isArray(e.examples) ? e.examples : [],
          trainingPermission: false,
          autoApprove: false,
          provenance: { importedFromPreview: previewId },
        });
        created.push(row.id);
      } catch {
        // skip conflicting keys; they remain in preview conflicts
      }
    }

    if (payload.preferences) {
      try {
        await this.patchPreferences(actor, {
          preferredVarieties: payload.preferences.preferredVarieties,
          preferredVoiceIds: payload.preferences.preferredVoiceIds,
        });
      } catch {
        // preference validation failures do not block pending entry import
      }
    }

    const updated = await this.prisma.languagePassportImportPreview.update({
      where: { id: preview.id },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });
    await this.audit(actor, passport.id, 'passport.import_confirmed', {
      previewId,
      createdCount: created.length,
    });
    return { preview: updated, createdEntryIds: created };
  }

  async history(actor: PassportActor, limit = 50) {
    const passport = await this.requirePassport(actor);
    return this.prisma.languagePassportAuditEvent.findMany({
      where: { passportId: passport.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  }

  async deletePassport(actor: PassportActor) {
    const passport = await this.requirePassport(actor);
    await this.prisma.$transaction(async (tx) => {
      await tx.languagePassportEntry.updateMany({
        where: { passportId: passport.id, deletedAt: null },
        data: { deletedAt: new Date(), status: 'deleted' },
      });
      await tx.languagePassportShareGrant.updateMany({
        where: { passportId: passport.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.languagePassport.update({
        where: { id: passport.id },
        data: { state: 'deleted', deletedAt: new Date(), personalizationEnabled: false },
      });
    });
    await this.audit(actor, passport.id, 'passport.deleted', {});
    return { deleted: true, passportId: passport.id };
  }

  /** Glossary-shaped terms for MT paths (owner private + approved only). */
  async glossaryTermsForTranslate(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    sourceLang: string;
    targetLang: string;
    text: string;
    context?: ContextScope;
  }) {
    if (!input.userId) return [];
    try {
      const result = await this.resolve(
        {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
        },
        {
          product: 'translate',
          text: input.text,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          context: input.context,
          pinSnapshot: false,
        },
      );
      return result.glossaryTerms ?? [];
    } catch {
      return [];
    }
  }

  private assertApprovedValue(type: PassportEntryType, value: ApprovedMeaning) {
    if (!value || typeof value !== 'object') {
      throw new ApiException('validation_error', 'approvedValue is required', HttpStatus.BAD_REQUEST);
    }
    if (type === 'local_unit_definition') {
      const v = value as Record<string, unknown>;
      const count = decimalSafeQuantity(v.packageCount ?? v.count);
      const size = decimalSafeQuantity(v.packageSize ?? v.size);
      const unit = typeof v.unit === 'string' ? v.unit.trim() : '';
      if (!count || !size || !unit) {
        throw new ApiException(
          'validation_error',
          'local_unit_definition requires decimal-safe packageCount, packageSize, and unit',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private async requirePassport(actor: PassportActor) {
    const passport = await this.prisma.languagePassport.findUnique({
      where: {
        organizationId_ownerUserId: {
          organizationId: actor.organizationId,
          ownerUserId: actor.userId,
        },
      },
    });
    if (!passport || passport.deletedAt || passport.state === 'deleted') {
      // lazy create
      const created = await this.prisma.languagePassport.create({
        data: {
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
          ownerUserId: actor.userId,
        },
      });
      return created;
    }
    if (passport.workspaceId !== actor.workspaceId) {
      // residency-pinned: keep original workspace; still allow owner access inside org
    }
    return passport;
  }

  private async loadResolvableEntries(passportId: string, req: ResolveRequest): Promise<ResolvableEntry[]> {
    const grantEntryIds = req.grantId
      ? ((
          await this.prisma.languagePassportShareGrant.findUnique({ where: { id: req.grantId } })
        )?.entryIds as string[] | undefined)
      : null;

    const rows = await this.prisma.languagePassportEntry.findMany({
      where: {
        passportId,
        deletedAt: null,
        status: 'approved',
        ...(grantEntryIds ? { id: { in: grantEntryIds } } : {}),
      },
      include: {
        revisions: {
          where: { approvedAt: { not: null } },
          orderBy: { revision: 'desc' },
          take: 1,
        },
      },
      take: 500,
    });

    return rows
      .filter((r) => r.revisions[0])
      .map((r) => {
        const rev = r.revisions[0]!;
        const ctx = (rev.context ?? {}) as ContextScope;
        let precedence: ResolvableEntry['precedence'] = 'user';
        if (ctx.projectId) precedence = 'project';
        else if (ctx.businessScopeId) precedence = 'business';
        return {
          entryId: r.id,
          revision: rev.revision,
          type: r.type,
          sourceForm: rev.sourceForm,
          languageVariety: rev.languageVariety,
          sourceLang: rev.sourceLang,
          targetLang: rev.targetLang,
          direction: rev.direction,
          approvedValue: rev.approvedValue,
          context: ctx,
          status: r.status,
          precedence,
        };
      });
  }

  /**
   * Sync approved terminology/pronunciation into workspace glossary + speech vocab + voice studio lexemes
   * so existing model adapters consume Passport memory without a parallel database.
   */
  private async syncApprovedEntryToWorkspace(actor: PassportActor, entryId: string) {
    const entry = await this.prisma.languagePassportEntry.findFirst({
      where: { id: entryId, deletedAt: null, status: 'approved' },
      include: { revisions: { orderBy: { revision: 'desc' }, take: 1 } },
    });
    const rev = entry?.revisions[0];
    if (!entry || !rev) return;

    const value = rev.approvedValue as Record<string, unknown>;
    if (
      (entry.type === 'approved_translation' ||
        entry.type === 'terminology_meaning' ||
        entry.type === 'preferred_name') &&
      rev.sourceLang &&
      rev.targetLang
    ) {
      const targetTerm =
        (typeof value.value === 'string' && value.value) ||
        (typeof value.targetTerm === 'string' && value.targetTerm) ||
        (typeof value.meaning === 'string' && value.meaning) ||
        '';
      if (targetTerm) {
        await this.prisma.glossaryTerm.upsert({
          where: {
            workspaceId_sourceLang_targetLang_sourceTerm: {
              workspaceId: actor.workspaceId,
              sourceLang: rev.sourceLang,
              targetLang: rev.targetLang,
              sourceTerm: rev.sourceForm,
            },
          },
          create: {
            organizationId: actor.organizationId,
            workspaceId: actor.workspaceId,
            sourceLang: rev.sourceLang,
            targetLang: rev.targetLang,
            sourceTerm: rev.sourceForm,
            targetTerm,
            caseSensitive: false,
            wholeWord: true,
          },
          update: { targetTerm },
        });
      }
    }

    if (
      entry.type === 'terminology_meaning' ||
      entry.type === 'preferred_name' ||
      entry.type === 'pronunciation'
    ) {
      const existing = await this.prisma.speechVocabularyTerm.findFirst({
        where: {
          organizationId: actor.organizationId,
          workspaceId: actor.workspaceId,
          phrase: rev.sourceForm,
        },
      });
      if (!existing) {
        await this.prisma.speechVocabularyTerm.create({
          data: {
            organizationId: actor.organizationId,
            workspaceId: actor.workspaceId,
            phrase: rev.sourceForm,
          },
        });
      }
    }

    if (entry.type === 'pronunciation') {
      const alias =
        (typeof value.alias === 'string' && value.alias) ||
        (typeof value.value === 'string' && value.value) ||
        '';
      if (alias) {
        await this.prisma.voiceStudioLexeme.upsert({
          where: {
            workspaceId_grapheme: {
              workspaceId: actor.workspaceId,
              grapheme: rev.sourceForm,
            },
          },
          create: {
            organizationId: actor.organizationId,
            workspaceId: actor.workspaceId,
            grapheme: rev.sourceForm,
            alias,
            language: rev.sourceLang ?? 'en',
          },
          update: { alias },
        });
      }
    }
  }

  private serializePassport(passport: {
    id: string;
    organizationId: string;
    workspaceId: string;
    ownerUserId: string;
    state: string;
    personalizationEnabled: boolean;
    preferencesRevision: number;
    preferredVarieties: unknown;
    preferredVoiceIds: unknown;
    retentionDays: number;
    trainingConsent: boolean;
    createdAt: Date;
    updatedAt: Date;
    entries?: Array<{
      id: string;
      type: string;
      status: string;
      currentRevision: number;
      entryKey: string;
      revisions?: Array<Record<string, unknown>>;
    }>;
    grants?: Array<Record<string, unknown>>;
  }) {
    return {
      id: passport.id,
      organizationId: passport.organizationId,
      workspaceId: passport.workspaceId,
      ownerUserId: passport.ownerUserId,
      state: passport.state,
      personalizationEnabled: passport.personalizationEnabled,
      preferencesRevision: passport.preferencesRevision,
      preferredVarieties: passport.preferredVarieties,
      preferredVoiceIds: passport.preferredVoiceIds,
      retentionDays: passport.retentionDays,
      trainingConsent: passport.trainingConsent,
      createdAt: passport.createdAt,
      updatedAt: passport.updatedAt,
      promise: 'Your language. Your meaning. Wherever you use Lugemi.',
      entries: (passport.entries ?? []).map((e) => ({
        id: e.id,
        type: e.type,
        status: e.status,
        currentRevision: e.currentRevision,
        entryKey: e.entryKey,
        latest: e.revisions?.[0] ?? null,
      })),
      grants: passport.grants ?? [],
      modelSync: passportModelSyncSummary(),
    };
  }

  private async audit(
    actor: PassportActor,
    passportId: string | null,
    operation: string,
    meta: Record<string, unknown>,
  ) {
    await this.prisma.languagePassportAuditEvent.create({
      data: {
        organizationId: actor.organizationId,
        passportId,
        actorId: actor.userId,
        operation,
        meta: meta as Prisma.InputJsonValue,
      },
    });
  }
}
