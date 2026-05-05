export type WeeklyRewardKind = "premium-toy";

export type WeeklyRewardPetType = "cat" | "dog" | "both";

export type WeeklyReward = {
  id: string;
  kind: WeeklyRewardKind;
  name: string;
  emoji: string;
  image?: string;
  sceneImage?: string;
  petType: WeeklyRewardPetType;
  reason: string;
  description: string;
  triggerType: "reaction" | "photo" | "mood" | "message" | "balanced" | "special";
};

export const weeklyRewards: WeeklyReward[] = [
  // Common weekly rewards for both cats and dogs
  {
    id: "pet-sofa1",
    kind: "premium-toy",
    name: "Pet Sofa 1",
    emoji: "🛋️",
    image: "/images/weekly-reward/both/pet-sofa1.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa1.png",
    petType: "both",
    reason: "From a warm week of steady family responses.",
    description: "A cozy sofa keepsake for a gentle home scene.",
    triggerType: "reaction",
  },
  {
    id: "pet-sofa2",
    kind: "premium-toy",
    name: "Pet Sofa 2",
    emoji: "🛋️",
    image: "/images/weekly-reward/both/pet-sofa2.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa2.png",
    petType: "both",
    reason: "From the photos shared with your family this week.",
    description: "A room sofa that makes shared family moments visible.",
    triggerType: "photo",
  },
  {
    id: "pet-sofa3",
    kind: "premium-toy",
    name: "Pet Sofa 3",
    emoji: "🛋️",
    image: "/images/weekly-reward/both/pet-sofa3.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa3.png",
    petType: "both",
    reason: "From calm mood check-ins shared across the week.",
    description: "A soft sofa reward for quiet emotional sharing.",
    triggerType: "mood",
  },
  {
    id: "pet-sofa4",
    kind: "premium-toy",
    name: "Pet Sofa 4",
    emoji: "🛋️",
    image: "/images/weekly-reward/both/pet-sofa4.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa4.png",
    petType: "both",
    reason: "From several small updates collected through the week.",
    description: "A gentle room item that gathers this week's family moments.",
    triggerType: "message",
  },
  {
    id: "pet-sofa5",
    kind: "premium-toy",
    name: "Pet Sofa 5",
    emoji: "🛋️",
    image: "/images/weekly-reward/both/pet-sofa5.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa5.png",
    petType: "both",
    reason: "From a special week of warm family contact.",
    description: "A premium sofa keepsake for a brighter pet room.",
    triggerType: "special",
  },

  // Cat-specific weekly rewards
  {
    id: "cat-climber",
    kind: "premium-toy",
    name: "Cat Climber",
    emoji: "🌳",
    image: "/images/weekly-reward/cat/cat-climber.png",
    sceneImage: "/images/weekly-reward/cat/cat-climber.png",
    petType: "cat",
    reason: "From a lively week of small family updates.",
    description: "A premium climbing item that makes the cat's room feel more playful.",
    triggerType: "balanced",
  },
  {
    id: "cat-teaser",
    kind: "premium-toy",
    name: "Cat Teaser",
    emoji: "🪶",
    image: "/images/weekly-reward/cat/cat-teaser.png",
    sceneImage: "/images/weekly-reward/cat/cat-teaser.png",
    petType: "cat",
    reason: "From gentle reactions that made the week feel warmer.",
    description: "A premium teaser toy for curious cat moments.",
    triggerType: "reaction",
  },
  // Dog-specific weekly rewards
  {
    id: "carrot-toy",
    kind: "premium-toy",
    name: "Carrot Toy",
    emoji: "🥕",
    image: "/images/weekly-reward/dog/carrot-toy.png",
    sceneImage: "/images/weekly-reward/dog/carrot-toy.png",
    petType: "dog",
    reason: "From a steady week of small family updates.",
    description: "A premium carrot-shaped toy for happy puppy play.",
    triggerType: "balanced",
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
