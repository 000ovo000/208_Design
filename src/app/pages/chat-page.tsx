import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { motion } from "motion/react";
import { usePet } from "../context/pet-context";
import {
  dailyDrops,
  getDailyDropsForPet,
  type DailyDrop,
} from "../data/daily-drops";
import { getFamilySelectedPetId } from "../data/family-data";
import { getPetById, getPetProfileImage } from "../data/pets";
import { getPetReaction } from "../data/pet-reactions";
import type { WeeklyReward } from "../data/weekly-rewards";
import { AlbumEntry, FamilyMember, FamilyMemberId } from "../types";

interface ChatPageProps {
  familyMembers: FamilyMember[];
  latestEntries: Record<FamilyMemberId, AlbumEntry | null>;
  bubbleMessage: string;
  weeklyKeepsakes: WeeklyReward[];
}

type InventoryTab = "shop" | "food" | "toy";
type DailyDropState = "available" | "claiming" | "claimed";
type StorageArea = "food" | "toy";

const inventoryTabs: { key: InventoryTab; label: string; title: string; emoji: string }[] = [
  { key: "shop", label: "Shop", title: "Pet Collection", emoji: "🛍️" },
  { key: "food", label: "Food", title: "Food Storage", emoji: "🍪" },
  { key: "toy", label: "Toys", title: "Toy Box", emoji: "🎾" },
];

const getPetSpeakerLabel = (member: FamilyMember) => `${member.name}'s pet`;

const getStorageArea = (drop: DailyDrop): StorageArea => {
  return drop.category === "food" || drop.category === "drink" ? "food" : "toy";
};

const pickRandomDrop = (drops: DailyDrop[]) => {
  return drops[Math.floor(Math.random() * drops.length)] ?? dailyDrops[0];
};

