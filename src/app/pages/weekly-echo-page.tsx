import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  MessageCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { usePet } from "../context/pet-context";
import { weeklyCollectedDrops, type DailyDropCategory } from "../data/daily-drops";
import {
  getWeeklyRewardsForPet,
  type WeeklyReward,
  type WeeklyRewardStats,
} from "../data/weekly-rewards";
import type { PetItem } from "../data/pets";
import type { AlbumEntry, FamilyMember } from "../types";

type EchoPageKey = "summary" | "moments" | "keepsakes";

type PetReplyKey = "gentle" | "details" | "thanks";

type WeeklyEchoScene = "boards" | "gift";

type GiftRevealStage = "closed" | "shaking" | "open" | "revealed";

type AiEchoSummary = {
  subtitle: string;
  body: string;
};

type DropSummaryCategory = "food" | "drink" | "basic-toy";

type WeeklyDropCategorySummary = {
  key: DropSummaryCategory;
  label: string;
  count: number;
  itemNames: string[];
  preview: string;
};

type WeeklyRewardCandidate =
  | {
      type: "item";
      reward: WeeklyReward;
    }
  | {
      type: "pet";
      pet: PetItem;
    };

const chalkFontStyle: CSSProperties = {
  fontFamily: '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive',
};

const petReplies: Record<PetReplyKey, string> = {
  gentle: "I kept the small moments safe for your family.",
  details: "This week felt warm: more reactions, a few photos, and gentle mood sharing.",
  thanks: "I can help you send a small thank-you back to your family.",
};

const dropCategoryLabels: Record<DropSummaryCategory, string> = {
  food: "Food",
  drink: "Drink",
  "basic-toy": "Basic toy",
};

const getWeeklyDropSummaryKey = (
  category: DailyDropCategory
): DropSummaryCategory | null => {
  if (category === "food" || category === "drink") return category;
  if (category === "basic-toy" || category === "care") return "basic-toy";
  return null;
};

const formatDropNamePreview = (itemNames: string[]) => {
  if (itemNames.length > 3) {
    return `${itemNames.slice(0, 2).join(", ")}, ...`;
  }
  return itemNames.join(", ");
};

const pickRandomCandidate = (candidates: WeeklyRewardCandidate[]) => {
  return candidates[Math.floor(Math.random() * candidates.length)] ?? candidates[0];
};

interface WeeklyEchoPageProps {
  stats: WeeklyRewardStats;
  weeklyAlbumEntries: AlbumEntry[];
  familyMembers: FamilyMember[];
  weeklyKeepsakes: WeeklyReward[];
  onAddKeepsake: (reward: WeeklyReward) => void;
  addedKeepsakeIds: string[];
}

