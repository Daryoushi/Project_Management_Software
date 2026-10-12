/**
 * Jalali (Solar Hijri) Calendar Conversion & Utility Algorithms
 * High precision, zero dependency
 */

export const PERSIAN_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

export const ENGLISH_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const PERSIAN_WEEK_DAYS = [
  "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"
];

export const ENGLISH_WEEK_DAYS = [
  "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"
];

export function toPersianDigits(n: number | string): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let sal_a: number;
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_g = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= sal_g[gm]) {
    days -= sal_g[gm];
    gm++;
  }
  const gd = days + 1;
  return { gy, gm, gd };
}

export function formatDateLocale(dateStr?: string | null, lang: "fa" | "en" = "fa"): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const gy = parseInt(parts[0], 10);
    const gm = parseInt(parts[1], 10);
    const gd = parseInt(parts[2], 10);

    if (lang === "en") {
      const month = ENGLISH_MONTH_NAMES[gm - 1]?.slice(0, 3) || "";
      return `${month} ${gd}`;
    }

    const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
    const month = PERSIAN_MONTH_NAMES[jm - 1];
    return `${toPersianDigits(jd)} ${month} ${toPersianDigits(jy)}`;
  } catch (e) {
    return dateStr;
  }
}

export function formatRelativeDate(dateStr?: string | null, lang: "fa" | "en" = "fa"): string {
  if (!dateStr) return "-";
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dateStr === todayStr) {
      return lang === "fa" ? "امروز" : "Today";
    }
    if (diffDays === 1) {
      return lang === "fa" ? "فردا" : "Tomorrow";
    }
    if (diffDays === -1) {
      return lang === "fa" ? "دیروز" : "Yesterday";
    }
    return formatDateLocale(dateStr, lang);
  } catch (e) {
    return dateStr;
  }
}

export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Leap year check
  const r = (jy % 33);
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(r);
  return isLeap ? 30 : 29;
}

/**
 * Returns dynamic, accurate formatted string for today's date
 */
export function getTodayFormattedLocale(lang: "fa" | "en" = "fa"): string {
  const d = new Date();
  if (lang === "en") {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  // Persian day of week (Saturday = 6 in JS? JS: 0 is Sun, 6 is Sat)
  const jsDay = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  const dayIndexMap = [1, 2, 3, 4, 5, 6, 0]; // 0 (Sun) -> 1 (یکشنبه), 6 (Sat) -> 0 (شنبه)
  const weekDayName = PERSIAN_WEEK_DAYS[dayIndexMap[jsDay]];

  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const monthName = PERSIAN_MONTH_NAMES[jm - 1];

  return `${weekDayName}، ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}
