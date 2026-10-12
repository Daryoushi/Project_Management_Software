"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { api, User } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { JalaliDatePicker } from "@/components/common/JalaliDatePicker";

export function CreateTaskDialog() {
  const { isCreateTaskOpen, setIsCreateTaskOpen, currentProject, refreshTasks, setActiveTaskId, lang, t } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("To do");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCreateTaskOpen) {
      api.getAllUsers().then(setUsers).catch(console.error);
    }
  }, [isCreateTaskOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentProject) return;

    setLoading(true);
    try {
      const statusMap: Record<string, "todo" | "in_progress" | "done"> = {
        "To do": "todo",
        "Doing": "in_progress",
        "Done": "done",
      };

      const newTask = await api.createTask({
        project_id: currentProject.id,
        title: title.trim(),
        description: description.trim(),
        section,
        status: statusMap[section] || "todo",
        priority,
        assignee_id: assigneeId || undefined,
        due_date: dueDate || undefined,
      });

      setTitle("");
      setDescription("");
      setDueDate("");
      setIsCreateTaskOpen(false);
      await refreshTasks();
      if (newTask?.id) {
        setActiveTaskId(newTask.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
      <DialogContent onClose={() => setIsCreateTaskOpen(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.createTask}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground">{t.taskTitle} *</label>
            <Input
              autoFocus
              required
              placeholder={lang === "fa" ? "عنوان تسک مورد نظر را بنویسید..." : "What needs to be done?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-muted-foreground">{t.taskDesc}</label>
            <Textarea
              rows={3}
              placeholder={lang === "fa" ? "شرح تسک، لینک‌ها و اهداف..." : "Details about this task..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Grid properties */}
          <div className="grid grid-cols-2 gap-3">
            {/* Section */}
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground">{t.section}</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="To do">{t.todo}</option>
                <option value="Doing">{t.in_progress}</option>
                <option value="Done">{t.done}</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground">{t.priority}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
                <option value="urgent">{t.urgent}</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground">{t.assignee}</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{t.unassigned}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="font-bold text-muted-foreground">{t.dueDate}</label>
              <JalaliDatePicker
                value={dueDate}
                lang={lang}
                onChange={(val) => setDueDate(val)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" size="sm" disabled={loading} className="text-xs w-full sm:w-auto px-6 font-bold">
              {loading ? "..." : t.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
