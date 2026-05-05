import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Plus, X } from "lucide-react";
import { MoodCalendar } from "../components/mood-calendar";
import { usePet } from "../context/pet-context";
import type { PetId, PetItem, PetSpecies } from "../data/pets";

type JarView = "main" | "petSelection";
type MoodKey = "calm" | "tired" | "happy" | "anxious" | "homesick" | "needQuiet";
type ShareMode = "private" | "soft" | "full";

type DbMoodEntry = {
  id: number;
  user_id: number | string;
  family_id?: number | string;
  user_name: string;
  mood: string;
  comment: string | null;
  visibility?: ShareMode;
  entry_date: string;
  created_at: string;
};

type CurrentUser = {
  id: number | string;
  name?: string;
  email?: string;
  family_id?: number | string;
};

type CandyEntry = {
  id: string;
  owner: string;
  ownerName: string;
  monthKey: string;
  day: number;
  mood: MoodKey;
  color: string;
  x: string;
  y: string;
  note: string;
  shareMode: ShareMode;
};

type EditorState = {
  open: boolean;
  month: number;
  day: number | null;
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

const DEMO_YEAR = 2026;
const REAL_TODAY = new Date();
const DEMO_TODAY_MONTH =
  REAL_TODAY.getFullYear() === DEMO_YEAR ? REAL_TODAY.getMonth() + 1 : 5;
const DEMO_TODAY_DAY =
  REAL_TODAY.getFullYear() === DEMO_YEAR ? REAL_TODAY.getDate() : 1;

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
  calm: "#9FD8C2",
  tired: "#B7B4D8",
  happy: "#FFDC6E",
  anxious: "#F7A7A6",
  homesick: "#8EC4FB",
  needQuiet: "#C9C3B8",
};

const moodLabelMap: Record<MoodKey, string> = {
  calm: "Calm",
  tired: "Tired",
  happy: "Happy",
  anxious: "Anxious",
  homesick: "Homesick",
  needQuiet: "Need quiet",
};

const shareLabelMap: Record<ShareMode, string> = {
  private: "Private",
  soft: "Soft Share",
  full: "Full Share",
};

const softShareTextMap: Record<MoodKey, string> = {
  calm: "Grace seems calm today.",
  tired: "Grace may feel a little tired today.",
  happy: "Grace seems to have a brighter mood today.",
  anxious: "Grace may need a gentler moment today.",
  homesick: "Grace may miss home a little today.",
  needQuiet: "Grace may need some quiet space today.",
};

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
  { x: "16%", y: "42%" },
  { x: "35%", y: "43%" },
  { x: "55%", y: "43%" },
  { x: "72%", y: "45%" },
  { x: "24%", y: "55%" },
  { x: "46%", y: "55%" },
  { x: "64%", y: "57%" },
];

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function createCandyEntry({
  id,
  owner,
  ownerName,
  month,
  day,
  mood,
  note,
  shareMode,
  x,
  y,
}: {
  id: string;
  owner: string;
  ownerName: string;
  month: number;
  day: number;
  mood: MoodKey;
  note: string;
  shareMode: ShareMode;
  x: string;
  y: string;
}): CandyEntry {
  return {
    id,
    owner,
    ownerName,
    monthKey: getMonthKey(DEMO_YEAR, month),
    day,
    mood,
    color: moodColorMap[mood],
    x,
    y,
    note,
    shareMode,
  };
}

const sampleCandyEntries: CandyEntry[] = [];

function getCapsulePosition(index: number, total: number) {
  const columns = Math.max(5, Math.min(8, Math.ceil(Math.sqrt(Math.max(total, 1)))));
  const row = Math.floor(index / columns);
  const col = index % columns;

  const leftMin = 14;
  const leftMax = 78;
  const rowHeight = 8.2;
  const bottomBase = 6;
  const horizontalStep = columns > 1 ? (leftMax - leftMin) / (columns - 1) : 0;
  const left = leftMin + col * horizontalStep + (row % 2 === 1 ? horizontalStep * 0.45 : 0);
  const clampedLeft = Math.max(leftMin, Math.min(leftMax, left));
  const bottom = Math.min(72, bottomBase + row * rowHeight);

  return {
    left: `${clampedLeft}%`,
    bottom: `${bottom}%`,
  };
}

function buildRecordMapForOwnerMonth(
  entries: CandyEntry[],
  owner: string,
  monthKey: string
): Record<number, CandyEntry> {
  const result: Record<number, CandyEntry> = {};
  entries.forEach((entry) => {
    if (entry.owner === owner && entry.monthKey === monthKey) {
      result[entry.day] = entry;
    }
  });
  return result;
}

