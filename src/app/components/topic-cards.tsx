import { useState } from "react";
import { Bell, Check, RefreshCw, X } from "lucide-react";
import { motion } from "motion/react";
import { TopicCard } from "./topic-card";

const allTopics = [
  {
    id: 1,
    topic: "What's a small victory you had this week that made you smile?",
    emoji: "✨",
  },
  {
    id: 2,
    topic: "If you could share a meal together right now, what would you want to eat?",
    emoji: "🍜",
  },
  {
    id: 3,
    topic: "What's something new you've been curious about lately?",
    emoji: "🌱",
  },
  {
    id: 4,
    topic: "What's one song you've been listening to a lot recently?",
    emoji: "🎵",
  },
  {
    id: 5,
    topic: "Did anything small make your day a little better lately?",
    emoji: "☀️",
  },
  {
    id: 6,
    topic: "What's something you're looking forward to this week?",
    emoji: "🎈",
  },
  {
    id: 7,
    topic: "Is there a place you've been wanting to visit again?",
    emoji: "📍",
  },
  {
    id: 8,
    topic: "What's a food that always makes you feel comforted?",
    emoji: "🍲",
  },
  {
    id: 9,
    topic: "What's something funny or cute you saw recently?",
    emoji: "😄",
  },
  {
    id: 10,
    topic: "What's one thing you've been meaning to share but haven't yet?",
    emoji: "💌",
  },
  {
    id: 11,
    topic: "What kind of weather matches your mood today?",
    emoji: "🌤️",
  },
  {
    id: 12,
    topic: "What's a small routine that helps you feel grounded?",
    emoji: "🫖",
  },
  {
    id: 13,
    topic: "If today had a color, what color would it be?",
    emoji: "🎨",
  },
];

const initialInvites = [
  {
    id: 1,
    sender: "Mom",
    topic: "What kind of weather matches your mood today?",
  },
  {
    id: 2,
    sender: "Grandma",
    topic: "What's something funny or cute you saw recently?",
  },
];

function getRandomUniqueTopics(count: number) {
  const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface TopicCardsProps {
  onSendTopic: (topic: string) => void;
}

export function TopicCards({ onSendTopic }: TopicCardsProps) {
  const [savedCards, setSavedCards] = useState<number[]>([]);
  const [displayedTopics, setDisplayedTopics] = useState(() =>
    getRandomUniqueTopics(3)
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invites, setInvites] = useState(initialInvites);

  const handleSave = (id: number) => {
    if (savedCards.includes(id)) {
      setSavedCards(savedCards.filter((cardId) => cardId !== id));
    } else {
      setSavedCards([...savedCards, id]);
    }
  };

  const handleRefreshAll = () => {
    setDisplayedTopics(getRandomUniqueTopics(3));
  };

  const handleRefreshOne = (index: number) => {
    const currentIds = displayedTopics.map((item) => item.id);

    const availableTopics = allTopics.filter(
      (item) => !currentIds.includes(item.id)
    );

    if (availableTopics.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableTopics.length);
    const newTopic = availableTopics[randomIndex];

    const updatedTopics = [...displayedTopics];
    updatedTopics[index] = newTopic;

    setDisplayedTopics(updatedTopics);
  };

  const handleDismissInvite = (id: number) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== id));
  };

  const handleAcceptInvite = (id: number, topic: string) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== id));
    setShowInviteModal(false);
    onSendTopic(topic);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-6 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-3xl font-semibold text-[#4A4A6A]">
                Gentle Topics
              </h1>

              <button
                onClick={handleRefreshAll}
                className="flex items-center gap-2 rounded-full border border-white/50 bg-white px-4 py-2 text-sm font-medium text-[#4A4A6A] shadow-sm transition hover:bg-[#FFF7FA]"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-[#8B8BA3]">
              Here are some gentle topics you can start with today
            </p>
          </motion.div>
        </div>

        <motion.div
          className="mb-6 px-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-4 rounded-3xl border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFF0E6] text-3xl">
              🐻
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-[#4A4A6A]">
                Share a little about your day
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#8B8BA3]">
                You have {invites.length} new invitations
              </p>
            </div>

            <button
              onClick={() => setShowInviteModal(true)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FFF3F7] text-[#FF9BB2] transition hover:bg-[#FFE8F0]"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div className="mb-6 space-y-4 px-6">
          {displayedTopics.map((topic, index) => (
            <TopicCard
              key={`${topic.id}-${index}`}
              topic={topic.topic}
              emoji={topic.emoji}
              index={index}
              isSaved={savedCards.includes(topic.id)}
              onSave={() => handleSave(topic.id)}
              onRefresh={() => handleRefreshOne(index)}
              onSend={() => onSendTopic(topic.topic)}
            />
          ))}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-6">
          <div className="w-full max-w-md rounded-3xl bg-[#F8F4EF] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#4A4A6A]">
                Family invitations
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-full p-2 text-[#8B8BA3] hover:bg-white/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {invites.length === 0 ? (
              <div className="rounded-3xl bg-white/80 px-4 py-8 text-center text-sm text-[#8B8BA3]">
                No invitations for now
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-3xl border border-white/50 bg-white/90 p-4 shadow-sm"
                  >
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[#4A4A6A]">
                        {invite.sender}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[#8B8BA3]">
                        {invite.topic}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDismissInvite(invite.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8DED2] bg-white text-[#8B8BA3] transition hover:bg-[#F7F3EE]"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleAcceptInvite(invite.id, invite.topic)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F6B7C3] text-white transition hover:opacity-90"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}