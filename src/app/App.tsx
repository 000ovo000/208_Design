import { useMemo, useState } from "react";
import { BottomNav } from "./components/bottom-nav";
import { JarPage } from "./pages/jar-page";
import { ChatPage } from "./pages/chat-page";
import { ConnectPage } from "./pages/connect-page";
import { ProfilePage } from "./pages/profile-page";
import { WeeklyEchoPage } from "./pages/weekly-echo-page";
import { PetProvider } from "./context/pet-context";
import { familyMembers, initialAlbumEntries } from "./data/family-data";
import type { WeeklyReward, WeeklyRewardStats } from "./data/weekly-rewards";
import { AlbumEntry, FamilyMemberId, TabKey } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const [albumEntries, setAlbumEntries] = useState<AlbumEntry[]>(initialAlbumEntries);
  const [weeklyKeepsakes, setWeeklyKeepsakes] = useState<WeeklyReward[]>([]);
  const [homeBubbleMessage, setHomeBubbleMessage] = useState(
    initialAlbumEntries.find((entry) => entry.memberId === "me" && entry.dogMessage)?.dogMessage ||
      "What do you want your pet to say today?"
  );

  const latestEntries = useMemo(() => {
    return familyMembers.reduce<Record<FamilyMemberId, AlbumEntry | null>>(
      (accumulator, member) => {
        accumulator[member.id] =
          albumEntries.find((entry) => entry.memberId === member.id) ?? null;
        return accumulator;
      },
      {
        me: null,
        mom: null,
        dad: null,
      }
    );
  }, [albumEntries]);

  const weeklyStats = useMemo<WeeklyRewardStats>(() => {
    const weekEntries = albumEntries.filter((entry) => {
      const parsed = new Date(entry.uploadedAt.replace(" ", "T"));
      if (Number.isNaN(parsed.getTime())) return false;

      const latestDate = new Date("2026-05-02T23:59:59");
      const diffDays =
        (latestDate.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    return {
      petMessages: weekEntries.filter((entry) => entry.dogMessage.trim()).length,
      photoShares: weekEntries.length,
      gentleReactions: weekEntries.filter((entry) => entry.reaction).length,
      moodCheckIns: 3,
      connectedDays: new Set(
        weekEntries.map((entry) => entry.uploadedAt.split(" ")[0])
      ).size,
    };
  }, [albumEntries]);

  const handleWeeklyKeepsakeAdd = (reward: WeeklyReward) => {
    setWeeklyKeepsakes((prev) =>
      prev.some((item) => item.id === reward.id) ? prev : [...prev, reward]
    );
  };

  const handleAlbumEntryCreate = (entry: AlbumEntry) => {
    setAlbumEntries((prev) => [entry, ...prev]);
    if (entry.memberId === "me") {
      const me = familyMembers.find((member) => member.id === "me");
      setHomeBubbleMessage(
        entry.dogMessage.trim() || `${me?.name ?? "Grace"}'s pet has a photo to show you.`
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

  const handleAlbumEntryDelete = (entryId: string) => {
    setAlbumEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return (
          <ChatPage
            familyMembers={familyMembers}
            latestEntries={latestEntries}
            bubbleMessage={homeBubbleMessage}
            weeklyKeepsakes={weeklyKeepsakes}
            onOverlayChange={setBottomNavHidden}
          />
        );

      case "album":
        return (
          <ConnectPage
            familyMembers={familyMembers}
            albumEntries={albumEntries}
            onCreateEntry={handleAlbumEntryCreate}
            onUpdateReaction={handleAlbumEntryReactionChange}
            onDeleteEntry={handleAlbumEntryDelete}
            onOverlayChange={setBottomNavHidden}
          />
        );

      case "jar":
        return <JarPage onOverlayChange={setBottomNavHidden} />;

      case "echo":
        return (
          <WeeklyEchoPage
            stats={weeklyStats}
            onAddKeepsake={handleWeeklyKeepsakeAdd}
            addedKeepsakeIds={weeklyKeepsakes.map((item) => item.id)}
          />
        );

      case "profile":
        return <ProfilePage familyMembers={familyMembers} />;

      default:
        return (
          <ChatPage
            familyMembers={familyMembers}
            latestEntries={latestEntries}
            bubbleMessage={homeBubbleMessage}
            weeklyKeepsakes={weeklyKeepsakes}
            onOverlayChange={setBottomNavHidden}
          />
        );
    }
  };

  return (
    <PetProvider>
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

            <BottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hidden={bottomNavHidden}
            />
          </div>
        </div>
      </div>
    </PetProvider>
  );
}
