"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { Task, api, User } from "@/lib/api";
import { formatDateLocale, formatRelativeDate, toPersianDigits } from "@/lib/jalali";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { JalaliDatePicker } from "@/components/common/JalaliDatePicker";
import {
  Calendar,
  CheckCircle2,
  Trash2,
  Send,
  Paperclip,
  Check,
  User as UserIcon,
  Tag,
  AlertCircle,
  Clock,
  Plus
} from "lucide-react";

export function TaskDetailModal() {
  const { activeTaskId, setActiveTaskId, lang, t, refreshTasks, canEdit, isAdmin } = useApp();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("todo");
  const [priority, setPriority] = useState<string>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  // Subtask & Comment inputs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (activeTaskId) {
      loadTask(activeTaskId);
      api.getAllUsers().then(setUsers).catch(console.error);
    } else {
      setTask(null);
    }
  }, [activeTaskId]);

  const loadTask = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getTask(id);
      setTask(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setStatus(data.status || "todo");
      setPriority(data.priority || "medium");
      setAssigneeId(data.assignee_id || "");
      setDueDate(data.due_date || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (fields: Partial<Task>) => {
    if (!task || !canEdit) return;
    try {
      const updated = await api.updateTask(task.id, fields);
      setTask(updated);
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim() || !canEdit) return;
    try {
      await api.addSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      await loadTask(task.id);
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentCompleted: number | boolean) => {
    if (!task || !canEdit) return;
    try {
      await api.updateSubtask(task.id, subtaskId, { is_completed: !currentCompleted });
      await loadTask(task.id);
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task || !canEdit) return;
    try {
      await api.deleteSubtask(task.id, subtaskId);
      await loadTask(task.id);
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentText.trim()) return;
    try {
      await api.addComment(task.id, commentText.trim());
      setCommentText("");
      await loadTask(task.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async () => {
    if (!task || (!canEdit && !isAdmin)) return;
    if (confirm(lang === "fa" ? "آیا از حذف این تسک اطمینان دارید؟" : "Are you sure you want to delete this task?")) {
      try {
        await api.deleteTask(task.id);
        setActiveTaskId(null);
        await refreshTasks();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!activeTaskId || !task) return null;

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasksCount = task.subtasks?.filter((s) => s.is_completed).length || 0;
  const subtaskProgress = subtasksCount > 0 ? Math.round((completedSubtasksCount / subtasksCount) * 100) : 0;

  return (
    <Dialog open={!!activeTaskId} onOpenChange={(open) => !open && setActiveTaskId(null)}>
      <DialogContent onClose={() => setActiveTaskId(null)} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => {
                  const newStat = task.status === "done" ? "todo" : "done";
                  handleSaveField({ status: newStat });
                }}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                  task.status === "done"
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-muted-foreground/40 hover:border-primary"
                }`}
              >
                {task.status === "done" && <Check className="h-3.5 w-3.5" />}
              </button>
              <span className="text-xs text-muted-foreground font-semibold">
                {task.project_name || "پروژه"}
              </span>
            </div>

            <div className="flex items-center gap-2 pr-6 rtl:pr-0 rtl:pl-6">
              {/* Space reserved so it never interferes with modal close button */}
              <Badge variant="outline" className="text-[11px]">
                {t[task.status]}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Title Input */}
          <div>
            <Input
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleSaveField({ title })}
              className="text-lg font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
              placeholder={t.taskTitle}
            />
          </div>

          {/* Quick Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border text-xs">
            {/* Assignee */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" />
                {t.assignee}
              </label>
              <select
                disabled={!canEdit}
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  handleSaveField({ assignee_id: e.target.value });
                }}
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{t.unassigned}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({t[u.global_role as keyof typeof t] || u.global_role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {t.dueDate}
              </label>
              <JalaliDatePicker
                value={dueDate}
                disabled={!canEdit}
                lang={lang}
                onChange={(val) => {
                  setDueDate(val);
                  handleSaveField({ due_date: val });
                }}
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">{t.status}</label>
              <select
                disabled={!canEdit}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  handleSaveField({ status: e.target.value as any });
                }}
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="todo">{t.todo}</option>
                <option value="in_progress">{t.in_progress}</option>
                <option value="review">{t.review}</option>
                <option value="done">{t.done}</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">{t.priority}</label>
              <select
                disabled={!canEdit}
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleSaveField({ priority: e.target.value as any });
                }}
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
                <option value="urgent">{t.urgent}</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground">{t.taskDesc}</label>
            <Textarea
              disabled={!canEdit}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSaveField({ description })}
              placeholder={lang === "fa" ? "شرح تسک، اهداف و جزییات اجرایی..." : "Task description..."}
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {t.subtasks}
              </label>
              <span className="text-xs text-muted-foreground font-semibold">
                {lang === "fa"
                  ? `${toPersianDigits(completedSubtasksCount)} از ${toPersianDigits(subtasksCount)}`
                  : `${completedSubtasksCount} of ${subtasksCount}`}
              </span>
            </div>

            {subtasksCount > 0 && <Progress value={subtaskProgress} className="h-1.5" />}

            {/* Subtasks List */}
            <div className="space-y-1.5">
              {task.subtasks?.map((sub) => (
                <div
                  key={sub.id}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 border bg-card text-xs transition-colors"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={!!sub.is_completed}
                      onChange={() => handleToggleSubtask(sub.id, sub.is_completed)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className={sub.is_completed ? "line-through text-muted-foreground" : ""}>
                      {sub.title}
                    </span>
                  </label>
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Subtask Form */}
            {canEdit && (
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder={t.addSubtask}
                  className="h-8 text-xs"
                />
                <Button type="submit" size="sm" className="h-8 text-xs px-3">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </form>
            )}
          </div>

          {/* Comments Stream */}
          <div className="space-y-3 border-t pt-4">
            <label className="text-xs font-bold text-muted-foreground block">{t.comments}</label>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {task.comments?.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 text-xs">
                  <Avatar src={c.user_avatar} alt={c.user_name} fallback={c.user_name} size="sm" className="h-7 w-7 text-[10px]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{c.user_name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatRelativeDate(c.created_at, lang)}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
              {(!task.comments || task.comments.length === 0) && (
                <p className="text-xs text-muted-foreground py-2">{lang === "fa" ? "هنوز دیدگاهی ثبت نشده است." : "No comments yet."}</p>
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.writeComment}
                className="h-9 text-xs"
              />
              <Button type="submit" size="sm" className="h-9 text-xs gap-1">
                <Send className="h-3.5 w-3.5" />
                {t.sendComment}
              </Button>
            </form>
          </div>

          {/* Modal Footer: Separate Delete action from general close */}
          <div className="border-t pt-4 flex items-center justify-between gap-2 mt-6">
            {(canEdit || isAdmin) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeleteTask}
                className="text-destructive hover:bg-destructive/10 text-xs gap-1.5 font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>{lang === "fa" ? "حذف این تسک" : "Delete task"}</span>
              </Button>
            ) : <div />}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTaskId(null)}
              className="text-xs px-4"
            >
              {lang === "fa" ? "بستن" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
