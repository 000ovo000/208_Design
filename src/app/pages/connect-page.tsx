import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  ChevronDown,
  ImagePlus,
  Send,
  Smile,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { usePet } from "../context/pet-context";
import { getPetProfileImage, type PetItem } from "../data/pets";
import { apiUrl } from "../lib/api";
import {
  AlbumEntry,
  AlbumReaction,
  FamilyMember,
  FamilyMemberId,
} from "../types";

interface ConnectPageProps {
  familyMembers: FamilyMember[];
  albumEntries: AlbumEntry[];
  onCreateEntry: (entry: AlbumEntry) => void;
  onUpdateReaction: (entryId: string, reaction: AlbumReaction) => void;
  onDeleteEntry: (entryId: string) => void;
  onOverlayChange?: (hidden: boolean) => void;
}

type UploadDraft = {
  imageUrl: string;
  file: File | null;
  dogMessage: string;
};

type DbPost = {
  id: number | string;
  family_member_id?: number | string;
  user_id?: number;
  family_id?: number;
  title?: string;
  content?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  created_at?: string;
  createdAt?: string;
  uploadedAt?: string;
  reaction?: AlbumReaction;
};
type CurrentUser = {
  id: number | string;
  name: string;
  email?: string;
  family_id?: number | string;
};

type TimeRange = "day" | "week" | "month" | "year";

type DeleteMenuState = {
  entryId: string;
  x: number;
  y: number;
} | null;

type EntryReactionComment = {
  memberId: string;
  memberName: string;
  reaction: Exclude<AlbumReaction, null>;
};

type EntryReactionCommentMap = Record<string, EntryReactionComment[]>;

const REACTION_COMMENTS_STORAGE_KEY = "kinlight:album-reaction-comments";

const rangeOptions: { key: TimeRange; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "Last Week" },
  { key: "month", label: "Last Month" },
  { key: "year", label: "Last Year" },
];

const reactionOptions: { value: Exclude<AlbumReaction, null>; emoji: string }[] = [
  { value: "smile", emoji: "😊" },
  { value: "love", emoji: "😍" },
  { value: "clap", emoji: "👏" },
  { value: "wow", emoji: "😮" },
  { value: "sad", emoji: "😢" },
];

const quickMessageTags = [
  "Busy day today",
  "Wanted to share this",
  "A little tired",
  "Feeling good",
];

function getMemberPetProfileImage(member: FamilyMember, currentPet: PetItem) {
  if (member.is_current_user) return getPetProfileImage(currentPet);
  return "/images/dog/profile/dog-white.png";
}

function groupEntries(entries: AlbumEntry[]) {
  const grouped = entries.reduce<Record<string, AlbumEntry[]>>(
    (accumulator, entry) => {
      const key = String(entry.memberId);
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(entry);
      return accumulator;
    },
    {}
  );

  Object.values(grouped).forEach((memberEntries) => {
    memberEntries.sort(
      (first, second) =>
        parseUploadedAt(second.uploadedAt).getTime() - parseUploadedAt(first.uploadedAt).getTime()
    );
  });

  return grouped;
}

function formatNow() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function parseUploadedAt(uploadedAt: string) {
  return new Date(uploadedAt.replace(" ", "T"));
}

function formatUpdatesTime(uploadedAt: string) {
  const parsed = parseUploadedAt(uploadedAt);
  if (Number.isNaN(parsed.getTime())) return uploadedAt;

  return `${parsed.getHours()} : ${`${parsed.getMinutes()}`.padStart(2, "0")} updates`;
}

function formatGalleryTime(uploadedAt: string) {
  const parsed = parseUploadedAt(uploadedAt);
  if (Number.isNaN(parsed.getTime())) return uploadedAt;

  return `${parsed.getFullYear()}.${parsed.getMonth() + 1}.${parsed.getDate()} ${`${parsed
    .getHours()}`.padStart(2, "0")}:${`${parsed.getMinutes()}`.padStart(2, "0")}`;
}

