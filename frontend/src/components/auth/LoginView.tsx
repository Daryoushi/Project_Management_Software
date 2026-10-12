"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Globe,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Send,
  Calendar,
  Layers,
  Sparkles,
  Check,
  ExternalLink,
  Copy
} from "lucide-react";

export function LoginView() {
  const { setUser, refreshWorkspacesAndProjects, lang, setLang, theme, setTheme, t } = useApp();

  // Mode: "login" | "register" | "forgot"
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Step states
  const [codeSent, setCodeSent] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "code">("email");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Google new user prompt states
  const [googleNewUserData, setGoogleNewUserData] = useState<{
    email: string;
    suggested_name: string;
    avatar_url: string;
    credential?: string;
  } | null>(null);
  const [googleFullName, setGoogleFullName] = useState("");

  // Typewriter dynamic headline
  const targetHeadline = lang === "fa"
    ? "کنترل هوشمند وظایف، برنامه‌ریزی تیمی و پیشرفت لحظه‌ای"
    : "Smart Task Tracking & Real-Time Team Collaboration";

  const [displayedHeadline, setDisplayedHeadline] = useState("");
  
  useEffect(() => {
    let index = 0;
    setDisplayedHeadline("");
    const timer = setInterval(() => {
      if (index <= targetHeadline.length) {
        setDisplayedHeadline(targetHeadline.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 75);
    return () => clearInterval(timer);
  }, [targetHeadline]);

  const ArrowIcon = lang === "fa" ? ArrowLeft : ArrowRight;

  // 120-second countdown timer for verification code requests
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const timeStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    if (lang === "fa") {
      return timeStr.replace(/[0-9]/g, (w) => "۰۱۲۳۴۵۶۷۸۹"[+w]);
    }
    return timeStr;
  };

  // 1. Send verification code for registration
  const handleSendVerificationCode = async () => {
    if (cooldown > 0) return;
    if (!email.trim()) {
      setError(lang === "fa" ? "لطفاً ایمیل معتبر وارد کنید." : "Please enter your email.");
      return;
    }
    setLoading(true);
    setError("");
    setInfoMsg("");
    try {
      const res = await api.sendVerificationCode(email.trim());
      setCodeSent(true);
      setCooldown(120);
      if ((res as any)?.code) {
        setVerificationCode((res as any).code);
      }
      setInfoMsg(res.message || (lang === "fa" ? `کد تأیید ۶ رقمی به ${email} ارسال شد.` : `Verification code sent to ${email}.`));
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در ارسال کد تأیید" : "Failed to send code"));
    } finally {
      setLoading(false);
    }
  };

  // 2. Forgot password request
  const handleForgotPasswordRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0) return;
    if (!email.trim()) {
      setError(lang === "fa" ? "لطفاً ایمیل خود را وارد کنید." : "Please enter your email.");
      return;
    }
    setLoading(true);
    setError("");
    setInfoMsg("");
    try {
      const res = await api.forgotPassword(email.trim());
      setForgotStep("code");
      setCooldown(120);
      if ((res as any)?.code) {
        setResetCode((res as any).code);
      }
      setInfoMsg(res.message || (lang === "fa" ? `کد بازیابی رمز عبور به ${email} ارسال شد.` : `Reset code sent to ${email}.`));
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "حساب کاربری یافت نشد." : "Account not found."));
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset password submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword.trim()) {
      setError(lang === "fa" ? "لطفاً کد بازیابی و رمز جدید را وارد کنید." : "Please enter code and new password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.resetPassword({
        email: email.trim(),
        code: resetCode.trim(),
        new_password: newPassword.trim(),
      });
      setInfoMsg(res.message);
      setMode("login");
      setPassword("");
      setResetCode("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در تغییر رمز عبور" : "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  // Google Icon Component
  function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
    );
  }

  // GitHub Icon Component
  function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    );
  }

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = document.getElementById("google-gsi-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "27962575886-mjv71o6a67vn8i8olj8ivv9qrs3j08js.apps.googleusercontent.com";

  // Process Google auth response
  const processGoogleAuthResult = async (res: any) => {
    if (res.needs_name) {
      setGoogleNewUserData({
        email: res.email || "",
        suggested_name: res.suggested_name || "",
        avatar_url: res.avatar_url || "",
        credential: res.credential || "",
      });
      setGoogleFullName(res.suggested_name || "");
      setLoading(false);
      return;
    }

    if (res.access_token && res.user) {
      api.setToken(res.access_token);
      api.setStoredUser(res.user);
      setUser(res.user);
      await refreshWorkspacesAndProjects();
    }
  };

  // Complete Google registration with confirmed full name
  const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleFullName.trim()) {
      setError(lang === "fa" ? "لطفاً نام و نام خانوادگی خود را وارد نمایید." : "Please enter your full name.");
      return;
    }
    if (!googleNewUserData) return;

    setLoading(true);
    setError("");
    try {
      const res = await api.googleAuth({
        email: googleNewUserData.email,
        full_name: googleFullName.trim(),
        avatar_url: googleNewUserData.avatar_url,
        credential: googleNewUserData.credential,
        confirm_new_user: true,
      });
      if (res.access_token && res.user) {
        setGoogleNewUserData(null);
        api.setToken(res.access_token);
        api.setStoredUser(res.user);
        setUser(res.user);
        await refreshWorkspacesAndProjects();
      }
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در تکمیل ثبت‌نام با گوگل" : "Failed to register Google account"));
    } finally {
      setLoading(false);
    }
  };

  // Callback when Google returns a credential (from One Tap or official button)
  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.googleAuth({ credential: response.credential });
      await processGoogleAuthResult(res);
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در تأیید هویت حساب گوگل" : "Google authentication error"));
    } finally {
      setLoading(false);
    }
  };

  // Google One Tap & Button Initialization
  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(interval);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
          });
          (window as any).google.accounts.id.prompt();

          const btnContainer = document.getElementById("google-official-btn");
          if (btnContainer && (window as any).google.accounts.id.renderButton) {
            (window as any).google.accounts.id.renderButton(btnContainer, {
              theme: theme === "dark" ? "filled_black" : "outline",
              size: "large",
              width: 380,
              text: "continue_with",
              locale: "fa",
              shape: "rectangular",
            });
          }
        } catch (e) {}
      }
    }, 400);
    return () => clearInterval(interval);
  }, [GOOGLE_CLIENT_ID, theme]);

  // Direct email login modal state
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directEmail, setDirectEmail] = useState("");

  // Direct login with email (Google or any work email):
  // 1. If email exists in database -> Logs in immediately!
  // 2. If email is new -> Prompts for full name, creates account, logs in immediately!
  const handleDirectAuth = async (inputEmail: string) => {
    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(lang === "fa" ? "لطفاً نشانی ایمیل معتبر وارد فرمایید." : "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    setInfoMsg("");

    try {
      const res = await api.googleAuth({ email: cleanEmail });
      if (res.needs_name) {
        setShowDirectModal(false);
        setGoogleNewUserData({
          email: cleanEmail,
          suggested_name: res.suggested_name || "",
          avatar_url: res.avatar_url || "",
          credential: "",
        });
        setGoogleFullName(res.suggested_name || "");
        return;
      }

      if (res.access_token && res.user) {
        setShowDirectModal(false);
        api.setToken(res.access_token);
        api.setStoredUser(res.user);
        setUser(res.user);
        await refreshWorkspacesAndProjects();
      }
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در ورود به حساب کاربری" : "Sign-in error"));
    } finally {
      setLoading(false);
    }
  };

  // Google Official Account Chooser Trigger (matching Quera & Google OAuth)
  const handleGoogleButtonClick = () => {
    setError("");
    setInfoMsg("");

    // 1. Try Google Identity Services OAuth2 Token Client (Popup Account Chooser)
    if ((window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile openid",
          prompt: "select_account",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              if (tokenResponse.error !== "popup_closed_by_user") {
                setError(lang === "fa" ? "خطا در ارتباط با حساب گوگل" : "Google sign-in error");
              }
              return;
            }
            if (tokenResponse?.access_token) {
              setLoading(true);
              setError("");
              try {
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await userInfoRes.json();
                const res = await api.googleAuth({
                  email: profile.email,
                  full_name: profile.name,
                  avatar_url: profile.picture,
                });
                await processGoogleAuthResult(res);
              } catch (err: any) {
                setError(err.message || (lang === "fa" ? "خطا در ورود با گوگل" : "Google authentication error"));
              } finally {
                setLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (e) {
        console.warn("[GIS OAuth error, falling back to redirect]", e);
      }
    }

    // 2. Direct Redirect to Google Official Account Chooser
    const redirectUri = window.location.origin;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  // GitHub OAuth States
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubClientId, setGithubClientId] = useState("");
  const [githubClientSecret, setGithubClientSecret] = useState("");
  const [githubAuthorizing, setGithubAuthorizing] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Intercept OAuth callbacks (GitHub ?code=... or Google hash #access_token=... / #id_token=...) on page load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleExchangeGithubCode(code);
      return;
    }

    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const idToken = hashParams.get("id_token");
      if (accessToken || idToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
        handleExchangeGoogleRedirect(accessToken, idToken);
      }
    }
  }, []);

  const handleExchangeGoogleRedirect = async (accessToken: string | null, idToken: string | null) => {
    setLoading(true);
    setError("");
    try {
      if (idToken) {
        const res = await api.googleAuth({ credential: idToken });
        await processGoogleAuthResult(res);
        return;
      }
      if (accessToken) {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await userInfoRes.json();
        const res = await api.googleAuth({
          email: profile.email,
          full_name: profile.name,
          avatar_url: profile.picture,
        });
        await processGoogleAuthResult(res);
      }
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در تأیید هویت حساب گوگل" : "Google authentication error"));
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeGithubCode = async (code: string) => {
    setLoading(true);
    setGithubAuthorizing(true);
    setError("");
    setInfoMsg(lang === "fa" ? "در حال اعتبارسنجی با گیت‌هاب و ورود به حساب کاربری..." : "Authenticating with GitHub...");
    try {
      const res = await api.githubExchangeCode(code);
      if (res.access_token && res.user) {
        api.setToken(res.access_token);
        api.setStoredUser(res.user);
        setUser(res.user);
        await refreshWorkspacesAndProjects();
      }
    } catch (err: any) {
      setInfoMsg("");
      setError(err.message || (lang === "fa" ? "خطا در تأیید هویت گیت‌هاب" : "Failed to authenticate with GitHub"));
    } finally {
      setLoading(false);
      setGithubAuthorizing(false);
    }
  };

  // Trigger GitHub OAuth Authorize Page
  const handleStartGithubOAuth = async () => {
    setError("");
    setInfoMsg("");
    setLoading(true);
    try {
      let clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      if (!clientId) {
        const cfg = await api.getGithubConfig();
        clientId = cfg.client_id;
      }

      const isValidClientId = clientId && clientId.trim() && !clientId.includes("@") && clientId.length >= 8;

      if (isValidClientId) {
        const redirectUri = window.location.origin;
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId.trim()}&scope=read:user,user:email,repo&redirect_uri=${encodeURIComponent(redirectUri)}`;
        return;
      }

      // If client_id is not yet configured or invalid, show OAuth setup modal
      setShowGithubModal(true);
    } catch (err: any) {
      setShowGithubModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Save OAuth credentials and redirect directly to GitHub authorize page
  const handleSaveAndRedirectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubClientId.trim() || !githubClientSecret.trim()) {
      setError(lang === "fa" ? "لطفاً هر دو فیلد Client ID و Client Secret را وارد فرمایید." : "Please enter both Client ID and Client Secret.");
      return;
    }
    if (githubClientId.includes("@")) {
      setError(lang === "fa" ? "توجه: شناسه Client ID آدرس ایمیل نیست! بلکه کد ۲۰ کاراکتری اختصاصی است که در تب 'OAuth application settings' در گیت‌هاب درج شده است (مانند Ov23li...)." : "Client ID is not an email. Please copy the Client ID code from GitHub OAuth application settings.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.saveGithubConfig({
        client_id: githubClientId.trim(),
        client_secret: githubClientSecret.trim(),
      });
      setShowGithubModal(false);
      const redirectUri = window.location.origin;
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId.trim()}&scope=read:user,user:email,repo&redirect_uri=${encodeURIComponent(redirectUri)}`;
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در ذخیره مشخصات گیت‌هاب" : "Failed to save GitHub credentials"));
      setLoading(false);
    }
  };

  // Direct login with Personal Access Token (PAT)
  const [githubPatInput, setGithubPatInput] = useState("");
  const [showPatInput, setShowPatInput] = useState(false);

  const handleLoginWithPat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubPatInput.trim()) {
      setError(lang === "fa" ? "لطفاً توکن شخصی گیت‌هاب را وارد فرمایید." : "Please enter your GitHub token.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.githubAuth({ token: githubPatInput.trim() });
      if (res.access_token && res.user) {
        setShowGithubModal(false);
        api.setToken(res.access_token);
        api.setStoredUser(res.user);
        setUser(res.user);
        await refreshWorkspacesAndProjects();
      }
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در احراز هویت با توکن گیت‌هاب" : "Failed to authenticate with GitHub token"));
    } finally {
      setLoading(false);
    }
  };

  // 4. Main Login / Register Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        // Standard Login
        const res = await api.login(email.trim(), password);
        api.setToken(res.access_token);
        api.setStoredUser(res.user);
        setUser(res.user);
        await refreshWorkspacesAndProjects();
      } else if (mode === "register") {
        // Registration with Email Verification Code
        if (!fullName.trim()) {
          setError(lang === "fa" ? "نام و نام خانوادگی را وارد کنید." : "Please enter your full name.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError(lang === "fa" ? "رمز عبور با تکرار آن مطابقت ندارد." : "Passwords do not match.");
          setLoading(false);
          return;
        }
        if (!codeSent) {
          setError(lang === "fa" ? "لطفاً ابتدا کد تأیید ایمیل را دریافت کنید." : "Please request verification code first.");
          setLoading(false);
          return;
        }
        if (!verificationCode.trim()) {
          setError(lang === "fa" ? "لطفاً کد ۶ رقمی ارسال شده به ایمیل را وارد کنید." : "Please enter verification code.");
          setLoading(false);
          return;
        }

        const res = await api.verifyAndRegister({
          email: email.trim(),
          code: verificationCode.trim(),
          full_name: fullName.trim(),
          password,
        });
        api.setToken(res.access_token);
        api.setStoredUser(res.user);
        setUser(res.user);
        await refreshWorkspacesAndProjects();
      }
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در برقراری ارتباط با سرور" : "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#11151e] flex flex-col justify-between text-foreground transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#141923]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={32} />
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
              {t.appName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="تغییر تم / Toggle Theme"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>{lang === "fa" ? "روشن" : "Light"}</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-600" />
                  <span>{lang === "fa" ? "تاریک" : "Dark"}</span>
                </>
              )}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "fa" ? "en" : "fa")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === "fa" ? "English" : "فارسی"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Presentation + Right Form */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* Side Showcase Column (Left in LTR, Right in RTL) */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block">
            <div className="space-y-4">
              <div className="animate-cascade-1 inline-block">
                <Badge variant="secondary" className="px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/80 rounded-full shadow-xs">
                  {lang === "fa" ? "نسل نوین مدیریت پروژه" : "Next-Gen Project Management"}
                </Badge>
              </div>

              {/* Animated Typewriter Title with smooth blinking cursor */}
              <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight min-h-[4rem] flex items-center flex-wrap">
                <span>{displayedHeadline}</span>
                <span className="inline-block w-1 h-7 bg-blue-600 dark:bg-blue-400 ms-1 animate-pulse rounded-full" />
              </h1>

              <p className="text-sm text-muted-foreground leading-relaxed animate-cascade-1">
                {lang === "fa"
                  ? "با داشبورد کارآمد و سطوح دسترسی پیشرفته، پروژه‌های خود را سریع‌تر و منظم‌تر از همیشه به سرانجام برسانید."
                  : "Empower your team with high-impact dashboards, role-based controls, and seamless execution."}
              </p>
            </div>

            {/* Showcase Feature Cards - Top-to-bottom cascading entrance one by one with distinct delays */}
            <div className="space-y-3 pt-2">
              {[
                {
                  icon: Layers,
                  title: lang === "fa" ? "داشبورد وظایف و فهرست پیشرفته" : "Task Dashboard & Advanced Lists",
                  desc: lang === "fa" ? "سازماندهی مراحل کاری، جابجایی سریع تسک‌ها، تعریف زیرتسک‌ها و تعیین اولویت" : "Fluid workflow stages, subtasks breakdown, tags, and clear priorities",
                  animClass: "animate-cascade-2"
                },
                {
                  icon: Calendar,
                  title: lang === "fa" ? "تقویم شمسی و برنامه‌ریزی زمانی" : "Calendar & Timeline Scheduling",
                  desc: lang === "fa" ? "مشاهده موعد تحویل و مدیریت ضرب‌الاجل‌ها مطابق با تقویم رسمی" : "Clear deadline visibility and milestone tracking across projects",
                  animClass: "animate-cascade-3"
                },
                {
                  icon: ShieldCheck,
                  title: lang === "fa" ? "سطوح دسترسی و امنیت سازمانی" : "Enterprise Roles & Permissions",
                  desc: lang === "fa" ? "تفکیک دقیق اختیارات برای مدیران و اعضای تیم در فضاهای کاری" : "Granular RBAC security and role delegation across team workspaces",
                  animClass: "animate-cascade-4"
                }
              ].map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={i}
                    className={`group flex items-start gap-4 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-[#161c27]/80 shadow-xs hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 ${feat.animClass}`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-6 flex justify-center">
            <Card className="w-full max-w-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181e2a] shadow-xl rounded-2xl overflow-hidden transition-all">
              
              {/* Top Navigation Tabs */}
              {mode !== "forgot" ? (
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141822]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setInfoMsg("");
                    }}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${
                      mode === "login"
                        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-[#181e2a]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "fa" ? "ورود به حساب کاربری" : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError("");
                      setInfoMsg("");
                    }}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${
                      mode === "register"
                        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 bg-white dark:bg-[#181e2a]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "fa" ? "ثبت‌نام کاربر جدید" : "Create Account"}
                  </button>
                </div>
              ) : (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#141822] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-xs">{lang === "fa" ? "بازیابی رمز عبور" : "Reset Password"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setInfoMsg("");
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    {lang === "fa" ? "بازگشت به ورود" : "Back to Login"}
                  </button>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* Error Banner */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Info / Success Banner */}
                {infoMsg && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold">{infoMsg}</span>
                      {(codeSent || forgotStep === "code") && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-normal">
                          {lang === "fa"
                            ? "💡 اگر ایمیل را دریافت نکردید، لطفاً بخش هرزنامه (Spam) ایمیل خود را بررسی کنید."
                            : "💡 If you did not receive the email, please check your Spam/Junk folder."}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode: Forgot Password Form */}
                {mode === "forgot" ? (
                  forgotStep === "email" ? (
                    <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {lang === "fa"
                          ? "نشانی ایمیل حساب کاربری خود را وارد کنید تا کد بازیابی رمز برای شما ارسال شود."
                          : "Enter your registered email to receive a recovery code."}
                      </p>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {lang === "fa" ? "پست الکترونیک *" : "Email Address *"}
                        </label>
                        <div className="relative">
                          <Mail className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            required
                            type="email"
                            dir="ltr"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="ps-9 h-10 text-xs text-left bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 text-foreground rounded-xl font-sans"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 rounded-xl shadow-md transition-all"
                      >
                        <Send className="h-4 w-4" />
                        <span>{loading ? (lang === "fa" ? "در حال ارسال..." : "Sending...") : (lang === "fa" ? "ارسال کد بازیابی به ایمیل" : "Send Recovery Code")}</span>
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {lang === "fa" ? "کد ۶ رقمی دریافتی از ایمیل *" : "6-Digit Recovery Code *"}
                          </label>
                          {cooldown > 0 && (
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                              {lang === "fa" ? `اعتبار: ${formatCooldown(cooldown)}` : `Expires in: ${formatCooldown(cooldown)}`}
                            </span>
                          )}
                        </div>
                        <Input
                          required
                          dir="ltr"
                          placeholder="123456"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          className="h-10 text-xs text-center tracking-widest font-mono bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            disabled={cooldown > 0 || loading}
                            onClick={() => handleForgotPasswordRequest()}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline font-medium"
                          >
                            {lang === "fa" ? "ارسال مجدد کد بازیابی" : "Resend recovery code"}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {lang === "fa" ? "رمز عبور جدید *" : "New Password *"}
                        </label>
                        <Input
                          required
                          type="password"
                          dir="ltr"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-10 text-xs bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 rounded-xl shadow-md transition-all"
                      >
                        <Check className="h-4 w-4" />
                        <span>{loading ? (lang === "fa" ? "در حال ذخیره..." : "Saving...") : (lang === "fa" ? "تغییر و ذخیره رمز عبور جدید" : "Update Password")}</span>
                      </Button>
                    </form>
                  )
                ) : (
                  <div className="space-y-4">
                    {/* One-Click Direct Sign-In (Google & GitHub) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleButtonClick}
                        disabled={loading}
                        className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151a24] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs gap-2 rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
                      >
                        <GoogleIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{lang === "fa" ? "ورود با Google" : "Sign in with Google"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleStartGithubOAuth}
                        disabled={loading}
                        className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151a24] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs gap-2 rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
                      >
                        <GithubIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{lang === "fa" ? "ورود با GitHub" : "Sign in with GitHub"}</span>
                      </Button>
                    </div>

                    {/* Quick Config Link */}
                    <div className="flex items-center justify-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setShowGithubModal(true);
                        }}
                        className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-medium"
                      >
                        {lang === "fa" ? "تنظیم یا تغییر کلیدهای گیت‌هاب (Client ID / Secret)" : "Change GitHub credentials"}
                      </button>
                    </div>

                    {/* Elegant Divider */}
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                      </div>
                      <div className="relative flex justify-center text-[11px]">
                        <span className="bg-white dark:bg-[#181e2a] px-3 text-muted-foreground font-medium">
                          {lang === "fa" ? "یا با پست الکترونیک" : "Or continue with email"}
                        </span>
                      </div>
                    </div>

                    {/* Mode: Login or Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name (Only on Register) */}
                    {mode === "register" && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {lang === "fa" ? "نام و نام خانوادگی *" : "Full Name *"}
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            required
                            placeholder={lang === "fa" ? "مثال: علی رضایی" : "e.g. John Doe"}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="ps-9 h-10 text-xs bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email (Always LTR) */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {lang === "fa" ? "پست الکترونیک *" : "Email Address *"}
                      </label>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            required
                            type="email"
                            dir="ltr"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="ps-9 h-10 text-xs text-left bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl font-sans"
                          />
                        </div>

                        {/* Send verification code button in register mode */}
                        {mode === "register" && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendVerificationCode}
                            disabled={loading || !email.trim() || cooldown > 0}
                            className="h-10 text-xs font-bold px-3 shrink-0 rounded-xl"
                          >
                            <span>
                              {codeSent
                                ? (lang === "fa" ? "ارسال مجدد" : "Resend")
                                : (lang === "fa" ? "دریافت کد" : "Get Code")}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Verification Code Input (Only in Register mode after send) */}
                    {mode === "register" && (
                      <div className="space-y-1 animate-in fade-in">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{lang === "fa" ? "کد ۶ رقمی تأیید ایمیل *" : "6-Digit Email Verification Code *"}</span>
                          {codeSent && (
                            <span className="text-[11px] font-medium">
                              {cooldown > 0 ? (
                                <span className="text-blue-600 dark:text-blue-400 font-mono">
                                  {lang === "fa" ? `اعتبار کد: ${formatCooldown(cooldown)}` : `Expires: ${formatCooldown(cooldown)}`}
                                </span>
                              ) : (
                                <span className="text-rose-500 font-semibold">{lang === "fa" ? "کد منقضی شد" : "Code expired"}</span>
                              )}
                            </span>
                          )}
                        </label>
                        <Input
                          required
                          dir="ltr"
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="h-10 text-xs text-center tracking-widest font-mono bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 text-foreground rounded-xl"
                        />
                      </div>
                    )}

                    {/* Password with Eye toggle */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {lang === "fa" ? "رمز عبور *" : "Password *"}
                        </label>
                        {mode === "login" && (
                          <button
                            type="button"
                            onClick={() => {
                              setMode("forgot");
                              setForgotStep("email");
                              setError("");
                              setInfoMsg("");
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                          >
                            {lang === "fa" ? "فراموشی رمز عبور؟" : "Forgot Password?"}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          required
                          type={showPassword ? "text" : "password"}
                          dir="ltr"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="ps-9 pe-9 h-10 text-xs bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title={showPassword ? (lang === "fa" ? "مخفی کردن رمز" : "Hide password") : (lang === "fa" ? "نمایش رمز" : "Show password")}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password (Only on Register) */}
                    {mode === "register" && (
                      <div className="space-y-1 animate-in fade-in duration-150">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {lang === "fa" ? "تکرار و تأیید رمز عبور *" : "Confirm Password *"}
                        </label>
                        <div className="relative">
                          <Lock className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            required
                            type={showConfirmPassword ? "text" : "password"}
                            dir="ltr"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="ps-9 pe-9 h-10 text-xs bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 text-foreground placeholder:text-muted-foreground rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute end-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title={showConfirmPassword ? (lang === "fa" ? "مخفی کردن رمز" : "Hide password") : (lang === "fa" ? "نمایش رمز" : "Show password")}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
                    >
                      <span>
                        {loading
                          ? (lang === "fa" ? "در حال پردازش..." : "Please wait...")
                          : mode === "login"
                          ? (lang === "fa" ? "ورود به حساب کاربری" : "Sign In")
                          : (lang === "fa" ? "تأیید ایمیل و ساخت حساب" : "Verify & Create Account")}
                      </span>
                      <ArrowIcon className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-4 text-[11px] text-muted-foreground border-t border-slate-200/60 dark:border-slate-800/60">
        {lang === "fa" ? "سامانه پیشرفته مدیریت پروژه و وظایف سازمانی" : "Enterprise Agile Project Management Platform"}
      </footer>

      {/* GitHub Authorizing Full-Screen Overlay */}
      {githubAuthorizing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="h-16 w-16 rounded-2xl bg-white text-slate-900 shadow-2xl flex items-center justify-center mb-4 animate-bounce">
            <GithubIcon className="h-8 w-8" />
          </div>
          <h3 className="text-base font-extrabold text-white">
            {lang === "fa" ? "در حال تأیید دسترسی حساب گیت‌هاب..." : "Authorizing with GitHub..."}
          </h3>
          <p className="text-xs text-slate-300 mt-2 max-w-sm">
            {lang === "fa"
              ? "اطلاعات حساب کاربری شما با موفقیت از گیت‌هاب دریافت شد. در حال ورود و راه‌اندازی فضای کاری..."
              : "GitHub account authorized. Setting up your workspace session..."}
          </p>
        </div>
      )}

      {/* GitHub OAuth Setup & Authorize Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181e2a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-md">
                <GithubIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {lang === "fa" ? "تنظیم اتصال و ورود رسمی با گیت‌هاب (Authorize)" : "Connect GitHub OAuth (Authorize)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === "fa"
                    ? "برای باز شدن صفحه رسمی گیت‌هاب و تأیید دسترسی، مشخصات OAuth App خود را وارد کنید:"
                    : "Configure your GitHub OAuth App to authorize directly via GitHub."}
                </p>
              </div>
            </div>

            {/* Quick 2-Step Instruction Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === "fa" ? "۱. ثبت برنامه در گیت‌هاب:" : "1. Register an OAuth App:"}
                </span>
                <a
                  href="https://github.com/settings/applications/new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 font-semibold transition-colors"
                >
                  <span>{lang === "fa" ? "باز کردن گیت‌هاب" : "Open GitHub"}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="text-[11px] text-muted-foreground space-y-1">
                <p>{lang === "fa" ? "۲. در فرم گیت‌هاب، مقادیر زیر را قرار دهید:" : "2. In the GitHub form, enter these URLs:"}</p>
                <div className="flex items-center justify-between p-1.5 rounded-md bg-white dark:bg-[#181e2a] border border-slate-200/80 dark:border-slate-700 font-mono text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300">Homepage / Callback URL:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400 select-all">http://localhost:3000</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("http://localhost:3000");
                        setCopiedCallback(true);
                        setTimeout(() => setCopiedCallback(false), 2000);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      title="کپی نشانی"
                    >
                      {copiedCallback ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveAndRedirectGithub} className="space-y-3.5">
              {/* Warning on Client ID != Email */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>راهنمای جلوگیری از خطای ۴۰۴ در گیت‌هاب:</span>
                </p>
                <p>
                  شناسه <strong>Client ID</strong> آدرس ایمیل شما نیست! لطفاً در تب باز شده گیت‌هاب (OAuth application settings)، مقدار فیلد <strong>Client ID</strong> (یک کد ۲۰ کاراکتری مانند <code className="font-mono bg-black/10 px-1 rounded">Ov23li8s...</code>) را کپی و در کادر زیر قرار دهید.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "شناسه کلاینت گیت‌هاب (Client ID) *" : "GitHub Client ID *"}
                </label>
                <div className="relative">
                  <UserIcon className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    dir="ltr"
                    autoFocus
                    placeholder="e.g. Ov23li... (نه آدرس ایمیل)"
                    value={githubClientId}
                    onChange={(e) => setGithubClientId(e.target.value)}
                    className="ps-9 h-10 text-xs text-left bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "رمز کلاینت گیت‌هاب (Client Secret) *" : "GitHub Client Secret *"}
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type="password"
                    dir="ltr"
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={githubClientSecret}
                    onChange={(e) => setGithubClientSecret(e.target.value)}
                    className="ps-9 h-10 text-xs text-left bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowGithubModal(false);
                    setError("");
                  }}
                  className="flex-1 h-10 text-xs rounded-xl"
                >
                  {lang === "fa" ? "انصراف" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !githubClientId.trim() || !githubClientSecret.trim()}
                  className="flex-2 h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs gap-1.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>{loading ? (lang === "fa" ? "در حال انتقال به گیت‌هاب..." : "Connecting...") : (lang === "fa" ? "انتقال به گیت‌هاب جهت Authorize" : "Authorize with GitHub")}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>

            {/* Quick PAT alternative */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPatInput(!showPatInput)}
                className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center justify-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{lang === "fa" ? "روش سریع‌تر: ورود مستقیم با توکن شخصی (PAT)" : "Quick login with Personal Access Token"}</span>
              </button>

              {showPatInput && (
                <form onSubmit={handleLoginWithPat} className="mt-3 space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200 dark:border-slate-800 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {lang === "fa" ? "توکن شخصی (Personal Access Token) *" : "Personal Access Token *"}
                    </label>
                    <Input
                      required
                      type="password"
                      dir="ltr"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={githubPatInput}
                      onChange={(e) => setGithubPatInput(e.target.value)}
                      className="h-9 text-xs font-mono bg-white dark:bg-[#181e2a] rounded-lg"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !githubPatInput.trim()}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
                  >
                    {loading ? (lang === "fa" ? "در حال ورود..." : "Signing in...") : (lang === "fa" ? "ورود فوری با توکن شخصی" : "Sign In with Token")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct Login with Email / Google Modal */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181e2a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <GoogleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {lang === "fa" ? "ورود مستقیم با حساب گوگل" : "Sign in with Google"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === "fa"
                    ? "نشانی جیمیل خود را وارد نمایید؛ در صورت وجود حساب فوراً وارد می‌شوید و در غیر این صورت حساب جدید ساخته می‌شود."
                    : "Enter your Google email to sign in directly or create a new account."}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDirectAuth(directEmail);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "نشانی حساب گوگل (جیمیل) *" : "Google Account (Gmail) *"}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type="email"
                    dir="ltr"
                    autoFocus
                    placeholder={lang === "fa" ? "ali.rezaei@example.com" : "name@example.com"}
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    className="ps-9 h-10 text-xs text-left bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 rounded-xl font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDirectModal(false);
                    setError("");
                  }}
                  className="flex-1 h-10 text-xs rounded-xl"
                >
                  {lang === "fa" ? "انصراف" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !directEmail.trim()}
                  className="flex-2 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>{loading ? (lang === "fa" ? "در حال بررسی..." : "Checking...") : (lang === "fa" ? "ورود به سامانه" : "Continue")}</span>
                  <ArrowIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google New User Name Completion Modal */}
      {googleNewUserData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181e2a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <GoogleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {lang === "fa" ? "تکمیل ثبت‌نام و ایجاد حساب کاربری" : "Complete Registration"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === "fa" ? "لطفاً نام و نام خانوادگی خود را جهت ساخت حساب و فضای کاری اختصاصی وارد نمایید:" : "Please specify your display name to set up your workspace."}
                </p>
              </div>
            </div>

            {/* Account pill */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#141822] border border-slate-200/80 dark:border-slate-800">
              <img
                src={googleNewUserData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${googleNewUserData.email}`}
                alt="Avatar"
                className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{googleNewUserData.email}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  {lang === "fa" ? "نشانی ایمیل تأیید شده" : "Verified Email Address"}
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCompleteGoogleRegistration} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === "fa" ? "نام و نام خانوادگی شما *" : "Your Full Name *"}
                </label>
                <div className="relative">
                  <UserIcon className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    autoFocus
                    placeholder={lang === "fa" ? "مثال: اباالفضل داریوشی" : "e.g. John Doe"}
                    value={googleFullName}
                    onChange={(e) => setGoogleFullName(e.target.value)}
                    className="ps-9 h-10 text-xs bg-slate-50 dark:bg-[#141822] border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setGoogleNewUserData(null);
                    setError("");
                  }}
                  className="flex-1 h-10 text-xs rounded-xl"
                >
                  {lang === "fa" ? "انصراف" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !googleFullName.trim()}
                  className="flex-2 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>{loading ? (lang === "fa" ? "در حال ایجاد حساب..." : "Creating Account...") : (lang === "fa" ? "تأیید و ورود به سامانه" : "Confirm & Enter")}</span>
                  <ArrowIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
