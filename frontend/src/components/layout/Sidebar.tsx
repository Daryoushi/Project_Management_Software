"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
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
  Pencil,
  Trash2,
  Check,
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
    refreshWorkspacesAndProjects,
    logout,
    lang,
    t,
    canEdit,
    userRole,
  } = useApp();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [savingWs, setSavingWs] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  // Close workspace dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
        setIsAddingWorkspace(false);
      }
    }
    if (isWorkspaceMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isWorkspaceMenuOpen]);

  const handleCreateNewWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setSavingWs(true);
    try {
      const created = await api.createWorkspace({ name: newWorkspaceName.trim() });
      await refreshWorkspacesAndProjects();
      setCurrentWorkspace(created);
      setNewWorkspaceName("");
      setIsAddingWorkspace(false);
      setIsWorkspaceMenuOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to create workspace");
    } finally {
      setSavingWs(false);
    }
  };

  const handleRenameWorkspace = async (e: React.MouseEvent, wsId: string, currentName: string) => {
    e.stopPropagation();
    const newName = prompt(
      lang === "fa" ? "نام جدید فضای کاری را وارد نمایید:" : "Enter new workspace name:",
      currentName
    );
    if (!newName || !newName.trim() || newName.trim() === currentName) return;
    try {
      await api.updateWorkspace(wsId, { name: newName.trim() });
      await refreshWorkspacesAndProjects();
    } catch (err: any) {
      alert(err.message || "Failed to update workspace name");
    }
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, wsId: string, wsName: string) => {
    e.stopPropagation();
    if (
      !confirm(
        lang === "fa"
          ? `آیا از حذف فضای کاری «${wsName}» اطمینان دارید؟ تمامی پروژه‌ها و تسک‌های مربوطه حذف خواهند شد.`
          : `Delete workspace "${wsName}"? All its projects and tasks will be deleted.`
      )
    ) {
      return;
    }
    try {
      await api.deleteWorkspace(wsId);
      await refreshWorkspacesAndProjects();
    } catch (err: any) {
      alert(err.message || "Failed to delete workspace");
    }
  };

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
      <div className="p-3 border-b border-[#212634] relative" ref={workspaceMenuRef}>
        <button
          type="button"
          onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          className="flex items-center justify-between w-full p-2 rounded-xl bg-[#1c222e] hover:bg-[#232b3a] transition-colors text-start border border-[#283244] cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: currentWorkspace?.color || "#2563eb" }}
            >
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs truncate block text-slate-100">
                {currentWorkspace?.name || "فضای کاری"}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {currentWorkspace?.user_role ? (
                  currentWorkspace.user_role === "owner" ? (lang === "fa" ? "مالک شما" : "Owner") :
                  currentWorkspace.user_role === "admin" ? (lang === "fa" ? "مدیر ارشد" : "Admin") :
                  currentWorkspace.user_role === "project_manager" ? (lang === "fa" ? "مدیر پروژه" : "PM") :
                  currentWorkspace.user_role === "viewer" ? (lang === "fa" ? "مشاهده‌گر" : "Viewer") :
                  (lang === "fa" ? "عضو تیم" : "Member")
                ) : ""}
              </span>
            </div>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isWorkspaceMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Workspaces list */}
        {isWorkspaceMenuOpen && (
          <div className="absolute top-14 start-3 end-3 z-30 rounded-xl border border-[#2a3346] bg-[#1a202c] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 space-y-1">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-[#283244] pb-1.5">
              <span>{t.workspaces}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {lang === "fa" ? `${workspaces.length} فضای کاری` : `${workspaces.length} spaces`}
              </span>
            </div>

            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {workspaces.map((ws) => {
                const isOwner = ws.user_role === "owner";
                const isWsAdmin = ws.user_role === "admin" || isOwner;

                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer group/ws ${
                      ws.id === currentWorkspace?.id
                        ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30"
                        : "text-slate-300 hover:bg-[#232b3a]"
                    }`}
                  >
                    <div className="truncate min-w-0 flex items-center gap-1.5">
                      <span className="truncate">{ws.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ms-2">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium border ${
                        isOwner
                          ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
                          : isWsAdmin
                          ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                          : "border-slate-700 text-slate-400 bg-slate-800"
                      }`}>
                        {isOwner ? (lang === "fa" ? "مالک" : "Owner") : (ws.user_role || "member")}
                      </span>

                      {/* Rename button (for owner or admin) */}
                      {isWsAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleRenameWorkspace(e, ws.id, ws.name)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors opacity-70 group-hover/ws:opacity-100"
                          title={lang === "fa" ? "ویرایش نام فضای کاری" : "Rename"}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                      )}

                      {/* Delete button (only for owner and if more than 1 workspace) */}
                      {isOwner && workspaces.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteWorkspace(e, ws.id, ws.name)}
                          className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors opacity-70 group-hover/ws:opacity-100"
                          title={lang === "fa" ? "حذف فضای کاری" : "Delete"}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create new workspace action */}
            <div className="pt-1.5 border-t border-[#283244]">
              {isAddingWorkspace ? (
                <form onSubmit={handleCreateNewWorkspace} className="space-y-1.5 p-1">
                  <input
                    autoFocus
                    required
                    type="text"
                    placeholder={lang === "fa" ? "نام فضای کاری جدید..." : "Workspace name..."}
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-[#141820] border border-blue-500 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingWorkspace(false);
                        setNewWorkspaceName("");
                      }}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      {lang === "fa" ? "انصراف" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={savingWs || !newWorkspaceName.trim()}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition-colors"
                    >
                      {savingWs ? "..." : (lang === "fa" ? "ساخت" : "Create")}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingWorkspace(true)}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{lang === "fa" ? "افزودن فضای کاری جدید" : "Create New Workspace"}</span>
                </button>
              )}
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
              <p className="font-bold text-xs truncate text-white">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {t[userRole as keyof typeof t] || userRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={logout}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors"
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
