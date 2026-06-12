import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Full screen loading screen while Firebase checks session
export function AppLoadingScreen() {
  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#080808",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "24px"
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "Bebas Neue, sans-serif",
        fontSize: "36px",
        color: "#FFFFFF",
        letterSpacing: "4px"
      }}>
        SPORT<span style={{ color: "#CCFF00" }}>iX</span>
      </div>

      {/* Loading bar */}
      <div style={{
        width: "200px", height: "2px",
        background: "#1A2200",
        borderRadius: "999px",
        overflow: "hidden"
      }}>
        <div style={{
          height: "100%",
          background: "#CCFF00",
          borderRadius: "999px",
          animation: "loadBar 1.5s ease-in-out infinite"
        }} />
      </div>

      <style>{`
        @keyframes loadBar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

export function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { currentUser, authLoading } = useAuth();

  // CRITICAL: Wait for Firebase to check session before redirecting
  if (authLoading) return <AppLoadingScreen />;

  // Not logged in → go to login
  if (!currentUser) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// Public routes (login/signup) redirect to home if already logged in
export function PublicRoute({
  children
}: {
  children: React.ReactNode
}) {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return <AppLoadingScreen />;

  // Already logged in → go to app home
  if (currentUser) return <Navigate to="/app/feed" replace />;

  return <>{children}</>;
}
