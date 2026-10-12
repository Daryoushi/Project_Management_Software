"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { Task } from "@/lib/api";
import {
  gregorianToJalali,
  jalaliToGregorian,
  getDaysInJalaliMonth,
  PERSIAN_MONTH_NAMES,
  ENGLISH_MONTH_NAMES,
  PERSIAN_WEEK_DAYS,
  ENGLISH_WEEK_DAYS,
  toPersianDigits,
} from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

export function CalendarView() {
  const { tasks, lang, t, setActiveTaskId, setIsCreateTaskOpen, canEdit } = useApp();

  // Current date
  const now = new Date();
  const todayJalali = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Month navigation states
  const [currentJYear, setCurrentJYear] = useState(todayJalali.jy);
  const [currentJMonth, setCurrentJMonth] = useState(todayJalali.jm); // 1-12

  const [currentGYear, setCurrentGYear] = useState(now.getFullYear());
  const [currentGMonth, setCurrentGMonth] = useState(now.getMonth() + 1); // 1-12

  const handlePrevMonth = () => {
    if (lang === "fa") {
      if (currentJMonth === 1) {
        setCurrentJMonth(12);
        setCurrentJYear(currentJYear - 1);
      } else {
        setCurrentJMonth(currentJMonth - 1);
      }
    } else {
      if (currentGMonth === 1) {
        setCurrentGMonth(12);
        setCurrentGYear(currentGYear - 1);
      } else {
        setCurrentGMonth(currentGMonth - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (lang === "fa") {
      if (currentJMonth === 12) {
        setCurrentJMonth(1);
        setCurrentJYear(currentJYear + 1);
      } else {
        setCurrentJMonth(currentJMonth + 1);
      }
    } else {
      if (currentGMonth === 12) {
        setCurrentGMonth(1);
        setCurrentGYear(currentGYear + 1);
      } else {
        setCurrentGMonth(currentGMonth + 1);
      }
    }
  };

  // Generate calendar grid days
  let totalDays = 30;
  let weekDaysHeaders = PERSIAN_WEEK_DAYS;
  let title = "";

  if (lang === "fa") {
    totalDays = getDaysInJalaliMonth(currentJYear, currentJMonth);
    title = `${PERSIAN_MONTH_NAMES[currentJMonth - 1]} ${toPersianDigits(currentJYear)}`;
    weekDaysHeaders = PERSIAN_WEEK_DAYS;
  } else {
    totalDays = new Date(currentGYear, currentGMonth, 0).getDate();
    title = `${ENGLISH_MONTH_NAMES[currentGMonth - 1]} ${currentGYear}`;
    weekDaysHeaders = ENGLISH_WEEK_DAYS;
  }

  // Map tasks to dates
  const tasksByDay: Record<number, Task[]> = {};

  // Compute offset for the 1st day of the month
  let firstDayOffset = 0;
  if (lang === "fa") {
    const { gy, gm, gd } = jalaliToGregorian(currentJYear, currentJMonth, 1);
    const jsDay = new Date(gy, gm - 1, gd).getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    // PERSIAN_WEEK_DAYS: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]
    // Sat -> 0, Sun -> 1, Mon -> 2, Tue -> 3, Wed -> 4, Thu -> 5, Fri -> 6
    const satBasedOffset = (jsDay + 1) % 7;
    firstDayOffset = satBasedOffset;
  } else {
    const jsDay = new Date(currentGYear, currentGMonth - 1, 1).getDay();
    firstDayOffset = jsDay;
  }

  tasks.forEach((task) => {
    if (!task.due_date) return;
    const parts = task.due_date.split("-");
    if (parts.length < 3) return;
    const gy = parseInt(parts[0], 10);
    const gm = parseInt(parts[1], 10);
    const gd = parseInt(parts[2], 10);

    if (lang === "fa") {
      const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
      if (jy === currentJYear && jm === currentJMonth) {
        if (!tasksByDay[jd]) tasksByDay[jd] = [];
        tasksByDay[jd].push(task);
      }
    } else {
      if (gy === currentGYear && gm === currentGMonth) {
        if (!tasksByDay[gd]) tasksByDay[gd] = [];
        tasksByDay[gd].push(task);
      }
    }
  });

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-200">
      {/* Month Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-2xl bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {lang === "fa" ? "تقویم هوشمند شمسی پروژه" : "Interactive Project Calendar"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentJYear(todayJalali.jy);
              setCurrentJMonth(todayJalali.jm);
              setCurrentGYear(now.getFullYear());
              setCurrentGMonth(now.getMonth() + 1);
            }}
            className="text-xs h-8 px-3"
          >
            {t.today}
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setIsCreateTaskOpen(true)} className="text-xs h-8 gap-1 ms-2">
              <Plus className="h-3.5 w-3.5" />
              {t.createTask}
            </Button>
          )}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground py-2 border-b">
        {weekDaysHeaders.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Leading spacer cells for month first day offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[70px] sm:min-h-[110px] p-2 rounded-xl border border-dashed border-muted/20 bg-muted/5 opacity-30" />
        ))}

        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const isToday =
            lang === "fa"
              ? currentJYear === todayJalali.jy && currentJMonth === todayJalali.jm && dayNum === todayJalali.jd
              : currentGYear === now.getFullYear() && currentGMonth === now.getMonth() + 1 && dayNum === now.getDate();

          let isHoliday = false;
          if (lang === "fa") {
            const { gy, gm, gd } = jalaliToGregorian(currentJYear, currentJMonth, dayNum);
            const jsDay = new Date(gy, gm - 1, gd).getDay();
            isHoliday = jsDay === 5; // Friday
          } else {
            const jsDay = new Date(currentGYear, currentGMonth - 1, dayNum).getDay();
            isHoliday = jsDay === 0; // Sunday
          }

          const dayTasks = tasksByDay[dayNum] || [];

          return (
            <div
              key={dayNum}
              className={`min-h-[70px] sm:min-h-[110px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                isToday
                  ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/40"
                  : isHoliday
                  ? "bg-rose-500/5 border-rose-200/60 dark:border-rose-900/40 hover:bg-rose-500/10"
                  : "bg-card hover:border-primary/40 hover:bg-muted/20"
              }`}
            >
              {/* Day Header Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isHoliday
                      ? "text-rose-600 dark:text-rose-400 font-extrabold"
                      : "text-muted-foreground"
                  }`}
                >
                  {lang === "fa" ? toPersianDigits(dayNum) : dayNum}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {lang === "fa" ? `${toPersianDigits(dayTasks.length)} تسک` : `${dayTasks.length} tasks`}
                  </span>
                )}
              </div>

              {/* Tasks in this day */}
              <div className="space-y-1.5 my-1 overflow-y-auto max-h-[80px]">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskId(task.id)}
                    className="p-1 px-1.5 rounded-md text-[11px] font-medium truncate cursor-pointer bg-muted hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1 border"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        task.status === "done"
                          ? "bg-emerald-500"
                          : task.priority === "urgent"
                          ? "bg-rose-500"
                          : "bg-indigo-500"
                      }`}
                    />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>

              {/* Empty state hint */}
              {dayTasks.length === 0 && <div className="h-2" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
