import { Bell, Dog, ShieldCheck, UserRound } from "lucide-react";
import { FamilyMember } from "../types";
import { usePet } from "../context/pet-context";

interface ProfilePageProps {
  familyMembers: FamilyMember[];
}

export function ProfilePage({ familyMembers }: ProfilePageProps) {
  const me = familyMembers.find((member) => member.id === "me");
  const { currentPet } = usePet();

  return (
    <div className="flex h-full flex-col bg-[#f7efe7]">
      <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pt-5 pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9f8067]">
          Settings
        </p>
        <h1 className="mt-2 text-[30px] font-semibold text-[#3d2d22]">
          个人设置
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#8b705d]">
          管理当前账号、家庭关系和小狗提醒方式。
        </p>

        <section className="mt-6 rounded-[30px] border border-white/80 bg-white/86 p-5 shadow-[0_14px_30px_rgba(84,62,44,0.08)]">
          <div className="flex items-center gap-4">
            <div className="rounded-[26px] bg-[#f7efe7] p-3">
              <img
                src={currentPet.image}
                alt={currentPet.name}
                className="h-[86px] w-[132px] object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-[#463326]">{me?.name ?? "我"}</p>
              <p className="mt-1 text-sm text-[#8b705d]">
                当前绑定宠物：{currentPet.name}
              </p>
            </div>
            <UserRound className="h-5 w-5 text-[#8b705d]" />
          </div>
        </section>

        <section className="mt-5 space-y-3">
          {[
            {
              icon: Dog,
              title: "家庭成员",
              desc: `当前已连接 ${familyMembers.length} 位家庭成员`,
            },
            {
              icon: Bell,
              title: "通知提醒",
              desc: "上传新图片后提醒首页狗狗同步更新",
            },
            {
              icon: ShieldCheck,
              title: "隐私设置",
              desc: "图片按个人相册独立展示，仅显示上传时间",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-white/80 bg-white/80 px-5 py-4 shadow-[0_10px_24px_rgba(84,62,44,0.06)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7efe7] text-[#6d5645]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#463326]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#8b705d]">{item.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
