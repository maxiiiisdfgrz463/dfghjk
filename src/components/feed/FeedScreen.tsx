import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2, MoreVertical, Plus } from "lucide-react";

interface FeedScreenProps {
  onCreatePost?: () => void;
  onProfile?: () => void;
  posts?: Array<{
    id: string;
    author: {
      name: string;
      username: string;
      avatar: string;
    };
    content?: string;
    media?: {
      type: "image" | "video";
      src: string;
      alt?: string;
    };
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
  }>;
}

const FeedScreen: React.FC<FeedScreenProps> = ({
  onCreatePost = () => {},
  onProfile = () => {},
  posts = [
    {
      id: "post-1",
      author: {
        name: "Sven Watt",
        username: "Jun 23",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sven",
      },
      media: {
        type: "image",
        src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
        alt: "Digital art of an eye",
      },
      timestamp: "Jun 23",
      likes: 5,
      comments: 2,
      shares: 0,
      isLiked: false,
    },
    {
      id: "post-2",
      author: {
        name: "Susanne Mark",
        username: "Jun 22",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Susanne",
      },
      media: {
        type: "image",
        src: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80",
        alt: "Colorful abstract art",
      },
      timestamp: "Jun 22",
      likes: 3,
      comments: 1,
      shares: 0,
      isLiked: false,
    },
  ],
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0d1015] rounded-[40px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#00b4d8]">FRYCOM</h1>

        <div className="flex items-center space-x-4">
          <button className="h-10 w-10 flex items-center justify-center">
            <Heart className="h-6 w-6" />
          </button>
          <button className="h-10 w-10 flex items-center justify-center">
            <Plus className="h-6 w-6" />
          </button>
          <div
            className="h-10 w-10 rounded-full overflow-hidden cursor-pointer"
            onClick={onProfile}
          >
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Max"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      {/* Feed */}
      <div className="flex-1 p-4 space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
          >
            <div className="flex items-start p-4">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{post.author.name}</h3>
                    <p className="text-xs text-gray-500">{post.timestamp}</p>
                  </div>
                  <button className="h-8 w-8 flex items-center justify-center">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                {post.content && <p className="mt-2">{post.content}</p>}

                {post.media && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img
                      src={post.media.src}
                      alt={post.media.alt || "Post image"}
                      className="h-auto object-cover w-full"
                    />
                  </div>
                )}

                <div className="flex items-center mt-3">
                  <button className="flex items-center gap-1 p-2">
                    <Heart className="h-5 w-5" />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 p-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1 p-2">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Create Post FAB */}
      <Button
        onClick={onCreatePost}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full hover:bg-emerald-500 shadow-lg bg-[#00b4d8]"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default FeedScreen;
