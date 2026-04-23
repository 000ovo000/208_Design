import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X, Plus, Heart, Smile, ThumbsUp } from "lucide-react";


type QuickReplyOption = {
  id: string;
  text: string;
  icon: React.ReactNode;
};

type SelectedReply = {
  id: number;
  optionId: string;
  text: string;
  isCustom?: boolean;
};

type StatusPost = {
  id: number;
  user: string;
  time: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  caption?: string;
  replies: SelectedReply[];
};

const baseQuickReplyOptions: QuickReplyOption[] = [
  {
    id: "thinking",
    text: "Thinking of you",
    icon: <Heart className="h-6 w-6 text-pink-300" strokeWidth={2.2} />,
  },
  {
    id: "miss",
    text: "Miss you",
    icon: <Smile className="h-6 w-6 text-orange-300" strokeWidth={2.2} />,
  },
  {
    id: "custom",
    text: "Add reply",
    icon: <span className="text-[22px] font-semibold text-[#8B8BA3]">+</span>,
  },
];

  function getSuggestedReplies(caption?: string): QuickReplyOption[] {
    const text = (caption || "").toLowerCase();

    if (
      text.includes("sunset") ||
      text.includes("sea") ||
      text.includes("beach")
    ) {
      return [
        {
          id: "peaceful",
          text: "So peaceful",
          icon: <Heart className="h-6 w-6 text-pink-300" strokeWidth={2.2} />,
        },
        {
          id: "beautiful",
          text: "Such a beautiful view",
          icon: <Smile className="h-6 w-6 text-orange-300" strokeWidth={2.2} />,
        },
        {
          id: "custom",
          text: "Add reply",
          icon: <span className="text-[22px] font-semibold text-[#8B8BA3]">+</span>,
        },
      ];
    }

    if (
      text.includes("walk") ||
      text.includes("park") ||
      text.includes("drive")
    ) {
      return [
        {
          id: "nice_outing",
          text: "Looks like a lovely outing",
          icon: <Heart className="h-6 w-6 text-pink-300" strokeWidth={2.2} />,
        },
        {
          id: "enjoy_time",
          text: "Hope you had a nice time",
          icon: <Smile className="h-6 w-6 text-orange-300" strokeWidth={2.2} />,
        },
        {
          id: "custom",
          text: "Add reply",
          icon: <span className="text-[22px] font-semibold text-[#8B8BA3]">+</span>,
        },
      ];
    }

    if (
      text.includes("flower") ||
      text.includes("bloom") ||
      text.includes("garden")
    ) {
      return [
        {
          id: "pretty_flowers",
          text: "The flowers are lovely",
          icon: <Heart className="h-6 w-6 text-pink-300" strokeWidth={2.2} />,
        },
        {
          id: "bright_day",
          text: "That brightened my day",
          icon: <Smile className="h-6 w-6 text-orange-300" strokeWidth={2.2} />,
        },
        {
          id: "custom",
          text: "Add reply",
          icon: <span className="text-[22px] font-semibold text-[#8B8BA3]">+</span>,
        },
      ];
    }

    if (
      text.includes("tea") ||
      text.includes("coffee") ||
      text.includes("morning")
    ) {
      return [
        {
          id: "cozy",
          text: "Looks so cozy",
          icon: <Heart className="h-6 w-6 text-pink-300" strokeWidth={2.2} />,
        },
        {
          id: "nice_moment",
          text: "What a nice little moment",
          icon: <Smile className="h-6 w-6 text-orange-300" strokeWidth={2.2} />,
        },
        {
          id: "custom",
          text: "Add reply",
          icon: <span className="text-[22px] font-semibold text-[#8B8BA3]">+</span>,
        },
      ];
    }

    return [
      {
        id: "thinking",
        text: "Thinking of you",
        icon: <Heart className="h-6 w-6 text-pink-300" strokeWidth={2.2} />,
      },
      {
        id: "sweet",
        text: "Thanks for sharing",
        icon: <Smile className="h-6 w-6 text-orange-300" strokeWidth={2.2} />,
      },
      {
        id: "custom",
        text: "Add reply",
        icon: <span className="text-[22px] font-semibold text-[#8B8BA3]">+</span>,
      },
    ];
  }
