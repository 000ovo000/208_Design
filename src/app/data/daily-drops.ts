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
    category: "food",
    petType: "both",
    description: "A small everyday treat for your pet.",
  },
  {
    id: "pet-milk",
    name: "Pet Milk",
    emoji: "🥛",
    category: "drink",
    petType: "both",
    description: "A pet-friendly milk bowl for daily care.",
  },
  {
    id: "water-bowl",
    name: "Water Bowl",
    emoji: "💧",
    category: "drink",
    petType: "both",
    description: "A simple water bowl for keeping your pet comfortable.",
  },
  {
    id: "small-ball",
    name: "Small Ball",
    emoji: "🟠",
    category: "basic-toy",
    petType: "both",
    description: "A small toy for light everyday play.",
  },
  {
    id: "crunchy-kibble",
    name: "Crunchy Kibble",
    emoji: "🥣",
    category: "food",
    petType: "both",
    description: "A simple bowl of pet food for everyday care.",
  },
  {
    id: "pet-brush",
    name: "Pet Brush",
    emoji: "🪮",
    category: "care",
    petType: "both",
    description: "A small care item for keeping your pet neat and comfortable.",
  },
  {
    id: "pet-bandana",
    name: "Pet Bandana",
    emoji: "🧣",
    category: "care",
    petType: "both",
    description: "A soft little bandana that adds a cozy touch to your pet.",
  },

  // Cat-specific drops
  {
    id: "fish-snack",
    name: "Fish Snack",
    emoji: "🐟",
    category: "food",
    petType: "cat",
    description: "A small pet-friendly fish snack for cats.",
  },
  {
    id: "yarn-ball",
    name: "Yarn Ball",
    emoji: "🧶",
    category: "basic-toy",
    petType: "cat",
    description: "A soft basic toy for cozy cat interaction.",
  },
  {
    id: "feather-toy",
    name: "Feather Toy",
    emoji: "🪶",
    category: "basic-toy",
    petType: "cat",
    description: "A light toy for gentle everyday cat play.",
  },
  {
    id: "cat-kibble",
    name: "Cat Kibble",
    emoji: "🥣",
    category: "food",
    petType: "cat",
    description: "A small bowl of everyday cat food.",
  },
  {
    id: "tuna-bite",
    name: "Tuna Bite",
    emoji: "🥫",
    category: "food",
    petType: "cat",
    description: "A small canned tuna-style treat for cats.",
  },
  {
    id: "toy-mouse",
    name: "Toy Mouse",
    emoji: "🐭",
    category: "basic-toy",
    petType: "cat",
    description: "A small toy mouse for gentle cat play.",
  },
  {
    id: "jingle-bell",
    name: "Jingle Bell",
    emoji: "🔔",
    category: "basic-toy",
    petType: "cat",
    description: "A tiny bell toy for curious cat moments.",
  },
  {
    id: "scratching-pad",
    name: "Scratching Pad",
    emoji: "🧩",
    category: "basic-toy",
    petType: "cat",
    description: "A simple scratching pad for everyday cat comfort.",
  },

  // Dog-specific drops
  {
    id: "small-bone",
    name: "Small Bone",
    emoji: "🦴",
    category: "food",
    petType: "dog",
    description: "A small treat for playful puppies.",
  },
  {
    id: "chew-toy",
    name: "Chew Toy",
    emoji: "🪢",
    category: "basic-toy",
    petType: "dog",
    description: "A small rope toy for everyday dog play.",
  },
  {
    id: "tennis-ball",
    name: "Tennis Ball",
    emoji: "🎾",
    category: "basic-toy",
    petType: "dog",
    description: "A simple ball for active puppy moments.",
  },
  {
    id: "puppy-kibble",
    name: "Puppy Kibble",
    emoji: "🥣",
    category: "food",
    petType: "dog",
    description: "A small bowl of everyday puppy food.",
  },
  {
    id: "chicken-bite",
    name: "Chicken Bite",
    emoji: "🍗",
    category: "food",
    petType: "dog",
    description: "A tiny pet-friendly chicken treat for dogs.",
  },
  {
    id: "carrot-nibble",
    name: "Carrot Nibble",
    emoji: "🥕",
    category: "food",
    petType: "dog",
    description: "A light crunchy nibble for everyday dog care.",
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
