import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dailyDrops, type DailyDrop } from "../data/daily-drops";
import { defaultPetId, getPetById, petItems, PetId } from "../data/pets";
import { apiUrl } from "../lib/api";

const SELECTED_PET_STORAGE_KEY = "selectedPetId";
const UNLOCKED_PETS_STORAGE_KEY = "unlockedPetIds";
const GUEST_SCOPE = "guest";

export type DailyDropInventory = Record<string, number>;

type PetContextValue = {
  selectedPetId: PetId;
  setSelectedPetId: (id: PetId) => void;
  unlockedPetIds: PetId[];
  unlockPet: (id: PetId) => void;
  currentPet: ReturnType<typeof getPetById>;
  petItems: typeof petItems;
  dailyDropInventory: DailyDropInventory;
  addDailyDropToInventory: (dropId: string, amount?: number) => Promise<boolean>;
  useDailyDropItem: (dropId: string) => Promise<DailyDrop | null>;
  getDailyDropCount: (dropId: string) => number;
  lastPlacedDailyDrop: DailyDrop | null;
  placedDailyDrops: DailyDrop[];
  clearPlacedDailyDrop: (dropId: string) => void;
  clearLastPlacedDailyDrop: () => void;
};

const PetContext = createContext<PetContextValue | null>(null);

function isPetId(value: string | null): value is PetId {
  return Boolean(value && petItems.some((pet) => pet.id === value));
}

function isDailyDropId(value: string | null) {
  return Boolean(value && dailyDrops.some((drop) => drop.id === value));
}

function getUserScopedKey(baseKey: string, userId: string) {
  return `kinlight:${baseKey}:${userId}`;
}

function readSelectedPetId(userId: string) {
  if (typeof window === "undefined") return defaultPetId;
  const saved = window.localStorage.getItem(
    getUserScopedKey(SELECTED_PET_STORAGE_KEY, userId)
  );
  return isPetId(saved) ? saved : defaultPetId;
}

function readUnlockedPetIds(userId: string) {
  const defaultUnlocked = petItems.filter((pet) => pet.unlocked).map((pet) => pet.id);
  if (typeof window === "undefined") return defaultUnlocked;

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(getUserScopedKey(UNLOCKED_PETS_STORAGE_KEY, userId)) || "[]"
    );
    const savedIds = Array.isArray(saved) ? saved.filter((id): id is PetId => isPetId(id)) : [];
    return Array.from(new Set([...defaultUnlocked, ...savedIds]));
  } catch {
    return defaultUnlocked;
  }
}

