import { useState } from "react";
import { BottomNav } from "./components/bottom-nav";
import { JarPage } from "./pages/jar-page";
import { ChatPage } from "./pages/chat-page";
import { ConnectPage } from "./pages/connect-page";
import { ProfilePage } from "./pages/profile-page";

type TabKey = "home" | "connect" | "jar" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [pendingTopicTitle, setPendingTopicTitle] = useState("");

  const handleSendTopic = (topic: string) => {
    setPendingTopicTitle(topic);
    setActiveTab("home");
  };

  const handleUploadOpened = () => {
    setPendingTopicTitle("");
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return (
          <ChatPage
            pendingTopicTitle={pendingTopicTitle}
            onUploadOpened={handleUploadOpened}
          />
        );

      case "jar":
        return <JarPage />;

      case "connect":
        return <ConnectPage onSendTopic={handleSendTopic} />;

      case "profile":
        return <ProfilePage />;

      default:
        return (
          <ChatPage
            pendingTopicTitle={pendingTopicTitle}
            onUploadOpened={handleUploadOpened}
          />
        );
    }
  };

  return (
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
  );
}