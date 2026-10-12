export type Language = "fa" | "en";

export const translations = {
  fa: {
    appName: "سامانه مدیریت پروژه",
    tagline: "ابزار جامع برنامه‌ریزی، کنترل وظایف و مدیریت تیمی",
    searchPlaceholder: "جستجو در وظایف، پروژه‌ها و اعضا...",
    create: "ایجاد",
    createTask: "تسک جدید",
    createProject: "پروژه جدید",
    createWorkspace: "فضای کاری جدید",
    myTasks: "وظایف من",
    projects: "پروژه‌ها",
    workspaces: "فضاهای کاری",
    home: "خانه و پیشخوان",
    inbox: "صندوق اعلان‌ها",
    teamMembers: "مدیریت اعضا و نقش‌ها",
    settings: "تنظیمات",
    profile: "پروفایل کاربری",
    logout: "خروج از حساب",
    quickLogin: "ورود سریع آزمایشی",

    // Views
    overview: "نمای کلی",
    list: "فهرست",
    board: "تخته وظایف",
    timeline: "زمان‌بندی",
    calendar: "تقویم شمسی",
    dashboard: "داشبورد تحلیلی",

    // Sections & Status
    todo: "برای انجام",
    in_progress: "در حال انجام",
    review: "در حال بازبینی",
    done: "انجام شده",

    // Priority
    low: "پایین",
    medium: "متوسط",
    high: "بالا",
    urgent: "فوری",

    // Roles
    super_admin: "مدیر ارشد سامانه",
    admin: "مدیر",
    owner: "مالک فضای کاری",
    project_manager: "مدیر پروژه",
    member: "عضو تیم",
    viewer: "مشاهده‌گر",

    // Task details
    taskTitle: "عنوان وظیفه",
    taskDesc: "توضیحات و شرح تسک",
    assignee: "مسئول تسک",
    unassigned: "بدون مسئول",
    dueDate: "تاریخ سررسید",
    startDate: "تاریخ شروع",
    priority: "اولویت",
    status: "وضعیت",
    section: "ستون / بخش",
    tags: "برچسب‌ها",
    subtasks: "زیرتسک‌ها و چک‌لیست",
    addSubtask: "افزودن زیرتسک...",
    comments: "گفتگو و نظرات",
    writeComment: "دیدگاه یا نظری بنویسید...",
    sendComment: "ارسال نظر",
    attachments: "فایل‌های ضمیمه",
    uploadFile: "آپلود فایل",
    activity: "تاریخچه فعالیت‌ها",

    // Asana Dashboard
    goodDay: "وقت بخیر",
    tasksCompleted: "تسک‌های تکمیل شده",
    collaborators: "همکاران و اعضا",
    aiRecommendations: "پیشنهادات هوش مصنوعی برای پروژه شما",
    upcoming: "پیش‌رو",
    today: "امروز",
    overdue: "دارای تاخیر",
    completed: "تکمیل شده",
    noTasks: "تسکی در این بخش وجود ندارد.",

    // Role permissions alert
    permissionDenied: "شما مجوز انجام این عملیات را با نقش فعلی خود ندارید.",
    readOnlyMode: "حالت فقط خواندنی (مشاهده‌گر)",

    // Common
    save: "ذخیره تغییرات",
    cancel: "انصراف",
    delete: "حذف",
    edit: "ویرایش",
    filter: "فیلتر",
    sort: "مرتب‌سازی",
    all: "همه",
    name: "نام و نام خانوادگی",
    email: "پست الکترونیک",
    role: "نقش و دسترسی",
    actions: "عملیات",
    inviteMember: "دعوت عضو جدید",
    enterEmail: "ایمیل عضو را وارد کنید",
  },
  en: {
    appName: "Project Manager",
    tagline: "Comprehensive Task Tracking & Team Collaboration",
    searchPlaceholder: "Search tasks, projects, members...",
    create: "Create",
    createTask: "Add task",
    createProject: "Create project",
    createWorkspace: "New workspace",
    myTasks: "My tasks",
    projects: "Projects",
    workspaces: "Workspaces",
    home: "Home",
    inbox: "Inbox",
    teamMembers: "Team & Roles",
    settings: "Settings",
    profile: "Profile",
    logout: "Log out",
    quickLogin: "Quick Switch User",

    // Views
    overview: "Overview",
    list: "List",
    board: "Board",
    timeline: "Timeline",
    calendar: "Calendar",
    dashboard: "Dashboard",

    // Sections & Status
    todo: "To do",
    in_progress: "In progress",
    review: "In review",
    done: "Done",

    // Priority
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",

    // Roles
    super_admin: "Super Admin",
    admin: "Admin",
    owner: "Owner",
    project_manager: "Project Manager",
    member: "Member",
    viewer: "Viewer",

    // Task details
    taskTitle: "Task title",
    taskDesc: "Description",
    assignee: "Assignee",
    unassigned: "Unassigned",
    dueDate: "Due date",
    startDate: "Start date",
    priority: "Priority",
    status: "Status",
    section: "Section",
    tags: "Tags",
    subtasks: "Subtasks",
    addSubtask: "Add a subtask...",
    comments: "Comments",
    writeComment: "Write a comment...",
    sendComment: "Comment",
    attachments: "Attachments",
    uploadFile: "Upload attachment",
    activity: "Activity",

    // Asana Dashboard
    goodDay: "Good day",
    tasksCompleted: "tasks completed",
    collaborators: "collaborators",
    aiRecommendations: "Your AI Teammate recommendations",
    upcoming: "Upcoming",
    today: "Today",
    overdue: "Overdue",
    completed: "Completed",
    noTasks: "No tasks here.",

    // Role permissions alert
    permissionDenied: "You do not have permission with your current role.",
    readOnlyMode: "Read-only mode (Viewer)",

    // Common
    save: "Save changes",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    filter: "Filter",
    sort: "Sort",
    all: "All",
    name: "Full Name",
    email: "Email address",
    role: "Role & Permission",
    actions: "Actions",
    inviteMember: "Invite member",
    enterEmail: "Enter teammate's email",
  }
};
