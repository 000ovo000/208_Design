import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dailyDrops, type DailyDrop } from "../data/daily-drops";
import { defaultPetId, getPetById, petItems, PetId } from "../data/pets";

const SELECTED_PET_STORAGE_KEY = "kinlight:selectedPetId";
const UNLOCKED_PETS_STORAGE_KEY = "kinlight:unlockedPetIds";

export type DailyDropInventory = Record<string, number>;

const defaultDailyDropInventory: DailyDropInventory = {
  "pet-biscuit": 2,
  "pet-milk": 1,
  "small-ball": 1,
};

type PetContextValue = {
  selectedPetId: PetId;
  setSelectedPetId: (id: PetId) => void;
  unlockedPetIds: PetId[];
  unlockPet: (id: PetId) => void;
  currentPet: ReturnType<typeof getPetById>;
  petItems: typeof petItems;
  dailyDropInventory: DailyDropInventory;
  addDailyDropToInventory: (dropId: string, amount?: number) => void;
  useDailyDropItem: (dropId: string) => DailyDrop | null;
  getDailyDropCount: (dropId: string) => number;
  lastPlacedDailyDrop: DailyDrop | null;
  clearLastPlacedDailyDrop: () => void;
};

const PetContext = createContext<PetContextValue | null>(null);

function isPetId(value: string | null): value is PetId {
  return Boolean(value && petItems.some((pet) => pet.id === value));
}

function isDailyDropId(value: string | null) {
  return Boolean(value && dailyDrops.some((drop) => drop.id === value));
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

  // Daily drop inventory is intentionally kept in memory only for easier debugging.
  // Refreshing the page resets the inventory and the last placed item.
  const [dailyDropInventory, setDailyDropInventory] =
    useState<DailyDropInventory>(defaultDailyDropInventory);
  const [lastPlacedDailyDropId, setLastPlacedDailyDropId] = useState<string | null>(null);

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

  const addDailyDropToInventory = (dropId: string, amount = 1) => {
    if (!isDailyDropId(dropId) || amount <= 0) return;
    setDailyDropInventory((prev) => ({
      ...prev,
      [dropId]: (prev[dropId] ?? 0) + amount,
    }));
  };

  const useDailyDropItem = (dropId: string) => {
    const drop = dailyDrops.find((item) => item.id === dropId) ?? null;
    if (!drop || (dailyDropInventory[dropId] ?? 0) <= 0) return null;

    setDailyDropInventory((prev) => ({
      ...prev,
      [dropId]: Math.max((prev[dropId] ?? 0) - 1, 0),
    }));
    setLastPlacedDailyDropId(dropId);
    return drop;
  };

  const getDailyDropCount = (dropId: string) => dailyDropInventory[dropId] ?? 0;

  const currentPet = getPetById(selectedPetId);
  const lastPlacedDailyDrop =
    dailyDrops.find((drop) => drop.id === lastPlacedDailyDropId) ?? null;

  const value = useMemo<PetContextValue>(
    () => ({
      selectedPetId,
      setSelectedPetId,
      unlockedPetIds,
      unlockPet,
      currentPet,
      petItems,
      dailyDropInventory,
      addDailyDropToInventory,
      useDailyDropItem,
      getDailyDropCount,
      lastPlacedDailyDrop,
      clearLastPlacedDailyDrop: () => setLastPlacedDailyDropId(null),
    }),
    [selectedPetId, unlockedPetIds, currentPet, dailyDropInventory, lastPlacedDailyDrop]
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
