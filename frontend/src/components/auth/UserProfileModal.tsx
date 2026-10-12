"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Moon, Sun, Globe, LogOut, Camera, Check, AlertCircle, Save } from "lucide-react";

export function UserProfileModal() {
  const {
    isProfileOpen,
    setIsProfileOpen,
    user,
    setUser,
    logout,
    lang,
    setLang,
    theme,
    setTheme,
    t,
  } = useApp();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setFullName(user.full_name || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user, isProfileOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg(lang === "fa" ? "حجم تصویر نباید بیشتر از ۲ مگابایت باشد." : "Image size must be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setErrorMsg("");
      };
      reader.readAsDataURL(file);
    }
  };

  const [emailCode, setEmailCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const isEmailChanged = user && email.trim().toLowerCase() !== (user.email || "").toLowerCase();

  const handleSendEmailCode = async () => {
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg(lang === "fa" ? "لطفاً یک آدرس ایمیل معتبر وارد فرمایید." : "Please enter a valid email address.");
      return;
    }
    setSendingCode(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.sendEmailChangeCode(email.trim().toLowerCase());
      setCodeSent(true);
      setCooldown(res.cooldown || 120);
      setSuccessMsg(res.message || (lang === "fa" ? "کد تأیید ۶ رقمی به ایمیل جدید ارسال شد." : "Verification code sent to new email."));
    } catch (err: any) {
      setErrorMsg(err.message || (lang === "fa" ? "خطا در ارسال کد تأیید" : "Failed to send code"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg(lang === "fa" ? "نام و نام خانوادگی نمی‌تواند خالی باشد." : "Name cannot be empty.");
      return;
    }
    if (isEmailChanged && (!codeSent || !emailCode.trim())) {
      setErrorMsg(lang === "fa" ? "برای تغییر ایمیل، لطفاً ابتدا کد تأیید را دریافت کرده و وارد نمایید." : "Please enter the verification code sent to your new email.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const payload: any = {
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
      };
      if (isEmailChanged) {
        payload.email = email.trim().toLowerCase();
        payload.email_code = emailCode.trim();
      }
      const updated = await api.updateProfile(payload);
      setUser(updated);
      api.setStoredUser(updated);
      setCodeSent(false);
      setEmailCode("");
      setSuccessMsg(lang === "fa" ? "پروفایل با موفقیت بروزرسانی شد." : "Profile updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === "fa" ? "خطا در ذخیره تغییرات" : "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
      <DialogContent onClose={() => setIsProfileOpen(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span>{t.profile}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1 text-xs">
          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User Avatar Section with Upload */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-muted/30 relative gap-3">
            <div className="relative group">
              <Avatar src={avatarUrl} alt={fullName} fallback={fullName} size="lg" className="h-20 w-20 ring-4 ring-primary/20" />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-semibold"
              >
                <Camera className="h-5 w-5 mb-0.5" />
                <span>{lang === "fa" ? "تغییر عکس" : "Change"}</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="text-center">
              <Badge variant="purple" className="text-[11px] px-2.5 py-0.5">
                {t[user?.global_role as keyof typeof t] || user?.global_role}
              </Badge>
            </div>
          </div>

          {/* Form for Editing Details */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {lang === "fa" ? "نام و نام خانوادگی" : "Full Name"}
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={lang === "fa" ? "نام کامل شما..." : "Your full name..."}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{lang === "fa" ? "پست الکترونیک (ایمیل)" : "Email Address"}</span>
                {isEmailChanged && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                    {lang === "fa" ? "(نیازمند تأیید با کد)" : "(Requires verification)"}
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (codeSent) setCodeSent(false);
                  }}
                  placeholder="example@domain.com"
                  className="h-9 text-xs ltr:text-left text-left font-mono flex-1"
                  dir="ltr"
                />
                {isEmailChanged && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={sendingCode || cooldown > 0}
                    onClick={handleSendEmailCode}
                    className="h-9 text-xs shrink-0 px-3"
                  >
                    {sendingCode
                      ? (lang === "fa" ? "در حال ارسال..." : "Sending...")
                      : cooldown > 0
                      ? `${cooldown}s`
                      : (lang === "fa" ? "دریافت کد تأیید" : "Send Code")}
                  </Button>
                )}
              </div>
            </div>

            {/* OTP Code input if email was edited */}
            {isEmailChanged && codeSent && (
              <div className="space-y-1.5 p-3 rounded-xl border border-primary/30 bg-primary/5 animate-in fade-in duration-200">
                <label className="font-semibold text-primary text-xs flex items-center justify-between">
                  <span>{lang === "fa" ? "کد تأیید ۶ رقمی ایمیل جدید:" : "6-digit Verification Code:"}</span>
                  {cooldown > 0 && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {lang === "fa" ? `اعتبار: ${cooldown} ثانیه` : `${cooldown}s left`}
                    </span>
                  )}
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="h-9 text-xs text-center font-mono tracking-widest text-base font-bold bg-background"
                  dir="ltr"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full text-xs h-9 gap-1.5 font-bold mt-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? (lang === "fa" ? "در حال ذخیره..." : "Saving...") : (lang === "fa" ? "ذخیره تغییرات مشخصات" : "Save Changes")}</span>
            </Button>
          </form>

          {/* Logout Action Button */}
          <div className="pt-2 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setIsProfileOpen(false);
                logout();
              }}
              className="w-full text-xs h-9 gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.logout}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
