import { FamilyMember } from "../types";

export const PROFILE_PHOTO_BY_NAME: Record<string, string> = {
  dad: "/images/profile_photo/dad.png",
  mom: "/images/profile_photo/mom.png",
  grace: "/images/profile_photo/grace.png",
};

function normalizeMemberNameKey(name?: string | null) {
  return String(name ?? "").trim().toLowerCase();
}

export function getProfilePhotoByName(name?: string | null) {
  return PROFILE_PHOTO_BY_NAME[normalizeMemberNameKey(name)];
}

export function getFamilyMemberAvatarUrl(
  member?: Pick<FamilyMember, "name" | "avatarUrl" | "avatar_url"> | null
) {
  const explicitAvatarUrl = member?.avatarUrl?.trim() || member?.avatar_url?.trim() || "";
  if (explicitAvatarUrl) return explicitAvatarUrl;
  return getProfilePhotoByName(member?.name);
}

export function normalizeFamilyMemberAvatar<T extends FamilyMember>(member: T): T {
  const avatarUrl = getFamilyMemberAvatarUrl(member);
  if (!avatarUrl) return member;
  return {
    ...member,
    avatarUrl,
  };
}
