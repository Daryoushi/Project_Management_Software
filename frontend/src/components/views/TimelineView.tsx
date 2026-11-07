"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { Task } from "@/lib/api";
import { gregorianToJalali, PERSIAN_MONTH_NAMES, PERSIAN_WEEK_DAYS, toPersianDigits, formatDateLocale, getJalaliOccasion } from "@/lib/jalali";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Pencil, ArrowLeft, ArrowRight } from "lucide-react";

export function TimelineView() {
  const { tasks, lang, t, setActiveTaskId, searchQuery } = useApp();

  const [offsetDays, setOffsetDays] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q);
  });

  // Generate 14 days window around today shifted by offsetDays
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  interface DayItem {
    dateStr: string;
    dayNum: string;
    fullMonthName: string;
    weekdayName: string;
    yearStr: string;
    isToday: boolean;
    isSelected: boolean;
    occasion: string | null;
    rawOffset: number;
  }

  const daysWindow: DayItem[] = [];

  for (let i = -3 + offsetDays; i <= 10 + offsetDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = i === 0;
    const isSelected = selectedDateStr === dateStr;

    let dayNum = "";
    let fullMonthName = "";
    let weekdayName = "";
    let yearStr = "";
    let occasion: string | null = null;

    if (lang === "fa") {
      const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      dayNum = toPersianDigits(jd);
      fullMonthName = PERSIAN_MONTH_NAMES[jm - 1];
      yearStr = toPersianDigits(jy);
      const jsDay = d.getDay(); // 0: Sun, ..., 6: Sat
      const dayIndexMap = [1, 2, 3, 4, 5, 6, 0];
      weekdayName = PERSIAN_WEEK_DAYS[dayIndexMap[jsDay]];
      occasion = getJalaliOccasion(jm, jd);
    } else {
      dayNum = d.getDate().toString();
      fullMonthName = d.toLocaleDateString("en-US", { month: "long" });
      yearStr = d.getFullYear().toString();
      weekdayName = d.toLocaleDateString("en-US", { weekday: "short" });
    }

    daysWindow.push({
      dateStr,
      dayNum,
      fullMonthName,
      weekdayName,
      yearStr,
      isToday,
      isSelected,
      occasion,
      rawOffset: i,
    });
  }

  // Active month range in current window
  const activeMonths = Array.from(new Set(daysWindow.map((d) => d.fullMonthName)));
  const currentHeaderMonth = activeMonths.join(" - ") + (daysWindow[0] ? ` ${daysWindow[0].yearStr}` : "");

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span>{lang === "fa" ? "نمای زمان‌بندی گانت تسک‌ها" : "Gantt Task Schedule"}</span>
          </div>

          {/* Month Indicator Banner with Full Month Name */}
          <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <span>{lang === "fa" ? `ماه: ${currentHeaderMonth}` : `Month: ${currentHeaderMonth}`}</span>
          </div>

          {/* Date Range Navigation Buttons (Days & Weeks) */}
          <div className="flex items-center gap-1 ms-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOffsetDays((prev) => prev - 7)}
              className="h-8 px-2 text-xs rounded-lg font-semibold"
              title={lang === "fa" ? "هفته قبل (۷ روز قبل)" : "Previous week"}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ms-1">{lang === "fa" ? "هفته قبل" : "Prev Week"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOffsetDays((prev) => prev - 1)}
              className="h-8 px-2 text-xs rounded-lg font-semibold"
              title={lang === "fa" ? "یک روز قبل" : "Previous day"}
            >
              <span>{lang === "fa" ? "روز قبل" : "Prev Day"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOffsetDays(0);
                setSelectedDateStr(null);
              }}
              className="h-8 px-2.5 text-xs rounded-lg font-semibold gap-1 bg-muted/60"
              title={lang === "fa" ? "بازگشت به امروز" : "Back to today"}
            >
              <RotateCcw className="h-3 w-3" />
              <span>{t.today}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOffsetDays((prev) => prev + 1)}
              className="h-8 px-2 text-xs rounded-lg font-semibold"
              title={lang === "fa" ? "یک روز بعد" : "Next day"}
            >
              <span>{lang === "fa" ? "روز بعد" : "Next Day"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOffsetDays((prev) => prev + 7)}
              className="h-8 px-2 text-xs rounded-lg font-semibold"
              title={lang === "fa" ? "هفته بعد (۷ روز بعد)" : "Next week"}
            >
              <span className="hidden sm:inline me-1">{lang === "fa" ? "هفته بعد" : "Next Week"}</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
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
          {/* Header Row: Dates with Full Month Name, Weekday, and Click-to-Navigate */}
          <div className="grid grid-cols-12 border-b bg-muted/30 text-center py-2 text-xs font-semibold select-none">
            <div className="col-span-4 px-4 text-start font-bold text-muted-foreground flex items-center justify-between border-e">
              <span>{t.taskTitle}</span>
              <span className="text-[11px] font-normal text-muted-foreground/70">{filteredTasks.length} {lang === "fa" ? "وظیفه" : "tasks"}</span>
            </div>
            <div className="col-span-8 grid grid-cols-14 divide-x rtl:divide-x-reverse divide-border/40">
              {daysWindow.map((day) => {
                const isCurrentFocus = day.isSelected || (day.isToday && !selectedDateStr);
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDateStr(day.dateStr);
                      setOffsetDays(day.rawOffset);
                    }}
                    title={`${day.weekdayName} ${day.dayNum} ${day.fullMonthName} ${day.yearStr}${day.occasion ? ` - مناسبت: ${day.occasion}` : ""}`}
                    className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer m-0.5 ${
                      isCurrentFocus
                        ? "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/40 scale-[1.03]"
                        : day.isToday
                        ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider opacity-85 leading-none">
                      {day.weekdayName}
                    </span>
                    <span className="text-xs font-extrabold mt-1 leading-none">
                      {day.dayNum}
                    </span>
                    <span className="text-[8px] opacity-75 mt-0.5 leading-none font-medium truncate max-w-full px-0.5">
                      {day.fullMonthName}
                    </span>
                    {day.occasion && (
                      <span className="h-1 w-1 rounded-full bg-amber-400 mt-0.5 shadow-xs" />
                    )}
                  </button>
                );
              })}
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
              <>
                {filteredTasks.slice(0, visibleCount).map((task) => {
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

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={task.status === "done" ? "success" : "outline"}
                            className="text-[10px] px-1.5 py-0 shrink-0 font-normal"
                          >
                            {t[task.status]}
                          </Badge>
                          <span className="p-1 rounded-md text-muted-foreground/60 group-hover:text-primary transition-opacity opacity-0 group-hover:opacity-100" title={lang === "fa" ? "ویرایش وظیفه" : "Edit task"}>
                            <Pencil className="h-3 w-3" />
                          </span>
                        </div>
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
                })}

                {filteredTasks.length > visibleCount && (
                  <div className="p-3 text-center bg-muted/10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="w-full text-xs text-primary hover:text-primary/90 h-8 font-semibold bg-muted/40 hover:bg-muted rounded-xl"
                    >
                      {lang === "fa"
                        ? `نمایش وظایف بیشتر (${toPersianDigits(filteredTasks.length - visibleCount)} مورد دیگر)...`
                        : `Load More (${filteredTasks.length - visibleCount} more)...`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
