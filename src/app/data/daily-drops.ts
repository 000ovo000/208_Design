export type DailyDropCategory = "food" | "drink" | "basic-toy";

export type DailyDrop = {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  category: DailyDropCategory;
  description: string;
};

export type WeeklyCollectedDrop = DailyDrop & {
  count: number;
};

export const dailyDrops: DailyDrop[] = [
  {
    id: "pet-biscuit",
    name: "Pet Biscuit",
    emoji: "🍪",
    category: "food",
    description: "A small everyday treat for your pet.",
  },
  {
    id: "soft-treat",
    name: "Soft Treat",
    emoji: "🦴",
    category: "food",
    description: "A gentle snack for daily pet care.",
  },
  {
    id: "pet-milk",
    name: "Pet Milk",
    emoji: "🥛",
    category: "drink",
    description: "A pet-friendly milk bowl for daily care.",
  },
  {
    id: "water-bowl",
    name: "Water Bowl",
    emoji: "💧",
    category: "drink",
    description: "A simple water bowl for keeping your pet comfortable.",
  },
  {
    id: "small-ball",
    name: "Small Ball",
    emoji: "🟠",
    category: "basic-toy",
    description: "A small toy for light everyday play.",
  },
  {
    id: "yarn-ball",
    name: "Yarn Ball",
    emoji: "🧶",
    category: "basic-toy",
    description: "A soft basic toy for cozy pet interaction.",
  },
];

export const weeklyCollectedDrops: WeeklyCollectedDrop[] = [
  { ...dailyDrops[0], count: 3 },
  { ...dailyDrops[2], count: 1 },
  { ...dailyDrops[4], count: 2 },
];
