export type DemoCareMessageType = "love" | "hug" | "cheer" | "miss" | "care" | "custom";

type ResolveDemoCareMessageTypeInput = {
  careType?: string | null;
  messageType?: string | null;
  message?: string | null;
};

type BuildDemoCareMessageTextInput = {
  senderName?: string | null;
  messageType?: DemoCareMessageType | null;
  message?: string | null;
};

const demoCareMessageTypes = new Set<DemoCareMessageType>([
  "love",
  "hug",
  "cheer",
  "miss",
  "care",
  "custom",
]);

function normalizeToken(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function isDemoCareMessageType(value: string | null | undefined): value is DemoCareMessageType {
  return demoCareMessageTypes.has(normalizeToken(value) as DemoCareMessageType);
}

export function resolveDemoCareMessageType({
  careType,
  messageType,
  message,
}: ResolveDemoCareMessageTypeInput): DemoCareMessageType | null {
  if (isDemoCareMessageType(messageType)) {
    return normalizeToken(messageType) as DemoCareMessageType;
  }

  const normalizedCareType = normalizeToken(careType);

  if (normalizedCareType === "love" || normalizedCareType === "pet") {
    return "love";
  }
  if (normalizedCareType === "hug") {
    return "hug";
  }
  if (normalizedCareType === "cheer") {
    return "cheer";
  }
  if (normalizedCareType === "miss") {
    return "miss";
  }
  if (normalizedCareType === "custom") {
    return "custom";
  }
  if (normalizedCareType === "care") {
    const normalizedMessage = normalizeToken(message);
    if (normalizedMessage.includes("warm hug")) {
      return "love";
    }
    return "care";
  }

  return null;
}

export function buildDemoCareMessageText({
  senderName,
  messageType,
  message,
}: BuildDemoCareMessageTextInput) {
  const resolvedSenderName = senderName?.trim() || "Family member";
  const normalizedMessageType = messageType ? (normalizeToken(messageType) as DemoCareMessageType) : null;

  switch (normalizedMessageType) {
    case "love":
      return `${resolvedSenderName} sent you some love today.`;
    case "hug":
      return `${resolvedSenderName} sent you a warm hug today.`;
    case "cheer":
      return `${resolvedSenderName} cheered you on today.`;
    case "miss":
      return `${resolvedSenderName} missed you today.`;
    case "custom": {
      const trimmedMessage = message?.trim();
      const customPrefix = `${resolvedSenderName} says:`;
      const customBody = trimmedMessage?.startsWith(customPrefix)
        ? trimmedMessage.slice(customPrefix.length).trim()
        : trimmedMessage;
      return customBody
        ? `${resolvedSenderName} says: ${customBody}`
        : `${resolvedSenderName} sent you a little care today.`;
    }
    case "care":
    default:
      return `${resolvedSenderName} sent you a little care today.`;
  }
}

export function getDemoCareMessageText(input: {
  senderName?: string | null;
  careType?: string | null;
  messageType?: string | null;
  message?: string | null;
}) {
  const resolvedMessageType = resolveDemoCareMessageType(input);
  if (!resolvedMessageType) {
    const trimmedMessage = input.message?.trim();
    if (trimmedMessage) return trimmedMessage;
    return buildDemoCareMessageText({
      senderName: input.senderName,
      messageType: "care",
    });
  }

  return buildDemoCareMessageText({
    senderName: input.senderName,
    messageType: resolvedMessageType,
    message: input.message,
  });
}
