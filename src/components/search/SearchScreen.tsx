import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Search,
  User,
  FileText,
  Loader2,
  HomeIcon,
  Bell,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface SearchScreenProps {
  onBack?: () => void;
  onProfile?: () => void;
  onNotifications?: () => void;
  onCreatePost?: () => void;
}

interface SearchResult {
  id: string;
  type: "user" | "post";
  title: string;
  subtitle?: string;
  avatar?: string;
  content?: string;
}

const SearchScreen: React.FC<SearchScreenProps> = ({
  onBack = () => {},
  onProfile = () => {},
  onNotifications = () => {},
  onCreatePost = () => {},
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "users" | "posts">("all");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Search users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, bio")
        .ilike("name", `%${searchQuery}%`);

      if (usersError) {
        console.error("Error searching users:", usersError);
      }

      // Search posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, content, user_id, created_at, profiles(name, avatar_url)")
        .ilike("content", `%${searchQuery}%`);

      if (postsError) {
        console.error("Error searching posts:", postsError);
      }

      // Format results
      const userResults: SearchResult[] = (usersData || []).map((user) => ({
        id: user.id,
        type: "user",
        title: user.name,
        subtitle: user.bio?.substring(0, 50) || "",
        avatar:
          user.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      }));

      const postResults: SearchResult[] = (postsData || []).map((post) => ({
        id: post.id,
        type: "post",
        title: post.profiles?.name || "Unknown User",
        subtitle: new Date(post.created_at).toLocaleDateString(),
        content:
          post.content.length > 100
            ? post.content.substring(0, 100) + "..."
            : post.content,
        avatar:
          post.profiles?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
      }));

      // Combine results
      setSearchResults([...userResults, ...postResults]);
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "user") {
      navigate(`/user/${result.id}`);
    } else {
      // For posts, navigate to feed (ideally would scroll to the specific post)
      navigate("/feed");
    }
  };

  const filteredResults = searchResults.filter((result) => {
    if (activeTab === "all") return true;
    return result.type === activeTab;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0d1015] rounded-[40px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search posts and users..."
              className="pl-10 h-10 w-full bg-gray-100 dark:bg-gray-800 border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className={`flex-1 rounded-none ${activeTab === "all" ? "border-b-2 border-[#00b4d8]" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-none ${activeTab === "users" ? "border-b-2 border-[#00b4d8]" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-none ${activeTab === "posts" ? "border-b-2 border-[#00b4d8]" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 p-4">
        {isSearching ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searchQuery && filteredResults.length > 0 ? (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {result.type === "user" ? (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={result.avatar} alt={result.title} />
                        <AvatarFallback>
                          {result.title.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-semibold">{result.title}</h3>
                      {result.type === "user" && (
                        <div className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                          <User className="h-3 w-3 inline mr-1" />
                          User
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{result.subtitle}</p>
                    {result.content && (
                      <p className="text-sm mt-2 line-clamp-2">
                        {result.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-10">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No results found for "{searchQuery}"
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Try different keywords or check your spelling
            </p>
          </div>
        ) : (
          <div className="text-center py-10">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Search for users or posts
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Try searching for names, topics, or keywords
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center p-2 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center justify-center h-14 w-16"
          onClick={() => navigate("/feed")}
        >
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="flex flex-col items-center justify-center h-14 w-16 text-[#00b4d8]"
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

export default SearchScreen;
