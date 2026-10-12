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
  Check
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
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-4 w-4" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: lang === "fa" ? "پیگیری و رصد درخواست‌های کاری" : "Work Requests Tracking",
              category: lang === "fa" ? "عملیات و پشتیبانی" : "Operations",
              desc: lang === "fa" ? "یک سیستم جامع برای دریافت، اولویت‌بندی و انجام درخواست‌های تیمی" : "A centralized intake system to prioritize and fulfill cross-functional work.",
              color: "#2563eb",
            },
            {
              title: lang === "fa" ? "اسپرینت‌های محصول و فنی" : "Product & Engineering Sprint",
              category: lang === "fa" ? "توسعه محصول" : "Engineering",
              desc: lang === "fa" ? "برنامه‌ریزی چرخه‌های توسعه دوهفته‌ای، تخصیص منابع و جلسات رترو" : "Plan 2-week agile cycles, track engineering velocity and blockers.",
              color: "#059669",
            },
            {
              title: lang === "fa" ? "نقشه راه محصول و تایم‌لاین" : "Product Roadmap & Timeline",
              category: lang === "fa" ? "استراتژی و عرضه" : "Strategy",
              desc: lang === "fa" ? "مشاهده فازهای کلیدی و اهداف سه‌ماهه در قالب تقویم گانت" : "Visualize key product milestones and timelines across quarters.",
              color: "#7c3aed",
            },
          ].map((template, idx) => (
            <Card
              key={idx}
              onClick={() => setIsCreateProjectOpen(true)}
              className="relative overflow-hidden border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: template.color }}
                    />
                    <Badge variant="secondary" className="text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    {template.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-primary font-semibold">
                  <span>{lang === "fa" ? "ایجاد از این الگو" : "Use template"}</span>
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
            <span className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border hidden sm:inline-flex items-center gap-1">
              <span>💡</span>
              <span>{lang === "fa" ? "با کلیک روی هر تسک می‌توانید جزئیات تکمیلی را ویرایش کنید" : "Click any task to view and edit details"}</span>
            </span>
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
                currentTaskList.map((task) => {
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
                      </div>
                    </div>
                  );
                })
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
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: proj.color || "#4F46E5" }}
                  >
                    <Layers className="h-5 w-5" />
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
