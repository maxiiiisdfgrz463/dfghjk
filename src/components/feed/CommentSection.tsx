import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Heart, Send } from "lucide-react";

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
}

interface CommentSectionProps {
  postId?: string;
  comments?: Comment[];
  onAddComment?: (content: string) => void;
  onLikeComment?: (commentId: string) => void;
}

const CommentSection = ({
  postId = "post-1",
  comments = [
    {
      id: "comment-1",
      author: {
        name: "Alex Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      },
      content:
        "This is such an amazing post! Thanks for sharing this content with us.",
      timestamp: "2 hours ago",
      likes: 5,
      isLiked: false,
    },
    {
      id: "comment-2",
      author: {
        name: "Sam Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
      },
      content: "I completely agree with your points. Very insightful!",
      timestamp: "45 minutes ago",
      likes: 2,
      isLiked: true,
    },
  ],
  onAddComment = () => {},
  onLikeComment = () => {},
}: CommentSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      // Create a new comment object
      const newCommentObj: Comment = {
        id: `comment-${Date.now()}`,
        author: {
          name: "Current User",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser",
        },
        content: newComment,
        timestamp: "Just now",
        likes: 0,
        isLiked: false,
      };

      // Update local state
      setLocalComments([...localComments, newCommentObj]);

      // Call the callback
      onAddComment(newComment);

      // Clear the input
      setNewComment("");
    }
  };

  const handleLikeComment = (commentId: string) => {
    setLocalComments(
      localComments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked,
          };
        }
        return comment;
      }),
    );

    onLikeComment(commentId);
  };

  return (
    <div className="w-full bg-white rounded-md p-4">
      {/* Comment toggle button */}
      <Button
        variant="ghost"
        className="flex items-center gap-2 mb-2"
        onClick={handleToggleExpand}
      >
        <MessageSquare className="h-4 w-4" />
        <span>{localComments.length} Comments</span>
      </Button>

      {/* Expanded comment section */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Comment list */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {localComments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-2 border-b border-gray-100"
              >
                <Avatar className="h-8 w-8">
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
                      <p className="font-medium text-sm">
                        {comment.author.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {comment.timestamp}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      onClick={() => handleLikeComment(comment.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${comment.isLiked ? "fill-red-500 text-red-500" : "text-gray-500"}`}
                      />
                      <span className="ml-1 text-xs">{comment.likes}</span>
                    </Button>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div className="flex gap-3 mt-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser"
                alt="Current User"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                className="min-h-[40px] text-sm resize-none"
                value={newComment}
                onChange={handleCommentChange}
              />
              <Button
                size="sm"
                className="self-end"
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
