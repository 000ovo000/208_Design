import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  ArrowLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { usePet } from "../context/pet-context";
import { weeklyCollectedDrops, type DailyDropCategory } from "../data/daily-drops";
import {
  findWeeklyRewardByItemIdentity,
  type WeeklyReward,
} from "../data/weekly-rewards";
import { DEMO_MODE } from "../config";
import { apiUrl } from "../lib/api";
import {
  getDemoCurrentUser,
  getDemoWeeklyEchoBundle,
  setDemoWeeklyRewardClaimed,
} from "../lib/demo-store";

type EchoPageKey = "summary" | "moments" | "keepsakes";
type WeeklyEchoScene = "boards" | "gift";
type GiftRevealStage = "closed" | "shaking" | "open" | "revealed";

type WeeklyEchoSummary = {
  subtitle: string;
  body: string;
};

type DropSummaryCategory = "food" | "drink" | "basic-toy";

type WeeklyEchoKeepsake = {
  category: DropSummaryCategory;
  label: string;
  count: number;
  preview: string;
};

type WeeklyEchoSummaryResponse = {
  summary?: WeeklyEchoSummary;
  stats?: {
    petMessages?: number;
    photoShares?: number;
    gentleReactions?: number;
    moodCheckIns?: number;
    connectedDays?: number;
    smallMoments?: number;
  };
  keepsakes?: WeeklyEchoKeepsake[];
};

type WeeklyDropCategorySummary = {
  key: DropSummaryCategory;
  label: string;
  count: number;
  itemNames: string[];
  preview: string;
};

type WeeklyEchoReport = {
  reportId: number;
  familyId: number;
  weekStartDate: string | null;
  weekEndDate: string | null;
  connectedDays: number;
  smallMomentsCount: number;
  petMessagesCount: number;
  photoSharesCount: number;
  gentleReactionsCount: number;
  moodCheckinsCount: number;
  featuredPetMessage: string;
  reportText: string;
  unlockedReward: {
    id: string;
    name: string;
  } | null;
  rewardClaimed: boolean;
};

const chalkFontStyle: CSSProperties = {
  fontFamily: '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive',
};

const dropCategoryLabels: Record<DropSummaryCategory, string> = {
  food: "Food",
  drink: "Drink",
  "basic-toy": "Basic toy",
};

const getWeeklyDropSummaryKey = (category: DailyDropCategory): DropSummaryCategory | null => {
  if (category === "food" || category === "drink") return category;
  if (category === "basic-toy" || category === "care") return "basic-toy";
  return null;
};

const formatDropNamePreview = (itemNames: string[]) => {
  if (itemNames.length > 3) {
    return `${itemNames.slice(0, 3).join(", ")}, ...`;
  }
  return itemNames.join(", ");
};

