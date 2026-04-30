import { AlbumEntry, FamilyMember } from "../types";

export const familyMembers: FamilyMember[] = [
  {
    id: "me",
    name: "我",
    role: "我的相册",
    dogName: "团团",
    accentColor: "#f4b183",
  },
  {
    id: "mom",
    name: "妈妈",
    role: "妈妈的相册",
    dogName: "糖糖",
    accentColor: "#f29fb1",
  },
  {
    id: "dad",
    name: "爸爸",
    role: "爸爸的相册",
    dogName: "栗栗",
    accentColor: "#8fb5e8",
  },
];

export const initialAlbumEntries: AlbumEntry[] = [
  {
    id: "me-1",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-29 18:20",
    dogMessage: "今天的饭看着很香",
  },
  {
    id: "mom-1",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-30 08:10",
    dogMessage: "",
  },
  {
    id: "mom-2",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-28 10:45",
    dogMessage: "",
  },
  {
    id: "dad-1",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-30 07:05",
    dogMessage: "",
  },
  {
    id: "dad-2",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-27 16:30",
    dogMessage: "",
  },
];
