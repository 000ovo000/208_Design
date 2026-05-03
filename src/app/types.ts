export type TabKey = "home" | "album" | "jar" | "echo" | "profile";

export type FamilyMemberId = string | number;

export interface FamilyMember {
  id: FamilyMemberId;
  name: string;
  email?: string;
  role?: string;
  user_id?: number | string;
  family_id?: number | string;
  is_current_user?: boolean;
  dogName?: string;
  accentColor?: string;
  avatarUrl?: string;
  avatar_url?: string | null;
  petImageUrl?: string;
  pet_image_url?: string | null;
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
