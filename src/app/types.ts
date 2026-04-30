export type TabKey = "home" | "album" | "jar" | "profile";

export type FamilyMemberId = "me" | "mom" | "dad";

export interface FamilyMember {
  id: FamilyMemberId;
  name: string;
  role: string;
  dogName: string;
  accentColor: string;
}

export interface AlbumEntry {
  id: string;
  memberId: FamilyMemberId;
  imageUrl: string;
  uploadedAt: string;
  dogMessage: string;
}
