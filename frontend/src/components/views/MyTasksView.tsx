"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { Task, api } from "@/lib/api";
import { formatRelativeDate, toPersianDigits } from "@/lib/jalali";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Clock,
  Plus,
  Check,
  Calendar,
  AlertCircle,
  FolderKanban,
  CheckSquare,
  Sparkles
} from "lucide-react";

export function MyTasksView() {
  const { user, lang, t, setActiveTaskId, setIsCreateTaskOpen, refreshTasks, canEdit, searchQuery } = useApp();
  const [categorizedTasks, setCategorizedTasks] = useState<{
    today: Task[];
    upcoming: Task[];
    overdue: Task[];
    completed: Task[];
  }>({
    today: [],
    upcoming: [],
    overdue: [],
    completed: [],
  });
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "overdue" | "completed">("today");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMyTasks();
  }, [user]);

  const loadMyTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getMyTasks();
      setCategorizedTasks(data);
    } catch (e) {
      console.error("Failed to load my tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    try {
      await api.updateTask(task.id, { status: nextStatus });
      await loadMyTasks();
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">{t.urgent}</Badge>;
      case "high":
        return <Badge variant="destructive">{t.high}</Badge>;
      case "medium":
        return <Badge variant="warning">{t.medium}</Badge>;
      case "low":
        return <Badge variant="secondary">{t.low}</Badge>;
      default:
        return null;
    }
  };

  const tabList = [
    { id: "today", label: t.today, count: categorizedTasks.today.length },
    { id: "upcoming", label: t.upcoming, count: categorizedTasks.upcoming.length },
    { id: "overdue", label: t.overdue, count: categorizedTasks.overdue.length },
    { id: "completed", label: t.completed, count: categorizedTasks.completed.length },
  ] as const;

  const currentList = (categorizedTasks[activeTab] || []).filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{t.myTasks}</h1>
              <span className="text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1">
                <span>💡</span>
                <span>{lang === "fa" ? "کلیک روی تسک = ویرایش جزئیات" : "Click task to view details"}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "fa"
                ? "تمام وظایفی که به شما محول شده است به تفکیک زمان‌بندی"
                : "All tasks assigned to you across all projects"}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateTaskOpen(true)}
          className="h-9 px-4 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-500 shadow-sm rounded-xl"
        >
          <Plus className="h-4 w-4" />
          <span>{t.createTask}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-2 overflow-x-auto text-xs pb-1">
        {tabList.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-700/20"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {lang === "fa" ? toPersianDigits(tab.count) : tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tasks Table / List */}
      <Card className="rounded-2xl shadow-sm border overflow-hidden">
        <CardContent className="p-0 divide-y">
          {currentList.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 stroke-1" />
              <p className="font-semibold text-sm">{t.noTasks}</p>
              <p className="text-[11px]">
                {lang === "fa"
                  ? "می‌توانید با دکمه تسک جدید، وظیفه دیگری به برنامه خود بیفزایید."
                  : "You can create new tasks using the Add Task button above."}
              </p>
            </div>
          ) : (
            currentList.map((task) => {
              const isDone = task.status === "done";
              const isOverdue =
                task.due_date && task.due_date < new Date().toISOString().split("T")[0] && !isDone;

              return (
                <div
                  key={task.id}
                  onClick={() => setActiveTaskId(task.id)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/40 transition-colors cursor-pointer gap-3"
                >
                  {/* Left: Checkbox & Task Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task);
                      }}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isDone
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                          : "border-muted-foreground/40 hover:border-blue-600"
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold truncate transition-colors ${
                          isDone ? "line-through text-muted-foreground" : "text-foreground group-hover:text-blue-600"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.project_name && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.project_color || "#2563eb" }}
                          />
                          <span className="truncate">{task.project_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Badges & Due Date */}
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {/* Direct Status Selector */}
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={async (e) => {
                        e.stopPropagation();
                        try {
                          await api.updateTask(task.id, { status: e.target.value as any });
                          await refreshTasks();
                          await loadMyTasks();
                        } catch (err) {
                          console.error(err);
                        }
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

                    {/* Subtasks indicator */}
                    {(task.subtasks_count || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        <CheckSquare className="h-3 w-3" />
                        <span>
                          {lang === "fa"
                            ? `${toPersianDigits(task.subtasks_completed || 0)}/${toPersianDigits(task.subtasks_count || 0)}`
                            : `${task.subtasks_completed || 0}/${task.subtasks_count || 0}`}
                        </span>
                      </span>
                    )}

                    {/* Priority badge */}
                    {task.priority && getPriorityBadge(task.priority)}

                    {/* Due date */}
                    {task.due_date && (
                      <span
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          isOverdue
                            ? "bg-rose-500/10 text-rose-600 border border-rose-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatRelativeDate(task.due_date, lang)}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