function getMoodMapFromRecords(records: Record<number, CandyEntry>) {
  const moodMap: Record<number, MoodKey> = {};
  Object.entries(records).forEach(([day, entry]) => {
    moodMap[Number(day)] = entry.mood;
  });
  return moodMap;
}

function getCurrentWeekMoods(
  year: number,
  month: number,
  activeDay: number,
  entries: CandyEntry[],
  owner: string
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

    const monthKey = getMonthKey(d.getFullYear(), d.getMonth() + 1);
    const dayNum = d.getDate();
    const entry = entries.find(
      (item) =>
        item.owner === owner &&
        item.monthKey === monthKey &&
        item.day === dayNum
    );
    const mood = entry?.mood ?? null;

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
      label: "Private by default",
      bubble: "Your jar is quiet. You choose what family can gently see.",
    };
  }

  const latestMood = values[values.length - 1];

  const stateMap: Record<MoodKey, { label: string; bubble: string }> = {
    calm: {
      label: "Calm",
      bubble: "Your jar feels calm. A soft check-in is enough.",
    },
    tired: {
      label: "Low-energy",
      bubble: "Your jar feels a little tired. Gentle care may help.",
    },
    happy: {
      label: "Bright",
      bubble: "Your jar caught a small bright moment today.",
    },
    anxious: {
      label: "Gentle care",
      bubble: "Your jar feels slightly heavy. No need to explain too much.",
    },
    homesick: {
      label: "Missing home",
      bubble: "Your jar carries a small homesick feeling today.",
    },
    needQuiet: {
      label: "Quiet mode",
      bubble: "Your jar asks for a quieter, softer moment.",
    },
  };

  return stateMap[latestMood];
}

function getRandomAvailableSlot(usedEntries: CandyEntry[]) {
  const usedPositions = usedEntries.map((entry) => ({
    x: parseFloat(entry.x),
    y: parseFloat(entry.y),
  }));

  const minDistance = 8;

  const validSlots = extraCandySlots.filter((slot) => {
    const sx = parseFloat(slot.x);
    const sy = parseFloat(slot.y);

    const tooCloseToAdded = usedPositions.some((used) => {
      const dx = sx - used.x;
      const dy = sy - used.y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });

    return !tooCloseToAdded;
  });

  if (validSlots.length === 0) {
    return extraCandySlots[Math.floor(Math.random() * extraCandySlots.length)];
  }

  return validSlots[Math.floor(Math.random() * validSlots.length)];
}

function getLatestEntryForOwner(entries: CandyEntry[], owner: string) {
  const ownerEntries = entries.filter((entry) => entry.owner === owner);
  if (ownerEntries.length === 0) return null;
  return ownerEntries[ownerEntries.length - 1];
}

function isMoodKey(value: string): value is MoodKey {
  return value in moodColorMap;
}

function normalizeMoodKey(value: string): MoodKey {
  if (isMoodKey(value)) return value;
  const normalized = value.trim().toLowerCase();
  const aliasMap: Record<string, MoodKey> = {
    sad: "homesick",
    stressed: "anxious",
    stress: "anxious",
    worried: "anxious",
    quiet: "needQuiet",
    neutral: "calm",
    okay: "calm",
  };
  return aliasMap[normalized] ?? "calm";
}

function getMonthDayFromDbDate(dateValue: string) {
  const datePart = dateValue.slice(0, 10);
  const [, month, day] = datePart.split("-").map(Number);

  return {
    month,
    day,
  };
}

function convertDbMoodEntriesToCandyEntries(dbEntries: DbMoodEntry[]): CandyEntry[] {
  return dbEntries
    .map((entry, index) => {
      const { month, day } = getMonthDayFromDbDate(entry.entry_date);
      const slot = extraCandySlots[index % extraCandySlots.length];
      const mood = normalizeMoodKey(entry.mood);
      const owner = String(entry.user_id);

      return createCandyEntry({
        id: `db-${entry.id}`,
        owner,
        ownerName: entry.user_name ?? `User ${entry.user_id}`,
        month,
        day,
        mood,
        note: entry.comment ?? "",
        shareMode: entry.visibility === "soft" || entry.visibility === "full" ? entry.visibility : "private",
        x: slot.x,
        y: slot.y,
      });
    });
}

