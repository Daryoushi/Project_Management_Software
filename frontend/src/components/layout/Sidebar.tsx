"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  Home,
  CheckCircle2,
  FolderKanban,
  Plus,
  Briefcase,
  Shield,
  Layers,
  ChevronDown,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { GithubIcon } from "@/components/github/GithubHubDialog";

export function Sidebar() {
  const {
    user,
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    projects,
    currentProject,
    setCurrentProject,
    currentView,
    setCurrentView,
    setIsCreateProjectOpen,
    setIsWorkspaceMembersOpen,
    setIsProfileOpen,
    isMobileNavOpen,
    setIsMobileNavOpen,
    setIsGithubHubOpen,
    logout,
    lang,
    t,
    canEdit,
    userRole,
  } = useApp();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 start-0 z-50 w-64 bg-[#141820] text-slate-200 border-e border-[#212634] flex flex-col h-screen shrink-0 select-none transition-transform duration-300 md:translate-x-0 ${
          isMobileNavOpen
            ? "translate-x-0 shadow-2xl"
            : lang === "fa"
            ? "translate-x-full md:translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Brand / Logo */}
        <div className="p-4 border-b border-[#212634] flex items-center justify-between">
          <div
            onClick={() => {
              setCurrentView("home");
              setCurrentProject(null);
              if (typeof window !== "undefined") {
                window.history.pushState({}, "", "/");
              }
              setIsMobileNavOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            title={lang === "fa" ? "بازگشت به صفحه اصلی" : "Go to Home"}
          >
            <BrandLogo size={32} className="group-hover:scale-105 transition-transform" />
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors">{t.appName}</h1>
              <p className="text-[10px] text-slate-400 font-medium">{lang === "fa" ? "مدیریت چابک و سازمانی" : "Enterprise Agile Workspace"}</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileNavOpen(false)}
            className="p-1 rounded-lg hover:bg-[#1c222e] text-slate-400 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-[#212634] relative">
        <button
          type="button"
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="flex items-center justify-between w-full p-2 rounded-xl bg-[#1c222e] hover:bg-[#232b3a] transition-colors text-start border border-[#283244]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: currentWorkspace?.color || "#2563eb" }}
            >
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-xs truncate text-slate-100">
              {currentWorkspace?.name || "فضای کاری"}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Dropdown Workspaces list */}
        {isWorkspaceMenuOpen && (
          <div className="absolute top-14 start-3 end-3 z-30 rounded-xl border border-[#2a3346] bg-[#1a202c] p-1 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400">
              {t.workspaces}
            </div>
            <div className="space-y-0.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setCurrentWorkspace(ws);
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    ws.id === currentWorkspace?.id
                      ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30"
                      : "text-slate-300 hover:bg-[#232b3a]"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-600 text-slate-400">
                    {ws.user_role || "member"}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {/* Core Nav: Home & My Tasks */}
        <div className="space-y-1">
          <button
            onClick={() => {
              setCurrentView("home");
              setCurrentProject(null);
            }}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentView === "home" && !currentProject
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold"
                : "text-slate-400 hover:bg-[#1c222e] hover:text-white"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>{t.home}</span>
          </button>

          <button
            onClick={() => {
              setCurrentView("my-tasks");
              setCurrentProject(null);
            }}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentView === "my-tasks"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold"
                : "text-slate-400 hover:bg-[#1c222e] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{t.myTasks}</span>
            </div>
          </button>

          <button
            onClick={() => setIsWorkspaceMembersOpen(true)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-[#1c222e] hover:text-white transition-all"
          >
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>{t.teamMembers}</span>
          </button>

          <button
            onClick={() => setIsGithubHubOpen(true)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-[#1c222e] hover:text-white transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <GithubIcon className="h-4 w-4 text-slate-300 group-hover:text-white transition-colors" />
              <span>{lang === "fa" ? "مخازن گیت‌هاب (GitHub)" : "GitHub Repositories"}</span>
            </div>
            {user?.github_username && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0 font-mono">
                @{user.github_username}
              </Badge>
            )}
          </button>
        </div>

        {/* Projects in this Workspace */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.projects}
            </span>
            {canEdit && (
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="p-1 rounded hover:bg-[#1c222e] text-slate-400 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {projects.map((proj) => {
              const isSelected = currentProject?.id === proj.id;

              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    setCurrentProject(proj);
                    if (currentView === "home") setCurrentView("list");
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-start truncate ${
                    isSelected
                      ? "bg-blue-600/15 text-blue-400 font-bold border border-blue-500/30"
                      : "text-slate-400 hover:bg-[#1c222e] hover:text-slate-200"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color || "#2563eb" }}
                  />
                  <span className="truncate flex-1">{proj.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile & Logout at Bottom */}
      <div className="p-3 border-t border-[#212634] bg-[#101319]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1c222e] transition-colors cursor-pointer group">
          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 min-w-0 flex-1"
          >
            <Avatar src={user?.avatar_url} alt={user?.full_name} fallback={user?.full_name} size="sm" />
            <div className="truncate">
              <p className="font-bold text-xs truncate text-white">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {t[userRole as keyof typeof t] || userRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-1 text-slate-400 hover:text-white"
              title={t.settings}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={logout}
              className="p-1 text-rose-400 hover:text-rose-300"
              title={t.logout}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  </>
  );
}
