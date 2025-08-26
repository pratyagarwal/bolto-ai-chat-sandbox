import { z } from 'zod';

// Zod schemas for validation
export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().optional(),
});

export const HireSlotsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  team: z.string().min(1, 'Team is required'),
  country: z.string().min(1, 'Country is required'),
  startDate: z.string().optional(),
  title: z.string().optional(),
  salary: z.number().positive().optional(),
});

export const BonusSlotsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  bonusType: z.string().optional(),
  reason: z.string().optional(),
});

export const ChangeTitleSlotsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  newTitle: z.string().min(1, 'New title is required'),
  effectiveDate: z.string().optional(),
});

export const TerminateSlotsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  termDate: z.string().min(1, 'Termination date is required'),
  reason: z.string().optional(),
});

export const CommandExecutionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  intent: z.enum(['hire_employee', 'give_bonus', 'change_title', 'terminate_employee', 'view_employees', 'view_employee', 'view_teams', 'view_history', 'view_global_history', 'help', 'incomplete', 'unknown']),
  slots: z.record(z.union([z.string(), z.number()])),
  status: z.enum(['extracting_slots', 'pending_confirmation', 'executing', 'completed', 'failed']),
});