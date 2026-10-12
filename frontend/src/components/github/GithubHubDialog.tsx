"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { api, Project } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  Lock,
  Globe,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Check,
  Copy,
  FolderKanban,
  CheckSquare
} from "lucide-react";

export function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
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

export function GithubHubDialog() {
  const {
    isGithubHubOpen,
    setIsGithubHubOpen,
    currentWorkspace,
    projects,
    setCurrentProject,
    setCurrentView,
    refreshWorkspacesAndProjects,
    lang,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"repos" | "connect">("repos");
  const [connectMethod, setConnectMethod] = useState<"token" | "public" | "oauth">("token");

  // Status
  const [connected, setConnected] = useState(false);
  const [ghUsername, setGhUsername] = useState("");
  const [ghAvatar, setGhAvatar] = useState("");
  const [hasToken, setHasToken] = useState(false);

  // Forms
  const [tokenInput, setTokenInput] = useState("");
  const [publicUserInput, setPublicUserInput] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [clientSecretInput, setClientSecretInput] = useState("");

  // Repositories
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");

  // Actions status
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch status on open
  useEffect(() => {
    if (isGithubHubOpen) {
      loadStatusAndRepos();
    }
  }, [isGithubHubOpen]);

  const loadStatusAndRepos = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const st = await api.getGithubStatus();
      setConnected(st.connected);
      setGhUsername(st.github_username);
      setGhAvatar(st.avatar_url);
      setHasToken(st.has_token);

      if (st.connected) {
        fetchReposList();
      } else {
        setActiveTab("connect");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در دریافت وضعیت گیت‌هاب");
    }
  };

  const fetchReposList = async (userToFetch?: string, customToken?: string) => {
    setLoadingRepos(true);
    setErrorMsg("");
    try {
      const data = await api.getGithubRepos({
        username: userToFetch || ghUsername || undefined,
        token: customToken || undefined,
      });
      setRepos(data || []);
      setActiveTab("repos");
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در دریافت لیست مخازن گیت‌هاب");
    } finally {
      setLoadingRepos(false);
    }
  };

  // 1. Connect via Personal Access Token (PAT)
  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg("لطفاً توکن دسترسی شخصی گیت‌هاب را وارد فرمایید.");
      return;
    }
    setLoadingAction("connect_token");
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.connectGithubToken(tokenInput.trim());
      setConnected(true);
      setGhUsername(res.github_username);
      setGhAvatar(res.avatar_url);
      setHasToken(true);
      setSuccessMsg(res.message);
      setTokenInput("");
      await fetchReposList(res.github_username, tokenInput.trim());
    } catch (e: any) {
      setErrorMsg(e.message || "توکن وارد شده نامعتبر است یا دسترسی لازم را ندارد.");
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Fetch public repos without token
  const handleFetchPublicUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUserInput.trim()) {
      setErrorMsg("لطفاً نام کاربری گیت‌هاب را وارد کنید.");
      return;
    }
    setLoadingAction("fetch_public");
    setErrorMsg("");
    try {
      await fetchReposList(publicUserInput.trim());
      setGhUsername(publicUserInput.trim());
      setActiveTab("repos");
    } catch (e: any) {
      setErrorMsg(e.message || "کاربر یافت نشد.");
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Save OAuth Config and Redirect
  const handleSaveOAuthConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setErrorMsg("هر دو فیلد Client ID و Client Secret الزامی هستند.");
      return;
    }
    if (clientIdInput.includes("@")) {
      setErrorMsg("توجه: شناسه Client ID آدرس ایمیل نیست! بلکه کد ۲۰ کاراکتری تولید شده توسط گیت‌هاب در تب OAuth application settings است.");
      return;
    }
    setLoadingAction("save_oauth");
    setErrorMsg("");
    try {
      await api.saveGithubConfig({
        client_id: clientIdInput.trim(),
        client_secret: clientSecretInput.trim(),
      });
      const redirectUri = window.location.origin;
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientIdInput.trim()}&scope=read:user,user:email,repo&redirect_uri=${encodeURIComponent(redirectUri)}`;
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در ذخیره تنظیمات OAuth");
      setLoadingAction(null);
    }
  };

  // 4. Disconnect
  const handleDisconnect = async () => {
    if (!confirm(lang === "fa" ? "آیا از قطع اتصال حساب گیت‌هاب اطمینان دارید؟" : "Disconnect GitHub account?")) return;
    setLoadingAction("disconnect");
    setErrorMsg("");
    try {
      await api.disconnectGithub();
      setConnected(false);
      setGhUsername("");
      setGhAvatar("");
      setHasToken(false);
      setRepos([]);
      setActiveTab("connect");
      setSuccessMsg("ارتباط با حساب گیت‌هاب قطع گردید.");
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در قطع اتصال");
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Import Repo as Project
  const handleImportRepo = async (repo: any) => {
    if (!currentWorkspace) {
      setErrorMsg("لطفاً ابتدا یک فضای کاری انتخاب نمایید.");
      return;
    }
    setLoadingAction(`import_${repo.id}`);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.importGithubProject({
        workspace_id: currentWorkspace.id,
        repo_url: repo.html_url,
        import_issues: true,
      });

      setSuccessMsg(res.message);
      await refreshWorkspacesAndProjects();
      setCurrentProject(res.project);
      setCurrentView("list");
      setIsGithubHubOpen(false);
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در درون‌ریزی مخزن");
    } finally {
      setLoadingAction(null);
    }
  };

  // 6. Sync issues for existing project
  const handleSyncProject = async (projectId: string) => {
    setLoadingAction(`sync_${projectId}`);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.syncProjectIssues(projectId);
      setSuccessMsg(res.message);
      await refreshWorkspacesAndProjects();
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در همگام‌سازی ایشیوها");
    } finally {
      setLoadingAction(null);
    }
  };

  // Find if a repo is already connected to any project in workspace
  const getLinkedProject = (repoHtmlUrl: string): Project | undefined => {
    const clean = repoHtmlUrl.toLowerCase().replace(/\/$/, "");
    return projects.find((p) => p.github_repo_url && p.github_repo_url.toLowerCase().replace(/\/$/, "") === clean);
  };

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchFilter.toLowerCase()));
    if (!matchesSearch) return false;
    if (visibilityFilter === "public") return !r.private;
    if (visibilityFilter === "private") return r.private;
    return true;
  });

  return (
    <Dialog open={isGithubHubOpen} onOpenChange={setIsGithubHubOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-[#151a24] border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121620] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-md shrink-0">
              <GithubIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="font-extrabold text-base flex items-center gap-2">
                <span>{lang === "fa" ? "مرکز مدیریت و مخازن گیت‌هاب (GitHub Hub)" : "GitHub Repository Hub"}</span>
                {connected && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] gap-1 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>{lang === "fa" ? `متصل به @${ghUsername}` : `Connected @${ghUsername}`}</span>
                  </Badge>
                )}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "fa"
                  ? "اتصال حساب، کاوش ریپازیتوری‌ها، تبدیل به پروژه‌های کاری و همگام‌سازی لحظه‌ای ایشیوها با وظایف سامانه"
                  : "Connect accounts, browse repositories, import as projects, and sync issues with tasks."}
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-[#1a2130] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("repos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "repos"
                  ? "bg-white dark:bg-[#151a24] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "fa" ? `مخازن (${repos.length})` : `Repositories (${repos.length})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("connect")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "connect"
                  ? "bg-white dark:bg-[#151a24] text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "fa" ? "تنظیمات اتصال" : "Connection Settings"}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-xs underline font-medium">بستن</button>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-xs underline font-medium">بستن</button>
          </div>
        )}

        {/* Tab 1: Repositories Explorer */}
        {activeTab === "repos" && (
          <div className="flex-1 flex flex-col p-5 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={lang === "fa" ? "جستجو در مخازن گیت‌هاب..." : "Search repositories..."}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="ps-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-[#121620]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Visibility pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a2130] p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      visibilityFilter === "all" ? "bg-white dark:bg-[#151a24] text-foreground font-bold shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    {lang === "fa" ? "همه" : "All"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter("public")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      visibilityFilter === "public" ? "bg-white dark:bg-[#151a24] text-foreground font-bold shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    {lang === "fa" ? "عمومی" : "Public"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter("private")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      visibilityFilter === "private" ? "bg-white dark:bg-[#151a24] text-foreground font-bold shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    {lang === "fa" ? "خصوصی" : "Private"}
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchReposList()}
                  disabled={loadingRepos}
                  className="h-9 gap-1.5 text-xs rounded-xl"
                  title="تازه‌سازی لیست"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingRepos ? "animate-spin" : ""}`} />
                  <span>{lang === "fa" ? "تازه‌سازی" : "Refresh"}</span>
                </Button>
              </div>
            </div>

            {/* Repos List */}
            <div className="flex-1 overflow-y-auto pt-4 space-y-3">
              {loadingRepos ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">{lang === "fa" ? "در حال دریافت مخازن از گیت‌هاب..." : "Loading repositories..."}</p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-center p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <GithubIcon className="h-10 w-10 text-slate-400" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {lang === "fa" ? "مخزنی یافت نشد" : "No repositories found"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      {connected
                        ? (lang === "fa" ? "حساب شما متصل است ولی مخزنی پیدا نشد یا فیلتر جستجو نتیجه‌ای ندارد." : "No repositories matching your query.")
                        : (lang === "fa" ? "برای مشاهده و مدیریت مخازن خود، ابتدا حساب گیت‌هاب را متصل فرمایید." : "Connect your GitHub account to manage repositories.")}
                    </p>
                  </div>
                  {!connected && (
                    <Button
                      onClick={() => setActiveTab("connect")}
                      className="h-9 text-xs gap-1.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>{lang === "fa" ? "اتصال حساب گیت‌هاب" : "Connect GitHub"}</span>
                    </Button>
                  )}
                </div>
              ) : (
                filteredRepos.map((repo) => {
                  const linkedProj = getLinkedProject(repo.html_url);
                  const isImporting = loadingAction === `import_${repo.id}`;
                  const isSyncing = linkedProj && loadingAction === `sync_${linkedProj.id}`;

                  return (
                    <div
                      key={repo.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181e2a] hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-2xs"
                    >
                      {/* Repo Info */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-extrabold text-sm text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate"
                          >
                            <span>{repo.full_name || repo.name}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
                          </a>

                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md font-mono">
                            {repo.private ? (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Lock className="h-2.5 w-2.5" /> {lang === "fa" ? "خصوصی" : "Private"}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-500">
                                <Globe className="h-2.5 w-2.5" /> {lang === "fa" ? "عمومی" : "Public"}
                              </span>
                            )}
                          </Badge>

                          {repo.language && (
                            <Badge className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-[10px] px-1.5 py-0">
                              {repo.language}
                            </Badge>
                          )}

                          {linkedProj && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 gap-1 font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{lang === "fa" ? `متصل به پروژه: ${linkedProj.name}` : `Project: ${linkedProj.name}`}</span>
                            </Badge>
                          )}
                        </div>

                        {repo.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{repo.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-sans">
                          <span className="flex items-center gap-1 font-mono">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500/30" />
                            {repo.stars || 0}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <GitFork className="h-3 w-3" />
                            {repo.forks || 0}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold font-mono">
                            <CheckSquare className="h-3 w-3" />
                            {repo.open_issues || 0} {lang === "fa" ? "ایشیو / وظیفه باز" : "open issues"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {linkedProj ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSyncing}
                              onClick={() => handleSyncProject(linkedProj.id)}
                              className="h-9 text-xs rounded-xl gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-900 font-bold"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                              <span>{isSyncing ? (lang === "fa" ? "در حال همگام‌سازی..." : "Syncing...") : (lang === "fa" ? "همگام‌سازی ایشیوها" : "Sync Issues")}</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setCurrentProject(linkedProj);
                                setCurrentView("list");
                                setIsGithubHubOpen(false);
                              }}
                              className="h-9 text-xs rounded-xl gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold"
                            >
                              <FolderKanban className="h-3.5 w-3.5" />
                              <span>{lang === "fa" ? "مشاهده بورد" : "View Board"}</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isImporting}
                            onClick={() => handleImportRepo(repo)}
                            className="h-9 text-xs rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isImporting ? (lang === "fa" ? "در حال درون‌ریزی..." : "Importing...") : (lang === "fa" ? "تبدیل به پروژه کاری" : "Import as Project")}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Connection Settings */}
        {activeTab === "connect" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Account Status Card */}
            {connected && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={ghAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${ghUsername}`}
                    alt="GitHub"
                    className="h-12 w-12 rounded-full border border-emerald-500/40 object-cover"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      <span>{ghUsername}</span>
                      <Badge className="bg-emerald-500 text-white text-[10px] py-0">متصل</Badge>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hasToken
                        ? "حساب شما با توکن دسترسی متصل است و دسترسی کامل به مخازن خصوصی و عمومی دارد."
                        : "حساب شما متصل است."}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={loadingAction === "disconnect"}
                  className="h-9 text-xs rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 font-bold"
                >
                  {loadingAction === "disconnect" ? "در حال قطع اتصال..." : "قطع اتصال حساب"}
                </Button>
              </div>
            )}

            {/* Connection Options */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>{lang === "fa" ? "روش‌های اتصال حساب گیت‌هاب:" : "Connection Methods:"}</span>
              </h4>

              {/* Method Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setConnectMethod("token")}
                  className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                    connectMethod === "token"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">۱. توکن شخصی (PAT)</span>
                    <Badge className="bg-emerald-500 text-white text-[9px] py-0 font-bold">پیشنهادی و آسان</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">بدون نیاز به ساخت OAuth App، فقط با وارد کردن یک توکن در ۱۰ ثانیه</p>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectMethod("public")}
                  className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                    connectMethod === "public"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="font-bold text-xs text-foreground">۲. فقط مخازن عمومی</span>
                  <p className="text-[11px] text-muted-foreground mt-1">فقط با وارد کردن نام کاربری عمومی، بدون نیاز به هیچ توکن یا رمزی</p>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectMethod("oauth")}
                  className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer ${
                    connectMethod === "oauth"
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="font-bold text-xs text-foreground">۳. ورود رسمی با OAuth</span>
                  <p className="text-[11px] text-muted-foreground mt-1">تنظیم Client ID و Client Secret جهت تأیید با صفحه سبز Authorize</p>
                </button>
              </div>

              {/* Method 1 Content: Token */}
              {connectMethod === "token" && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121620] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-foreground">اتصال فوری با Personal Access Token (PAT)</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        توکن شخصی به سامانه اجازه می‌دهد مخازن عمومی و خصوصی شما را مشاهده و ایشیوها را همگام نماید.
                      </p>
                    </div>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=PM-Software-Integration"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs shadow-xs transition-colors shrink-0"
                    >
                      <span>ساخت توکن در گیت‌هاب</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <form onSubmit={handleConnectToken} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        توکن دسترسی گیت‌هاب (Personal Access Token) *
                      </label>
                      <Input
                        required
                        type="password"
                        dir="ltr"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="h-10 text-xs font-mono bg-white dark:bg-[#151a24] rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        disabled={loadingAction === "connect_token" || !tokenInput.trim()}
                        className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all gap-1.5 cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>{loadingAction === "connect_token" ? "در حال اعتبارسنجی توکن..." : "اتصال و ذخیره توکن"}</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Method 2 Content: Public Username */}
              {connectMethod === "public" && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121620] space-y-4 animate-in fade-in">
                  <div>
                    <h5 className="font-bold text-xs text-foreground">مشاهده مخازن عمومی هر کاربر یا سازمان</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      بدون نیاز به لاگین یا توکن، می‌توانید نام هر حسابی در گیت‌هاب را وارد کنید تا مخازن عمومی آن را ببینید و تبدیل به پروژه کنید.
                    </p>
                  </div>

                  <form onSubmit={handleFetchPublicUser} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        نام کاربری یا سازمان گیت‌هاب *
                      </label>
                      <Input
                        required
                        dir="ltr"
                        placeholder="مثال: facebook یا vercel یا نام کاربری خودتان"
                        value={publicUserInput}
                        onChange={(e) => setPublicUserInput(e.target.value)}
                        className="h-10 text-xs font-mono bg-white dark:bg-[#151a24] rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        disabled={loadingAction === "fetch_public" || !publicUserInput.trim()}
                        className="h-10 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all gap-1.5 cursor-pointer"
                      >
                        <Search className="h-4 w-4" />
                        <span>{loadingAction === "fetch_public" ? "در حال دریافت مخازن..." : "دریافت مخازن عمومی"}</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Method 3 Content: Official OAuth */}
              {connectMethod === "oauth" && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#121620] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-foreground">تنظیم ورود رسمی گیت‌هاب (OAuth Application)</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        جهت باز شدن صفحه سبز رسمی Authorize در گیت‌هاب، مقادیر Client ID و Client Secret را از صفحه OAuth App در گیت‌هاب کپی کنید:
                      </p>
                    </div>
                    <a
                      href="https://github.com/settings/applications/new"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-xs transition-colors shrink-0"
                    >
                      <span>صفحه ساخت برنامه</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Warning on Client ID != Email */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>نکته بسیار مهم برای جلوگیری از خطای ۴۰۴:</span>
                    </p>
                    <p>
                      شناسه <strong>Client ID</strong> آدرس ایمیل شما نیست! بلکه یک کد ۲۰ کاراکتری (مانند <code className="font-mono bg-black/10 px-1 rounded">Ov23li8s...</code>) است که در تب تنظیمات OAuth در گیت‌هاب درج شده است.
                    </p>
                  </div>

                  <form onSubmit={handleSaveOAuthConfig} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          شناسه کلاینت (Client ID) *
                        </label>
                        <Input
                          required
                          dir="ltr"
                          placeholder="e.g. Ov23li..."
                          value={clientIdInput}
                          onChange={(e) => setClientIdInput(e.target.value)}
                          className="h-10 text-xs font-mono bg-white dark:bg-[#151a24] rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          رمز کلاینت (Client Secret) *
                        </label>
                        <Input
                          required
                          type="password"
                          dir="ltr"
                          placeholder="••••••••••••••••••••••••••••••••"
                          value={clientSecretInput}
                          onChange={(e) => setClientSecretInput(e.target.value)}
                          className="h-10 text-xs font-mono bg-white dark:bg-[#151a24] rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        disabled={loadingAction === "save_oauth" || !clientIdInput.trim() || !clientSecretInput.trim()}
                        className="h-10 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md transition-all gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>{loadingAction === "save_oauth" ? "در حال انتقال به گیت‌هاب..." : "ذخیره و انتقال به صفحه Authorize گیت‌هاب"}</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
