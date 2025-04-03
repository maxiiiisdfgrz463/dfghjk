import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import WelcomeScreen from "@/components/auth/WelcomeScreen";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import FeedScreen from "@/components/feed/FeedScreen";
import ProfileScreen from "@/components/profile/ProfileScreen";
import CreatePostScreen from "@/components/feed/CreatePostScreen";
import { ArrowLeft } from "lucide-react";

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn, signOut, isLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  // Auth handlers
  const handleLogin = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (!result.error) {
      navigate("/feed");
      return { success: true };
    }
    return result;
  };

  const handleSignup = async (
    name: string,
    email: string,
    password: string,
  ) => {
    // After signup, we need to log the user in
    console.log("Handling post-signup login for:", email);
    const { error } = await signIn(email, password);

    if (error) {
      console.error("Error logging in after signup:", error);
      return;
    }

    navigate("/feed");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Navigation handlers
  const navigateToLogin = () => navigate("/login");
  const navigateToSignup = () => navigate("/signup");
  const navigateToWelcome = () => navigate("/");
  const navigateBack = () => window.history.back();
  const navigateToFeed = () => navigate("/feed");
  const navigateToProfile = () => navigate("/profile");
  const navigateToCreatePost = () => navigate("/create-post");
  const navigateToNotifications = () => navigate("/notifications");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/feed" replace />
          ) : (
            <WelcomeScreen
              onGetStarted={navigateToSignup}
              onLogin={navigateToLogin}
              onBack={navigateBack}
            />
          )
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/feed" replace />
          ) : (
            <LoginForm
              onLogin={handleLogin}
              onNavigateToSignup={navigateToSignup}
              onBack={navigateToWelcome}
            />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/feed" replace />
          ) : (
            <SignupForm
              onSignup={handleSignup}
              onNavigateToLogin={navigateToLogin}
              onBack={navigateToWelcome}
            />
          )
        }
      />
      <Route
        path="/feed"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <FeedScreen
              onCreatePost={navigateToCreatePost}
              onProfile={navigateToProfile}
              onNotifications={navigateToNotifications}
            />
          )
        }
      />
      <Route
        path="/profile"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <ProfileScreen onBack={navigateToFeed} onLogout={handleLogout} />
          )
        }
      />
      <Route
        path="/notifications"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center mb-6">
                <button
                  className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center mr-4"
                  onClick={navigateToFeed}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold">Notifications</h1>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Notifications feature coming soon!
                </p>
              </div>
            </div>
          )
        }
      />
      <Route
        path="/create-post"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <CreatePostScreen
              onBack={navigateToFeed}
              onPost={(content, media) => {
                console.log("New post:", { content, media });
                navigateToFeed();
              }}
            />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
