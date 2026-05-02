export type PetSpecies = "dog" | "cat";

export type PetId =
  | "white-puppy"
  | "corgi-puppy"
  | "golden-puppy"
  | "shiba-puppy"
  | "dachshund-puppy"
  | "beagle-puppy"
  | "white-kitten"
  | "maine-coon-kitten"
  | "orange-kitten"
  | "siamese-kitten";

export type PetItem = {
  id: PetId;
  name: string;
  species: PetSpecies;
  image: string;
  unlocked: boolean;
  description: string;
};

export const defaultPetId: PetId = "white-puppy";

export const petItems: PetItem[] = [
  {
    id: "white-puppy",
    name: "White Puppy",
    species: "dog",
    description: "Your first family puppy.",
    image: "/images/dog/dog-white.png",
    unlocked: true,
  },
  {
    id: "corgi-puppy",
    name: "Corgi Puppy",
    species: "dog",
    description: "Unlocked from shared family moments.",
    image: "/images/dog/Corgi.png",
    unlocked: true,
  },
  {
    id: "golden-puppy",
    name: "Golden Puppy",
    species: "dog",
    description: "A bright puppy for warm shared moments.",
    image: "/images/dog/Golden.png",
    unlocked: true,
  },
  {
    id: "shiba-puppy",
    name: "Shiba Puppy",
    species: "dog",
    description: "Locked. Can be unlocked in Weekly Echo.",
    image: "/images/dog/Shiba.png",
    unlocked: false,
  },
  {
    id: "dachshund-puppy",
    name: "Dachshund Puppy",
    species: "dog",
    description: "Locked. Can be unlocked by family reactions.",
    image: "/images/dog/lachang.png",
    unlocked: false,
  },
  {
    id: "beagle-puppy",
    name: "Beagle Puppy",
    species: "dog",
    description: "Locked. Can be unlocked by family reactions.",
    image: "/images/dog/bige.png",
    unlocked: false,
  },
  {
    id: "white-kitten",
    name: "White Kitten",
    species: "cat",
    description: "A gentle basic kitten for quiet company.",
    image: "/images/cat/white-cat-lying.png",
    unlocked: true,
  },
  {
    id: "maine-coon-kitten",
    name: "Maine Coon Kitten",
    species: "cat",
    description: "A fluffy kitten unlocked from shared family moments.",
    image: "/images/cat/mianyin.png",
    unlocked: true,
  },
  {
    id: "orange-kitten",
    name: "Orange Kitten",
    species: "cat",
    description: "A warm little kitten unlocked by family reactions.",
    image: "/images/cat/jumao.png",
    unlocked: true,
  },
  {
    id: "siamese-kitten",
    name: "Siamese Kitten",
    species: "cat",
    description: "A calm kitten that can appear in Weekly Echo.",
    image: "/images/cat/xianluo.png",
    unlocked: true,
  },
];

export function getPetById(id: PetId) {
  return petItems.find((pet) => pet.id === id) ?? petItems[0];
}
