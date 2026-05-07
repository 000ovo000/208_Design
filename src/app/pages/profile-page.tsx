import { useEffect, useState } from "react";
import { Plus, Trash2, UserRound, X } from "lucide-react";
import { FamilyMember } from "../types";
import { usePet } from "../context/pet-context";
import { DEMO_MODE } from "../config";
import { apiUrl } from "../lib/api";
import {
  getDemoCurrentUser,
  getDemoFamilyMembers,
  setDemoCurrentUser,
} from "../lib/demo-store";

interface ProfilePageProps {
  familyMembers: FamilyMember[];
  onFamilyMembersChange?: (members: FamilyMember[]) => void;
}

type DbFamilyMember = {
  id: string | number;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  family_id?: string | number;
};
type CurrentUser = {
  id: string | number;
  name?: string;
  email?: string;
  family_id?: string | number;
};

export function ProfilePage({ familyMembers, onFamilyMembersChange }: ProfilePageProps) {
  const { currentPet } = usePet();

  const [dbFamilyMembers, setDbFamilyMembers] = useState<DbFamilyMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSwitchAccountOpen, setIsSwitchAccountOpen] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  const isCurrentUserMember = (member?: FamilyMember | null) => {
    if (!member || !currentUser) return false;
    return (
      String(member.id) === String(currentUser.id) ||
      Boolean(member.email && currentUser.email && member.email === currentUser.email)
    );
  };
  const currentMember =
    familyMembers.find((member) => isCurrentUserMember(member)) ?? familyMembers[0] ?? null;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (DEMO_MODE) {
        setCurrentUser(getDemoCurrentUser());
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/me"));
        if (!response.ok) throw new Error("Failed to fetch current user");
        const user = await response.json();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    void fetchCurrentUser();
    const refreshOnFocus = () => {
      void fetchCurrentUser();
    };
    const refreshOnDemoUserChanged = () => {
      void fetchCurrentUser();
    };
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchCurrentUser();
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("demo-user-changed", refreshOnDemoUserChanged);
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("demo-user-changed", refreshOnDemoUserChanged);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, []);

  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (DEMO_MODE) {
        const members = getDemoFamilyMembers();
        setDbFamilyMembers(members);
        onFamilyMembersChange?.(members);
        setIsLoadingMembers(false);
        return;
      }

      try {
        const familyId = currentUser?.family_id ?? currentMember?.family_id ?? 1;
        const response = await fetch(apiUrl(`/api/family-members?family_id=${familyId}`));
        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to load family members:", data);
          return;
        }

        setDbFamilyMembers(data);
        onFamilyMembersChange?.(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to connect backend:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    void loadFamilyMembers();
  }, [currentUser, currentMember, onFamilyMembersChange]);

  const handleAddFamilyMember = async () => {
    if (!newMemberName.trim() || isAddingMember) return;

    if (DEMO_MODE) {
      const nextMember: DbFamilyMember = {
        id: `demo-member-${Date.now()}`,
        name: newMemberName.trim(),
        email: newMemberEmail.trim() || null,
        role: newMemberRole,
        family_id: currentUser?.family_id ?? currentMember?.family_id ?? 1,
      };
      const nextMembers = [...dbFamilyMembers, nextMember];
      setDbFamilyMembers(nextMembers);
      onFamilyMembersChange?.(nextMembers as FamilyMember[]);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("member");
      setIsAddMemberOpen(false);
      return;
    }

    try {
      setIsAddingMember(true);

      const response = await fetch(apiUrl("/api/family-members"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMemberName.trim(),
          email: newMemberEmail.trim(),
          role: newMemberRole,
          family_id: currentUser?.family_id ?? currentMember?.family_id ?? 1,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to add family member:", result);
        alert(result.error || "Failed to add family member.");
        return;
      }

      const nextMembers = [...dbFamilyMembers, result];
      setDbFamilyMembers(nextMembers);
      onFamilyMembersChange?.(nextMembers);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("member");
      setIsAddMemberOpen(false);
    } catch (error) {
      console.error("Failed to connect backend:", error);
      alert("Failed to connect backend.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleDeleteFamilyMember = async (memberId: string | number) => {
    const confirmed = window.confirm("Delete this family member?");
    if (!confirmed) return;

    if (DEMO_MODE) {
      const nextMembers = dbFamilyMembers.filter(
        (member) => String(member.id) !== String(memberId)
      );
      setDbFamilyMembers(nextMembers);
      onFamilyMembersChange?.(nextMembers as FamilyMember[]);
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/family-members/${memberId}`), {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Failed to delete family member:", result);
        alert(result?.error || "Failed to delete family member.");
        return;
      }

      const nextMembers = dbFamilyMembers.filter(
        (member) => String(member.id) !== String(memberId)
      );
      setDbFamilyMembers(nextMembers);
      onFamilyMembersChange?.(nextMembers);
    } catch (error) {
      console.error("Failed to connect backend:", error);
      alert("Failed to connect backend.");
    }
  };

  const handleSwitchAccount = async (targetUserId: string | number) => {
    if (isSwitchingAccount) return;

    if (DEMO_MODE) {
      setIsSwitchingAccount(true);
      try {
        const nextUser = setDemoCurrentUser(String(targetUserId));
        setCurrentUser(nextUser);
        setIsSwitchAccountOpen(false);
        window.location.reload();
      } finally {
        setIsSwitchingAccount(false);
      }
      return;
    }

    const normalizedUserId = Number(targetUserId);
    if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
      alert(`Invalid target user id: ${String(targetUserId)}`);
      return;
    }

    try {
      setIsSwitchingAccount(true);
      const response = await fetch(apiUrl("/api/me/switch"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: normalizedUserId }),
      });
      const rawText = await response.text();
      let result: { error?: string; user?: CurrentUser; message?: string } | null = null;
      try {
        result = rawText ? JSON.parse(rawText) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        const backendMessage = result?.error || result?.message || rawText || "Unknown backend error";
        console.error("Switch account failed", {
          status: response.status,
          statusText: response.statusText,
          body: rawText,
        });
        alert(`Switch account failed (${response.status}): ${backendMessage}`);
        return;
      }

      setCurrentUser(result?.user ?? null);
      setIsSwitchAccountOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Switch account request error:", error);
      alert(`Failed to switch account: ${error instanceof Error ? error.message : "Network error"}`);
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-[#f7efe7]">
      <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pt-5 pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9f8067]">
          Settings
        </p>

        <h1 className="mt-2 text-[30px] font-semibold text-[#3d2d22]">
          Profile Settings
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#8b705d]">
          Manage your current account, family members, and pet preferences.
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
              <p className="text-lg font-semibold text-[#463326]">
                {currentMember?.name ?? "Me"}
              </p>
              <p className="mt-1 text-sm text-[#8b705d]">
                Current pet: {currentPet.name}
              </p>
            </div>

            <UserRound className="h-5 w-5 text-[#8b705d]" />
          </div>
          <button
            type="button"
            onClick={() => setIsSwitchAccountOpen(true)}
            className="mt-4 w-full rounded-[16px] border border-[#eadfd6] bg-[#f7efe7] px-4 py-2 text-sm font-medium text-[#6d5645]"
          >
            Switch account
          </button>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/80 bg-white/80 px-5 py-4 shadow-[0_10px_24px_rgba(84,62,44,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[#463326]">
                Family Members
              </p>
              <p className="mt-1 text-sm text-[#8b705d]">
                Synced from MySQL
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7efe7] text-[#6d5645]"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {isLoadingMembers ? (
              <p className="text-sm text-[#8b705d]">Loading...</p>
            ) : dbFamilyMembers.length === 0 ? (
              <p className="text-sm text-[#8b705d]">No family members yet.</p>
            ) : (
              dbFamilyMembers.map((member) => {
                const isProtectedMember =
                  currentMember && String(member.id) === String(currentMember.id);

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-[22px] bg-[#f7efe7] px-4 py-3"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#6d5645]">
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#463326]">
                        {member.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#8b705d]">
                        {member.email ?? "No email"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#8b705d]">
                        {member.role ?? "member"}
                      </span>

                      {!isProtectedMember && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFamilyMember(member.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#9b6b5a]"
                          aria-label={`Delete ${member.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {isAddMemberOpen && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/10 px-5">
          <div className="w-full max-w-[340px] rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_20px_50px_rgba(84,62,44,0.18)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[#463326]">
                  Add Family Member
                </p>
                <p className="mt-1 text-sm text-[#8b705d]">
                  New members will be saved to MySQL.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3eee9] text-[#6d5645]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-[18px] border border-[#eadfd6] bg-[#f7efe7] px-4 py-3 text-sm text-[#463326] outline-none placeholder:text-[#a7907d]"
              />

              <input
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-[18px] border border-[#eadfd6] bg-[#f7efe7] px-4 py-3 text-sm text-[#463326] outline-none placeholder:text-[#a7907d]"
              />

              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="w-full rounded-[18px] border border-[#eadfd6] bg-[#f7efe7] px-4 py-3 text-sm text-[#463326] outline-none"
              >
                <option value="member">member</option>
                <option value="child">child</option>
                <option value="parent">parent</option>
                <option value="grandparent">grandparent</option>
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="rounded-full bg-[#f3eee9] px-4 py-2 text-sm font-medium text-[#6d5645]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddFamilyMember}
                disabled={!newMemberName.trim() || isAddingMember}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  newMemberName.trim() && !isAddingMember
                    ? "bg-[#6d5645] text-white"
                    : "bg-[#ddd2c8] text-[#9a8573]"
                }`}
              >
                {isAddingMember ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSwitchAccountOpen && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/10 px-5">
          <div className="w-full max-w-[340px] rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_20px_50px_rgba(84,62,44,0.18)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[#463326]">Switch Account</p>
                <p className="mt-1 text-sm text-[#8b705d]">Choose the account to use right now.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsSwitchAccountOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3eee9] text-[#6d5645]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[280px] space-y-2 overflow-y-auto">
              {dbFamilyMembers.map((member) => {
                const isCurrent = String(member.id) === String(currentUser?.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    disabled={isSwitchingAccount || isCurrent}
                    onClick={() => void handleSwitchAccount(member.id)}
                    className={`flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left ${
                      isCurrent ? "bg-[#efe5db]" : "bg-[#f7efe7]"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[#463326]">{member.name}</span>
                      <span className="block text-xs text-[#8b705d]">{member.email ?? "No email"}</span>
                    </span>
                    <span className="text-xs font-medium text-[#6d5645]">
                      {isCurrent ? "Current" : isSwitchingAccount ? "Switching..." : "Switch"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
