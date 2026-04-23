import { User, Users, Plus, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

type FamilyMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
};

const familyMembers: FamilyMember[] = [
  {
    id: 1,
    name: "Mom",
    role: "Mother",
    avatar: "👩",
  },
  {
    id: 2,
    name: "Dad",
    role: "Father",
    avatar: "👨",
  },
  {
    id: 3,
    name: "Grandma",
    role: "Grandmother",
    avatar: "👵",
  },
  {
    id: 4,
    name: "Grandpa",
    role: "Grandfather",
    avatar: "👴",
  },
];

export function ProfilePage() {
  return (
    <div className="flex h-full flex-col bg-[#F8F4EF]">
      <div className="hide-scrollbar flex-1 overflow-y-auto px-6 pt-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-3xl font-semibold text-[#4A4A6A]">Profile</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8B8BA3]">
            Manage your account and family connections
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mt-6 rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-[#8B8BA3]" />
            <h2 className="text-base font-semibold text-[#4A4A6A]">
              Personal Info
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFF0E6] text-2xl">
              🙋‍♀️
            </div>

            <div className="flex-1">
              <p className="text-base font-semibold text-[#4A4A6A]">Andy</p>
              <p className="mt-1 text-sm text-[#8B8BA3]">View and edit your profile</p>
            </div>

            <ChevronRight className="h-5 w-5 text-[#B5B2BC]" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mt-6 rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#8B8BA3]" />
            <h2 className="text-base font-semibold text-[#4A4A6A]">
              Family
            </h2>
          </div>

          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-3xl bg-[#F8F4EF] px-4 py-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFF0E6] text-2xl">
                  {member.avatar}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#4A4A6A]">
                    {member.name}
                  </p>
                  <p className="mt-1 text-sm text-[#8B8BA3]">{member.role}</p>
                </div>

                <ChevronRight className="h-5 w-5 text-[#B5B2BC]" />
              </div>
            ))}

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-[#D8CEC2] bg-[#FFFDF9] px-4 py-4 text-sm font-medium text-[#6B5B73] transition hover:bg-[#F7F3EE]"
            >
              <Plus className="h-4 w-4" />
              Add family member
            </button>
          </div>
        </motion.div>

        {/* future sections can be added here */}
      </div>
    </div>
  );
}