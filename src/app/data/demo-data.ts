import type { AlbumReaction, FamilyMember, FamilyMemberId } from "../types";
import {
  buildDemoCareMessageText,
  type DemoCareMessageType,
} from "../lib/care-message";
import { dailyDrops } from "./daily-drops";
import { petItems, type PetId } from "./pets";
import { findWeeklyRewardByItemIdentity, weeklyRewards } from "./weekly-rewards";

const DEMO_FAMILY_ID = 1;
const DEMO_WEEKLY_ECHO_WEEK_START = "2026-04-26";
const DEMO_WEEKLY_ECHO_WEEK_END = "2026-05-02";

export type DemoCurrentUser = {
  id: FamilyMemberId;
  name: string;
  email: string;
  family_id: number;
};

export type DemoFamily = {
  id: number;
  name: string;
  created_at: string;
};

export type DemoFamilyMember = FamilyMember & {
  id: number;
  user_id: number;
  family_id: number;
  email: string;
  role: string;
  avatarUrl: string;
  avatar_url: string;
  dogName: string;
  pet_name: string;
  pet_type: string;
  pet_subtitle: string;
  created_at: string;
  updated_at: string;
};

export type DemoAlbumReactionComment = {
  memberId: string;
  memberName: string;
  reaction: Exclude<AlbumReaction, null>;
};

export type DemoAlbumPost = {
  id: number | string;
  user_id: FamilyMemberId;
  family_member_id: FamilyMemberId;
  family_id: number;
  title: string;
  content: string;
  media_url: string | null;
  media_type: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  authorName: string;
  avatarUrl: string;
  avatar_url: string;
  reaction?: AlbumReaction;
  reaction_comments?: DemoAlbumReactionComment[];
};

export type DemoMoodEntry = {
  id: number | string;
  user_id: FamilyMemberId;
  user_name: string;
  family_id: number;
  mood: string;
  comment: string | null;
  visibility: "private" | "soft" | "full";
  entry_date: string;
  created_at: string;
};

export type DemoPetMessage = {
  id: number | string;
  sender_user_id: FamilyMemberId;
  receiver_user_id: FamilyMemberId;
  family_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  sender_name?: string;
};

export type DemoCareMessage = {
  id: number | string;
  sender_user_id: FamilyMemberId;
  receiver_user_id: FamilyMemberId;
  family_id: number;
  care_type: string;
  message_type?: DemoCareMessageType;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  sender_name?: string;
};

export type DemoItem = {
  id: number;
  name: string;
  category: string;
  icon: string;
  price: number;
  created_at: string;
  image: string | null;
  sceneImage: string | null;
};

export type DemoMemberItem = {
  family_member_id: number;
  item_id: number;
  quantity: number;
  acquired_at: string;
};

export type DemoMemberActiveItem = {
  id: number;
  family_member_id: number;
  item_id: number;
  slot: "room-decor";
  activated_at: string;
};

export type DemoInventoryState = {
  dailyDropInventory: Record<string, number>;
  weeklyRewardInventory: Record<string, number>;
  activeWeeklyRewardIds: string[];
};

