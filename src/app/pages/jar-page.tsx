import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronRight, ChevronUp, Heart, Plus, X } from "lucide-react";
import { MoodCalendar } from "../components/mood-calendar";
import { usePet } from "../context/pet-context";
import { defaultPetId, getPetById, petItems, type PetId, type PetItem } from "../data/pets";
import { getFamilySelectedPetId } from "../data/family-data";
import type { FamilyMember, FamilyMemberId } from "../types";
type MoodKey = "calm" | "tired" | "happy" | "anxious" | "homesick" | "needQuiet";
type ShareMode = "private" | "soft" | "full";
type FamilyReaction = "hug" | "tea" | "pet" | null;
type ParentInteraction = "love" | "hug" | "feed";
type UserRole = "daughter" | "mum" | "dad" | "grandma" | "grandpa";

type ParentInteractionRecord = {
  id: string;
  fromName: string;
  interaction: ParentInteraction;
  message: string;
  createdAt: number;
};

type DbMoodEntry = {
  id: number;
  user_name: string;
  mood: string;
  comment: string | null;
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
const LATEST_PARENT_INTERACTION_KEY = "kinlight:latestParentInteraction";
const PARENT_INTERACTIONS_KEY = "kinlight:parentInteractions";
const SELECTED_PET_STORAGE_KEY = "selectedPetId";

const profileOrder: UserRole[] = ["daughter", "mum", "dad", "grandma", "grandpa"];

const profileMap: Record<
  UserRole,
  { name: string; roleLabel: string; avatar: string; bg: string }
> = {
  daughter: {
    name: "Grace",
    roleLabel: "Student account",
    avatar: "\u{1F469}\u200D\u{1F393}",
    bg: "#FFE4EF",
  },
  mum: {
    name: "Mum",
    roleLabel: "Family account",
    avatar: "\u{1F469}",
    bg: "#E9E2FF",
  },
  dad: {
    name: "Dad",
    roleLabel: "Family account",
    avatar: "\u{1F468}",
    bg: "#DFF1FF",
  },
  grandma: {
    name: "Grandma",
    roleLabel: "Care account",
    avatar: "\u{1F475}",
    bg: "#FFF0CC",
  },
  grandpa: {
    name: "Grandpa",
    roleLabel: "Care account",
    avatar: "\u{1F474}",
    bg: "#DDEFE8",
  },
};

const fallbackMemberIdByRole: Record<UserRole, FamilyMemberId> = {
  daughter: "me",
  mum: "mom",
  dad: "dad",
  grandma: "grandma",
  grandpa: "grandpa",
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

function getSoftShareText(name: string, mood: MoodKey) {
  switch (mood) {
    case "calm":
      return `${name} seems calm today.`;
    case "tired":
      return `${name} may feel a little tired today.`;
    case "happy":
      return `${name} seems to have a brighter mood today.`;
    case "anxious":
      return `${name} may need a gentler moment today.`;
    case "homesick":
      return `${name} may miss home a little today.`;
    case "needQuiet":
      return `${name} may need some quiet space today.`;
  }
}

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

function getPetState(moodMap: Record<number, MoodKey>, currentUser: UserRole) {
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

function getTodaySharedEntryForOwner(entries: CandyEntry[], owner: UserRole) {
  const todayMonthKey = getMonthKey(DEMO_YEAR, DEMO_TODAY_MONTH);
  return (
    entries.find(
      (entry) =>
        entry.owner === owner &&
        entry.monthKey === todayMonthKey &&
        entry.day === DEMO_TODAY_DAY &&
        entry.shareMode !== "private"
    ) ?? null
  );
}

function isParentInteraction(value: string | null): value is ParentInteraction {
  return value === "love" || value === "hug" || value === "feed";
}

function isPetId(value: string | null): value is PetId {
  return Boolean(value && petItems.some((pet) => pet.id === value));
}

function getUserScopedPetKey(userId: FamilyMemberId) {
  return `kinlight:${SELECTED_PET_STORAGE_KEY}:${String(userId)}`;
}

function readSelectedPetIdForMember(memberId: FamilyMemberId): PetId {
  if (typeof window !== "undefined") {
    const savedId = window.localStorage.getItem(getUserScopedPetKey(memberId));
    if (isPetId(savedId)) return savedId;
  }

  return getFamilySelectedPetId(memberId) ?? defaultPetId;
}

function getUserRoleFromName(name?: string | null): UserRole | null {
  if (!name) return null;
  const normalizedName = name.trim().toLowerCase();

  if (normalizedName === "mom" || normalizedName === "mum") return "mum";
  if (normalizedName === "dad") return "dad";
  if (normalizedName === "grandma") return "grandma";
  if (normalizedName === "grandpa") return "grandpa";
  if (normalizedName === "grace" || normalizedName === "daughter") return "daughter";

  return null;
}

function getFamilyMemberForRole(
  role: UserRole,
  familyMembers: FamilyMember[],
  realCurrentUser: CurrentUser | null
) {
  const currentUserRole = getUserRoleFromName(realCurrentUser?.name);
  if (currentUserRole === role) {
    const currentMember = familyMembers.find(
      (member) =>
        String(member.id) === String(realCurrentUser?.id) ||
        String(member.user_id) === String(realCurrentUser?.id) ||
        Boolean(member.email && realCurrentUser?.email && member.email === realCurrentUser.email)
    );
    if (currentMember) return currentMember;
  }

  return familyMembers.find((member) => {
    const memberRole = getUserRoleFromName(member.name);
    if (memberRole === role) return true;
    return String(member.id).toLowerCase() === String(fallbackMemberIdByRole[role]).toLowerCase();
  });
}

function getPetForRole({
  role,
  familyMembers,
  realCurrentUser,
  currentPet,
}: {
  role: UserRole;
  familyMembers: FamilyMember[];
  realCurrentUser: CurrentUser | null;
  currentPet: PetItem;
}) {
  const currentUserRole = getUserRoleFromName(realCurrentUser?.name);
  if (currentUserRole === role) return currentPet;

  const member = getFamilyMemberForRole(role, familyMembers, realCurrentUser);
  const memberId = member?.id ?? fallbackMemberIdByRole[role];

  return getPetById(readSelectedPetIdForMember(memberId));
}

function getParentInteractionFromReaction(
  reaction: Exclude<FamilyReaction, null>
): ParentInteraction {
  if (reaction === "tea") return "feed";
  if (reaction === "pet") return "love";
  return "hug";
}

function getParentFeedbackText(reaction: FamilyReaction, targetName: string) {
  switch (reaction) {
    case "pet":
      return `${targetName}'s pet felt your love \u{1F497}`;
    case "hug":
      return `${targetName}'s pet feels comforted by your hug \u{1F917}`;
    case "tea":
      return "Yummy! Thank you! \u{1F43E}";
    default:
      return "";
  }
}

function getParentInteractionMessage(fromName: string, interaction: ParentInteraction) {
  if (interaction === "love") return `${fromName} sent you some love today \u{1F497}`;
  if (interaction === "hug") return `${fromName} sent you a warm hug today \u{1F917}`;
  return `${fromName} gave me a little treat today \u{1F43E}`;
}

function isParentInteractionRecord(value: unknown): value is ParentInteractionRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ParentInteractionRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.fromName === "string" &&
    isParentInteraction(record.interaction ?? null) &&
    typeof record.message === "string" &&
    typeof record.createdAt === "number"
  );
}

function readParentInteractionsFromStorage(): ParentInteractionRecord[] {
  if (typeof window === "undefined") return [];

  const savedRecords = window.localStorage.getItem(PARENT_INTERACTIONS_KEY);
  if (savedRecords) {
    try {
      const parsed = JSON.parse(savedRecords);
      if (Array.isArray(parsed)) {
        const records = parsed.filter(isParentInteractionRecord);
        if (records.length > 0) return records;
      }
    } catch {
      // Fall through to the legacy single-interaction key.
    }
  }

  const legacyInteraction = window.localStorage.getItem(LATEST_PARENT_INTERACTION_KEY);
  if (!isParentInteraction(legacyInteraction)) return [];

  return [
    {
      id: `legacy-${legacyInteraction}`,
      fromName: "Mom",
      interaction: legacyInteraction,
      message: getParentInteractionMessage("Mom", legacyInteraction),
      createdAt: 0,
    },
  ];
}

function isMoodKey(value: string): value is MoodKey {
  return value in moodColorMap;
}

function getOwnerFromDbUserName(userName: string): UserRole {
  const normalizedName = userName.trim().toLowerCase();

  if (normalizedName === "mom" || normalizedName === "mum") return "mum";
  if (normalizedName === "dad") return "dad";
  if (normalizedName === "grandma") return "grandma";
  if (normalizedName === "grandpa") return "grandpa";

  return "daughter";
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
    .filter((entry) => isMoodKey(entry.mood))
    .map((entry, index) => {
      const { month, day } = getMonthDayFromDbDate(entry.entry_date);
      const slot = extraCandySlots[index % extraCandySlots.length];
      const mood = entry.mood as MoodKey;
      const owner = getOwnerFromDbUserName(entry.user_name);

      return createCandyEntry({
        id: `db-${entry.id}`,
        owner,
        month,
        day,
        mood,
        note: entry.comment ?? "",
        shareMode: "private",
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
      className={`w-full flex items-center gap-2 rounded-[16px] px-2.5 py-1.5 text-left transition-all ${
        selected ? "bg-[#F5EFFB] ring-1 ring-[#D8C8EA]" : "bg-[#FCFBFE]"
      }`}
    >
      <MoodFace mood={mood} size={27} />
      <span className="text-[13px] font-medium leading-tight text-[#3B3551]">
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
      className={`w-full text-left rounded-[16px] border px-3 py-2 transition-all ${
        selected
          ? "bg-[#F4ECFF] border-[#BFA7E8] text-[#341056]"
          : "bg-white border-[#EEE7F5] text-[#5C5670]"
      }`}
    >
      <p className="text-[13px] font-medium">{title}</p>
      <p className="text-[11px] mt-0.5 leading-[1.25]">{description}</p>
    </button>
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
        className="relative w-[246px] h-[44px] rounded-[28px_28px_18px_18px] overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #CC197C 0%, #B20D67 52%, #8A0D4A 100%)",
          boxShadow:
            "inset 0 6px 0 rgba(255,255,255,0.12), inset 0 -5px 0 rgba(83,0,39,0.16)",
        }}
      >
        <span className="absolute left-[8px] right-[8px] top-[9px] h-[6px] rounded-full bg-[rgba(124,4,66,0.34)]" />
        <span className="absolute left-[8px] right-[8px] bottom-[7px] h-[6px] rounded-full bg-[rgba(124,4,66,0.34)]" />
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

function CareTargetSwitcher({
  careTargetUsers,
  selectedCareTarget,
  onSelectCareTarget,
}: {
  careTargetUsers: UserRole[];
  selectedCareTarget: UserRole;
  onSelectCareTarget: (value: UserRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedProfile = profileMap[selectedCareTarget];

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full grid grid-cols-[46px_1fr_28px] items-center gap-3 rounded-full bg-white/72 backdrop-blur-xl border border-white/80 px-3 py-2.5 text-left shadow-[0_10px_24px_rgba(52,16,86,0.08)] active:scale-[0.99] transition-all"
      >
        <span
          className="w-[42px] h-[42px] rounded-full border border-white/90 flex items-center justify-center text-[23px] shadow-[0_5px_12px_rgba(0,0,0,0.08)]"
          style={{ backgroundColor: selectedProfile.bg }}
        >
          {selectedProfile.avatar}
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-[#3B3551] truncate">
            {selectedProfile.name}
          </span>
          <span className="block mt-0.5 text-[10px] font-bold tracking-[0.08em] text-[#8B82A0]">
            CARE FOR SOMEONE
          </span>
        </span>
        <span className="flex justify-center text-[#5A2A86]">
          {open ? (
            <ChevronUp size={20} strokeWidth={2.3} />
          ) : (
            <ChevronDown size={20} strokeWidth={2.3} />
          )}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-[24px] bg-white/94 backdrop-blur-xl border border-white/80 shadow-[0_18px_42px_rgba(52,16,86,0.16)] px-3 py-3">
          <p className="px-2 pb-2 text-[10px] font-bold tracking-[0.08em] text-[#8B82A0]">
            CARE FOR SOMEONE
          </p>
          <div className="max-h-[260px] overflow-y-auto pr-1 space-y-2">
            {careTargetUsers.map((targetUser) => {
              const profile = profileMap[targetUser];
              const active = targetUser === selectedCareTarget;

              return (
                <button
                  key={targetUser}
                  type="button"
                  onClick={() => {
                    onSelectCareTarget(targetUser);
                    setOpen(false);
                  }}
                  className={`w-full grid grid-cols-[42px_1fr_18px] items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition-colors ${
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
                    <span className="block text-[14px] font-semibold text-[#3B3551] truncate">
                      {profile.name}
                    </span>
                    <span className="block text-[11px] text-[#7A7287] mt-0.5">
                      View shared mood
                    </span>
                  </span>
                  <span className="flex justify-end">
                    {active && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#BFA7E8]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SharedStatusCard({
  targetUser,
  targetEntry,
  careTargetUsers,
  onSelectCareTarget,
  familyReaction,
  familyReactionTarget,
  setFamilyReaction,
  setFamilyReactionTarget,
  currentUser,
  targetPet,
  onParentInteraction,
  insideModal = false,
}: {
  targetUser: UserRole;
  targetEntry: CandyEntry | null;
  careTargetUsers: UserRole[];
  onSelectCareTarget: (value: UserRole) => void;
  familyReaction: FamilyReaction;
  familyReactionTarget: UserRole | null;
  setFamilyReaction: (value: FamilyReaction) => void;
  setFamilyReactionTarget: (value: UserRole | null) => void;
  currentUser: UserRole;
  targetPet: PetItem;
  onParentInteraction: (interaction: ParentInteraction) => void;
  insideModal?: boolean;
}) {
  const targetProfile = profileMap[targetUser];
  const canSeeEntry = targetEntry && targetEntry.shareMode !== "private";
  const canReact = targetUser !== currentUser;
  const feedbackText = getParentFeedbackText(familyReaction, targetProfile.name);
  const shouldShowFeedback =
    familyReaction !== null && familyReactionTarget === targetUser;

  const showMoodJarFeedback = (reaction: Exclude<FamilyReaction, null>) => {
    setFamilyReactionTarget(targetUser);
    setFamilyReaction(reaction);
    if (targetUser === "daughter" && currentUser !== "daughter") {
      onParentInteraction(getParentInteractionFromReaction(reaction));
    }
  };

  const title = `${targetProfile.name}'s shared status`;
  const subtitle = `You cannot see ${targetProfile.name}'s private calendar. Only their shared status appears here.`;
  const badgeLabel = `Shared by ${targetProfile.name}`;

  return (
    <section className={`${insideModal ? "px-0 pt-0 pb-0" : "px-4 pt-2 pb-2"} shrink-0`}>
      <div className={`${insideModal ? "bg-transparent border-transparent px-0 py-0 shadow-none" : "bg-white/55 border-white/60 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"} rounded-[20px] backdrop-blur-sm border`}>
        <CareTargetSwitcher
          careTargetUsers={careTargetUsers}
          selectedCareTarget={targetUser}
          onSelectCareTarget={onSelectCareTarget}
        />

        <div className="mb-2">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-[14px] font-semibold text-[#5A2A86]">
              {title}
            </p>
            <span className="px-2.5 py-1 rounded-full bg-[#F4ECFF] text-[#341056] text-[11px] font-semibold whitespace-nowrap">
              {badgeLabel}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#7A7287] leading-[1.4]">
            {subtitle}
          </p>
        </div>

        {!canSeeEntry ? (
          <div className="mt-3 rounded-[16px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-3 text-[13px] leading-[1.45] text-[#5C5670]">
            {targetProfile.name} has not shared a mood today.
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-[16px] bg-[#FCFBFE] border border-[#EEE7F5] px-4 py-3">
              <div className="flex items-start gap-3">
                <MoodFace mood={targetEntry.mood} size={34} />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#3B3551] leading-[1.35]">
                    {targetEntry.shareMode === "soft"
                      ? getSoftShareText(targetProfile.name, targetEntry.mood)
                      : `${targetProfile.name} added a ${moodLabelMap[
                          targetEntry.mood
                        ].toLowerCase()} mood candy.`}
                  </p>
                  {targetEntry.shareMode === "full" && (
                    <p className="text-[13px] text-[#5C5670] leading-[1.45] mt-2">
                      {targetEntry.note.trim() || "No note was left for this mood candy."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {canReact && (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => showMoodJarFeedback("hug")}
                    className="rounded-full bg-[#F4ECFF] text-[#341056] px-2 py-2 text-[12px] font-medium"
                  >
                    Hug
                  </button>
                  <button
                    type="button"
                    onClick={() => showMoodJarFeedback("tea")}
                    className="rounded-full bg-[#F4ECFF] text-[#341056] px-2 py-2 text-[12px] font-medium"
                  >
                    Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => showMoodJarFeedback("pet")}
                    className="rounded-full bg-[#F4ECFF] text-[#341056] px-2 py-2 text-[12px] font-medium"
                  >
                    Love
                  </button>
                </div>

                {shouldShowFeedback && (
                  <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-[#FCFBFE] border border-[#EEE7F5] px-3 py-3 shadow-[0_6px_16px_rgba(52,16,86,0.06)]">
                    <img
                      src={targetPet.image}
                      alt={targetPet.name}
                      className="w-9 h-9 object-contain shrink-0"
                    />
                    <p className="text-[12px] leading-[1.45] text-[#5C5670]">
                      {feedbackText}
                    </p>
                  </div>
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
  currentUser,
  onSwitchUser,
  isBlurred,
  currentMonth,
  setCurrentMonth,
  ownMoodMap,
  petLabel,
  petBubbleMessages,
  lidOpen,
  droppingMood,
  droppingTarget,
  visibleJarEntries,
  careTargetUsers,
  selectedCareTarget,
  selectedCareTargetEntry,
  selectedCareTargetPet,
  onSelectCareTarget,
  familyReaction,
  familyReactionTarget,
  setFamilyReaction,
  setFamilyReactionTarget,
  onParentInteraction,
  onCalendarDayClick,
  onCandyClick,
  onOpenCarePopup,
  onOpenCalendarPopup,
  isCarePopupOpen,
  isCalendarPopupOpen,
  currentPet,
}: {
  onOpenTodayPlus: () => void;
  currentUser: UserRole;
  onSwitchUser: (value: UserRole) => void;
  isBlurred: boolean;
  currentMonth: number;
  setCurrentMonth: (value: number) => void;
  ownMoodMap: Record<number, MoodKey>;
  petLabel: string;
  petBubbleMessages: string[];
  lidOpen: boolean;
  droppingMood: MoodKey | null;
  droppingTarget: { x: string; y: string } | null;
  visibleJarEntries: CandyEntry[];
  careTargetUsers: UserRole[];
  selectedCareTarget: UserRole | null;
  selectedCareTargetEntry: CandyEntry | null;
  selectedCareTargetPet: PetItem | null;
  onSelectCareTarget: (value: UserRole) => void;
  familyReaction: FamilyReaction;
  familyReactionTarget: UserRole | null;
  setFamilyReaction: (value: FamilyReaction) => void;
  setFamilyReactionTarget: (value: UserRole | null) => void;
  onParentInteraction: (interaction: ParentInteraction) => void;
  onCalendarDayClick: (day: number) => void;
  onCandyClick: (entry: CandyEntry) => void;
  onOpenCarePopup: () => void;
  onOpenCalendarPopup: () => void;
  isCarePopupOpen: boolean;
  isCalendarPopupOpen: boolean;
  currentPet: PetItem;
}) {
  const isDaughter = false;
  const isParent = true;
  const isGrandparent = false;
  const canRecordMood = true;
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const bubbleTouchStartXRef = useRef<number | null>(null);
  const currentBubble = petBubbleMessages[bubbleIndex] ?? petBubbleMessages[0] ?? "";
  const hasMultipleBubbles = petBubbleMessages.length > 1;

  useEffect(() => {
    setBubbleIndex((current) =>
      petBubbleMessages.length === 0
        ? 0
        : Math.min(current, petBubbleMessages.length - 1)
    );
  }, [petBubbleMessages.length]);

  const showNextBubble = () => {
    if (!hasMultipleBubbles) return;
    setBubbleIndex((current) => (current + 1) % petBubbleMessages.length);
  };

  return (
    <div
      className={`h-full overflow-hidden transition-all duration-200 ${
        isBlurred ? "blur-[6px] scale-[0.985]" : ""
      }`}
    >
      <section className="relative px-4 pt-1 shrink-0">
        <div className="relative flex items-start justify-start mb-0 min-h-[52px]">
          <AccountSwitcher
            currentUser={currentUser}
            onSwitchUser={onSwitchUser}
          />
        </div>

        <div>
        <div className="relative -mt-[34px] mb-0 min-h-[70px]">
          <div
            className="relative inline-flex max-w-[240px] min-h-[48px] items-center px-[12px] py-[9px] pr-[28px] rounded-[22px] bg-[#E3E3E3] text-[#161616] text-[14.5px] leading-[1.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] break-words transition-all duration-200"
            style={{ maxWidth: "min(240px, calc(100% - 112px))" }}
            onTouchStart={(event) => {
              bubbleTouchStartXRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = bubbleTouchStartXRef.current;
              bubbleTouchStartXRef.current = null;
              const endX = event.changedTouches[0]?.clientX ?? null;
              if (startX === null || endX === null) return;
              if (Math.abs(endX - startX) > 28) showNextBubble();
            }}
          >
            <span key={currentBubble} className="block animate-[jarBubbleFade_180ms_ease-out]">
              {currentBubble}
            </span>
            {hasMultipleBubbles && (
              <button
                type="button"
                aria-label="Show next pet message"
                onClick={showNextBubble}
                className="absolute right-[5px] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7A7287] active:scale-95"
              >
                <ChevronRight size={18} strokeWidth={2.2} />
              </button>
            )}
            <span
              className="absolute right-5 -bottom-[8px] w-[14px] h-[14px] bg-[#E3E3E3] rotate-[-12deg]"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            />
            <style>{`
              @keyframes jarBubbleFade {
                0% { opacity: 0; transform: translateX(5px); }
                100% { opacity: 1; transform: translateX(0); }
              }
            `}</style>
          </div>

          <div className="absolute right-[8px] top-[66px] z-[10] flex flex-col items-end gap-1.5 shrink-0">
            {canRecordMood && (
              <>
                <div className="flex w-[78px] max-w-[23vw] flex-col items-center">
                  <button
                    type="button"
                    aria-label="Care for someone"
                    aria-haspopup="dialog"
                    aria-expanded={isCarePopupOpen}
                    aria-controls="jar-care-popup"
                    onClick={onOpenCarePopup}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8C6F2] bg-[#F4ECFF] text-[#341056] shadow-[0_8px_18px_rgba(52,16,86,0.12)] transition-all hover:bg-[#FAF5FF] active:scale-[0.95]"
                  >
                    <Heart size={20} strokeWidth={2.3} />
                  </button>
                  <span className="mt-0.5 w-full text-center text-[10px] font-semibold leading-[1.08] text-[#4F3C2E]">
                    Care for someone
                  </span>
                </div>

                <div className="flex w-[78px] max-w-[23vw] flex-col items-center">
                  <button
                    type="button"
                    aria-label="See mood calendar"
                    aria-haspopup="dialog"
                    aria-expanded={isCalendarPopupOpen}
                    aria-controls="jar-calendar-popup"
                    onClick={onOpenCalendarPopup}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4D2C3] bg-[#F8EFE7] text-[#4F3C2E] shadow-[0_8px_18px_rgba(97,74,56,0.12)] transition-all hover:bg-[#FFF7F0] active:scale-[0.95]"
                  >
                    <CalendarDays size={20} strokeWidth={2.3} />
                  </button>
                  <span className="mt-0.5 w-full text-center text-[10px] font-semibold leading-[1.08] text-[#4F3C2E]">
                    See calendar
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="h-[112px] flex items-end justify-center -mt-1">
          <img
            src={currentPet.image}
            alt={currentPet.name}
            className="max-h-[112px] max-w-[205px] object-contain drop-shadow-[0_10px_14px_rgba(73,56,42,0.18)]"
          />
        </div>

        {petLabel !== "Private by default" && (
          <div className="flex justify-center mb-1">
            <span className="px-3 py-1 rounded-full bg-[#F3EAFE] text-[#5A2A86] text-[12px] font-semibold">
              {petLabel}
            </span>
          </div>
        )}
      <div className="mt-[20px]">
        {canRecordMood && (
          <section className="px-4 pt-1 pb-1 text-center shrink-0">
            <div className="relative flex min-h-9 items-center justify-center">
              <button
                type="button"
                aria-label="Add today's mood candy"
                onClick={onOpenTodayPlus}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-[#111111] flex items-center justify-center shrink-0 shadow-[0_5px_12px_rgba(0,0,0,0.12)]"
              >
                <Plus size={21} strokeWidth={2.2} />
              </button>

              <p className="mx-auto w-full max-w-[260px] text-[15px] font-medium text-[#1F1F1F] leading-[1.15]">
                {isDaughter ? "Drop a mood candy for today?" : "Add your own mood candy?"}
              </p>
            </div>
          </section>
        )}

        <div className="translate-y-[30px]">
          {!isGrandparent && (
            <section className="flex flex-col items-center justify-start pt-[15px] pb-1 shrink-0">
          <div className="relative mx-auto flex w-[178px] h-[214px] justify-center">
            <div
              className="relative w-[208px] h-[256px] shrink-0"
              style={{ transform: "scale(0.84)", transformOrigin: "top center" }}
            >
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
          </div>

            </section>
          )}

          {canRecordMood && (
            <section className="px-4 pt-[25px] pb-1 shrink-0">
          <div className="rounded-[16px] bg-white/35 backdrop-blur-sm border border-white/40 px-3 py-2">
            <p className="text-[12.5px] font-semibold text-[#5A2A86]">
              Mood sharing control
            </p>
            <p className="text-[10.5px] text-[#7A7287] mt-0.5 leading-[1.2]">
              Full Share by default. You can switch to Soft Share or Private before saving.
            </p>
          </div>
            </section>
          )}
        </div>
      </div>
      </div>
      </section>

    </div>
  );
}

export function JarPage({
  familyMembers = [],
}: {
  familyMembers?: FamilyMember[];
}) {
  const { currentPet } = usePet();
  const [note, setNote] = useState("");
  const [currentUser, setCurrentUser] = useState<UserRole>("daughter");
  const [realCurrentUser, setRealCurrentUser] = useState<CurrentUser | null>(null);
  const [currentMonth, setCurrentMonth] = useState(DEMO_TODAY_MONTH);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [shareMode, setShareMode] = useState<ShareMode>("full");
  const [allEntries, setAllEntries] = useState<CandyEntry[]>(sampleCandyEntries);
  const [selectedCareTarget, setSelectedCareTarget] = useState<UserRole | null>(null);
  const [familyReaction, setFamilyReaction] = useState<FamilyReaction>(null);
  const [familyReactionTarget, setFamilyReactionTarget] = useState<UserRole | null>(null);
  const [parentInteractions, setParentInteractions] = useState<
    ParentInteractionRecord[]
  >([]);
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
  const [activeJarPopup, setActiveJarPopup] = useState<"care" | "calendar" | null>(
    null
  );

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/me");
        if (!response.ok) throw new Error("Failed to fetch current user");
        const user = await response.json();
        setRealCurrentUser(user);
        if (typeof user?.name === "string") {
          setCurrentUser(getOwnerFromDbUserName(user.name));
        }
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
    setParentInteractions(readParentInteractionsFromStorage());
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

        const loadedEntries = convertDbMoodEntriesToCandyEntries(data as DbMoodEntry[]);

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

  useEffect(() => {
    setFamilyReaction(null);
    setFamilyReactionTarget(null);
  }, [currentUser]);

  const recordParentInteraction = (interaction: ParentInteraction) => {
    const fromName = currentUser === "mum" ? "Mom" : profileMap[currentUser].name;
    const nextInteraction: ParentInteractionRecord = {
      id: `${currentUser}-${interaction}-${Date.now()}-${Math.random()}`,
      fromName,
      interaction,
      message: getParentInteractionMessage(fromName, interaction),
      createdAt: Date.now(),
    };

    setParentInteractions((prev) => {
      const next = [...prev, nextInteraction].slice(-12);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PARENT_INTERACTIONS_KEY, JSON.stringify(next));
        window.localStorage.setItem(LATEST_PARENT_INTERACTION_KEY, interaction);
      }
      return next;
    });
  };

  const currentMonthKey = getMonthKey(DEMO_YEAR, currentMonth);
  const currentProfile = profileMap[currentUser];
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
  const petBubbleMessages = useMemo(() => {
    if (currentUser !== "daughter" || parentInteractions.length === 0) {
      return [petState.bubble];
    }
    return parentInteractions.map((interaction) => interaction.message);
  }, [currentUser, parentInteractions, petState.bubble]);

  const careTargetUsers = useMemo(
    () => profileOrder.filter((user) => user !== currentUser),
    [currentUser]
  );

  useEffect(() => {
    if (
      !selectedCareTarget ||
      selectedCareTarget === currentUser ||
      !careTargetUsers.includes(selectedCareTarget)
    ) {
      setSelectedCareTarget(careTargetUsers[0] ?? null);
    }
  }, [careTargetUsers, currentUser, selectedCareTarget]);

  const selectedCareTargetEntry = useMemo(
    () =>
      selectedCareTarget
        ? getTodaySharedEntryForOwner(allEntries, selectedCareTarget)
        : null,
    [allEntries, selectedCareTarget]
  );

  const currentRolePet = useMemo(
    () =>
      getPetForRole({
        role: currentUser,
        familyMembers,
        realCurrentUser,
        currentPet,
      }),
    [currentUser, familyMembers, realCurrentUser, currentPet]
  );

  const selectedCareTargetPet = useMemo(
    () =>
      selectedCareTarget
        ? getPetForRole({
            role: selectedCareTarget,
            familyMembers,
            realCurrentUser,
            currentPet,
          })
        : null,
    [selectedCareTarget, familyMembers, realCurrentUser, currentPet]
  );

  const handleSelectCareTarget = (targetUser: UserRole) => {
    if (targetUser === currentUser) return;
    setSelectedCareTarget(targetUser);
    setFamilyReaction(null);
    setFamilyReactionTarget(null);
  };

  const visibleJarEntries = useMemo(
    () =>
      allEntries.filter(
        (entry) => entry.owner === currentUser || entry.shareMode !== "private"
      ),
    [allEntries, currentUser]
  );

  const isAnyOverlayOpen =
    editor.open ||
    existingDayDialog.open ||
    candyMessageDialog.open ||
    activeJarPopup !== null;

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
    setShareMode("full");
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
    setShareMode("full");
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
    setFamilyReactionTarget(null);

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

    const familyId = realCurrentUser?.family_id ?? 1;

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
          user_id: Number(realCurrentUser.id),
          family_id: familyId,
          mood: selectedMood,
          comment: note,
          entry_date: entryDate,
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

  const handleModalCalendarDayClick = (day: number) => {
    setActiveJarPopup(null);
    handleCalendarDayClick(day);
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
      <>
        <MainJarView
          onOpenTodayPlus={handleTodayPlusClick}
          currentUser={currentUser}
          onSwitchUser={setCurrentUser}
          isBlurred={isAnyOverlayOpen}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          ownMoodMap={ownMoodMap}
          petLabel={petState.label}
          petBubbleMessages={petBubbleMessages}
          lidOpen={lidOpen}
          droppingMood={droppingMood}
          droppingTarget={droppingTarget}
          visibleJarEntries={visibleJarEntries}
          careTargetUsers={careTargetUsers}
          selectedCareTarget={selectedCareTarget}
          selectedCareTargetEntry={selectedCareTargetEntry}
          selectedCareTargetPet={selectedCareTargetPet}
          onSelectCareTarget={handleSelectCareTarget}
          familyReaction={familyReaction}
          familyReactionTarget={familyReactionTarget}
          setFamilyReaction={setFamilyReaction}
          setFamilyReactionTarget={setFamilyReactionTarget}
          onParentInteraction={recordParentInteraction}
          onCalendarDayClick={handleCalendarDayClick}
          onOpenCarePopup={() => setActiveJarPopup("care")}
          onOpenCalendarPopup={() => setActiveJarPopup("calendar")}
          isCarePopupOpen={activeJarPopup === "care"}
          isCalendarPopupOpen={activeJarPopup === "calendar"}
          onCandyClick={(entry) => {
            const isOwnEntry = entry.owner === currentUser;
            const canOpenSharedDetail =
              entry.shareMode === "soft" || entry.shareMode === "full";
            if (!isOwnEntry && !canOpenSharedDetail) return;

            setCandyMessageDialog({
              open: true,
              candy: entry,
            });
          }}
          currentPet={currentRolePet}
        />

        {activeJarPopup && (
          <div
            className={`absolute inset-0 z-[999] bg-black/10 px-5 pt-[72px] ${
              activeJarPopup === "calendar"
                ? "pb-[96px] overflow-hidden"
                : "pb-[132px] overflow-y-auto overscroll-contain"
            }`}
            onClick={() => setActiveJarPopup(null)}
          >
            <div
              id={
                activeJarPopup === "care"
                  ? "jar-care-popup"
                  : "jar-calendar-popup"
              }
              role="dialog"
              aria-modal="true"
              aria-label={
                activeJarPopup === "care"
                  ? "Care for someone"
                  : "Private mood calendar"
              }
              className="mx-auto w-full max-w-[340px] rounded-[28px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.16)] overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className={
                  activeJarPopup === "calendar"
                    ? "px-4 pt-4 pb-3"
                    : "px-5 pt-5 pb-5"
                }
              >
                <div
                  className={`flex items-start justify-between gap-3 ${
                    activeJarPopup === "calendar" ? "mb-2" : "mb-4"
                  }`}
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B82A0]">
                      Mood Jar
                    </p>
                    <h2 className="mt-1 text-[16px] leading-[1.35] text-[#3B3551] font-medium pr-2">
                      {activeJarPopup === "care"
                        ? "Care for Someone"
                        : "My private mood calendar"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setActiveJarPopup(null)}
                    className="w-8 h-8 rounded-full bg-[#F4F1F8] text-[#5A5470] flex items-center justify-center shrink-0"
                  >
                    <X size={16} strokeWidth={2.2} />
                  </button>
                </div>

                {activeJarPopup === "care" && selectedCareTarget && (
                  <SharedStatusCard
                    targetUser={selectedCareTarget}
                    targetEntry={selectedCareTargetEntry}
                    careTargetUsers={careTargetUsers}
                    onSelectCareTarget={handleSelectCareTarget}
                    familyReaction={familyReaction}
                    familyReactionTarget={familyReactionTarget}
                    setFamilyReaction={setFamilyReaction}
                    setFamilyReactionTarget={setFamilyReactionTarget}
                    currentUser={currentUser}
                    targetPet={selectedCareTargetPet ?? currentRolePet}
                    onParentInteraction={recordParentInteraction}
                    insideModal
                  />
                )}

                {activeJarPopup === "calendar" && (
                  <>
                    <div className="rounded-[18px] bg-[#FCFBFE] border border-[#EEE7F5] px-3 py-2">
                      <p className="text-[14px] font-semibold text-[#5A2A86]">
                        My private mood calendar
                      </p>
                      <p className="text-[11px] text-[#7A7287] mt-0.5 leading-[1.25]">
                        Only {currentProfile.name} can see this calendar. Other family members cannot access it.
                      </p>
                    </div>
                    <MoodCalendar
                      year={DEMO_YEAR}
                      month={currentMonth}
                      moodMap={ownMoodMap}
                      onPrev={() => setCurrentMonth(Math.max(1, currentMonth - 1))}
                      onNext={() => setCurrentMonth(Math.min(12, currentMonth + 1))}
                      canPrev={currentMonth > 1}
                      canNext={currentMonth < 12}
                      onDayClick={handleModalCalendarDayClick}
                      insideModal
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

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
                    This day already has one mood candy in your private calendar. You can keep it private or choose how much to share.
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
                      {existingDayEntry.note.trim() || "No note was left for this mood candy."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {editor.open && editor.day !== null && (
            <div className="absolute inset-0 z-[999] bg-black/10 overflow-hidden px-5 pt-[44px] pb-[96px]">
              <div className="mx-auto w-full max-w-[340px] rounded-[28px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.16)] overflow-hidden">
                <div className="px-5 pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
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

                    <p className="text-[12px] leading-[1.3] text-[#7A7287] mb-2">
                      {editorDayLabel}
                    </p>

                    <div className="grid grid-cols-2 gap-1.5 mb-3">
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
                      className="w-full h-[76px] resize-none rounded-[18px] border border-[#E7E1EE] bg-[#FCFBFE] px-4 py-2.5 text-[14px] text-[#2C2740] outline-none placeholder:text-[#A29AB5]"
                    />

                    <div className="mt-3">
                      <p className="text-[12px] text-[#7A7287] mb-1.5">
                        Who can see this mood?
                      </p>

                      <div className="space-y-1.5">
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
                          description="Family can see the mood candy and note, but not my calendar."
                          onClick={() => setShareMode("full")}
                        />
                      </div>
                    </div>
                  <div className="mt-3 pt-3 border-t border-[#EEE7F5]">
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

                  {(candyMessageDialog.candy.owner === currentUser ||
                    candyMessageDialog.candy.shareMode === "full") ? (
                    <>
                      <p className="text-[13px] text-[#7A7287] mb-2">Note</p>
                      <div className="min-h-[88px] rounded-[16px] bg-white border border-[#EAE3F0] px-4 py-3 text-[15px] leading-[1.5] text-[#2C2740]">
                        {candyMessageDialog.candy.note.trim() || "No note was left for this mood candy."}
                      </div>
                    </>
                  ) : (
                    <p className="rounded-[16px] bg-white border border-[#EAE3F0] px-4 py-3 text-[13px] leading-[1.45] text-[#7A7287]">
                      The mood type is shared, but the note stays private to the person who posted it.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
