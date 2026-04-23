import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { MoodCalendar } from "../components/mood-calendar";
import PixelDog from "../components/pixel-dog";
import PixelCat from "../components/pixel-cat";

type JarView = "main" | "petSelection";
type PetCategory = "cats" | "dogs";
type MoodKey = "happy" | "sad" | "angry" | "bored" | "veryHappy";

type CandyEntry = {
  id: string;
  monthKey: string;
  day: number;
  color: string;
  x: string;
  y: string;
  note: string;
};

type NoteMap2026 = Record<string, Record<number, string>>;

type EditorState = {
  open: boolean;
  month: number;
  day: number | null;
  mode: "newRecord" | "extraCandy";
};

type ExistingDayDialogState = {
  open: boolean;
  month: number;
  day: number | null;
};

type CandyMessageDialogState = {
  open: boolean;
  candy: CandyEntry | null;
};

const BALL_SIZE = 22;
const BALL_RADIUS = BALL_SIZE / 2;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const moodColorMap: Record<MoodKey, string> = {
  happy: "#FFB574",
  sad: "#8EC4FB",
  angry: "#F36248",
  bored: "#B3B3B3",
  veryHappy: "#FFDC6E",
};

const moodLabelMap: Record<MoodKey, string> = {
  veryHappy: "Very Happy",
  happy: "Happy",
  bored: "Bored",
  angry: "Angry",
  sad: "Sad / Anxious",
};

const moodData2026Initial: Record<string, Record<number, MoodKey>> = {
  "2026-01": {
    1: "happy",
    2: "bored",
    3: "veryHappy",
    4: "sad",
    5: "happy",
    6: "angry",
    7: "bored",
    8: "sad",
    9: "happy",
    10: "veryHappy",
    11: "bored",
    12: "happy",
    13: "sad",
    14: "happy",
    15: "veryHappy",
    16: "angry",
    17: "bored",
    18: "happy",
    19: "sad",
    20: "veryHappy",
    21: "happy",
    22: "bored",
    23: "angry",
    24: "happy",
    25: "sad",
    26: "veryHappy",
    27: "bored",
    28: "happy",
    29: "sad",
    30: "angry",
    31: "veryHappy",
  },
  "2026-02": {
    1: "happy",
    2: "sad",
    3: "bored",
    4: "veryHappy",
    5: "happy",
    6: "angry",
    7: "sad",
    8: "bored",
    9: "veryHappy",
    10: "happy",
    11: "sad",
    12: "happy",
    13: "veryHappy",
    14: "bored",
    15: "angry",
    16: "happy",
    17: "sad",
    18: "bored",
    19: "veryHappy",
    20: "happy",
    21: "angry",
    22: "sad",
    23: "happy",
    24: "bored",
    25: "veryHappy",
    26: "happy",
    27: "sad",
    28: "angry",
  },
  "2026-03": {
    1: "bored",
    2: "happy",
    3: "sad",
    4: "veryHappy",
    5: "happy",
    6: "angry",
    7: "bored",
    8: "sad",
    9: "happy",
    10: "veryHappy",
    11: "happy",
    12: "sad",
    13: "bored",
    14: "veryHappy",
    15: "happy",
    16: "angry",
    17: "sad",
    18: "bored",
    19: "happy",
    20: "veryHappy",
    21: "angry",
    22: "happy",
    23: "sad",
    24: "bored",
    25: "veryHappy",
    26: "happy",
    27: "sad",
    28: "angry",
    29: "bored",
    30: "veryHappy",
    31: "happy",
  },
  "2026-04": {
    1: "bored",
    2: "sad",
    3: "happy",
    4: "happy",
    5: "angry",
    6: "bored",
    7: "sad",
    8: "bored",
    9: "veryHappy",
    10: "veryHappy",
    11: "happy",
    12: "bored",
    13: "veryHappy",
    14: "sad",
    15: "angry",
    16: "happy",
  },
  "2026-05": {},
  "2026-06": {},
  "2026-07": {},
  "2026-08": {},
  "2026-09": {},
  "2026-10": {},
  "2026-11": {},
  "2026-12": {},
};

const noteData2026Initial: NoteMap2026 = {
  "2026-01": {},
  "2026-02": {},
  "2026-03": {},
  "2026-04": {},
  "2026-05": {},
  "2026-06": {},
  "2026-07": {},
  "2026-08": {},
  "2026-09": {},
  "2026-10": {},
  "2026-11": {},
  "2026-12": {},
};

