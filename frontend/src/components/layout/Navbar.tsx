"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { formatRelativeDate, toPersianDigits } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Bell,
  Globe,
  Sun,
  Moon,
  List,
  Kanban,
  Calendar,
  BarChart3,
  CheckCircle2,
  Share2,
  MoreHorizontal,
  Check,
  Clock,
  Menu,
  RefreshCw
} from "lucide-react";
import { GithubIcon } from "@/components/github/GithubHubDialog";

export function Navbar() {
  const {
    currentProject,
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    setIsCreateTaskOpen,
    setIsProfileOpen,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isGithubHubOpen,
    setIsGithubHubOpen,
    refreshTasks,
    notifications,
    unreadCount,
    lang,
    setLang,
    theme,
    setTheme,
    t,
    canEdit,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const handleSyncProjectGithub = async () => {
    if (!currentProject?.id) return;
    setSyncingGithub(true);
    setSyncMessage("");
    try {
      const res = await api.syncProjectIssues(currentProject.id);
      setSyncMessage(res.message);
      await refreshTasks();
      setTimeout(() => setSyncMessage(""), 5000);
    } catch (err: any) {
      setSyncMessage(err.message || "خطا در همگام‌سازی با گیت‌هاب");
      setTimeout(() => setSyncMessage(""), 5000);
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      // optimistic
      notifications.forEach((n) => (n.is_read = 1));
    } catch (e) {
      console.error(e);
    }
  };

  const projectViews = [
    { id: "list", label: t.list, icon: List },
    { id: "board", label: t.board, icon: Kanban },
    { id: "timeline", label: t.timeline, icon: Clock },
    { id: "calendar", label: t.calendar, icon: Calendar },
    { id: "dashboard", label: t.dashboard, icon: BarChart3 },
  ];

  return (
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-20">
      {/* Top Search & Actions Row */}
      <div className="flex items-center justify-between px-3 sm:px-6 h-14 gap-3 sm:gap-4">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden shrink-0"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="ps-9 h-9 text-xs bg-muted/50 border-none shadow-none focus-visible:ring-1 rounded-xl"
          />
        </div>

        {/* Right action icons & user */}
        <div className="flex items-center gap-2">
          {/* Quick Create Task */}
          {canEdit && currentProject && (
            <Button
              size="sm"
              onClick={() => setIsCreateTaskOpen(true)}
              className="h-8 text-xs gap-1.5 shadow-sm rounded-xl font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>{t.createTask}</span>
            </Button>
          )}

          {/* GitHub Hub Toggle */}
          <button
            onClick={() => setIsGithubHubOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold hover:bg-muted transition-colors border text-foreground"
            title="مرکز مدیریت مخازن گیت‌هاب / GitHub Hub"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{lang === "fa" ? "گیت‌هاب" : "GitHub"}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "fa" ? "en" : "fa")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold hover:bg-muted transition-colors border"
            title="تغییر زبان / Change Language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{lang === "fa" ? "EN" : "فارسی"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="تغییر پوسته / Change Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute top-12 end-0 z-40 w-80 rounded-2xl border bg-card p-3 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="font-bold text-xs">{t.inbox}</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      {lang === "fa" ? "خواندن همه" : "Mark all as read"}
                    </button>
                  )}
                </div>
                <div className="divide-y max-h-64 overflow-y-auto pt-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2 px-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeDate(n.created_at, lang)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      {lang === "fa" ? "اعلان جدیدی وجود ندارد" : "No notifications"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Subheader & View Tabs (when project is open) - matching Screenshot 1! */}
      {currentProject && (
        <div className="px-4 sm:px-6 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t">
          {/* Project Title and color */}
          <div className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: currentProject.color || "#4F46E5" }}
            />
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight truncate">
              {currentProject.name}
            </h2>
            {currentProject.github_repo_url && (
              <div className="flex items-center gap-1.5 ms-1">
                <a
                  href={currentProject.github_repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs shrink-0"
                  title={lang === "fa" ? "مشاهده مخزن در گیت‌هاب" : "View repository on GitHub"}
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>{lang === "fa" ? "مخزن گیت‌هاب" : "GitHub Repo"}</span>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={syncingGithub}
                  onClick={handleSyncProjectGithub}
                  className="h-7 px-2 text-[11px] gap-1 rounded-lg text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 font-bold shrink-0"
                  title={lang === "fa" ? "همگام‌سازی ایشیوها و تسک‌ها با گیت‌هاب" : "Sync issues from GitHub"}
                >
                  <RefreshCw className={`h-3 w-3 ${syncingGithub ? "animate-spin" : ""}`} />
                  <span>{syncingGithub ? (lang === "fa" ? "همگام‌سازی..." : "Syncing...") : (lang === "fa" ? "همگام‌سازی ایشیوها" : "Sync Issues")}</span>
                </Button>

                {syncMessage && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                    {syncMessage}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Five Views tabs: List, Board, Timeline, Calendar, Dashboard */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            {projectViews.map((v) => {
              const Icon = v.icon;
              const isActive = currentView === v.id;

              return (
                <button
                  key={v.id}
                  onClick={() => setCurrentView(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "text-primary border-b-2 border-primary rounded-b-none bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
