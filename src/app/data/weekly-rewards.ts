export type WeeklyRewardKind = "premium-toy";

export type WeeklyRewardPetType = "cat" | "dog" | "both";

export type WeeklyReward = {
  id: string;
  kind: WeeklyRewardKind;
  name: string;
  emoji: string;
  image?: string;
  petType: WeeklyRewardPetType;
  reason: string;
  description: string;
  triggerType: "reaction" | "photo" | "mood" | "message" | "balanced" | "special";
};

export const weeklyRewards: WeeklyReward[] = [
  // Common weekly rewards for both cats and dogs
  {
    id: "cozy-bed",
    kind: "premium-toy",
    name: "Cozy Bed",
    emoji: "🛏️",
    petType: "both",
    reason: "From a steady week of gentle family contact.",
    description: "A premium room item that makes your pet's space feel warmer.",
    triggerType: "balanced",
  },
  {
    id: "plush-bear",
    kind: "premium-toy",
    name: "Plush Bear",
    emoji: "🧸",
    petType: "both",
    reason: "From gentle family reactions this week.",
    description: "A soft premium toy for keeping this week's warmth visible.",
    triggerType: "reaction",
  },
  {
    id: "ribbon-collar",
    kind: "premium-toy",
    name: "Ribbon Collar",
    emoji: "🎀",
    petType: "both",
    reason: "From calm mood check-ins shared across the week.",
    description: "A small decorative reward for quiet emotional sharing.",
    triggerType: "mood",
  },
  {
    id: "family-photo-frame",
    kind: "premium-toy",
    name: "Family Photo Frame",
    emoji: "🖼️",
    petType: "both",
    reason: "From the photos shared with your family this week.",
    description: "A room keepsake for the small scenes your family noticed.",
    triggerType: "photo",
  },
  {
    id: "family-photo-album",
    kind: "premium-toy",
    name: "Family Photo Album",
    emoji: "📖",
    petType: "both",
    reason: "From several small updates collected through the week.",
    description: "A gentle album that gathers this week's family moments.",
    triggerType: "message",
  },
  {
    id: "pet-sofa",
    kind: "premium-toy",
    name: "Pet Sofa",
    emoji: "🛋️",
    petType: "both",
    reason: "From a warm week of steady family responses.",
    description: "A soft room reward for your pet to rest beside family memories.",
    triggerType: "reaction",
  },
  {
    id: "toy-basket",
    kind: "premium-toy",
    name: "Toy Basket",
    emoji: "🧺",
    petType: "both",
    reason: "From a balanced week of family interaction.",
    description: "A small basket for keeping your pet's favorite toys together.",
    triggerType: "balanced",
  },

  // Cat-specific weekly rewards
  {
    id: "cat-tree",
    kind: "premium-toy",
    name: "Cat Tree",
    emoji: "🌳",
    petType: "cat",
    reason: "From a lively week of small family updates.",
    description: "A premium climbing item that makes the cat's room feel more playful.",
    triggerType: "balanced",
  },
  {
    id: "scratching-post",
    kind: "premium-toy",
    name: "Scratching Post",
    emoji: "🐾",
    petType: "cat",
    reason: "From gentle reactions that made the week feel warmer.",
    description: "A better scratching item for cozy and playful cat moments.",
    triggerType: "reaction",
  },
  {
    id: "fish-plush",
    kind: "premium-toy",
    name: "Fish Plush",
    emoji: "🐟",
    petType: "cat",
    reason: "From soft replies and small shared moments this week.",
    description: "A soft fish-shaped plush toy for quiet cat companionship.",
    triggerType: "message",
  },

  // Dog-specific weekly rewards
  {
    id: "golden-ball",
    kind: "premium-toy",
    name: "Golden Ball",
    emoji: "🟡",
    petType: "dog",
    reason: "From cheerful reactions shared during the week.",
    description: "A brighter premium ball for playful dog moments.",
    triggerType: "reaction",
  },
  {
    id: "dog-frisbee",
    kind: "premium-toy",
    name: "Dog Frisbee",
    emoji: "🥏",
    petType: "dog",
    reason: "From a steady week of small family updates.",
    description: "A premium toy for active and happy puppy play.",
    triggerType: "balanced",
  },
  {
    id: "cozy-dog-house",
    kind: "premium-toy",
    name: "Cozy Dog House",
    emoji: "🏠",
    petType: "dog",
    reason: "From gentle check-ins and warm family responses this week.",
    description: "A cozy room item that gives your puppy a warmer place to rest.",
    triggerType: "mood",
  },
  {
    id: "star-collar",
    kind: "premium-toy",
    name: "Star Collar",
    emoji: "🎀",
    petType: "dog",
    reason: "From calm emotional sharing across the week.",
    description: "A small decorative collar that marks this week's warm connection.",
    triggerType: "mood",
  },
];

export type WeeklyRewardStats = {
  petMessages: number;
  photoShares: number;
  gentleReactions: number;
  moodCheckIns: number;
  connectedDays: number;
};

export const getWeeklyRewardsForPet = (petType: Exclude<WeeklyRewardPetType, "both">) => {
  return weeklyRewards.filter((reward) => reward.petType === "both" || reward.petType === petType);
};

export function selectWeeklyReward(
  stats: WeeklyRewardStats,
  petType?: Exclude<WeeklyRewardPetType, "both">
): WeeklyReward {
  const availableRewards = petType ? getWeeklyRewardsForPet(petType) : weeklyRewards;

  if (stats.photoShares >= 2) {
    return availableRewards.find((reward) => reward.triggerType === "photo") ?? availableRewards[0];
  }

  if (stats.moodCheckIns >= 3) {
    return availableRewards.find((reward) => reward.triggerType === "mood") ?? availableRewards[0];
  }

  if (stats.petMessages >= 3) {
    return availableRewards.find((reward) => reward.triggerType === "message") ?? availableRewards[0];
  }

  if (stats.gentleReactions >= 5) {
    return availableRewards.find((reward) => reward.triggerType === "reaction") ?? availableRewards[0];
  }

  return availableRewards.find((reward) => reward.triggerType === "balanced") ?? availableRewards[0];
}
