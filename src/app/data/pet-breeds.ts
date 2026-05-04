export type PetBreed = {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  description: string;
};

export const petBreeds: PetBreed[] = [
  {
    id: "orange-cat",
    name: "Orange Cat",
    emoji: "🐈",
    description: "A cheerful new companion for warm family weeks.",
  },
  {
    id: "ragdoll-cat",
    name: "Ragdoll Cat",
    emoji: "🐱",
    description: "A gentle companion unlocked through steady family contact.",
  },
  {
    id: "siamese-cat",
    name: "Siamese Cat",
    emoji: "🐈‍⬛",
    description: "A calm companion for thoughtful weekly echoes.",
  },
  {
    id: "black-cat",
    name: "Black Cat",
    emoji: "🐈‍⬛",
    description: "A quiet companion for cozy shared moments.",
  },
  {
    id: "samoyed",
    name: "Samoyed",
    emoji: "🐶",
    description: "A bright companion for a week full of warm responses.",
  },
];
