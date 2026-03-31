import type { Id } from "./_generated/dataModel";

export async function assertOrgAccess(
  ctx: any,
  actorUserId: Id<"users">,
  organizationId?: Id<"organizations">
) {
  const user = await ctx.db.get(actorUserId);

  if (!user) {
    throw new Error("User not found");
  }

  if (
    organizationId &&
    user.organizationId !== organizationId &&
    user.role !== "super_admin"
  ) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function assertOrgAdmin(
  ctx: any,
  actorUserId: Id<"users">,
  organizationId: Id<"organizations">
) {
  const user = await assertOrgAccess(ctx, actorUserId, organizationId);

  if (!["org_admin", "super_admin", "hr_manager"].includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return user;
}

export const DEFAULT_ORG_SETTINGS = {
  requireProctoring: true,
  allowTabSwitch: false,
  maxTabSwitches: 3,
  captureScreenshots: true,
  screenshotInterval: 30,
  requireFullscreen: true,
  autoSubmitOnViolation: false,
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
