import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Heart, Send, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  user_id: string;
}

interface CommentSectionProps {
  postId: string;
  onAddComment?: (content: string) => void;
  onLikeComment?: (commentId: string) => void;
}

const CommentSection = ({
  postId,
  onAddComment = () => {},
  onLikeComment = () => {},
}: CommentSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      if (!postId) return;

      setLoading(true);
      try {
        // Fetch comments for this post
        const { data: commentsData, error } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching comments:", error);
          return;
        }

        if (!commentsData || commentsData.length === 0) {
          if (isMounted) {
            setLocalComments([]);
            setLoading(false);
          }
          return;
        }

        // Fetch user likes for comments if user is logged in
        let likedCommentIds = new Set();
        if (user) {
          const { data: likesData } = await supabase
            .from("comment_likes")
            .select("comment_id")
            .eq("user_id", user.id);

          likedCommentIds = new Set(
            likesData?.map((like) => like.comment_id) || [],
          );
        }

        // Format comments with author info
        const formattedComments = await Promise.all(
          commentsData.map(async (comment) => {
            // Get author profile
            const { data: authorData } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", comment.user_id)
              .single();

            // Get likes count
            const { count: likesCount } = await supabase
              .from("comment_likes")
              .select("id", { count: "exact" })
              .eq("comment_id", comment.id);

            return {
              id: comment.id,
              author: {
                name: authorData?.name || "Unknown User",
                avatar:
                  authorData?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.id}`,
              },
              content: comment.content,
              timestamp: formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              }),
              likes: likesCount || 0,
              isLiked: likedCommentIds.has(comment.id),
              user_id: comment.user_id,
            };
          }),
        );

        if (isMounted) {
          setLocalComments(formattedComments);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchComments();

    return () => {
      isMounted = false;
    };
  }, [postId, user]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      // Add comment to database
      const { data: commentData, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding comment:", error);
        return;
      }

      if (commentData) {
        // Get the user's profile data for accurate avatar
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single();

        // Create a new comment object for UI
        const newCommentObj: Comment = {
          id: commentData.id,
          author: {
            name:
              profileData?.name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User",
            avatar:
              profileData?.avatar_url ||
              user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || user.id}`,
          },
          content: newComment,
          timestamp: "Just now",
          likes: 0,
          isLiked: false,
          user_id: user.id,
        };

        // Update local state
        setLocalComments([newCommentObj, ...localComments]);

        // Call the callback
        onAddComment(newComment);

        // Clear the input
        setNewComment("");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      // Delete comment from database
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id); // Ensure user can only delete their own comments

      if (error) {
        console.error("Error deleting comment:", error);
        return;
      }

      // Remove comment from UI
      setLocalComments(
        localComments.filter((comment) => comment.id !== commentId),
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    // Find the comment and toggle its like status
    const updatedComments = [...localComments];
    const commentIndex = updatedComments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) return;

    const comment = updatedComments[commentIndex];
    const newIsLiked = !comment.isLiked;

    // Update UI optimistically
    updatedComments[commentIndex] = {
      ...comment,
      isLiked: newIsLiked,
      likes: newIsLiked ? comment.likes + 1 : comment.likes - 1,
    };

    setLocalComments(updatedComments);

    try {
      if (newIsLiked) {
        // Add like to database
        await supabase.from("comment_likes").insert({
          comment_id: commentId,
          user_id: user.id,
        });
      } else {
        // Remove like from database
        await supabase
          .from("comment_likes")
          .delete()
          .match({ comment_id: commentId, user_id: user.id });
      }

      onLikeComment(commentId);
    } catch (error) {
      console.error("Error updating comment like:", error);
      // Revert UI change on error
      setLocalComments(localComments);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-md">
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Comment list */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {localComments.length > 0 ? (
              localComments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-2 border-b border-gray-100 dark:border-gray-700"
                >
                  <Avatar
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => navigate(`/user/${comment.user_id}`)}
                  >
                    <AvatarImage
                      src={comment.author.avatar}
                      alt={comment.author.name}
                    />
                    <AvatarFallback>
                      {comment.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p
                          className="font-medium text-sm cursor-pointer hover:underline"
                          onClick={() => navigate(`/user/${comment.user_id}`)}
                        >
                          {comment.author.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {comment.timestamp}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {user && user.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto mr-1"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${comment.isLiked ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400"}`}
                          />
                          <span className="ml-1 text-xs">{comment.likes}</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>

          {/* Comment input */}
          <div className="flex gap-3 mt-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  user?.user_metadata?.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || user?.id || "user"}`
                }
                alt="Current User"
              />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                className="min-h-[40px] text-sm resize-none dark:bg-gray-700"
                value={newComment}
                onChange={handleCommentChange}
              />
              <Button
                size="sm"
                className="self-end"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