export type DemoWeeklyEchoSummary = {
  report: {
    reportId: number;
    familyId: number;
    weekStartDate: string;
    weekEndDate: string;
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
  summary: {
    subtitle: string;
    body: string;
  };
  stats: {
    petMessages: number;
    photoShares: number;
    gentleReactions: number;
    moodCheckIns: number;
    connectedDays: number;
    smallMoments: number;
  };
  keepsakes: {
    category: "food" | "drink" | "basic-toy";
    label: string;
    count: number;
    preview: string;
  }[];
};

export const demoFamily: DemoFamily = {
  id: DEMO_FAMILY_ID,
  name: "Kinlight Family",
  created_at: "2026-04-20 09:00:00",
};

const demoFamilyMemberSeed: DemoFamilyMember[] = [
  {
    id: 1,
    user_id: 1,
    family_id: DEMO_FAMILY_ID,
    name: "Grace",
    email: "grace@kinlight.demo",
    role: "daughter",
    is_current_user: true,
    dogName: "Mochi",
    pet_name: "Mochi",
    pet_type: "dog",
    pet_subtitle: "A soft little companion for quiet days.",
    accentColor: "#f4b183",
    avatarUrl: "/images/profile_photo/grace.png",
    avatar_url: "/images/profile_photo/grace.png",
    created_at: "2026-04-20 09:05:00",
    updated_at: "2026-05-08 09:00:00",
  },
  {
    id: 2,
    user_id: 2,
    family_id: DEMO_FAMILY_ID,
    name: "Mom",
    email: "mom@kinlight.demo",
    role: "mom",
    is_current_user: false,
    dogName: "Mimi",
    pet_name: "Mimi",
    pet_type: "cat",
    pet_subtitle: "A calm companion for gentle care.",
    accentColor: "#f29fb1",
    avatarUrl: "/images/profile_photo/mom.png",
    avatar_url: "/images/profile_photo/mom.png",
    created_at: "2026-04-20 09:06:00",
    updated_at: "2026-05-08 09:00:00",
  },
  {
    id: 3,
    user_id: 3,
    family_id: DEMO_FAMILY_ID,
    name: "Dad",
    email: "dad@kinlight.demo",
    role: "dad",
    is_current_user: false,
    dogName: "Bunbun",
    pet_name: "Bunbun",
    pet_type: "rabbit",
    pet_subtitle: "A steady companion for practical love.",
    accentColor: "#8fb5e8",
    avatarUrl: "/images/profile_photo/dad.png",
    avatar_url: "/images/profile_photo/dad.png",
    created_at: "2026-04-20 09:07:00",
    updated_at: "2026-05-08 09:00:00",
  },
];

export const demoFamilyMembers: DemoFamilyMember[] = demoFamilyMemberSeed.map((member) => ({
  ...member,
}));

const demoFamilyMemberById = new Map(
  demoFamilyMembers.map((member) => [String(member.id), member])
);

function getDemoFamilyMember(memberId: FamilyMemberId) {
  return demoFamilyMemberById.get(String(memberId)) ?? demoFamilyMembers[0];
}

export const demoCurrentUser: DemoCurrentUser = {
  id: 1,
  name: "Grace",
  email: "grace@kinlight.demo",
  family_id: DEMO_FAMILY_ID,
};

const demoAlbumPostSeedRows = [
  [
    1,
    1,
    1,
    "Birthday colors",
    "A tiny birthday corner for Grace, full of pink, candles, and soft family wishes.",
    "/images/grace_album/G3.png",
    "2026-04-22 18:20:00",
  ],
  [
    2,
    1,
    1,
    "Sunset painting",
    "Finished a sunset painting today. It made the room feel brighter and warmer.",
    "/images/grace_album/G2.png",
    "2026-04-27 17:35:00",
  ],
  [
    3,
    1,
    1,
    "Art table afternoon",
    "A colorful little art moment from my desk. I wanted to share something cheerful.",
    "/images/grace_album/G1.png",
    "2026-05-03 15:10:00",
  ],
  [
    4,
    2,
    2,
    "Dumpling table",
    "Prepared dumplings at home. These small routines always make the house feel close.",
    "/images/mom_album/M3.png",
    "2026-04-23 11:30:00",
  ],
  [
    5,
    2,
    2,
    "Fresh flowers",
    "Placed fresh flowers by the window. A quiet morning with tea and soft light.",
    "/images/mom_album/M2.png",
    "2026-04-29 09:40:00",
  ],
  [
    6,
    2,
    2,
    "Cookies before baking",
    "Made cookies in the warm kitchen. Hope everyone gets a little sweet moment today.",
    "/images/mom_album/M1.png",
    "2026-05-04 16:15:00",
  ],
  [
    7,
    3,
    3,
    "Breakfast check-in",
    "A simple breakfast scene. Starting the day with something warm and steady.",
    "/images/dad_album/D1.png",
    "2026-04-24 08:15:00",
  ],
  [
    8,
    3,
    3,
    "Balcony plants",
    "Watered the plants this morning. The balcony looked peaceful in the sunlight.",
    "/images/dad_album/D2.png",
    "2026-04-30 10:25:00",
  ],
  [
    9,
    3,
    3,
    "Fixed the shelf",
    "Finished assembling the shelf. A small useful thing for the living room.",
    "/images/dad_album/D3.png",
    "2026-05-06 14:45:00",
  ],
] as const;

export const demoAlbumPosts: DemoAlbumPost[] = demoAlbumPostSeedRows.map(
  ([id, userId, familyMemberId, title, content, mediaUrl, createdAt]) => {
    const member = getDemoFamilyMember(userId);

    return {
      id,
      user_id: userId,
      family_member_id: familyMemberId,
      family_id: DEMO_FAMILY_ID,
      title,
      content,
      media_url: mediaUrl,
      media_type: "image",
      created_at: createdAt,
      updated_at: createdAt,
      user_name: member.name,
      authorName: member.name,
      avatarUrl: member.avatarUrl,
      avatar_url: member.avatar_url,
      reaction: null,
      reaction_comments: [],
    };
  }
);

const demoMoodSeedRows = [
  [1, "happy", "Spent a quiet evening drawing and thinking about home.", "2026-04-20", "full", "2026-04-20 20:00:00"],
  [1, "calm", "A calm day with a small moment worth remembering.", "2026-04-21", "full", "2026-04-21 20:00:00"],
  [1, "connected", "Felt close to family after sharing a little update.", "2026-04-22", "full", "2026-04-22 20:00:00"],
  [1, "tired", "A bit tired, but still felt supported.", "2026-04-23", "soft", "2026-04-23 20:00:00"],
  [1, "grateful", "Grateful for small family messages today.", "2026-04-24", "full", "2026-04-24 20:00:00"],
  [1, "calm", "A slow and peaceful mood check-in.", "2026-04-25", "full", "2026-04-25 20:00:00"],
  [1, "happy", "Had a bright moment that made the day lighter.", "2026-04-26", "full", "2026-04-26 20:00:00"],
  [1, "thoughtful", "Thinking about family and little routines.", "2026-04-27", "soft", "2026-04-27 20:00:00"],
  [1, "connected", "Felt connected through a shared photo.", "2026-04-28", "full", "2026-04-28 20:00:00"],
  [1, "calm", "Quiet but comfortable today.", "2026-04-29", "full", "2026-04-29 20:00:00"],
  [1, "happy", "A small happy moment in the afternoon.", "2026-04-30", "full", "2026-04-30 20:00:00"],
  [1, "tired", "Low energy, but the family space felt gentle.", "2026-05-01", "soft", "2026-05-01 20:00:00"],
  [1, "grateful", "Grateful for being noticed in a small way.", "2026-05-02", "full", "2026-05-02 20:00:00"],
  [1, "connected", "A warm message made the day feel closer.", "2026-05-03", "full", "2026-05-03 20:00:00"],
  [1, "calm", "Calm mood, nothing too heavy.", "2026-05-04", "full", "2026-05-04 20:00:00"],
  [1, "happy", "Felt happy after uploading a small moment.", "2026-05-05", "full", "2026-05-05 20:00:00"],
  [1, "thoughtful", "A reflective day with a soft feeling.", "2026-05-06", "soft", "2026-05-06 20:00:00"],
  [1, "connected", "Felt connected across distance.", "2026-05-07", "full", "2026-05-07 20:00:00"],
  [2, "calm", "A calm family day with simple routines.", "2026-04-20", "full", "2026-04-20 21:00:00"],
  [2, "grateful", "Grateful for the little updates from everyone.", "2026-04-21", "full", "2026-04-21 21:00:00"],
  [2, "busy", "Busy day, but still checked in.", "2026-04-22", "soft", "2026-04-22 21:00:00"],
  [2, "warm", "Warm mood after preparing something at home.", "2026-04-23", "full", "2026-04-23 21:00:00"],
  [2, "calm", "A quiet and steady day.", "2026-04-24", "full", "2026-04-24 21:00:00"],
  [2, "happy", "Happy to see small family moments.", "2026-04-25", "full", "2026-04-25 21:00:00"],
  [2, "tired", "A little tired from housework.", "2026-04-26", "soft", "2026-04-26 21:00:00"],
  [2, "grateful", "Grateful for ordinary family time.", "2026-04-27", "full", "2026-04-27 21:00:00"],
  [2, "warm", "A warm and caring mood today.", "2026-04-28", "full", "2026-04-28 21:00:00"],
  [2, "calm", "Calm evening after a full day.", "2026-04-29", "full", "2026-04-29 21:00:00"],
  [2, "busy", "Busy but manageable.", "2026-04-30", "soft", "2026-04-30 21:00:00"],
  [2, "happy", "A small cheerful moment in the kitchen.", "2026-05-01", "full", "2026-05-01 21:00:00"],
  [2, "grateful", "Grateful for family closeness.", "2026-05-02", "full", "2026-05-02 21:00:00"],
  [2, "calm", "Peaceful and settled.", "2026-05-03", "full", "2026-05-03 21:00:00"],
  [2, "warm", "Warm mood from a shared photo.", "2026-05-04", "full", "2026-05-04 21:00:00"],
  [2, "tired", "Tired, but in a soft way.", "2026-05-05", "soft", "2026-05-05 21:00:00"],
  [2, "happy", "Happy with today's little family rhythm.", "2026-05-06", "full", "2026-05-06 21:00:00"],
  [2, "grateful", "Grateful for gentle communication.", "2026-05-07", "full", "2026-05-07 21:00:00"],
  [3, "steady", "A steady day with a practical mood.", "2026-04-20", "full", "2026-04-20 22:00:00"],
  [3, "happy", "Happy after finishing something useful.", "2026-04-21", "full", "2026-04-21 22:00:00"],
  [3, "focused", "Focused on small tasks at home.", "2026-04-22", "full", "2026-04-22 22:00:00"],
  [3, "calm", "Calm evening with family in mind.", "2026-04-23", "full", "2026-04-23 22:00:00"],
  [3, "tired", "A bit tired, but okay.", "2026-04-24", "soft", "2026-04-24 22:00:00"],
  [3, "helpful", "Felt helpful after fixing something.", "2026-04-25", "full", "2026-04-25 22:00:00"],
  [3, "steady", "Steady and ordinary day.", "2026-04-26", "full", "2026-04-26 22:00:00"],
  [3, "happy", "A happy little family update.", "2026-04-27", "full", "2026-04-27 22:00:00"],
  [3, "focused", "Focused but relaxed.", "2026-04-28", "soft", "2026-04-28 22:00:00"],
  [3, "calm", "Calm mood, simple routine.", "2026-04-29", "full", "2026-04-29 22:00:00"],
  [3, "helpful", "Helpful mood after doing a small task.", "2026-04-30", "full", "2026-04-30 22:00:00"],
  [3, "tired", "Tired but comfortable.", "2026-05-01", "full", "2026-05-01 22:00:00"],
  [3, "steady", "Steady day, nothing too stressful.", "2026-05-02", "soft", "2026-05-02 22:00:00"],
  [3, "happy", "Happy to see family activity.", "2026-05-03", "full", "2026-05-03 22:00:00"],
  [3, "calm", "Calm and grounded.", "2026-05-04", "full", "2026-05-04 22:00:00"],
  [3, "focused", "Focused on home details.", "2026-05-05", "full", "2026-05-05 22:00:00"],
  [3, "helpful", "Helpful and settled.", "2026-05-06", "soft", "2026-05-06 22:00:00"],
  [3, "steady", "Steady evening.", "2026-05-07", "full", "2026-05-07 22:00:00"],
] as const;

export const demoMoodEntries: DemoMoodEntry[] = demoMoodSeedRows.map(
  ([userId, mood, comment, entryDate, visibility, createdAt], index) => ({
    id: index + 1,
    user_id: userId,
    user_name: getDemoFamilyMember(userId).name,
    family_id: DEMO_FAMILY_ID,
    mood,
    comment,
    visibility,
    entry_date: entryDate,
    created_at: createdAt,
  })
);

export const demoPetMessages: DemoPetMessage[] = [
  {
    id: 1,
    sender_user_id: 2,
    receiver_user_id: 1,
    family_id: DEMO_FAMILY_ID,
    message: "Mom asked Mochi to remind you to eat something warm today.",
    is_read: false,
    created_at: "2026-05-08 07:45:00",
    read_at: null,
    sender_name: "Mom",
  },
  {
    id: 2,
    sender_user_id: 3,
    receiver_user_id: 1,
    family_id: DEMO_FAMILY_ID,
    message: "Dad says the new shelf finally looks steady and finished.",
    is_read: true,
    created_at: "2026-05-07 18:30:00",
    read_at: "2026-05-07 18:45:00",
    sender_name: "Dad",
  },
  {
    id: 3,
    sender_user_id: 1,
    receiver_user_id: 2,
    family_id: DEMO_FAMILY_ID,
    message: "Grace shared a small hello from the art table.",
    is_read: false,
    created_at: "2026-05-08 09:10:00",
    read_at: null,
    sender_name: "Grace",
  },
  {
    id: 4,
    sender_user_id: 2,
    receiver_user_id: 3,
    family_id: DEMO_FAMILY_ID,
    message: "Mom says dinner will be ready soon if you are still busy.",
    is_read: false,
    created_at: "2026-05-08 17:40:00",
    read_at: null,
    sender_name: "Mom",
  },
];

export const demoCareMessages: DemoCareMessage[] = [
  {
    id: 1,
    sender_user_id: 2,
    receiver_user_id: 1,
    family_id: DEMO_FAMILY_ID,
    care_type: "hug",
    message_type: "hug",
    message: buildDemoCareMessageText({
      senderName: "Mom",
      messageType: "hug",
    }),
    is_read: false,
    created_at: "2026-05-08 08:20:00",
    read_at: null,
    sender_name: "Mom",
  },
  {
    id: 2,
    sender_user_id: 3,
    receiver_user_id: 2,
    family_id: DEMO_FAMILY_ID,
    care_type: "tea",
    message_type: "care",
    message: buildDemoCareMessageText({
      senderName: "Dad",
      messageType: "care",
    }),
    is_read: false,
    created_at: "2026-05-08 10:10:00",
    read_at: null,
    sender_name: "Dad",
  },
  {
    id: 3,
    sender_user_id: 1,
    receiver_user_id: 3,
    family_id: DEMO_FAMILY_ID,
    care_type: "pet",
    message_type: "love",
    message: buildDemoCareMessageText({
      senderName: "Grace",
      messageType: "love",
    }),
    is_read: true,
    created_at: "2026-05-07 20:00:00",
    read_at: "2026-05-07 20:15:00",
    sender_name: "Grace",
  },
];

const demoItemSeedRows = [
  [1, "Pet Water", "drink", "pet-water", 0, "2026-04-20 09:15:00"],
  [2, "Pet Milk", "drink", "pet-milk", 0, "2026-04-20 09:15:00"],
  [3, "Canned Tuna", "food", "canned-tuna", 0, "2026-04-20 09:15:00"],
  [4, "Pet Food", "food", "pet-food", 0, "2026-04-20 09:15:00"],
  [5, "Pet Biscuit", "food", "pet-biscuit", 0, "2026-04-20 09:15:00"],
  [6, "Small Bone", "toy", "small-bone", 0, "2026-04-20 09:15:00"],
  [7, "Small Ball", "toy", "small-ball", 0, "2026-04-20 09:15:00"],
  [8, "Chew Toy", "toy", "chew-toy", 0, "2026-04-20 09:15:00"],
  [9, "Plush Bear", "toy", "plush-bear", 0, "2026-04-20 09:15:00"],
  [10, "Fish Toy", "toy", "fish-toy", 0, "2026-04-20 09:15:00"],
  [11, "Cookie", "food", "cookie", 0, "2026-04-20 09:15:00"],
  [12, "Tennis Ball", "toy", "tennis-ball", 0, "2026-04-20 09:15:00"],
  [13, "Pet Sofa 1", "room-decor", "pet-sofa1-5", 0, "2026-04-20 09:15:00"],
  [14, "Pet Sofa 3", "room-decor", "pet-sofa3", 0, "2026-04-20 09:15:00"],
  [15, "Cat Climber", "room-decor", "cat-climber", 0, "2026-04-20 09:15:00"],
  [16, "Cat Teaser", "toy", "cat-teaser", 0, "2026-04-20 09:15:00"],
  [17, "Carrot Toy", "toy", "carrot-toy", 0, "2026-04-20 09:15:00"],
  [18, "Pet Sofa 5", "room-decor", "pet-sofa5", 0, "2026-04-20 09:15:00"],
] as const;

function getDemoItemVisuals(name: string) {
  const matchingDailyDrop = dailyDrops.find((drop) => drop.name === name);
  if (matchingDailyDrop) {
    return {
      image: matchingDailyDrop.image ?? null,
      sceneImage: matchingDailyDrop.sceneImage ?? matchingDailyDrop.image ?? null,
    };
  }

  const matchingWeeklyReward = findWeeklyRewardByItemIdentity({ name });
  if (matchingWeeklyReward) {
    return {
      image: matchingWeeklyReward.image ?? null,
      sceneImage: matchingWeeklyReward.sceneImage ?? matchingWeeklyReward.image ?? null,
    };
  }

  return {
    image: null,
    sceneImage: null,
  };
}

export const demoItems: DemoItem[] = demoItemSeedRows.map(
  ([id, name, category, icon, price, createdAt]) => {
    const visuals = getDemoItemVisuals(name);

    return {
      id,
      name,
      category,
      icon,
      price,
      created_at: createdAt,
      image: visuals.image,
      sceneImage: visuals.sceneImage,
    };
  }
);

export const demoMemberItems: DemoMemberItem[] = [
  { family_member_id: 1, item_id: 1, quantity: 2, acquired_at: "2026-04-21 10:00:00" },
  { family_member_id: 1, item_id: 2, quantity: 1, acquired_at: "2026-04-22 10:00:00" },
  { family_member_id: 1, item_id: 5, quantity: 4, acquired_at: "2026-04-23 10:00:00" },
  { family_member_id: 1, item_id: 7, quantity: 3, acquired_at: "2026-04-24 10:00:00" },
  { family_member_id: 1, item_id: 9, quantity: 1, acquired_at: "2026-04-25 10:00:00" },
  { family_member_id: 1, item_id: 16, quantity: 1, acquired_at: "2026-04-26 10:00:00" },
  { family_member_id: 2, item_id: 2, quantity: 3, acquired_at: "2026-04-21 10:05:00" },
  { family_member_id: 2, item_id: 3, quantity: 2, acquired_at: "2026-04-22 10:05:00" },
  { family_member_id: 2, item_id: 4, quantity: 3, acquired_at: "2026-04-23 10:05:00" },
  { family_member_id: 2, item_id: 6, quantity: 1, acquired_at: "2026-04-24 10:05:00" },
  { family_member_id: 2, item_id: 8, quantity: 2, acquired_at: "2026-04-25 10:05:00" },
  { family_member_id: 2, item_id: 17, quantity: 1, acquired_at: "2026-04-26 10:05:00" },
  { family_member_id: 3, item_id: 1, quantity: 1, acquired_at: "2026-04-21 10:10:00" },
  { family_member_id: 3, item_id: 4, quantity: 2, acquired_at: "2026-04-22 10:10:00" },
  { family_member_id: 3, item_id: 5, quantity: 2, acquired_at: "2026-04-23 10:10:00" },
  { family_member_id: 3, item_id: 6, quantity: 3, acquired_at: "2026-04-24 10:10:00" },
  { family_member_id: 3, item_id: 10, quantity: 1, acquired_at: "2026-04-25 10:10:00" },
  { family_member_id: 3, item_id: 12, quantity: 2, acquired_at: "2026-04-26 10:10:00" },
];

export const demoMemberActiveItems: DemoMemberActiveItem[] = [
  { id: 1, family_member_id: 1, item_id: 14, slot: "room-decor", activated_at: "2026-05-01 12:00:00" },
  { id: 2, family_member_id: 2, item_id: 15, slot: "room-decor", activated_at: "2026-05-01 12:05:00" },
  { id: 3, family_member_id: 3, item_id: 13, slot: "room-decor", activated_at: "2026-05-01 12:10:00" },
];

const demoItemById = new Map(demoItems.map((item) => [item.id, item]));

function createEmptyInventoryState(): DemoInventoryState {
  return {
    dailyDropInventory: {},
    weeklyRewardInventory: {},
    activeWeeklyRewardIds: [],
  };
}

function applyGraceDemoInventoryOverride(inventory: DemoInventoryState) {
  const nextInventory: DemoInventoryState = {
    dailyDropInventory: { ...inventory.dailyDropInventory },
    weeklyRewardInventory: { ...inventory.weeklyRewardInventory },
    activeWeeklyRewardIds: inventory.activeWeeklyRewardIds.filter((rewardId) => rewardId !== "carrot-toy"),
  };

  dailyDrops.forEach((drop) => {
    nextInventory.dailyDropInventory[drop.id] = Math.max(nextInventory.dailyDropInventory[drop.id] ?? 0, 1);
  });

  weeklyRewards
    .filter((reward) => reward.id !== "carrot-toy")
    .forEach((reward) => {
      nextInventory.weeklyRewardInventory[reward.id] = Math.max(
        nextInventory.weeklyRewardInventory[reward.id] ?? 0,
        1
      );
    });

  delete nextInventory.weeklyRewardInventory["carrot-toy"];

  return nextInventory;
}

function buildSeedInventories(): Record<string, DemoInventoryState> {
  const inventories = demoFamilyMembers.reduce<Record<string, DemoInventoryState>>((accumulator, member) => {
    accumulator[String(member.id)] = createEmptyInventoryState();
    return accumulator;
  }, {});

  demoMemberItems.forEach((memberItem) => {
    const inventory = inventories[String(memberItem.family_member_id)] ?? createEmptyInventoryState();
    const item = demoItemById.get(memberItem.item_id);
    if (!item) {
      inventories[String(memberItem.family_member_id)] = inventory;
      return;
    }

    const matchingDailyDrop = dailyDrops.find((drop) => drop.name === item.name);
    if (matchingDailyDrop) {
      inventory.dailyDropInventory[matchingDailyDrop.id] = memberItem.quantity;
    }

    const matchingWeeklyReward = findWeeklyRewardByItemIdentity({
      id: item.icon,
      name: item.name,
    });
    if (matchingWeeklyReward) {
      inventory.weeklyRewardInventory[matchingWeeklyReward.id] = memberItem.quantity;
    }

    inventories[String(memberItem.family_member_id)] = inventory;
  });

  demoMemberActiveItems.forEach((activeItem) => {
    const inventory = inventories[String(activeItem.family_member_id)] ?? createEmptyInventoryState();
    const item = demoItemById.get(activeItem.item_id);
    const matchingWeeklyReward = item
      ? findWeeklyRewardByItemIdentity({ id: item.icon, name: item.name })
      : null;

    if (matchingWeeklyReward) {
      inventory.activeWeeklyRewardIds = Array.from(
        new Set([...inventory.activeWeeklyRewardIds, matchingWeeklyReward.id])
      );
    }

    inventories[String(activeItem.family_member_id)] = inventory;
  });

  inventories["1"] = applyGraceDemoInventoryOverride(
    inventories["1"] ?? createEmptyInventoryState()
  );

  return inventories;
}

export const demoMyItems: Record<string, DemoInventoryState> = buildSeedInventories();

function compareDateOnly(value: string, start: string, end: string) {
  const dateOnly = value.slice(0, 10);
  return dateOnly >= start && dateOnly <= end;
}

function buildWeeklyEchoKeepsakes() {
  const summaryMap = new Map<
    "food" | "drink" | "basic-toy",
    { label: string; count: number; itemCounts: Map<string, number> }
  >();

  demoMemberItems.forEach((memberItem) => {
    const item = demoItemById.get(memberItem.item_id);
    if (!item) return;

    let category: "food" | "drink" | "basic-toy" | null = null;
    let label = "";

    if (item.category === "food") {
      category = "food";
      label = "Food";
    } else if (item.category === "drink") {
      category = "drink";
      label = "Drink";
    } else if (item.category === "toy") {
      category = "basic-toy";
      label = "Basic toy";
    }

    if (!category) return;

    const current = summaryMap.get(category) ?? {
      label,
      count: 0,
      itemCounts: new Map<string, number>(),
    };
    current.count += memberItem.quantity;
    current.itemCounts.set(item.name, (current.itemCounts.get(item.name) ?? 0) + memberItem.quantity);
    summaryMap.set(category, current);
  });

  return (["food", "drink", "basic-toy"] as const)
    .map((category) => {
      const summary = summaryMap.get(category);
      if (!summary || summary.count <= 0) return null;

      const previewNames = Array.from(summary.itemCounts.entries())
        .sort((first, second) => {
          if (second[1] !== first[1]) return second[1] - first[1];
          return first[0].localeCompare(second[0]);
        })
        .map(([name]) => name);

      return {
        category,
        label: summary.label,
        count: summary.count,
        preview:
          previewNames.length > 3
            ? `${previewNames.slice(0, 3).join(", ")}, ...`
            : previewNames.join(", "),
      };
    })
    .filter(
      (
        keepsake
      ): keepsake is {
        category: "food" | "drink" | "basic-toy";
        label: string;
        count: number;
        preview: string;
      } => Boolean(keepsake)
    );
}

function buildDemoWeeklyEchoSummary(): DemoWeeklyEchoSummary {
  const photoSharesCount = demoAlbumPosts.filter((post) =>
    compareDateOnly(post.created_at, DEMO_WEEKLY_ECHO_WEEK_START, DEMO_WEEKLY_ECHO_WEEK_END)
  ).length;
  const connectedDaySet = new Set<string>();
  for (let day = 26; day <= 30; day += 1) {
    connectedDaySet.add(`2026-04-${String(day).padStart(2, "0")}`);
  }
  connectedDaySet.add("2026-05-01");
  connectedDaySet.add("2026-05-02");

  const connectedDays = connectedDaySet.size;
  const petMessagesCount = 2;
  const gentleReactionsCount = 5;
  const moodCheckinsCount = 16;
  const smallMomentsCount =
    petMessagesCount + photoSharesCount + gentleReactionsCount + moodCheckinsCount;
  const featuredPetMessage =
    "Mom asked the puppy to remind everyone to eat something warm after a long day.";
  const reward = findWeeklyRewardByItemIdentity({ id: "pet-sofa2", name: "Pet Sofa 2" });
  const keepsakes = buildWeeklyEchoKeepsakes();

  return {
    report: {
      reportId: 2026042601,
      familyId: DEMO_FAMILY_ID,
      weekStartDate: DEMO_WEEKLY_ECHO_WEEK_START,
      weekEndDate: DEMO_WEEKLY_ECHO_WEEK_END,
      connectedDays,
      smallMomentsCount,
      petMessagesCount,
      photoSharesCount,
      gentleReactionsCount,
      moodCheckinsCount,
      featuredPetMessage,
      reportText: [
        `Your family kept ${connectedDays} connected day${connectedDays === 1 ? "" : "s"}.`,
        `This week, your family shared ${smallMomentsCount} small moment${smallMomentsCount === 1 ? "" : "s"}.`,
        `${petMessagesCount} pet messages, ${photoSharesCount} photo shares, ${gentleReactionsCount} gentle reactions, and ${moodCheckinsCount} mood check-ins left traces through the week.`,
        `Latest note from this week: "${featuredPetMessage}".`,
        reward ? `${reward.name} was unlocked for the family pet.` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      unlockedReward: reward
        ? {
            id: reward.id,
            name: reward.name,
          }
        : null,
      rewardClaimed: false,
    },
    summary: {
      subtitle: `${connectedDays} connected day${connectedDays === 1 ? "" : "s"} · ${smallMomentsCount} small moment${smallMomentsCount === 1 ? "" : "s"}`,
      body: [
        `This week, your family shared ${smallMomentsCount} small moment${smallMomentsCount === 1 ? "" : "s"}.`,
        `Latest note from this week: "${featuredPetMessage}".`,
        `${petMessagesCount} pet messages, ${photoSharesCount} photo shares, ${gentleReactionsCount} gentle reactions, and ${moodCheckinsCount} mood check-ins stayed on the board.`,
      ].join("\n"),
    },
    stats: {
      petMessages: petMessagesCount,
      photoShares: photoSharesCount,
      gentleReactions: gentleReactionsCount,
      moodCheckIns: moodCheckinsCount,
      connectedDays,
      smallMoments: smallMomentsCount,
    },
    keepsakes,
  };
}

export const demoWeeklyEchoSummary: DemoWeeklyEchoSummary = buildDemoWeeklyEchoSummary();

const allDemoPetIds = petItems.map((pet) => pet.id);

export const demoPetSelectionSeedByUser: Record<
  string,
  {
    selectedPetId: PetId;
    unlockedPetIds: PetId[];
  }
> = {
  "1": {
    selectedPetId: "white-puppy",
    unlockedPetIds: allDemoPetIds,
  },
  "2": {
    selectedPetId: "white-kitten",
    unlockedPetIds: allDemoPetIds,
  },
  "3": {
    selectedPetId: "corgi-puppy",
    unlockedPetIds: allDemoPetIds,
  },
};
