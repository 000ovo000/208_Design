import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dailyDrops, type DailyDrop } from "../data/daily-drops";
import { defaultPetId, getPetById, petItems, PetId } from "../data/pets";
import {
  findWeeklyRewardByItemIdentity,
  weeklyRewards,
  type WeeklyReward,
} from "../data/weekly-rewards";
import { apiUrl } from "../lib/api";

const SELECTED_PET_STORAGE_KEY = "selectedPetId";
const UNLOCKED_PETS_STORAGE_KEY = "unlockedPetIds";
const GUEST_SCOPE = "guest";

export type DailyDropInventory = Record<string, number>;
export type WeeklyRewardInventory = Record<string, number>;

type ActiveWeeklyRewardSlot = "room-decor";

type BackendItem = {
  id: number;
  name: string;
  category?: string | null;
  icon?: string | null;
};

type BackendOwnedItem = {
  item_id: number;
  name?: string | null;
  category?: string | null;
  icon?: string | null;
  quantity: number;
};

type BackendActiveItem = {
  id: number;
  item_id: number;
  slot: ActiveWeeklyRewardSlot;
  activated_at?: string;
  name?: string | null;
  category?: string | null;
  icon?: string | null;
};

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
  weeklyRewardInventory: WeeklyRewardInventory;
  ownedWeeklyRewards: WeeklyReward[];
  activeWeeklyRewardIds: string[];
  activeWeeklyRewards: WeeklyReward[];
  addWeeklyRewardToInventory: (rewardId: string) => Promise<boolean>;
  useWeeklyRewardItem: (rewardId: string) => Promise<WeeklyReward | null>;
  clearWeeklyRewardItem: (rewardId: string) => Promise<boolean>;
  isWeeklyRewardOwned: (rewardId: string) => boolean;
  isWeeklyRewardActive: (rewardId: string) => boolean;
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

function getWeeklyRewardById(rewardId: string) {
  return weeklyRewards.find((reward) => reward.id === rewardId) ?? null;
}

function buildRewardItemMaps(items: BackendItem[] = []) {
  const rewardItemIdByRewardId: Record<string, number> = {};
  const rewardByItemId = new Map<number, WeeklyReward>();

  items.forEach((item) => {
    const reward = findWeeklyRewardByItemIdentity({ name: item.name });
    if (!reward) return;
    rewardItemIdByRewardId[reward.id] = item.id;
    rewardByItemId.set(item.id, reward);
  });

  return { rewardItemIdByRewardId, rewardByItemId };
}