function matchesRange(uploadedAt: string, range: TimeRange) {
  const entryDate = parseUploadedAt(uploadedAt);
  if (Number.isNaN(entryDate.getTime())) return true;

  const latestDate = new Date("2026-05-02T23:59:59");
  const diffDays = (latestDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

  if (range === "day") return diffDays <= 1;
  if (range === "week") return diffDays <= 7;
  if (range === "month") return diffDays <= 31;
  return diffDays <= 366;
}

function getRangeLabel(range: TimeRange) {
  if (range === "day") return "today";
  if (range === "week") return "this week";
  if (range === "month") return "this month";
  return "this year";
}

function readReactionComments() {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(REACTION_COMMENTS_STORAGE_KEY) || "{}"
    );

    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<EntryReactionCommentMap>((accumulator, [entryId, value]) => {
      if (!Array.isArray(value)) return accumulator;

      accumulator[entryId] = value.filter((comment): comment is EntryReactionComment => {
        return Boolean(
          comment &&
            typeof comment === "object" &&
            typeof comment.memberId === "string" &&
            typeof comment.memberName === "string" &&
            typeof comment.reaction === "string"
        );
      });

      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

function buildSummary(member: FamilyMember, range: TimeRange, entries: AlbumEntry[]) {
  const petName = member.dogName || `${member.name}'s pet`;
  const rangeLabel = getRangeLabel(range);

  if (!entries.length) {
    return `${petName} has not shared anything new ${rangeLabel}.`;
  }

  const photoNotes = entries
    .map((entry) => entry.dogMessage.trim())
    .filter(Boolean)
    .slice(0, 3);

  const lines = [
    `${petName} shared ${entries.length} photo${entries.length > 1 ? "s" : ""} ${rangeLabel}.`,
  ];

  if (!photoNotes.length) {
    lines.push("The latest update was saved without a text note.");
    return lines.join("\n");
  }

  photoNotes.forEach((note, index) => {
    const prefix =
      index === 0 ? "Latest image note" : index === 1 ? "Earlier image note" : "Another image note";
    lines.push(`${prefix}: "${note}".`);
  });

  return lines.join("\n");
}

function selectedReactionEmoji(reaction: AlbumReaction) {
  return reactionOptions.find((option) => option.value === reaction)?.emoji ?? null;
}

function convertPostToAlbumEntry(post: DbPost): AlbumEntry {
  return {
    id: String(post.id),
    memberId: String((post as DbPost & { family_member_id?: string | number }).family_member_id ?? post.user_id ?? ""),
    imageUrl: post.media_url || "/images/dog/profile/dog-white.png",
    uploadedAt: post.created_at ?? post.createdAt ?? post.uploadedAt ?? formatNow(),
    dogMessage: post.content ?? "",
    reaction: post.reaction ?? null,
  };
}

export function ConnectPage({
  familyMembers,
  albumEntries,
  onCreateEntry,
  onUpdateReaction,
  onDeleteEntry,
  onOverlayChange,
}: ConnectPageProps) {
  const { currentPet } = usePet();
  const [dbPosts, setDbPosts] = useState<DbPost[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<FamilyMemberId | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("week");
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [openReactionEntryId, setOpenReactionEntryId] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [deleteMenu, setDeleteMenu] = useState<DeleteMenuState>(null);
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [reactionCommentsByEntryId, setReactionCommentsByEntryId] =
    useState<EntryReactionCommentMap>(readReactionComments);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  void onCreateEntry;

  const dbAlbumEntries = useMemo(
    () => dbPosts.map((post) => convertPostToAlbumEntry(post)),
    [dbPosts]
  );
  const mergedAlbumEntries = useMemo(
    () => [...dbAlbumEntries, ...albumEntries],
    [albumEntries, dbAlbumEntries]
  );
  const albumsByMember = useMemo(
    () => groupEntries(mergedAlbumEntries),
    [mergedAlbumEntries]
  );
  const selectedMember =
    familyMembers.find((member) => String(member.id) === String(selectedMemberId)) ?? null;
  const isCurrentUserMember = (member?: FamilyMember | null) => {
    if (!member || !currentUser) return false;
    return (
      String(member.id) === String(currentUser.id) ||
      Boolean(member.email && currentUser.email && member.email === currentUser.email)
    );
  };
  const currentUserMemberId = currentUser?.id != null ? String(currentUser.id) : null;
  const currentMember =
    familyMembers.find((member) => isCurrentUserMember(member)) ?? familyMembers[0] ?? null;
  const isSelectedMemberCurrentUser = selectedMember
    ? String(selectedMember.id) === String(currentUserMemberId ?? currentMember?.id ?? "")
    : false;
  const selectedEntries = useMemo(() => {
    if (!selectedMemberId) return [];

    return (albumsByMember[String(selectedMemberId)] ?? []).filter((entry) =>
      matchesRange(entry.uploadedAt, selectedRange)
    );
  }, [albumsByMember, selectedMemberId, selectedRange]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(apiUrl("/api/me"));
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
    if (!familyMembers.length) {
      setSelectedMemberId(null);
      return;
    }
    if (!selectedMemberId) return;
    const stillExists = familyMembers.some(
      (member) => String(member.id) === String(selectedMemberId)
    );
    if (!stillExists) {
      setSelectedMemberId(currentMember?.id ?? familyMembers[0]?.id ?? null);
    }
  }, [familyMembers, selectedMemberId, currentMember]);

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        const response = await fetch(apiUrl("/api/posts"));
        if (!response.ok) return;

        const data = await response.json();
        const posts = Array.isArray(data) ? data : data.posts;

        if (isMounted && Array.isArray(posts)) {
          setDbPosts(posts);
        }
      } catch (error) {
        // Keep the local album entries visible if the backend is unavailable.
      }
    };

    setDbPosts([]);
    void fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      REACTION_COMMENTS_STORAGE_KEY,
      JSON.stringify(reactionCommentsByEntryId)
    );
  }, [reactionCommentsByEntryId]);

  useEffect(() => {
    onOverlayChange?.(
      Boolean(
        showUploadSheet ||
          draft ||
          showRangeMenu ||
          openReactionEntryId ||
          deleteMenu ||
          pendingDeleteEntryId
      )
    );
    return () => onOverlayChange?.(false);
  }, [
    deleteMenu,
    draft,
    onOverlayChange,
    openReactionEntryId,
    pendingDeleteEntryId,
    showRangeMenu,
    showUploadSheet,
  ]);

  const closeTransientUi = () => {
    setShowRangeMenu(false);
    setOpenReactionEntryId(null);
    setDeleteMenu(null);
  };

  const getReactionCommentsForEntry = (entryId: string) =>
    reactionCommentsByEntryId[String(entryId)] ?? [];

  const getCurrentViewerReaction = (entryId: string) => {
    if (!currentMember) return null;

    return (
      getReactionCommentsForEntry(entryId).find(
        (comment) => comment.memberId === String(currentMember.id)
      )?.reaction ?? null
    );
  };

  const handleReactionSelect = (entryId: string, reaction: Exclude<AlbumReaction, null>) => {
    if (!currentMember) return;

    const normalizedEntryId = String(entryId);
    const memberId = String(currentMember.id);
    const memberName = currentMember.name || "Me";

    setReactionCommentsByEntryId((current) => {
      const existing = current[normalizedEntryId] ?? [];
      const nextComments = [
        ...existing.filter((comment) => comment.memberId !== memberId),
        { memberId, memberName, reaction },
      ];

      return {
        ...current,
        [normalizedEntryId]: nextComments,
      };
    });

    onUpdateReaction(entryId, reaction);
  };

  const handleChooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image uploads are supported here.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setDraft((current) => ({
      imageUrl: previewUrl,
      file,
      dogMessage: current?.dogMessage ?? "",
    }));
    setShowUploadSheet(false);
    event.target.value = "";
  };

  const handleRemoveDraftPhoto = () => {
    setDraft((current) =>
      current
        ? {
            ...current,
            imageUrl: "",
            file: null,
          }
        : current
    );
  };

  const handleSubmitDraft = async () => {
    if (!draft || !isSelectedMemberCurrentUser || !currentMember) return;

    let uploadedImageUrl: string | null = null;

    if (draft.file) {
      const formData = new FormData();
      formData.append("image", draft.file);

      try {
        const uploadResponse = await fetch(apiUrl("/api/uploads"), {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          alert("Failed to upload image.");
          return;
        }

        const uploadResult = await uploadResponse.json();
        uploadedImageUrl = uploadResult.imageUrl;
      } catch (error) {
        alert("Failed to upload image.");
        return;
      }
    }

    try {
      const postResponse = await fetch(apiUrl("/api/posts"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentMember.id,
          family_member_id: currentMember.id,
          family_id: currentMember.family_id ?? 1,
          title: "Family Update",
          content: draft.dogMessage.trim(),
          media_url: uploadedImageUrl,
          media_type: uploadedImageUrl ? "image" : "text",
        }),
      });

      if (!postResponse.ok) {
        alert("Failed to create post.");
        return;
      }

      const result = await postResponse.json();
      const savedPost: DbPost = {
        ...result,
        id: result.id ?? `local-${Date.now()}`,
        content: result.content ?? draft.dogMessage.trim(),
        media_url: result.media_url ?? uploadedImageUrl,
        media_type: result.media_type ?? (uploadedImageUrl ? "image" : "text"),
        created_at: result.created_at ?? formatNow(),
      };

      setDbPosts((prev) => [savedPost, ...prev]);
      window.dispatchEvent(new Event("home-data-updated"));
      setDraft(null);
    } catch (error) {
      alert("Failed to create post.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteEntryId) return;

    const entryIdToDelete = String(pendingDeleteEntryId);

    setDbPosts((prev) => prev.filter((post) => String(post.id) !== entryIdToDelete));
    try {
      onDeleteEntry(entryIdToDelete);
    } catch (error) {
      // Keep deletion working in Connect even if parent callback fails.
      console.error("Failed to sync delete to parent:", error);
    }
    setPendingDeleteEntryId(null);
    setDeleteMenu(null);

    if (!entryIdToDelete.startsWith("local-")) {
      try {
        await fetch(apiUrl(`/api/posts/${entryIdToDelete}`), {
          method: "DELETE",
        });
      } catch (error) {
        // The item is still removed from the current UI even if the backend has no delete endpoint yet.
      }
    }
  };

  if (selectedMember) {
    const rangeLabel =
      rangeOptions.find((item) => item.key === selectedRange)?.label ?? "Last Week";

    return (
      <div
        className="relative flex h-full flex-col bg-[#f5ede5]"
        onClick={() => {
          if (deleteMenu) setDeleteMenu(null);
        }}
      >
        <input
          id="album-library-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChooseFile}
        />
        <input
          id="album-camera-input"
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChooseFile}
        />

        <div className="relative border-b border-[#ebddd0] bg-[#f8efe7] px-6 pb-4 pt-5">
          <div className="grid grid-cols-[40px_48px_1fr_48px] items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId(null);
                setShowRangeMenu(false);
                setShowUploadSheet(false);
                setOpenReactionEntryId(null);
                setSummaryExpanded(false);
                setDeleteMenu(null);
                setPendingDeleteEntryId(null);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#2d2721]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="h-12 w-12 overflow-hidden rounded-[16px]">
              <img
                src={selectedMember.avatarUrl}
                alt={selectedMember.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="relative flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowRangeMenu((current) => !current);
                  setOpenReactionEntryId(null);
                  setDeleteMenu(null);
                }}
                className="flex items-center gap-2 text-[18px] font-medium text-[#25211d]"
              >
                <span>{rangeLabel}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showRangeMenu && (
                <div className="absolute top-11 z-20 w-36 rounded-[18px] border border-[#eadbcd] bg-white p-1 shadow-[0_14px_30px_rgba(89,67,49,0.12)]">
                  {rangeOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setSelectedRange(option.key);
                        setShowRangeMenu(false);
                        setOpenReactionEntryId(null);
                        setSummaryExpanded(false);
                        setDeleteMenu(null);
                      }}
                      className={`w-full rounded-[14px] px-3 py-2 text-sm ${
                        option.key === selectedRange
                          ? "bg-[#fce7ea] text-[#fb5b8a]"
                          : "text-[#5d4b3f]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isSelectedMemberCurrentUser ? (
              <button
                type="button"
                onClick={() => {
                  closeTransientUi();
                  setShowUploadSheet(true);
                }}
                className="ml-auto flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-black shadow-sm"
              >
                <Camera className="h-5 w-5" />
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="mt-3 text-center text-[13px] text-[#8d7767]">
            {selectedEntries.length} photos in this range
          </div>
        </div>

        <div className="hide-scrollbar flex-1 overflow-y-auto px-6 pb-28 pt-5">
          {selectedEntries.length > 0 && (
            <div className="relative mb-6">
              <div className="absolute left-0 top-2 z-10">
                <button
                  type="button"
                  onClick={() => {
                    setSummaryExpanded((current) => !current);
                    setDeleteMenu(null);
                  }}
                  className={`flex items-center gap-3 rounded-[20px] bg-white shadow-[0_16px_30px_rgba(93,67,46,0.12)] transition-all ${
                    summaryExpanded ? "max-w-[74%] px-4 py-4" : "px-3 py-3"
                  }`}
                >
                  {!summaryExpanded && (
                    <div className="rounded-[10px] bg-[#f8eee7] p-2">
                      <img
                        src={getMemberPetProfileImage(selectedMember, currentPet)}
                        alt={`${selectedMember.name}'s pet`}
                        className="h-10 w-10 object-contain"
                      />
                    </div>
                  )}
                  {summaryExpanded && (
                    <div className="min-w-0 text-left">
                      <div className="mb-1 flex items-center gap-1 text-[#6c5341]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                          Summary
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-[16px] leading-6 text-[#2f2720]">
                        {buildSummary(selectedMember, selectedRange, selectedEntries)}
                      </p>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className={`space-y-6 ${summaryExpanded ? "pt-20" : "pt-8"}`}>
            {selectedEntries.map((entry) => {
              const canDelete = isSelectedMemberCurrentUser;
              const reactionComments = getReactionCommentsForEntry(entry.id);
              const currentViewerReaction = getCurrentViewerReaction(entry.id);

              return (
                <article key={entry.id} className="relative">
                  <div
                    className="relative overflow-hidden rounded-[28px]"
                    onContextMenu={(event) => {
                      if (!canDelete) return;
                      event.preventDefault();
                      setDeleteMenu({
                        entryId: entry.id,
                        x: event.clientX,
                        y: event.clientY,
                      });
                      setOpenReactionEntryId(null);
                    }}
                  >
                    <img
                      src={entry.imageUrl}
                      alt={`${selectedMember.name} album`}
                      className="aspect-[4/3.2] w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/48 via-black/12 to-transparent px-5 pb-4 pt-10">
                      <p className="text-[12px] tracking-[0.08em] text-white">
                        {formatGalleryTime(entry.uploadedAt)}
                      </p>

                      <div className="relative">
                        {openReactionEntryId === entry.id && (
                          <div className="absolute bottom-16 right-0 flex gap-2 rounded-full bg-white/94 px-3 py-2 shadow-lg">
                            {reactionOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  handleReactionSelect(entry.id, option.value);
                                  setOpenReactionEntryId(null);
                                }}
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-xl ${
                                  currentViewerReaction === option.value ? "bg-[#f3efe9]" : ""
                                }`}
                              >
                                {option.emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setOpenReactionEntryId((current) =>
                              current === entry.id ? null : entry.id
                            )
                          }
                          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-white/8 text-white backdrop-blur-sm"
                        >
                          {selectedReactionEmoji(currentViewerReaction) ? (
                            <span className="text-[30px] leading-none">
                              {selectedReactionEmoji(currentViewerReaction)}
                            </span>
                          ) : (
                            <Smile className="h-7 w-7" strokeWidth={2.2} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {reactionComments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 px-2">
                      {reactionComments.map((comment) => (
                        <div
                          key={`${entry.id}-${comment.memberId}`}
                          className="flex min-w-[52px] flex-col items-center text-center"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl shadow-[0_8px_18px_rgba(79,57,38,0.12)]">
                            {selectedReactionEmoji(comment.reaction)}
                          </div>
                          <div className="mt-1 text-[11px] font-medium leading-4 text-[#7a6555]">
                            {comment.memberName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.dogMessage.trim() && (
                    <div className="mt-2 px-2 text-[14px] text-[#6d5849]">
                      {entry.dogMessage}
                    </div>
                  )}
                </article>
              );
            })}

            {selectedEntries.length === 0 && (
              <div className="rounded-[24px] bg-white px-5 py-6 text-center text-sm leading-6 text-[#8d7060] shadow-[0_12px_28px_rgba(79,57,38,0.08)]">
                There is nothing in this time range yet.
              </div>
            )}
          </div>
        </div>

        {deleteMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDeleteMenu(null)}
          >
            <div
              className="absolute w-40 rounded-[18px] border border-[#eadbcd] bg-white p-1 shadow-[0_14px_30px_rgba(89,67,49,0.18)]"
              style={{
                left: Math.min(deleteMenu.x, window.innerWidth - 172),
                top: Math.min(deleteMenu.y, window.innerHeight - 80),
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteEntryId(deleteMenu.entryId);
                  setDeleteMenu(null);
                }}
                className="flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-semibold text-[#9b3d2e] hover:bg-[#fff2ef]"
              >
                <Trash2 className="h-4 w-4" />
                Delete photo
              </button>
            </div>
          </div>
        )}

        {pendingDeleteEntryId && (
          <div
            className="absolute inset-0 z-[999] flex items-end bg-black/30 px-4 pb-6 pointer-events-auto"
            onClick={() => setPendingDeleteEntryId(null)}
          >
            <div
              className="w-full rounded-[28px] bg-white p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-2xl bg-[#fff2ef] p-3 text-[#c14d36]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#3f2f24]">
                    Delete this photo?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#8b705d]">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDeleteEntryId(null);
                  }}
                  className="flex-1 rounded-[18px] bg-[#f6f1ec] px-4 py-3 text-sm font-semibold text-[#745d4c]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteConfirm();
                  }}
                  className="flex-1 rounded-[18px] bg-[#c14d36] px-4 py-3 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showUploadSheet && isSelectedMemberCurrentUser && (
          <div className="absolute inset-0 z-40 flex items-end bg-black/20 px-5 pb-6">
            <div className="w-full rounded-[28px] bg-white p-4 shadow-2xl">
              <div className="grid grid-cols-2 gap-3">
                <label
                  htmlFor="album-camera-input"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] bg-[#f8efe4] px-4 py-5 text-[#5d4637]"
                >
                  <Camera className="mb-2 h-6 w-6" />
                  <span className="text-sm font-semibold">Camera</span>
                </label>
                <label
                  htmlFor="album-library-input"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] bg-[#eef4fb] px-4 py-5 text-[#465c78]"
                >
                  <ImagePlus className="mb-2 h-6 w-6" />
                  <span className="text-sm font-semibold">Library</span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadSheet(false)}
                className="mt-3 w-full rounded-[18px] bg-[#f6f1ec] px-4 py-3 text-sm font-semibold text-[#745d4c]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {draft && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
            <div className="max-h-full w-full max-w-md overflow-y-auto rounded-[30px] bg-[#fffaf5] p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#3f2f24]">Confirm upload</h2>
                  <p className="mt-1 text-sm text-[#8b705d]">
                    Your own upload can still carry a pet note to the home page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e7dc] text-[#6d5645]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {draft.imageUrl ? (
                <div className="mb-4">
                  <img
                    src={draft.imageUrl}
                    alt="Upload preview"
                    className="max-h-[280px] w-full rounded-[24px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveDraftPhoto}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#f3e7dc] px-4 py-3 text-sm font-semibold text-[#7b604f]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete photo
                  </button>
                </div>
              ) : (
                <div className="mb-4 rounded-[24px] border border-dashed border-[#d8c3b1] bg-[#fff7f0] px-4 py-8 text-center text-sm text-[#9a7e69]">
                  Photo removed. You can keep the note only, or choose another photo from Camera / Library.
                </div>
              )}

              <div className="rounded-[24px] border border-[#efdfd1] bg-white px-4 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-2xl bg-[#f7efe7] p-2">
                    <img
                      src={getPetProfileImage(currentPet)}
                      alt={currentPet.name}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#4f3c2e]">Pet note</p>
                    <p className="text-xs text-[#9a7e69]">
                      Example: Today felt good, so I want this note to appear on the home page.
                    </p>
                  </div>
                </div>

                <textarea
                  value={draft.dogMessage}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, dogMessage: event.target.value } : current
                    )
                  }
                  placeholder="Write the line you want the home pet to say"
                  rows={3}
                  className="w-full resize-none rounded-[20px] border border-[#ead8ca] bg-[#fffaf6] px-4 py-3 text-sm text-[#4f3c2e] outline-none placeholder:text-[#b59b89]"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {quickMessageTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setDraft((current) =>
                          current ? { ...current, dogMessage: tag } : current
                        )
                      }
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        draft.dogMessage === tag
                          ? "bg-[#6d5645] text-white"
                          : "bg-[#f7efe7] text-[#7b604f]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitDraft}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#6d5645] px-4 py-4 text-sm font-semibold text-white"
              >
                <Send className="h-4 w-4" />
                Save photo and note
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#f5ede5] px-4 pb-24 pt-4">
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        <div className="space-y-4">
          {familyMembers.map((member) => {
            const latestEntry = albumsByMember[String(member.id)]?.[0] ?? null;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className="w-full rounded-[28px] bg-white/90 p-4 text-left shadow-[0_10px_24px_rgba(81,60,42,0.08)]"
              >
                <div className="mb-2 flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="h-14 w-14 rounded-[16px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[#29231e]">
                        {member.name}
                      </span>
                      <span className="text-[14px] text-[#f3b52f]">☼</span>
                      <span className="text-[13px] tracking-[0.18em] text-[#92857a]">
                        {latestEntry ? formatUpdatesTime(latestEntry.uploadedAt) : "No updates"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 rounded-full bg-[#f5f5f6] px-3 py-2">
                      <img
                        src={getMemberPetProfileImage(member, currentPet)}
                        alt={`${member.name}'s pet`}
                        className="h-8 w-8 object-contain"
                      />
                      <p className="truncate text-[16px] text-[#1f1f1f]">
                        {latestEntry?.dogMessage.trim() || "Tap to open the album"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[24px]">
                  {latestEntry ? (
                    <img
                      src={latestEntry.imageUrl}
                      alt={`${member.name} preview`}
                      className="aspect-[4/3.9] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3.9] items-center justify-center bg-[#f7f1eb] text-sm text-[#a18a79]">
                      No photo uploaded yet
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
