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
 * Islamic Hijri (Lunar) Month Names in Persian
 */
export const ISLAMIC_MONTH_NAMES_FA = [
  "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی",
  "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان",
  "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"
];

/**
 * Islamic Hijri (Lunar) Month Short Codes
 */
export const ISLAMIC_MONTH_SHORT_FA = [
  "محرم", "صفر", "ر۱", "ر۲",
  "ج۱", "ج۲", "رجب", "شعبان",
  "رمضان", "شوال", "ذق", "ذح"
];

/**
 * Fallback astronomical Kuwaiti algorithm for Gregorian to Hijri
 */
function kuwaitiAlgorithm(gy: number, gm: number, gd: number) {
  let y = gy;
  let m = gm;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + gd + b - 1524.5;
  const z = jd + 0.5;
  let l = Math.floor(z - 1948440 + 10632);
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l) / 709);
  const hd = l - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;
  return { hy, hm: Math.max(1, Math.min(12, hm)), hd: Math.max(1, Math.min(30, hd)) };
}

/**
 * Converts a Gregorian date to accurate Hijri (Islamic Lunar) Date
 */
export function getHijriDate(date: Date): { hy: number; hm: number; hd: number; monthName: string; shortText: string; fullText: string } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
    const parts = formatter.formatToParts(date);
    const hDay = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
    const hMonth = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
    const hYear = parseInt(parts.find((p) => p.type === "year")?.value || "1446", 10);
    const safeMonth = Math.max(1, Math.min(12, hMonth));
    const monthName = ISLAMIC_MONTH_NAMES_FA[safeMonth - 1] || "قمری";
    return {
      hy: hYear,
      hm: safeMonth,
      hd: hDay,
      monthName,
      shortText: `${toPersianDigits(hDay)} ${monthName}`,
      fullText: `${toPersianDigits(hDay)} ${monthName} ${toPersianDigits(hYear)}`,
    };
  } catch (e) {
    const kw = kuwaitiAlgorithm(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const monthName = ISLAMIC_MONTH_NAMES_FA[kw.hm - 1] || "قمری";
    return {
      hy: kw.hy,
      hm: kw.hm,
      hd: kw.hd,
      monthName,
      shortText: `${toPersianDigits(kw.hd)} ${monthName}`,
      fullText: `${toPersianDigits(kw.hd)} ${monthName} ${toPersianDigits(kw.hy)}`,
    };
  }
}

/**
 * Official Solar Hijri Holidays in Iran (تعطیلات رسمی ثابت شمسی)
 */
export const SOLAR_OFFICIAL_HOLIDAYS: Record<string, string> = {
  "1-1": "عید نوروز / آغاز سال نو",
  "1-2": "عید نوروز",
  "1-3": "عید نوروز",
  "1-4": "عید نوروز",
  "1-12": "روز جمهوری اسلامی ایران",
  "1-13": "روز طبیعت (سیزده‌بدر)",
  "3-14": "رحلت حضرت امام خمینی",
  "3-15": "قیام ۱۵ خرداد",
  "11-22": "سالروز پیروزی انقلاب اسلامی ایران",
  "12-29": "روز ملی شدن صنعت نفت ایران",
  "12-30": "آخرین روز سال (تعطیل رسمی)",
};

/**
 * Official Islamic (Lunar) Holidays in Iran mapped by Islamic Month-Day (M-D)
 */
export const LUNAR_OFFICIAL_HOLIDAYS: Record<string, string> = {
  "1-9": "تاسوعای حسینی",
  "1-10": "عاشورای حسینی",
  "2-20": "اربعین حسینی",
  "2-28": "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)",
  "2-29": "شهادت امام رضا (ع)",
  "2-30": "شهادت امام رضا (ع)",
  "3-8": "شهادت امام حسن عسکری (ع)",
  "3-17": "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)",
  "6-3": "شهادت حضرت فاطمه زهرا (س)",
  "7-13": "ولادت امام علی (ع) / روز پدر",
  "7-27": "مبعث حضرت رسول اکرم (ص)",
  "8-15": "ولادت حضرت قائم (عج) / نیمه شعبان",
  "9-21": "شهادت حضرت علی (ع)",
  "10-1": "عید سعید فطر",
  "10-2": "تعطیل عید سعید فطر",
  "10-25": "شهادت امام جعفر صادق (ع)",
  "12-10": "عید سعید قربان",
  "12-18": "عید سعید غدیر خم",
};

/**
 * Specific Official Calendar Holidays of Iran for 1403 (خورشیدی)
 */
export const IRAN_HOLIDAYS_1403: Record<string, string> = {
  "1-23": "عید سعید فطر",
  "1-24": "تعطیل عید سعید فطر",
  "2-15": "شهادت امام جعفر صادق (ع)",
  "3-28": "عید سعید قربان",
  "4-5": "عید سعید غدیر خم",
  "4-25": "تاسوعای حسینی",
  "4-26": "عاشورای حسینی",
  "6-4": "اربعین حسینی",
  "6-12": "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)",
  "6-14": "شهادت امام رضا (ع)",
  "6-22": "شهادت امام حسن عسکری (ع)",
  "6-31": "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)",
  "9-15": "شهادت حضرت فاطمه زهرا (س)",
  "10-25": "ولادت امام علی (ع) / روز پدر",
  "11-9": "مبعث حضرت رسول اکرم (ص)",
  "11-26": "ولادت حضرت قائم (عج) / نیمه شعبان",
};

