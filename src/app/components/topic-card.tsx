import { useState } from "react";
import { Send, UserPlus, RefreshCw, X } from "lucide-react";
import { motion } from "motion/react";

interface TopicCardProps {
  topic: string;
  emoji: string;
  index: number;
  isSaved: boolean;
  onSave: () => void;
  onRefresh: () => void;
  onSend: () => void;
}

export function TopicCard({
  topic,
  emoji,
  index,
  onRefresh,
  onSend,
}: TopicCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteSent, setShowInviteSent] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");

  const handleRegenerate = () => {
    if (isRegenerating) return;

    setIsRegenerating(true);

    setTimeout(() => {
      onRefresh();
      setIsRegenerating(false);
    }, 600);
  };

  const handleInviteClick = () => {
    setShowInviteModal(true);
    setShowInviteSent(false);
    setSelectedMember("");
  };

  const handleSelectMember = (member: string) => {
    setSelectedMember(member);
    setShowInviteModal(false);
    setShowInviteSent(true);
  };

  const handleCloseInvite = () => {
    setShowInviteModal(false);
    setShowInviteSent(false);
    setSelectedMember("");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
        className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFE5EC] to-[#FFF0E6] text-2xl">
            {emoji}
          </div>
          <div className="flex-1">
            <motion.p
              key={topic}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[15px] font-medium leading-relaxed text-[#4A4A6A]"
            >
              {topic}
            </motion.p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSend}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFB5C2] to-[#FFCCD5] px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <Send className="h-4 w-4" />
            Send
          </button>

          <button
            onClick={handleInviteClick}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#8B8BA3] shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
          </button>

          <button
            onClick={handleRegenerate}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#8B8BA3] shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </motion.div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#4A4A6A]">
                Invite family member
              </h3>
              <button
                onClick={handleCloseInvite}
                className="rounded-full p-2 text-[#8B8BA3] hover:bg-[#F7F3EE]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["Mom", "Dad", "Grandma", "Grandpa"].map((member) => (
                <button
                  key={member}
                  onClick={() => handleSelectMember(member)}
                  className="rounded-2xl border border-[#E8DED2] bg-[#FFF8FA] px-4 py-4 text-sm font-medium text-[#4A4A6A] transition hover:bg-[#FFEFF4]"
                >
                  {member}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showInviteSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center">
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleCloseInvite}
                className="rounded-full p-2 text-[#8B8BA3] hover:bg-[#F7F3EE]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 text-4xl">💌</div>

            <h3 className="mb-2 text-lg font-semibold text-[#4A4A6A]">
              Invitation sent
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-[#8B8BA3]">
              Your topic invitation has been sent
              {selectedMember ? ` to ${selectedMember}` : ""}.
            </p>

            <button
              onClick={handleCloseInvite}
              className="w-full rounded-2xl bg-[#F6B7C3] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}