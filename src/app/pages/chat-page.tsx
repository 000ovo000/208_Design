import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { usePet } from "../context/pet-context";
import {
  dailyDrops,
  getDailyDropsForPet,
  type DailyDrop,
} from "../data/daily-drops";
import { getFamilySelectedPetId } from "../data/family-data";
import {
  defaultPetId,
  getPetById,
  getPetProfileImage,
  type PetId,
  type PetItem,
  type PetSpecies,
} from "../data/pets";
import { getPetReaction } from "../data/pet-reactions";
import type { WeeklyReward } from "../data/weekly-rewards";
import { AlbumEntry, FamilyMember, FamilyMemberId } from "../types";

interface ChatPageProps {
  familyMembers: FamilyMember[];
  latestEntries: Record<FamilyMemberId, AlbumEntry | null>;
  bubbleMessage: string;
  weeklyKeepsakes: WeeklyReward[];
}

type InventoryTab = "petSelection" | "food" | "toy";
type DailyDropState = "available" | "claiming" | "claimed";
type StorageArea = "food" | "toy";
type DbPost = {
  id: number | string;
  user_id: number | string;
  family_member_id?: number | string | null;
  user_name?: string;
  family_id: number | string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
};
type Post = {
  id: number | string;
  user_id: number | string;
  family_member_id?: number | string | null;
  family_id: number | string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: string;
  created_at?: string;
};
type CurrentUser = {
  id: number | string;
  name: string;
  email?: string;
  family_id?: number | string;
};

type VisualItem = {
  name: string;
  emoji: string;
  image?: string;
  sceneImage?: string;
};

type ScenePlacement = {
  positionClassName: string;
  sizeClassName: string;
  imageClassName: string;
  durationMs: number | null;
  style?: CSSProperties;
};

const inventoryTabs: { key: InventoryTab; label: string; title: string; emoji: string }[] = [
  { key: "petSelection", label: "Change your pet", title: "Pet Collection", emoji: "🐾" },
  { key: "food", label: "Food", title: "Food Storage", emoji: "🍖" },
  { key: "toy", label: "Toys", title: "Toy Box", emoji: "🧸" },
];

const getStorageArea = (drop: DailyDrop): StorageArea => {
  return drop.category === "food" || drop.category === "drink" ? "food" : "toy";
};

const pickRandomDrop = (drops: DailyDrop[]) => {
  return drops[Math.floor(Math.random() * drops.length)] ?? dailyDrops[0];
};

const getScenePlacement = (item: DailyDrop): ScenePlacement => {
  const base = {
    imageClassName: "drop-shadow-[0_10px_16px_rgba(73,56,42,0.18)]",
  };

  switch (item.id) {
    case "pet-water":
      return {
        ...base,
        positionClassName: "absolute -left-16 bottom-1 z-10 flex items-center justify-center text-4xl",
        sizeClassName: "h-16 w-16",
        durationMs: 25000,
      };
    case "pet-milk":
      return {
        ...base,
        positionClassName: "absolute -left-16 bottom-[34px] z-10 flex items-center justify-center text-4xl",
        sizeClassName: "h-16 w-16",
        durationMs: 25000,
      };
    case "canned-tuna":
      return {
        ...base,
        positionClassName: "absolute -right-[51px] bottom-[60px] z-20 flex items-center justify-center text-4xl",
        sizeClassName: "h-[53px] w-[53px]",
        durationMs: 25000,
      };
    case "pet-food":
      return {
        ...base,
        positionClassName: "absolute -left-16 bottom-[-26px] z-20 flex items-center justify-center text-4xl",
        sizeClassName: "h-[70px] w-[70px]",
        durationMs: 25000,
      };
    case "pet-biscuit":
      return {
        ...base,
        positionClassName: "absolute left-1/2 bottom-[-8px] z-20 flex -translate-x-1/2 items-center justify-center text-4xl",
        sizeClassName: "h-[45px] w-[45px]",
        durationMs: 25000,
      };
    case "small-bone":
      return {
        ...base,
        positionClassName: "absolute left-1/2 bottom-[-8px] z-20 flex -translate-x-[calc(50%+60px)] items-center justify-center text-4xl",
        sizeClassName: "h-[38px] w-[38px]",
        durationMs: 25000,
      };
    case "small-ball":
      return {
        ...base,
        positionClassName: "absolute -left-[18px] bottom-[83px] z-20 flex items-center justify-center text-4xl",
        sizeClassName: "h-[39px] w-[39px]",
        durationMs: 50000,
      };
    case "chew-toy":
      return {
        ...base,
        positionClassName: "absolute left-[calc(50%+55px)] bottom-[1px] z-20 flex -translate-x-1/2 items-center justify-center text-4xl scale-[1.5]",
        sizeClassName: "h-[70px] w-[70px]",
        durationMs: 50000,
      };
    case "plush-bear":
      return {
        ...base,
        positionClassName: "absolute -right-16 bottom-[72px] z-10 flex items-center justify-center text-4xl",
        sizeClassName: "h-[82px] w-[82px]",
        durationMs: 50000,
      };
    case "fish-toy":
      return {
        ...base,
        positionClassName: "absolute -right-[76px] bottom-[-23px] z-20 flex items-center justify-center text-4xl",
        sizeClassName: "h-[51px] w-[51px]",
        durationMs: 50000,
      };
    default:
      return {
        ...base,
        positionClassName: "absolute -right-12 bottom-14 z-10 flex items-center justify-center text-4xl",
        sizeClassName: "h-20 w-20",
        durationMs: item.category === "food" || item.category === "drink" ? 25000 : 50000,
      };
  }
};

