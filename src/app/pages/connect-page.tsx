import { TopicCards } from "../components/topic-cards";

interface ConnectPageProps {
  onSendTopic: (topic: string) => void;
}

export function ConnectPage({ onSendTopic }: ConnectPageProps) {
  return (
    <div className="flex h-full flex-col bg-[#F8F4EF]">
      <div className="flex-1 overflow-y-auto pb-24">
        <TopicCards onSendTopic={onSendTopic} />
      </div>
    </div>
  );
}