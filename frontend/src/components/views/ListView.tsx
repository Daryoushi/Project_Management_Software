"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { Task, api } from "@/lib/api";
import { formatDateLocale, formatRelativeDate, toPersianDigits } from "@/lib/jalali";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  Calendar,
  User as UserIcon,
  AlertCircle,
  Clock,
  Sparkles,
  MoreHorizontal
} from "lucide-react";

export function ListView() {
  const { tasks, currentProject, lang, t, setActiveTaskId, refreshTasks, canEdit, searchQuery } = useApp();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [addingTaskSection, setAddingTaskSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = ["To do", "Doing", "Done"];

  // Filter tasks based on searchQuery
  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q));
  });

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const nextSection = nextStatus === "done" ? "Done" : "To do";
    try {
      await api.updateTask(task.id, { status: nextStatus, section: nextSection });
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickAddTask = async (section: string) => {
    if (!newTaskTitle.trim() || !currentProject) return;
    try {
      const statusMap: Record<string, "todo" | "in_progress" | "done"> = {
        "To do": "todo",
        "Doing": "in_progress",
        "Done": "done",
      };
      await api.createTask({
        project_id: currentProject.id,
        title: newTaskTitle.trim(),
        section,
        status: statusMap[section] || "todo",
        priority: "medium",
      });
      setNewTaskTitle("");
      setAddingTaskSection(null);
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const getSectionLabel = (sec: string) => {
    if (lang === "fa") {
      if (sec === "To do") return "برای انجام";
      if (sec === "Doing") return "در حال انجام";
      if (sec === "Done") return "انجام شده";
    }
    return sec;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="font-semibold">{t.urgent}</Badge>;
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

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Information Banner */}
      <div className="flex items-center justify-between bg-muted/40 border px-4 py-2 rounded-xl text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>💡</span>
          <span>{lang === "fa" ? "برای مشاهده، ویرایش اطلاعات تکمیلی و ثبت دیدگاه روی هر تسک کلیک کنید." : "Click on any task row to edit details, assignees, subtasks and comments."}</span>
        </div>
      </div>

      {/* Table Header Row */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground border-b uppercase tracking-wider">
        <div className="col-span-5">{t.taskTitle}</div>
        <div className="col-span-2">{t.assignee}</div>
        <div className="col-span-2">{t.dueDate}</div>
        <div className="col-span-1">{t.priority}</div>
        <div className="col-span-2 text-end">{t.status}</div>
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const sectionTasks = filteredTasks.filter((task) => (task.section || "To do") === section);
        const isCollapsed = collapsedSections[section];

        return (
          <div key={section} className="space-y-1">
            {/* Section Header */}
            <div
              onClick={() => toggleSection(section)}
              className="flex items-center gap-2 py-2 px-2 hover:bg-muted/60 rounded-lg cursor-pointer transition-colors group select-none"
            >
              <button className="text-muted-foreground group-hover:text-foreground">
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <span className="font-bold text-sm tracking-tight">{getSectionLabel(section)}</span>
              <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                {lang === "fa" ? toPersianDigits(sectionTasks.length) : sectionTasks.length}
              </span>
            </div>

            {/* Task Rows */}
            {!isCollapsed && (
              <div className="divide-y rounded-xl border bg-card shadow-sm overflow-hidden">
                {sectionTasks.map((task) => {
                  const isDone = task.status === "done";
                  return (
                    <div
                      key={task.id}
                      onClick={() => setActiveTaskId(task.id)}
                      className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer items-start md:items-center"
                    >
                      {/* Name & Checkbox */}
                      <div className="md:col-span-5 flex items-center gap-3 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskStatus(task);
                          }}
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isDone
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-muted-foreground/40 hover:border-primary"
                          }`}
                        >
                          {isDone && <Check className="h-3 w-3" />}
                        </button>
                        <span className={`text-sm font-medium truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </span>

                        {/* Subtask count indicator */}
                        {(task.subtasks_count || 0) > 0 && (
                          <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                            {lang === "fa"
                              ? `${toPersianDigits(task.subtasks_completed || 0)}/${toPersianDigits(task.subtasks_count || 0)}`
                              : `${task.subtasks_completed || 0}/${task.subtasks_count || 0}`}
                          </span>
                        )}
                      </div>

                      {/* Assignee */}
                      <div className="md:col-span-2 flex items-center gap-2">
                        {task.assignee_id ? (
                          <div className="flex items-center gap-2 bg-muted/70 px-2 py-1 rounded-md text-xs font-medium max-w-full truncate">
                            <Avatar src={task.assignee_avatar} alt={task.assignee_name} fallback={task.assignee_name} size="sm" className="h-5 w-5 text-[10px]" />
                            <span className="truncate">{task.assignee_name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <UserIcon className="h-3.5 w-3.5" />
                            <span>{t.unassigned}</span>
                          </div>
                        )}
                      </div>

                      {/* Due date */}
                      <div className="md:col-span-2 flex items-center gap-1.5 text-xs">
                        {task.due_date ? (
                          <span className={`px-2 py-0.5 rounded flex items-center gap-1.5 ${
                            task.due_date < new Date().toISOString().split("T")[0] && !isDone
                              ? "bg-rose-500/10 text-rose-600 font-medium"
                              : "text-muted-foreground"
                          }`}>
                            <Calendar className="h-3.5 w-3.5" />
                            {formatRelativeDate(task.due_date, lang)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </div>

                      {/* Priority */}
                      <div className="md:col-span-1">
                        {getPriorityBadge(task.priority)}
                      </div>

                      {/* Status Selector */}
                      <div className="md:col-span-2 flex items-center justify-end gap-1.5 w-full md:w-auto">
                        <select
                          value={task.status}
                          disabled={!canEdit}
                          onClick={(e) => e.stopPropagation()}
                          onChange={async (e) => {
                            e.stopPropagation();
                            const val = e.target.value;
                            const secMap: Record<string, string> = {
                              todo: "To do",
                              in_progress: "Doing",
                              done: "Done",
                            };
                            try {
                              await api.updateTask(task.id, { status: val as any, section: secMap[val] || task.section });
                              await refreshTasks();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${
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
                      </div>
                    </div>
                  );
                })}

                {/* Inline add task input or button */}
                {canEdit && (
                  <div className="p-2 bg-muted/20">
                    {addingTaskSection === section ? (
                      <div className="flex items-center gap-2 p-2">
                        <Input
                          autoFocus
                          placeholder={lang === "fa" ? "نام تسک را وارد کرده و Enter بزنید..." : "Write a task name and press Enter..."}
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleQuickAddTask(section);
                            if (e.key === "Escape") setAddingTaskSection(null);
                          }}
                          className="h-8 text-xs"
                        />
                        <Button size="sm" onClick={() => handleQuickAddTask(section)} className="h-8 text-xs">
                          {t.create}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingTaskSection(null)} className="h-8 text-xs">
                          {t.cancel}
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingTaskSection(section);
                          setNewTaskTitle("");
                        }}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium py-1.5 px-3 rounded-md hover:bg-muted transition-colors w-full text-start"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{lang === "fa" ? "افزودن تسک به این بخش..." : "Add task to section..."}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
