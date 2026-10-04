import { z } from 'zod';

export const taskProgressSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  routineTitle: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  position: z.number(),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
});

export const routineProgressSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  tasks: z.array(taskProgressSchema),
});

export const studentProgressSchema = z.object({
  student: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  date: z.string(),
  routines: z.array(routineProgressSchema),
  totals: z.object({ tasks: z.number(), completed: z.number(), pending: z.number(), progressPercent: z.number(), stars: z.number() }),
});

export const studentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  roleCode: z.string(),
  routinesToday: z.number(),
  tasksToday: z.number(),
  completedToday: z.number(),
  progressPercent: z.number(),
});

export const taskActivityEventSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  taskId: z.string(),
  routineId: z.string(),
  taskTitle: z.string(),
  routineTitle: z.string(),
  completed: z.boolean(),
  activityDate: z.string(),
  recordedAt: z.string(),
});

export const taskActivityHistorySchema = z.object({
  data: z.array(taskActivityEventSchema),
  meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number(), totalPages: z.number() }),
});

export type StudentProgress = z.infer<typeof studentProgressSchema>;
export type StudentSummary = z.infer<typeof studentSummarySchema>;
export type TaskProgress = z.infer<typeof taskProgressSchema>;
export type TaskActivityEvent = z.infer<typeof taskActivityEventSchema>;
export type TaskActivityHistory = z.infer<typeof taskActivityHistorySchema>;
