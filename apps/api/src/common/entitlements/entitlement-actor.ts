/** Actor shape used by product entitlement gates. */
export type EntitlementActor = {
  organizationId: string;
  /** When true, plan/featureOverrides gates are skipped (platform admin allowlist). */
  platformAdmin?: boolean;
};

export function resolveEntitlementContext(
  actorOrOrg: string | EntitlementActor,
): { organizationId: string; platformAdmin: boolean } {
  if (typeof actorOrOrg === 'string') {
    return { organizationId: actorOrOrg, platformAdmin: false };
  }
  return {
    organizationId: actorOrOrg.organizationId,
    platformAdmin: Boolean(actorOrOrg.platformAdmin),
  };
}
