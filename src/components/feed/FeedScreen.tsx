import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageSquare,
  Share2,
  MoreVertical,
  Plus,
  Loader2,
  ArrowLeft,
  Search,
  Home as HomeIcon,
  Bell,
  User,
  Trash2,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import CommentSection from "./CommentSection";

interface FeedScreenProps {
  onCreatePost?: () => void;
  onProfile?: () => void;
  onNotifications?: () => void;
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
  onNotifications = () => {},
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          return;
        }

        if (!postsData || postsData.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch user likes for the current user
        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id);

        const likedPostIds = new Set(
          likesData?.map((like) => like.post_id) || [],
        );

        // Fetch author details and format posts
        const formattedPosts = await Promise.all(
          postsData.map(async (post) => {
            // Get author profile
            const { data: authorData } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", post.user_id)
              .single();

            // Get comments count
            const { count: commentsCount } = await supabase
              .from("comments")
              .select("id", { count: "exact" })
              .eq("post_id", post.id);

            // Get likes count
            const { count: likesCount } = await supabase
              .from("likes")
              .select("id", { count: "exact" })
              .eq("post_id", post.id);

            // Check if this post is from the current user
            const isOwnPost = post.user_id === user.id;

            return {
              id: post.id,
              author: {
                name: authorData?.name || "Unknown User",
                username: formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                }),
                avatar:
                  authorData?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`,
              },
              content: post.content,
              media: post.media_url
                ? {
                    type: post.media_type || "image",
                    src: post.media_url,
                    alt: "Post media",
                  }
                : undefined,
              timestamp: formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              }),
              likes: likesCount || 0,
              comments: commentsCount || 0,
              shares: 0,
              isLiked: likedPostIds.has(post.id),
              user_id: post.user_id,
              isOwnPost: isOwnPost,
            };
          }),
        );

        if (isMounted) {
          setPosts(formattedPosts);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching feed data:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    // Find the post and toggle its like status
    const updatedPosts = [...posts];
    const postIndex = updatedPosts.findIndex((p) => p.id === postId);

    if (postIndex === -1) return;

    const post = updatedPosts[postIndex];
    const newIsLiked = !post.isLiked;

    // Update UI optimistically
    updatedPosts[postIndex] = {
      ...post,
      isLiked: newIsLiked,
      likes: newIsLiked ? post.likes + 1 : post.likes - 1,
    };

    setPosts(updatedPosts);

    try {
      if (newIsLiked) {
        // Add like to database
        await supabase.from("likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      } else {
        // Remove like from database
        await supabase
          .from("likes")
          .delete()
          .match({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      // Revert UI change on error
      setPosts(posts);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    // Confirm deletion
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      // Delete the post from the database
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id); // Ensure the user can only delete their own posts

      if (error) {
        console.error("Error deleting post:", error);
        return;
      }

      // Remove the post from the UI
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      // Add comment to database
      await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      });

      // Update comment count in UI
      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          return { ...post, comments: post.comments + 1 };
        }
        return post;
      });

      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0d1015] rounded-[40px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#00b4d8]">FRYCOM</h1>

          <div className="flex items-center space-x-4">
            <button
              className="h-10 w-10 flex items-center justify-center"
              onClick={() => navigate("/search")}
            >
              <Search className="h-6 w-6" />
            </button>
            <button
              className="h-10 w-10 flex items-center justify-center"
              onClick={onCreatePost}
            >
              <Plus className="h-6 w-6" />
            </button>
            <Avatar className="h-10 w-10 cursor-pointer" onClick={onProfile}>
              <AvatarImage
                src={
                  user?.user_metadata?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || user?.id || "user"}`
                }
                alt="User"
              />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${post.isOwnPost ? "border-l-4 border-[#00b4d8]" : ""}`}
            >
              <div className="flex items-start p-4">
                <Avatar
                  className="w-10 h-10 mr-3 cursor-pointer"
                  onClick={() => navigate(`/user/${post.user_id}`)}
                >
                  <AvatarImage
                    src={post.author.avatar}
                    alt={post.author.name}
                  />
                  <AvatarFallback>
                    {post.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3
                        className="font-semibold cursor-pointer hover:underline"
                        onClick={() => navigate(`/user/${post.user_id}`)}
                      >
                        {post.author.name}
                      </h3>
                      <p className="text-xs text-gray-500">{post.timestamp}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 flex items-center justify-center">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {post.isOwnPost && (
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {post.content && <p className="mt-2">{post.content}</p>}

                  {post.media && (
                    <div className="mt-3 rounded-lg overflow-hidden">
                      {post.media.type === "image" ? (
                        <img
                          src={post.media.src}
                          alt={post.media.alt || "Post image"}
                          className="h-auto object-cover w-full"
                        />
                      ) : (
                        <video
                          src={post.media.src}
                          className="h-auto w-full object-cover"
                          controls
                          playsInline
                        />
                      )}
                    </div>
                  )}

                  <div className="flex items-center mt-3">
                    <button
                      className="flex items-center gap-1 p-2"
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart
                        className={`h-5 w-5 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`}
                      />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      className="flex items-center gap-1 p-2"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 p-2">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>

                  {expandedComments[post.id] && (
                    <div className="mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                      <CommentSection
                        postId={post.id}
                        onAddComment={(content) =>
                          handleAddComment(post.id, content)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              No posts yet. Create your first post!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center p-2 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center justify-center h-14 w-16 text-[#00b4d8]"
        >
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center justify-center h-14 w-16"
          onClick={() => navigate("/search")}
        >
          <Search className="h-6 w-6" />
          <span className="text-xs mt-1">Search</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center justify-center h-14 w-16"
          onClick={onNotifications}
        >
          <Bell className="h-6 w-6" />
          <span className="text-xs mt-1">Alerts</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center justify-center h-14 w-16"
          onClick={onProfile}
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </Button>
      </div>

      {/* Create Post FAB */}
      <Button
        onClick={onCreatePost}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full hover:bg-emerald-500 shadow-lg bg-[#00b4d8]"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add padding at the bottom to account for the navigation bar */}
      <div className="h-16"></div>
    </div>
  );
};

export default FeedScreen;
