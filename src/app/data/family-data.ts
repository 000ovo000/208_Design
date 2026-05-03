import { AlbumEntry, FamilyMember, FamilyMemberId } from "../types";
import { defaultPetId, type PetId } from "./pets";

export const familyMembers: FamilyMember[] = [
  {
    id: "me",
    name: "Grace",
    role: "My album",
    dogName: "Mochi",
    accentColor: "#f4b183",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "mom",
    name: "Mom",
    role: "Mom's album",
    dogName: "Toffee",
    accentColor: "#f29fb1",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "dad",
    name: "Dad",
    role: "Dad's album",
    dogName: "Chestnut",
    accentColor: "#8fb5e8",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
  },
];

export const mockFamilySelectedPetIds: Partial<Record<FamilyMemberId, PetId>> = {
  me: "white-puppy",
  mom: "orange-kitten",
  dad: "corgi-puppy",
};

export function getFamilySelectedPetId(memberId: FamilyMemberId): PetId {
  return mockFamilySelectedPetIds[memberId] ?? defaultPetId;
}

export const initialAlbumEntries: AlbumEntry[] = [
  {
    id: "me-1",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-01 08:00",
    dogMessage: "The desk and morning drink felt calm today.",
    reaction: "smile",
  },
  {
    id: "me-2",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-02 11:30",
    dogMessage: "Lunch!!!",
    reaction: "love",
  },
  {
    id: "me-3",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-30 22:10",
    dogMessage: "Ending the day with the plush dog felt relaxing.",
    reaction: null,
  },
  {
    id: "me-4",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-16 09:20",
    dogMessage: "Mid-April still deserves a proper meal.",
    reaction: null,
  },
  {
    id: "me-5",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-02-07 17:40",
    dogMessage: "Even the early-year walk was worth saving.",
    reaction: null,
  },
  {
    id: "mom-1",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-01 08:00",
    dogMessage: "Good weather today.",
    reaction: "smile",
  },
  {
    id: "mom-2",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-02 11:30",
    dogMessage: "The hillside felt quiet today.",
    reaction: null,
  },
  {
    id: "mom-3",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-26 21:00",
    dogMessage: "I still wanted to save a little of the evening.",
    reaction: null,
  },
  {
    id: "mom-4",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-03-20 18:10",
    dogMessage: "March had a gentle sky too.",
    reaction: null,
  },
  {
    id: "mom-5",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-01-12 07:50",
    dogMessage: "The early morning light at the start of the year was lovely.",
    reaction: null,
  },
  {
    id: "dad-1",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-02 11:30",
    dogMessage: "Fish.",
    reaction: "clap",
  },
  {
    id: "dad-2",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-29 16:10",
    dogMessage: "Saving this snow mountain for the end of April.",
    reaction: null,
  },
  {
    id: "dad-3",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-20 18:30",
    dogMessage: "Spring dusk deserved one more photo.",
    reaction: null,
  },
  {
    id: "dad-4",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-03-11 10:20",
    dogMessage: "The March view looked like a travel poster.",
    reaction: null,
  },
  {
    id: "dad-5",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2025-11-08 15:15",
    dogMessage: "I kept last year's landscape too.",
    reaction: null,
  },
];
