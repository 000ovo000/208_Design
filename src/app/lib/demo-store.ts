import { DEMO_MODE } from "../config";
import {
  demoAlbumPosts,
  demoCareMessages,
  demoCurrentUser,
  demoFamilyMembers,
  demoMoodEntries,
  demoMyItems,
  demoPetMessages,
  demoPetSelectionSeedByUser,
  demoWeeklyEchoSummary,
  type DemoAlbumPost,
  type DemoCareMessage,
  type DemoCurrentUser,
  type DemoInventoryState,
  type DemoMoodEntry,
  type DemoPetMessage,
} from "../data/demo-data";
import type { AlbumReaction, FamilyMember, FamilyMemberId } from "../types";

const DEMO_DATA_VERSION_KEY = "kinlight:demo:data-version";
const DEMO_CURRENT_USER_KEY = "kinlight:demo:current-user";
const DEMO_POSTS_KEY = "kinlight:demo:posts";
const DEMO_MOOD_ENTRIES_KEY = "kinlight:demo:mood-entries";
const DEMO_PET_MESSAGES_KEY = "kinlight:demo:pet-messages";
const DEMO_CARE_MESSAGES_KEY = "kinlight:demo:care-messages";
const DEMO_REACTION_COMMENTS_KEY = "kinlight:demo:album-reaction-comments";

export const DEMO_DATA_VERSION = "kinlight-seed-mood-2026-05-08-v2";

