/**
 * The CEO's own tasks and reminders (decision D9), created from the chat or the tasks page.
 * Dates are local wall-clock values without a time zone:
 *   dueDate  "YYYY-MM-DD"        — the day the task is due
 *   remindAt "YYYY-MM-DDTHH:MM"  — when to show a reminder
 */
export type TaskStatus = "open" | "done";

export interface Task {
  id: string;
  createdAt: string;
  title: string;
  dueDate: string | null;
  remindAt: string | null;
  /** Set once the reminder has been shown, so it fires only once. */
  remindedAt: string | null;
  status: TaskStatus;
  chatId: string | null;
}

export interface UpdateTaskRequest {
  status?: TaskStatus;
  reminded?: boolean;
}

/** A commitment extracted from a meeting report (not reviewed by the CEO). */
export interface MeetingCommitment {
  reportId: string;
  meetingTitle: string;
  meetingDate: string;
  action: string;
  owner: string;
  deadline: string | null;
}
