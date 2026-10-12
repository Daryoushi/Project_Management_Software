"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { api, User } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, UserPlus, Shield, Trash2, Mail, CheckCircle } from "lucide-react";

export function WorkspaceMembersModal() {
  const { isWorkspaceMembersOpen, setIsWorkspaceMembersOpen, currentWorkspace, lang, t, isAdminOrPM } = useApp();
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isWorkspaceMembersOpen && currentWorkspace) {
      loadMembers();
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace || !isAdminOrPM) return;
    setLoading(true);
    try {
      await api.addWorkspaceMember(currentWorkspace.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMessage(lang === "fa" ? "عضو با موفقیت افزوده شد." : "Member added successfully.");
      setInviteEmail("");
      await loadMembers();
      setTimeout(() => setMessage(""), 3000);
    } catch (e: any) {
      alert(e.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!currentWorkspace || !isAdminOrPM) return;
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
    if (confirm(lang === "fa" ? "آیا از حذف این عضو از فضای کاری اطمینان دارید؟" : "Remove this member from workspace?")) {
      try {
        await api.removeWorkspaceMember(currentWorkspace.id, userId);
        await loadMembers();
      } catch (e: any) {
        alert(e.message || "Failed to remove member");
      }
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
              <h4 className="font-bold flex items-center gap-1.5 text-xs">
                <UserPlus className="h-4 w-4 text-primary" />
                {t.inviteMember}
              </h4>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    placeholder={t.enterEmail}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="ps-9 text-xs h-9"
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
                <Button type="submit" size="sm" disabled={loading} className="h-9 px-4 text-xs shrink-0">
                  {loading ? "..." : t.inviteMember}
                </Button>
              </form>
              {message && (
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs animate-in fade-in">
                  <CheckCircle className="h-4 w-4" />
                  <span>{message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted/40 rounded-xl text-muted-foreground border">
              {t.readOnlyMode} - {lang === "fa" ? "فقط مدیران و مدیران پروژه امکان دعوت یا تخصیص نقش دارند." : "Only admins and project managers can invite or change roles."}
            </div>
          )}

          {/* Members Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-muted-foreground">
              {lang === "fa" ? `اعضای فعال (${members.length})` : `Active Members (${members.length})`}
            </h4>

            <div className="divide-y rounded-xl border bg-card">
              {members.map((m) => {
                const roleInfo = roleLabels[m.role] || roleLabels.member;

                return (
                  <div key={m.membership_id} className="flex items-center justify-between p-3 gap-3">
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={m.avatar_url} alt={m.full_name} fallback={m.full_name} size="md" />
                      <div className="truncate">
                        <p className="font-bold text-xs sm:text-sm truncate">{m.full_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                        <p className="text-[10px] text-muted-foreground/75 hidden sm:block">
                          {lang === "fa" ? roleInfo.descFa : roleInfo.descEn}
                        </p>
                      </div>
                    </div>

                    {/* Role selector & remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdminOrPM && m.role !== "owner" ? (
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleInfo.color}`}>
                          {lang === "fa" ? roleInfo.labelFa : roleInfo.labelEn}
                        </span>
                      )}

                      {isAdminOrPM && m.role !== "owner" && (
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