function MoodFace({ mood, size = 30 }: { mood: MoodKey; size?: number }) {
  return (
    <div
      className="relative rounded-full border-[2px] border-[#111111] shrink-0"
      style={{ width: size, height: size, backgroundColor: moodColorMap[mood] }}
    >
      <span className="absolute left-[24%] top-[29%] w-[3.5px] h-[3.5px] rounded-full bg-[#111111]" />
      <span className="absolute right-[24%] top-[29%] w-[3.5px] h-[3.5px] rounded-full bg-[#111111]" />

      {(mood === "happy" || mood === "calm") && (
        <span className="absolute left-1/2 top-[55%] w-[38%] h-[20%] -translate-x-1/2 border-b-[2px] border-[#111111] rounded-b-full" />
      )}

      {mood === "tired" && (
        <>
          <span className="absolute left-[19%] top-[30%] w-[22%] h-[2px] bg-[#111111] rounded-full" />
          <span className="absolute right-[19%] top-[30%] w-[22%] h-[2px] bg-[#111111] rounded-full" />
          <span className="absolute left-1/2 top-[60%] w-[35%] h-[2px] -translate-x-1/2 bg-[#111111] rounded-full" />
        </>
      )}

      {(mood === "anxious" || mood === "homesick") && (
        <span className="absolute left-1/2 top-[61%] w-[38%] h-[20%] -translate-x-1/2 border-t-[2px] border-[#111111] rounded-t-full" />
      )}

      {mood === "needQuiet" && (
        <span className="absolute left-1/2 top-[61%] w-[34%] h-[2px] -translate-x-1/2 bg-[#111111] rounded-full" />
      )}
    </div>
  );
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-[16px] px-3 py-2 text-left transition-all ${
        selected ? "bg-[#F5EFFB] ring-1 ring-[#D8C8EA]" : "bg-[#FCFBFE]"
      }`}
    >
      <MoodFace mood={mood} />
      <span className="text-[14px] font-medium text-[#3B3551]">
        {moodLabelMap[mood]}
      </span>
    </button>
  );
}

function ShareModeButton({
  mode,
  current,
  title,
  description,
  onClick,
}: {
  mode: ShareMode;
  current: ShareMode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  const selected = mode === current;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[18px] border px-4 py-3 transition-all ${
        selected
          ? "bg-[#F4ECFF] border-[#BFA7E8] text-[#341056]"
          : "bg-white border-[#EEE7F5] text-[#5C5670]"
      }`}
    >
      <p className="text-[14px] font-medium">{title}</p>
      <p className="text-[12px] mt-1 leading-[1.35]">{description}</p>
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
    <div className="h-full overflow-y-auto px-5 pt-2 pb-24">
      <div className="flex items-center justify-start mb-8">
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

