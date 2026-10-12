"use client";

import React from "react";
import { useApp } from "@/lib/context";
import { LoginView } from "@/components/auth/LoginView";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { HomeView } from "@/components/views/HomeView";
import { MyTasksView } from "@/components/views/MyTasksView";
import { ListView } from "@/components/views/ListView";
import { BoardView } from "@/components/views/BoardView";
import { TimelineView } from "@/components/views/TimelineView";
import { CalendarView } from "@/components/views/CalendarView";
import { DashboardView } from "@/components/views/DashboardView";

// Modals
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { CreateProjectDialog } from "@/components/project/CreateProjectDialog";
import { WorkspaceMembersModal } from "@/components/workspace/WorkspaceMembersModal";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import { GithubHubDialog } from "@/components/github/GithubHubDialog";

export default function AppHome() {
  const { user, authLoading, currentView, currentProject } = useApp();

  // If session is verifying on reload, show smooth loading placeholder instead of flashing the login screen
  if (authLoading && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground font-medium">در حال بارگذاری سامانه...</span>
        </div>
      </div>
    );
  }

  // If user is definitely not logged in, show login screen
  if (!user) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    if (currentView === "my-tasks") {
      return <MyTasksView />;
    }
    if (!currentProject || currentView === "home") {
      return <HomeView />;
    }
    switch (currentView) {
      case "board":
        return <BoardView />;
      case "timeline":
        return <TimelineView />;
      case "calendar":
        return <CalendarView />;
      case "dashboard":
        return <DashboardView />;
      case "list":
      default:
        return <ListView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left / Right Sidebar */}
      <Sidebar />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <TaskDetailModal />
      <CreateTaskDialog />
      <CreateProjectDialog />
      <WorkspaceMembersModal />
      <UserProfileModal />
      <GithubHubDialog />
    </div>
  );
}
