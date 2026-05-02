import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { defaultPetId, getPetById, petItems, PetId } from "../data/pets";

const SELECTED_PET_STORAGE_KEY = "kinlight:selectedPetId";
const UNLOCKED_PETS_STORAGE_KEY = "kinlight:unlockedPetIds";

type PetContextValue = {
  selectedPetId: PetId;
  setSelectedPetId: (id: PetId) => void;
  unlockedPetIds: PetId[];
  unlockPet: (id: PetId) => void;
  currentPet: ReturnType<typeof getPetById>;
  petItems: typeof petItems;
};

const PetContext = createContext<PetContextValue | null>(null);

function isPetId(value: string | null): value is PetId {
  return Boolean(value && petItems.some((pet) => pet.id === value));
}

function readSelectedPetId() {
  if (typeof window === "undefined") return defaultPetId;
  const saved = window.localStorage.getItem(SELECTED_PET_STORAGE_KEY);
  return isPetId(saved) ? saved : defaultPetId;
}

function readUnlockedPetIds() {
  const defaultUnlocked = petItems.filter((pet) => pet.unlocked).map((pet) => pet.id);
  if (typeof window === "undefined") return defaultUnlocked;

  try {
    const saved = JSON.parse(window.localStorage.getItem(UNLOCKED_PETS_STORAGE_KEY) || "[]");
    const savedIds = Array.isArray(saved) ? saved.filter((id): id is PetId => isPetId(id)) : [];
    return Array.from(new Set([...defaultUnlocked, ...savedIds]));
  } catch {
    return defaultUnlocked;
  }
}

export function PetProvider({ children }: { children: ReactNode }) {
  const [selectedPetId, setSelectedPetIdState] = useState<PetId>(readSelectedPetId);
  const [unlockedPetIds, setUnlockedPetIds] = useState<PetId[]>(readUnlockedPetIds);

  useEffect(() => {
    window.localStorage.setItem(SELECTED_PET_STORAGE_KEY, selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    window.localStorage.setItem(UNLOCKED_PETS_STORAGE_KEY, JSON.stringify(unlockedPetIds));
  }, [unlockedPetIds]);

  const setSelectedPetId = (id: PetId) => {
    if (!unlockedPetIds.includes(id)) return;
    setSelectedPetIdState(id);
  };

  const unlockPet = (id: PetId) => {
    setUnlockedPetIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const currentPet = getPetById(selectedPetId);

  const value = useMemo<PetContextValue>(
    () => ({
      selectedPetId,
      setSelectedPetId,
      unlockedPetIds,
      unlockPet,
      currentPet,
      petItems,
    }),
    [selectedPetId, unlockedPetIds, currentPet]
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error("usePet must be used inside PetProvider.");
  }
  return context;
}
