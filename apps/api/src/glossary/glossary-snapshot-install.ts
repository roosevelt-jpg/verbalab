export type GlossarySnapshotTerm = {
  sourceLang: string;
  targetLang: string;
  sourceTerm: string;
  targetTerm: string;
  caseSensitive: boolean;
  wholeWord: boolean;
};

/** Upsert a glossary snapshot into a workspace (marketplace + vertical packs). */
export async function upsertGlossarySnapshot(
  tx: {
    glossaryTerm: {
      upsert: (args: {
        where: {
          workspaceId_sourceLang_targetLang_sourceTerm: {
            workspaceId: string;
            sourceLang: string;
            targetLang: string;
            sourceTerm: string;
          };
        };
        create: {
          organizationId: string;
          workspaceId: string;
          sourceLang: string;
          targetLang: string;
          sourceTerm: string;
          targetTerm: string;
          caseSensitive: boolean;
          wholeWord: boolean;
        };
        update: {
          targetTerm: string;
          caseSensitive: boolean;
          wholeWord: boolean;
        };
      }) => Promise<unknown>;
    };
  },
  input: {
    organizationId: string;
    workspaceId: string;
    terms: GlossarySnapshotTerm[];
  },
): Promise<number> {
  let count = 0;
  for (const term of input.terms) {
    if (!term.sourceTerm?.trim() || !term.targetTerm?.trim()) continue;
    await tx.glossaryTerm.upsert({
      where: {
        workspaceId_sourceLang_targetLang_sourceTerm: {
          workspaceId: input.workspaceId,
          sourceLang: term.sourceLang,
          targetLang: term.targetLang,
          sourceTerm: term.sourceTerm,
        },
      },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        sourceLang: term.sourceLang,
        targetLang: term.targetLang,
        sourceTerm: term.sourceTerm,
        targetTerm: term.targetTerm,
        caseSensitive: term.caseSensitive ?? false,
        wholeWord: term.wholeWord ?? true,
      },
      update: {
        targetTerm: term.targetTerm,
        caseSensitive: term.caseSensitive ?? false,
        wholeWord: term.wholeWord ?? true,
      },
    });
    count += 1;
  }
  return count;
}
