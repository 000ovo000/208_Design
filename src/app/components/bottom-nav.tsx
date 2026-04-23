import { Home, Heart, Lightbulb, User } from "lucide-react";
import { motion } from "motion/react";

type TabKey = "home" | "connect" | "jar" | "profile";

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navItems = [
    { key: "home" as TabKey, icon: Home, label: "Home" },
    { key: "connect" as TabKey, icon: Lightbulb, label: "Connect" },
    { key: "jar" as TabKey, icon: Heart, label: "Mood Jar" },
    { key: "profile" as TabKey, icon: User, label: "Profile" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/50 px-6 pb-6 pt-3 rounded-t-3xl shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.key;

          return (
            <motion.button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#FFE5EC] to-[#FFF0E6]"
                  : "hover:bg-white/50"
              }`}
            >
              <item.icon
                className={`w-6 h-6 ${
                  isActive ? "text-[#FF6B9D]" : "text-[#8B8BA3]"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-[#FF6B9D]" : "text-[#8B8BA3]"
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}