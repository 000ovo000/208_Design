export type WeeklyRewardKind = "premium-toy";

export type WeeklyRewardPetType = "cat" | "dog" | "both";

export type WeeklyReward = {
  id: string;
  kind: WeeklyRewardKind;
  name: string;
  image?: string;
  sceneImage?: string;
  petType: WeeklyRewardPetType;
  reason: string;
  description: string;
};

export const weeklyRewards: WeeklyReward[] = [
  // Common weekly rewards for both cats and dogs
  {
    id: "pet-sofa1",
    kind: "premium-toy",
    name: "Pet Sofa 1",
    image: "/images/weekly-reward/both/pet-sofa1.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa1.png",
    petType: "both",
    reason: "From a warm week of steady family responses.",
    description: "A cozy sofa keepsake for a gentle home scene.",
  },
  {
    id: "pet-sofa2",
    kind: "premium-toy",
    name: "Pet Sofa 2",
    image: "/images/weekly-reward/both/pet-sofa2.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa2.png",
    petType: "both",
    reason: "From the photos shared with your family this week.",
    description: "A room sofa that makes shared family moments visible.",
  },
  {
    id: "pet-sofa3",
    kind: "premium-toy",
    name: "Pet Sofa 3",
    image: "/images/weekly-reward/both/pet-sofa3.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa3.png",
    petType: "both",
    reason: "From calm mood check-ins shared across the week.",
    description: "A soft sofa reward for quiet emotional sharing.",
  },
  {
    id: "pet-sofa4",
    kind: "premium-toy",
    name: "Pet Sofa 4",
    image: "/images/weekly-reward/both/pet-sofa4.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa4.png",
    petType: "both",
    reason: "From several small updates collected through the week.",
    description: "A gentle room item that gathers this week's family moments.",
  },
  {
    id: "pet-sofa5",
    kind: "premium-toy",
    name: "Pet Sofa 5",
    image: "/images/weekly-reward/both/pet-sofa5.png",
    sceneImage: "/images/weekly-reward/both/pet-sofa5.png",
    petType: "both",
    reason: "From a special week of warm family contact.",
    description: "A premium sofa keepsake for a brighter pet room.",
  },

  // Cat-specific weekly rewards
  {
    id: "cat-climber",
    kind: "premium-toy",
    name: "Cat Climber",
    image: "/images/weekly-reward/cat/cat-climber2.png",
    sceneImage: "/images/weekly-reward/cat/cat-climber2.png",
    petType: "cat",
    reason: "From a lively week of small family updates.",
    description: "A premium climbing item that makes the cat's room feel more playful.",
  },
  {
    id: "cat-teaser",
    kind: "premium-toy",
    name: "Cat Teaser",
    image: "/images/weekly-reward/cat/cat-teaser.png",
    sceneImage: "/images/weekly-reward/cat/cat-teaser.png",
    petType: "cat",
    reason: "From gentle reactions that made the week feel warmer.",
    description: "A premium teaser toy for curious cat moments.",
  },
  // Dog-specific weekly rewards
  {
    id: "carrot-toy",
    kind: "premium-toy",
    name: "Carrot Toy",
    image: "/images/weekly-reward/dog/carrot-toy.png",
    sceneImage: "/images/weekly-reward/dog/carrot-toy.png",
    petType: "dog",
    reason: "From a steady week of small family updates.",
    description: "A premium carrot-shaped toy for happy puppy play.",
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