const baseCandies = [
  { x: "14%", y: "8%", color: "#FFB574", size: BALL_SIZE },
  { x: "26%", y: "3%", color: "#8EC4FB", size: BALL_SIZE },
  { x: "40%", y: "5%", color: "#FFB574", size: BALL_SIZE },
  { x: "54%", y: "3%", color: "#B3B3B3", size: BALL_SIZE },
  { x: "68%", y: "5%", color: "#F36248", size: BALL_SIZE },
  { x: "18%", y: "18%", color: "#FFDC6E", size: BALL_SIZE },
  { x: "30%", y: "14%", color: "#F36248", size: BALL_SIZE },
  { x: "42%", y: "18%", color: "#FFDC6E", size: BALL_SIZE },
  { x: "54%", y: "15%", color: "#8EC4FB", size: BALL_SIZE },
  { x: "66%", y: "18%", color: "#FFB574", size: BALL_SIZE },
  { x: "78%", y: "13%", color: "#8EC4FB", size: BALL_SIZE },
  { x: "46%", y: "27%", color: "#FFB574", size: BALL_SIZE },
  { x: "58%", y: "26%", color: "#FFDC6E", size: BALL_SIZE },
  { x: "72%", y: "26%", color: "#B3B3B3", size: BALL_SIZE },
];

const baseCandyPositions = baseCandies.map((candy) => ({
  x: parseFloat(candy.x),
  y: parseFloat(candy.y),
}));

const extraCandySlots = [
  { x: "20%", y: "6%" },
  { x: "34%", y: "6%" },
  { x: "49%", y: "6%" },
  { x: "12%", y: "14%" },
  { x: "26%", y: "14%" },
  { x: "41%", y: "14%" },
  { x: "72%", y: "14%" },
  { x: "18%", y: "23%" },
  { x: "33%", y: "23%" },
  { x: "63%", y: "23%" },
  { x: "26%", y: "31%" },
  { x: "47%", y: "31%" },
  { x: "66%", y: "31%" },
];

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getCurrentWeekMoods(
  year: number,
  month: number,
  activeDay: number,
  moodMap: Record<number, MoodKey>
) {
  const activeDate = new Date(year, month - 1, activeDay);
  const jsDay = activeDate.getDay();
  const mondayBased = jsDay === 0 ? 6 : jsDay - 1;

  const mondayDate = new Date(activeDate);
  mondayDate.setDate(activeDate.getDate() - mondayBased);

  const labels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return labels.map((label, index) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + index);

    const sameMonth =
      d.getFullYear() === year && d.getMonth() === month - 1;

    const dayNum = d.getDate();
    const mood = sameMonth ? moodMap[dayNum] ?? null : null;

    return {
      day: label,
      filled: Boolean(mood),
      color: mood ? moodColorMap[mood] : "#AAB0BB",
    };
  });
}

function getPetState(moodMap: Record<number, MoodKey>) {
  const values = Object.values(moodMap);

  if (values.length === 0) {
    return {
      label: "Calm",
      bubble: "I can feel the atmosphere in the jar.",
    };
  }

  const scoreMap: Record<MoodKey, number> = {
    veryHappy: 2,
    happy: 1,
    bored: 0,
    sad: -1,
    angry: -2,
  };

  const avg =
    values.reduce((sum, mood) => sum + scoreMap[mood], 0) / values.length;

  if (avg >= 1.1) {
    return {
      label: "Energetic",
      bubble: "I feel bright and lively lately.",
    };
  }
  if (avg >= 0.2) {
    return {
      label: "Calm",
      bubble: "I can feel the atmosphere in the jar.",
    };
  }
  if (avg >= -0.8) {
    return {
      label: "Low-energy",
      bubble: "The jar feels a little heavy these days.",
    };
  }
  return {
    label: "Tired",
    bubble: "I feel tired. Maybe everyone needs more care.",
  };
}

function getRandomAvailableSlot(usedEntries: CandyEntry[]) {
  const usedPositions = usedEntries.map((entry) => ({
    x: parseFloat(entry.x),
    y: parseFloat(entry.y),
  }));

  const minDistance = 10;

  const validSlots = extraCandySlots.filter((slot) => {
    const sx = parseFloat(slot.x);
    const sy = parseFloat(slot.y);

    const tooCloseToBase = baseCandyPositions.some((base) => {
      const dx = sx - base.x;
      const dy = sy - base.y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });

    if (tooCloseToBase) return false;

    const tooCloseToAdded = usedPositions.some((used) => {
      const dx = sx - used.x;
      const dy = sy - used.y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });

    if (tooCloseToAdded) return false;

    return true;
  });

  if (validSlots.length === 0) {
    return null;
  }

  const grouped = {
    bottom: validSlots.filter((slot) => parseFloat(slot.y) <= 8),
    middle: validSlots.filter(
      (slot) => parseFloat(slot.y) > 8 && parseFloat(slot.y) <= 20
    ),
    upper: validSlots.filter(
      (slot) => parseFloat(slot.y) > 20 && parseFloat(slot.y) <= 32
    ),
    top: validSlots.filter((slot) => parseFloat(slot.y) > 32),
  };

  const weightedPool = [
    ...grouped.bottom,
    ...grouped.bottom,
    ...grouped.middle,
    ...grouped.middle,
    ...grouped.upper,
    ...grouped.top,
  ];

  const pool = weightedPool.length > 0 ? weightedPool : validSlots;
  return pool[Math.floor(Math.random() * pool.length)];
}

