import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "./components/bottom-nav";
import { JarPage } from "./pages/jar-page";
import { ChatPage } from "./pages/chat-page";
import { ConnectPage } from "./pages/connect-page";
import { ProfilePage } from "./pages/profile-page";
import { WeeklyEchoPage } from "./pages/weekly-echo-page";
import { PetProvider } from "./context/pet-context";
import { familyMembers, initialAlbumEntries } from "./data/family-data";
import type { WeeklyReward, WeeklyRewardStats } from "./data/weekly-rewards";
import { AlbumEntry, FamilyMember, FamilyMemberId, TabKey } from "./types";

type CurrentUser = {
  id: string | number;
  name?: string;
  email?: string;
  family_id?: string | number;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [albumEntries, setAlbumEntries] = useState<AlbumEntry[]>(initialAlbumEntries);
  const [dbFamilyMembers, setDbFamilyMembers] = useState<FamilyMember[]>(familyMembers);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [weeklyKeepsakes, setWeeklyKeepsakes] = useState<WeeklyReward[]>([]);
  const [homeBubbleMessage, setHomeBubbleMessage] = useState("今天想让小狗帮你传什么话？");
  const [latestMePostEntry, setLatestMePostEntry] = useState<AlbumEntry | null>(null);

  const isCurrentUserMember = (member: FamilyMember, user: CurrentUser | null) => {
    if (!member || !user) return false;
    return (
      String(member.id) === String(user.id) ||
      Boolean(member.email && user.email && member.email === user.email)
    );
  };

  useEffect(() => {
    const loadFamilyMembers = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/family-members");
        if (!response.ok) return;
        const data = await response.json().catch(() => []);
        if (Array.isArray(data) && data.length) setDbFamilyMembers(data);
      } catch (error) {
        // fallback to local demo members
      }
    };
    void loadFamilyMembers();
  }, [currentUser?.id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/me");
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
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchCurrentUser();
      }
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLatestMePost = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/posts");
        if (!response.ok) return;

        const data = await response.json().catch(() => []);
        const posts = Array.isArray(data) ? data : [];
        const fallbackCurrentMember = dbFamilyMembers[0] ?? null;
        const currentMember =
          dbFamilyMembers.find((member) => isCurrentUserMember(member, currentUser)) ??
          fallbackCurrentMember;
        const mePost = posts.find(
          (post) =>
            String(post?.family_member_id ?? post?.user_id) === String(currentMember?.id)
        );

        if (!isMounted || !mePost) return;

        const mappedEntry: AlbumEntry = {
          id: `post-${mePost.id}`,
          memberId: String(mePost.family_member_id ?? mePost.user_id ?? ""),
          imageUrl: mePost.media_url || "/images/dog/profile/dog-white.png",
          uploadedAt: mePost.created_at || new Date().toISOString().slice(0, 16).replace("T", " "),
          dogMessage: mePost.content || "",
          reaction: null,
        };

        setLatestMePostEntry(mappedEntry);
        if ((mePost.content || "").trim()) {
          setHomeBubbleMessage(mePost.content.trim());
        }
      } catch (error) {
        // Keep existing local fallback when backend is unavailable.
      }
    };

    void loadLatestMePost();

    return () => {
      isMounted = false;
    };
  }, [currentUser, dbFamilyMembers]);

  const latestEntries = useMemo(() => {
    const localLatestEntries = dbFamilyMembers.reduce<Record<FamilyMemberId, AlbumEntry | null>>(
      (accumulator, member) => {
        accumulator[member.id] =
          albumEntries.find((entry) => entry.memberId === member.id) ?? null;
        return accumulator;
      },
      {}
    );

    if (latestMePostEntry && latestMePostEntry.memberId != null) {
      localLatestEntries[latestMePostEntry.memberId] = latestMePostEntry;
    }

    return localLatestEntries;
  }, [albumEntries, latestMePostEntry, dbFamilyMembers]);

  const weeklyAlbumEntries = useMemo(() => {
    return albumEntries.filter((entry) => {
      const parsed = new Date(entry.uploadedAt.replace(" ", "T"));
      if (Number.isNaN(parsed.getTime())) return false;

      const latestDate = new Date("2026-05-02T23:59:59");
      const diffDays =
        (latestDate.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });
  }, [albumEntries]);

  const weeklyStats = useMemo<WeeklyRewardStats>(() => {
    return {
      petMessages: weeklyAlbumEntries.filter((entry) => entry.dogMessage.trim()).length,
      photoShares: weeklyAlbumEntries.length,
      gentleReactions: weeklyAlbumEntries.filter((entry) => entry.reaction).length,
      moodCheckIns: 3,
      connectedDays: new Set(
        weeklyAlbumEntries.map((entry) => entry.uploadedAt.split(" ")[0])
      ).size,
    };
  }, [weeklyAlbumEntries]);

  const handleWeeklyKeepsakeAdd = (reward: WeeklyReward) => {
    setWeeklyKeepsakes((prev) =>
      prev.some((item) => item.id === reward.id) ? prev : [...prev, reward]
    );
  };

  const handleAlbumEntryCreate = (entry: AlbumEntry) => {
    setAlbumEntries((prev) => [entry, ...prev]);
    const fallbackCurrentMember = dbFamilyMembers[0] ?? null;
    const currentMember =
      dbFamilyMembers.find((member) => isCurrentUserMember(member, currentUser)) ??
      fallbackCurrentMember;
    if (String(entry.memberId) === String(currentMember?.id)) {
      setHomeBubbleMessage(
        entry.dogMessage.trim() || `${currentMember?.name ?? "当前成员"}的小狗有一张照片想给你看。`
      );
      setActiveTab("home");
    }
  };

  const handleAlbumEntryReactionChange = (
    entryId: string,
    reaction: AlbumEntry["reaction"]
  ) => {
    setAlbumEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, reaction } : entry))
    );
  };
  const handleFamilyMembersChange = (members: FamilyMember[]) => {
    setDbFamilyMembers(members);
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return (
          <ChatPage
            familyMembers={dbFamilyMembers}
            latestEntries={latestEntries}
            bubbleMessage={homeBubbleMessage}
            weeklyKeepsakes={weeklyKeepsakes}
          />
        );

      case "album":
        return (
          <ConnectPage
            familyMembers={dbFamilyMembers}
            albumEntries={albumEntries}
            onCreateEntry={handleAlbumEntryCreate}
            onUpdateReaction={handleAlbumEntryReactionChange}
          />
        );

      case "jar":
        return <JarPage />;

      case "echo":
        return (
          <WeeklyEchoPage
            stats={weeklyStats}
            weeklyAlbumEntries={weeklyAlbumEntries}
            familyMembers={dbFamilyMembers}
            weeklyKeepsakes={weeklyKeepsakes}
            onAddKeepsake={handleWeeklyKeepsakeAdd}
            addedKeepsakeIds={weeklyKeepsakes.map((item) => item.id)}
          />
        );

      case "profile":
        return (
          <ProfilePage
            familyMembers={dbFamilyMembers}
            onFamilyMembersChange={handleFamilyMembersChange}
          />
        );

      default:
        return (
          <ChatPage
            familyMembers={dbFamilyMembers}
            latestEntries={latestEntries}
            bubbleMessage={homeBubbleMessage}
            weeklyKeepsakes={weeklyKeepsakes}
          />
        );
    }
  };

  return (
    <PetProvider
      key={currentUser?.id != null ? String(currentUser.id) : "guest"}
      currentUserId={currentUser?.id ?? null}
    >
      <div className="app-stage">
        <div className="app-bg-pattern app-bg-pattern-1" />
        <div className="app-bg-pattern app-bg-pattern-2" />
        <div className="app-bg-dots" />

        <div className="iphone-frame-shell">
          <div className="iphone-screen">
          <header className="iphone-status-bar">
            <span className="iphone-time">9:41</span>

            <div className="iphone-status-icons" aria-label="phone status">
              <span className="signal-icon" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>

              <span className="wifi-icon" aria-hidden="true">
                <svg viewBox="0 0 18 12" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3.45 4.45C6.35 2.4 11.65 2.4 14.55 4.45"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M6.05 7.1C7.7 5.95 10.3 5.95 11.95 7.1"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M9 9.92
                       C8.32 9.92 7.78 9.42 7.78 8.84
                       C8.14 8.52 8.5 8.3 9 8.3
                       C9.5 8.3 9.86 8.52 10.22 8.84
                       C10.22 9.42 9.68 9.92 9 9.92Z"
                    fill="currentColor"
                  />
                </svg>
              </span>

              <span className="battery-icon" aria-hidden="true">
                <span className="battery-level"></span>
              </span>
            </div>
          </header>

          <main className="iphone-content">{renderPage()}</main>

          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>
    </PetProvider>
  );
}
