export type TabKey = "home" | "album" | "jar" | "echo" | "profile";

export type FamilyMemberId = "me" | "mom" | "dad";

export interface FamilyMember {
  id: FamilyMemberId;
  name: string;
  role: string;
  dogName: string;
  accentColor: string;
  avatarUrl: string;
}

export type AlbumReaction = "smile" | "love" | "clap" | "wow" | "sad" | null;

export interface AlbumEntry {
  id: string;
  memberId: FamilyMemberId;
  imageUrl: string;
  uploadedAt: string;
  dogMessage: string;
  reaction: AlbumReaction;
}
