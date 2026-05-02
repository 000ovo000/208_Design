import { petBreeds, type PetBreed } from "./pet-breeds";

export type WeeklyRewardKind = "premium-toy" | "pet-breed";

export type WeeklyReward = {
  id: string;
  kind: WeeklyRewardKind;
  name: string;
  emoji: string;
  image?: string;
  reason: string;
  description: string;
  triggerType: "reaction" | "photo" | "mood" | "message" | "balanced" | "special";
  breed?: PetBreed;
};

export const weeklyRewards: WeeklyReward[] = [
  {
    id: "cozy-bed",
    kind: "premium-toy",
    name: "Cozy Bed",
    emoji: "🛏️",
    reason: "From a steady week of gentle family contact.",
    description: "A premium toy that makes your pet room feel warmer.",
    triggerType: "balanced",
  },
  {
    id: "puzzle-toy",
    kind: "premium-toy",
    name: "Puzzle Toy",
    emoji: "🧩",
    reason: "From several thoughtful replies this week.",
    description: "A playful reward for meaningful family interaction.",
    triggerType: "message",
  },
  {
    id: "plush-bear",
    kind: "premium-toy",
    name: "Plush Bear",
    emoji: "🧸",
    reason: "From 5 gentle family reactions this week.",
    description: "A soft premium toy for keeping this week's warmth visible.",
    triggerType: "reaction",
  },
  {
    id: "ribbon-collar",
    kind: "premium-toy",
    name: "Ribbon Collar",
    emoji: "🎀",
    reason: "From calm mood check-ins shared across the week.",
    description: "A small decorative reward for quiet emotional sharing.",
    triggerType: "mood",
  },
  {
    id: "family-photo-frame",
    kind: "premium-toy",
    name: "Family Photo Frame",
    emoji: "🖼️",
    reason: "From the photos shared with your family this week.",
    description: "A room keepsake for the small scenes your family noticed.",
    triggerType: "photo",
  },
  {
    id: "new-orange-cat",
    kind: "pet-breed",
    name: "Orange Cat",
    emoji: "🐈",
    reason: "Because your family stayed connected for 5 days this week.",
    description: "A new companion joined your room after a warm weekly echo.",
    triggerType: "special",
    breed: petBreeds[0],
  },
];

export type WeeklyRewardStats = {
  petMessages: number;
  photoShares: number;
  gentleReactions: number;
  moodCheckIns: number;
  connectedDays: number;
};

export function selectWeeklyReward(stats: WeeklyRewardStats): WeeklyReward {
  if (stats.connectedDays >= 5 && stats.gentleReactions >= 5) {
    return weeklyRewards.find((reward) => reward.id === "new-orange-cat") ?? weeklyRewards[0];
  }

  if (stats.photoShares >= 2) {
    return weeklyRewards.find((reward) => reward.triggerType === "photo") ?? weeklyRewards[0];
  }

  if (stats.moodCheckIns >= 3) {
    return weeklyRewards.find((reward) => reward.triggerType === "mood") ?? weeklyRewards[0];
  }

  if (stats.petMessages >= 3) {
    return weeklyRewards.find((reward) => reward.triggerType === "message") ?? weeklyRewards[0];
  }

  if (stats.gentleReactions >= 5) {
    return weeklyRewards.find((reward) => reward.triggerType === "reaction") ?? weeklyRewards[0];
  }

  return weeklyRewards.find((reward) => reward.triggerType === "balanced") ?? weeklyRewards[0];
}
