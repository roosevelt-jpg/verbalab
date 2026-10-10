function splitList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Comma-separated emails: ADMIN_EMAILS and/or LUGEMI_PLATFORM_ADMIN_EMAILS. */
export function parseAdminAllowlist(): { emails: Set<string>; clerkUserIds: Set<string> } {
  const emails = new Set(
    [
      ...splitList(process.env.ADMIN_EMAILS),
      ...splitList(process.env.LUGEMI_PLATFORM_ADMIN_EMAILS),
    ].map((s) => s.toLowerCase()),
  );
  const clerkUserIds = new Set([
    ...splitList(process.env.ADMIN_USER_IDS),
    ...splitList(process.env.LUGEMI_PLATFORM_ADMIN_USER_IDS),
  ]);
  return { emails, clerkUserIds };
}

export function isPlatformAdmin(input: {
  email?: string | null;
  clerkUserId?: string | null;
}): boolean {
  const { emails, clerkUserIds } = parseAdminAllowlist();
  if (emails.size === 0 && clerkUserIds.size === 0) return false;
  if (input.clerkUserId && clerkUserIds.has(input.clerkUserId)) return true;
  if (input.email && emails.has(input.email.trim().toLowerCase())) return true;
  return false;
}