/**
 * Specific Official Calendar Holidays of Iran for 1404 (خورشیدی)
 */
export const IRAN_HOLIDAYS_1404: Record<string, string> = {
  "1-11": "عید سعید فطر",
  "1-12": "تعطیل عید سعید فطر",
  "2-4": "شهادت امام جعفر صادق (ع)",
  "3-16": "عید سعید قربان",
  "3-24": "عید سعید غدیر خم",
  "4-14": "تاسوعای حسینی",
  "4-15": "عاشورای حسینی",
  "5-23": "اربعین حسینی",
  "6-1": "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)",
  "6-3": "شهادت امام رضا (ع)",
  "6-11": "شهادت امام حسن عسکری (ع)",
  "6-20": "میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)",
  "9-4": "شهادت حضرت فاطمه زهرا (س)",
  "10-14": "ولادت امام علی (ع) / روز پدر",
  "10-28": "مبعث حضرت رسول اکرم (ص)",
  "11-15": "ولادت حضرت قائم (عج) / نیمه شعبان",
  "12-21": "شهادت حضرت علی (ع)",
  "12-30": "عید سعید فطر",
};

/**
 * Specific Official Calendar Holidays of Iran for 1405 (خورشیدی)
 */
export const IRAN_HOLIDAYS_1405: Record<string, string> = {
  "1-1": "عید سعید فطر",
  "1-2": "تعطیل عید سعید فطر",
  "1-24": "شهادت امام جعفر صادق (ع)",
  "6-6": "عید سعید قربان",
  "6-14": "عید سعید غدیر خم",
  "7-4": "تاسوعای حسینی",
  "7-5": "عاشورای حسینی",
  "8-13": "اربعین حسینی",
  "8-21": "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)",
  "8-23": "شهادت امام رضا (ع)",
  "9-1": "شهادت امام حسن عسکری (ع)",
  "9-10": "میلاد رسول اکرم (ص) و امام جعفر صادق (ع)",
  "11-23": "شهادت حضرت فاطمه زهرا (س)",
  "12-4": "ولادت امام علی (ع) / روز پدر",
  "12-18": "مبعث حضرت رسول اکرم (ص)",
};

/**
 * Returns complete day details including holiday status, lunar, and gregorian dates
 */
export function getCalendarDayDetails(jy: number, jm: number, jd: number) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const dateObj = new Date(gy, gm - 1, gd);
  const jsDay = dateObj.getDay();
  const isFriday = jsDay === 5; // Friday is always weekend/holiday in Iran

  const solarKey = `${jm}-${jd}`;
  let holidayTitle: string | null = null;
  let isOfficialHoliday = false;

  // 1. Check fixed solar holiday
  if (SOLAR_OFFICIAL_HOLIDAYS[solarKey]) {
    isOfficialHoliday = true;
    holidayTitle = SOLAR_OFFICIAL_HOLIDAYS[solarKey];
  }

  // 2. Check year-specific lunar holiday tables
  if (!isOfficialHoliday) {
    if (jy === 1403 && IRAN_HOLIDAYS_1403[solarKey]) {
      isOfficialHoliday = true;
      holidayTitle = IRAN_HOLIDAYS_1403[solarKey];
    } else if (jy === 1404 && IRAN_HOLIDAYS_1404[solarKey]) {
      isOfficialHoliday = true;
      holidayTitle = IRAN_HOLIDAYS_1404[solarKey];
    } else if (jy === 1405 && IRAN_HOLIDAYS_1405[solarKey]) {
      isOfficialHoliday = true;
      holidayTitle = IRAN_HOLIDAYS_1405[solarKey];
    }
  }

  // 3. Compute accurate Hijri (lunar) date
  const hijri = getHijriDate(dateObj);
  const lunarKey = `${hijri.hm}-${hijri.hd}`;

  // 4. Fallback algorithmic lunar holiday check
  if (!isOfficialHoliday && LUNAR_OFFICIAL_HOLIDAYS[lunarKey]) {
    isOfficialHoliday = true;
    holidayTitle = LUNAR_OFFICIAL_HOLIDAYS[lunarKey];
  }

  // Check general occasions
  const occasionTitle = JALALI_OCCASIONS[solarKey] || holidayTitle || null;

  // Gregorian short string (e.g. "10 Feb")
  const gMonthShort = ENGLISH_MONTH_NAMES[gm - 1]?.slice(0, 3) || "";
  const gregorianShort = `${gd} ${gMonthShort}`;
  const gregorianFull = `${gd} ${ENGLISH_MONTH_NAMES[gm - 1]} ${gy}`;

  return {
    isFriday,
    isOfficialHoliday,
    isHoliday: isFriday || isOfficialHoliday,
    holidayTitle,
    occasionTitle,
    gregorian: {
      gy,
      gm,
      gd,
      shortText: gregorianShort,
      fullText: gregorianFull,
    },
    hijri,
  };
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
