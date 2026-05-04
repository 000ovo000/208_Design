import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, ChevronDown, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { usePet } from "../context/pet-context";
import {
  dailyDrops,
  getDailyDropsForPet,
  type DailyDrop,
} from "../data/daily-drops";
import { getFamilySelectedPetId } from "../data/family-data";
import { defaultPetId, getPetById, getPetProfileImage, type PetId } from "../data/pets";
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

const inventoryTabs: { key: InventoryTab; label: string; title: string; emoji: string }[] = [
  { key: "shop", label: "Shop", title: "Pet Collection", emoji: "🛍️" },
  { key: "food", label: "Food", title: "Food Storage", emoji: "🍪" },
  { key: "toy", label: "Toys", title: "Toy Box", emoji: "🎾" },
];

const getStorageArea = (drop: DailyDrop): StorageArea => {
  return drop.category === "food" || drop.category === "drink" ? "food" : "toy";
};

const pickRandomDrop = (drops: DailyDrop[]) => {
  return drops[Math.floor(Math.random() * drops.length)] ?? dailyDrops[0];
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
    setTodayDrop(pickRandomDrop(availableDailyDrops));
    setDailyDropState(hasClaimedDailyDropToday ? "claimed" : "available");
    setCollectedMessage("");
  }, [availableDailyDrops, hasClaimedDailyDropToday]);

  useEffect(() => {
    const checkDailyDropStatus = async () => {
      if (!currentUser?.id) {
        setHasClaimedDailyDropToday(false);
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
  }, [currentUser?.id]);

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
    setShowMemberSwitcher(false);
    setActiveInventory(tab);

    if (tab === "food" || tab === "toy") {
      setStorageDot((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const claimDailyDrop = async () => {
    setShowMemberSwitcher(false);
    if (!currentUser?.id || dailyDropState !== "available" || hasClaimedDailyDropToday) return;

    setDailyDropState("claiming");

    window.setTimeout(async () => {
      const storageArea = getStorageArea(todayDrop);
      try {
        const itemsRes = await fetch("http://localhost:3001/api/items");
        if (!itemsRes.ok) throw new Error("Failed to load items");
        const items = await itemsRes.json();
        const item = items.find((entry: { name: string }) => entry.name === todayDrop.name);
        if (!item?.id) throw new Error("Drop item not found");

        const claimRes = await fetch("http://localhost:3001/api/daily-drop/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: item.id }),
        });

        if (claimRes.status === 409) {
          setHasClaimedDailyDropToday(true);
          setDailyDropState("claimed");
          if (currentUser?.id) {
            window.localStorage.setItem(getDailyDropClaimKey(currentUser.id), "true");
          }
          return;
        }

        if (!claimRes.ok) throw new Error("Failed to claim daily drop");

        const added = await addDailyDropToInventory(todayDrop.id, 1);
        if (!added) {
          setDailyDropState("available");
          setPetFeedback("Collected but inventory refresh failed. Please reload.");
          return;
        }
      } catch {
        setDailyDropState("available");
        setPetFeedback("Could not save this drop to inventory.");
        return;
      }

      setHasClaimedDailyDropToday(true);
      if (currentUser?.id) {
        window.localStorage.setItem(getDailyDropClaimKey(currentUser.id), "true");
      }
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

  const useDrop = async (drop: DailyDrop) => {
    setShowMemberSwitcher(false);
    const usedDrop = await useDailyDropItem(drop.id);
    if (!usedDrop) return;

    setPetFeedback(getPetReaction(usedDrop.category));
    setActiveInventory(null);
  };

  const choosePet = (petId: typeof petItems[number]["id"]) => {
    setShowMemberSwitcher(false);
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
            <div className="absolute right-5 top-[100px] z-30 flex flex-col items-center gap-4">
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
          )}
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute left-1/2 top-[50px] z-20 h-[150px] w-[230px] -translate-x-1/2">
            {/* 相框底层 */}
            <img
              src="/images/home/hanging-frame.png"
              alt="Hanging photo frame"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
            />

            {/* 照片层：固定内框大小，超出部分裁剪，效果和 Connect 相册一致 */}
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

          {currentMember && !hasClaimedDailyDropToday && dailyDropState !== "claimed" && todayDrop && (
            <motion.button
              type="button"
              onClick={() => {
                setShowMemberSwitcher(false);
                void claimDailyDrop();
              }}
              disabled={dailyDropState !== "available"}
              whileTap={dailyDropState === "available" ? { scale: 0.95 } : undefined}
              className="absolute right-[28px] top-[620px] z-30 flex flex-col items-center disabled:cursor-default"
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
              className="absolute right-[28px] top-[690px] z-30 rounded-full bg-white/88 px-3 py-2 text-xs font-bold text-[#8d684d] shadow-sm"
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
                ` · ${lastPlacedDailyDrop ? lastPlacedDailyDrop.name : "waiting for care"}`}
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
            className="max-h-[68vh] w-full overflow-y-auto rounded-[30px] border border-white/80 bg-[#fffaf5] p-4 shadow-[0_22px_50px_rgba(67,48,34,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
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
                    onClick={() => {
                      setShowMemberSwitcher(false);
                      setPetFeedback(`${keepsake.name} is now in the Toy Box.`);
                    }}
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
