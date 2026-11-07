"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { api, User } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, UserPlus, Shield, Trash2, Mail, CheckCircle, AlertCircle, Clock, X } from "lucide-react";

export function WorkspaceMembersModal() {
  const { isWorkspaceMembersOpen, setIsWorkspaceMembersOpen, currentWorkspace, user, lang, t, isAdminOrPM } = useApp();
  const [members, setMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isWorkspaceMembersOpen && currentWorkspace) {
      loadMembers();
      loadPendingInvites();
      api.getAllUsers().then(setAllUsers).catch(console.error);
    }
  }, [isWorkspaceMembersOpen, currentWorkspace]);

  const loadMembers = async () => {
    if (!currentWorkspace) return;
    try {
      const data = await api.getWorkspaceMembers(currentWorkspace.id);
      setMembers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPendingInvites = async () => {
    if (!currentWorkspace) return;
    try {
      const data = await api.getWorkspaceInvitations(currentWorkspace.id);
      setPendingInvites(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace || !isAdminOrPM) return;
    setLoading(true);
    setErrorMsg("");
    setMessage("");
    try {
      const res = await api.addWorkspaceMember(currentWorkspace.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMessage(res.message || (lang === "fa" ? "دعوت‌نامه با موفقیت ارسال شد و به ایمیل کاربر ابلاغ گردید." : "Invitation sent successfully."));
      setInviteEmail("");
      await loadMembers();
      await loadPendingInvites();
      setTimeout(() => setMessage(""), 5000);
    } catch (e: any) {
      setErrorMsg(e.message || (lang === "fa" ? "خطا در ارسال دعوت" : "Failed to send invitation"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!currentWorkspace || !isAdminOrPM) return;
    if (userId === user?.id) {
      alert(lang === "fa" ? "شما نمی‌توانید نقش خود را تغییر دهید." : "You cannot change your own role.");
      return;
    }
    try {
      await api.addWorkspaceMember(currentWorkspace.id, {
        user_id: userId,
        role: newRole,
      });
      await loadMembers();
    } catch (e: any) {
      alert(e.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspace || !isAdminOrPM) return;
    if (userId === user?.id) {
      alert(lang === "fa" ? "شما نمی‌توانید خود را از فضای کاری حذف کنید." : "You cannot remove yourself.");
      return;
    }
    if (confirm(lang === "fa" ? "آیا از حذف این عضو از فضای کاری اطمینان دارید؟" : "Remove this member from workspace?")) {
      try {
        await api.removeWorkspaceMember(currentWorkspace.id, userId);
        await loadMembers();
      } catch (e: any) {
        alert(e.message || "Failed to remove member");
      }
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!currentWorkspace) return;
    try {
      await api.cancelWorkspaceInvitation(currentWorkspace.id, invitationId);
      await loadPendingInvites();
    } catch (e: any) {
      alert(e.message || "Failed to cancel invitation");
    }
  };

  const roleLabels: Record<string, { labelFa: string; labelEn: string; color: string; descFa: string; descEn: string }> = {
    owner: {
      labelFa: "مالک فضای کاری",
      labelEn: "Owner",
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      descFa: "دسترسی کامل مدیریتی و مالی",
      descEn: "Full administrative and billing access"
    },
    admin: {
      labelFa: "مدیر ارشد",
      labelEn: "Senior Admin",
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      descFa: "مدیریت اعضا، پروژه‌ها و تنظیمات",
      descEn: "Manage members, projects and settings"
    },
    project_manager: {
      labelFa: "مدیر پروژه",
      labelEn: "Project Manager",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      descFa: "تعریف تسک‌ها، اسپرینت‌ها و ارجاع کار",
      descEn: "Assign tasks, sprints and milestones"
    },
    member: {
      labelFa: "عضو تیم",
      labelEn: "Member",
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
      descFa: "ایجاد تسک، ثبت نظر و تکمیل کار",
      descEn: "Create tasks, comment and complete work"
    },
    viewer: {
      labelFa: "مشاهده‌گر",
      labelEn: "Viewer",
      color: "bg-slate-500/10 text-slate-600 border-slate-200",
      descFa: "فقط خواندنی بدون امکان ویرایش",
      descEn: "Read-only access, cannot make changes"
    },
  };

  return (
    <Dialog open={isWorkspaceMembersOpen} onOpenChange={setIsWorkspaceMembersOpen}>
      <DialogContent onClose={() => setIsWorkspaceMembersOpen(false)} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t.teamMembers} - {currentWorkspace?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2 text-xs">
          {/* Invite form (for admin/PM) */}
          {isAdminOrPM ? (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-1.5 text-xs text-foreground">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span>{t.inviteMember}</span>
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  {lang === "fa" ? "ارسال دعوت‌نامه همراه با ایمیل و نوتیفیکیشن" : "Sends email and in-app invite"}
                </span>
              </div>

              <form onSubmit={handleInvite} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      type="email"
                      dir="ltr"
                      placeholder={lang === "fa" ? "نشانی ایمیل عضو عضو سامانه (الزامی) *" : "User email *"}
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setErrorMsg("");
                      }}
                      className="ps-9 text-xs h-9 font-sans"
                    />
                  </div>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring h-9"
                  >
                    <option value="admin">{lang === "fa" ? "مدیر ارشد" : "Admin"}</option>
                    <option value="project_manager">{lang === "fa" ? "مدیر پروژه" : "Project Manager"}</option>
                    <option value="member">{lang === "fa" ? "عضو تیم" : "Member"}</option>
                    <option value="viewer">{lang === "fa" ? "مشاهده‌گر" : "Viewer"}</option>
                  </select>
                  <Button type="submit" size="sm" disabled={loading} className="h-9 px-4 text-xs font-bold shrink-0">
                    {loading ? (lang === "fa" ? "در حال ارسال..." : "Sending...") : (lang === "fa" ? "ارسال دعوت" : t.inviteMember)}
                  </Button>
                </div>
              </form>

              {/* Error feedback banner */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success feedback banner */}
              {message && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs animate-in fade-in">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted/40 rounded-xl text-muted-foreground border">
              {t.readOnlyMode} - {lang === "fa" ? "فقط مدیران و مدیران پروژه امکان دعوت یا تخصیص نقش دارند." : "Only admins and project managers can invite or change roles."}
            </div>
          )}

          {/* Pending Invitations Section (if any) */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{lang === "fa" ? `دعوت‌نامه‌های در انتظار پذیرش (${pendingInvites.length})` : `Pending Invitations (${pendingInvites.length})`}</span>
              </h4>
              <div className="divide-y rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-500/5">
                {pendingInvites.map((inv) => {
                  const roleInfo = roleLabels[inv.role] || roleLabels.member;
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <Avatar src={inv.avatar_url} alt={inv.full_name} fallback={inv.full_name || inv.email} size="sm" />
                        <div className="truncate">
                          <p className="font-semibold text-foreground truncate">{inv.full_name || inv.email}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">{inv.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleInfo.color}`}>
                          {lang === "fa" ? roleInfo.labelFa : roleInfo.labelEn}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          {lang === "fa" ? "در انتظار تأیید" : "Pending"}
                        </span>
                        {isAdminOrPM && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(inv.id)}
                            title={lang === "fa" ? "لغو دعوت‌نامه" : "Cancel invite"}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Members Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-muted-foreground">
              {lang === "fa" ? `اعضای فعال (${members.length})` : `Active Members (${members.length})`}
            </h4>

            <div className="divide-y rounded-xl border bg-card">
              {members.map((m) => {
                const roleInfo = roleLabels[m.role] || roleLabels.member;
                const isSelf = m.user_id === user?.id;

                return (
                  <div key={m.membership_id} className="flex items-center justify-between p-3 gap-3">
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={m.avatar_url} alt={m.full_name} fallback={m.full_name} size="md" />
                      <div className="truncate">
                        <p className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
                          <span>{m.full_name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded-md bg-primary/10">
                              {lang === "fa" ? "شما" : "You"}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                        <p className="text-[10px] text-muted-foreground/75 hidden sm:block">
                          {lang === "fa" ? roleInfo.descFa : roleInfo.descEn}
                        </p>
                      </div>
                    </div>

                    {/* Role selector & remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* If it is the user themselves or role is owner, they cannot change their own role! */}
                      {isAdminOrPM && m.role !== "owner" && !isSelf ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                          className="rounded-lg border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="admin">{lang === "fa" ? "مدیر ارشد" : "Admin"}</option>
                          <option value="project_manager">{lang === "fa" ? "مدیر پروژه" : "Project Manager"}</option>
                          <option value="member">{lang === "fa" ? "عضو تیم" : "Member"}</option>
                          <option value="viewer">{lang === "fa" ? "مشاهده‌گر" : "Viewer"}</option>
                        </select>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleInfo.color}`}>
                            {lang === "fa" ? roleInfo.labelFa : roleInfo.labelEn}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {lang === "fa" ? "(نقش شما - غیرقابل تغییر)" : "(Your role - Fixed)"}
                            </span>
                          )}
                        </div>
                      )}

                      {isAdminOrPM && m.role !== "owner" && !isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