const SELECTED_PET_STORAGE_KEY = "selectedPetId";

const getUserScopedPetKey = (userId: string | number) =>
  `kinlight:${SELECTED_PET_STORAGE_KEY}:${String(userId)}`;

const readSelectedPetIdForUser = (userId: FamilyMemberId | null | undefined): PetId => {
  if (userId == null || typeof window === "undefined") return defaultPetId;
  const savedId = window.localStorage.getItem(getUserScopedPetKey(userId));
  if (savedId && savedId === getPetById(savedId as PetId).id) {
    return savedId as PetId;
  }
  return getFamilySelectedPetId(userId) ?? defaultPetId;
};

function PawIcon() {
  return (
    <div className="relative w-9 h-9">
      <span className="absolute left-[-5px] top-[11px] w-[11px] h-[11px] rounded-full bg-[#341056]" />
      <span className="absolute left-[6px] top-[0px] w-[11px] h-[11px] rounded-full bg-[#341056]" />
      <span className="absolute right-[6px] top-[0px] w-[11px] h-[11px] rounded-full bg-[#341056]" />
      <span className="absolute right-[-5px] top-[11px] w-[11px] h-[11px] rounded-full bg-[#341056]" />
      <span className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[26px] h-[21px] bg-[#341056] rounded-[18px_18px_14px_14px]" />
    </div>
  );
}

function ItemIcon({
  item,
  source = "image",
  sizeClass = "h-11 w-11",
  imageClassName = "",
  emojiClassName = "text-xl leading-none",
  alt = "",
}: {
  item: VisualItem;
  source?: "image" | "sceneImage";
  sizeClass?: string;
  imageClassName?: string;
  emojiClassName?: string;
  alt?: string;
}) {
  const src = item[source];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} object-contain ${imageClassName}`}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span className={emojiClassName} aria-hidden="true">
      {item.emoji}
    </span>
  );
}

function PlacedDailyDropSceneItem({
  drop,
  onExpire,
}: {
  drop: DailyDrop;
  onExpire: (dropId: string) => void;
}) {
  const placement = getScenePlacement(drop);

  useEffect(() => {
    if (placement.durationMs === null) return;

    const timeoutId = window.setTimeout(() => {
      onExpire(drop.id);
    }, placement.durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [drop.id, onExpire, placement.durationMs]);

  return (
    <div className={placement.positionClassName} style={placement.style}>
      <ItemIcon
        item={drop}
        source="sceneImage"
        sizeClass={placement.sizeClassName}
        imageClassName={placement.imageClassName}
        emojiClassName="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/62 leading-none shadow-[0_12px_24px_rgba(73,56,42,0.16)] backdrop-blur-sm"
        alt={drop.name}
      />
    </div>
  );
}

function PetSelectionCard({
  pet,
  active = false,
  unlocked = false,
  onClick,
}: {
  pet: PetItem;
  active?: boolean;
  unlocked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      className={`flex flex-col items-center justify-end rounded-[22px] transition-all ${
        active ? "bg-[#B98A54] shadow-md" : "bg-white/55 border border-white/70"
      } ${!unlocked ? "opacity-50" : "active:scale-[0.98]"}`}
      style={{ width: 118, height: 136, paddingBottom: 10 }}
    >
      <div className="relative w-[96px] h-[82px] mb-2 flex items-end justify-center">
        <div className="absolute inset-x-0 bottom-0 mx-auto w-[84px] h-[44px] rounded-full bg-[#E8B85E]/80" />
        <img
          src={pet.image}
          alt={pet.name}
          className="relative z-[2] max-h-[78px] max-w-[94px] object-contain drop-shadow-[0_8px_10px_rgba(73,56,42,0.16)]"
        />
      </div>

      <span
        className={`px-2 text-center text-[13px] font-semibold leading-[1.15] ${
          active ? "text-white" : "text-[#7A5A43]"
        }`}
      >
        {pet.name}
      </span>
    </button>
  );
}

function PetSelectionView({
  selectedPetId,
  setSelectedPetId,
  currentPet,
  petItems,
  unlockedPetIds,
  onBack,
}: {
  selectedPetId: PetId;
  setSelectedPetId: (value: PetId) => void;
  currentPet: PetItem;
  petItems: PetItem[];
  unlockedPetIds: PetId[];
  onBack: () => void;
}) {
  const [activeSpecies, setActiveSpecies] = useState<PetSpecies>(currentPet.species);
  const visiblePets = petItems.filter((pet) => pet.species === activeSpecies);

  return (
    <div className="h-full overflow-y-auto px-5 pt-2 pb-8">
      <div className="flex items-center justify-start mb-6">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center text-[#333333]"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[26px] font-medium text-[#171717]">Pet Collection</h2>
            <p className="mt-1 text-[13px] leading-[1.4] text-[#7A7287]">
              Choose one shared companion for Home and Mood Jar.
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-[22px] bg-white/55 p-2 border border-white/70">
          <button
            type="button"
            onClick={() => setActiveSpecies("dog")}
            className={`rounded-[18px] py-2 text-[14px] font-semibold ${
              activeSpecies === "dog" ? "bg-[#B98A54] text-white" : "text-[#7A5A43]"
            }`}
          >
            Puppies
          </button>
          <button
            type="button"
            onClick={() => setActiveSpecies("cat")}
            className={`rounded-[18px] py-2 text-[14px] font-semibold ${
              activeSpecies === "cat" ? "bg-[#B98A54] text-white" : "text-[#7A5A43]"
            }`}
          >
            Kittens
          </button>
        </div>

        <div className="grid grid-cols-2 justify-items-center gap-4">
          {visiblePets.map((pet) => {
            const unlocked = unlockedPetIds.includes(pet.id);
            return (
              <PetSelectionCard
                key={pet.id}
                pet={pet}
                active={selectedPetId === pet.id}
                unlocked={unlocked}
                onClick={() => setSelectedPetId(pet.id)}
              />
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[22px] font-medium text-[#171717] mb-5">
          Your selection:
        </h3>

        <div className="flex flex-col items-center rounded-[28px] bg-white/55 border border-white/70 px-4 py-5">
          <img
            src={currentPet.image}
            alt={currentPet.name}
            className="max-h-[150px] max-w-[230px] object-contain drop-shadow-[0_10px_14px_rgba(73,56,42,0.18)]"
          />
          <p className="mt-3 text-[15px] font-semibold text-[#5A2A86]">
            {currentPet.name}
          </p>
          <p className="mt-1 text-center text-[12px] leading-[1.4] text-[#7A7287]">
            {currentPet.description}
          </p>
        </div>
      </div>
    </div>
  );
}

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
    placedDailyDrops,
    clearPlacedDailyDrop,
  } = usePet();

  const [selectedFamilyDog, setSelectedFamilyDog] = useState<FamilyMemberId | null>(null);
  const [selectedHomeMemberId, setSelectedHomeMemberId] = useState<FamilyMemberId | null>(null);
  const [activeInventory, setActiveInventory] = useState<InventoryTab | null>(null);
  const [dailyDropState, setDailyDropState] = useState<DailyDropState>("available");
  const [collectedMessage, setCollectedMessage] = useState("");
  const [storageDot, setStorageDot] = useState<Record<StorageArea, boolean>>({
    food: false,
    toy: false,
  });
  const [storagePulse, setStoragePulse] = useState<StorageArea | null>(null);
  const [localDailyDropInventory, setLocalDailyDropInventory] = useState<Record<string, number>>({});
  const [localPlacedDailyDrops, setLocalPlacedDailyDrops] = useState<DailyDrop[]>([]);
  const [petFeedback, setPetFeedback] = useState("Your companion is waiting for a small family moment.");
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [latestAlbumPost, setLatestAlbumPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showMemberSwitcher, setShowMemberSwitcher] = useState(false);
  const [hasClaimedDailyDropToday, setHasClaimedDailyDropToday] = useState(false);
  const [homeOwnerUserId, setHomeOwnerUserId] = useState<string | null>(null);
  const [debugDropToolsOpen, setDebugDropToolsOpen] = useState(false);
  const [debugBypassDailyDropClaim, setDebugBypassDailyDropClaim] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/posts");
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        console.error("Failed to load posts:", data);
        return;
      }

      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to connect backend:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getDailyDropClaimKey(userId: string | number) {
    return `daily-drop-claimed-${userId}-${getTodayKey()}`;
  }

  function clearDailyDropClaimStorageForDebug() {
    if (typeof window === "undefined") return;
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("daily-drop-claimed-"))
      .forEach((key) => window.localStorage.removeItem(key));
  }

  const isCurrentUserMember = (member: FamilyMember) => {
    if (!currentUser) return false;
    return (
      String(member.id) === String(currentUser.id) ||
      Boolean(member.email && currentUser.email && member.email === currentUser.email)
    );
  };

  const orderedHomeMembers = useMemo(() => {
    const currentMember = familyMembers.find(isCurrentUserMember) ?? familyMembers[0];
    const others = familyMembers.filter(
      (member) => String(member.id) !== String(currentMember?.id)
    );
    return currentMember ? [currentMember, ...others] : familyMembers;
  }, [familyMembers, currentUser]);

  const me = orderedHomeMembers[0] ?? familyMembers[0];
  const currentMember = me;

  const selectedMember =
    familyMembers.find(
      (member) => String(member.id) === String(selectedHomeMemberId)
    ) ?? me;
  const selectedHomeMember = selectedMember ?? orderedHomeMembers[0] ?? null;
  const selectedHomePetId = useMemo(() => {
    if (selectedHomeMember?.id != null && String(selectedHomeMember.id) === String(me?.id)) {
      // For current user, use in-memory state directly to avoid one-render lag.
      return selectedPetId;
    }
    return readSelectedPetIdForUser(selectedHomeMember?.id);
  }, [selectedHomeMember?.id, me?.id, selectedPetId]);
  const selectedHomePet = useMemo(() => getPetById(selectedHomePetId), [selectedHomePetId]);
  const isViewingOwnHome =
    selectedHomeMember && currentMember
      ? String(selectedHomeMember.id) === String(currentMember.id)
      : false;
  const getMemberPetProfileImage = (memberId: FamilyMemberId | null | undefined) => {
    if (memberId == null) return getPetProfileImage(getPetById(defaultPetId));
    if (String(memberId) === String(me?.id)) return getPetProfileImage(getPetById(selectedPetId));
    return getPetProfileImage(getPetById(readSelectedPetIdForUser(memberId)));
  };
  const isPostForMember = (post: DbPost, member: FamilyMember) => {
    if (post.family_member_id != null) {
      return String(post.family_member_id) === String(member.id);
    }
    return String(post.user_id) === String(member.id);
  };
  const selectedMemberLatestAlbumEntry = useMemo(() => {
    return [...Object.values(latestEntries).filter(Boolean) as AlbumEntry[], ...[]]
      .filter(
        (entry) =>
          String(entry.memberId) === String(selectedHomeMemberId) && Boolean(entry.imageUrl)
      )
      .sort(
        (a, b) =>
          new Date(b.uploadedAt.replace(" ", "T")).getTime() -
          new Date(a.uploadedAt.replace(" ", "T")).getTime()
      )[0] ?? null;
  }, [latestEntries, selectedHomeMemberId]);
  const selectedMemberLatestPost = useMemo(
    () =>
      posts
        .filter((post) => (selectedMember ? isPostForMember(post, selectedMember) : false))
        .filter((post) => Boolean(post.media_url))
        .sort(
          (a, b) =>
            new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
        )[0] ?? null,
    [posts, selectedHomeMemberId, selectedMember]
  );
  const selectedMemberLatestTextPost = useMemo(
    () =>
      posts
        .filter((post) => (selectedMember ? isPostForMember(post, selectedMember) : false))
        .sort(
          (a, b) =>
            new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
        )[0] ?? null,
    [posts, selectedHomeMemberId, selectedMember]
  );
  const selectedHomePhotoUrl =
    selectedMemberLatestAlbumEntry?.imageUrl ||
    selectedMemberLatestPost?.media_url ||
    "";
  const selectedBubble =
    selectedMemberLatestTextPost?.content?.trim() ||
    selectedMemberLatestAlbumEntry?.dogMessage?.trim() ||
    (String(selectedHomeMemberId) === String(me?.id)
      ? bubbleMessage
      : "No message yet.");

  const petTitle =
    selectedMember ? `${selectedMember.name.toUpperCase()}'S PET` : "PET";

  const availableDailyDrops = useMemo(() => {
    return getDailyDropsForPet(currentPet.species);
  }, [currentPet.species]);

  const [todayDrop, setTodayDrop] = useState<DailyDrop>(() =>
    pickRandomDrop(getDailyDropsForPet(currentPet.species))
  );

  const isDevDailyDropTools = import.meta.env.DEV;
  const shouldBypassDailyDropClaim =
    isDevDailyDropTools && debugBypassDailyDropClaim;

  const canShowDailyDrop =
    Boolean(todayDrop) &&
    (dailyDropState === "available" ||
      dailyDropState === "claiming" ||
      shouldBypassDailyDropClaim) &&
    (!hasClaimedDailyDropToday || shouldBypassDailyDropClaim);
  const showDailyDropButton = Boolean(currentMember) && canShowDailyDrop;
  const getDisplayedDailyDropCount = (dropId: string) =>
    getDailyDropCount(dropId) + (localDailyDropInventory[dropId] ?? 0);

  const makeDailyDropAvailableForDebug = (drop: DailyDrop, message: string) => {
    if (!isDevDailyDropTools) return;
    clearDailyDropClaimStorageForDebug();
    setTodayDrop(drop);
    setHasClaimedDailyDropToday(false);
    setDailyDropState("available");
    setCollectedMessage("");
    setDebugBypassDailyDropClaim(true);
    setPetFeedback(message);
  };

  const resetDailyDropForDebug = () => {
    if (!isDevDailyDropTools) return;
    const nextDrop =
      availableDailyDrops.find((drop) => drop.id === todayDrop.id) ??
      pickRandomDrop(availableDailyDrops);
    makeDailyDropAvailableForDebug(
      nextDrop,
      "Daily Drop reset. You can claim again."
    );
  };

  const randomizeDailyDropForDebug = () => {
    if (!isDevDailyDropTools) return;
    makeDailyDropAvailableForDebug(
      pickRandomDrop(availableDailyDrops),
      "Daily Drop randomized. You can claim again."
    );
  };

  const selectDailyDropForDebug = (dropId: string) => {
    if (!isDevDailyDropTools) return;
    const selectedDrop = availableDailyDrops.find((drop) => drop.id === dropId);
    if (!selectedDrop) return;
    makeDailyDropAvailableForDebug(
      selectedDrop,
      `${selectedDrop.name} selected. You can claim again.`
    );
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/me");
        if (!response.ok) throw new Error("Failed to fetch current user");
        const user = await response.json();
        setCurrentUser(user);
      } catch (error) {
        console.warn("Failed to load current user, using first family member as fallback.");
        setCurrentUser(null);
      }
    };
    void fetchCurrentUser();
    const refreshOnFocus = () => {
      void fetchCurrentUser();
    };
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchCurrentUser();
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, []);

  useEffect(() => {
    if (!familyMembers.length) return;
    const currentMember = familyMembers.find(isCurrentUserMember) ?? familyMembers[0];
    const currentUserId = currentUser?.id != null ? String(currentUser.id) : null;
    setSelectedHomeMemberId((current) => {
      if (!current) return currentMember.id;
      if (homeOwnerUserId !== currentUserId) {
        // Logged-in user changed; reset Home default to the new current user.
        return currentMember.id;
      }
      return current;
    });
    setHomeOwnerUserId(currentUserId);
  }, [familyMembers, currentUser, homeOwnerUserId]);

  useEffect(() => {
    if (activeInventory) {
      setShowMemberSwitcher(false);
    }
  }, [activeInventory]);
  useEffect(() => {
    if (!orderedHomeMembers.length) {
      return;
    }
    const stillExists = orderedHomeMembers.some(
      (member) => String(member.id) === String(selectedHomeMemberId)
    );
    if (!selectedHomeMemberId || !stillExists) {
      setSelectedHomeMemberId(currentMember?.id ?? orderedHomeMembers[0].id);
    }
  }, [orderedHomeMembers, currentMember, selectedHomeMemberId]);

  useEffect(() => {
    setTodayDrop((current) =>
      availableDailyDrops.some((drop) => drop.id === current.id)
        ? current
        : pickRandomDrop(availableDailyDrops)
    );
    setDailyDropState(hasClaimedDailyDropToday ? "claimed" : "available");
    if (!hasClaimedDailyDropToday) {
      setCollectedMessage("");
    }
  }, [availableDailyDrops, hasClaimedDailyDropToday]);

  useEffect(() => {
    const checkDailyDropStatus = async () => {
      if (!currentUser?.id) {
        setHasClaimedDailyDropToday(false);
        return;
      }

      if (shouldBypassDailyDropClaim) {
        setHasClaimedDailyDropToday(false);
        setDailyDropState("available");
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/api/daily-drop/status");
        if (!response.ok) throw new Error("Failed to fetch daily drop status");
        const result = await response.json();
        setHasClaimedDailyDropToday(Boolean(result?.claimed));
        return;
      } catch {
        setHasClaimedDailyDropToday(
          window.localStorage.getItem(getDailyDropClaimKey(currentUser.id)) === "true"
        );
      }
    };

    void checkDailyDropStatus();
  }, [currentUser?.id, shouldBypassDailyDropClaim]);

  useEffect(() => {
    const fetchLatestPost = async () => {
      if (!currentUser?.id) {
        setLatestAlbumPost(null);
        return;
      }
      try {
        const response = await fetch("http://localhost:3001/api/posts");

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const posts: Post[] = await response.json();
        const latestPost =
          posts.find((post) => String(post.user_id) === String(currentUser.id)) ?? null;

        setLatestAlbumPost(latestPost);
      } catch (error) {
        console.error("Failed to load latest album post:", error);
        setLatestAlbumPost(null);
      }
    };

    void fetchLatestPost();
  }, [currentUser?.id]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        void loadPosts();
      }
    };
    const refreshOnFocus = () => {
      void loadPosts();
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);
    const onHomeDataUpdated = () => {
      void loadPosts();
    };
    window.addEventListener("home-data-updated", onHomeDataUpdated);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
      window.removeEventListener("home-data-updated", onHomeDataUpdated);
    };
  }, [loadPosts]);

  const handlePublishPost = async () => {
    if (isPublishingPost) return;
    if (!currentUser?.id) return;

    const title = postTitle.trim() || "Family Update";
    const content = postContent.trim();
    if (!title && !content) return;

    try {
      setIsPublishingPost(true);

      const response = await fetch("http://localhost:3001/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          family_member_id: currentUser.id,
          family_id: currentUser.family_id ?? me?.family_id ?? 1,
          title,
          content,
          media_url: null,
          media_type: "text",
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Failed to publish post:", result);
        alert(result?.error || "Failed to publish post.");
        return;
      }

      setPosts((prev) => [result, ...prev]);
      setPostTitle("");
      setPostContent("");
    } catch (error) {
      console.error("Failed to connect backend:", error);
      alert("Failed to connect backend.");
    } finally {
      setIsPublishingPost(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Failed to delete post:", result);
        alert(result?.error || "Failed to delete post.");
        return;
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Failed to connect backend:", error);
      alert("Failed to connect backend.");
    }
  };

  const foodInventory = useMemo(
    () =>
      dailyDrops.filter(
        (drop) =>
          (drop.category === "food" || drop.category === "drink") &&
          getDisplayedDailyDropCount(drop.id) > 0
      ),
    [getDailyDropCount, localDailyDropInventory]
  );

  const toyInventory = useMemo(
    () =>
      dailyDrops.filter(
        (drop) =>
          (drop.category === "basic-toy" || drop.category === "care") &&
          getDisplayedDailyDropCount(drop.id) > 0
      ),
    [getDailyDropCount, localDailyDropInventory]
  );

  const activeInventoryTitle = inventoryTabs.find(
    (item) => item.key === activeInventory
  )?.title;

  const openInventory = (tab: InventoryTab) => {
    setShowMemberSwitcher(false);
    setActiveInventory(tab);

    if (tab === "food" || tab === "toy") {
      setStorageDot((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const claimDailyDrop = async () => {
    console.log("[DailyDrop] claim clicked", { todayDrop, dailyDropState });
    setShowMemberSwitcher(false);
    if (
      (dailyDropState !== "available" && !shouldBypassDailyDropClaim) ||
      (hasClaimedDailyDropToday && !shouldBypassDailyDropClaim)
    ) {
      console.warn("[DailyDrop] claim blocked", {
        dailyDropState,
        hasClaimedDailyDropToday,
        shouldBypassDailyDropClaim,
      });
      return;
    }

    setDailyDropState("claiming");
    console.log("[DailyDrop] set claiming");
    const claimedDrop = todayDrop;

    window.setTimeout(async () => {
      try {
        console.log("[DailyDrop] finish claim timeout start", { todayDrop: claimedDrop });
        if (!claimedDrop) {
          console.warn("[DailyDrop] no todayDrop when finishing claim");
          setDailyDropState("available");
          return;
        }

        const storageArea = getStorageArea(claimedDrop);
        console.log("[DailyDrop] storageArea", storageArea);
        console.log("[DailyDrop] add inventory start", claimedDrop.id);
        const added = await addDailyDropToInventory(claimedDrop.id, 1);
        console.log("[DailyDrop] add inventory done", claimedDrop.id, { added });

        if (!added) {
          if (!isDevDailyDropTools && !shouldBypassDailyDropClaim) {
            console.warn("[DailyDrop] backend inventory add failed outside dev bypass");
            setDailyDropState("available");
            setPetFeedback("Daily Drop could not be collected. Please try again.");
            return;
          }

          console.warn("[DailyDrop] using local inventory fallback", claimedDrop.id);
          setLocalDailyDropInventory((prev) => ({
            ...prev,
            [claimedDrop.id]: (prev[claimedDrop.id] ?? 0) + 1,
          }));
        }

        setHasClaimedDailyDropToday(true);
        if (currentUser?.id) {
          window.localStorage.setItem(getDailyDropClaimKey(currentUser.id), "true");
        }
        setDailyDropState("claimed");
        const message = `${claimedDrop.name} +1`;
        setCollectedMessage(message);
        console.log("[DailyDrop] collected message set", message);
        window.setTimeout(() => {
          setCollectedMessage("");
        }, 2000);
        setStorageDot((prev) => ({ ...prev, [storageArea]: true }));
        setStoragePulse(storageArea);
        setPetFeedback(`Collected ${claimedDrop.name} +1. Check your ${storageArea === "food" ? "Food Storage" : "Toy Box"}.`);
        setDebugBypassDailyDropClaim(false);
        console.log("[DailyDrop] count after add", claimedDrop.id, getDisplayedDailyDropCount(claimedDrop.id));

        window.setTimeout(() => {
          setStoragePulse(null);
        }, 1200);
      } catch (error) {
        console.error("[DailyDrop] claim failed", error);
        setDailyDropState("available");
        setPetFeedback("Daily Drop could not be collected. Please try again.");
      }
    }, 520);
  };

  const useDrop = async (drop: DailyDrop) => {
    setShowMemberSwitcher(false);
    const usedDrop = await useDailyDropItem(drop.id);
    const localCount = localDailyDropInventory[drop.id] ?? 0;
    if (!usedDrop && localCount <= 0) return;

    if (!usedDrop) {
      setLocalDailyDropInventory((prev) => ({
        ...prev,
        [drop.id]: Math.max((prev[drop.id] ?? 0) - 1, 0),
      }));
      setLocalPlacedDailyDrops((prev) =>
        prev.some((item) => item.id === drop.id) ? prev : [...prev, drop]
      );
    }

    setPetFeedback(getPetReaction((usedDrop ?? drop).category));
    setActiveInventory(null);
  };

  const renderDropIcon = (drop: DailyDrop, sizeClass = "h-11 w-11") => {
    return <ItemIcon item={drop} sizeClass={sizeClass} />;
  };

  const clearLocalPlacedDailyDrop = useCallback((dropId: string) => {
    setLocalPlacedDailyDrops((prev) => prev.filter((item) => item.id !== dropId));
  }, []);

  const displayedPlacedDailyDrops = useMemo(() => {
    const byId = new Map<string, DailyDrop>();
    placedDailyDrops.forEach((drop) => byId.set(drop.id, drop));
    localPlacedDailyDrops.forEach((drop) => byId.set(drop.id, drop));
    return Array.from(byId.values());
  }, [placedDailyDrops, localPlacedDailyDrops]);
  const latestDisplayedPlacedDailyDrop =
    displayedPlacedDailyDrops[displayedPlacedDailyDrops.length - 1] ?? lastPlacedDailyDrop;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f4ede4]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/home/home-bg.png')",
        }}
      />

      <div
        className="relative flex flex-1 flex-col px-3 pt-4 pb-24"
        onClick={() => setShowMemberSwitcher(false)}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9f8067]">
              Home
            </p>
            <h1 className="mt-2 text-[17px] font-semibold text-[#3d2d22]">
              Let your pet carry small family moments.
            </h1>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowMemberSwitcher(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#7d6554] shadow-[0_8px_18px_rgba(97,74,56,0.08)] backdrop-blur"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActiveInventory(null);
              setShowMemberSwitcher((current) => !current);
            }}
            className="absolute left-[28px] top-[100px] z-40 flex items-center gap-3 rounded-full border border-[#f0d8ca] bg-white/90 px-3 py-2 shadow-[0_10px_24px_rgba(92,61,38,0.12)] backdrop-blur"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8efe7]">
              <img
                src={getMemberPetProfileImage(selectedHomeMember?.id)}
                alt={`${selectedHomeMember?.name ?? "Member"}'s pet`}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#4f3c2e]">
                {selectedHomeMember?.name ?? "Member"}
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#a48976]">
                Home scene
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#8b705d] transition ${
                showMemberSwitcher ? "rotate-180" : ""
              }`}
            />
          </button>

          {showMemberSwitcher && !activeInventory && (
            <div
              className="absolute left-[28px] top-[160px] z-50 w-[210px] rounded-[26px] border border-[#f0d8ca] bg-white/95 p-2 shadow-[0_18px_40px_rgba(92,61,38,0.18)] backdrop-blur"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a48976]">
                Switch home
              </div>
              <div className="space-y-1">
                {orderedHomeMembers.map((member) => {
                  const isSelected = String(member.id) === String(selectedHomeMemberId);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedHomeMemberId(member.id);
                        setShowMemberSwitcher(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-[20px] px-3 py-2 text-left transition ${
                        isSelected ? "bg-[#fff1ea] ring-1 ring-[#f6b8a0]" : "hover:bg-[#f8efe7]"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8efe7]">
                        <img
                          src={getMemberPetProfileImage(member.id)}
                          alt={`${member.name}'s pet`}
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[#4f3c2e]">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-[#a48976]">View scene</div>
                      </div>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-[#f2a07f]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isViewingOwnHome && (
            <div className="absolute right-[15px] top-[100px] z-30 flex flex-col items-center gap-4">
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
                      <span className="text-[26px] leading-none" aria-hidden="true">
                        {item.emoji}
                      </span>
                    </div>

                    {(hasDot || isPulsing) && item.key !== "petSelection" && (
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
          )}

          {isViewingOwnHome && isDevDailyDropTools && (
            <div
              className="absolute left-[28px] top-[230px] z-40 w-[210px] rounded-[20px] border border-[#f0d8ca] bg-white/90 p-2 shadow-[0_12px_26px_rgba(92,61,38,0.12)] backdrop-blur"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setDebugDropToolsOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-[14px] px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#8d684d]"
              >
                <span>Drop Debug</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${debugDropToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {debugDropToolsOpen && (
                <div className="mt-2 space-y-2 px-1 pb-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={resetDailyDropForDebug}
                      className="rounded-full bg-[#f3e5d8] px-2 py-1.5 text-[11px] font-semibold text-[#7d6554]"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={randomizeDailyDropForDebug}
                      className="rounded-full bg-[#f3e5d8] px-2 py-1.5 text-[11px] font-semibold text-[#7d6554]"
                    >
                      Random
                    </button>
                  </div>

                  <select
                    value={todayDrop.id}
                    onChange={(event) => selectDailyDropForDebug(event.target.value)}
                    className="w-full rounded-[14px] border border-[#ead7c8] bg-white px-2 py-1.5 text-[11px] font-semibold text-[#5d4838] outline-none"
                  >
                    {availableDailyDrops.map((drop) => (
                      <option key={drop.id} value={drop.id}>
                        {drop.name}
                      </option>
                    ))}
                  </select>

                  <div className="rounded-[14px] bg-[#fff8f1] px-2 py-2 text-[10px] leading-4 text-[#8d684d]">
                    <div>todayDrop.id: {todayDrop?.id ?? "none"}</div>
                    <div>todayDrop.name: {todayDrop?.name ?? "none"}</div>
                    <div>dailyDropState: {dailyDropState}</div>
                    <div>storagePulse: {storagePulse ?? "none"}</div>
                    <div>storageDot.food: {String(storageDot.food)}</div>
                    <div>storageDot.toy: {String(storageDot.toy)}</div>
                    <div>collectedMessage: {collectedMessage || "none"}</div>
                    <div>claimedToday: {String(hasClaimedDailyDropToday)}</div>
                    <div>debugBypass: {String(debugBypassDailyDropClaim)}</div>
                    <div>shouldBypass: {String(shouldBypassDailyDropClaim)}</div>
                    <div>canShowDailyDrop: {String(canShowDailyDrop)}</div>
                  </div>

                  <p className="text-[10px] leading-4 text-[#9a7a61]">
                    Reset also bypasses today's claim lock for the next dev claim.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute left-1/2 top-[50px] z-20 h-[150px] w-[230px] -translate-x-1/2">
            {/* Frame base layer */}
            <img
              src="/images/home/hanging-frame.png"
              alt="Hanging photo frame"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
            />

            {/* Photo layer with the same clipped inner frame as Connect. */}
            <div
              className="absolute z-20 overflow-hidden rounded-[3px] bg-[#f3e1cf]"
              style={{
                left: 59,
                top: 52,
                width: 109,
                height: 75,
              }}
            >
              {selectedHomePhotoUrl ? (
                <img
                  src={selectedHomePhotoUrl}
                  alt="Latest album"
                  className="block h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-[#9a7e69]">
                  No photo yet
                </div>
              )}
            </div>
          </div>

          {showDailyDropButton && (
            <motion.button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowMemberSwitcher(false);
                void claimDailyDrop();
              }}
              disabled={dailyDropState !== "available" && !shouldBypassDailyDropClaim}
              whileTap={
                dailyDropState === "available" || shouldBypassDailyDropClaim
                  ? { scale: 0.95 }
                  : undefined
              }
              className="absolute right-[22px] bottom-[66px] z-40 flex flex-col items-center disabled:cursor-default"
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
                <ItemIcon
                  item={todayDrop}
                  sizeClass="h-11 w-11"
                  emojiClassName="leading-none"
                  alt={todayDrop.name}
                />
              </motion.div>
              <span className="mt-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-[#8d684d] shadow-sm">
                Daily Drop
              </span>
            </motion.button>
          )}

          {collectedMessage && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-[22px] bottom-[38px] z-40 rounded-full bg-white/88 px-3 py-2 text-xs font-bold text-[#8d684d] shadow-sm"
            >
              {collectedMessage}
            </motion.div>
          )}

          <div className="absolute bottom-7 h-9 w-[240px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(106,83,61,0.28),_rgba(106,83,61,0)_72%)]" />

          <div className="relative mt-[275px] flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute bottom-[calc(100%-25px)] left-1/2 z-10 w-[230px] max-w-[calc(100vw-112px)] -translate-x-1/2 rounded-[28px] border border-[#f4dccf] bg-white px-5 py-4 text-left shadow-[0_16px_30px_rgba(94,69,47,0.12)]">
                <div className="mb-1 flex items-center justify-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: selectedMember.accentColor }}
                    aria-hidden="true"
                  />
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#b98559]">
                    {petTitle}
                  </p>
                </div>

                <p className="text-center text-[15px] leading-6 text-[#5d4838]">
                  {selectedBubble}
                </p>

                <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-[#f4dccf] bg-white" />
              </div>

              {displayedPlacedDailyDrops.map((drop) => {
                const isLocalPlacedDrop = localPlacedDailyDrops.some(
                  (item) => item.id === drop.id
                );

                return (
                  <PlacedDailyDropSceneItem
                    key={drop.id}
                    drop={drop}
                    onExpire={
                      isLocalPlacedDrop ? clearLocalPlacedDailyDrop : clearPlacedDailyDrop
                    }
                  />
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setShowMemberSwitcher(false);
                }}
                className="rounded-2xl"
              >
                <img
                  key={`${String(selectedHomeMember?.id ?? "unknown")}-${selectedHomePet.id}`}
                  src={
                    selectedHomePet.image
                  }
                  alt={`${selectedMember.name}'s companion pet`}
                  className="h-[190px] w-auto object-contain drop-shadow-[0_14px_18px_rgba(73,56,42,0.18)]"
                />
              </button>
            </div>

            <p className="-mt-[3px] text-sm font-semibold text-[#4c3a2d]">
              {selectedMember.name}'s companion pet
            </p>

            <p className="mt-1 text-[11px] text-[#8b705d]">
              {selectedHomePet.name +
                ` - ${latestDisplayedPlacedDailyDrop ? latestDisplayedPlacedDailyDrop.name : "waiting for care"}`}
            </p>

            {String(selectedHomeMemberId) !== String(me?.id) && (
              <p className="mt-1 text-xs text-[#8b705d]">
                Viewing {selectedMember.name}'s companion status
              </p>
            )}
          </div>
        </div>

        <div className="pb-2" />
      </div>

      {activeInventory && (
        <div
          className="absolute inset-0 z-50 flex items-end bg-[#3d2d22]/28 px-3 pb-5 backdrop-blur-sm"
          onClick={() => setShowMemberSwitcher(false)}
        >
          <div
            className="max-h-[76vh] w-full overflow-y-auto rounded-[30px] border border-white/80 bg-[#fffaf5] p-4 shadow-[0_22px_50px_rgba(67,48,34,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            {activeInventory === "petSelection" ? (
              <PetSelectionView
                selectedPetId={selectedPetId}
                setSelectedPetId={setSelectedPetId}
                currentPet={currentPet}
                petItems={petItems}
                unlockedPetIds={unlockedPetIds}
                onBack={() => {
                  setShowMemberSwitcher(false);
                  setActiveInventory(null);
                }}
              />
            ) : (
              <>
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
                onClick={() => {
                  setShowMemberSwitcher(false);
                  setActiveInventory(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3e5d8] text-sm font-bold text-[#7d6554]"
              >
                X
              </button>
            </div>

            {activeInventory === "food" && (
              <div className="space-y-2">
                {foodInventory.length === 0 && (
                  <p className="rounded-3xl border border-[#f2dfcf] bg-white p-4 text-center text-xs leading-5 text-[#8b705d]">
                    No food or drink items yet. Collect a Daily Drop first.
                  </p>
                )}

                {foodInventory.map((drop) => {
                  const count = getDisplayedDailyDropCount(drop.id);

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
                        x {count}
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
                  const count = getDisplayedDailyDropCount(drop.id);

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
                        Use x {count}
                      </span>
                    </button>
                  );
                })}

                {weeklyKeepsakes.map((keepsake) => (
                  <button
                    key={keepsake.id}
                    type="button"
                    onClick={() => {
                      setShowMemberSwitcher(false);
                      setPetFeedback(`${keepsake.name} is now in the Toy Box.`);
                    }}
                    className="flex w-full items-center gap-3 rounded-3xl border border-[#d18b63] bg-[#fff1df] p-3 text-left transition active:scale-[0.98]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7eadf] text-xl">
                      <ItemIcon item={keepsake} sizeClass="h-10 w-10" />
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