export function ChatPage({
  familyMembers,
  latestEntries,
  bubbleMessage,
  weeklyKeepsakes,
}: ChatPageProps) {
  const {
    selectedPetId,
    setSelectedPetId,
    unlockedPetIds,
    currentPet,
    petItems,
    addDailyDropToInventory,
    useDailyDropItem,
    getDailyDropCount,
    lastPlacedDailyDrop,
  } = usePet();

  const [selectedFamilyDog, setSelectedFamilyDog] =
    useState<FamilyMemberId>("me");
  const [activeInventory, setActiveInventory] = useState<InventoryTab | null>(null);
  const [dailyDropState, setDailyDropState] = useState<DailyDropState>("available");
  const [collectedMessage, setCollectedMessage] = useState("");
  const [storageDot, setStorageDot] = useState<Record<StorageArea, boolean>>({
    food: false,
    toy: false,
  });
  const [storagePulse, setStoragePulse] = useState<StorageArea | null>(null);
  const [petFeedback, setPetFeedback] = useState("Your companion is waiting for a small family moment.");

  const me =
    familyMembers.find((member) => member.id === "me") ?? familyMembers[0];

  const parentMembers = familyMembers.filter((member) => member.id !== "me");

  const selectedMember =
    familyMembers.find((member) => member.id === selectedFamilyDog) ?? me;

  const selectedBubble =
    selectedFamilyDog === "me"
      ? bubbleMessage
      : latestEntries[selectedFamilyDog]?.dogMessage?.trim() ||
        "No message yet.";

  const selectedBubbleSpeaker = getPetSpeakerLabel(selectedMember);

  const availableDailyDrops = useMemo(() => {
    return getDailyDropsForPet(currentPet.species);
  }, [currentPet.species]);

  const [todayDrop, setTodayDrop] = useState<DailyDrop>(() =>
    pickRandomDrop(getDailyDropsForPet(currentPet.species))
  );

  useEffect(() => {
    setTodayDrop(pickRandomDrop(availableDailyDrops));
    setDailyDropState("available");
    setCollectedMessage("");
  }, [availableDailyDrops]);

  const foodInventory = useMemo(
    () =>
      dailyDrops.filter(
        (drop) =>
          (drop.category === "food" || drop.category === "drink") &&
          getDailyDropCount(drop.id) > 0
      ),
    [getDailyDropCount]
  );

  const toyInventory = useMemo(
    () =>
      dailyDrops.filter(
        (drop) =>
          (drop.category === "basic-toy" || drop.category === "care") &&
          getDailyDropCount(drop.id) > 0
      ),
    [getDailyDropCount]
  );

  const activeInventoryTitle = inventoryTabs.find(
    (item) => item.key === activeInventory
  )?.title;

  const openInventory = (tab: InventoryTab) => {
    setActiveInventory(tab);

    if (tab === "food" || tab === "toy") {
      setStorageDot((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const claimDailyDrop = () => {
    if (dailyDropState !== "available") return;

    setDailyDropState("claiming");

    window.setTimeout(() => {
      const storageArea = getStorageArea(todayDrop);
      addDailyDropToInventory(todayDrop.id, 1);
      setDailyDropState("claimed");
      setCollectedMessage(`${todayDrop.name} +1`);
      window.setTimeout(() => {
        setCollectedMessage("");
      }, 2000);
      setStorageDot((prev) => ({ ...prev, [storageArea]: true }));
      setStoragePulse(storageArea);
      setPetFeedback(`Collected ${todayDrop.name} +1. Check your ${storageArea === "food" ? "Food Storage" : "Toy Box"}.`);

      window.setTimeout(() => {
        setStoragePulse(null);
      }, 1200);
    }, 520);
  };

  const useDrop = (drop: DailyDrop) => {
    const usedDrop = useDailyDropItem(drop.id);
    if (!usedDrop) return;

    setPetFeedback(getPetReaction(usedDrop.category));
    setActiveInventory(null);
  };

  const choosePet = (petId: typeof petItems[number]["id"]) => {
    const pet = petItems.find((item) => item.id === petId);
    if (!pet || !unlockedPetIds.includes(pet.id)) return;
    setSelectedPetId(pet.id);
    setPetFeedback(`${me.name}'s pet changed into ${pet.name}.`);
  };

  const renderDropIcon = (drop: DailyDrop, sizeClass = "h-11 w-11") => {
    if (drop.image) {
      return (
        <img
          src={drop.image}
          alt=""
          className={`${sizeClass} object-contain`}
        />
      );
    }

    return (
      <span className="text-xl leading-none" aria-hidden="true">
        {drop.emoji}
      </span>
    );
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f4ede4]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/home/home-bg.png')",
        }}
      />

      <div className="relative flex flex-1 flex-col px-3 pt-4 pb-24">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9f8067]">
              Home
            </p>
            <h1 className="mt-2 text-[17px] font-semibold text-[#3d2d22]">
              Let your pet carry small family moments.
            </h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#7d6554] shadow-[0_8px_18px_rgba(97,74,56,0.08)] backdrop-blur">
            <Bell className="h-5 w-5" />
          </div>
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-3">
            {parentMembers.map((member) => {
              const isActive = selectedFamilyDog === member.id;
              const familyPet = getPetById(getFamilySelectedPetId(member.id));

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedFamilyDog(member.id)}
                  className={`w-[72px] rounded-2xl px-0 py-1 text-center transition ${
                    isActive ? "bg-white/55 shadow-[0_8px_18px_rgba(97,74,56,0.08)]" : ""
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold text-[#5a4433]">
                    {member.name}
                  </p>

                  <div className="mx-auto flex w-fit items-center justify-center">
                    <img
                      src={getPetProfileImage(familyPet)}
                      alt={`${member.name}'s pet`}
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="w-[74px] px-1 py-1">
            <div className="flex flex-col gap-3">
              {inventoryTabs.map((item) => {
                const hasDot = item.key === "food" || item.key === "toy" ? storageDot[item.key] : false;
                const isPulsing = item.key === storagePulse;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openInventory(item.key)}
                    className="relative text-center transition active:scale-95"
                  >
                    <div
                      className={`mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-[#fbf6f1] shadow-[0_8px_18px_rgba(97,74,56,0.1)] transition ${
                        isPulsing ? "scale-110 ring-2 ring-[#f0a35f]/50" : ""
                      }`}
                    >
                      <span className="text-2xl leading-none" aria-hidden="true">
                        {item.emoji}
                      </span>
                    </div>

                    {(hasDot || isPulsing) && item.key !== "shop" && (
                      <span
                        className={`absolute right-1 top-0 rounded-full bg-[#e76f51] shadow-sm ${
                          isPulsing
                            ? "flex h-5 min-w-5 items-center justify-center px-1 text-[10px] font-bold leading-none text-white"
                            : "h-2.5 w-2.5"
                        }`}
                      >
                        {isPulsing ? "+1" : ""}
                      </span>
                    )}

                    <p className="text-[11px] font-semibold text-[#7d6554]">
                      {item.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          {dailyDropState !== "claimed" && todayDrop && (
            <motion.button
              type="button"
              onClick={claimDailyDrop}
              disabled={dailyDropState !== "available"}
              whileTap={dailyDropState === "available" ? { scale: 0.95 } : undefined}
              className="absolute right-1 top-[104px] z-20 flex flex-col items-center disabled:cursor-default"
            >
              <motion.div
                animate={
                  dailyDropState === "claiming"
                    ? { rotate: [0, -7, 7, -7, 7, 0], scale: [1, 1.08, 1.02, 1.08, 0.92] }
                    : { y: [0, -6, 0] }
                }
                transition={
                  dailyDropState === "claiming"
                    ? { duration: 0.52 }
                    : { duration: 1.8, repeat: Infinity }
                }
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/80 bg-white/60 text-3xl shadow-[0_14px_26px_rgba(97,74,56,0.14)] backdrop-blur-md"
              >
                {todayDrop.image ? (
                  <img
                    src={todayDrop.image}
                    alt={todayDrop.name}
                    className="h-11 w-11 object-contain"
                  />
                ) : (
                  <span>{todayDrop.emoji}</span>
                )}
              </motion.div>
              <span className="mt-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[#8d684d] shadow-sm">
                Daily Drop
              </span>
            </motion.button>
          )}

          {collectedMessage && dailyDropState === "claimed" && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-2 top-[140px] z-20 rounded-full bg-white/88 px-3 py-2 text-xs font-bold text-[#8d684d] shadow-sm"
            >
              {collectedMessage}
            </motion.div>
          )}

          <div className="absolute bottom-7 h-9 w-[240px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(106,83,61,0.28),_rgba(106,83,61,0)_72%)]" />

          <div className="relative mt-12 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute bottom-[calc(100%-25px)] left-1/2 z-10 w-[230px] max-w-[calc(100vw-112px)] -translate-x-1/2 rounded-[28px] border border-[#f4dccf] bg-white px-5 py-4 text-left shadow-[0_16px_30px_rgba(94,69,47,0.12)]">
                <div className="mb-1 flex items-center justify-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: selectedMember.accentColor }}
                    aria-hidden="true"
                  />
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#b98559]">
                    {selectedBubbleSpeaker}
                  </p>
                </div>

                <p className="text-center text-[15px] leading-6 text-[#5d4838]">
                  {selectedBubble}
                </p>

                <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-[#f4dccf] bg-white" />
              </div>

              {lastPlacedDailyDrop && (
                <div className="absolute -right-11 bottom-16 z-10 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/62 text-4xl shadow-[0_12px_24px_rgba(73,56,42,0.16)] backdrop-blur-sm">
                  {lastPlacedDailyDrop.sceneImage ? (
                    <img
                      src={lastPlacedDailyDrop.sceneImage}
                      alt={lastPlacedDailyDrop.name}
                      className="h-14 w-14 object-contain"
                    />
                  ) : (
                    <span>{lastPlacedDailyDrop.emoji}</span>
                  )}
                </div>
              )}

              <img
                src={currentPet.image}
                alt={`${me.name}'s companion pet ${me.dogName}`}
                className="h-[190px] w-auto object-contain drop-shadow-[0_14px_18px_rgba(73,56,42,0.18)]"
              />
            </div>

            <p className="mt-3 text-sm font-semibold text-[#4c3a2d]">
              {me.name}'s companion pet {me.dogName}
            </p>

            <p className="mt-1 text-[11px] text-[#8b705d]">
              {currentPet.name} · {lastPlacedDailyDrop ? lastPlacedDailyDrop.name : "waiting for care"}
            </p>

            {selectedFamilyDog !== "me" && (
              <p className="mt-1 text-xs text-[#8b705d]">
                Viewing {selectedMember.name}'s companion status
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-[28px] border border-white/80 bg-white/68 px-4 py-4 shadow-[0_12px_32px_rgba(73,56,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#49372a]">
                Pet inventory
              </p>

              <p className="mt-1 text-xs leading-5 text-[#8b705d]">
                {petFeedback}
              </p>
            </div>

            <div className="rounded-full bg-[#f7eadf] px-3 py-2 text-xs font-semibold text-[#8e6f54]">
              Keepsakes
            </div>
          </div>
        </div>
      </div>

      {activeInventory && (
        <div className="absolute inset-0 z-30 flex items-end bg-[#3d2d22]/28 px-3 pb-5 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full overflow-y-auto rounded-[30px] border border-white/80 bg-[#fffaf5] p-4 shadow-[0_22px_50px_rgba(67,48,34,0.22)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b08a6d]">
                  Pet Warehouse
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#3d2d22]">
                  {activeInventoryTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveInventory(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3e5d8] text-sm font-bold text-[#7d6554]"
              >
                ×
              </button>
            </div>

            {activeInventory === "shop" && (
              <div className="grid grid-cols-2 gap-3">
                {petItems.map((pet) => {
                  const isSelected = selectedPetId === pet.id;
                  const isUnlocked = unlockedPetIds.includes(pet.id);

                  return (
                    <button
                      key={pet.id}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => choosePet(pet.id)}
                      className={`rounded-3xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#d18b63] bg-[#fff1df]"
                          : "border-[#f2dfcf] bg-white"
                      } ${!isUnlocked ? "opacity-50" : "active:scale-[0.98]"}`}
                    >
                      <div className="mb-2 flex h-20 items-center justify-center rounded-2xl bg-[#f7eadf]">
                        <img src={pet.image} alt="" className="h-16 w-auto object-contain" />
                      </div>
                      <p className="text-xs font-semibold text-[#49372a]">{pet.name}</p>
                      <p className="mt-1 text-[10px] leading-4 text-[#8b705d]">
                        {pet.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {activeInventory === "food" && (
              <div className="space-y-2">
                {foodInventory.length === 0 && (
                  <p className="rounded-3xl border border-[#f2dfcf] bg-white p-4 text-center text-xs leading-5 text-[#8b705d]">
                    No food or drink items yet. Collect a Daily Drop first.
                  </p>
                )}

                {foodInventory.map((drop) => {
                  const count = getDailyDropCount(drop.id);

                  return (
                    <button
                      key={drop.id}
                      type="button"
                      disabled={count <= 0}
                      onClick={() => useDrop(drop)}
                      className={`flex w-full items-center gap-3 rounded-3xl border border-[#f2dfcf] bg-white p-3 text-left transition ${
                        count <= 0 ? "opacity-50" : "active:scale-[0.98]"
                      }`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1df]">
                        {renderDropIcon(drop)}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-[#49372a]">
                          {drop.name}
                        </span>
                        <span className="block text-[11px] leading-4 text-[#8b705d]">
                          {drop.description}
                        </span>
                      </span>
                      <span className="rounded-full bg-[#f7eadf] px-2 py-1 text-xs font-semibold text-[#8e6f54]">
                        × {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeInventory === "toy" && (
              <div className="space-y-2">
                {toyInventory.length === 0 && weeklyKeepsakes.length === 0 && (
                  <p className="rounded-3xl border border-[#f2dfcf] bg-white p-4 text-center text-xs leading-5 text-[#8b705d]">
                    No toys or care items yet. Collect a Daily Drop first.
                  </p>
                )}

                {toyInventory.map((drop) => {
                  const count = getDailyDropCount(drop.id);

                  return (
                    <button
                      key={drop.id}
                      type="button"
                      disabled={count <= 0}
                      onClick={() => useDrop(drop)}
                      className={`flex w-full items-center gap-3 rounded-3xl border border-[#f2dfcf] bg-white p-3 text-left transition ${
                        count <= 0 ? "opacity-50" : "active:scale-[0.98]"
                      }`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7eadf]">
                        {renderDropIcon(drop)}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-[#49372a]">
                          {drop.name}
                        </span>
                        <span className="block text-[11px] leading-4 text-[#8b705d]">
                          {drop.description}
                        </span>
                      </span>
                      <span className="rounded-full bg-[#f7eadf] px-2 py-1 text-xs font-semibold text-[#8e6f54]">
                        Use × {count}
                      </span>
                    </button>
                  );
                })}

                {weeklyKeepsakes.map((keepsake) => (
                  <button
                    key={keepsake.id}
                    type="button"
                    onClick={() =>
                      setPetFeedback(`${keepsake.name} is now in the Toy Box.`)
                    }
                    className="flex w-full items-center gap-3 rounded-3xl border border-[#d18b63] bg-[#fff1df] p-3 text-left transition active:scale-[0.98]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7eadf] text-xl">
                      {keepsake.image ? (
                        <img
                          src={keepsake.image}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        keepsake.emoji
                      )}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-[#49372a]">
                        {keepsake.name}
                      </span>
                      <span className="block text-[11px] leading-4 text-[#8b705d]">
                        {keepsake.description}
                      </span>
                    </span>
                    <span className="rounded-full bg-[#f7eadf] px-2 py-1 text-xs font-semibold text-[#8e6f54]">
                      Weekly
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-3 text-center text-[11px] leading-4 text-[#9a7a61]">
              Food and drink are consumable. Toys, care items, and weekly keepsakes can stay as shared pet memories.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
