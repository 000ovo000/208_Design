import { useState } from "react";
import { Bell } from "lucide-react";
import { PixelPup } from "../components/pixel-pup";
import { AlbumEntry, FamilyMember, FamilyMemberId } from "../types";

interface ChatPageProps {
  familyMembers: FamilyMember[];
  latestEntries: Record<FamilyMemberId, AlbumEntry | null>;
  bubbleMessage: string;
}

type InventoryTab = "shop" | "food" | "toy";
type BreedKey = "white" | "brown" | "shiba" | "corgi";
type FoodKey = "bone" | "biscuit" | "milk";
type ToyKey = "ball" | "rope" | "duck";

function PixelInventoryIcon({ type }: { type: InventoryTab }) {
  const common = { width: 26, height: 26, viewBox: "0 0 12 12" };

  if (type === "shop") {
    return (
      <svg {...common} shapeRendering="crispEdges" aria-hidden="true">
        <rect x="2" y="1" width="8" height="2" fill="#d18b63" />
        <rect x="1" y="3" width="10" height="2" fill="#f3c27f" />
        <rect x="2" y="5" width="8" height="6" fill="#fff4df" />
        <rect x="3" y="7" width="2" height="4" fill="#8ab5d6" />
        <rect x="7" y="7" width="2" height="2" fill="#f4a4b7" />
        <rect x="1" y="3" width="2" height="2" fill="#b96f57" />
        <rect x="5" y="3" width="2" height="2" fill="#b96f57" />
        <rect x="9" y="3" width="2" height="2" fill="#b96f57" />
      </svg>
    );
  }

  if (type === "food") {
    return (
      <svg {...common} shapeRendering="crispEdges" aria-hidden="true">
        <rect x="2" y="2" width="3" height="3" fill="#f8d27a" />
        <rect x="7" y="2" width="3" height="3" fill="#f8d27a" />
        <rect x="4" y="4" width="4" height="4" fill="#d99959" />
        <rect x="2" y="7" width="3" height="3" fill="#f8d27a" />
        <rect x="7" y="7" width="3" height="3" fill="#f8d27a" />
        <rect x="5" y="5" width="2" height="2" fill="#fff4df" />
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

const inventoryTabs: { key: InventoryTab; label: string; title: string }[] = [
  { key: "shop", label: "Shop", title: "Breed Shop" },
  { key: "food", label: "Food", title: "Food Storage" },
  { key: "toy", label: "Toys", title: "Toy Box" },
];

const breedItems: {
  key: BreedKey;
  name: string;
  description: string;
  image: string;
  unlocked: boolean;
}[] = [
  {
    key: "white",
    name: "Basic White Puppy",
    description: "Your first family puppy.",
    image: "/images/dog-white.png",
    unlocked: true,
  },
  {
    key: "brown",
    name: "Warm Brown Puppy",
    description: "Unlocked from shared family moments.",
    image: "/images/dog.png",
    unlocked: true,
  },
  {
    key: "shiba",
    name: "Shiba Puppy",
    description: "Locked. Can be unlocked in Weekly Echo.",
    image: "/images/dog-white.png",
    unlocked: false,
  },
  {
    key: "corgi",
    name: "Corgi Puppy",
    description: "Locked. Can be unlocked by family reactions.",
    image: "/images/dog-white.png",
    unlocked: false,
  },
];

const foodItems: { key: FoodKey; name: string; emoji: string; description: string }[] = [
  { key: "bone", name: "Small Bone", emoji: "🦴", description: "A snack from daily sharing." },
  { key: "biscuit", name: "Puppy Biscuit", emoji: "🍪", description: "A soft reward for your puppy." },
  { key: "milk", name: "Warm Milk", emoji: "🥛", description: "A gentle comfort item." },
];

const toyItems: { key: ToyKey; name: string; emoji: string; description: string; unlocked: boolean }[] = [
  { key: "ball", name: "Soft Ball", emoji: "🎾", description: "A basic toy for light play.", unlocked: true },
  { key: "rope", name: "Rope Toy", emoji: "🧶", description: "Unlocked by family reactions.", unlocked: true },
  { key: "duck", name: "Tiny Duck", emoji: "🐤", description: "Locked. Can appear in a weekly drop.", unlocked: false },
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
  const [activeInventory, setActiveInventory] = useState<InventoryTab | null>(null);
  const [selectedBreed, setSelectedBreed] = useState<BreedKey>("white");
  const [selectedToy, setSelectedToy] = useState<ToyKey>("ball");
  const [foodCounts, setFoodCounts] = useState<Record<FoodKey, number>>({
    bone: 2,
    biscuit: 1,
    milk: 1,
  });
  const [petFeedback, setPetFeedback] = useState("小狗正在等你分享今天的小事。");

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

  const currentBreed =
    breedItems.find((breed) => breed.key === selectedBreed) ?? breedItems[0];

  const currentToy = toyItems.find((toy) => toy.key === selectedToy);

  const activeInventoryTitle = inventoryTabs.find(
    (item) => item.key === activeInventory
  )?.title;

  const feedPuppy = (foodKey: FoodKey) => {
    const food = foodItems.find((item) => item.key === foodKey);

    setFoodCounts((prev) => {
      if (prev[foodKey] <= 0) return prev;
      return { ...prev, [foodKey]: prev[foodKey] - 1 };
    });

    if (foodCounts[foodKey] > 0 && food) {
      setPetFeedback(`${me.dogName} ate ${food.name}. Food items are consumed after use.`);
    }
  };

  const chooseBreed = (breedKey: BreedKey) => {
    const breed = breedItems.find((item) => item.key === breedKey);
    if (!breed?.unlocked) return;
    setSelectedBreed(breedKey);
    setPetFeedback(`${me.dogName} changed into ${breed.name}.`);
  };

  const chooseToy = (toyKey: ToyKey) => {
    const toy = toyItems.find((item) => item.key === toyKey);
    if (!toy?.unlocked) return;
    setSelectedToy(toyKey);
    setPetFeedback(`${me.dogName} is playing with ${toy.name}.`);
  };

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
            <h1 className="mt-2 text-[17px] font-semibold text-[#3d2d22]">
              Let your puppy carry small family moments.
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
                  className={`w-[72px] rounded-2xl px-0 py-1 text-center transition ${
                    isActive ? "bg-white/55 shadow-[0_8px_18px_rgba(97,74,56,0.08)]" : ""
                  }`}
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

          <div className="w-[74px] px-1 py-1">
            <div className="flex flex-col gap-3">
              {inventoryTabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveInventory(item.key)}
                  className="text-center transition active:scale-95"
                >
                  <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-[#fbf6f1] shadow-[0_8px_18px_rgba(97,74,56,0.1)]">
                    <PixelInventoryIcon type={item.key} />
                  </div>

                  <p className="text-[11px] font-semibold text-[#7d6554]">
                    {item.label}
                  </p>
                </button>
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
              src={currentBreed.image}
              alt={`${me.name}的小狗 ${me.dogName}`}
              className="h-[190px] w-auto object-contain drop-shadow-[0_14px_18px_rgba(73,56,42,0.18)]"
            />

            <p className="mt-3 text-sm font-semibold text-[#4c3a2d]">
              {me.name}的小狗 {me.dogName}
            </p>

            <p className="mt-1 text-[11px] text-[#8b705d]">
              {currentBreed.name} · {currentToy?.name}
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
                Pet inventory
              </p>

              <p className="mt-1 text-xs leading-5 text-[#8b705d]">
                {petFeedback}
              </p>
            </div>

            <div className="rounded-full bg-[#f7eadf] px-3 py-2 text-xs font-semibold text-[#8e6f54]">
              Keepsakes
            </div>
          </div>
        </div>
      </div>

      {activeInventory && (
        <div className="absolute inset-0 z-30 flex items-end bg-[#3d2d22]/28 px-3 pb-5 backdrop-blur-sm">
          <div className="w-full rounded-[30px] border border-white/80 bg-[#fffaf5] p-4 shadow-[0_22px_50px_rgba(67,48,34,0.22)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b08a6d]">
                  Puppy Warehouse
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#3d2d22]">
                  {activeInventoryTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveInventory(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3e5d8] text-sm font-bold text-[#7d6554]"
              >
                ×
              </button>
            </div>

            {activeInventory === "shop" && (
              <div className="grid grid-cols-2 gap-3">
                {breedItems.map((breed) => {
                  const isSelected = selectedBreed === breed.key;

                  return (
                    <button
                      key={breed.key}
                      type="button"
                      disabled={!breed.unlocked}
                      onClick={() => chooseBreed(breed.key)}
                      className={`rounded-3xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#d18b63] bg-[#fff1df]"
                          : "border-[#f2dfcf] bg-white"
                      } ${!breed.unlocked ? "opacity-50" : "active:scale-[0.98]"}`}
                    >
                      <div className="mb-2 flex h-20 items-center justify-center rounded-2xl bg-[#f7eadf]">
                        <img src={breed.image} alt="" className="h-16 w-auto object-contain" />
                      </div>
                      <p className="text-xs font-semibold text-[#49372a]">{breed.name}</p>
                      <p className="mt-1 text-[10px] leading-4 text-[#8b705d]">
                        {breed.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {activeInventory === "food" && (
              <div className="space-y-2">
                {foodItems.map((food) => {
                  const count = foodCounts[food.key];

                  return (
                    <button
                      key={food.key}
                      type="button"
                      disabled={count <= 0}
                      onClick={() => feedPuppy(food.key)}
                      className={`flex w-full items-center gap-3 rounded-3xl border border-[#f2dfcf] bg-white p-3 text-left transition ${
                        count <= 0 ? "opacity-50" : "active:scale-[0.98]"
                      }`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1df] text-xl">
                        {food.emoji}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-[#49372a]">
                          {food.name}
                        </span>
                        <span className="block text-[11px] leading-4 text-[#8b705d]">
                          {food.description}
                        </span>
                      </span>
                      <span className="rounded-full bg-[#f7eadf] px-2 py-1 text-xs font-semibold text-[#8e6f54]">
                        × {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeInventory === "toy" && (
              <div className="space-y-2">
                {toyItems.map((toy) => {
                  const isSelected = selectedToy === toy.key;

                  return (
                    <button
                      key={toy.key}
                      type="button"
                      disabled={!toy.unlocked}
                      onClick={() => chooseToy(toy.key)}
                      className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#d18b63] bg-[#fff1df]"
                          : "border-[#f2dfcf] bg-white"
                      } ${!toy.unlocked ? "opacity-50" : "active:scale-[0.98]"}`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7eadf] text-xl">
                        {toy.emoji}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-[#49372a]">
                          {toy.name}
                        </span>
                        <span className="block text-[11px] leading-4 text-[#8b705d]">
                          {toy.description}
                        </span>
                      </span>
                      <span className="rounded-full bg-[#f7eadf] px-2 py-1 text-xs font-semibold text-[#8e6f54]">
                        {toy.unlocked ? (isSelected ? "Using" : "Use") : "Locked"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="mt-3 text-center text-[11px] leading-4 text-[#9a7a61]">
              Food is consumable. Breeds and toys stay as long-term shared keepsakes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
