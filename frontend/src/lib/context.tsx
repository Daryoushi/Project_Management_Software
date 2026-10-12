"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Workspace, Project, Task, api, NotificationItem } from "./api";
import { Language, translations } from "./i18n";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (ws: Workspace) => void;
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (proj: Project | null) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentView: string;
  setCurrentView: (view: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  t: typeof translations.fa;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  isCreateTaskOpen: boolean;
  setIsCreateTaskOpen: (open: boolean) => void;
  isCreateProjectOpen: boolean;
  setIsCreateProjectOpen: (open: boolean) => void;
  isWorkspaceMembersOpen: boolean;
  setIsWorkspaceMembersOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  isGithubHubOpen: boolean;
  setIsGithubHubOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  refreshTasks: () => Promise<void>;
  refreshWorkspacesAndProjects: () => Promise<void>;
  authLoading: boolean;
  userRole: string;
  canEdit: boolean;
  isAdminOrPM: boolean;
  isAdmin: boolean;
  isProjectManager: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      return api.getStoredUser();
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const token = api.getToken();
      return !!token;
    }
    return true;
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentView, setCurrentView] = useState<string>("home");
  const [lang, setLangState] = useState<Language>("fa");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isWorkspaceMembersOpen, setIsWorkspaceMembersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isGithubHubOpen, setIsGithubHubOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const t = translations[lang];

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("pm_lang", newLang);
      document.documentElement.dir = newLang === "fa" ? "rtl" : "ltr";
      document.documentElement.lang = newLang;
    }
  };

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("pm_theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const logout = () => {
    api.removeToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("pm_user");
    }
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    setProjects([]);
    setCurrentProject(null);
    setTasks([]);
  };

  // Check saved session on mount
  useEffect(() => {
    const savedLang = (localStorage.getItem("pm_lang") as Language) || "fa";
    setLang(savedLang);

    const savedTheme = (localStorage.getItem("pm_theme") as "light" | "dark") || "light";
    setTheme(savedTheme);

    const checkSession = async () => {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        setAuthLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        setUser(me);
        api.setStoredUser(me);
        await refreshWorkspacesAndProjects();
      } catch (err) {
        console.error("Session expired or invalid", err);
        logout();
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  const refreshWorkspacesAndProjects = async () => {
    try {
      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      const activeWs = wsList[0] || null;
      setCurrentWorkspace(activeWs);

      if (activeWs) {
        const projList = await api.getProjects(activeWs.id);
        setProjects(projList);
        if (projList.length > 0 && !currentProject) {
          setCurrentProject(projList[0]);
        }
      }

      const notifs = await api.getNotifications().catch(() => []);
      setNotifications(notifs);
    } catch (err) {
      console.error("Failed to load workspaces", err);
    }
  };

  const refreshTasks = async () => {
    try {
      if (currentProject) {
        const taskList = await api.getTasks({ project_id: currentProject.id });
        setTasks(taskList);
      } else {
        const taskList = await api.getTasks();
        setTasks(taskList);
      }
    } catch (err) {
      console.error("Error refreshing tasks", err);
    }
  };

  useEffect(() => {
    if (currentProject) {
      refreshTasks();
    }
  }, [currentProject]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const userRole = currentWorkspace?.user_role || user?.global_role || "member";
  const isViewer = userRole === "viewer";
  const canEdit = !isViewer;
  const isAdmin = ["owner", "admin", "super_admin"].includes(userRole);
  const isProjectManager = userRole === "project_manager";
  const isAdminOrPM = isAdmin || isProjectManager;

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        logout,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        projects,
        currentProject,
        setCurrentProject,
        tasks,
        setTasks,
        currentView,
        setCurrentView,
        lang,
        setLang,
        theme,
        setTheme,
        t,
        activeTaskId,
        setActiveTaskId,
        isCreateTaskOpen,
        setIsCreateTaskOpen,
        isCreateProjectOpen,
        setIsCreateProjectOpen,
        isWorkspaceMembersOpen,
        setIsWorkspaceMembersOpen,
        isProfileOpen,
        setIsProfileOpen,
        isMobileNavOpen,
        setIsMobileNavOpen,
        isGithubHubOpen,
        setIsGithubHubOpen,
        searchQuery,
        setSearchQuery,
        notifications,
        unreadCount,
        refreshTasks,
        refreshWorkspacesAndProjects,
        authLoading,
        userRole,
        canEdit,
        isAdminOrPM,
        isAdmin,
        isProjectManager,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