function hasWindow() {
  return typeof window !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readJson<T>(key: string) {
  if (!hasWindow()) return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!hasWindow()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function parseDateTime(value?: string) {
  if (!value) return Number.NaN;
  return new Date(value.replace(" ", "T")).getTime();
}

function sortByCreatedAtDescending<T extends { created_at?: string }>(items: T[]) {
  return [...items].sort((first, second) => parseDateTime(second.created_at) - parseDateTime(first.created_at));
}

function seedArray<T>(key: string, seed: T[]) {
  const stored = readJson<T[]>(key);
  if (Array.isArray(stored)) {
    return clone(stored);
  }

  writeJson(key, seed);
  return clone(seed);
}

function clearDemoStorageKeys() {
  if (!hasWindow()) return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("kinlight:demo:")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

function seedDemoLocalStorage() {
  writeJson(DEMO_CURRENT_USER_KEY, demoCurrentUser);
  writeJson(DEMO_POSTS_KEY, demoAlbumPosts);
  writeJson(DEMO_MOOD_ENTRIES_KEY, demoMoodEntries);
  writeJson(DEMO_PET_MESSAGES_KEY, demoPetMessages);
  writeJson(DEMO_CARE_MESSAGES_KEY, demoCareMessages);
  writeJson(DEMO_REACTION_COMMENTS_KEY, {});

  Object.entries(demoPetSelectionSeedByUser).forEach(([userId, petSeed]) => {
    window.localStorage.setItem(getScopedSelectedPetStorageKey(userId), petSeed.selectedPetId);
    writeJson(getScopedUnlockedPetsStorageKey(userId), petSeed.unlockedPetIds);
  });

  Object.entries(demoMyItems).forEach(([userId, inventory]) => {
    writeJson(getDemoInventoryStorageKey(userId), inventory);
  });

  window.localStorage.setItem(DEMO_DATA_VERSION_KEY, DEMO_DATA_VERSION);
}

function ensureDemoDataInitialized() {
  if (!DEMO_MODE || !hasWindow()) return;
  if (window.localStorage.getItem(DEMO_DATA_VERSION_KEY) === DEMO_DATA_VERSION) return;

  clearDemoStorageKeys();
  seedDemoLocalStorage();
}

function findDemoFamilyMember(memberId: FamilyMemberId) {
  return (
    demoFamilyMembers.find(
      (member) =>
        String(member.id) === String(memberId) || String(member.user_id) === String(memberId)
    ) ?? demoFamilyMembers[0]
  );
}

function buildDemoCurrentUser(memberId: FamilyMemberId): DemoCurrentUser {
  const member = findDemoFamilyMember(memberId);
  return {
    id: member.user_id ?? member.id,
    name: member.name,
    email: member.email ?? `${String(member.name).toLowerCase()}@kinlight.demo`,
    family_id: Number(member.family_id ?? 1),
  };
}

function createEmptyInventory(): DemoInventoryState {
  return {
    dailyDropInventory: {},
    weeklyRewardInventory: {},
    activeWeeklyRewardIds: [],
  };
}

function normalizeInventoryState(value: DemoInventoryState | null | undefined) {
  const next = value ?? createEmptyInventory();
  return {
    dailyDropInventory:
      next.dailyDropInventory && typeof next.dailyDropInventory === "object"
        ? next.dailyDropInventory
        : {},
    weeklyRewardInventory:
      next.weeklyRewardInventory && typeof next.weeklyRewardInventory === "object"
        ? next.weeklyRewardInventory
        : {},
    activeWeeklyRewardIds: Array.isArray(next.activeWeeklyRewardIds)
      ? next.activeWeeklyRewardIds.filter((rewardId): rewardId is string => typeof rewardId === "string")
      : [],
  };
}

function getFamilyMemberName(memberId: FamilyMemberId) {
  return findDemoFamilyMember(memberId)?.name ?? "Family member";
}

function getFamilyMemberAvatar(memberId: FamilyMemberId) {
  const member = findDemoFamilyMember(memberId);
  return {
    avatarUrl: member?.avatarUrl ?? member?.avatar_url ?? "",
    avatar_url: member?.avatar_url ?? member?.avatarUrl ?? "",
  };
}

export function getScopedSelectedPetStorageKey(userId: FamilyMemberId) {
  return DEMO_MODE
    ? `kinlight:demo:selectedPetId:${String(userId)}`
    : `kinlight:selectedPetId:${String(userId)}`;
}

export function getScopedUnlockedPetsStorageKey(userId: FamilyMemberId) {
  return DEMO_MODE
    ? `kinlight:demo:unlockedPetIds:${String(userId)}`
    : `kinlight:unlockedPetIds:${String(userId)}`;
}

export function getScopedReactionCommentsStorageKey() {
  return DEMO_MODE ? DEMO_REACTION_COMMENTS_KEY : "kinlight:album-reaction-comments";
}

export function getScopedParentInteractionsStorageKey() {
  return DEMO_MODE ? "kinlight:demo:parentInteractions" : "kinlight:parentInteractions";
}

export function getScopedLatestParentInteractionStorageKey() {
  return DEMO_MODE
    ? "kinlight:demo:latestParentInteraction"
    : "kinlight:latestParentInteraction";
}

export function getDemoInventoryStorageKey(userId: FamilyMemberId) {
  return `kinlight:demo:inventory:${String(userId)}`;
}

export function getDemoDailyDropClaimsStorageKey(userId: FamilyMemberId, date: string) {
  return `kinlight:demo:daily-drop-claims:${String(userId)}:${date}`;
}

export function getDemoWeeklyRewardClaimedStorageKey(
  userId: FamilyMemberId,
  weekStart: string,
  rewardId: string
) {
  return `kinlight:demo:weekly-reward-claimed:${String(userId)}:${weekStart}:${rewardId}`;
}

export function getDemoCurrentUser() {
  ensureDemoDataInitialized();
  const stored = readJson<DemoCurrentUser>(DEMO_CURRENT_USER_KEY);
  if (stored?.id != null) {
    return buildDemoCurrentUser(stored.id);
  }
  return clone(demoCurrentUser);
}

export function setDemoCurrentUser(memberId: FamilyMemberId) {
  ensureDemoDataInitialized();
  const nextUser = buildDemoCurrentUser(memberId);
  writeJson(DEMO_CURRENT_USER_KEY, nextUser);
  if (hasWindow()) {
    window.dispatchEvent(new Event("demo-user-changed"));
  }
  return nextUser;
}

export function getDemoFamilyMembers(): FamilyMember[] {
  ensureDemoDataInitialized();
  const currentUser = getDemoCurrentUser();
  return clone(demoFamilyMembers).map((member) => ({
    ...member,
    is_current_user: String(member.id) === String(currentUser.id),
  }));
}

export function getDemoPosts() {
  ensureDemoDataInitialized();
  return sortByCreatedAtDescending(seedArray(DEMO_POSTS_KEY, demoAlbumPosts));
}

export function createDemoPost(input: {
  userId: FamilyMemberId;
  familyId?: number;
  title?: string;
  content?: string;
  mediaUrl?: string | null;
  mediaType?: string;
}) {
  ensureDemoDataInitialized();
  const member = findDemoFamilyMember(input.userId);
  const avatar = getFamilyMemberAvatar(input.userId);
  const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  const nextPost: DemoAlbumPost = {
    id: `demo-post-${Date.now()}`,
    user_id: member.user_id ?? member.id,
    family_member_id: member.id,
    family_id: Number(input.familyId ?? member.family_id ?? 1),
    title: input.title?.trim() || "Family Update",
    content: input.content?.trim() || "",
    media_url: input.mediaUrl ?? null,
    media_type: input.mediaType ?? (input.mediaUrl ? "image" : "text"),
    created_at: createdAt,
    updated_at: createdAt,
    user_name: member.name,
    authorName: member.name,
    avatarUrl: avatar.avatarUrl,
    avatar_url: avatar.avatar_url,
    reaction: null,
    reaction_comments: [],
  };

  const nextPosts = [nextPost, ...getDemoPosts()];
  writeJson(DEMO_POSTS_KEY, nextPosts);
  return nextPost;
}

export function deleteDemoPost(postId: string) {
  ensureDemoDataInitialized();
  const nextPosts = getDemoPosts().filter((post) => String(post.id) !== String(postId));
  writeJson(DEMO_POSTS_KEY, nextPosts);
}

export function updateDemoPostReaction(postId: string, reaction: AlbumReaction) {
  ensureDemoDataInitialized();
  const nextPosts = getDemoPosts().map((post) =>
    String(post.id) === String(postId) ? { ...post, reaction } : post
  );
  writeJson(DEMO_POSTS_KEY, nextPosts);
}

export function getDemoMoodEntries(scope: "self" | "family", currentUserId?: FamilyMemberId | null) {
  ensureDemoDataInitialized();
  const entries = sortByCreatedAtDescending(seedArray(DEMO_MOOD_ENTRIES_KEY, demoMoodEntries));

  if (scope === "self") {
    return entries.filter((entry) => String(entry.user_id) === String(currentUserId ?? ""));
  }

  return entries.filter((entry) => entry.visibility !== "private");
}

export function addDemoMoodEntry(input: {
  userId: FamilyMemberId;
  familyId?: number;
  mood: string;
  comment?: string;
  visibility: "private" | "soft" | "full";
  entryDate: string;
}) {
  ensureDemoDataInitialized();
  const nextEntry: DemoMoodEntry = {
    id: `demo-mood-${Date.now()}`,
    user_id: String(input.userId),
    user_name: getFamilyMemberName(input.userId),
    family_id: Number(input.familyId ?? 1),
    mood: input.mood,
    comment: input.comment?.trim() || "",
    visibility: input.visibility,
    entry_date: input.entryDate,
    created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  };

  const nextEntries = [nextEntry, ...seedArray(DEMO_MOOD_ENTRIES_KEY, demoMoodEntries)];
  writeJson(DEMO_MOOD_ENTRIES_KEY, nextEntries);
  return nextEntry;
}

export function getDemoPetMessages(receiverUserId: FamilyMemberId) {
  ensureDemoDataInitialized();
  return sortByCreatedAtDescending(seedArray(DEMO_PET_MESSAGES_KEY, demoPetMessages)).filter(
    (message) => String(message.receiver_user_id) === String(receiverUserId)
  );
}

export function createDemoPetMessage(input: {
  senderUserId: FamilyMemberId;
  receiverUserId: FamilyMemberId;
  familyId?: number;
  message: string;
}) {
  ensureDemoDataInitialized();
  const nextMessage: DemoPetMessage = {
    id: `demo-pet-message-${Date.now()}`,
    sender_user_id: String(input.senderUserId),
    receiver_user_id: String(input.receiverUserId),
    family_id: Number(input.familyId ?? 1),
    message: input.message.trim(),
    is_read: false,
    created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    read_at: null,
    sender_name: getFamilyMemberName(input.senderUserId),
  };

  const nextMessages = [nextMessage, ...seedArray(DEMO_PET_MESSAGES_KEY, demoPetMessages)];
  writeJson(DEMO_PET_MESSAGES_KEY, nextMessages);
  return nextMessage;
}

export function markDemoPetMessagesRead(messageIds: Array<string | number>) {
  ensureDemoDataInitialized();
  const ids = new Set(messageIds.map((id) => String(id)));
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const nextMessages = seedArray(DEMO_PET_MESSAGES_KEY, demoPetMessages).map((message) =>
    ids.has(String(message.id))
      ? {
          ...message,
          is_read: true,
          read_at: message.read_at ?? now,
        }
      : message
  );
  writeJson(DEMO_PET_MESSAGES_KEY, nextMessages);
  return nextMessages;
}

function getCareMessageText(senderName: string, careType: string) {
  if (careType === "tea") return `${senderName} sent a gentle check-in and a little tea break.`;
  if (careType === "pet") return `${senderName} sent some quiet company for today.`;
  return `${senderName} sent you a warm hug today.`;
}

export function getDemoCareMessages(receiverUserId: FamilyMemberId, unreadOnly = false) {
  ensureDemoDataInitialized();
  const messages = sortByCreatedAtDescending(seedArray(DEMO_CARE_MESSAGES_KEY, demoCareMessages)).filter(
    (message) => String(message.receiver_user_id) === String(receiverUserId)
  );

  return unreadOnly ? messages.filter((message) => !Boolean(message.is_read)) : messages;
}

export function createDemoCareMessage(input: {
  senderUserId: FamilyMemberId;
  receiverUserId: FamilyMemberId;
  familyId?: number;
  senderName?: string;
  careType: string;
}) {
  ensureDemoDataInitialized();
  const senderName = input.senderName?.trim() || getFamilyMemberName(input.senderUserId);
  const nextMessage: DemoCareMessage = {
    id: `demo-care-message-${Date.now()}`,
    sender_user_id: String(input.senderUserId),
    receiver_user_id: String(input.receiverUserId),
    family_id: Number(input.familyId ?? 1),
    care_type: input.careType,
    message: getCareMessageText(senderName, input.careType),
    is_read: false,
    created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    read_at: null,
    sender_name: senderName,
  };

  const nextMessages = [nextMessage, ...seedArray(DEMO_CARE_MESSAGES_KEY, demoCareMessages)];
  writeJson(DEMO_CARE_MESSAGES_KEY, nextMessages);
  return nextMessage;
}

export function markDemoCareMessageRead(messageId: string | number) {
  ensureDemoDataInitialized();
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const nextMessages = seedArray(DEMO_CARE_MESSAGES_KEY, demoCareMessages).map((message) =>
    String(message.id) === String(messageId)
      ? {
          ...message,
          is_read: true,
          read_at: message.read_at ?? now,
        }
      : message
  );
  writeJson(DEMO_CARE_MESSAGES_KEY, nextMessages);
  return nextMessages;
}

export function getDemoInventory(userId: FamilyMemberId) {
  ensureDemoDataInitialized();
  const key = getDemoInventoryStorageKey(userId);
  const stored = readJson<DemoInventoryState>(key);
  if (stored) {
    return normalizeInventoryState(stored);
  }

  const seeded = normalizeInventoryState(demoMyItems[String(userId)] ?? createEmptyInventory());
  writeJson(key, seeded);
  return seeded;
}

export function setDemoInventory(userId: FamilyMemberId, inventory: DemoInventoryState) {
  ensureDemoDataInitialized();
  const normalized = normalizeInventoryState(inventory);
  writeJson(getDemoInventoryStorageKey(userId), normalized);
  return normalized;
}

export function updateDemoInventory(
  userId: FamilyMemberId,
  updater: (current: DemoInventoryState) => DemoInventoryState
) {
  ensureDemoDataInitialized();
  const current = getDemoInventory(userId);
  return setDemoInventory(userId, updater(current));
}

export function getDemoWeeklyRewardClaimed(
  userId: FamilyMemberId,
  weekStart: string,
  rewardId: string
) {
  ensureDemoDataInitialized();
  if (!hasWindow()) return false;
  return (
    window.localStorage.getItem(
      getDemoWeeklyRewardClaimedStorageKey(userId, weekStart, rewardId)
    ) === "true"
  );
}

export function setDemoWeeklyRewardClaimed(
  userId: FamilyMemberId,
  weekStart: string,
  rewardId: string
) {
  ensureDemoDataInitialized();
  if (!hasWindow()) return;
  window.localStorage.setItem(
    getDemoWeeklyRewardClaimedStorageKey(userId, weekStart, rewardId),
    "true"
  );
}

export function getDemoWeeklyEchoBundle(userId: FamilyMemberId) {
  ensureDemoDataInitialized();
  const bundle = clone(demoWeeklyEchoSummary);
  const rewardId = bundle.report.unlockedReward?.id ?? "";
  bundle.report.rewardClaimed = rewardId
    ? getDemoWeeklyRewardClaimed(userId, bundle.report.weekStartDate, rewardId)
    : false;
  return bundle;
}