const normalizeWeeklyEchoBody = (body: string) =>
  body
    .replace(/The family dog carried a note:/g, "Latest note from this week:")
    .replace(/Latest note from this week's messages:/g, "Latest note from this week:");

function RewardIcon({
  reward,
  sizeClass = "h-16 w-16",
  emojiClassName = "text-4xl leading-none",
}: {
  reward: WeeklyReward;
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
      {reward.emoji}
    </span>
  );
}

function formatWeeklyEchoTitle(weekStartDate: string | null, weekEndDate: string | null) {
  if (!weekStartDate || !weekEndDate) return "Weekly Echo";

  const start = new Date(`${weekStartDate}T00:00:00`);
  const end = new Date(`${weekEndDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Weekly Echo";
  }

  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
  });
  const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startLabel = sameMonth
    ? `${monthFormatter.format(start)} ${start.getDate()}`
    : monthDayFormatter.format(start);
  const endLabel = monthDayFormatter.format(end);

  return `${startLabel} - ${endLabel} Weekly Echo`;
}

function buildFallbackReportText(report: WeeklyEchoReport | null) {
  if (!report) return "Your pet is waiting to write the next weekly echo.";
  if (report.reportText.trim()) return report.reportText;

  const lines = [
    `Your family kept ${report.connectedDays} connected day${report.connectedDays === 1 ? "" : "s"}.`,
    `This week, your family shared ${report.smallMomentsCount} small moment${report.smallMomentsCount === 1 ? "" : "s"}.`,
    `${report.petMessagesCount} pet messages, ${report.photoSharesCount} photo shares, ${report.gentleReactionsCount} gentle reactions, and ${report.moodCheckinsCount} mood check-ins stayed on the board.`,
  ];

  if (report.featuredPetMessage.trim()) {
    lines.push(`Latest note from this week: "${report.featuredPetMessage.trim()}".`);
  } else {
    lines.push("Latest note from this week: No shared note this week yet.");
  }

  if (report.unlockedReward?.name) {
    lines.push(`${report.unlockedReward.name} was unlocked for the family pet.`);
  }

  return lines.join("\n");
}

export function WeeklyEchoPage() {
  const {
    currentPet,
    addWeeklyRewardToInventory,
    refreshInventory,
  } = usePet();
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [activePage, setActivePage] = useState(0);
  const [scene, setScene] = useState<WeeklyEchoScene>("boards");
  const [giftRevealStage, setGiftRevealStage] = useState<GiftRevealStage>("closed");
  const [report, setReport] = useState<WeeklyEchoReport | null>(null);
  const [reportError, setReportError] = useState("");
  const [echoSummary, setEchoSummary] = useState<WeeklyEchoSummary | null>(null);
  const [echoStats, setEchoStats] = useState<WeeklyEchoSummaryResponse["stats"] | null>(null);
  const [echoKeepsakes, setEchoKeepsakes] = useState<WeeklyEchoKeepsake[] | null>(null);
  const [echoSummaryStatus, setEchoSummaryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [echoSummaryError, setEchoSummaryError] = useState("");
  const [isAddingReward, setIsAddingReward] = useState(false);

  const weeklyKeepsake = useMemo(
    () =>
      report?.unlockedReward
        ? findWeeklyRewardByItemIdentity({
            id: report.unlockedReward.id,
            name: report.unlockedReward.name,
          })
        : null,
    [report?.unlockedReward]
  );

  const echoTitle = useMemo(
    () => formatWeeklyEchoTitle(report?.weekStartDate ?? null, report?.weekEndDate ?? null),
    [report?.weekEndDate, report?.weekStartDate]
  );

  const fallbackStats = useMemo(
    () => ({
      petMessages: report?.petMessagesCount ?? 0,
      photoShares: report?.photoSharesCount ?? 0,
      gentleReactions: report?.gentleReactionsCount ?? 0,
      moodCheckIns: report?.moodCheckinsCount ?? 0,
      connectedDays: report?.connectedDays ?? 0,
      smallMoments: report?.smallMomentsCount ?? 0,
    }),
    [
      report?.connectedDays,
      report?.gentleReactionsCount,
      report?.moodCheckinsCount,
      report?.petMessagesCount,
      report?.photoSharesCount,
      report?.smallMomentsCount,
    ]
  );

  const boardStats = echoStats ?? fallbackStats;

  const weeklyStats = useMemo(
    () => [
      { label: "Pet messages", value: Number(boardStats.petMessages ?? 0), icon: "🐾" },
      { label: "Photo shares", value: Number(boardStats.photoShares ?? 0), icon: "🖼️" },
      { label: "Gentle reactions", value: Number(boardStats.gentleReactions ?? 0), icon: "💗" },
      { label: "Mood check-ins", value: Number(boardStats.moodCheckIns ?? 0), icon: "🫧" },
    ],
    [boardStats.gentleReactions, boardStats.moodCheckIns, boardStats.petMessages, boardStats.photoShares]
  );

  const weeklyMoments = useMemo(() => {
    const featuredMessage = report?.featuredPetMessage.trim() ?? "";
    return [
      `Your family shared ${Number(boardStats.smallMoments ?? fallbackStats.smallMoments)} small moments in this report.`,
      `${Number(boardStats.petMessages ?? 0)} pet messages and ${Number(boardStats.photoShares ?? 0)} photo shares helped small updates travel home.`,
      featuredMessage
        ? `Latest note from this week: "${featuredMessage}".`
        : "Latest note from this week: No shared note this week yet.",
    ];
  }, [boardStats.petMessages, boardStats.photoShares, boardStats.smallMoments, fallbackStats.smallMoments, report?.featuredPetMessage]);

  const demoWeeklyDropCategorySummaries = useMemo<WeeklyDropCategorySummary[]>(() => {
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

  const weeklyDropCategorySummaries =
    Array.isArray(echoKeepsakes) && echoKeepsakes.length > 0
      ? echoKeepsakes.map((keepsake) => ({
          key: keepsake.category,
          label: keepsake.label,
          count: keepsake.count,
          itemNames: [],
          preview: keepsake.preview,
        }))
      : demoWeeklyDropCategorySummaries;

  useEffect(() => {
    let ignore = false;

    async function loadReport(refresh = false) {
      setReportError("");

      if (DEMO_MODE) {
        const demoUser = getDemoCurrentUser();
        const demoBundle = getDemoWeeklyEchoBundle(demoUser.id);
        if (!ignore) {
          setReport(demoBundle.report);
        }
        return;
      }

      try {
        const response = await fetch(
          apiUrl(`/api/weekly-echo/current${refresh ? "?refresh=1" : ""}`),
          { cache: "no-store" }
        );
        const data = await response.json().catch(() => null);
        if (ignore) return;

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load Weekly Echo.");
        }

        console.log(
          `[weekly-echo-page] received report reportId=${Number(
            data?.reportId ?? 0
          )} connectedDays=${Number(data?.connectedDays ?? 0)} moodCheckins=${Number(
            data?.moodCheckinsCount ?? 0
          )} smallMoments=${Number(data?.smallMomentsCount ?? 0)}`
        );
        setReport(data);
      } catch (error) {
        if (ignore) return;
        setReport(null);
        setReportError(error instanceof Error ? error.message : "Failed to load Weekly Echo.");
      }
    }

    void loadReport();

    const handleMoodUpdated = () => {
      void loadReport(true);
    };
    window.addEventListener("moods-updated", handleMoodUpdated);

    return () => {
      ignore = true;
      window.removeEventListener("moods-updated", handleMoodUpdated);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadWeeklyEchoSummary() {
      setEchoSummaryStatus("loading");
      setEchoSummaryError("");

      if (DEMO_MODE) {
        const demoUser = getDemoCurrentUser();
        const demoBundle = getDemoWeeklyEchoBundle(demoUser.id);
        if (ignore) return;
        setEchoSummary({
          ...demoBundle.summary,
          body: normalizeWeeklyEchoBody(demoBundle.summary.body),
        });
        setEchoStats(demoBundle.stats);
        setEchoKeepsakes(demoBundle.keepsakes);
        setEchoSummaryStatus("ready");
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/weekly-echo/summary"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stats: fallbackStats,
          }),
        });

        const data: WeeklyEchoSummaryResponse & { error?: string } = await response.json().catch(() => ({}));
        if (ignore) return;

        if (!response.ok && !data.summary) {
          throw new Error(data.error || "Failed to load weekly echo.");
        }

        setEchoSummary(
          data.summary
            ? {
                ...data.summary,
                body: normalizeWeeklyEchoBody(data.summary.body),
              }
            : null
        );
        setEchoStats(data.stats ?? null);
        setEchoKeepsakes(Array.isArray(data.keepsakes) ? data.keepsakes : null);
        setEchoSummaryStatus("ready");
      } catch (error) {
        if (ignore) return;
        setEchoSummary(null);
        setEchoStats(null);
        setEchoKeepsakes(null);
        setEchoSummaryStatus("error");
        setEchoSummaryError(error instanceof Error ? error.message : "Failed to load weekly echo.");
      }
    }

    void loadWeeklyEchoSummary();

    return () => {
      ignore = true;
    };
  }, [fallbackStats]);

  useEffect(() => {
    if (report?.rewardClaimed) {
      setGiftRevealStage("revealed");
      return;
    }
    setGiftRevealStage((current) => (current === "revealed" ? "closed" : current));
  }, [report?.rewardClaimed]);

  const giftBubbleText =
    report?.rewardClaimed
      ? "This week's gift is already opened for you."
      : giftRevealStage === "closed"
        ? "Tap the box to open it."
        : giftRevealStage === "shaking"
          ? "Opening..."
          : giftRevealStage === "open"
            ? "Something is inside!"
            : "You made something warm this week!";

  const handleOpenGift = () => {
    if (report?.rewardClaimed || giftRevealStage !== "closed" || !weeklyKeepsake) {
      return;
    }

    setGiftRevealStage("shaking");

    window.setTimeout(() => {
      setGiftRevealStage("open");
    }, 650);

    window.setTimeout(() => {
      setGiftRevealStage("revealed");
    }, 1500);
  };

  const handleClaimReward = async () => {
    if (report?.rewardClaimed || !weeklyKeepsake || isAddingReward || !report?.reportId) return;

    try {
      setIsAddingReward(true);
      if (DEMO_MODE) {
        const demoUser = getDemoCurrentUser();
        const added = await addWeeklyRewardToInventory(weeklyKeepsake.id);
        if (!added) {
          throw new Error("Failed to add weekly reward to Toy Box.");
        }
        if (report.weekStartDate) {
          setDemoWeeklyRewardClaimed(demoUser.id, report.weekStartDate, weeklyKeepsake.id);
        }
        setReport((current) => (current ? { ...current, rewardClaimed: true } : current));
        setGiftRevealStage("revealed");
        setReportError("");
        return;
      }

      const response = await fetch(apiUrl(`/api/weekly-echo/${report.reportId}/claim-reward`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data: WeeklyEchoReport & { error?: string } = await response.json().catch(() => ({} as WeeklyEchoReport & { error?: string }));

      if (!response.ok) {
        throw new Error(data.error || "Failed to add weekly reward to Toy Box.");
      }

      setReport(data);
      await refreshInventory();
      setGiftRevealStage("revealed");
      setReportError("");
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Failed to add weekly reward to Toy Box."
      );
    } finally {
      setIsAddingReward(false);
    }
  };

  const pages = useMemo(
    () => [
      {
        key: "summary" as EchoPageKey,
        title: echoTitle,
        subtitle:
          echoSummary?.subtitle ??
          `${report?.connectedDays ?? 0} connected day${report?.connectedDays === 1 ? "" : "s"} · ${report?.smallMomentsCount ?? 0} small moment${report?.smallMomentsCount === 1 ? "" : "s"}`,
        body: echoSummary?.body ?? buildFallbackReportText(report),
      },
      {
        key: "moments" as EchoPageKey,
        title: "Small Moments",
        subtitle: "Latest note from this week:",
        body: report?.featuredPetMessage.trim()
          ? `"${report.featuredPetMessage.trim()}"`
          : "No shared note this week yet.",
      },
      {
        key: "keepsakes" as EchoPageKey,
        title: "Shared Keepsakes",
        subtitle: "Small items your pet noticed this week",
        body: "Your pet found little surprises through the week.\nSome small items fade, while keepsakes stay as family memories.",
      },
    ],
    [
      echoSummary?.body,
      echoSummary?.subtitle,
      echoTitle,
      report,
    ]
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
            setGiftRevealStage(report?.rewardClaimed ? "revealed" : "closed");
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
            {echoTitle}
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
              className="relative z-10 h-28 w-28 shrink-0 object-contain drop-shadow-[0_8px_12px_rgba(93,62,37,0.18)]"
            />

            <div className="mt-2 max-w-[160px] rounded-2xl bg-white px-3 py-2 text-left text-xs leading-4 text-[#7b604f] shadow-sm">
              {giftBubbleText}
            </div>
          </div>

          <div className="flex min-h-[340px] flex-col items-center justify-start pt-8">
            {!weeklyKeepsake ? (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="mt-20 w-full rounded-[28px] bg-white p-5 text-center shadow-[0_14px_28px_rgba(128,93,63,0.16)]"
              >
                <p className="text-sm leading-6 text-[#8a6e5a]">
                  No weekly keepsake was unlocked for this report.
                </p>
              </motion.div>
            ) : giftRevealStage !== "revealed" ? (
              <motion.button
                type="button"
                onClick={handleOpenGift}
                disabled={giftRevealStage !== "closed" || Boolean(report?.rewardClaimed)}
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
                  } ${giftRevealStage === "open" ? "-translate-y-[24px]" : ""}`}
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
                  <RewardIcon reward={weeklyKeepsake} />
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#c58b58]">
                  You unlocked
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#3d2b22]">
                  {weeklyKeepsake.name}
                </h2>

                <p className="mt-2 text-sm font-semibold text-[#8b6042]">
                  {weeklyKeepsake.reason}
                </p>

                <p className="mt-2 text-sm leading-6 text-[#8a6e5a]">
                  {weeklyKeepsake.description}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void handleClaimReward();
                  }}
                  disabled={Boolean(report?.rewardClaimed) || isAddingReward}
                  className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition ${
                    report?.rewardClaimed
                      ? "bg-[#ead8c8] text-[#8b6042]"
                      : "bg-[#b98559] text-white"
                  } disabled:cursor-default`}
                >
                  {report?.rewardClaimed
                    ? "Already opened"
                    : isAddingReward
                      ? "Adding..."
                      : "Add to Toy Box"}
                </button>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-gradient-to-b from-[#fff7ed] via-[#fffaf4] to-[#f7efe5] px-5 pb-20 pt-4 text-[#4b3528]">
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
          {echoTitle}
        </h1>
        <p className="mt-1 text-sm leading-5 text-[#8a6e5a]">
          Your pet keeps the small moments from this report and writes them on the board.
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
                className={`h-full min-w-full snap-center px-4 pt-2 text-[#fff8e8] ${
                  page.key === "summary" ? "pb-6" : "pb-2"
                }`}
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

                    {echoSummaryStatus === "loading" && (
                      <p className="mt-2 text-xs text-[#f7efd9]" style={chalkFontStyle}>
                        Writing this week's echo...
                      </p>
                    )}

                    {echoSummaryStatus === "ready" && (
                      <p className="mt-2 text-xs text-[#f7efd9]" style={chalkFontStyle}>
                        Small moments made the week feel closer.
                      </p>
                    )}

                    {(echoSummaryStatus === "error" || reportError) && (
                      <p className="mt-2 text-xs text-[#ffd4c4]" style={chalkFontStyle}>
                        {echoSummaryError || reportError}
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
                        setScene("gift");
                        setGiftRevealStage(report?.rewardClaimed ? "revealed" : "closed");
                      }}
                      disabled={!weeklyKeepsake}
                      className="mt-2 w-full rounded-2xl bg-[#f9d98f] px-4 py-3 text-sm font-bold text-[#2f4338] shadow-sm disabled:cursor-default disabled:opacity-60"
                    >
                      {report?.rewardClaimed ? "View This Week's Keepsake" : "Reveal This Week's Keepsake"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 flex -translate-y-[3px] items-center justify-center gap-4">
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
    </div>
  );
}
