import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ImagePlus,
  Send,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { PixelPup } from "../components/pixel-pup";
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
}

type UploadDraft = {
  imageUrl: string;
  dogMessage: string;
};

type TimeRange = "day" | "week" | "month" | "year";

const rangeOptions: { key: TimeRange; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "Last Week" },
  { key: "month", label: "Last Month" },
  { key: "year", label: "Last Year" },
];

const reactionOptions: { value: Exclude<AlbumReaction, null>; emoji: string }[] = [
  { value: "smile", emoji: "🙂" },
  { value: "love", emoji: "😍" },
  { value: "clap", emoji: "👏" },
  { value: "wow", emoji: "😮" },
  { value: "sad", emoji: "🥲" },
];

function variantByMember(memberId: FamilyMemberId) {
  if (memberId === "mom") return "pink";
  if (memberId === "dad") return "blue";
  return "white";
}

function groupEntries(entries: AlbumEntry[]) {
  return entries.reduce<Record<FamilyMemberId, AlbumEntry[]>>(
    (accumulator, entry) => {
      accumulator[entry.memberId].push(entry);
      return accumulator;
    },
    {
      me: [],
      mom: [],
      dad: [],
    }
  );
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

function buildSummary(member: FamilyMember, range: TimeRange, entries: AlbumEntry[]) {
  const newest = entries[0];
  const highlight = newest?.dogMessage.trim();

  if (!entries.length) {
    if (range === "day") return `${member.dogName}总结：今天还没有新的更新。`;
    if (range === "week") return `${member.dogName}总结：这周还没有新的更新。`;
    if (range === "month") return `${member.dogName}总结：这个月还没有新的更新。`;
    return `${member.dogName}总结：这一年还没有新的更新。`;
  }

  if (range === "day") {
    return `${member.dogName}总结：今天更新了 ${entries.length} 张照片${highlight ? `，想说“${highlight}”` : "。"
      }`;
  }

  if (range === "week") {
    return `${member.dogName}总结：这周一共更新了 ${entries.length} 张照片${highlight ? `，本周关键词是“${highlight}”` : "。"
      }`;
  }

  if (range === "month") {
    return `${member.dogName}总结：这个月记录了 ${entries.length} 张照片${highlight ? `，最近的一条是“${highlight}”` : "。"
      }`;
  }

  return `${member.dogName}总结：这一年已经留下了 ${entries.length} 张照片${highlight ? `，印象最深的是“${highlight}”` : "。"
    }`;
}

function selectedReactionEmoji(reaction: AlbumReaction) {
  return reactionOptions.find((option) => option.value === reaction)?.emoji ?? null;
}

export function ConnectPage({
  familyMembers,
  albumEntries,
  onCreateEntry,
  onUpdateReaction,
}: ConnectPageProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<FamilyMemberId | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("week");
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [openReactionEntryId, setOpenReactionEntryId] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const albumsByMember = useMemo(() => groupEntries(albumEntries), [albumEntries]);
  const selectedMember = familyMembers.find((member) => member.id === selectedMemberId) ?? null;
  const selectedEntries = useMemo(() => {
    if (!selectedMemberId) return [];

    return albumsByMember[selectedMemberId].filter((entry) =>
      matchesRange(entry.uploadedAt, selectedRange)
    );
  }, [albumsByMember, selectedMemberId, selectedRange]);

  const handleChooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image uploads are supported here.");
      event.target.value = "";
      return;
    }

    setDraft({
      imageUrl: URL.createObjectURL(file),
      dogMessage: "",
    });
    setShowUploadSheet(false);
    event.target.value = "";
  };

  const handleSubmitDraft = () => {
    if (!draft?.imageUrl || selectedMemberId !== "me") return;

    onCreateEntry({
      id: `me-${Date.now()}`,
      memberId: "me",
      imageUrl: draft.imageUrl,
      uploadedAt: formatNow(),
      dogMessage: draft.dogMessage.trim(),
      reaction: null,
    });

    setDraft(null);
  };

  if (selectedMember) {
    const rangeLabel =
      rangeOptions.find((item) => item.key === selectedRange)?.label ?? "Last Week";

    return (
      <div className="relative flex h-full flex-col bg-[#f5ede5]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChooseFile}
        />
        <input
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
                onClick={() => setShowRangeMenu((current) => !current)}
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

            {selectedMember.id === "me" ? (
              <button
                type="button"
                onClick={() => setShowUploadSheet(true)}
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
                  onClick={() => setSummaryExpanded((current) => !current)}
                  className={`flex items-center gap-3 rounded-[20px] bg-white shadow-[0_16px_30px_rgba(93,67,46,0.12)] transition-all ${
                    summaryExpanded ? "max-w-[74%] px-4 py-4" : "px-3 py-3"
                  }`}
                >
                  <div className="rounded-[10px] bg-[#f8eee7] p-2">
                    <PixelPup
                      size={2.8}
                      headOnly
                      variant={variantByMember(selectedMember.id)}
                    />
                  </div>
                  {summaryExpanded && (
                    <div className="min-w-0 text-left">
                      <div className="mb-1 flex items-center gap-1 text-[#6c5341]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                          Summary
                        </span>
                      </div>
                      <p className="text-[16px] leading-6 text-[#2f2720]">
                        {buildSummary(selectedMember, selectedRange, selectedEntries)}
                      </p>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className={`space-y-6 ${summaryExpanded ? "pt-20" : "pt-8"}`}>
            {selectedEntries.map((entry) => (
              <article key={entry.id} className="relative">
                <div className="relative overflow-hidden rounded-[28px]">
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
                                onUpdateReaction(entry.id, option.value);
                                setOpenReactionEntryId(null);
                              }}
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-xl ${
                                entry.reaction === option.value ? "bg-[#f3efe9]" : ""
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
                        {selectedReactionEmoji(entry.reaction) ? (
                          <span className="text-[30px] leading-none">
                            {selectedReactionEmoji(entry.reaction)}
                          </span>
                        ) : (
                          <Smile className="h-7 w-7" strokeWidth={2.2} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {entry.dogMessage.trim() && (
                  <div className="mt-2 px-2 text-[14px] text-[#6d5849]">
                    {entry.dogMessage}
                  </div>
                )}
              </article>
            ))}

            {selectedEntries.length === 0 && (
              <div className="rounded-[24px] bg-white px-5 py-6 text-center text-sm leading-6 text-[#8d7060] shadow-[0_12px_28px_rgba(79,57,38,0.08)]">
                这个时间范围里还没有内容。
              </div>
            )}
          </div>
        </div>

        {showUploadSheet && selectedMember.id === "me" && (
          <div className="absolute inset-0 z-40 flex items-end bg-black/20 px-5 pb-6">
            <div className="w-full rounded-[28px] bg-white p-4 shadow-2xl">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-[22px] bg-[#f8efe4] px-4 py-5 text-[#5d4637]"
                >
                  <Camera className="mb-2 h-6 w-6" />
                  <span className="text-sm font-semibold">相机</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-[22px] bg-[#eef4fb] px-4 py-5 text-[#465c78]"
                >
                  <ImagePlus className="mb-2 h-6 w-6" />
                  <span className="text-sm font-semibold">相册</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadSheet(false)}
                className="mt-3 w-full rounded-[18px] bg-[#f6f1ec] px-4 py-3 text-sm text-[#745d4c]"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {draft && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-6">
            <div className="w-full max-w-md rounded-[30px] bg-[#fffaf5] p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#3f2f24]">确认上传</h2>
                  <p className="mt-1 text-sm text-[#8b705d]">
                    自己上传的图片仍然会保留小狗传话功能。
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

              <img
                src={draft.imageUrl}
                alt="Upload preview"
                className="mb-4 aspect-[4/5] w-full rounded-[24px] object-cover"
              />

              <div className="rounded-[24px] border border-[#efdfd1] bg-white px-4 py-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-2xl bg-[#f7efe7] p-2">
                    <PixelPup size={2.8} headOnly />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#4f3c2e]">小狗传话</p>
                    <p className="text-xs text-[#9a7e69]">
                      例如：今天过得很好，想把这句话同步到首页。
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
                  placeholder="输入想让首页小狗说的话"
                  rows={3}
                  className="w-full resize-none rounded-[20px] border border-[#ead8ca] bg-[#fffaf6] px-4 py-3 text-sm text-[#4f3c2e] outline-none placeholder:text-[#b59b89]"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitDraft}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#6d5645] px-4 py-4 text-sm font-semibold text-white"
              >
                <Send className="h-4 w-4" />
                提交图片和传话
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
            const latestEntry = albumsByMember[member.id][0] ?? null;

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
                      <PixelPup size={2.1} headOnly variant={variantByMember(member.id)} />
                      <p className="truncate text-[16px] text-[#1f1f1f]">
                        {latestEntry?.dogMessage.trim() || "To summarize?"}
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
                      还没有上传图片
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