async function resolveRewardBackendItemId(
  rewardId: string,
  currentMap: Record<string, number>
) {
  if (currentMap[rewardId]) {
    return {
      itemId: currentMap[rewardId],
      rewardMap: currentMap,
    };
  }

  const itemsRes = await fetch(apiUrl("/api/items"));
  if (!itemsRes.ok) {
    return {
      itemId: null,
      rewardMap: currentMap,
    };
  }

  const items: BackendItem[] = await itemsRes.json();
  const { rewardItemIdByRewardId: rewardMap } = buildRewardItemMaps(items);

  return {
    itemId: rewardMap[rewardId] ?? null,
    rewardMap,
  };
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
  const [weeklyRewardInventory, setWeeklyRewardInventory] = useState<WeeklyRewardInventory>({});
  const [activeWeeklyRewardIds, setActiveWeeklyRewardIds] = useState<string[]>([]);
  const [rewardItemIdByRewardId, setRewardItemIdByRewardId] = useState<Record<string, number>>({});

  useEffect(() => {
    setSelectedPetIdState(readSelectedPetId(userScope));
    setUnlockedPetIds(readUnlockedPetIds(userScope));
    setPlacedDailyDropIds([]);
    setWeeklyRewardInventory({});
    setActiveWeeklyRewardIds([]);
    setRewardItemIdByRewardId({});
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

  const syncInventory = useCallback(async () => {
    try {
      const [itemsRes, myItemsRes, activeItemsRes] = await Promise.all([
        fetch(apiUrl("/api/items")),
        fetch(apiUrl("/api/my-items")),
        fetch(apiUrl("/api/my-items/active")),
      ]);

      if (!itemsRes.ok || !myItemsRes.ok) {
        throw new Error("Failed to load inventory.");
      }

      const items: BackendItem[] = await itemsRes.json();
      const myItems: BackendOwnedItem[] = await myItemsRes.json();
      const activeItems: BackendActiveItem[] = activeItemsRes.ok ? await activeItemsRes.json() : [];

      const itemIdByName = new Map(items.map((item) => [item.name, item.id]));
      const qtyByItemId = new Map(
        myItems.map((item) => [item.item_id, item.quantity])
      );
      const nextDailyDropInventory: DailyDropInventory = {};
      dailyDrops.forEach((drop) => {
        const itemId = itemIdByName.get(drop.name);
        if (!itemId) return;
        nextDailyDropInventory[drop.id] = qtyByItemId.get(itemId) ?? 0;
      });

      const { rewardItemIdByRewardId: rewardMap, rewardByItemId } = buildRewardItemMaps(items);
      const nextWeeklyRewardInventory: WeeklyRewardInventory = {};

      myItems.forEach((item) => {
        const reward =
          rewardByItemId.get(item.item_id) ??
          findWeeklyRewardByItemIdentity({ name: item.name ?? null });
        if (!reward) return;
        rewardMap[reward.id] = item.item_id;
        nextWeeklyRewardInventory[reward.id] = item.quantity;
      });

      const nextActiveWeeklyRewardIds = activeItems
        .map((item) => {
          const reward =
            rewardByItemId.get(item.item_id) ??
            findWeeklyRewardByItemIdentity({ name: item.name ?? null });
          if (!reward) return null;
          rewardMap[reward.id] = item.item_id;
          return reward.id;
        })
        .filter((rewardId): rewardId is string => Boolean(rewardId));

      setDailyDropInventory(nextDailyDropInventory);
      setWeeklyRewardInventory(nextWeeklyRewardInventory);
      setActiveWeeklyRewardIds(Array.from(new Set(nextActiveWeeklyRewardIds)));
      setRewardItemIdByRewardId(rewardMap);
    } catch {
      setDailyDropInventory({});
      setWeeklyRewardInventory({});
      setActiveWeeklyRewardIds([]);
      setRewardItemIdByRewardId({});
    }
  }, []);

  useEffect(() => {
    void syncInventory();
  }, [syncInventory, userScope]);

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

  const addWeeklyRewardToInventory = useCallback(
    async (rewardId: string) => {
      const reward = getWeeklyRewardById(rewardId);
      if (!reward) return false;
      if ((weeklyRewardInventory[reward.id] ?? 0) > 0) return true;

      try {
        const { itemId, rewardMap } = await resolveRewardBackendItemId(reward.id, rewardItemIdByRewardId);
        if (!itemId) return false;
        setRewardItemIdByRewardId((prev) => ({ ...prev, ...rewardMap }));

        const addRes = await fetch(apiUrl("/api/my-items"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId, quantity: 1 }),
        });
        if (!addRes.ok) return false;
      } catch {
        return false;
      }

      setWeeklyRewardInventory((prev) => ({
        ...prev,
        [reward.id]: Math.max(prev[reward.id] ?? 0, 1),
      }));
      return true;
    },
    [rewardItemIdByRewardId, weeklyRewardInventory]
  );

  const useWeeklyRewardItem = useCallback(
    async (rewardId: string) => {
      const reward = getWeeklyRewardById(rewardId);
      if (!reward || (weeklyRewardInventory[reward.id] ?? 0) <= 0) return null;

      try {
        const { itemId, rewardMap } = await resolveRewardBackendItemId(reward.id, rewardItemIdByRewardId);
        if (!itemId) return null;
        setRewardItemIdByRewardId((prev) => ({ ...prev, ...rewardMap }));

        const activeRes = await fetch(apiUrl("/api/my-items/active"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId, active: true, slot: "room-decor" }),
        });
        if (!activeRes.ok) return null;
      } catch {
        return null;
      }

      setActiveWeeklyRewardIds([reward.id]);
      return reward;
    },
    [rewardItemIdByRewardId, syncInventory, weeklyRewardInventory]
  );

  const clearWeeklyRewardItem = useCallback(
    async (rewardId: string) => {
      const reward = getWeeklyRewardById(rewardId);
      if (!reward) return false;

      try {
        const { itemId, rewardMap } = await resolveRewardBackendItemId(reward.id, rewardItemIdByRewardId);
        if (!itemId) return false;
        setRewardItemIdByRewardId((prev) => ({ ...prev, ...rewardMap }));

        const activeRes = await fetch(apiUrl("/api/my-items/active"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId, active: false, slot: "room-decor" }),
        });
        if (!activeRes.ok) return false;
      } catch {
        return false;
      }

      setActiveWeeklyRewardIds((prev) => prev.filter((id) => id !== reward.id));
      return true;
    },
    [rewardItemIdByRewardId]
  );

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
  const ownedWeeklyRewards = useMemo(
    () =>
      weeklyRewards.filter((reward) => (weeklyRewardInventory[reward.id] ?? 0) > 0),
    [weeklyRewardInventory]
  );
  const activeWeeklyRewards = useMemo(
    () =>
      activeWeeklyRewardIds
        .map((rewardId) => getWeeklyRewardById(rewardId))
        .filter((reward): reward is WeeklyReward => Boolean(reward)),
    [activeWeeklyRewardIds]
  );

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
      weeklyRewardInventory,
      ownedWeeklyRewards,
      activeWeeklyRewardIds,
      activeWeeklyRewards,
      addWeeklyRewardToInventory,
      useWeeklyRewardItem,
      clearWeeklyRewardItem,
      isWeeklyRewardOwned: (rewardId: string) => (weeklyRewardInventory[rewardId] ?? 0) > 0,
      isWeeklyRewardActive: (rewardId: string) => activeWeeklyRewardIds.includes(rewardId),
    }),
    [
      selectedPetId,
      unlockedPetIds,
      currentPet,
      dailyDropInventory,
      lastPlacedDailyDrop,
      placedDailyDrops,
      weeklyRewardInventory,
      ownedWeeklyRewards,
      activeWeeklyRewardIds,
      activeWeeklyRewards,
      addWeeklyRewardToInventory,
      useWeeklyRewardItem,
      clearWeeklyRewardItem,
    ]
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
