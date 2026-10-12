"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { Task } from "@/lib/api";
import { gregorianToJalali, PERSIAN_MONTH_NAMES, toPersianDigits, formatDateLocale } from "@/lib/jalali";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";

export function TimelineView() {
  const { tasks, lang, t, setActiveTaskId, searchQuery } = useApp();

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q);
  });

  // Generate 14 days window around today
  const today = new Date();
  const daysWindow: { dateStr: string; label: string; subLabel: string; isToday: boolean }[] = [];

  for (let i = -3; i <= 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = i === 0;

    let label = "";
    let subLabel = "";

    if (lang === "fa") {
      const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      label = toPersianDigits(jd);
      subLabel = PERSIAN_MONTH_NAMES[jm - 1].slice(0, 3);
    } else {
      label = d.getDate().toString();
      subLabel = d.toLocaleDateString("en-US", { weekday: "narrow" });
    }

    daysWindow.push({ dateStr, label, subLabel, isToday });
  }

  // Priority colors for timeline bars
  const getBarColor = (task: Task) => {
    if (task.status === "done") return "bg-emerald-500/80 border-emerald-600";
    if (task.priority === "urgent") return "bg-rose-500/80 border-rose-600";
    if (task.priority === "high") return "bg-orange-500/80 border-orange-600";
    if (task.priority === "medium") return "bg-indigo-500/80 border-indigo-600";
    return "bg-slate-500/80 border-slate-600";
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-200">
      {/* Timeline Controls & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-2 text-sm font-bold">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span>{lang === "fa" ? "نمای زمان‌بندی گانت تسک‌ها" : "Gantt Task Schedule"}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{t.done}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>{t.urgent}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span>{t.medium}</span>
          </div>
        </div>
      </div>

      {/* Interactive Gantt Grid Container */}
      <div className="border rounded-2xl bg-card shadow-xs overflow-x-auto">
        <div className="min-w-[950px]">
          {/* Header Row: Dates */}
          <div className="grid grid-cols-12 border-b bg-muted/30 text-center py-3 text-xs font-semibold select-none">
            <div className="col-span-4 px-4 text-start font-bold text-muted-foreground flex items-center justify-between border-e">
              <span>{t.taskTitle}</span>
              <span className="text-[11px] font-normal text-muted-foreground/70">{filteredTasks.length} {lang === "fa" ? "وظیفه" : "tasks"}</span>
            </div>
            <div className="col-span-8 grid grid-cols-14 divide-x rtl:divide-x-reverse divide-border/40">
              {daysWindow.map((day) => (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                    day.isToday
                      ? "bg-primary text-primary-foreground font-bold shadow-xs ring-2 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-80">{day.subLabel}</span>
                  <span className="text-xs font-bold mt-0.5">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Timeline Rows */}
          <div className="divide-y divide-border/60">
            {filteredTasks.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <CalendarIcon className="h-8 w-8 text-muted-foreground/40 mb-1" />
                <p className="font-medium">{t.noTasks}</p>
                <p className="text-xs text-muted-foreground/60">{lang === "fa" ? "هیچ وظیفه‌ای برای نمایش در این بازه زمانی وجود ندارد." : "No tasks found in this timeline range."}</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                // Calculate position relative to daysWindow
                const startDateStr = task.start_date || task.created_at?.split("T")[0] || daysWindow[0].dateStr;
                const dueDateStr = task.due_date || startDateStr;

                let startIdx = daysWindow.findIndex((d) => d.dateStr === startDateStr);
                let endIdx = daysWindow.findIndex((d) => d.dateStr === dueDateStr);

                if (startIdx === -1) startIdx = 0;
                if (endIdx === -1) endIdx = Math.min(startIdx + 2, daysWindow.length - 1);
                if (endIdx < startIdx) endIdx = startIdx;

                const span = Math.max(1, endIdx - startIdx + 1);
                const isRtl = lang === "fa";
                const offsetPercent = (startIdx / daysWindow.length) * 100;
                const widthPercent = (span / daysWindow.length) * 100;

                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskId(task.id)}
                    className="grid grid-cols-12 items-center py-2.5 hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    {/* Left/Start: Task Name, Status & Assignee */}
                    <div className="col-span-4 px-4 flex items-center justify-between gap-2 border-e pe-4 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={task.assignee_avatar}
                          alt={task.assignee_name}
                          fallback={task.assignee_name}
                          size="sm"
                          className="h-6 w-6 text-[10px] shrink-0 ring-1 ring-border"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {task.project_name || (task.due_date ? formatDateLocale(task.due_date, lang) : "")}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={task.status === "done" ? "success" : "outline"}
                        className="text-[10px] px-1.5 py-0 shrink-0 font-normal"
                      >
                        {t[task.status]}
                      </Badge>
                    </div>

                    {/* Right/Gantt: Track Bar across days with vertical background grid lines */}
                    <div className="col-span-8 relative h-10 flex items-center px-2">
                      {/* Sub-grid background lines for days */}
                      <div className="absolute inset-0 grid grid-cols-14 divide-x rtl:divide-x-reverse divide-border/25 pointer-events-none">
                        {daysWindow.map((d, i) => (
                          <div
                            key={i}
                            className={`h-full ${d.isToday ? "bg-primary/[0.04]" : ""}`}
                          />
                        ))}
                      </div>

                      {/* Floating Gantt Bar */}
                      <div
                        className={`absolute h-7 rounded-lg text-white text-[11px] font-medium px-2.5 flex items-center justify-between shadow-xs transition-all duration-150 hover:shadow-md hover:scale-[1.01] z-10 ${getBarColor(task)}`}
                        style={{
                          [isRtl ? "right" : "left"]: `${offsetPercent}%`,
                          width: `${widthPercent}%`,
                          minWidth: "48px",
                          maxWidth: "100%",
                        }}
                      >
                        <span className="truncate pe-1">{task.title}</span>
                        {task.status === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <span className="text-[9px] opacity-80 shrink-0 font-mono">
                            {span > 1 ? `${span}d` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
