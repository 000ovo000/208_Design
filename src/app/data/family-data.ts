import { AlbumEntry, FamilyMember } from "../types";

export const familyMembers: FamilyMember[] = [
  {
    id: "me",
    name: "Grace",
    role: "我的相册",
    dogName: "团团",
    accentColor: "#f4b183",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "mom",
    name: "Mom",
    role: "妈妈的相册",
    dogName: "糖糖",
    accentColor: "#f29fb1",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "dad",
    name: "Dad",
    role: "爸爸的相册",
    dogName: "栗栗",
    accentColor: "#8fb5e8",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
  },
];

export const initialAlbumEntries: AlbumEntry[] = [
  {
    id: "me-1",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-01 08:00",
    dogMessage: "早上的桌面和热饮看起来很治愈。",
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
    dogMessage: "今天用毛绒小狗收尾，心情很放松。",
    reaction: null,
  },
  {
    id: "me-4",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-16 09:20",
    dogMessage: "四月中旬也记得好好吃饭。",
    reaction: null,
  },
  {
    id: "me-5",
    memberId: "me",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-02-07 17:40",
    dogMessage: "年初的散步也被记录下来了。",
    reaction: null,
  },
  {
    id: "mom-1",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-01 08:00",
    dogMessage: "good weather",
    reaction: "smile",
  },
  {
    id: "mom-2",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-02 11:30",
    dogMessage: "今天的山坡很安静。",
    reaction: null,
  },
  {
    id: "mom-3",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-26 21:00",
    dogMessage: "晚上也想记录一点生活。",
    reaction: null,
  },
  {
    id: "mom-4",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-03-20 18:10",
    dogMessage: "三月也有很温柔的天空。",
    reaction: null,
  },
  {
    id: "mom-5",
    memberId: "mom",
    imageUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-01-12 07:50",
    dogMessage: "年初的清晨光线很好。",
    reaction: null,
  },
  {
    id: "dad-1",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-05-02 11:30",
    dogMessage: "fish",
    reaction: "clap",
  },
  {
    id: "dad-2",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-29 16:10",
    dogMessage: "这张雪山留给四月末。",
    reaction: null,
  },
  {
    id: "dad-3",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-04-20 18:30",
    dogMessage: "春天的黄昏也值得留一张。",
    reaction: null,
  },
  {
    id: "dad-4",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2026-03-11 10:20",
    dogMessage: "三月的远景像旅行海报。",
    reaction: null,
  },
  {
    id: "dad-5",
    memberId: "dad",
    imageUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop",
    uploadedAt: "2025-11-08 15:15",
    dogMessage: "去年的风景也保留下来。",
    reaction: null,
  },
];
