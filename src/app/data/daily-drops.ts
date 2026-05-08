export type DailyDropCategory = "food" | "drink" | "basic-toy" | "care";

export type DailyDropPetType = "cat" | "dog" | "both";

export type DailyDrop = {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  sceneImage?: string;
  category: DailyDropCategory;
  petType: DailyDropPetType;
  description: string;
};

export type WeeklyCollectedDrop = DailyDrop & {
  count: number;
};

export const dailyDrops: DailyDrop[] = [
  // Common drops for both cats and dogs
  {
    id: "pet-biscuit",
    name: "Pet Biscuit",
    emoji: "🍪",
    image: "/images/daily-drop/both/pet-biscuit.png",
    sceneImage: "/images/daily-drop/both/pet-biscuit.png",
    category: "food",
    petType: "both",
    description: "A small everyday treat for your pet.",
  },
  {
    id: "pet-food",
    name: "Pet Food",
    emoji: "🍖",
    image: "/images/daily-drop/both/pet-food.png",
    sceneImage: "/images/daily-drop/both/pet-food.png",
    category: "food",
    petType: "both",
    description: "A familiar meal for keeping your pet happy and cared for.",
  },
  {
    id: "pet-milk",
    name: "Pet Milk",
    emoji: "🥛",
    image: "/images/daily-drop/both/pet-milk.png",
    sceneImage: "/images/daily-drop/both/pet-milk.png",
    category: "drink",
    petType: "both",
    description: "A pet-friendly milk bowl for daily care.",
  },
  {
    id: "pet-water",
    name: "Pet Water",
    emoji: "💧",
    image: "/images/daily-drop/both/pet-water.png",
    sceneImage: "/images/daily-drop/both/pet-water.png",
    category: "drink",
    petType: "both",
    description: "Fresh water for keeping your pet comfortable.",
  },
  {
    id: "small-ball",
    name: "Small Ball",
    emoji: "🟠",
    image: "/images/daily-drop/both/small-ball.png",
    sceneImage: "/images/daily-drop/both/small-ball.png",
    category: "basic-toy",
    petType: "both",
    description: "A small toy for light everyday play.",
  },

  // Cat-specific drops
  {
    id: "canned-tuna",
    name: "Canned Tuna",
    emoji: "🥫",
    image: "/images/daily-drop/cat/canned-tuna.png",
    sceneImage: "/images/daily-drop/cat/canned-tuna.png",
    category: "food",
    petType: "cat",
    description: "A small canned tuna-style treat for cats.",
  },
  {
    id: "fish-toy",
    name: "Fish Toy",
    emoji: "🐟",
    image: "/images/daily-drop/cat/fish-toy.png",
    sceneImage: "/images/daily-drop/cat/fish-toy.png",
    category: "basic-toy",
    petType: "cat",
    description: "A playful fish-shaped toy for curious cat moments.",
  },

  // Dog-specific drops
  {
    id: "chew-toy",
    name: "Chew Toy",
    emoji: "🪢",
    image: "/images/daily-drop/dog/chew-toy.png",
    sceneImage: "/images/daily-drop/dog/chew-toy.png",
    category: "basic-toy",
    petType: "dog",
    description: "A small toy for everyday dog play.",
  },
  {
    id: "plush-bear",
    name: "Plush Bear",
    emoji: "🧸",
    image: "/images/daily-drop/dog/plush-bear.png",
    sceneImage: "/images/daily-drop/dog/plush-bear.png",
    category: "basic-toy",
    petType: "dog",
    description: "A soft plush toy for gentle puppy play.",
  },
  {
    id: "small-bone",
    name: "Small Bone",
    emoji: "🦴",
    image: "/images/daily-drop/dog/small-bone.png",
    sceneImage: "/images/daily-drop/dog/small-bone.png",
    category: "food",
    petType: "dog",
    description: "A small treat for playful puppies.",
  },
];

export const getDailyDropsForPet = (petType: Exclude<DailyDropPetType, "both">) => {
  return dailyDrops.filter((drop) => drop.petType === "both" || drop.petType === petType);
};

export const weeklyCollectedDrops: WeeklyCollectedDrop[] = [
  { ...dailyDrops.find((drop) => drop.id === "pet-biscuit")!, count: 3 },
  { ...dailyDrops.find((drop) => drop.id === "pet-milk")!, count: 1 },
  { ...dailyDrops.find((drop) => drop.id === "small-ball")!, count: 2 },
];
