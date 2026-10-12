"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, GitBranch, Star, Loader2, Sparkles, FolderPlus } from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function CreateProjectDialog() {
  const {
    isCreateProjectOpen,
    setIsCreateProjectOpen,
    currentWorkspace,
    refreshWorkspacesAndProjects,
    setCurrentProject,
    setCurrentView,
    lang,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"manual" | "github">("manual");

  // Manual project states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // GitHub import states
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [importIssues, setImportIssues] = useState(true);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [githubUsernameInput, setGithubUsernameInput] = useState("");

  const colors = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#EF4444"];

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentWorkspace) return;

    setLoading(true);
    setError("");
    try {
      const proj = await api.createProject({
        workspace_id: currentWorkspace.id,
        name: name.trim(),
        description: description.trim(),
        color,
      });

      setName("");
      setDescription("");
      setIsCreateProjectOpen(false);
      await refreshWorkspacesAndProjects();
      setCurrentProject(proj);
      setCurrentView("list");
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در ساخت پروژه" : "Failed to create project"));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGithubRepos = async () => {
    if (!githubUsernameInput.trim() && !githubToken.trim()) {
      setError(lang === "fa" ? "لطفاً نام کاربری یا توکن گیت‌هاب را وارد کنید." : "Please enter username or token.");
      return;
    }
    setFetchingRepos(true);
    setError("");
    try {
      const repos = await api.getGithubRepos({
        username: githubUsernameInput.trim(),
        token: githubToken.trim() || undefined,
      });
      setUserRepos(repos);
      if (repos.length === 0) {
        setError(lang === "fa" ? "مخزنی برای این کاربر یافت نشد." : "No repositories found.");
      }
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در دریافت لیست مخازن" : "Failed to fetch repositories"));
    } finally {
      setFetchingRepos(false);
    }
  };

  const handleGithubImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubRepoUrl.trim() || !currentWorkspace) {
      setError(lang === "fa" ? "لطفاً آدرس یا نام مخزن گیت‌هاب را وارد نمایید." : "Please enter repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.importGithubProject({
        workspace_id: currentWorkspace.id,
        repo_url: githubRepoUrl.trim(),
        token: githubToken.trim() || undefined,
        import_issues: importIssues,
      });

      setSuccessMsg(res.message);
      await refreshWorkspacesAndProjects();
      setCurrentProject(res.project);
      setCurrentView("board");

      setTimeout(() => {
        setIsCreateProjectOpen(false);
        setGithubRepoUrl("");
        setSuccessMsg("");
      }, 1000);
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در درون‌ریزی مخزن گیت‌هاب" : "Failed to import GitHub project"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
      <DialogContent onClose={() => setIsCreateProjectOpen(false)} className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header with Switcher Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141822] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{t.createProject}</span>
            </DialogTitle>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab("manual");
                setError("");
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "manual"
                  ? "bg-white dark:bg-[#1e2532] text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{lang === "fa" ? "تعریف پروژه جدید" : "Standard Project"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("github");
                setError("");
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "github"
                  ? "bg-white dark:bg-[#1e2532] text-slate-900 dark:text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>{lang === "fa" ? "درون‌ریزی از گیت‌هاب (GitHub)" : "Import from GitHub"}</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === "manual" ? (
            /* Tab 1: Manual Project Creation */
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "نام پروژه *" : "Project Name *"}
                </label>
                <Input
                  autoFocus
                  required
                  placeholder={lang === "fa" ? "مثال: بازطراحی وب‌سایت یا اپلیکیشن" : "e.g. Mobile App Redesign"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "توضیحات پروژه" : "Description"}
                </label>
                <Textarea
                  rows={3}
                  placeholder={lang === "fa" ? "اهداف پروژه، محدوده کاری و یادداشت‌ها..." : "Project scope and goals..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "رنگ نمادین پروژه" : "Color Theme"}
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        color === c ? "scale-110 ring-2 ring-blue-600 ring-offset-2" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="text-xs rounded-xl h-9"
                >
                  {lang === "fa" ? "انصراف" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="text-xs px-6 font-bold bg-blue-600 hover:bg-blue-500 rounded-xl h-9"
                >
                  {loading ? (lang === "fa" ? "در حال ایجاد..." : "Creating...") : t.create}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* Tab 2: GitHub Repository Import */
            <form onSubmit={handleGithubImport} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{lang === "fa" ? "همگام‌سازی هوشمند با مخازن گیت‌هاب" : "Smart GitHub Repository Sync"}</span>
                </p>
                <p>
                  {lang === "fa"
                    ? "با اتصال مخزن گیت‌هاب، نام و توضیحات پروژه همراه با تمام ایشیوها (Issues) به صورت تسک‌های کانبان و فهرست در سامانه مدیریت پروژه ایجاد می‌گردند."
                    : "Import repository details and automatically convert all GitHub issues into Kanban/List tasks."}
                </p>
              </div>

              {/* Direct Repo Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "آدرس یا نام مخزن گیت‌هاب (owner/repo) *" : "GitHub Repository (owner/repo) *"}
                </label>
                <div className="relative">
                  <GitBranch className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    dir="ltr"
                    placeholder="e.g. facebook/react or https://github.com/owner/project"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                    className="ps-9 text-xs h-10 font-mono rounded-xl bg-slate-50 dark:bg-[#141822]"
                  />
                </div>
              </div>

              {/* Quick fetch from username */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{lang === "fa" ? "یا جستجوی مخازن بر اساس نام کاربری:" : "Or browse by username:"}</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    dir="ltr"
                    placeholder="GitHub username (e.g. torvalds)"
                    value={githubUsernameInput}
                    onChange={(e) => setGithubUsernameInput(e.target.value)}
                    className="text-xs h-9 rounded-xl font-mono bg-slate-50 dark:bg-[#141822]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchGithubRepos}
                    disabled={fetchingRepos}
                    className="h-9 text-xs px-3 font-semibold shrink-0 rounded-xl"
                  >
                    {fetchingRepos ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      lang === "fa" ? "دریافت مخازن" : "Fetch"
                    )}
                  </Button>
                </div>
              </div>

              {/* Repository Quick Selection List */}
              {userRepos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {lang === "fa" ? "مخازن یافت شده (روی مخزن مورد نظر کلیک کنید):" : "Found Repositories:"}
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 bg-slate-50/50 dark:bg-[#12161f]">
                    {userRepos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => setGithubRepoUrl(repo.full_name)}
                        className={`w-full text-start p-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                          githubRepoUrl === repo.full_name
                            ? "bg-blue-600 text-white font-bold"
                            : "hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="truncate min-w-0">
                          <p className="truncate font-mono text-[11px]">{repo.full_name}</p>
                          {repo.description && (
                            <p className="text-[10px] opacity-80 truncate">{repo.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ms-2 text-[10px] opacity-90">
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {repo.stars}
                          </span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 border-current">
                            {repo.language}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkbox: Import Issues */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="import-issues-checkbox"
                  checked={importIssues}
                  onChange={(e) => setImportIssues(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="import-issues-checkbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  {lang === "fa"
                    ? "انتقال خودکار تمام ایشیوها (Issues) به عنوان وظایف پروژه"
                    : "Automatically import all GitHub Issues as project tasks"}
                </label>
              </div>

              {/* Optional PAT Token for private repos */}
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-semibold">
                  {lang === "fa" ? "توکن دسترسی گیت‌هاب (اختیاری - ویژه مخازن خصوصی یا گذر از محدودیت نرخ)" : "Personal Access Token (Optional for private repos)"}
                </label>
                <Input
                  type="password"
                  dir="ltr"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="text-xs h-9 rounded-xl font-mono bg-slate-50 dark:bg-[#141822]"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="text-xs rounded-xl h-9"
                >
                  {lang === "fa" ? "انصراف" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !githubRepoUrl.trim()}
                  className="text-xs px-6 font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl h-9 gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{lang === "fa" ? "در حال درون‌ریزی از گیت‌هاب..." : "Importing..."}</span>
                    </>
                  ) : (
                    <>
                      <GithubIcon className="h-3.5 w-3.5" />
                      <span>{lang === "fa" ? "درون‌ریزی و ساخت پروژه" : "Import & Create Project"}</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