const initialPosts: StatusPost[] = [
  {
    id: 1,
    user: "Mom",
    time: "8:42 pm",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
    caption: "sunset by the sea",
    replies: [],
  },
  {
    id: 2,
    user: "Dad",
    time: "7:18 pm",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    caption: "evening walk in the park",
    replies: [],
  },
  {
    id: 3,
    user: "Grandma",
    time: "5:36 pm",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1200&auto=format&fit=crop",
    caption: "flowers in bloom",
    replies: [],
  },
  {
    id: 4,
    user: "Grandpa",
    time: "3:12 pm",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
    caption: "afternoon tea break",
    replies: [],
  },
  {
    id: 5,
    user: "Mom",
    time: "11:05 am",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
    caption: "coffee and quiet morning",
    replies: [],
  },
  {
    id: 6,
    user: "Dad",
    time: "9:24 am",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
    caption: "morning drive",
    replies: [],
  },
];

interface ChatPageProps {
  pendingTopicTitle?: string;
  onUploadOpened?: () => void;
}

export function ChatPage({
  pendingTopicTitle = "",
  onUploadOpened,
}: ChatPageProps) {
  const [posts, setPosts] = useState<StatusPost[]>(initialPosts);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [selectedMediaUrl, setSelectedMediaUrl] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video" | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [customReplyText, setCustomReplyText] = useState("");
    useEffect(() => {
    if (pendingTopicTitle) {
      setNewCaption(pendingTopicTitle);
      setShowUploadModal(true);
      setShowMediaOptions(true);
      onUploadOpened?.();
    }
  }, [pendingTopicTitle, onUploadOpened]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const postsContainerRef = useRef<HTMLDivElement | null>(null);

  const activePost = posts[activeIndex] ?? posts[0];
  const suggestedReplies = getSuggestedReplies(activePost?.caption);


  const handleAddCustomReply = () => {
    const text = customReplyText.trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((post, index) => {
        if (index !== activeIndex) return post;

        return {
          ...post,
          replies: [
            {
              id: Date.now(),
              optionId: "custom",
              text,
              isCustom: true,
            },
          ],
        };
      })
    );

    setShowReplyModal(false);
    setCustomReplyText("");
  };

  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
    setCustomReplyText("");
  };

  const handleQuickReply = (option: QuickReplyOption) => {
    if (option.id === "custom") {
      setShowReplyModal(true);
      return;
    }

    setPosts((prev) =>
      prev.map((post, index) => {
        if (index !== activeIndex) return post;

        return {
          ...post,
          replies: [
            {
              id: Date.now(),
              optionId: option.id,
              text: option.text,
            },
          ],
        };
      })
    );
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Only image or video can be uploaded.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setSelectedMediaUrl(objectUrl);
    setSelectedMediaType(isImage ? "image" : "video");

    event.target.value = "";
  };

  const handleSubmitPost = () => {
    if (!selectedMediaUrl || !selectedMediaType) {
      alert("Please select a photo first.");
      return;
    }

    const newPost: StatusPost = {
      id: Date.now(),
      user: "testUser",
      time: "Just now",
      mediaType: selectedMediaType,
      mediaUrl: selectedMediaUrl,
      caption: newCaption.trim() || "new status",
      replies: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      postsContainerRef.current?.scrollTo({
        left: 0,
        behavior: "smooth",
      });
    });

    setShowUploadModal(false);
    setShowMediaOptions(false);
    setNewCaption("");
    setSelectedMediaUrl("");
    setSelectedMediaType(null);
  };


  const handleDeletePost = (id: number) => {
    setPosts((prev) => {
      const updated = prev.filter((post) => post.id !== id);
      setActiveIndex((current) =>
        updated.length === 0 ? 0 : Math.min(current, updated.length - 1)
      );
      return updated;
    });
  };

  return (
    <div className="flex h-full flex-col bg-[#F8F4EF]">
      <div className="flex items-center justify-between border-b border-[#E8DED2] bg-[#F8F4EF]/95 px-5 pt-6 pb-4 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-[#4A4A6A]">Home</h1>
          <p className="text-sm text-[#8B8BA3]">Share a moment, reply simply</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="rounded-full bg-[#6B5B73] px-4 py-2 text-sm font-medium text-white"
        >
          Upload
        </button>
      </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleMediaUpload}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleMediaUpload}
        />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div
          ref={postsContainerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none]"
          onScroll={(e) => {
            const container = e.currentTarget;
            const cardWidth = container.clientWidth - 32 + 16;
            const index = Math.round(container.scrollLeft / cardWidth);
            if (index >= 0 && index < posts.length) {
              setActiveIndex(index);
            }
          }}
          style={{ scrollbarWidth: "none" }}
        >
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="min-w-full snap-center overflow-hidden rounded-[28px] border border-[#E8DED2] bg-white shadow-sm"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#4A4A6A]">{post.user}</p>
                  <p className="text-xs text-[#8B8BA3]">{post.time}</p>
                </div>

                {post.user === "testUser" ? (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="rounded-full px-3 py-1 text-xs font-medium text-[#B06A6A] hover:bg-[#F8ECEC]"
                  >
                    Delete
                  </button>
                ) : (
                  <button className="text-lg leading-none text-[#8B8BA3]">•••</button>
                )}
              </div>

              <div className="aspect-[3/4] w-full bg-[#EFE7DD]">
                {post.mediaType === "image" ? (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption || "status"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={post.mediaUrl}
                    controls
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="px-4 py-3">
                <p className="text-sm font-medium text-[#4A4A6A]">
                  {post.caption || "Untitled"}
                </p>
                <p className="mt-1 text-xs text-[#8B8BA3]">
                    {post.replies.length === 0
                      ? "Tap below to send a quick reply"
                      : `${post.replies.length} reply${post.replies.length > 1 ? "ies" : ""}`}
                </p>
              </div>

              {index === activeIndex && (
                <div className="border-t border-[#F0E7DC] px-4 pt-3 pb-4">
                  {post.replies.length === 0 && (
                    <>
                      <p className="mb-3 text-base font-semibold text-[#5F6280]">
                        Quick reply
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        {suggestedReplies.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleQuickReply(option)}
                            className="flex min-h-[96px] flex-col items-center justify-center rounded-[20px] border border-[#E8DED2] bg-[#FCFCFB] px-2 py-3 text-center shadow-sm transition hover:-translate-y-[1px]"
                          >
                            <div className="mb-2">{option.icon}</div>
                            <span className="text-[13px] font-semibold leading-5 text-[#5F6280]">
                              {option.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                    {post.replies.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {post.replies.map((reply) => {
                          const matchedOption = suggestedReplies.find(
                            (item) => item.id === reply.optionId
                          );

                          return (
                            <div
                              key={reply.id}
                              className="rounded-2xl border border-[#E8DED2] bg-[#F7F3EE] px-3 py-3"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white">
                                  {reply.isCustom ? (
                                    <span className="text-sm text-[#8B8BA3]">✎</span>
                                  ) : (
                                    matchedOption?.icon
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-[#8B8BA3]">
                                    testUser
                                  </p>
                                  <p className="mt-1 text-sm leading-relaxed text-[#4A4A6A]">
                                    {reply.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {posts.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-6 bg-[#6B5B73]" : "w-2 bg-[#D8CEC2]"
              }`}
            />
          ))}
        </div>
      </div>

  {showUploadModal && (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-6">
      <div className="w-full max-w-md rounded-[28px] bg-[#FFFDF9] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#4A4A6A]">New status</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmitPost}
              disabled={!selectedMediaUrl}
              className="rounded-full bg-[#6B5B73] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>

            <button
              onClick={() => {
                setShowUploadModal(false);
                setShowMediaOptions(false);
                setNewCaption("");
                setSelectedMediaUrl("");
                setSelectedMediaType(null);
              }}
              className="rounded-full p-2 text-[#8B8BA3] hover:bg-[#F3EEE7]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="Enter a title"
            className="w-full rounded-2xl border border-[#E8DED2] bg-white px-4 py-3 text-sm text-[#4A4A6A] outline-none placeholder:text-[#AAA6B2]"
          />
        </div>

        <div className="rounded-[24px] border border-dashed border-[#D8CEC2] bg-[#F8F4EF] p-6">
          <div className="flex min-h-[180px] flex-col items-center justify-center">
            {selectedMediaUrl ? (
              <div className="w-full">
                {selectedMediaType === "image" ? (
                  <img
                    src={selectedMediaUrl}
                    alt="preview"
                    className="h-48 w-full rounded-[20px] object-cover"
                  />
                ) : (
                  <video
                    src={selectedMediaUrl}
                    controls
                    className="h-48 w-full rounded-[20px] object-cover"
                  />
                )}

                <div className="mt-3 grid w-full grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-[20px] border border-[#E8DED2] bg-white px-4 py-4 text-center shadow-sm"
                  >
                    <Camera className="mb-2 h-6 w-6 text-[#6B5B73]" />
                    <span className="text-sm font-medium text-[#4A4A6A]">
                      Retake
                    </span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-[20px] border border-[#E8DED2] bg-white px-4 py-4 text-center shadow-sm"
                  >
                    <ImagePlus className="mb-2 h-6 w-6 text-[#6B5B73]" />
                    <span className="text-sm font-medium text-[#4A4A6A]">
                      Change photo
                    </span>
                  </button>
                </div>
              </div>
            ) : !showMediaOptions ? (
              <button
                onClick={() => setShowMediaOptions(true)}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-[#E8DED2] bg-white shadow-sm"
              >
                <Plus className="h-8 w-8 text-[#6B5B73]" />
              </button>
            ) : (
              <div className="grid w-full grid-cols-2 gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-[20px] border border-[#E8DED2] bg-white px-4 py-5 text-center shadow-sm"
                >
                  <Camera className="mb-2 h-7 w-7 text-[#6B5B73]" />
                  <span className="text-sm font-medium text-[#4A4A6A]">
                    Take photo
                  </span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-[20px] border border-[#E8DED2] bg-white px-4 py-5 text-center shadow-sm"
                >
                  <ImagePlus className="mb-2 h-7 w-7 text-[#6B5B73]" />
                  <span className="text-sm font-medium text-[#4A4A6A]">
                    Upload photo
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  {showReplyModal && (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-6">
      <div className="w-full max-w-md rounded-[28px] bg-[#FFFDF9] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#4A4A6A]">Add reply</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddCustomReply}
              disabled={!customReplyText.trim()}
              className="rounded-full bg-[#6B5B73] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Send
            </button>

            <button
              onClick={handleCloseReplyModal}
              className="rounded-full p-2 text-[#8B8BA3] hover:bg-[#F3EEE7]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E8DED2] bg-[#F8F4EF] p-4">
          <p className="mb-3 text-sm font-medium text-[#5F6280]">
            Share a gentle reply
          </p>

          <textarea
            value={customReplyText}
            onChange={(e) => setCustomReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-[#E8DED2] bg-white px-4 py-3 text-sm leading-relaxed text-[#4A4A6A] outline-none placeholder:text-[#AAA6B2]"
          />
        </div>
      </div>
    </div>
  )}

    </div>
  );
}