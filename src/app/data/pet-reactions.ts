import type { DailyDropCategory } from "./daily-drops";

export type PetReactionCategory = DailyDropCategory;

export const petReactions: Record<PetReactionCategory, string[]> = {
  food: [
    "Yummy! Thank you! 💛",
    "That was delicious! 🐾",
    "I feel full and happy now!",
    "A tasty little treat! Love you! 💕",
  ],
  drink: [
    "So refreshing! 💧",
    "Thank you for the drink!",
    "I feel better now! 🐾",
    "A gentle drink makes me happy!",
  ],
  "basic-toy": [
    "Playtime! I love it! 🎾",
    "This is so fun! 💛",
    "Can we play again? 🐾",
    "My new toy makes me so happy!",
  ],
  care: [
    "I feel so cozy now! 🐾",
    "Thank you for taking care of me! 💛",
    "That feels nice!",
    "I feel loved and comfortable now.",
  ],
};

export function getPetReaction(category: PetReactionCategory) {
  const messages = petReactions[category];
  return messages[Math.floor(Math.random() * messages.length)] ?? "Thank you! 💛";
}
