export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  github_username?: string;
  global_role: "super_admin" | "admin" | "project_manager" | "member" | "viewer";
  preferred_lang?: "fa" | "en";
  theme?: "light" | "dark";
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  owner_id: string;
  user_role?: string;
  projects_count?: number;
  members_count?: number;
}

export interface Project {
  id: string;
  workspace_id: string;
  workspace_name?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status: "active" | "archived" | "completed";
  github_repo_url?: string;
  tasks_count?: number;
  completed_tasks_count?: number;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: number | boolean;
  position?: number;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_size: string;
  file_url: string;
  file_type?: string;
}

export interface TaskTag {
  name: string;
  color: string;
}

export interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  project_color?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  section: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  reporter_id?: string;
  reporter_name?: string;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: TaskTag[];
  subtasks_count?: number;
  subtasks_completed?: number;
  comments_count?: number;
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  is_read: number | boolean;
  type?: string;
  created_at: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? "/api" : "http://127.0.0.1:8001/api");

export const api = {
  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pm_token");
  },
  setToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pm_token", token);
  },
  removeToken: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("pm_token");
  },
  getStoredUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("pm_user");
    return str ? JSON.parse(str) : null;
  },
  setStoredUser: (user: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pm_user", JSON.stringify(user));
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = api.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || `Error ${res.status}`);
    }

    return res.json();
  },

  // Auth
  login: async (email: string, password: string) => {
    return api.request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (data: { email: string; full_name: string; password: string; global_role?: string }) => {
    return api.request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  googleAuth: async (data: { credential?: string; email?: string; full_name?: string; avatar_url?: string; confirm_new_user?: boolean }) => {
    return api.request<{ access_token?: string; user?: User; needs_name?: boolean; email?: string; suggested_name?: string; avatar_url?: string; credential?: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  githubAuth: async (data: { username?: string; token?: string; email?: string; full_name?: string; confirm_new_user?: boolean }) => {
    return api.request<{ access_token?: string; user?: User; needs_name?: boolean; email?: string; username?: string; suggested_name?: string; avatar_url?: string; token?: string }>("/auth/github", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  githubExchangeCode: async (code: string) => {
    return api.request<{ access_token: string; user: User; is_new_user?: boolean }>("/auth/github/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },
  getGithubRepos: async (data: { username?: string; token?: string }) => {
    return api.request<Array<{
      id: number;
      name: string;
      full_name: string;
      description: string;
      html_url: string;
      stars: number;
      forks: number;
      open_issues: number;
      language: string;
      private: boolean;
      updated_at: string;
    }>>("/github/repos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  importGithubProject: async (data: { workspace_id: string; repo_url: string; token?: string; import_issues?: boolean }) => {
    return api.request<{ project: Project; tasks_imported: number; message: string }>("/github/import-project", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getGithubConfig: async () => {
    return api.request<{ client_id: string; configured: boolean }>("/github/config");
  },
  saveGithubConfig: async (data: { client_id: string; client_secret: string }) => {
    return api.request<{ message: string; client_id: string }>("/github/config", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getGithubStatus: async () => {
    return api.request<{ connected: boolean; github_username: string; has_token: boolean; avatar_url: string }>("/github/status");
  },
  connectGithubToken: async (token: string) => {
    return api.request<{ connected: boolean; github_username: string; avatar_url: string; message: string }>("/github/connect-token", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  disconnectGithub: async () => {
    return api.request<{ connected: boolean; message: string }>("/github/disconnect", {
      method: "POST",
    });
  },
  syncProjectIssues: async (projectId: string) => {
    return api.request<{ project_id: string; new_tasks: number; updated_tasks: number; message: string }>("/github/sync-project-issues", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId }),
    });
  },
  demoLogin: async (role: string) => {
    return api.request<{ access_token: string; user: User }>(`/auth/demo-login/${role}`, {
      method: "POST",
    });
  },
  sendVerificationCode: async (email: string) => {
    return api.request<{ message: string; code?: string }>("/auth/send-verification-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  verifyAndRegister: async (data: { email: string; code: string; full_name: string; password: string }) => {
    return api.request<{ access_token: string; user: User }>("/auth/verify-and-register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  forgotPassword: async (email: string) => {
    return api.request<{ message: string; code?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  resetPassword: async (data: { email: string; code: string; new_password: string }) => {
    return api.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  sendEmailChangeCode: async (email: string) => {
    return api.request<{ message: string; code?: string; cooldown?: number }>("/auth/send-email-change-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  updateProfile: async (data: { full_name?: string; email?: string; email_code?: string; avatar_url?: string; preferred_lang?: string; theme?: string }) => {
    return api.request<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  getMe: async () => {
    return api.request<User>("/auth/me");
  },
  getAllUsers: async () => {
    return api.request<User[]>("/auth/users");
  },

  // Workspaces
  getWorkspaces: async () => {
    return api.request<Workspace[]>("/workspaces");
  },
  createWorkspace: async (data: { name: string; description?: string }) => {
    return api.request<Workspace>("/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getWorkspaceMembers: async (workspaceId: string) => {
    return api.request<any[]>(`/workspaces/${workspaceId}/members`);
  },
  addWorkspaceMember: async (workspaceId: string, data: { email?: string; user_id?: string; role: string }) => {
    return api.request<{ message: string }>(`/workspaces/${workspaceId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  removeWorkspaceMember: async (workspaceId: string, userId: string) => {
    return api.request<{ message: string }>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  // Projects
  getProjects: async (workspaceId?: string) => {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : "";
    return api.request<Project[]>(`/projects${q}`);
  },
  getProject: async (id: string) => {
    return api.request<Project>(`/projects/${id}`);
  },
  createProject: async (data: { workspace_id: string; name: string; description?: string; color?: string }) => {
    return api.request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  deleteProject: async (id: string) => {
    return api.request<{ message: string }>(`/projects/${id}`, {
      method: "DELETE",
    });
  },
  getProjectStats: async (id: string) => {
    return api.request<any>(`/projects/${id}/stats`);
  },

  // Tasks
  getTasks: async (params?: { project_id?: string; assignee_id?: string; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.project_id) searchParams.append("project_id", params.project_id);
    if (params?.assignee_id) searchParams.append("assignee_id", params.assignee_id);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return api.request<Task[]>(`/tasks${qs}`);
  },
  getMyTasks: async () => {
    return api.request<{
      today: Task[];
      upcoming: Task[];
      overdue: Task[];
      completed: Task[];
    }>("/tasks/my-tasks");
  },
  getTask: async (id: string) => {
    return api.request<Task>(`/tasks/${id}`);
  },
  createTask: async (data: Partial<Task>) => {
    return api.request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateTask: async (id: string, data: Partial<Task>) => {
    return api.request<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteTask: async (id: string) => {
    return api.request<{ message: string }>(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  // Subtasks
  addSubtask: async (taskId: string, title: string) => {
    return api.request<Subtask>(`/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  },
  updateSubtask: async (taskId: string, subtaskId: string, data: { is_completed?: boolean; title?: string }) => {
    return api.request<{ message: string }>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteSubtask: async (taskId: string, subtaskId: string) => {
    return api.request<{ message: string }>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "DELETE",
    });
  },

  // Comments
  addComment: async (taskId: string, content: string) => {
    return api.request<Comment>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  // Attachments
  addAttachment: async (taskId: string, data: { file_name: string; file_size: string; file_url: string }) => {
    return api.request<Attachment>(`/tasks/${taskId}/attachments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Dashboard & Notifications
  getDashboardSummary: async () => {
    return api.request<any>("/dashboard/summary");
  },
  getNotifications: async () => {
    return api.request<NotificationItem[]>("/dashboard/notifications");
  },
  markNotificationRead: async (id: string) => {
    return api.request<{ message: string }>(`/dashboard/notifications/${id}/read`, {
      method: "POST",
    });
  },
  markAllNotificationsRead: async () => {
    return api.request<{ message: string }>("/dashboard/notifications/read-all", {
      method: "POST",
    });
  },
};
