"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { toPersianDigits } from "@/lib/jalali";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
  TrendingUp,
  PieChart,
  ListTodo
} from "lucide-react";

export function DashboardView() {
  const { currentProject, tasks, lang, t } = useApp();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (currentProject) {
      api.getProjectStats(currentProject.id).then(setStats).catch(console.error);
    }
  }, [currentProject, tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "review").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < todayStr && t.status !== "done").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{lang === "fa" ? "کل وظایف" : "Total Tasks"}</p>
              <h3 className="text-2xl font-black mt-1">
                {lang === "fa" ? toPersianDigits(totalTasks) : totalTasks}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ListTodo className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t.tasksCompleted}</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-600">
                {lang === "fa" ? toPersianDigits(completedTasks) : completedTasks}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t.in_progress}</p>
              <h3 className="text-2xl font-black mt-1 text-amber-600">
                {lang === "fa" ? toPersianDigits(inProgressTasks) : inProgressTasks}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t.overdue}</p>
              <h3 className="text-2xl font-black mt-1 text-rose-600">
                {lang === "fa" ? toPersianDigits(overdueTasks) : overdueTasks}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Health Banner */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {lang === "fa" ? "نرخ پیشرفت و تکمیل پروژه" : "Project Progress & Health"}
              </CardTitle>
              <CardDescription>
                {lang === "fa" ? "محاسبه بر اساس تسک‌های اتمام‌یافته در برابر کل وظایف" : "Calculated from completed vs total project tasks"}
              </CardDescription>
            </div>
            <span className="text-2xl font-black text-primary">
              {lang === "fa" ? `%${toPersianDigits(completionRate)}` : `${completionRate}%`}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Two columns: Priority distribution & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-500" />
              {lang === "fa" ? "تفکیک اولویت وظایف" : "Task Priority Breakdown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "urgent", label: t.urgent, color: "bg-rose-500" },
              { key: "high", label: t.high, color: "bg-orange-500" },
              { key: "medium", label: t.medium, color: "bg-amber-500" },
              { key: "low", label: t.low, color: "bg-slate-400" },
            ].map(({ key, label, color }) => {
              const count = tasks.filter((t) => t.priority === key).length;
              const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{label}</span>
                    <span className="text-muted-foreground">
                      {lang === "fa" ? `${toPersianDigits(count)} (${toPersianDigits(percent)}%)` : `${count} (${percent}%)`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              {lang === "fa" ? "حجم کار و وظایف اعضای تیم" : "Team Workload"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.team_workload && stats.team_workload.length > 0 ? (
              stats.team_workload.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Avatar src={member.avatar_url} alt={member.full_name} fallback={member.full_name} size="sm" />
                    <span className="font-semibold text-xs sm:text-sm">{member.full_name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {lang === "fa"
                      ? `${toPersianDigits(member.task_count)} تسک تخصیص‌یافته`
                      : `${member.task_count} tasks assigned`}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {lang === "fa" ? "هنوز تسکی به اعضا اساین نشده است." : "No tasks assigned yet."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