function RewardIcon({
  reward,
  sizeClass = "h-16 w-16",
  emojiClassName = "text-4xl leading-none",
}: {
  reward: Pick<WeeklyReward | PetItem, "image" | "name"> & { emoji?: string };
  sizeClass?: string;
  emojiClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (reward.image && failedSrc !== reward.image) {
    return (
      <img
        src={reward.image}
        alt={reward.name}
        className={`${sizeClass} object-contain`}
        onError={() => setFailedSrc(reward.image ?? null)}
      />
    );
  }

  return (
    <span className={emojiClassName} aria-hidden="true">
      {reward.emoji ?? "🎁"}
    </span>
  );
}

export function WeeklyEchoPage({
  stats,
  weeklyAlbumEntries,
  familyMembers,
  weeklyKeepsakes,
  onAddKeepsake,
  addedKeepsakeIds,
}: WeeklyEchoPageProps) {
  const { currentPet, petItems, unlockedPetIds, unlockPet } = usePet();
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [activePage, setActivePage] = useState(0);
  const [replyKey, setReplyKey] = useState<PetReplyKey>("gentle");
  const [aiSummary, setAiSummary] = useState<AiEchoSummary | null>(null);
  const [aiSummaryStatus, setAiSummaryStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [aiSummaryError, setAiSummaryError] = useState("");

  const [scene, setScene] = useState<WeeklyEchoScene>("boards");
  const [giftRevealStage, setGiftRevealStage] = useState<GiftRevealStage>("closed");
  const weeklyRewardCandidates = useMemo<WeeklyRewardCandidate[]>(() => {
    const itemCandidates = getWeeklyRewardsForPet(currentPet.species).map((reward) => ({
      type: "item" as const,
      reward,
    }));
    const petCandidates = petItems
      .filter((pet) => !unlockedPetIds.includes(pet.id))
      .map((pet) => ({
        type: "pet" as const,
        pet,
      }));

    return [...itemCandidates, ...petCandidates];
  }, [currentPet.species, petItems, unlockedPetIds]);
  const [selectedWeeklyRewardCandidate, setSelectedWeeklyRewardCandidate] =
    useState<WeeklyRewardCandidate | null>(null);
  const selectedWeeklyReward =
    selectedWeeklyRewardCandidate?.type === "item"
      ? selectedWeeklyRewardCandidate.reward
      : null;
  const selectedPetReward =
    selectedWeeklyRewardCandidate?.type === "pet"
      ? selectedWeeklyRewardCandidate.pet
      : null;
  const addedToToyBox = selectedWeeklyReward
    ? addedKeepsakeIds.includes(selectedWeeklyReward.id)
    : false;
  const addedToPetCollection = selectedPetReward
    ? unlockedPetIds.includes(selectedPetReward.id)
    : false;
  const weeklyStats = [
    { label: "Pet messages", value: stats.petMessages, icon: "🐾" },
    { label: "Photo shares", value: stats.photoShares, icon: "🖼️" },
    { label: "Mood check-ins", value: stats.moodCheckIns, icon: "🫧" },
    { label: "Gentle reactions", value: stats.gentleReactions, icon: "💗" },
  ];
  const weeklyMoments = [
    `Your family shared ${stats.photoShares} photos this week.`,
    `${stats.petMessages} pet messages helped small moments travel home.`,
    `${stats.gentleReactions} gentle reactions and ${stats.moodCheckIns} mood check-ins kept the week warm.`,
  ];
  const weeklyDropCategorySummaries = useMemo<WeeklyDropCategorySummary[]>(() => {
    const summaryMap = new Map<DropSummaryCategory, { count: number; itemNames: string[] }>();

    weeklyCollectedDrops.forEach((drop) => {
      const key = getWeeklyDropSummaryKey(drop.category);
      if (!key || drop.count <= 0) return;

      const summary = summaryMap.get(key) ?? { count: 0, itemNames: [] };
      summary.count += drop.count;
      if (!summary.itemNames.includes(drop.name)) {
        summary.itemNames.push(drop.name);
      }
      summaryMap.set(key, summary);
    });

    return (["food", "drink", "basic-toy"] as DropSummaryCategory[])
      .map((key) => {
        const summary = summaryMap.get(key);
        if (!summary || summary.count <= 0) return null;

        return {
          key,
          label: dropCategoryLabels[key],
          count: summary.count,
          itemNames: summary.itemNames,
          preview: formatDropNamePreview(summary.itemNames),
        };
      })
      .filter((summary): summary is WeeklyDropCategorySummary => Boolean(summary));
  }, []);
  const weeklyStorySignals = useMemo(
    () => ({
      photos: weeklyAlbumEntries.map((entry) => {
        const member = familyMembers.find(
          (familyMember) => String(familyMember.id) === String(entry.memberId)
        );

        return {
          author: member?.name || "Family member",
          uploadedAt: entry.uploadedAt,
          dogMessage: entry.dogMessage,
          reaction: entry.reaction,
        };
      }),
      moodBeads: {
        count: stats.moodCheckIns,
      },
      lightResponses: weeklyAlbumEntries
        .filter((entry) => entry.reaction)
        .map((entry) => ({
          reaction: entry.reaction,
          uploadedAt: entry.uploadedAt,
        })),
      unlockedDecorations: [
        ...weeklyKeepsakes.map((keepsake) => keepsake.name),
      ].filter(Boolean),
      currentPet: {
        name: currentPet.name,
        species: currentPet.species,
      },
    }),
    [
      currentPet.name,
      currentPet.species,
      familyMembers,
      stats.moodCheckIns,
      weeklyAlbumEntries,
      weeklyKeepsakes,
    ]
  );

  useEffect(() => {
    let ignore = false;

    async function loadWeeklyEchoSummary() {
      setAiSummaryStatus("loading");
      setAiSummaryError("");

      try {
        const response = await fetch("http://localhost:3001/api/weekly-echo/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stats,
            moments: weeklyMoments,
            storySignals: weeklyStorySignals,
            petName: currentPet.name,
          }),
        });

        const data = await response.json();
        if (ignore) return;

        if (!response.ok && !data.summary) {
          throw new Error(data.error || "Failed to load weekly echo.");
        }

        setAiSummary(data.summary);
        setAiSummaryStatus(data.source === "ai" ? "ready" : "fallback");

        if (!response.ok) {
          setAiSummaryError("AI service is unavailable, so the board used a local weekly summary.");
        }
      } catch (error) {
        if (ignore) return;
        setAiSummary(null);
        setAiSummaryStatus("error");
        setAiSummaryError(error instanceof Error ? error.message : "Failed to load weekly echo.");
      }
    }

    void loadWeeklyEchoSummary();

    return () => {
      ignore = true;
    };
  }, [
    currentPet.name,
    stats.connectedDays,
    stats.gentleReactions,
    stats.moodCheckIns,
    stats.petMessages,
    stats.photoShares,
    weeklyStorySignals,
  ]);

  const giftBubbleText =
    giftRevealStage === "closed"
      ? "Tap the box to open it."
      : giftRevealStage === "shaking"
        ? "Opening..."
        : giftRevealStage === "open"
          ? "Something is inside!"
          : "You made something warm this week!";

  const handleOpenGift = () => {
    if (giftRevealStage !== "closed") return;

    setGiftRevealStage("shaking");

    window.setTimeout(() => {
      setGiftRevealStage("open");
    }, 650);

    window.setTimeout(() => {
      setGiftRevealStage("revealed");
    }, 1500);
  };


  const pages = useMemo(
    () => [
      {
        key: "summary" as EchoPageKey,
        title: "This Week's Echo",
        subtitle: aiSummary?.subtitle || `Your family shared ${stats.photoShares} small moments.`,
        body: aiSummary?.body || `You stayed lightly connected on ${stats.connectedDays} days. No pressure, just a few warm traces left behind.`,
      },
      {
        key: "moments" as EchoPageKey,
        title: "Small Moments",
        subtitle: "Little things that mattered",
        body: "Mom noticed your campus photo. Dad replied after dinner. Your mood beads quietly showed how the week felt.",
      },
      {
        key: "keepsakes" as EchoPageKey,
        title: "Shared Keepsakes",
        subtitle: "Small surprises found this week",
        body: "Your pet found little surprises through the week.\nSome small items fade, while keepsakes stay as family memories.",
      },
    ],
    [aiSummary?.body, aiSummary?.subtitle, stats.connectedDays, stats.photoShares]
  );

  const scrollToPage = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, pages.length - 1));
    setActivePage(nextIndex);

    const board = boardRef.current;
    if (board) {
      board.scrollTo({ left: board.clientWidth * nextIndex, behavior: "smooth" });
    }
  };

  const handleBoardScroll = () => {
    const board = boardRef.current;
    if (!board) return;
    const nextIndex = Math.round(board.scrollLeft / board.clientWidth);
    if (nextIndex !== activePage) {
      setActivePage(nextIndex);
    }
  };

  if (scene === "gift") {
    return (
      <div className="relative min-h-full overflow-y-auto bg-gradient-to-b from-[#fff7ed] via-[#fffaf4] to-[#f7efe5] px-5 pb-32 pt-5 text-[#4b3528]">
        <button
          type="button"
          onClick={() => {
            setScene("boards");
            setGiftRevealStage("closed");
          }}
          className="mb-4 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#8d684d] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Weekly Echo
        </button>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b8895f]">
            Weekly Keepsake
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#3d2b22]">
            A Gift for This Week
          </h1>
          <p className="mx-auto mt-2 max-w-[300px] text-sm leading-5 text-[#8a6e5a]">
            Your small family moments turned into a keepsake.
          </p>
        </motion.div>

        <section className="relative mt-2 min-h-[430px] rounded-[32px] bg-[#fff2df] px-5 pb-6 pt-8 shadow-[0_18px_35px_rgba(128,93,63,0.16)]">
          <div className="absolute left-5 top-0 flex items-start gap-3">
            <img
              src={currentPet.image}
              alt={currentPet.name}
              className="relative z-[70] h-28 w-28 shrink-0 object-contain drop-shadow-[0_8px_12px_rgba(93,62,37,0.18)]"
            />

            <div className="mt-2 max-w-[160px] rounded-2xl bg-white px-3 py-2 text-left text-xs leading-4 text-[#7b604f] shadow-sm">
              {giftBubbleText}
            </div>
          </div>

          <div className="flex min-h-[340px] flex-col items-center justify-start pt-8">
            {giftRevealStage !== "revealed" ? (
              <motion.button
                type="button"
                onClick={handleOpenGift}
                disabled={giftRevealStage !== "closed"}
                whileTap={giftRevealStage === "closed" ? { scale: 0.96 } : undefined}
                className={`mt-16 flex flex-col items-center disabled:cursor-default ${
                  giftRevealStage === "closed" || giftRevealStage === "shaking"
                    ? "translate-y-[48px]"
                    : ""
                }`}
              >
                <motion.img
                  key={giftRevealStage === "open" ? "open-box" : "closed-box"}
                  src={
                    giftRevealStage === "open"
                      ? "/images/weekly-echo/gift-box-open.png"
                      : "/images/weekly-echo/gift-box-closed.png"
                  }
                  alt={
                    giftRevealStage === "open"
                      ? "Opened weekly gift box"
                      : "Closed weekly gift box"
                  }
                  className={`object-contain drop-shadow-[0_14px_20px_rgba(128,93,63,0.2)] ${
                    giftRevealStage === "open" ? "w-52" : "w-44"
                  } ${giftRevealStage === "open" ? "-translate-y-[24px]" : ""
                  }`}
                  animate={
                    giftRevealStage === "shaking"
                      ? {
                          rotate: [0, -4, 4, -4, 4, 0],
                          scale: [1, 1.04, 1.03, 1.04, 1],
                        }
                      : giftRevealStage === "closed"
                        ? { y: [0, -4, 0] }
                        : { opacity: [0, 1], scale: [0.96, 1] }
                  }
                  transition={
                    giftRevealStage === "closed"
                      ? { duration: 1.4, repeat: Infinity }
                      : { duration: 0.65 }
                  }
                />

                <p
                  className={`mt-4 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-[#8b6042] shadow-sm ${
                    giftRevealStage === "open" ? "translate-y-[48px]" : ""
                  }`}
                >
                  {giftRevealStage === "closed"
                    ? "Tap to open"
                    : giftRevealStage === "shaking"
                      ? "Opening..."
                      : "Gift opened"}
                </p>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="w-full rounded-[28px] bg-white p-5 text-center shadow-[0_14px_28px_rgba(128,93,63,0.16)]"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1d6] text-4xl">
                  {selectedWeeklyReward ? (
                    <RewardIcon reward={selectedWeeklyReward} />
                  ) : selectedPetReward ? (
                    <RewardIcon reward={selectedPetReward} />
                  ) : (
                    <Gift className="h-10 w-10 text-[#c58b58]" />
                  )}
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#c58b58]">
                  {selectedPetReward ? "New pet unlocked" : "You unlocked"}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#3d2b22]">
                  {selectedWeeklyReward?.name ?? selectedPetReward?.name ?? "Weekly Gift"}
                </h2>

                <p className="mt-2 text-sm font-semibold text-[#8b6042]">
                  {selectedWeeklyReward?.reason ??
                    "A new companion has joined your pet collection."}
                </p>

                <p className="mt-2 text-sm leading-6 text-[#8a6e5a]">
                  {selectedWeeklyReward?.description ??
                    selectedPetReward?.description ??
                    "A gentle weekly surprise for your family pet."}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedWeeklyReward) {
                      onAddKeepsake(selectedWeeklyReward);
                      return;
                    }
                    if (selectedPetReward) {
                      unlockPet(selectedPetReward.id);
                    }
                  }}
                  className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition ${
                    addedToToyBox || addedToPetCollection
                      ? "bg-[#ead8c8] text-[#8b6042]"
                      : "bg-[#b98559] text-white"
                  }`}
                >
                  {selectedPetReward
                    ? addedToPetCollection
                      ? "Added to Pet Collection"
                      : "Add to Pet Collection"
                    : addedToToyBox
                      ? "Added to Toy Box"
                      : "Add to Toy Box"}
                </button>
              </motion.div>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-[24px] bg-[#fffaf4] p-4 text-sm leading-6 text-[#7b604f] shadow-sm">
          <div className="mb-2 flex items-center gap-2 font-bold text-[#5d4435]">
            <Sparkles className="h-4 w-4 text-[#d39a5c]" />
            Design note
          </div>
          This keepsake is not a random prize. It represents the small family
          interactions collected during this week.
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-y-auto bg-gradient-to-b from-[#fff7ed] via-[#fffaf4] to-[#f7efe5] px-5 pb-32 pt-5 text-[#4b3528]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b8895f]">
          Weekly Family Echo
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#3d2b22]">
          A gentle family recap
        </h1>
        <p className="mt-1 text-sm leading-5 text-[#8a6e5a]">
          Your pet keeps the small moments from this week and writes them on the board.
        </p>
      </motion.div>

      <section className="relative mt">
        <div className="relative z-10 h-[450px] overflow-hidden rounded-[28px] border-[6px] border-[#9b6742] bg-[#28372f] p-3 shadow-[0_18px_35px_rgba(74,47,29,0.22)]">
          <div
            ref={boardRef}
            onScroll={handleBoardScroll}
            className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[18px] bg-[#2f4338] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pages.map((page) => (
              <article
                key={page.key}
                className="h-full min-w-full snap-center px-4 py-2 text-[#fff8e8]"
              >
                <p className="text-sm text-[#f9d98f]" style={chalkFontStyle}>
                  {page.title}
                </p>

                <h2
                  className={`text-lg font-bold leading-tight text-white ${
                    page.key === "keepsakes" ? "mt-1" : "mt-2"
                  }`}
                  style={chalkFontStyle}
                >
                  {page.subtitle}
                </h2>

                <p
                  className={`whitespace-pre-line text-[#f7efd9] ${
                    page.key === "keepsakes"
                      ? "mt-2 text-[13px] leading-4"
                      : "mt-2 text-sm leading-5"
                  }`}
                  style={chalkFontStyle}
                >
                  {page.body}
                </p>

                {page.key === "summary" && (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {weeklyStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="min-h-[58px] rounded-2xl border border-white/15 bg-white/10 px-2.5 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{stat.icon}</span>
                            <span
                              className="text-base font-bold leading-none text-white"
                              style={chalkFontStyle}
                            >
                              {stat.value}
                            </span>
                          </div>
                          <div
                            className="mt-2 text-[11px] leading-tight text-[#e7dcc0]"
                            style={chalkFontStyle}
                          >
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {aiSummaryStatus === "loading" && (
                      <p className="mt-2 text-xs text-[#f7efd9]" style={chalkFontStyle}>
                        Writing this week's echo...
                      </p>
                    )}

                    {aiSummaryStatus === "fallback" && (
                      <p className="mt-2 text-xs text-[#f7efd9]" style={chalkFontStyle}>
                        Local weekly echo shown until the AI key is configured.
                      </p>
                    )}

                    {aiSummaryStatus === "error" && (
                      <p className="mt-2 text-xs text-[#ffd4c4]" style={chalkFontStyle}>
                        {aiSummaryError}
                      </p>
                    )}

                    {aiSummaryError && aiSummaryStatus !== "error" && (
                      <p className="mt-2 text-xs text-[#f7efd9]" style={chalkFontStyle}>
                        {aiSummaryError}
                      </p>
                    )}
                  </>
                )}

                {page.key === "moments" && (
                  <div className="mt-3 space-y-2">
                    {weeklyMoments.map((moment, index) => (
                      <div
                        key={moment}
                        className="flex gap-3 text-sm text-[#fff6dc]"
                        style={chalkFontStyle}
                      >
                        <span className="mt-1 h-5 w-5 rounded-full bg-[#f9d98f] text-center text-xs font-bold leading-5 text-[#2f4338]">
                          {index + 1}
                        </span>
                        <span className="leading-6">{moment}</span>
                      </div>
                    ))}
                  </div>
                )}

                {page.key === "keepsakes" && (
                  <div className="mt-3 space-y-2">
                    {weeklyDropCategorySummaries.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {weeklyDropCategorySummaries.map((summary) => (
                          <div
                            key={summary.key}
                            className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2"
                            style={chalkFontStyle}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-base font-bold leading-tight text-white">
                                {summary.label} × {summary.count}
                              </div>
                              <Gift className="h-5 w-5 shrink-0 self-center translate-y-[8px] text-[#f9d98f]" />
                            </div>
                            <div className="mt-0.5 truncate text-[11px] leading-tight text-[#e7dcc0]">
                              {summary.preview}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs leading-4 text-[#e7dcc0]"
                        style={chalkFontStyle}
                      >
                        No small surprises were collected this week yet.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWeeklyRewardCandidate(
                          pickRandomCandidate(weeklyRewardCandidates)
                        );
                        setScene("gift");
                        setGiftRevealStage("closed");
                      }}
                      className="mt-2 w-full rounded-2xl bg-[#f9d98f] px-4 py-3 text-sm font-bold text-[#2f4338] shadow-sm"
                    >
                      Reveal This Week's Keepsake
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scrollToPage(activePage - 1)}
            className="rounded-full bg-white/80 p-2 text-[#8d684d] shadow-sm disabled:opacity-40"
            disabled={activePage === 0}
            aria-label="Previous board"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            {pages.map((page, index) => (
              <button
                key={page.key}
                type="button"
                onClick={() => scrollToPage(index)}
                className={`h-2 rounded-full transition-all ${
                  activePage === index ? "w-7 bg-[#b98559]" : "w-2 bg-[#d8c1ad]"
                }`}
                aria-label={`Go to board ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollToPage(activePage + 1)}
            className="rounded-full bg-white/80 p-2 text-[#8d684d] shadow-sm disabled:opacity-40"
            disabled={activePage === pages.length - 1}
            aria-label="Next board"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] bg-white/80 p-4 shadow-[0_12px_28px_rgba(128,93,63,0.12)] backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-bold text-[#5d4435]">
          <MessageCircle className="h-4 w-4 text-[#b98559]" />
          Talk with {currentPet.name}
        </div>

        <p className="mt-2 rounded-2xl bg-[#fff5e8] px-4 py-3 text-sm leading-6 text-[#7b604f]">
          “{petReplies[replyKey]}”
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setReplyKey("gentle")}
            className="rounded-2xl bg-[#f9e4d2] px-2 py-2 text-xs font-semibold text-[#8b6042]"
          >
            Summary
          </button>

          <button
            type="button"
            onClick={() => setReplyKey("details")}
            className="rounded-2xl bg-[#f9e4d2] px-2 py-2 text-xs font-semibold text-[#8b6042]"
          >
            More
          </button>

          <button
            type="button"
            onClick={() => setReplyKey("thanks")}
            className="rounded-2xl bg-[#f9e4d2] px-2 py-2 text-xs font-semibold text-[#8b6042]"
          >
            Thanks
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-[24px] bg-[#fffaf4] p-4 text-sm leading-6 text-[#7b604f] shadow-sm">
        <div className="mb-2 flex items-center gap-2 font-bold text-[#5d4435]">
          <Sparkles className="h-4 w-4 text-[#d39a5c]" />
          Design note
        </div>
        Daily drops give the pet small everyday care. Weekly Echo turns those
        small interactions into a gentle family memory.
      </section>
    </div>
  );
}
