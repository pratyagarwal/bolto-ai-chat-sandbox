// Core data models
export interface Employee {
  id: string;
  name: string;
  team: string;
  country: string;
  title: string;
  salary: number;
  currency: string;
  manager: string;
  startDate: string;
  status: 'active' | 'terminated' | 'on_leave';
}

export interface Team {
  id: string;
  name: string;
  department: string;
  manager: string;
}

export interface Country {
  code: string;
  name: string;
  supported: boolean;
  embargoed: boolean;
}

// Command-related types
export interface CommandSlots {
  [key: string]: string | number | undefined;
}

export interface HireSlots extends CommandSlots {
  name: string;
  team: string;
  country: string;
  startDate?: string;
  title?: string;
  salary?: number;
}

export interface BonusSlots extends CommandSlots {
  name: string;
  amount: number;
  bonusType?: string;
  reason?: string;
}

export interface ChangeTitleSlots extends CommandSlots {
  name: string;
  newTitle: string;
  effectiveDate?: string;
}

export interface TerminateSlots extends CommandSlots {
  name: string;
  termDate: string;
  reason?: string;
}

// Chat and conversation types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'confirmation' | 'success' | 'error';
}

export interface ConversationSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CommandExecution {
  id: string;
  sessionId: string;
  intent: CommandIntent;
  slots: CommandSlots;
  status: 'extracting_slots' | 'pending_confirmation' | 'executing' | 'completed' | 'failed';
  result?: CommandResult;
  createdAt: string;
  updatedAt: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  warnings?: string[];
}

// Audit log types
export interface ActionLog {
  id: string;
  sessionId: string;
  userId: string;
  action: CommandIntent;
  details: {
    employeeName?: string;
    fromValue?: string;
    toValue?: string;
    amount?: number;
    reason?: string;
    [key: string]: any;
  };
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

// Command intent types
export type CommandIntent = 
  | 'hire_employee'
  | 'give_bonus' 
  | 'change_title'
  | 'terminate_employee'
  | 'view_employees'
  | 'view_employee'
  | 'view_teams'
  | 'view_history'
  | 'view_global_history'
  | 'help'
  | 'incomplete'
  | 'unknown';

// API request/response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  commandExecution?: CommandExecution;
  needsConfirmation?: boolean;
}