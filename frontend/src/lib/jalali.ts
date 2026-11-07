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

/**
 * Iranian Official & Solar Hijri Occasions Dictionary
 */
export const JALALI_OCCASIONS: Record<string, string> = {
  // فروردین
  "1-1": "جشن نوروز / آغاز سال نو",
  "1-2": "عید نوروز",
  "1-3": "عید نوروز",
  "1-4": "عید نوروز",
  "1-12": "روز جمهوری اسلامی",
  "1-13": "روز طبیعت (سیزده‌بدر)",
  "1-18": "روز سلامتی / روز جهانی بهداشت",
  "1-25": "روز بزرگداشت عطار نیشابوری",
  "1-29": "روز ارتش جمهوری اسلامی",

  // اردیبهشت
  "2-1": "روز بزرگداشت سعدی",
  "2-2": "روز زمین پاک",
  "2-3": "روز بزرگداشت شیخ بهایی / روز معمار",
  "2-8": "روز جهانی گرافیک",
  "2-9": "روز روانشناس و مشاور",
  "2-10": "روز ملی خلیج فارس",
  "2-11": "روز جهانی کار و کارگر",
  "2-12": "روز معلم",
  "2-15": "روز جهانی ماما / جشن بهاربد",
  "2-18": "روز جهانی صلیب سرخ و هلال احمر",
  "2-25": "روز پاسداشت زبان فارسی و فردوسی",
  "2-27": "روز ارتباطات و روابط عمومی",
  "2-28": "روز بزرگداشت خیام / روز موزه و میراث فرهنگی",

  // خرداد
  "3-1": "روز بزرگداشت ملاصدرا",
  "3-3": "فتح خرمشهر / روز مقاومت و پیروزی",
  "3-14": "رحلت امام خمینی",
  "3-15": "قیام ۱۵ خرداد",
  "3-20": "روز جهانی صنایع دستی",
  "3-24": "روز جهانی اهدای خون",
  "3-27": "روز جهاد کشاورزی",
  "3-31": "روز بسیج اساتید / شهادت مصطفی چمران",

  // تیر
  "4-1": "روز اصناف",
  "4-7": "شهادت بهشتی / روز قوه قضاییه",
  "4-8": "روز مبارزه با سلاح‌های شیمیایی",
  "4-10": "روز صنعت و معدن",
  "4-14": "روز قلم",
  "4-21": "روز عفاف و حجاب",
  "4-22": "روز فناوری اطلاعات (زادروز خوارزمی)",
  "4-25": "روز بهزیستی و تامین اجتماعی",

  // مرداد
  "5-6": "روز کارآفرینی و ترویج آموزش‌های فنی و حرفه‌ای",
  "5-8": "روز بزرگداشت شیخ شهاب‌الدین سهروردی",
  "5-10": "جشن چله تابستان (چله تموز)",
  "5-14": "صدور فرمان مشروطیت",
  "5-17": "روز خبرنگار",
  "5-22": "روز جهانی تشکل‌ها و مشارکت‌های اجتماعی",
  "5-26": "آغاز بازگشت آزادگان به کشور",
  "5-28": "سالروز کودتای ۲۸ مرداد",

  // شهریور
  "6-1": "روز پزشک (بزرگداشت ابن سینا)",
  "6-2": "آغاز هفته دولت",
  "6-4": "روز کارمند / زادروز کوروش بزرگ",
  "6-5": "روز داروسازی (بزرگداشت زکریای رازی)",
  "6-8": "روز مبارزه با تروریسم",
  "6-11": "روز صنعت چاپ",
  "6-13": "روز بزرگداشت ابوریحان بیرونی / روز تعاون",
  "6-17": "قیام ۱۷ شهریور",
  "6-21": "روز سینما",
  "6-27": "روز شعر و ادب فارسی (بزرگداشت شهریار)",
  "6-30": "روز جهانی صلح",
  "6-31": "آغاز هفته دفاع مقدس",

  // مهر
  "7-1": "آغاز سال تحصیلی جدید",
  "7-5": "روز جهانی گردشگری",
  "7-7": "روز آتش‌نشانی و ایمنی",
  "7-8": "روز بزرگداشت مولوی",
  "7-9": "روز جهانی سالمندان",
  "7-13": "روز نیروی انتظامی",
  "7-14": "روز دامپزشکی",
  "7-15": "روز روستا و عشایر",
  "7-16": "روز جهانی کودک",
  "7-20": "روز بزرگداشت حافظ",
  "7-23": "روز جهانی عصای سفید (نابینایان)",
  "7-24": "روز ملی پارالمپیک",
  "7-26": "روز تربیت بدنی و ورزش",
  "7-29": "روز ملی صادرات",

  // آبان
  "8-1": "روز آمار و برنامه‌ریزی",
  "8-8": "روز پدافند غیرعامل / روز نوجوان",
  "8-10": "جشن آبانگان",
  "8-13": "روز دانش‌آموز",
  "8-18": "روز ملی کیفیت",
  "8-24": "روز کتاب، کتابخوانی و کتابدار",
  "8-28": "روز جهانی فلسفه",

  // آذر
  "9-5": "روز بسیج مستضعفان",
  "9-7": "روز نیروی دریایی",
  "9-10": "روز مجلس",
  "9-12": "روز جهانی معلولان",
  "9-13": "روز بیمه",
  "9-16": "روز دانشجو",
  "9-25": "روز پژوهش",
  "9-26": "روز حمل و نقل",
  "9-30": "شب یلدا (جشن چله)",

  // دی
  "10-1": "جشن خرم‌روز / زادروز خورشید",
  "10-5": "روز ایمنی در برابر زلزله",
  "10-19": "قیام ۱۹ دی مردم قم",
  "10-20": "سالروز شهادت امیرکبیر",
  "10-29": "روز ملی هوای پاک",

  // بهمن
  "11-1": "زادروز حکیم ابوالقاسم فردوسی",
  "11-12": "آغاز دهه فجر انقلاب اسلامی",
  "11-15": "روز فناوری فضایی",
  "11-19": "روز نیروی هوایی",
  "11-22": "سالروز پیروزی انقلاب اسلامی",
  "11-29": "جشن سپندارمذگان (روز مهر و زمین)",

  // اسفند
  "12-5": "روز مهندس (بزرگداشت خواجه نصیرالدین طوسی)",
  "12-7": "روز وکیل مدافع / استقلال کانون وکلا",
  "12-14": "روز احسان و نیکوکاری",
  "12-15": "روز درختکاری / آغاز هفته منابع طبیعی",
  "12-20": "روز ملی راهیان نور",
  "12-25": "روز بزرگداشت پروین اعتصامی / پایان سرایش شاهنامه",
  "12-29": "روز ملی شدن صنعت نفت ایران"
};

export function getJalaliOccasion(jm: number, jd: number): string | null {
  const key = `${jm}-${jd}`;
  return JALALI_OCCASIONS[key] || null;
}
