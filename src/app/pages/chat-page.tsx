import { useState } from "react";
import { Bell } from "lucide-react";
import PixelDog from "../components/pixel-dog";
import { PixelPup } from "../components/pixel-pup";
import { AlbumEntry, FamilyMember, FamilyMemberId } from "../types";

interface ChatPageProps {
  familyMembers: FamilyMember[];
  latestEntries: Record<FamilyMemberId, AlbumEntry | null>;
  bubbleMessage: string;
}

type UpgradeIconKey = "clothes" | "food" | "bowl" | "toy";

function PixelUpgradeIcon({ type }: { type: UpgradeIconKey }) {
  const common = { width: 22, height: 22, viewBox: "0 0 12 12" };

  if (type === "clothes") {
    return (
      <svg {...common} shapeRendering="crispEdges" aria-hidden="true">
        <rect x="2" y="1" width="2" height="2" fill="#1b1b23" />
        <rect x="8" y="1" width="2" height="2" fill="#1b1b23" />
        <rect x="3" y="2" width="6" height="2" fill="#f4a4b7" />
        <rect x="1" y="4" width="10" height="2" fill="#f4a4b7" />
        <rect x="2" y="6" width="3" height="4" fill="#f4a4b7" />
        <rect x="7" y="6" width="3" height="4" fill="#f4a4b7" />
        <rect x="5" y="4" width="2" height="6" fill="#ffe8a8" />
      </svg>
    );
  }

  if (type === "food") {
    return (
      <svg {...common} shapeRendering="crispEdges" aria-hidden="true">
        <rect x="3" y="1" width="6" height="2" fill="#1b1b23" />
        <rect x="2" y="3" width="8" height="2" fill="#d99959" />
        <rect x="1" y="5" width="10" height="2" fill="#ffc86d" />
        <rect x="2" y="7" width="8" height="2" fill="#cb8448" />
        <rect x="3" y="9" width="6" height="2" fill="#1b1b23" />
      </svg>
    );
  }

  if (type === "bowl") {
    return (
      <svg {...common} shapeRendering="crispEdges" aria-hidden="true">
        <rect x="2" y="3" width="8" height="2" fill="#91b8eb" />
        <rect x="1" y="5" width="10" height="2" fill="#5f88c8" />
        <rect x="2" y="7" width="8" height="2" fill="#3e6299" />
        <rect x="3" y="2" width="2" height="1" fill="#ffffff" />
        <rect x="7" y="2" width="2" height="1" fill="#ffffff" />
      </svg>
    );
  }

  return (
    <svg {...common} shapeRendering="crispEdges" aria-hidden="true">
      <rect x="5" y="1" width="2" height="2" fill="#1b1b23" />
      <rect x="4" y="3" width="4" height="2" fill="#ffbf57" />
      <rect x="2" y="5" width="8" height="2" fill="#ff8468" />
      <rect x="1" y="7" width="10" height="2" fill="#ffbf57" />
      <rect x="3" y="9" width="6" height="2" fill="#1b1b23" />
    </svg>
  );
}

const upgradeItems: { key: UpgradeIconKey; label: string }[] = [
  { key: "clothes", label: "衣服" },
  { key: "food", label: "食物" },
  { key: "bowl", label: "饭盆" },
  { key: "toy", label: "玩具" },
];

function pupVariant(id: FamilyMemberId) {
  if (id === "mom") return "pink";
  if (id === "dad") return "blue";
  return "white";
}

export function ChatPage({
  familyMembers,
  latestEntries,
  bubbleMessage,
}: ChatPageProps) {
  const [selectedFamilyDog, setSelectedFamilyDog] =
    useState<FamilyMemberId>("me");

  const me =
    familyMembers.find((member) => member.id === "me") ?? familyMembers[0];

  const parentMembers = familyMembers.filter((member) => member.id !== "me");

  const selectedMember =
    familyMembers.find((member) => member.id === selectedFamilyDog) ?? me;

  const selectedBubble =
    selectedFamilyDog === "me"
      ? bubbleMessage
      : latestEntries[selectedFamilyDog]?.dogMessage?.trim() ||
        `${selectedMember.name}的小狗现在还没有传话`;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f4ede4]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/home-bg.png')",
        }}
      />

      <div className="relative flex flex-1 flex-col px-3 pt-4 pb-24">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9f8067]">
              Home
            </p>
            <h1 className="mt-2 text-[15px] font-semibold text-[#3d2d22]">
              我觉得食物和狗盆可以不用做 有点麻烦了 你们觉得呢
            </h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#7d6554] shadow-[0_8px_18px_rgba(97,74,56,0.08)] backdrop-blur">
            <Bell className="h-5 w-5" />
          </div>
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-3">
            {parentMembers.map((member) => {
              const isActive = selectedFamilyDog === member.id;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedFamilyDog(member.id)}
                  className="w-[72px] px-0 py-1 text-center transition"
                >
                  <p className="mb-1 text-xs font-semibold text-[#5a4433]">
                    {member.name}
                  </p>

                  <div className="mx-auto flex w-fit items-center justify-center">
                    <PixelPup
                      size={2.7}
                      headOnly
                      variant={pupVariant(member.id)}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="w-[64px] px-2 py-3">
            <div className="flex flex-col gap-3">
              {upgradeItems.map((item) => (
                <div key={item.key} className="text-center">
                  <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbf6f1]">
                    <PixelUpgradeIcon type={item.key} />
                  </div>

                  <p className="text-[10px] font-medium text-[#7d6554]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute top-0 left-1/2 z-10 w-[232px] -translate-x-1/2 rounded-[28px] border border-[#f4dccf] bg-white px-5 py-4 text-center text-[15px] leading-6 text-[#5d4838] shadow-[0_16px_30px_rgba(94,69,47,0.12)]">
            {selectedBubble}

            <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-[#f4dccf] bg-white" />
          </div>

          <div className="absolute bottom-7 h-9 w-[240px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(106,83,61,0.28),_rgba(106,83,61,0)_72%)]" />

          <div className="relative mt-12 flex flex-col items-center">
            <img
              src="/images/dog-white.png"
              alt={`${me.name}的小狗 ${me.dogName}`}
              className="h-[190px] w-auto object-contain drop-shadow-[0_14px_18px_rgba(73,56,42,0.18)]"
            />

            <p className="mt-3 text-sm font-semibold text-[#4c3a2d]">
              {me.name}的小狗 {me.dogName}
            </p>

            {selectedFamilyDog !== "me" && (
              <p className="mt-1 text-xs text-[#8b705d]">
                当前在看 {selectedMember.name} 的陪伴状态
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-[28px] border border-white/80 bg-white/68 px-4 py-4 shadow-[0_12px_32px_rgba(73,56,42,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#49372a]">
                首页主狗固定显示自己
              </p>

              <p className="mt-1 text-xs leading-5 text-[#8b705d]">
                左侧保留爸爸和妈妈的小狗入口，右侧道具只作为静态陪伴元素展示。
              </p>
            </div>

            <div className="rounded-full bg-[#f7eadf] px-3 py-2 text-xs font-semibold text-[#8e6f54]">
              首页
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}