function MoodReferenceItem({
  mood,
  selected,
  onClick,
}: {
  mood: MoodKey;
  selected: boolean;
  onClick: () => void;
}) {
  const color = moodColorMap[mood];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-[16px] px-3 py-2 text-left transition-all ${
        selected ? "bg-[#F5EFFB] ring-1 ring-[#D8C8EA]" : "bg-[#FCFBFE]"
      }`}
    >
      <div
        className="relative w-[30px] h-[30px] rounded-full border-[2px] border-[#111111] shrink-0"
        style={{ backgroundColor: color }}
      >
        <span className="absolute left-[7px] top-[8px] w-[3.5px] h-[3.5px] rounded-full bg-[#111111]" />
        <span className="absolute right-[7px] top-[8px] w-[3.5px] h-[3.5px] rounded-full bg-[#111111]" />

        {mood === "happy" && (
          <span className="absolute left-1/2 top-[16px] w-[11px] h-[6px] -translate-x-1/2 border-b-[2px] border-[#111111] rounded-b-full" />
        )}
        {mood === "veryHappy" && (
          <span className="absolute left-1/2 top-[15px] w-[12px] h-[7px] -translate-x-1/2 border-b-[2px] border-[#111111] rounded-b-full" />
        )}
        {mood === "sad" && (
          <span className="absolute left-1/2 top-[18px] w-[11px] h-[6px] -translate-x-1/2 border-t-[2px] border-[#111111] rounded-t-full" />
        )}
        {mood === "angry" && (
          <>
            <span className="absolute left-[5px] top-[5px] w-[6px] h-[2px] bg-[#111111] rotate-[20deg]" />
            <span className="absolute right-[5px] top-[5px] w-[6px] h-[2px] bg-[#111111] -rotate-[20deg]" />
            <span className="absolute left-1/2 top-[18px] w-[11px] h-[6px] -translate-x-1/2 border-t-[2px] border-[#111111] rounded-t-full" />
          </>
        )}
        {mood === "bored" && (
          <span className="absolute left-1/2 top-[18px] w-[10px] h-[2px] -translate-x-1/2 bg-[#111111] rounded-full" />
        )}
      </div>

      <span className="text-[14px] font-medium text-[#3B3551]">
        {moodLabelMap[mood]}
      </span>
    </button>
  );
}

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

function PetSelectionCard({
  label,
  category,
  active = false,
  onClick,
}: {
  label: string;
  category: PetCategory;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-end rounded-[22px] transition-all ${
        active ? "bg-[#B98A54] shadow-md" : "bg-transparent"
      }`}
      style={{ width: 118, height: 126, paddingBottom: 10 }}
    >
      <div className="relative w-[92px] h-[74px] mb-2 flex items-end justify-center">
        <div className="absolute inset-x-0 bottom-0 mx-auto w-[82px] h-[46px] rounded-full bg-[#E8B85E]" />
        <div className="relative z-[2] scale-[0.42] origin-bottom">
          {category === "cats" ? <PixelCat size={8} /> : <PixelDog size={8} />}
        </div>
      </div>

      <span
        className={`text-[18px] leading-none ${
          active ? "text-white" : "text-[#7A5A43]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function PetSelectionView({
  category,
  setCategory,
  onBack,
}: {
  category: PetCategory;
  setCategory: (value: PetCategory) => void;
  onBack: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto px-5 pt-2 pb-24">
      <div className="flex items-center justify-start mb-12">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center text-[#333333]"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[26px] font-medium text-[#171717]">categories</h2>
          <button
            type="button"
            className="text-[14px] text-[#E8B85E] underline underline-offset-2"
          >
            SeeAll
          </button>
        </div>

        <div className="flex items-end justify-center gap-8">
          <PetSelectionCard
            label="Cats"
            category="cats"
            active={category === "cats"}
            onClick={() => setCategory("cats")}
          />
          <PetSelectionCard
            label="Dogs"
            category="dogs"
            active={category === "dogs"}
            onClick={() => setCategory("dogs")}
          />
        </div>
      </div>

      <div>
        <h3 className="text-[22px] font-medium text-[#171717] mb-8">
          Your selection:
        </h3>

        <div className="flex justify-center pt-2">
          <div className="scale-[1.15] origin-top">
            {category === "cats" ? <PixelCat size={8} /> : <PixelDog size={8} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function JarAnimation({ lidOpen }: { lidOpen: boolean }) {
  return (
    <div
      className="absolute left-1/2 top-0 z-[5]"
      style={{
        width: 246,
        height: 44,
        marginLeft: -123,
        transformOrigin: "95% 58%",
        transform: lidOpen ? "rotate(64deg)" : "rotate(0deg)",
        transition: "transform 520ms ease-in-out",
      }}
    >
      <div
        className="relative w-[246px] h-[44px] rounded-[28px_28px_18px_18px]"
        style={{
          background:
            "linear-gradient(180deg, #CC197C 0%, #B20D67 52%, #8A0D4A 100%)",
          boxShadow:
            "inset 0 6px 0 rgba(255,255,255,0.12), inset 0 -5px 0 rgba(83,0,39,0.16)",
        }}
      >
        <span className="absolute left-0 right-0 top-[9px] h-[6px] rounded-full bg-[rgba(124,4,66,0.34)]" />
        <span className="absolute left-0 right-0 bottom-[7px] h-[6px] rounded-full bg-[rgba(124,4,66,0.34)]" />
      </div>
    </div>
  );
}

function MainJarView({
  onOpenTodayPlus,
  onOpenPetSelection,
  isBlurred,
  currentMonth,
  setCurrentMonth,
  currentMoodMap,
  weekMoods,
  petLabel,
  petBubble,
  lidOpen,
  droppingMood,
  droppingTarget,
  savedCandyEntries,
  onCalendarDayClick,
  onCandyClick,
  category,
}: {
  onOpenTodayPlus: () => void;
  onOpenPetSelection: () => void;
  isBlurred: boolean;
  currentMonth: number;
  setCurrentMonth: (value: number) => void;
  currentMoodMap: Record<number, MoodKey>;
  weekMoods: { day: string; filled: boolean; color: string }[];
  petLabel: string;
  petBubble: string;
  lidOpen: boolean;
  droppingMood: MoodKey | null;
  droppingTarget: { x: string; y: string } | null;
  savedCandyEntries: CandyEntry[];
  onCalendarDayClick: (day: number) => void;
  onCandyClick: (entry: CandyEntry) => void;
  category: PetCategory;
}) {
  return (
    <div
      className={`h-full overflow-y-auto transition-all duration-200 ${
        isBlurred ? "blur-[6px] scale-[0.985]" : ""
      }`}
    >
      <section className="px-4 pt-1 shrink-0">
        <div className="flex items-center justify-start mb-2">
          <button
            type="button"
            aria-label="Back"
            className="w-8 h-8 flex items-center justify-center text-[#333333]"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="relative inline-flex max-w-[180px] px-[12px] py-[11px] rounded-[22px] bg-[#E3E3E3] text-[#161616] text-[16px] leading-[1.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] break-words">
            <span className="block pr-[6px]">{petBubble}</span>
            <span
              className="absolute right-5 -bottom-[8px] w-[14px] h-[14px] bg-[#E3E3E3] rotate-[-12deg]"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            />
          </div>

          <div
            className="relative group shrink-0"
            style={{ transform: "translateX(-15px)" }}
          >
            <button
              type="button"
              aria-label="Change your pet"
              onClick={onOpenPetSelection}
              className="w-[70px] h-[70px] rounded-full flex items-center justify-center"
              style={{
                border: "1.2px solid rgba(244, 181, 219, 0.72)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(253,248,251,0.96) 100%)",
                boxShadow:
                  "0 0 0 1.5px rgba(241,222,233,0.35), 0 5px 12px rgba(0,0,0,0.04)",
              }}
            >
              <PawIcon />
            </button>

            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#341056] px-3 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
              change your pet
            </div>
          </div>
        </div>

        <div className="h-[150px] flex items-end justify-center">
          {category === "cats" ? <PixelCat size={7} /> : <PixelDog size={7} />}
        </div>

        <div className="flex justify-center mb-2">
          <span className="px-3 py-1 rounded-full bg-[#F3EAFE] text-[#5A2A86] text-[12px] font-semibold">
            {petLabel}
          </span>
        </div>

        <p className="text-center text-[13px] leading-[1.45] text-[#6D647C] px-3 mb-4">
          Your pet reflects the overall family atmosphere, not any one person’s
          feelings.
        </p>
      </section>

      <section className="px-4 pb-2 shrink-0">
        <div className="rounded-[20px] bg-white/45 backdrop-blur-sm border border-white/50 px-4 py-3">
          <p className="text-[13px] font-semibold text-[#6D647C] mb-2">
            Recent mood drops
          </p>

          <div className="grid grid-cols-7 text-center text-[12px] text-[#1F1F1F] mb-[6px]">
            {weekMoods.map((item) => (
              <span key={item.day}>{item.day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-[6px] items-center justify-items-center">
            {weekMoods.map((item) => (
              <span
                key={item.day}
                className="w-[30px] h-[30px] rounded-full box-border"
                style={
                  item.filled
                    ? {
                        backgroundColor: item.color,
                        border: "2px solid #111111",
                      }
                    : {
                        backgroundColor: "transparent",
                        border: "2px solid #AAB0BB",
                      }
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center gap-3 px-3 pt-2 pb-1 shrink-0">
        <button
          type="button"
          aria-label="Add today's thought"
          onClick={onOpenTodayPlus}
          className="w-[42px] h-[42px] rounded-full bg-white text-[#111111] flex items-center justify-center shrink-0 shadow-[0_5px_12px_rgba(0,0,0,0.12)]"
        >
          <Plus size={24} strokeWidth={2.2} />
        </button>

        <p className="text-[17px] text-[#1F1F1F] leading-[1.2]">
          Throw a candy for today?
        </p>
      </section>

      <section className="px-4 pt-1 pb-2 shrink-0">
        <p className="text-center text-[13px] leading-[1.45] text-[#6D647C] px-4">
          The feelings collected here shape your pet’s state.
        </p>
      </section>

      <section className="flex flex-col items-center justify-start pt-1 pb-6 shrink-0">
        <div className="relative w-[208px] h-[256px]">
          <JarAnimation lidOpen={lidOpen} />

          <div
            className="absolute left-1/2 -translate-x-1/2 top-[38px] w-[208px] h-[212px] rounded-[16px_16px_30px_30px] overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(234,241,248,0.95) 0%, rgba(212,220,230,0.95) 100%)",
            }}
          >
            {droppingMood && droppingTarget && (
              <div
                className="absolute z-[6] pointer-events-none"
                style={{
                  left: `calc(${droppingTarget.x} - ${BALL_RADIUS}px)`,
                  bottom: droppingTarget.y,
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                  animation:
                    "jarDropCandyToSlot 920ms cubic-bezier(0.2, 0.78, 0.22, 1) forwards",
                }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: moodColorMap[droppingMood],
                    boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.08)",
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at center, transparent 45%, rgba(255,255,255,0.35) 46%, rgba(255,255,255,0.35) 58%, transparent 59%)",
                    }}
                  />
                </span>
              </div>
            )}

            <style>{`
              @keyframes jarDropCandyToSlot {
                0% {
                  transform: translateY(-170px) scale(1);
                  opacity: 1;
                }
                100% {
                  transform: translateY(0px) scale(1);
                  opacity: 1;
                }
              }
            `}</style>

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 34%, rgba(190,201,214,0.12) 100%)",
              }}
            />

            <div
              className="absolute top-[24px] left-[18px] w-[22px] h-[128px] rounded-[20px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)",
              }}
            />
            <div
              className="absolute top-[24px] right-[20px] w-[22px] h-[128px] rounded-[20px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)",
              }}
            />

            {baseCandies.map((candy, index) => (
              <span
                key={`base-${index}`}
                className="absolute rounded-full"
                style={{
                  left: candy.x,
                  bottom: candy.y,
                  width: candy.size,
                  height: candy.size,
                  backgroundColor: candy.color,
                  boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.08)",
                }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at center, transparent 45%, rgba(255,255,255,0.35) 46%, rgba(255,255,255,0.35) 58%, transparent 59%)",
                  }}
                />
              </span>
            ))}

            {savedCandyEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onCandyClick(entry)}
                className="absolute rounded-full"
                style={{
                  left: `calc(${entry.x} - ${BALL_RADIUS}px)`,
                  bottom: entry.y,
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                  backgroundColor: entry.color,
                  boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.08)",
                }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at center, transparent 45%, rgba(255,255,255,0.35) 46%, rgba(255,255,255,0.35) 58%, transparent 59%)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-2 pb-1 shrink-0">
        <div className="rounded-[18px] bg-white/35 backdrop-blur-sm border border-white/40 px-4 py-3">
          <p className="text-[14px] font-semibold text-[#5A2A86]">
            Private mood log
          </p>
          <p className="text-[12px] text-[#7A7287] mt-1">
            Only visible to you
          </p>
        </div>
      </section>

      <MoodCalendar
        year={2026}
        month={currentMonth}
        moodMap={currentMoodMap}
        onPrev={() => setCurrentMonth(Math.max(1, currentMonth - 1))}
        onNext={() => setCurrentMonth(Math.min(12, currentMonth + 1))}
        canPrev={currentMonth > 1}
        canNext={currentMonth < 12}
        onDayClick={onCalendarDayClick}
      />
    </div>
  );
}

export function JarPage() {
  const [note, setNote] = useState("");
  const [view, setView] = useState<JarView>("main");
  const [category, setCategory] = useState<PetCategory>("dogs");
  const [currentMonth, setCurrentMonth] = useState(4);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [moodData2026, setMoodData2026] = useState(moodData2026Initial);
  const [noteData2026, setNoteData2026] = useState(noteData2026Initial);
  const [savedCandyEntries, setSavedCandyEntries] = useState<CandyEntry[]>([]);
  const [lidOpen, setLidOpen] = useState(false);
  const [droppingMood, setDroppingMood] = useState<MoodKey | null>(null);
  const [droppingTarget, setDroppingTarget] = useState<{
    x: string;
    y: string;
  } | null>(null);

  const [editor, setEditor] = useState<EditorState>({
    open: false,
    month: 4,
    day: null,
    mode: "newRecord",
  });

  const [existingDayDialog, setExistingDayDialog] =
    useState<ExistingDayDialogState>({
      open: false,
      month: 4,
      day: null,
    });

  const [candyMessageDialog, setCandyMessageDialog] =
    useState<CandyMessageDialogState>({
      open: false,
      candy: null,
    });

  const timersRef = useRef<number[]>([]);

  const today = new Date();
  const todayYear = 2026;
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const currentMonthKey = getMonthKey(2026, currentMonth);
  const currentMoodMap = moodData2026[currentMonthKey] ?? {};

  const editorDayLabel =
    editor.day !== null
      ? `${monthNames[editor.month - 1]} ${editor.day}, 2026`
      : "";

  const existingDayLabel =
    existingDayDialog.day !== null
      ? `${monthNames[existingDayDialog.month - 1]} ${existingDayDialog.day}, 2026`
      : "";

  const petState = useMemo(() => getPetState(currentMoodMap), [currentMoodMap]);

  const weekMoods = useMemo(() => {
    const activeDay = currentMonth === todayMonth ? todayDay : 1;
    return getCurrentWeekMoods(2026, currentMonth, activeDay, currentMoodMap);
  }, [currentMonth, currentMoodMap, todayDay, todayMonth]);

  const isAnyOverlayOpen =
    editor.open || existingDayDialog.open || candyMessageDialog.open;

  const candyMessageLabel =
    candyMessageDialog.candy
      ? `${monthNames[Number(candyMessageDialog.candy.monthKey.split("-")[1]) - 1]} ${
          candyMessageDialog.candy.day
        }, 2026`
      : "";

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  function openNewRecordEditor(day: number, month: number) {
    setSelectedMood(null);
    setNote("");
    setEditor({
      open: true,
      month,
      day,
      mode: "newRecord",
    });
    setExistingDayDialog({
      open: false,
      month,
      day: null,
    });
  }

  function openExtraCandyEditor(day: number, month: number) {
    setSelectedMood(null);
    setNote("");
    setEditor({
      open: true,
      month,
      day,
      mode: "extraCandy",
    });
    setExistingDayDialog({
      open: false,
      month,
      day: null,
    });
  }

  function closeEditor() {
    setEditor((prev) => ({ ...prev, open: false, day: null }));
    setSelectedMood(null);
    setNote("");
  }

  function closeExistingDayDialog() {
    setExistingDayDialog((prev) => ({ ...prev, open: false, day: null }));
    setNote("");
  }

  function closeCandyMessageDialog() {
    setCandyMessageDialog({
      open: false,
      candy: null,
    });
  }

  function addCandyEntry({
    month,
    day,
    color,
    note,
    withDrop,
  }: {
    month: number;
    day: number;
    color: string;
    note: string;
    withDrop: boolean;
  }) {
    const monthKey = getMonthKey(2026, month);
    const nextSlot = getRandomAvailableSlot(savedCandyEntries);
    if (!nextSlot) return;

    const newEntry: CandyEntry = {
      id: `${monthKey}-${day}-${Date.now()}-${Math.random()}`,
      monthKey,
      day,
      color,
      x: nextSlot.x,
      y: nextSlot.y,
      note,
    };

    if (!withDrop) {
      setSavedCandyEntries((prev) => [...prev, newEntry]);
      return;
    }

    setDroppingTarget(nextSlot);

    const t1 = window.setTimeout(() => {
      setLidOpen(true);
    }, 80);

    const t2 = window.setTimeout(() => {
      const foundMood = (Object.keys(moodColorMap) as MoodKey[]).find(
        (key) => moodColorMap[key] === color
      );
      setDroppingMood(foundMood ?? null);
    }, 520);

    const t3 = window.setTimeout(() => {
      setSavedCandyEntries((prev) => [...prev, newEntry]);
    }, 1450);

    const t4 = window.setTimeout(() => {
      setDroppingMood(null);
      setDroppingTarget(null);
      setLidOpen(false);
    }, 1600);

    timersRef.current = [t1, t2, t3, t4];
  }

  const handleSaveEditor = () => {
    if (editor.day === null) return;

    const monthKey = getMonthKey(2026, editor.month);

    if (editor.mode === "newRecord") {
      if (!selectedMood) return;

      setMoodData2026((prev) => {
        const next = { ...prev };
        const monthMap = { ...(next[monthKey] ?? {}) };
        monthMap[editor.day!] = selectedMood;
        next[monthKey] = monthMap;
        return next;
      });

      setNoteData2026((prev) => {
        const next = { ...prev };
        const monthMap = { ...(next[monthKey] ?? {}) };
        monthMap[editor.day!] = note;
        next[monthKey] = monthMap;
        return next;
      });

      addCandyEntry({
        month: editor.month,
        day: editor.day,
        color: moodColorMap[selectedMood],
        note,
        withDrop: true,
      });

      closeEditor();
      return;
    }

    if (editor.mode === "extraCandy") {
      const dayMood = moodData2026[monthKey]?.[editor.day];
      if (!dayMood) return;

      addCandyEntry({
        month: editor.month,
        day: editor.day,
        color: moodColorMap[dayMood],
        note,
        withDrop: true,
      });

      closeEditor();
    }
  };

  const handleCalendarDayClick = (day: number) => {
    const hasRecord = Boolean(currentMoodMap[day]);

    if (!hasRecord) {
      openNewRecordEditor(day, currentMonth);
      return;
    }

    setNote("");
    setExistingDayDialog({
      open: true,
      month: currentMonth,
      day,
    });
  };

  const handleTodayPlusClick = () => {
    const todayMonthKey = getMonthKey(2026, todayMonth);
    const hasTodayRecord = Boolean(moodData2026[todayMonthKey]?.[todayDay]);

    if (!hasTodayRecord) {
      openNewRecordEditor(todayDay, todayMonth);
      return;
    }

    openExtraCandyEditor(todayDay, todayMonth);
  };

  return (
    <div className="relative h-full overflow-hidden">
      {view === "main" ? (
        <>
          <MainJarView
            onOpenTodayPlus={handleTodayPlusClick}
            onOpenPetSelection={() => setView("petSelection")}
            isBlurred={isAnyOverlayOpen}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            currentMoodMap={currentMoodMap}
            weekMoods={weekMoods}
            petLabel={petState.label}
            petBubble={petState.bubble}
            lidOpen={lidOpen}
            droppingMood={droppingMood}
            droppingTarget={droppingTarget}
            savedCandyEntries={savedCandyEntries}
            onCalendarDayClick={handleCalendarDayClick}
            onCandyClick={(entry) => {
              setCandyMessageDialog({
                open: true,
                candy: entry,
              });
            }}
            category={category}
          />

          {existingDayDialog.open && existingDayDialog.day !== null && (
            <div className="absolute inset-0 z-[999] flex items-start justify-center px-5 pt-[72px] pb-5 bg-black/10 overflow-y-auto">
              <div className="relative w-full max-w-[340px] max-h-[calc(100%-92px)] rounded-[28px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.16)] overflow-hidden shrink-0">
                <div className="px-5 pt-5 pb-4 overflow-y-auto">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <p className="text-[16px] leading-[1.35] text-[#3B3551] font-medium">
                      {existingDayLabel}
                    </p>

                    <button
                      type="button"
                      aria-label="Close"
                      onClick={closeExistingDayDialog}
                      className="w-8 h-8 rounded-full bg-[#F4F1F8] text-[#5A5470] flex items-center justify-center shrink-0"
                    >
                      <X size={16} strokeWidth={2.2} />
                    </button>
                  </div>

                  <div className="rounded-[18px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-4 mb-4">
                    <p className="text-[15px] leading-[1.5] text-[#4A4360]">
                      This day has already been recorded, so the mood cannot be edited.
                    </p>
                  </div>

                  <div className="rounded-[18px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-4">
                    <p className="text-[13px] text-[#7A7287] mb-3">
                      But you can still add a message ball for this day.
                    </p>

                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write a message..."
                      className="w-full h-[96px] resize-none rounded-[20px] border border-[#E7E1EE] bg-white px-4 py-3 text-[15px] text-[#2C2740] outline-none placeholder:text-[#A29AB5]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        openExtraCandyEditor(
                          existingDayDialog.day!,
                          existingDayDialog.month
                        )
                      }
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#341056] text-white text-[14px] font-medium"
                    >
                      <Plus size={16} />
                      Add message ball
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {editor.open && editor.day !== null && (
            <div className="absolute inset-0 z-[999] flex items-start justify-center px-5 pt-[72px] pb-5 bg-black/10 overflow-y-auto">
              <div className="relative w-full max-w-[340px] max-h-[calc(100%-92px)] rounded-[28px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.16)] overflow-hidden shrink-0">
                <div className="flex flex-col max-h-[calc(100%-92px)]">
                  <div className="px-5 pt-5 pb-3 overflow-y-auto">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p className="text-[16px] leading-[1.35] text-[#3B3551] font-medium pr-2">
                        {editor.mode === "newRecord"
                          ? "How was your day?"
                          : "Add a message ball"}
                      </p>

                      <button
                        type="button"
                        aria-label="Close"
                        onClick={closeEditor}
                        className="w-8 h-8 rounded-full bg-[#F4F1F8] text-[#5A5470] flex items-center justify-center shrink-0"
                      >
                        <X size={16} strokeWidth={2.2} />
                      </button>
                    </div>

                    <p className="text-[13px] leading-[1.5] text-[#7A7287] mb-3">
                      {editorDayLabel}
                    </p>

                    {editor.mode === "newRecord" && (
                      <div className="space-y-2 mb-4">
                        <MoodReferenceItem
                          mood="veryHappy"
                          selected={selectedMood === "veryHappy"}
                          onClick={() => setSelectedMood("veryHappy")}
                        />
                        <MoodReferenceItem
                          mood="happy"
                          selected={selectedMood === "happy"}
                          onClick={() => setSelectedMood("happy")}
                        />
                        <MoodReferenceItem
                          mood="bored"
                          selected={selectedMood === "bored"}
                          onClick={() => setSelectedMood("bored")}
                        />
                        <MoodReferenceItem
                          mood="angry"
                          selected={selectedMood === "angry"}
                          onClick={() => setSelectedMood("angry")}
                        />
                        <MoodReferenceItem
                          mood="sad"
                          selected={selectedMood === "sad"}
                          onClick={() => setSelectedMood("sad")}
                        />
                      </div>
                    )}
                    
                    {editor.mode === "extraCandy" && (
                      <div className="mb-4 rounded-[18px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-4">
                        <p className="text-[15px] leading-[1.5] text-[#4A4360]">
                          You already dropped a ball today.
                          Please come back tomorrow to add another one.
                        </p>
                      </div>
                    )}

                    {editor.mode !== "extraCandy" && (
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Write one sentence..."
                        className="w-full h-[96px] resize-none rounded-[20px] border border-[#E7E1EE] bg-[#FCFBFE] px-4 py-3 text-[15px] text-[#2C2740] outline-none placeholder:text-[#A29AB5]"
                      />
                    )}
                  </div>

                  <div className="px-5 pb-4 pt-3 border-t border-[#EEE7F5] bg-white/70 backdrop-blur-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeEditor}
                        className="px-4 py-2 rounded-full bg-[#F3F0F7] text-[#5C5670] text-[14px] font-medium"
                      >
                        {editor.mode === "extraCandy" ? "Close" : "Cancel"}
                      </button>

                      {editor.mode !== "extraCandy" && (
                        <button
                          type="button"
                          onClick={handleSaveEditor}
                          disabled={!selectedMood}
                          className={`px-4 py-2 rounded-full text-[14px] font-medium ${
                            selectedMood
                              ? "bg-[#341056] text-white"
                              : "bg-[#DDD7E7] text-[#8E879D]"
                          }`}
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {candyMessageDialog.open && candyMessageDialog.candy && (
            <div className="absolute inset-0 z-[999] flex items-start justify-center px-5 pt-[72px] pb-5 bg-black/10 overflow-y-auto">
              <div className="relative w-full max-w-[340px] max-h-[calc(100%-92px)] rounded-[28px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.16)] overflow-hidden shrink-0">
                <div className="px-5 pt-5 pb-4 overflow-y-auto">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <p className="text-[16px] leading-[1.35] text-[#3B3551] font-medium">
                      {candyMessageLabel}
                    </p>

                    <button
                      type="button"
                      aria-label="Close"
                      onClick={closeCandyMessageDialog}
                      className="w-8 h-8 rounded-full bg-[#F4F1F8] text-[#5A5470] flex items-center justify-center shrink-0"
                    >
                      <X size={16} strokeWidth={2.2} />
                    </button>
                  </div>

                  <div className="rounded-[18px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-4">
                    <p className="text-[13px] text-[#7A7287] mb-2">Message</p>

                    <div className="min-h-[88px] rounded-[16px] bg-white border border-[#EAE3F0] px-4 py-3 text-[15px] leading-[1.5] text-[#2C2740]">
                      {candyMessageDialog.candy.note || "No message was left for this candy."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <PetSelectionView
          category={category}
          setCategory={setCategory}
          onBack={() => setView("main")}
        />
      )}
    </div>
  );
}