export function PetProvider({
  children,
  currentUserId,
}: {
  children: ReactNode;
  currentUserId?: string | number | null;
}) {
  const userScope = currentUserId != null ? String(currentUserId) : GUEST_SCOPE;
  const defaultUnlocked = useMemo(
    () => petItems.filter((pet) => pet.unlocked).map((pet) => pet.id),
    []
  );
  const [selectedPetId, setSelectedPetIdState] = useState<PetId>(defaultPetId);
  const [unlockedPetIds, setUnlockedPetIds] = useState<PetId[]>(defaultUnlocked);

  const [dailyDropInventory, setDailyDropInventory] = useState<DailyDropInventory>({});
  const [placedDailyDropIds, setPlacedDailyDropIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPetIdState(readSelectedPetId(userScope));
    setUnlockedPetIds(readUnlockedPetIds(userScope));
    setPlacedDailyDropIds([]);
  }, [userScope]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      getUserScopedKey(SELECTED_PET_STORAGE_KEY, userScope),
      selectedPetId
    );
  }, [selectedPetId, userScope]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      getUserScopedKey(UNLOCKED_PETS_STORAGE_KEY, userScope),
      JSON.stringify(unlockedPetIds)
    );
  }, [unlockedPetIds, userScope]);

  const setSelectedPetId = (id: PetId) => {
    if (!unlockedPetIds.includes(id)) return;
    setSelectedPetIdState(id);
  };

  const unlockPet = (id: PetId) => {
    setUnlockedPetIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  useEffect(() => {
    const syncInventory = async () => {
      try {
        const [itemsRes, myItemsRes] = await Promise.all([
          fetch(apiUrl("/api/items")),
          fetch(apiUrl("/api/my-items")),
        ]);
        if (!itemsRes.ok || !myItemsRes.ok) return;
        const items = await itemsRes.json();
        const myItems = await myItemsRes.json();
        const itemIdByName = new Map(
          items.map((item: { id: number; name: string }) => [item.name, item.id])
        );
        const qtyByItemId = new Map(
          myItems.map((item: { item_id: number; quantity: number }) => [item.item_id, item.quantity])
        );
        const next: DailyDropInventory = {};
        dailyDrops.forEach((drop) => {
          const itemId = itemIdByName.get(drop.name);
          if (!itemId) return;
          next[drop.id] = qtyByItemId.get(itemId) ?? 0;
        });
        setDailyDropInventory(next);
      } catch {
        setDailyDropInventory({});
      }
    };
    syncInventory();
  }, [userScope]);

  const addDailyDropToInventory = async (dropId: string, amount = 1) => {
    if (!isDailyDropId(dropId) || amount <= 0) return false;
    const drop = dailyDrops.find((item) => item.id === dropId);
    if (!drop) return false;

    try {
      const itemsRes = await fetch(apiUrl("/api/items"));
      if (!itemsRes.ok) return false;
      const items = await itemsRes.json();
      const item = items.find((entry: { name: string }) => entry.name === drop.name);
      if (!item?.id) return false;

      const addRes = await fetch(apiUrl("/api/my-items"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, quantity: amount }),
      });
      if (!addRes.ok) return false;
    } catch (error) {
      return false;
    }

    setDailyDropInventory((prev) => ({
      ...prev,
      [dropId]: (prev[dropId] ?? 0) + amount,
    }));
    return true;
  };

  const useDailyDropItem = async (dropId: string) => {
    const drop = dailyDrops.find((item) => item.id === dropId) ?? null;
    if (!drop || (dailyDropInventory[dropId] ?? 0) <= 0) return null;

    try {
      const itemsRes = await fetch(apiUrl("/api/items"));
      if (!itemsRes.ok) return null;
      const items = await itemsRes.json();
      const item = items.find((entry: { name: string }) => entry.name === drop.name);
      if (!item?.id) return null;

      const useRes = await fetch(apiUrl("/api/my-items/use"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, quantity: 1 }),
      });
      if (!useRes.ok) return null;
    } catch (error) {
      return null;
    }

    setDailyDropInventory((prev) => ({
      ...prev,
      [dropId]: Math.max((prev[dropId] ?? 0) - 1, 0),
    }));
    setPlacedDailyDropIds((prev) => (prev.includes(dropId) ? prev : [...prev, dropId]));
    return drop;
  };

  const getDailyDropCount = (dropId: string) => dailyDropInventory[dropId] ?? 0;

  const currentPet = getPetById(selectedPetId);
  const placedDailyDrops = useMemo(
    () =>
      placedDailyDropIds
        .map((dropId) => dailyDrops.find((drop) => drop.id === dropId) ?? null)
        .filter((drop): drop is DailyDrop => Boolean(drop)),
    [placedDailyDropIds]
  );
  const lastPlacedDailyDrop =
    placedDailyDrops[placedDailyDrops.length - 1] ?? null;
  const clearPlacedDailyDrop = useCallback((dropId: string) => {
    setPlacedDailyDropIds((prev) => prev.filter((id) => id !== dropId));
  }, []);

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
      placedDailyDrops,
      clearPlacedDailyDrop,
      clearLastPlacedDailyDrop: () => setPlacedDailyDropIds([]),
    }),
    [selectedPetId, unlockedPetIds, currentPet, dailyDropInventory, lastPlacedDailyDrop, placedDailyDrops]
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
