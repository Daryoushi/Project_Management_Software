"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { api, Task } from "@/lib/api";
import { formatDateLocale, formatRelativeDate, toPersianDigits, getTodayFormattedLocale } from "@/lib/jalali";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  FolderKanban,
  Clock,
  Check,
  Pencil
} from "lucide-react";

export function HomeView() {
  const { user, projects, setCurrentProject, setCurrentView, lang, t, setIsCreateTaskOpen, setIsCreateProjectOpen, setActiveTaskId, refreshTasks } = useApp();
  const [summary, setSummary] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<{ today: Task[]; upcoming: Task[]; overdue: Task[]; completed: Task[] }>({
    today: [],
    upcoming: [],
    overdue: [],
    completed: []
  });
  const [activeTab, setActiveTab] = useState<"upcoming" | "today" | "overdue" | "completed">("upcoming");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      const sum = await api.getDashboardSummary();
      setSummary(sum);
      const tasksCategorized = await api.getMyTasks();
      setMyTasks(tasksCategorized);
    } catch (e) {
      console.error("Failed to load home data", e);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await api.updateTask(task.id, { status: newStatus });
      await loadHomeData();
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTaskStatus = async (task: Task, newStatus: string) => {
    try {
      await api.updateTask(task.id, { status: newStatus as any });
      await loadHomeData();
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const currentTaskList = myTasks[activeTab] || [];
  const ArrowIcon = lang === "fa" ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top greeting banner - exact Asana aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2.5">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>{getTodayFormattedLocale(lang)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {t.goodDay}، {user?.full_name?.split(" ")[0] || "کاربر"}
          </h1>
        </div>

        {/* Stats summary pill */}
        <div className="flex items-center gap-3 bg-muted/60 p-2.5 rounded-2xl border text-xs sm:text-sm">
          <div className="flex items-center gap-2 px-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold">
              {lang === "fa" ? toPersianDigits(summary?.completed_tasks ?? 0) : (summary?.completed_tasks ?? 0)}
            </span>
            <span className="text-muted-foreground">{t.tasksCompleted}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 px-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="font-semibold">
              {lang === "fa" ? toPersianDigits(summary?.collaborators_count ?? 3) : (summary?.collaborators_count ?? 3)}
            </span>
            <span className="text-muted-foreground">{t.collaborators}</span>
          </div>
        </div>
      </div>

      {/* Ready-made templates section - Asana feature from screenshot */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {/* Custom Designed Templates Logo */}
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-purple-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xs flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="8" height="8" rx="2.5" className="fill-blue-600/20 stroke-blue-600 dark:stroke-blue-400" strokeWidth="1.8" />
                <rect x="13" y="3" width="8" height="5" rx="2" className="fill-indigo-600/20 stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="1.8" />
                <rect x="13" y="10" width="8" height="11" rx="2.5" className="fill-blue-500/30 stroke-blue-600 dark:stroke-blue-400" strokeWidth="1.8" />
                <rect x="3" y="13" width="8" height="8" rx="2" className="fill-purple-600/20 stroke-purple-600 dark:stroke-purple-400" strokeWidth="1.8" />
                <path d="M7 7H7.01M17 14H17.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {lang === "fa" ? "الگوهای آماده برای شروع سریع پروژه" : "Explore ready-made templates to jumpstart your next project"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {lang === "fa"
                  ? "با استفاده از این ساختارهای حرفه‌ای، مدیریت وظایف تیم را فوراً آغاز کنید"
                  : "Jumpstart your team workflow with pre-configured project boards and timelines"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCreateProjectOpen(true)}
            className="text-xs text-primary gap-1 hidden sm:flex"
          >
            <span>{lang === "fa" ? "مشاهده همه الگوها" : "See all templates"}</span>
            <ArrowIcon className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: lang === "fa" ? "اسپرینت توسعه چابک و گیت‌هاب" : "Scrum Sprint & GitHub Dev",
              category: lang === "fa" ? "مهندسی نرم‌افزار" : "Software Engineering",
              desc: lang === "fa" ? "چرخه اسپرینت ۲ هفته‌ای، اتصال مستقیم به مخزن گیت‌هاب و ترکینگ Issueها" : "2-week agile sprint cycle, direct GitHub sync, issue tracking & code review.",
              color: "#2563eb",
              stages: lang === "fa" ? ["بک‌لاگ", "توسعه", "کد ریویو", "انتشار"] : ["Backlog", "In Dev", "Code Review", "Done"],
              tags: lang === "fa" ? ["گیت‌هاب", "بورد اسکرام", "کد ریویو"] : ["GitHub", "Scrum Board", "Code Review"],
              stats: lang === "fa" ? "۴ فاز • ۴ نقش فنی" : "4 Stages • 4 Roles",
            },
            {
              title: lang === "fa" ? "عرضه محصول و نقشه راه (GTM)" : "Product Launch & Roadmap",
              category: lang === "fa" ? "مدیریت محصول" : "Product Management",
              desc: lang === "fa" ? "زمان‌بندی فازهای لانچ، نقاط عطف (Milestones)، هماهنگی مارکتینگ و طراحی" : "Multi-phase launch timeline, strategic milestones & cross-team alignment.",
              color: "#7c3aed",
              stages: lang === "fa" ? ["تحقیق", "پروتوتایپ", "تست بتا", "عرضه عمومی"] : ["Research", "Prototype", "Beta Test", "Launch"],
              tags: lang === "fa" ? ["تایم‌لاین گانت", "نقاط عطف", "مارکتینگ"] : ["Gantt", "Milestones", "Marketing"],
              stats: lang === "fa" ? "۵ مایل‌استون • تقویم گانت" : "5 Milestones • Gantt",
            },
            {
              title: lang === "fa" ? "مرکز رسیدگی به باگ و حوادث" : "Incident & Bug Tracking",
              category: lang === "fa" ? "عملیات و QA" : "DevOps & QA",
              desc: lang === "fa" ? "اولویت‌بندی خطاهای سیستمی، پایبندی به SLA، تست رگرسیون و مستندات ریشه‌ای" : "Triage critical defects, track SLA response, regression testing & RCA notes.",
              color: "#dc2626",
              stages: lang === "fa" ? ["گزارش", "تریاژ فوری", "اصلاح", "تأیید تست"] : ["Reported", "Triaged", "Fix", "Verified"],
              tags: lang === "fa" ? ["SLA فوری", "تست QA", "ردیابی خطا"] : ["Fast SLA", "QA Testing", "Bugs"],
              stats: lang === "fa" ? "سطوح فوریت • هشدار SLA" : "Urgent SLA • Alerts",
            },
            {
              title: lang === "fa" ? "فرآیند جذب و آنبوردینگ همکار" : "HR & Team Onboarding",
              category: lang === "fa" ? "منابع انسانی" : "People & HR",
              desc: lang === "fa" ? "چک‌لیست ۳۰ روزه پیوستن به تیم، اعطای دسترسی‌ها، جلسات معارفه و انتقال دانش" : "Structured 30-day onboarding checklist, tool access, buddy pairing & culture guide.",
              color: "#059669",
              stages: lang === "fa" ? ["پیش‌آمادگی", "روز اول", "هفته اول", "ماه اول"] : ["Pre-hire", "Day 1", "Week 1", "Month 1"],
              tags: lang === "fa" ? ["چک‌لیست سازمانی", "تجهیزات", "معارفه"] : ["Checklist", "Access", "Culture"],
              stats: lang === "fa" ? "چک‌لیست مرحله‌ای • بازه ۳۰ روزه" : "Step Checklist • 30 Days",
            },
          ].map((template, idx) => (
            <Card
              key={idx}
              onClick={() => setIsCreateProjectOpen(true)}
              className="relative overflow-hidden border bg-card hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between rounded-2xl"
            >
              {/* Header color accent bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: template.color }} />

              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-md border-muted-foreground/30">
                      {template.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {template.stats}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors leading-snug">
                    {template.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {template.desc}
                  </p>

                  {/* Visual Pipeline Stages */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-foreground block mb-1.5 text-[10px]">
                      {lang === "fa" ? "مراحل گردش کار:" : "Workflow Pipeline:"}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {template.stages.map((stage, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-[10px] shadow-2xs">
                            {stage}
                          </span>
                          {sIdx < template.stages.length - 1 && (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold px-0.5">
                              {lang === "fa" ? "←" : "→"}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {template.tags.map((tg, ti) => (
                      <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-xs text-primary font-bold">
                  <span>{lang === "fa" ? "ایجاد پروژه از این الگو" : "Use this template"}</span>
                  <ArrowIcon className="h-3.5 w-3.5 group-hover:translate-x-1 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Grid: My tasks + Projects widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): My tasks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={user?.avatar_url} alt={user?.full_name} fallback={user?.full_name} size="sm" />
              <h2 className="text-base sm:text-lg font-bold">{t.myTasks}</h2>
            </div>
          </div>

          <Card className="shadow-sm">
            {/* Tabs for Upcoming, Today, Overdue, Completed */}
            <div className="flex border-b px-4 py-2 gap-2 overflow-x-auto text-xs">
              {(["upcoming", "today", "overdue", "completed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t[tab]}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {lang === "fa" ? toPersianDigits(myTasks[tab]?.length || 0) : (myTasks[tab]?.length || 0)}
                  </span>
                </button>
              ))}
            </div>

            <CardContent className="p-3 divide-y">
              {currentTaskList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                  <span>{t.noTasks}</span>
                </div>
              ) : (
                <>
                  {currentTaskList.slice(0, visibleCount).map((task) => {
                    const isDone = task.status === "done";
                    return (
                      <div
                        key={task.id}
                        className="group flex items-center justify-between py-2.5 px-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => setActiveTaskId(task.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(task);
                            }}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                              isDone
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-muted-foreground/40 hover:border-primary"
                            }`}
                          >
                            {isDone && <Check className="h-3 w-3" />}
                          </button>
                          <span className={`text-xs sm:text-sm truncate font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          {/* Direct Status Selector / Mover */}
                          <select
                            value={task.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateTaskStatus(task, e.target.value);
                            }}
                            className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${
                              task.status === "in_progress"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-900/30 dark:text-blue-400"
                                : task.status === "done"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            <option value="todo">{t.todo}</option>
                            <option value="in_progress">{t.in_progress}</option>
                            <option value="done">{t.done}</option>
                          </select>

                          {task.due_date && (
                            <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] ${
                              task.due_date < new Date().toISOString().split("T")[0] && !isDone
                                ? "bg-rose-500/10 text-rose-600 font-medium"
                                : "text-muted-foreground bg-muted"
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatRelativeDate(task.due_date, lang)}
                            </span>
                          )}
                          {task.priority && (
                            <Badge
                              variant={
                                task.priority === "urgent" || task.priority === "high"
                                  ? "destructive"
                                  : task.priority === "medium"
                                  ? "warning"
                                  : "secondary"
                              }
                              className="text-[10px] hidden sm:inline-flex"
                            >
                              {t[task.priority]}
                            </Badge>
                          )}

                          {/* Pencil Edit Icon for Direct Task Editing */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTaskId(task.id);
                            }}
                            className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted transition-colors shrink-0"
                            title={lang === "fa" ? "ویرایش وظیفه" : "Edit task"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {currentTaskList.length > visibleCount && (
                    <div className="pt-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleCount((prev) => prev + 10)}
                        className="w-full text-xs text-primary hover:text-primary/90 h-8 font-semibold bg-muted/30 hover:bg-muted rounded-xl"
                      >
                        {lang === "fa"
                          ? `نمایش وظایف بیشتر (${toPersianDigits(currentTaskList.length - visibleCount)} مورد دیگر)...`
                          : `Load More (${currentTaskList.length - visibleCount} more)...`}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Projects list & quick create */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-indigo-500" />
              {t.projects}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setIsCreateProjectOpen(true)} className="h-8 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              {t.createProject}
            </Button>
          </div>

          <div className="space-y-3">
            {/* Create project quick card */}
            <div
              onClick={() => setIsCreateProjectOpen(true)}
              className="flex items-center gap-3 p-4 border border-dashed rounded-xl hover:border-primary/60 hover:bg-muted/40 cursor-pointer transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t.createProject}</p>
                <p className="text-xs text-muted-foreground">
                  {lang === "fa" ? "ایجاد بورد، لیست و تایم‌لاین جدید" : "Create new board, list & timeline"}
                </p>
              </div>
            </div>

            {/* List of projects */}
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setCurrentProject(proj);
                  setCurrentView("list");
                }}
                className="flex items-center justify-between p-4 border rounded-xl bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="relative h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
                    style={{
                      background: `linear-gradient(135deg, ${proj.color || "#4F46E5"} 0%, ${proj.color || "#4F46E5"}cc 65%, ${proj.color || "#4F46E5"}99 100%)`,
                      boxShadow: `0 4px 12px -2px ${(proj.color || "#4F46E5")}40`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[1px]" />
                    <svg
                      className="h-5 w-5 text-white relative z-10 drop-shadow-sm"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 7.5L12 2.5L21 7.5L12 12.5L3 7.5Z"
                        fill="currentColor"
                        fillOpacity="0.35"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 12L12 17L21 12"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 16.5L12 21.5L21 16.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="7.5" r="1.5" fill="white" />
                    </svg>
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {proj.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lang === "fa"
                        ? `${toPersianDigits(proj.tasks_count || 0)} وظیفه • ${toPersianDigits(proj.completed_tasks_count || 0)} تکمیل شده`
                        : `${proj.tasks_count || 0} tasks • ${proj.completed_tasks_count || 0} completed`}
                    </p>
                  </div>
                </div>
                <ArrowIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
