import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

export function ChatPreview() {
  return (
    <motion.div
      className="px-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#6B6B85]">Recent chats</h3>
        <button className="text-xs text-[#FFB5C2] font-medium flex items-center gap-1 hover:gap-2 transition-all">
          View all
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Chat Preview 1 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A5D8FF] to-[#C5E7FF] flex items-center justify-center text-lg">
              👩
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#4A4A6A]">Mom</p>
              <p className="text-xs text-[#8B8BA3]">2 hours ago</p>
            </div>
          </div>
          <p className="text-sm text-[#6B6B85] leading-relaxed">
            "That sounds wonderful! I'm so proud of how you're handling everything..."
          </p>
        </div>

        {/* Chat Preview 2 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFF0E6] flex items-center justify-center text-lg">
              👨
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#4A4A6A]">Dad</p>
              <p className="text-xs text-[#8B8BA3]">Yesterday</p>
            </div>
          </div>
          <p className="text-sm text-[#6B6B85] leading-relaxed">
            "We should definitely plan that visit soon. Let me know your schedule!"
          </p>
        </div>
      </div>
    </motion.div>
  );
}
