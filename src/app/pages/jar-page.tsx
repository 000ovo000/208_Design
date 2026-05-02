import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Plus, X } from "lucide-react";
import { MoodCalendar } from "../components/mood-calendar";
import { usePet } from "../context/pet-context";
import type { PetId, PetItem, PetSpecies } from "../data/pets";

type JarView = "main" | "petSelection";
type MoodKey = "calm" | "tired" | "happy" | "anxious" | "homesick" | "needQuiet";
type ShareMode = "private" | "soft" | "full";
type FamilyReaction = "hug" | "tea" | "pet" | null;
type UserRole = "daughter" | "mum" | "dad" | "grandma" | "grandpa";

type CandyEntry = {
  id: string;
  owner: UserRole;
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

const profileOrder: UserRole[] = ["daughter", "mum", "dad", "grandma", "grandpa"];

const profileMap: Record<
  UserRole,
  { name: string; roleLabel: string; avatar: string; bg: string }
> = {
  daughter: {
    name: "Daughter",
    roleLabel: "Student account",
    avatar: "👧",
    bg: "#FFE4EF",
  },
  mum: {
    name: "Mum",
    roleLabel: "Family account",
    avatar: "👩",
    bg: "#E9E2FF",
  },
  dad: {
    name: "Dad",
    roleLabel: "Family account",
    avatar: "👨",
    bg: "#DFF1FF",
  },
  grandma: {
    name: "Grandma",
    roleLabel: "Care account",
    avatar: "👵",
    bg: "#FFF0CC",
  },
  grandpa: {
    name: "Grandpa",
    roleLabel: "Care account",
    avatar: "👴",
    bg: "#DDEFE8",
  },
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
  calm: "Daughter seems calm today.",
  tired: "Daughter may feel a little tired today.",
  happy: "Daughter seems to have a brighter mood today.",
  anxious: "Daughter may need a gentler moment today.",
  homesick: "Daughter may miss home a little today.",
  needQuiet: "Daughter may need some quiet space today.",
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
  month,
  day,
  mood,
  note,
  shareMode,
  x,
  y,
}: {
  id: string;
  owner: UserRole;
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

const sampleCandyEntries: CandyEntry[] = [
  createCandyEntry({ id: "daughter-1", owner: "daughter", month: 4, day: 21, mood: "calm", note: "Today was soft and manageable.", shareMode: "soft", x: "18%", y: "8%" }),
  createCandyEntry({ id: "daughter-2", owner: "daughter", month: 4, day: 22, mood: "tired", note: "A lot of deadlines today, but I am okay.", shareMode: "soft", x: "34%", y: "7%" }),
  createCandyEntry({ id: "daughter-3", owner: "daughter", month: 4, day: 23, mood: "happy", note: "A small good thing happened after class.", shareMode: "full", x: "50%", y: "9%" }),
  createCandyEntry({ id: "daughter-4", owner: "daughter", month: 4, day: 24, mood: "needQuiet", note: "I needed a quiet evening.", shareMode: "private", x: "67%", y: "8%" }),
  createCandyEntry({ id: "daughter-5", owner: "daughter", month: 4, day: 25, mood: "homesick", note: "I missed home a little after dinner.", shareMode: "soft", x: "25%", y: "20%" }),
  createCandyEntry({ id: "daughter-6", owner: "daughter", month: 4, day: 26, mood: "anxious", note: "Presentation week feels a bit heavy.", shareMode: "full", x: "43%", y: "21%" }),
  createCandyEntry({ id: "daughter-7", owner: "daughter", month: 4, day: 27, mood: "calm", note: "Nothing big happened, which was nice.", shareMode: "private", x: "61%", y: "22%" }),
  createCandyEntry({ id: "daughter-8", owner: "daughter", month: 4, day: 28, mood: "happy", note: "The weather made campus look pretty.", shareMode: "soft", x: "77%", y: "27%" }),
  createCandyEntry({ id: "mum-1", owner: "mum", month: 4, day: 26, mood: "calm", note: "I am glad to hear small updates.", shareMode: "soft", x: "15%", y: "34%" }),
  createCandyEntry({ id: "dad-1", owner: "dad", month: 4, day: 27, mood: "happy", note: "Dinner after work was nice today.", shareMode: "soft", x: "54%", y: "36%" }),
];

function buildRecordMapForOwnerMonth(
  entries: CandyEntry[],
  owner: UserRole,
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
  owner: UserRole
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

function getPetState(moodMap: Record<number, MoodKey>, currentUser: UserRole) {
  if (currentUser === "grandma" || currentUser === "grandpa") {
    return {
      label: "Care mode",
      bubble: "You can simply send a small care to Daughter.",
    };
  }

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

function getLatestEntryForOwner(entries: CandyEntry[], owner: UserRole) {
  const ownerEntries = entries.filter((entry) => entry.owner === owner);
  if (ownerEntries.length === 0) return null;
  return ownerEntries[ownerEntries.length - 1];
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

function AccountSwitcher({
  currentUser,
  onSwitchUser,
}: {
  currentUser: UserRole;
  onSwitchUser: (value: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const currentProfile = profileMap[currentUser];

  const openSwitcher = () => setOpen(true);

  const startLongPress = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = window.setTimeout(openSwitcher, 420);
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  return (
    <>
      <div className="absolute right-0 top-0 z-[30] flex flex-col items-center">
        <button
          type="button"
          aria-label="Switch account"
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onContextMenu={(event) => {
            event.preventDefault();
            openSwitcher();
          }}
          onClick={openSwitcher}
          className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
        >
          <span
            className="w-[43px] h-[43px] rounded-full border border-white/80 shadow-[0_5px_14px_rgba(0,0,0,0.12)] flex items-center justify-center text-[23px]"
            style={{ backgroundColor: currentProfile.bg }}
          >
            {currentProfile.avatar}
          </span>
          <span className="max-w-[66px] truncate rounded-full bg-white/72 px-2 py-[2px] text-[10px] font-semibold text-[#341056] shadow-sm">
            {currentProfile.name}
          </span>
        </button>
      </div>

      {open && (
        <div className="absolute inset-0 z-[998] bg-black/10" onClick={() => setOpen(false)}>
          <div
            className="absolute right-4 top-[76px] w-[270px] rounded-[26px] bg-white/92 backdrop-blur-xl border border-white/80 shadow-[0_18px_44px_rgba(34,16,56,0.18)] px-4 py-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[15px] font-semibold text-[#341056]">
                  Switch account
                </p>
                <p className="text-[11px] text-[#7A7287] mt-1 leading-[1.35]">
                  Demo profile switcher for different family accounts.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close account switcher"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4F1F8] text-[#5A5470] flex items-center justify-center shrink-0"
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <div className="space-y-2">
              {profileOrder.map((profileKey) => {
                const profile = profileMap[profileKey];
                const active = profileKey === currentUser;

                return (
                  <button
                    key={profileKey}
                    type="button"
                    onClick={() => {
                      onSwitchUser(profileKey);
                      setOpen(false);
                    }}
                    className={`w-full grid grid-cols-[42px_1fr_26px] items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "bg-[#F4ECFF] border border-[#D8C6F2]"
                        : "bg-[#FCFBFE] border border-[#EEE7F5]"
                    }`}
                  >
                    <span
                      className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[21px] border border-white/80"
                      style={{ backgroundColor: profile.bg }}
                    >
                      {profile.avatar}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-[#3B3551]">
                        {profile.name}
                      </span>
                      <span className="block text-[11px] text-[#7A7287] mt-0.5">
                        {profile.roleLabel}
                      </span>
                    </span>
                    <span className="flex justify-end text-[#341056]">
                      {active && <Check size={18} strokeWidth={2.5} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SharedStatusCard({
  daughterEntry,
  familyReaction,
  setFamilyReaction,
  currentUser,
}: {
  daughterEntry: CandyEntry | null;
  familyReaction: FamilyReaction;
  setFamilyReaction: (value: FamilyReaction) => void;
  currentUser: UserRole;
}) {
  const isStudent = currentUser === "daughter";
  const isGrandparent = currentUser === "grandma" || currentUser === "grandpa";
  const currentProfile = profileMap[currentUser];

  const canSeeEntry = daughterEntry && daughterEntry.shareMode !== "private";

  if (isGrandparent) {
    return (
      <section className="px-4 pt-2 pb-4 shrink-0">
        <div className="rounded-[26px] bg-white/62 backdrop-blur-sm border border-white/70 px-5 py-5 shadow-[0_10px_26px_rgba(0,0,0,0.05)]">
          <p className="text-[21px] font-semibold text-[#5A2A86] mb-2">
            Daughter today
          </p>
          <p className="text-[15px] leading-[1.5] text-[#6D647C] mb-4">
            Only the mood Daughter chooses to share is shown here. A small response is enough.
          </p>

          {!canSeeEntry ? (
            <div className="rounded-[20px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-4 text-[17px] leading-[1.45] text-[#3B3551]">
              Daughter has not shared a mood today.
            </div>
          ) : (
            <div className="rounded-[20px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-4">
              <div className="flex items-start gap-3">
                <MoodFace mood={daughterEntry.mood} size={44} />
                <div>
                  <p className="text-[17px] font-semibold text-[#3B3551] leading-[1.4]">
                    {daughterEntry.shareMode === "soft"
                      ? softShareTextMap[daughterEntry.mood]
                      : `Daughter feels ${moodLabelMap[daughterEntry.mood].toLowerCase()} today.`}
                  </p>
                  {daughterEntry.shareMode === "full" && (
                    <p className="text-[15px] text-[#5C5670] leading-[1.5] mt-2">
                      “{daughterEntry.note.trim() || "No note was left."}”
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setFamilyReaction("hug")}
              className="w-full rounded-[20px] bg-[#F4ECFF] text-[#341056] px-4 py-3.5 text-[16px] font-semibold text-left"
            >
              🤗 Send a hug
            </button>
            <button
              type="button"
              onClick={() => setFamilyReaction("tea")}
              className="w-full rounded-[20px] bg-[#F4ECFF] text-[#341056] px-4 py-3.5 text-[16px] font-semibold text-left"
            >
              🍵 Send warm tea
            </button>
            <button
              type="button"
              onClick={() => setFamilyReaction("pet")}
              className="w-full rounded-[20px] bg-[#F4ECFF] text-[#341056] px-4 py-3.5 text-[16px] font-semibold text-left"
            >
              🐶 Pet Daughter’s pet
            </button>
          </div>

          {familyReaction && (
            <p className="text-[14px] mt-4 text-[#7A7287] leading-[1.4]">
              {familyReaction === "hug" && `${currentProfile.name} sent a gentle hug.`}
              {familyReaction === "tea" && `${currentProfile.name} sent warm tea.`}
              {familyReaction === "pet" && `${currentProfile.name} gently petted Daughter’s pet.`}
            </p>
          )}
        </div>
      </section>
    );
  }

  const title = isStudent ? "Family view preview" : "Daughter’s shared status";
  const subtitle = isStudent
    ? "Your calendar is private. Family only sees the status you choose to share."
    : "You cannot see Daughter’s private calendar. Only her shared status appears here.";
  const badgeLabel = isStudent ? "User controlled" : "Shared by Daughter";

  return (
    <section className="px-4 pt-2 pb-2 shrink-0">
      <div className="rounded-[20px] bg-white/55 backdrop-blur-sm border border-white/60 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[14px] font-semibold text-[#5A2A86]">{title}</p>
            <p className="text-[12px] text-[#7A7287] mt-1 leading-[1.4]">{subtitle}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#F4ECFF] text-[#341056] text-[11px] font-semibold whitespace-nowrap">
            {badgeLabel}
          </span>
        </div>

        {!daughterEntry || daughterEntry.shareMode === "private" ? (
          <div className="mt-3 rounded-[16px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-3 text-[13px] leading-[1.45] text-[#5C5670]">
            Daughter has not shared a mood today.
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-[16px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-3">
              <div className="flex items-start gap-3">
                <MoodFace mood={daughterEntry.mood} size={34} />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#3B3551] leading-[1.35]">
                    {daughterEntry.shareMode === "soft"
                      ? softShareTextMap[daughterEntry.mood]
                      : `Daughter added a ${moodLabelMap[daughterEntry.mood].toLowerCase()} mood bead.`}
                  </p>
                  {daughterEntry.shareMode === "full" && (
                    <p className="text-[13px] text-[#5C5670] leading-[1.45] mt-2">
                      “{daughterEntry.note.trim() || "No note was left for this mood bead."}”
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!isStudent && (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFamilyReaction("hug")}
                    className="rounded-full bg-[#F4ECFF] text-[#341056] px-2 py-2 text-[12px] font-medium"
                  >
                    🤗 Hug
                  </button>
                  <button
                    type="button"
                    onClick={() => setFamilyReaction("tea")}
                    className="rounded-full bg-[#F4ECFF] text-[#341056] px-2 py-2 text-[12px] font-medium"
                  >
                    🍵 Tea
                  </button>
                  <button
                    type="button"
                    onClick={() => setFamilyReaction("pet")}
                    className="rounded-full bg-[#F4ECFF] text-[#341056] px-2 py-2 text-[12px] font-medium"
                  >
                    🐶 Pet
                  </button>
                </div>

                {familyReaction && (
                  <p className="text-[12px] mt-3 text-[#7A7287] leading-[1.4]">
                    {familyReaction === "hug" && `${currentProfile.name} sent a gentle hug.`}
                    {familyReaction === "tea" && `${currentProfile.name} sent warm tea.`}
                    {familyReaction === "pet" && `${currentProfile.name} gently petted Daughter’s pet.`}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function MainJarView({
  onOpenTodayPlus,
  onOpenPetSelection,
  currentUser,
  onSwitchUser,
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
  daughterLatestEntry,
  familyReaction,
  setFamilyReaction,
  onCalendarDayClick,
  onCandyClick,
  currentPet,
}: {
  onOpenTodayPlus: () => void;
  onOpenPetSelection: () => void;
  currentUser: UserRole;
  onSwitchUser: (value: UserRole) => void;
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
  daughterLatestEntry: CandyEntry | null;
  familyReaction: FamilyReaction;
  setFamilyReaction: (value: FamilyReaction) => void;
  onCalendarDayClick: (day: number) => void;
  onCandyClick: (entry: CandyEntry) => void;
  currentPet: PetItem;
}) {
  const isDaughter = currentUser === "daughter";
  const isParent = currentUser === "mum" || currentUser === "dad";
  const isGrandparent = currentUser === "grandma" || currentUser === "grandpa";
  const canRecordMood = isDaughter || isParent;
  const currentProfile = profileMap[currentUser];
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
        <div className="relative flex items-start justify-start mb-2 min-h-[64px]">
          <AccountSwitcher
            currentUser={currentUser}
            onSwitchUser={onSwitchUser}
          />
        </div>

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
          {isGrandparent
            ? "This view is simplified for care. You do not need to manage a mood calendar."
            : "The jar is shared, but each person’s mood calendar is private to themselves."}
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
              {isDaughter ? "Drop a mood bead for today?" : "Add your own mood bead?"}
            </p>
            {isParent && (
              <p className="text-[12px] text-[#7A7287] mt-1 leading-[1.35]">
                Your own calendar stays private to your account.
              </p>
            )}
          </div>
        </section>
      )}

      {!isGrandparent && (
        <section className="px-4 pt-1 pb-2 shrink-0">
          <p className="text-center text-[13px] leading-[1.45] text-[#6D647C] px-4">
            Shared beads support gentle awareness. Private beads remain visible only to their owner.
          </p>
        </section>
      )}

      {!isGrandparent && (
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

              {visibleJarEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onCandyClick(entry)}
                  title={`${profileMap[entry.owner].name}: ${moodLabelMap[entry.mood]}`}
                  className="absolute rounded-full"
                  style={{
                    left: entry.x.startsWith("calc")
                      ? entry.x
                      : `calc(${entry.x} - ${BALL_RADIUS}px)`,
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

          <p className="mt-1 text-[12px] text-[#7A7287] leading-[1.4] px-8 text-center">
            Family jar: shared beads are visible here. Your private beads are visible only to you.
          </p>
        </section>
      )}

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
        daughterEntry={daughterLatestEntry}
        familyReaction={familyReaction}
        setFamilyReaction={setFamilyReaction}
        currentUser={currentUser}
      />

      {canRecordMood && (
        <>
          <section className="px-4 pt-2 pb-1 shrink-0">
            <div className="rounded-[18px] bg-white/35 backdrop-blur-sm border border-white/40 px-4 py-3">
              <p className="text-[14px] font-semibold text-[#5A2A86]">
                My private mood calendar
              </p>
              <p className="text-[12px] text-[#7A7287] mt-1 leading-[1.4]">
                Only {currentProfile.name} can see this calendar. Other family members cannot access it.
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
  const [currentUser, setCurrentUser] = useState<UserRole>("daughter");
  const [currentMonth, setCurrentMonth] = useState(DEMO_TODAY_MONTH);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [shareMode, setShareMode] = useState<ShareMode>("private");
  const [allEntries, setAllEntries] = useState<CandyEntry[]>(sampleCandyEntries);
  const [familyReaction, setFamilyReaction] = useState<FamilyReaction>(null);
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

  const currentMonthKey = getMonthKey(DEMO_YEAR, currentMonth);
  const ownRecordMap = useMemo(
    () => buildRecordMapForOwnerMonth(allEntries, currentUser, currentMonthKey),
    [allEntries, currentUser, currentMonthKey]
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
          currentUser,
          getMonthKey(DEMO_YEAR, existingDayDialog.month)
        )[existingDayDialog.day] ?? null
      : null;

  const petState = useMemo(
    () => getPetState(ownMoodMap, currentUser),
    [ownMoodMap, currentUser]
  );

  const weekMoods = useMemo(() => {
    return getCurrentWeekMoods(
      DEMO_YEAR,
      DEMO_TODAY_MONTH,
      DEMO_TODAY_DAY,
      allEntries,
      currentUser
    );
  }, [allEntries, currentUser]);

  const daughterLatestEntry = useMemo(
    () => getLatestEntryForOwner(allEntries, "daughter"),
    [allEntries]
  );

  const visibleJarEntries = useMemo(() => {
    if (currentUser === "grandma" || currentUser === "grandpa") return [];
    return allEntries.filter(
      (entry) => entry.owner === currentUser || entry.shareMode !== "private"
    );
  }, [allEntries, currentUser]);

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
    if (currentUser === "grandma" || currentUser === "grandpa") return;
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
    const owner = currentUser;
    if (owner === "grandma" || owner === "grandpa") return;

    const monthKey = getMonthKey(DEMO_YEAR, month);
    const nextSlot = getRandomAvailableSlot(allEntries);
    if (!nextSlot) return;

    const newEntry: CandyEntry = {
      id: `${owner}-${monthKey}-${day}-${Date.now()}-${Math.random()}`,
      owner,
      monthKey,
      day,
      mood,
      color: moodColorMap[mood],
      x: nextSlot.x,
      y: nextSlot.y,
      note,
      shareMode,
    };

    setFamilyReaction(null);

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

  const handleSaveEditor = () => {
    if (editor.day === null || !selectedMood) return;

    addCandyEntry({
      month: editor.month,
      day: editor.day,
      mood: selectedMood,
      note,
      shareMode,
      withDrop: true,
    });

    closeEditor();
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
    const todayOwnMap = buildRecordMapForOwnerMonth(allEntries, currentUser, todayMonthKey);
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
            currentUser={currentUser}
            onSwitchUser={setCurrentUser}
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
            daughterLatestEntry={daughterLatestEntry}
            familyReaction={familyReaction}
            setFamilyReaction={setFamilyReaction}
            onCalendarDayClick={handleCalendarDayClick}
            onCandyClick={(entry) => {
              const isOwnEntry = entry.owner === currentUser;
              const canOpenSharedDetail = entry.shareMode === "full";
              if (!isOwnEntry && !canOpenSharedDetail) return;

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
                          title="Private"
                          description="Only visible in my private calendar. It will not appear to family."
                          onClick={() => setShareMode("private")}
                        />
                        <ShareModeButton
                          mode="soft"
                          current={shareMode}
                          title="Soft Share"
                          description="Family sees only a gentle general status in the shared jar."
                          onClick={() => setShareMode("soft")}
                        />
                        <ShareModeButton
                          mode="full"
                          current={shareMode}
                          title="Full Share"
                          description="Family can see the mood bead and note, but not my calendar."
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
                        disabled={!selectedMood}
                        className={`px-4 py-2 rounded-full text-[14px] font-medium ${
                          selectedMood
                            ? "bg-[#341056] text-white"
                            : "bg-[#DDD7E7] text-[#8E879D]"
                        }`}
                      >
                        Save
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
                        From {profileMap[candyMessageDialog.candy.owner].name}
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
                      {candyMessageDialog.candy.note.trim() || "No note was left for this mood bead."}
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