function SharedStatusCard({
  latestEntry,
  currentUserName,
}: {
  latestEntry: CandyEntry | null;
  currentUserName: string;
}) {
  return (
    <section className="px-4 pt-2 pb-2 shrink-0">
      <div className="rounded-[20px] bg-white/55 backdrop-blur-sm border border-white/60 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[14px] font-semibold text-[#5A2A86]">My latest shared status</p>
            <p className="text-[12px] text-[#7A7287] mt-1 leading-[1.4]">
              This section reflects what your family can see from your current account.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#F4ECFF] text-[#341056] text-[11px] font-semibold whitespace-nowrap">
            {currentUserName}
          </span>
        </div>

        {!latestEntry || latestEntry.shareMode === "private" ? (
          <div className="mt-3 rounded-[16px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-3 text-[13px] leading-[1.45] text-[#5C5670]">
            You have not shared a mood status today.
          </div>
        ) : (
          <div className="mt-3 rounded-[16px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-3">
            <div className="flex items-start gap-3">
              <MoodFace mood={latestEntry.mood} size={34} />
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[#3B3551] leading-[1.35]">
                  {latestEntry.shareMode === "soft"
                    ? softShareTextMap[latestEntry.mood]
                    : `Shared as ${moodLabelMap[latestEntry.mood].toLowerCase()}.`}
                </p>
                {latestEntry.shareMode === "full" && (
                  <p className="text-[13px] text-[#5C5670] leading-[1.45] mt-2">
                    “{latestEntry.note.trim() || "No note was left for this mood bead."}”
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MainJarView({
  onOpenTodayPlus,
  onOpenPetSelection,
  currentUserName,
  isBlurred,
  currentMonth,
  setCurrentMonth,
  ownMoodMap,
  weekMoods,
  petLabel,
  petBubble,
  lidOpen,
  droppingMood,
  droppingTarget,
  visibleJarEntries,
  latestOwnEntry,
  onCalendarDayClick,
  onCandyClick,
  currentPet,
}: {
  onOpenTodayPlus: () => void;
  onOpenPetSelection: () => void;
  currentUserName: string;
  isBlurred: boolean;
  currentMonth: number;
  setCurrentMonth: (value: number) => void;
  ownMoodMap: Record<number, MoodKey>;
  weekMoods: { day: string; filled: boolean; color: string }[];
  petLabel: string;
  petBubble: string;
  lidOpen: boolean;
  droppingMood: MoodKey | null;
  droppingTarget: { x: string; y: string } | null;
  visibleJarEntries: CandyEntry[];
  latestOwnEntry: CandyEntry | null;
  onCalendarDayClick: (day: number) => void;
  onCandyClick: (entry: CandyEntry) => void;
  currentPet: PetItem;
}) {
  const canRecordMood = true;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToCalendar = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`h-full overflow-y-auto transition-all duration-200 ${
        isBlurred ? "blur-[6px] scale-[0.985]" : ""
      }`}
    >
      <section className="relative px-4 pt-1 shrink-0">
        <div className="relative mb-1 min-h-[86px]">
          <div className="relative inline-flex max-w-[205px] px-[12px] py-[11px] rounded-[22px] bg-[#E3E3E3] text-[#161616] text-[16px] leading-[1.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] break-words">
            <span className="block pr-[6px]">{petBubble}</span>
            <span
              className="absolute right-5 -bottom-[8px] w-[14px] h-[14px] bg-[#E3E3E3] rotate-[-12deg]"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            />
          </div>

          <div className="absolute right-[12px] top-[18px] z-[10] flex flex-col items-center gap-3 shrink-0">
            <div className="flex flex-col items-center">
              <button
                type="button"
                aria-label="Change your pet"
                onClick={onOpenPetSelection}
                className="w-[68px] h-[68px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
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

              <p className="mt-1 w-[78px] text-center text-[10.5px] font-semibold leading-[1.15] text-[#5A2A86]">
                Change your pet
              </p>
            </div>

            {canRecordMood && (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  aria-label="Jump to mood calendar"
                  onClick={scrollToCalendar}
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-[#341056] active:scale-95 transition-transform"
                  style={{
                    border: "1.2px solid rgba(244, 181, 219, 0.72)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(253,248,251,0.96) 100%)",
                    boxShadow:
                      "0 0 0 1.5px rgba(241,222,233,0.35), 0 5px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <CalendarDays size={34} strokeWidth={2.2} />
                </button>

                <p className="mt-1 w-[78px] text-center text-[10.5px] font-semibold leading-[1.15] text-[#5A2A86]">
                  See calendar
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="h-[132px] flex items-end justify-center">
          <img
            src={currentPet.image}
            alt={currentPet.name}
            className="max-h-[128px] max-w-[220px] object-contain drop-shadow-[0_10px_14px_rgba(73,56,42,0.18)]"
          />
        </div>

        <div className="flex justify-center mb-2">
          <span className="px-3 py-1 rounded-full bg-[#F3EAFE] text-[#5A2A86] text-[12px] font-semibold">
            {petLabel}
          </span>
        </div>

        <p className="text-center text-[13px] leading-[1.45] text-[#6D647C] px-3 mb-4">
          The jar is shared, but each person’s mood calendar is private to themselves.
        </p>
      </section>

      {canRecordMood && (
        <section className="px-4 pb-2 shrink-0">
          <div className="rounded-[20px] bg-white/45 backdrop-blur-sm border border-white/50 px-4 py-3">
            <p className="text-[13px] font-semibold text-[#6D647C] mb-2">
              My recent mood drops
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
      )}

      {canRecordMood && (
        <section className="flex items-center gap-3 px-3 pt-2 pb-1 shrink-0">
          <button
            type="button"
            aria-label="Add today's mood bead"
            onClick={onOpenTodayPlus}
            className="w-[42px] h-[42px] rounded-full bg-white text-[#111111] flex items-center justify-center shrink-0 shadow-[0_5px_12px_rgba(0,0,0,0.12)]"
          >
            <Plus size={24} strokeWidth={2.2} />
          </button>

          <div>
            <p className="text-[17px] text-[#1F1F1F] leading-[1.2]">
              Drop a mood bead for today?
            </p>
            <p className="text-[12px] text-[#7A7287] mt-1 leading-[1.35]">
              Your own calendar stays private to your account.
            </p>
          </div>
        </section>
      )}

      <section className="px-4 pt-1 pb-2 shrink-0">
        <p className="text-center text-[13px] leading-[1.45] text-[#6D647C] px-4">
          Shared beads support gentle awareness. Private beads remain visible only to their owner.
        </p>
      </section>

      <section className="flex flex-col items-center justify-start pt-8 pb-6 shrink-0">
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

              {visibleJarEntries.map((entry, index) => {
                const pos = getCapsulePosition(index, visibleJarEntries.length);
                return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onCandyClick(entry)}
                  title={`${entry.ownerName}: ${moodLabelMap[entry.mood]}`}
                  className="absolute rounded-full"
                  data-capsule-index={index}
                  style={{
                    left: `calc(${pos.left} - ${BALL_RADIUS}px)`,
                    bottom: pos.bottom,
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
                );
              })}
            </div>
          </div>

          <p className="mt-1 text-[12px] text-[#7A7287] leading-[1.4] px-8 text-center">
            Family jar: shared beads are visible here. Your private beads are visible only to you.
          </p>
        </section>

      {canRecordMood && (
        <section className="px-4 pt-2 pb-1 shrink-0">
          <div className="rounded-[18px] bg-white/35 backdrop-blur-sm border border-white/40 px-4 py-3">
            <p className="text-[14px] font-semibold text-[#5A2A86]">
              Mood sharing control
            </p>
            <p className="text-[12px] text-[#7A7287] mt-1 leading-[1.4]">
              Private by default. Soft Share and Full Share decide what enters family awareness.
            </p>
          </div>
        </section>
      )}

      <SharedStatusCard
        latestEntry={latestOwnEntry}
        currentUserName={currentUserName}
      />

      {canRecordMood && (
        <>
          <section className="px-4 pt-2 pb-1 shrink-0">
            <div className="rounded-[18px] bg-white/35 backdrop-blur-sm border border-white/40 px-4 py-3">
              <p className="text-[14px] font-semibold text-[#5A2A86]">
                My private mood calendar
              </p>
              <p className="text-[12px] text-[#7A7287] mt-1 leading-[1.4]">
                Only {currentUserName} can see this calendar. Other family members cannot access it.
              </p>
            </div>
          </section>
          <MoodCalendar
            year={DEMO_YEAR}
            month={currentMonth}
            moodMap={ownMoodMap}
            onPrev={() => setCurrentMonth(Math.max(1, currentMonth - 1))}
            onNext={() => setCurrentMonth(Math.min(12, currentMonth + 1))}
            canPrev={currentMonth > 1}
            canNext={currentMonth < 12}
            onDayClick={onCalendarDayClick}
          />
        </>
      )}
    </div>
  );
}

export function JarPage() {
  const { selectedPetId, setSelectedPetId, unlockedPetIds, currentPet, petItems } = usePet();
  const [note, setNote] = useState("");
  const [view, setView] = useState<JarView>("main");
  const [realCurrentUser, setRealCurrentUser] = useState<CurrentUser | null>(null);
  const [currentMonth, setCurrentMonth] = useState(DEMO_TODAY_MONTH);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [shareMode, setShareMode] = useState<ShareMode>("private");
  const [allEntries, setAllEntries] = useState<CandyEntry[]>(sampleCandyEntries);
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [droppingMood, setDroppingMood] = useState<MoodKey | null>(null);
  const [droppingTarget, setDroppingTarget] = useState<{
    x: string;
    y: string;
  } | null>(null);

  const [editor, setEditor] = useState<EditorState>({
    open: false,
    month: DEMO_TODAY_MONTH,
    day: null,
  });

  const [existingDayDialog, setExistingDayDialog] =
    useState<ExistingDayDialogState>({
      open: false,
      month: DEMO_TODAY_MONTH,
      day: null,
    });

  const [candyMessageDialog, setCandyMessageDialog] =
    useState<CandyMessageDialogState>({
      open: false,
      candy: null,
    });

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/me");
        if (!response.ok) throw new Error("Failed to fetch current user");
        const user = await response.json();
        setRealCurrentUser(user);
      } catch (error) {
        console.warn("Failed to load current user:", error);
        setRealCurrentUser(null);
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
    const loadMoodEntries = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/moods");
        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to load moods:", data);
          return;
        }
        console.log("Mood entries returned:", Array.isArray(data) ? data.length : 0);

        const loadedEntries = convertDbMoodEntriesToCandyEntries(data as DbMoodEntry[]);
        console.log("Mood entries converted:", loadedEntries.length);

        setAllEntries((prev) => [
          ...prev.filter((entry) => !entry.id.startsWith("db-")),
          ...loadedEntries,
        ]);
      } catch (error) {
        console.error("Failed to connect backend:", error);
      }
    };

    void loadMoodEntries();
  }, [realCurrentUser?.id]);

  const currentUserId = realCurrentUser?.id != null ? String(realCurrentUser.id) : "guest";
  const currentUserName =
    typeof realCurrentUser?.name === "string" && realCurrentUser.name.trim()
      ? realCurrentUser.name
      : "Me";

  const currentMonthKey = getMonthKey(DEMO_YEAR, currentMonth);
  const ownRecordMap = useMemo(
    () => buildRecordMapForOwnerMonth(allEntries, currentUserId, currentMonthKey),
    [allEntries, currentUserId, currentMonthKey]
  );
  const ownMoodMap = useMemo(() => getMoodMapFromRecords(ownRecordMap), [ownRecordMap]);

  const editorDayLabel =
    editor.day !== null
      ? `${monthNames[editor.month - 1]} ${editor.day}, ${DEMO_YEAR}`
      : "";

  const existingDayLabel =
    existingDayDialog.day !== null
      ? `${monthNames[existingDayDialog.month - 1]} ${existingDayDialog.day}, ${DEMO_YEAR}`
      : "";

  const existingDayEntry =
    existingDayDialog.day !== null
      ? buildRecordMapForOwnerMonth(
          allEntries,
          currentUserId,
          getMonthKey(DEMO_YEAR, existingDayDialog.month)
        )[existingDayDialog.day] ?? null
      : null;

  const petState = useMemo(() => getPetState(ownMoodMap), [ownMoodMap]);

  const weekMoods = useMemo(() => {
    return getCurrentWeekMoods(
      DEMO_YEAR,
      DEMO_TODAY_MONTH,
      DEMO_TODAY_DAY,
      allEntries,
      currentUserId
    );
  }, [allEntries, currentUserId]);

  const latestOwnEntry = useMemo(
    () => getLatestEntryForOwner(allEntries, currentUserId),
    [allEntries, currentUserId]
  );

  const visibleJarEntries = useMemo(() => allEntries, [allEntries]);
  useEffect(() => {
    console.log("Capsules rendered:", visibleJarEntries.length);
  }, [visibleJarEntries]);

  const isAnyOverlayOpen =
    editor.open || existingDayDialog.open || candyMessageDialog.open;

  const candyMessageLabel = candyMessageDialog.candy
    ? `${monthNames[Number(candyMessageDialog.candy.monthKey.split("-")[1]) - 1]} ${
        candyMessageDialog.candy.day
      }, ${DEMO_YEAR}`
    : "";

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  function openNewRecordEditor(day: number, month: number) {
    setSelectedMood(null);
    setShareMode("private");
    setNote("");
    setEditor({
      open: true,
      month,
      day,
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
    setShareMode("private");
    setNote("");
  }

  function closeExistingDayDialog() {
    setExistingDayDialog((prev) => ({ ...prev, open: false, day: null }));
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
    mood,
    note,
    shareMode,
    withDrop,
  }: {
    month: number;
    day: number;
    mood: MoodKey;
    note: string;
    shareMode: ShareMode;
    withDrop: boolean;
  }) {
    const owner = currentUserId;

    const monthKey = getMonthKey(DEMO_YEAR, month);
    const nextSlot = getRandomAvailableSlot(allEntries);
    if (!nextSlot) return;

    const newEntry: CandyEntry = {
      id: `${owner}-${monthKey}-${day}-${Date.now()}-${Math.random()}`,
      owner,
      ownerName: currentUserName,
      monthKey,
      day,
      mood,
      color: moodColorMap[mood],
      x: nextSlot.x,
      y: nextSlot.y,
      note,
      shareMode,
    };

    const addOrReplaceEntry = (prev: CandyEntry[]) => [
      ...prev.filter(
        (entry) => !(entry.owner === owner && entry.monthKey === monthKey && entry.day === day)
      ),
      newEntry,
    ];

    if (!withDrop) {
      setAllEntries(addOrReplaceEntry);
      return;
    }

    clearTimers();
    setDroppingTarget(nextSlot);

    const t1 = window.setTimeout(() => {
      setLidOpen(true);
    }, 80);

    const t2 = window.setTimeout(() => {
      setDroppingMood(mood);
    }, 520);

    const t3 = window.setTimeout(() => {
      setAllEntries(addOrReplaceEntry);
    }, 1450);

    const t4 = window.setTimeout(() => {
      setDroppingMood(null);
      setDroppingTarget(null);
      setLidOpen(false);
    }, 1600);

    timersRef.current = [t1, t2, t3, t4];
  }

  const handleSaveEditor = async () => {
    if (editor.day === null || !selectedMood || isSavingMood) return;

    if (!realCurrentUser?.id) {
      console.warn("Current user is not available.");
      return;
    }

    const entryDate = `${DEMO_YEAR}-${String(editor.month).padStart(2, "0")}-${String(
      editor.day
    ).padStart(2, "0")}`;

    try {
      setIsSavingMood(true);

      const response = await fetch("http://localhost:3001/api/moods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mood: selectedMood,
          comment: note,
          entry_date: entryDate,
          visibility: shareMode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to save mood:", result);
        alert(result.error || "Failed to save mood.");
        return;
      }

      addCandyEntry({
        month: editor.month,
        day: editor.day,
        mood: selectedMood,
        note,
        shareMode,
        withDrop: true,
      });

      closeEditor();
    } catch (error) {
      console.error("Failed to connect backend:", error);
      alert("Failed to connect backend.");
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleCalendarDayClick = (day: number) => {
    const hasRecord = Boolean(ownRecordMap[day]);

    if (!hasRecord) {
      openNewRecordEditor(day, currentMonth);
      return;
    }

    setExistingDayDialog({
      open: true,
      month: currentMonth,
      day,
    });
  };

  const handleTodayPlusClick = () => {
    const todayMonthKey = getMonthKey(DEMO_YEAR, DEMO_TODAY_MONTH);
    const todayOwnMap = buildRecordMapForOwnerMonth(allEntries, currentUserId, todayMonthKey);
    const hasTodayRecord = Boolean(todayOwnMap[DEMO_TODAY_DAY]);

    if (!hasTodayRecord) {
      openNewRecordEditor(DEMO_TODAY_DAY, DEMO_TODAY_MONTH);
      return;
    }

    setExistingDayDialog({
      open: true,
      month: DEMO_TODAY_MONTH,
      day: DEMO_TODAY_DAY,
    });
  };

  return (
    <div className="relative h-full overflow-hidden">
      {view === "main" ? (
        <>
          <MainJarView
            onOpenTodayPlus={handleTodayPlusClick}
            onOpenPetSelection={() => setView("petSelection")}
            currentUserName={currentUserName}
            isBlurred={isAnyOverlayOpen}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            ownMoodMap={ownMoodMap}
            weekMoods={weekMoods}
            petLabel={petState.label}
            petBubble={petState.bubble}
            lidOpen={lidOpen}
            droppingMood={droppingMood}
            droppingTarget={droppingTarget}
            visibleJarEntries={visibleJarEntries}
            latestOwnEntry={latestOwnEntry}
            onCalendarDayClick={handleCalendarDayClick}
            onCandyClick={(entry) => {
              setCandyMessageDialog({
                open: true,
                candy: entry,
              });
            }}
            currentPet={currentPet}
          />

          {existingDayDialog.open && existingDayDialog.day !== null && (
            <div className="absolute inset-0 z-[999] flex items-start justify-center px-5 pt-[72px] pb-5 bg-black/10 overflow-y-auto">
              <div className="relative w-full max-w-[340px] rounded-[28px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.16)] overflow-hidden shrink-0">
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
                      This day already has one mood bead in your private calendar. You can keep it private or choose how much to share.
                    </p>
                  </div>

                  {existingDayEntry && (
                    <div className="rounded-[18px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-4">
                      <div className="flex items-center gap-3 mb-3">
                        <MoodFace mood={existingDayEntry.mood} size={34} />
                        <div>
                          <p className="text-[14px] font-semibold text-[#3B3551]">
                            {moodLabelMap[existingDayEntry.mood]}
                          </p>
                          <p className="text-[12px] text-[#7A7287] mt-0.5">
                            {shareLabelMap[existingDayEntry.shareMode]}
                          </p>
                        </div>
                      </div>

                      <p className="text-[13px] text-[#7A7287] mb-2">Note</p>
                      <div className="min-h-[88px] rounded-[16px] bg-white border border-[#EAE3F0] px-4 py-3 text-[15px] leading-[1.5] text-[#2C2740]">
                        {existingDayEntry.note.trim() || "No note was left for this mood bead."}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {editor.open && editor.day !== null && (
            <div className="absolute inset-0 z-[999] bg-black/10 overflow-y-auto overscroll-contain px-5 pt-[72px] pb-[132px]">
              <div className="mx-auto w-full max-w-[340px] rounded-[28px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.16)] overflow-hidden">
                <div className="px-5 pt-5 pb-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p className="text-[16px] leading-[1.35] text-[#3B3551] font-medium pr-2">
                        How are you feeling today?
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

                    <div className="space-y-2 mb-4">
                      <MoodReferenceItem mood="calm" selected={selectedMood === "calm"} onClick={() => setSelectedMood("calm")} />
                      <MoodReferenceItem mood="tired" selected={selectedMood === "tired"} onClick={() => setSelectedMood("tired")} />
                      <MoodReferenceItem mood="happy" selected={selectedMood === "happy"} onClick={() => setSelectedMood("happy")} />
                      <MoodReferenceItem mood="anxious" selected={selectedMood === "anxious"} onClick={() => setSelectedMood("anxious")} />
                      <MoodReferenceItem mood="homesick" selected={selectedMood === "homesick"} onClick={() => setSelectedMood("homesick")} />
                      <MoodReferenceItem mood="needQuiet" selected={selectedMood === "needQuiet"} onClick={() => setSelectedMood("needQuiet")} />
                    </div>

                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write one sentence..."
                      className="w-full h-[96px] resize-none rounded-[20px] border border-[#E7E1EE] bg-[#FCFBFE] px-4 py-3 text-[15px] text-[#2C2740] outline-none placeholder:text-[#A29AB5]"
                    />

                    <div className="mt-4">
                      <p className="text-[13px] text-[#7A7287] mb-2">
                        Who can see this mood?
                      </p>

                      <div className="space-y-2">
                        <ShareModeButton
                          mode="private"
                          current={shareMode}
                          title="Private: Only me"
                          description="Only visible to me. Family cannot see this capsule."
                          onClick={() => setShareMode("private")}
                        />
                        <ShareModeButton
                          mode="soft"
                          current={shareMode}
                          title="Soft: Mood only"
                          description="Family can see mood type and sender, but not note."
                          onClick={() => setShareMode("soft")}
                        />
                        <ShareModeButton
                          mode="full"
                          current={shareMode}
                          title="Full: Mood + note"
                          description="Family can see mood type, sender, and note."
                          onClick={() => setShareMode("full")}
                        />
                      </div>
                    </div>
                  <div className="mt-5 pt-4 border-t border-[#EEE7F5]">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeEditor}
                        className="px-4 py-2 rounded-full bg-[#F3F0F7] text-[#5C5670] text-[14px] font-medium"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveEditor}
                        disabled={!selectedMood || isSavingMood}
                        className={`px-4 py-2 rounded-full text-[14px] font-medium ${
                          selectedMood && !isSavingMood
                            ? "bg-[#341056] text-white"
                            : "bg-[#DDD7E7] text-[#8E879D]"
                        }`}
                      >
                        {isSavingMood ? "Saving..." : "Save"}
                      </button>
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
                    <div>
                      <p className="text-[16px] leading-[1.35] text-[#3B3551] font-medium">
                        {candyMessageLabel}
                      </p>
                      <p className="text-[12px] text-[#7A7287] mt-1">
                        From {candyMessageDialog.candy.ownerName}
                      </p>
                    </div>

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
                    <div className="flex items-center gap-3 mb-3">
                      <MoodFace mood={candyMessageDialog.candy.mood} size={34} />
                      <div>
                        <p className="text-[14px] font-semibold text-[#3B3551]">
                          {moodLabelMap[candyMessageDialog.candy.mood]}
                        </p>
                        <p className="text-[12px] text-[#7A7287] mt-0.5">
                          {shareLabelMap[candyMessageDialog.candy.shareMode]}
                        </p>
                      </div>
                    </div>

                    <p className="text-[13px] text-[#7A7287] mb-2">Note</p>
                    <div className="min-h-[88px] rounded-[16px] bg-white border border-[#EAE3F0] px-4 py-3 text-[15px] leading-[1.5] text-[#2C2740]">
                      {candyMessageDialog.candy.owner !== currentUserId &&
                      candyMessageDialog.candy.shareMode === "soft"
                        ? "This capsule is Soft visibility. Family can see mood only."
                        : candyMessageDialog.candy.note.trim() || "No note was left for this mood bead."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <PetSelectionView
          selectedPetId={selectedPetId}
          setSelectedPetId={setSelectedPetId}
          currentPet={currentPet}
          petItems={petItems}
          unlockedPetIds={unlockedPetIds}
          onBack={() => setView("main")}
        />
      )}
    </div>
  );
}
