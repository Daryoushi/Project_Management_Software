"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  gregorianToJalali,
  jalaliToGregorian,
  getDaysInJalaliMonth,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS,
  toPersianDigits,
  formatDateLocale,
  ENGLISH_MONTH_NAMES,
  ENGLISH_WEEK_DAYS
} from "@/lib/jalali";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JalaliDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
  lang?: "fa" | "en";
  placeholder?: string;
  className?: string;
}

export function JalaliDatePicker({
  value,
  onChange,
  disabled = false,
  lang = "fa",
  placeholder,
  className = "",
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Parse current value
  const now = new Date();
  let defaultJ = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  let defaultG = { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };

  if (value) {
    const parts = value.split("-");
    if (parts.length === 3) {
      const gy = parseInt(parts[0], 10);
      const gm = parseInt(parts[1], 10);
      const gd = parseInt(parts[2], 10);
      defaultG = { gy, gm, gd };
      defaultJ = gregorianToJalali(gy, gm, gd);
    }
  }

  const [currentJYear, setCurrentJYear] = useState(defaultJ.jy);
  const [currentJMonth, setCurrentJMonth] = useState(defaultJ.jm);

  const [currentGYear, setCurrentGYear] = useState(defaultG.gy);
  const [currentGMonth, setCurrentGMonth] = useState(defaultG.gm);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const selectDay = (day: number) => {
    if (lang === "fa") {
      const { gy, gm, gd } = jalaliToGregorian(currentJYear, currentJMonth, day);
      const isoStr = `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
      onChange(isoStr);
    } else {
      const isoStr = `${currentGYear}-${String(currentGMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      onChange(isoStr);
    }
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Month & Day calculations
  const totalDays =
    lang === "fa"
      ? getDaysInJalaliMonth(currentJYear, currentJMonth)
      : new Date(currentGYear, currentGMonth, 0).getDate();

  const headerTitle =
    lang === "fa"
      ? `${PERSIAN_MONTH_NAMES[currentJMonth - 1]} ${toPersianDigits(currentJYear)}`
      : `${ENGLISH_MONTH_NAMES[currentGMonth - 1]} ${currentGYear}`;

  const weekHeaders = lang === "fa" ? ["ش", "ی", "د", "س", "چ", "پ", "ج"] : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];

  // Compute offset for the 1st day of the month so days align under correct weekday
  let firstDayOffset = 0;
  if (lang === "fa") {
    const { gy, gm, gd } = jalaliToGregorian(currentJYear, currentJMonth, 1);
    const jsDay = new Date(gy, gm - 1, gd).getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    // ["ش", "ی", "د", "س", "چ", "پ", "ج"] -> Sat:0, Sun:1, Mon:2, Tue:3, Wed:4, Thu:5, Fri:6
    firstDayOffset = (jsDay + 1) % 7;
  } else {
    const jsDay = new Date(currentGYear, currentGMonth - 1, 1).getDay();
    // ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"] -> Sat:0, Sun:1, Mon:2, Tue:3, Wed:4, Thu:5, Fri:6
    firstDayOffset = (jsDay + 1) % 7;
  }

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* Display Input Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-9 px-3 rounded-lg border border-input bg-background text-xs shadow-xs transition-all cursor-pointer select-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/60 focus:ring-1 focus:ring-ring"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <span className={value ? "font-semibold text-foreground" : "text-muted-foreground"}>
            {value
              ? formatDateLocale(value, lang)
              : placeholder || (lang === "fa" ? "انتخاب تاریخ..." : "Select date...")}
          </span>
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={clearDate}
            className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Jalali Calendar Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-11 start-0 z-50 w-72 rounded-xl border bg-card p-3 shadow-2xl animate-in fade-in zoom-in-95">
          {/* Calendar Header with Month & Year navigation */}
          <div className="flex items-center justify-between pb-2 border-b">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="font-bold text-xs text-foreground tracking-tight">
              {headerTitle}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 py-1.5 text-center text-[10px] font-bold text-muted-foreground">
            {weekHeaders.map((w, idx) => (
              <div key={idx}>{w}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {/* Leading spacer cells for month first day offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`spacer-${i}`} className="h-7 w-7" />
            ))}

            {Array.from({ length: totalDays }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                value &&
                (lang === "fa"
                  ? defaultJ.jy === currentJYear && defaultJ.jm === currentJMonth && defaultJ.jd === day
                  : defaultG.gy === currentGYear && defaultG.gm === currentGMonth && defaultG.gd === day);

              // Calculate day of week to highlight Fridays / weekends in red
              let isHoliday = false;
              if (lang === "fa") {
                const { gy, gm, gd } = jalaliToGregorian(currentJYear, currentJMonth, day);
                const jsDay = new Date(gy, gm - 1, gd).getDay();
                isHoliday = jsDay === 5; // Friday (جمعه) in JS getDay() is 5
              } else {
                const jsDay = new Date(currentGYear, currentGMonth - 1, day).getDay();
                isHoliday = jsDay === 0; // Sunday in Western calendar
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                      : isHoliday
                      ? "text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/10"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {lang === "fa" ? toPersianDigits(day) : day}
                </button>
              );
            })}
          </div>

          {/* Quick buttons */}
          <div className="pt-2 mt-2 border-t flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                const todayIso = new Date().toISOString().split("T")[0];
                onChange(todayIso);
                setIsOpen(false);
              }}
              className="text-primary hover:underline font-semibold"
            >
              {lang === "fa" ? "امروز" : "Today"}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              {lang === "fa" ? "بستن" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
