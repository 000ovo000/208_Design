import { ChevronLeft, ChevronRight } from "lucide-react";

export type MoodType =
  | "calm"
  | "tired"
  | "happy"
  | "anxious"
  | "homesick"
  | "needQuiet"
  | null;

export interface CalendarDayItem {
  day: number | null;
  mood: MoodType;
}

interface MoodCalendarProps {
  year: number;
  month: number; // 1-12
  moodMap: Record<number, Exclude<MoodType, null>>;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  onDayClick?: (day: number) => void;
}

const moodColorMap: Record<Exclude<MoodType, null>, string> = {
  calm: "#9FD8C2",
  tired: "#B7B4D8",
  happy: "#FFDC6E",
  anxious: "#F7A7A6",
  homesick: "#8EC4FB",
  needQuiet: "#C9C3B8",
};

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

function buildCalendarDays(
  year: number,
  month: number,
  moodMap: Record<number, Exclude<MoodType, null>>
): CalendarDayItem[] {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const jsWeekday = firstDay.getDay();
  const mondayBasedWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1;

  const result: CalendarDayItem[] = [];

  for (let i = 0; i < mondayBasedWeekday; i++) {
    result.push({ day: null, mood: null });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    result.push({
      day,
      mood: moodMap[day] ?? null,
    });
  }

  while (result.length % 7 !== 0) {
    result.push({ day: null, mood: null });
  }

  return result;
}

function CalendarMoodFace({ mood }: { mood: Exclude<MoodType, null> }) {
  const color = moodColorMap[mood];

  return (
    <div
      className="relative w-[30px] h-[30px] rounded-full border-[2px] border-[#111111]"
      style={{ backgroundColor: color }}
    >
      <span className="absolute left-[7px] top-[8px] w-[3.5px] h-[3.5px] rounded-full bg-[#111111]" />
      <span className="absolute right-[7px] top-[8px] w-[3.5px] h-[3.5px] rounded-full bg-[#111111]" />

      {(mood === "happy" || mood === "calm") && (
        <span className="absolute left-1/2 top-[16px] w-[11px] h-[6px] -translate-x-1/2 border-b-[2px] border-[#111111] rounded-b-full" />
      )}

      {mood === "tired" && (
        <>
          <span className="absolute left-[6px] top-[9px] w-[6px] h-[2px] bg-[#111111] rounded-full" />
          <span className="absolute right-[6px] top-[9px] w-[6px] h-[2px] bg-[#111111] rounded-full" />
          <span className="absolute left-1/2 top-[18px] w-[10px] h-[2px] -translate-x-1/2 bg-[#111111] rounded-full" />
        </>
      )}

      {(mood === "anxious" || mood === "homesick") && (
        <span className="absolute left-1/2 top-[18px] w-[11px] h-[6px] -translate-x-1/2 border-t-[2px] border-[#111111] rounded-t-full" />
      )}

      {mood === "needQuiet" && (
        <span className="absolute left-1/2 top-[18px] w-[10px] h-[2px] -translate-x-1/2 bg-[#111111] rounded-full" />
      )}
    </div>
  );
}

export function MoodCalendar({
  year,
  month,
  moodMap,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  onDayClick,
}: MoodCalendarProps) {
  const days = buildCalendarDays(year, month, moodMap);
  const title = `${monthNames[month - 1]} ${year}`;

  return (
    <section className="w-full px-4 pt-4 pb-24 shrink-0">
      <div className="rounded-[20px] bg-white/55 backdrop-blur-sm border border-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.04)] px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            aria-label="Previous month"
            onClick={onPrev}
            disabled={!canPrev}
            className={`w-8 h-8 flex items-center justify-center ${
              canPrev ? "text-[#7ED6DF]" : "text-[#D8D8D8]"
            }`}
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>

          <h3 className="text-[22px] font-semibold text-[#223A70]">{title}</h3>

          <button
            type="button"
            aria-label="Next month"
            onClick={onNext}
            disabled={!canNext}
            className={`w-8 h-8 flex items-center justify-center ${
              canNext ? "text-[#7ED6DF]" : "text-[#D8D8D8]"
            }`}
          >
            <ChevronRight size={22} strokeWidth={2.4} />
          </button>
        </div>

        <div className="h-px bg-[#E5E5E5] mb-3" />

        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#1F1F1F] mb-2">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-3 justify-items-center">
          {days.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center min-h-[48px] w-full"
            >
              {item.day !== null ? (
                <button
                  type="button"
                  onClick={() => onDayClick?.(item.day!)}
                  className="flex flex-col items-center w-full"
                >
                  <span className="text-[15px] leading-none text-[#1F1F1F] mb-1">
                    {item.day}
                  </span>

                  {item.mood ? (
                    <CalendarMoodFace mood={item.mood} />
                  ) : (
                    <span className="w-[28px] h-[28px] rounded-full bg-[#E8E8E8]" />
                  )}
                </button>
              ) : (
                <div className="pt-[22px]">
                  <span className="w-[28px] h-[28px] rounded-full bg-[#E8E8E8] inline-block" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
