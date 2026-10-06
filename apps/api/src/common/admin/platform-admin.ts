export function parseAdminAllowlist: { emails: Set<string>; clerkUserIds: Set<string> } {
  const emails = new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim.toLowerCase)
      .filter(Boolean),
  );
  const clerkUserIds = new Set(
    (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim)
      .filter(Boolean),
  );
  return { emails, clerkUserIds };
}

export function isPlatformAdmin(input: { email?: string | null; clerkUserId?: string | null }): boolean {
  const { emails, clerkUserIds } = parseAdminAllowlist;
  if (emails.size === 0 && clerkUserIds.size === 0) return false;
  if (input.clerkUserId && clerkUserIds.has(input.clerkUserId)) return true;
  if (input.email && emails.has(input.email.trim.toLowerCase)) return true;
  return false;
}
