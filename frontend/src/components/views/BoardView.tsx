"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context";
import { Task, api } from "@/lib/api";
import { formatRelativeDate, toPersianDigits } from "@/lib/jalali";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Clock,
  CheckCircle2,
  MoreVertical,
  MessageSquare,
  CheckSquare,
  MoveLeft,
  MoveRight,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

export function BoardView() {
  const { tasks, currentProject, lang, t, setActiveTaskId, refreshTasks, canEdit, searchQuery } = useApp();
  const [addingColumn, setAddingColumn] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");

  const columns = [
    { id: "todo", title: t.todo, color: "#6366F1", section: "To do" },
    { id: "in_progress", title: t.in_progress, color: "#F59E0B", section: "Doing" },
    { id: "review", title: t.review, color: "#EC4899", section: "Doing" },
    { id: "done", title: t.done, color: "#10B981", section: "Done" },
  ];

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return task.title.toLowerCase().includes(q) || (task.description && task.description.toLowerCase().includes(q));
  });

  const handleMoveColumn = async (task: Task, direction: "next" | "prev") => {
    const statusOrder: ("todo" | "in_progress" | "review" | "done")[] = ["todo", "in_progress", "review", "done"];
    const currentIdx = statusOrder.indexOf(task.status as any);
    const nextIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;

    if (nextIdx >= 0 && nextIdx < statusOrder.length) {
      const nextStatus = statusOrder[nextIdx];
      const sectionMap: Record<string, string> = {
        todo: "To do",
        in_progress: "Doing",
        review: "Doing",
        done: "Done",
      };
      try {
        await api.updateTask(task.id, { status: nextStatus, section: sectionMap[nextStatus] });
        await refreshTasks();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleQuickAdd = async (statusId: string, section: string) => {
    if (!quickTitle.trim() || !currentProject) return;
    try {
      await api.createTask({
        project_id: currentProject.id,
        title: quickTitle.trim(),
        status: statusId as any,
        section,
        priority: "medium",
      });
      setQuickTitle("");
      setAddingColumn(null);
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const NextArrow = lang === "fa" ? ArrowLeft : ArrowRight;
  const PrevArrow = lang === "fa" ? ArrowRight : ArrowLeft;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-16 items-start animate-in fade-in duration-200">
      {columns.map((col, colIdx) => {
        const columnTasks = filteredTasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col bg-muted/40 border rounded-2xl p-3 shadow-xs max-h-[80vh] overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1 border-b">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <h3 className="font-bold text-sm tracking-tight">{col.title}</h3>
                <span className="text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full">
                  {lang === "fa" ? toPersianDigits(columnTasks.length) : columnTasks.length}
                </span>
              </div>
              {canEdit && (
                <button
                  onClick={() => {
                    setAddingColumn(col.id);
                    setQuickTitle("");
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Task Cards Column Body */}
            <div className="space-y-3 py-3 overflow-y-auto min-h-[120px]">
              {columnTasks.map((task) => {
                const isOverdue = task.due_date && task.due_date < new Date().toISOString().split("T")[0] && task.status !== "done";

                return (
                  <Card
                    key={task.id}
                    onClick={() => setActiveTaskId(task.id)}
                    className="group border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card rounded-xl overflow-hidden"
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Tags & Priority */}
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        {task.priority && (
                          <Badge
                            variant={
                              task.priority === "urgent" || task.priority === "high"
                                ? "destructive"
                                : task.priority === "medium"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {t[task.priority]}
                          </Badge>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 rounded text-[10px] font-medium"
                                style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {task.title}
                      </h4>

                      {/* Subtasks Progress */}
                      {(task.subtasks_count || 0) > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="h-3 w-3" />
                              {lang === "fa"
                                ? `${toPersianDigits(task.subtasks_completed || 0)} از ${toPersianDigits(task.subtasks_count || 0)} زیرتسک`
                                : `${task.subtasks_completed || 0} of ${task.subtasks_count || 0} subtasks`}
                            </span>
                            <span>{Math.round(((task.subtasks_completed || 0) / (task.subtasks_count || 1)) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.round(((task.subtasks_completed || 0) / (task.subtasks_count || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer: Due date, comments, assignee & Move buttons */}
                      <div className="pt-2 border-t flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {task.due_date && (
                            <span className={`flex items-center gap-1 text-[11px] ${
                              isOverdue ? "text-rose-600 font-semibold" : "text-muted-foreground"
                            }`}>
                              <Clock className="h-3 w-3" />
                              {formatRelativeDate(task.due_date, lang)}
                            </span>
                          )}
                          {(task.comments_count || 0) > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              {lang === "fa" ? toPersianDigits(task.comments_count || 0) : task.comments_count}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Quick move buttons */}
                          {canEdit && colIdx > 0 && (
                            <button
                              type="button"
                              title="Move back"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveColumn(task, "prev");
                              }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <PrevArrow className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canEdit && colIdx < columns.length - 1 && (
                            <button
                              type="button"
                              title="Move next"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveColumn(task, "next");
                              }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <NextArrow className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <Avatar
                            src={task.assignee_avatar}
                            alt={task.assignee_name}
                            fallback={task.assignee_name}
                            size="sm"
                            className="h-6 w-6 text-[10px]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  {lang === "fa" ? "کارتی در این ستون نیست" : "No tasks in this column"}
                </div>
              )}
            </div>

            {/* Quick Add at bottom */}
            {canEdit && (
              <div className="pt-2">
                {addingColumn === col.id ? (
                  <div className="space-y-2 p-2 bg-card rounded-xl border shadow-sm">
                    <Input
                      autoFocus
                      placeholder={lang === "fa" ? "عنوان تسک..." : "Task title..."}
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleQuickAdd(col.id, col.section);
                        if (e.key === "Escape") setAddingColumn(null);
                      }}
                      className="text-xs h-8"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setAddingColumn(null)} className="h-7 text-xs">
                        {t.cancel}
                      </Button>
                      <Button size="sm" onClick={() => handleQuickAdd(col.id, col.section)} className="h-7 text-xs">
                        {t.create}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingColumn(col.id);
                      setQuickTitle("");
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.createTask}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
