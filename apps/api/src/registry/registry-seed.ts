import { WritingSystemKind, type PrismaClient } from '@prisma/client';
import { FAMILY_SEEDS } from './family-seeds';
import { WRITING_SYSTEM_SEEDS } from './writing-system-seeds';
import { LINGUISTIC_RULE_SEEDS } from './linguistic-rule-seeds';
import { LinguisticRuleKind } from '@prisma/client';

type Db = Pick<
  PrismaClient,
  'languageFamily' | 'writingSystem' | 'linguisticRule'
>;

export async function seedFamiliesAndScripts(prisma: Db) {
  for (const family of FAMILY_SEEDS.filter(Boolean)) {
    await prisma.languageFamily.upsert({
      where: { code: family.code },
      create: {
        code: family.code,
        nameEn: family.nameEn,
        parentCode: family.parentCode,
        notes: family.notes,
      },
      update: {
        nameEn: family.nameEn,
        parentCode: family.parentCode,
        notes: family.notes,
      },
    });
  }

  for (const script of WRITING_SYSTEM_SEEDS.filter(Boolean)) {
    await prisma.writingSystem.upsert({
      where: { code: script.code },
      create: {
        code: script.code,
        nameEn: script.nameEn,
        kind: script.kind as WritingSystemKind,
        rtl: script.rtl ?? false,
        sampleChars: script.sampleChars,
        notes: script.notes,
      },
      update: {
        nameEn: script.nameEn,
        kind: script.kind as WritingSystemKind,
        rtl: script.rtl ?? false,
        sampleChars: script.sampleChars,
        notes: script.notes,
      },
    });
  }
}

export async function seedLinguisticRules(prisma: Db) {
  for (const rule of LINGUISTIC_RULE_SEEDS) {
    await prisma.linguisticRule.upsert({
      where: { code: rule.code },
      create: {
        code: rule.code,
        kind: rule.kind as LinguisticRuleKind,
        languageCode: rule.languageCode,
        nameEn: rule.nameEn,
        description: rule.description,
        pattern: rule.pattern,
        examples: rule.examples ?? [],
        notes: rule.notes,
      },
      update: {
        kind: rule.kind as LinguisticRuleKind,
        languageCode: rule.languageCode,
        nameEn: rule.nameEn,
        description: rule.description,
        pattern: rule.pattern,
        examples: rule.examples ?? [],
        notes: rule.notes,
      },
    });
  }
}
