import { MembershipRole } from '@prisma/client';

/** Map Clerk organization role claim (`o.rol`) → VerbaLab MembershipRole. */
export function mapClerkOrgRole(raw?: string | null): MembershipRole | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase().replace(/^org:/, '');
  if (normalized === 'owner' || normalized === 'org_owner') return MembershipRole.owner;
  if (normalized === 'admin' || normalized === 'org_admin') return MembershipRole.admin;
  if (
    normalized === 'member' ||
    normalized === 'basic_member' ||
    normalized === 'org_member'
  ) {
    return MembershipRole.member;
  }
  return null;
}
