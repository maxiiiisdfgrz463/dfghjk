import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  LogOut,
  Mail,
  Phone,
  MoreVertical,
  Heart,
  MessageSquare,
  Share2,
  Edit,
  User,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import EditProfileForm from "./EditProfileForm";

interface ProfileScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack = () => {},
  onLogout = () => {},
}) => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    location: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
    showEmail: false,
    showPhone: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          // If the profile doesn't exist yet, create a default one
          if (error.code === "PGRST116") {
            // No rows returned
            const defaultProfile = {
              id: user.id,
              name: user.email?.split("@")[0] || "User",
              email: user.email || "", // Ensure email is never null
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || user.id}`,
              updated_at: new Date().toISOString(),
            };

            // Create a default profile
            const { error: insertError } = await supabase
              .from("profiles")
              .insert(defaultProfile);

            if (insertError) {
              console.error("Error creating default profile:", insertError);
              return;
            }

            // Set the default profile in state
            setProfile({
              name: defaultProfile.name,
              location: "",
              email: user.email || "",
              phone: "",
              avatar: defaultProfile.avatar_url,
              bio: "",
              showEmail: false,
              showPhone: false,
            });
            setLoading(false);
            return;
          }

          console.error("Error fetching profile:", error);
          return;
        }

        if (data) {
          setProfile({
            name: data.name || "",
            location: data.location || "",
            email: user.email || "",
            phone: data.phone || "",
            avatar:
              data.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
            bio: data.bio || "",
            showEmail: data.show_email || false,
            showPhone: data.show_phone || false,
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const post = {
    id: "post-1",
    author: {
      name: profile.name,
      username: "Jun 16",
      avatar: profile.avatar,
    },
    content: "",
    media: {
      type: "image",
      src: "https://images.unsplash.com/photo-1570639224380-c0e8ec8d8a29?w=800&q=80",
      alt: "VR experience",
    },
    timestamp: "Jun 16",
    likes: 2,
    comments: 0,
    shares: 0,
    isLiked: false,
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0d1015] rounded-[40px] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0d1015] rounded-[40px]">
        <div className="flex justify-between items-center p-4">
          <button
            className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
            onClick={() => setIsEditing(false)}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">Edit Profile</h1>
          <div className="w-12 h-12"></div> {/* Empty div for spacing */}
        </div>

        <EditProfileForm
          profile={profile}
          onUpdate={handleProfileUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0d1015] rounded-[40px]">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <button
          className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
          onClick={onBack}
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <h1 className="text-xl font-semibold">Profile</h1>

        <button
          className="w-12 h-12 rounded-md bg-red-100 text-red-500 dark:bg-red-900/30 flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut className="h-6 w-6" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center px-6 py-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-2xl font-bold mt-4">{profile.name}</h2>
        {profile.location && (
          <div className="flex items-center text-gray-500 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <p>{profile.location}</p>
          </div>
        )}

        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          className="mt-4 flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>

        <div className="w-full mt-6 space-y-4">
          {profile.showEmail && (
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-gray-600">{profile.email}</span>
            </div>
          )}
          {profile.showPhone && profile.phone && (
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-gray-600">{profile.phone}</span>
            </div>
          )}
          {profile.bio && (
            <div className="mt-2">
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* User Posts */}
      <div className="flex-1 px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="flex items-start p-4">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <p className="text-xs text-gray-500">{post.timestamp}</p>
                </div>
                <button className="h-8 w-8 flex items-center justify-center">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 rounded-lg overflow-hidden">
                <img
                  src={post.media?.src}
                  alt={post.media?.alt || "Post image"}
                  className="w-full h-auto object-cover"
                />
              </div>

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
      </div>
    </div>
  );
};

export default ProfileScreen;
