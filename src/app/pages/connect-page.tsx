import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, ImagePlus, Send, X } from "lucide-react";
import { PixelPup } from "../components/pixel-pup";
import { AlbumEntry, FamilyMember, FamilyMemberId } from "../types";

interface ConnectPageProps {
  familyMembers: FamilyMember[];
  albumEntries: AlbumEntry[];
  onCreateEntry: (entry: AlbumEntry) => void;
}

type UploadDraft = {
  imageUrl: string;
  dogMessage: string;
};

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

export function ConnectPage({
  familyMembers,
  albumEntries,
  onCreateEntry,
}: ConnectPageProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<FamilyMemberId | null>(null);
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const albumsByMember = useMemo(() => groupEntries(albumEntries), [albumEntries]);
  const selectedMember = familyMembers.find((member) => member.id === selectedMemberId) ?? null;
  const selectedEntries = selectedMemberId ? albumsByMember[selectedMemberId] : [];

  const handleChooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image uploads are supported here.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setDraft({
      imageUrl: objectUrl,
      dogMessage: "",
    });
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
    });

    setDraft(null);
  };

  if (selectedMember) {
    return (
      <div className="flex h-full flex-col bg-[#f7efe7]">
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

        <div className="border-b border-[#ead8ca] bg-[#f7efe7]/95 px-5 pt-4 pb-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId(null);
                setDraft(null);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6d5645] shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-[#3f2f24]">
                {selectedMember.name}的相册
              </h1>
              <p className="mt-1 text-sm text-[#8b705d]">仅展示图片和上传时间</p>
            </div>
          </div>
        </div>

        <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pt-5 pb-28">
          <div className="grid grid-cols-2 gap-4">
            {selectedEntries.map((entry) => (
              <article
                key={entry.id}
                className="overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_12px_28px_rgba(79,57,38,0.08)]"
              >
                <img
                  src={entry.imageUrl}
                  alt={`${selectedMember.name} uploaded`}
                  className="aspect-[4/5] w-full object-cover"
                />
                <div className="px-3 py-3">
                  <p className="text-xs leading-5 text-[#826856]">{entry.uploadedAt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {selectedMember.id === "me" && (
          <div className="absolute right-0 bottom-[84px] left-0 px-5">
            <div className="rounded-[28px] border border-white/80 bg-white/88 p-4 shadow-[0_16px_30px_rgba(85,64,46,0.12)] backdrop-blur">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-[22px] bg-[#f8efe4] px-4 py-4 text-[#5d4637]"
                >
                  <Camera className="mb-2 h-6 w-6" />
                  <span className="text-sm font-semibold">拍照</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-[22px] bg-[#eef4fb] px-4 py-4 text-[#465c78]"
                >
                  <ImagePlus className="mb-2 h-6 w-6" />
                  <span className="text-sm font-semibold">相册</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {draft && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-6">
            <div className="w-full max-w-md rounded-[30px] bg-[#fffaf5] p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#3f2f24]">确认提交</h2>
                  <p className="mt-1 text-sm text-[#8b705d]">
                    图片提交后，首页的小狗会说出这句话
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
                      例如：我上传了午饭，和小狗说“好贵”
                    </p>
                  </div>
                </div>

                <textarea
                  value={draft.dogMessage}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, dogMessage: event.target.value }
                        : current
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
    <div className="flex h-full flex-col bg-[#f7efe7]">
      <div className="px-5 pt-5 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9f8067]">
          Album
        </p>
        <h1 className="mt-2 text-[30px] font-semibold text-[#3d2d22]">
          选择家庭成员
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#8b705d]">
          我、爸爸、妈妈各自有独立相册。卡片上会显示最近上传的图片，点击即可进入对应相册。
        </p>
      </div>

      <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-24">
        <div className="space-y-4">
          {familyMembers.map((member) => {
            const latestEntry = albumsByMember[member.id][0] ?? null;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className="flex w-full items-center gap-4 rounded-[30px] border border-white/75 bg-white/84 p-4 text-left shadow-[0_14px_28px_rgba(84,62,44,0.08)]"
              >
                <div className="rounded-[24px] bg-[#f7efe7] p-3">
                  <PixelPup size={4} headOnly variant={variantByMember(member.id)} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[#463326]">{member.name}</p>
                      <p className="mt-1 text-sm text-[#8b705d]">{member.role}</p>
                    </div>
                    <span className="rounded-full bg-[#f4e6d8] px-3 py-1 text-xs font-semibold text-[#8e6f54]">
                      {albumsByMember[member.id].length} 张
                    </span>
                  </div>

                  {latestEntry ? (
                    <div className="mt-3 flex items-center gap-3 overflow-hidden rounded-[22px] bg-[#fbf6f1] p-2">
                      <img
                        src={latestEntry.imageUrl}
                        alt={`${member.name} latest`}
                        className="h-16 w-16 rounded-[16px] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#5d4637]">
                          最近上传
                        </p>
                        <p className="mt-1 text-xs text-[#9a7e69]">
                          {latestEntry.uploadedAt}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[20px] bg-[#fbf6f1] px-4 py-4 text-sm text-[#a18a79]">
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
