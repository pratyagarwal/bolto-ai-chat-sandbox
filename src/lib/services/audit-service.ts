import { v4 as uuidv4 } from 'uuid';
import { ActionLog, CommandIntent, CommandSlots } from '../models/types';

// In-memory storage for audit logs (persists during server session)
const auditLogs: ActionLog[] = [];

export class AuditService {
  static logAction(
    sessionId: string,
    userId: string,
    action: CommandIntent,
    slots: CommandSlots,
    success: boolean,
    errorMessage?: string
  ): ActionLog {
    const log: ActionLog = {
      id: uuidv4(),
      sessionId,
      userId,
      action,
      details: this.extractActionDetails(action, slots),
      timestamp: new Date().toISOString(),
      success,
      errorMessage,
    };

    auditLogs.push(log);
    return log;
  }

  static getSessionLogs(sessionId: string): ActionLog[] {
    return auditLogs.filter(log => log.sessionId === sessionId);
  }

  static getAllLogs(): ActionLog[] {
    return [...auditLogs];
  }

  static getActionLogs(action?: CommandIntent): ActionLog[] {
    if (!action) return [...auditLogs];
    return auditLogs.filter(log => log.action === action);
  }

  private static extractActionDetails(action: CommandIntent, slots: CommandSlots): ActionLog['details'] {
    const details: ActionLog['details'] = {};

    switch (action) {
      case 'hire_employee':
        details.employeeName = slots.name as string;
        details.team = slots.team as string;
        details.country = slots.country as string;
        details.title = slots.title as string;
        details.salary = slots.salary as number;
        break;

      case 'give_bonus':
        details.employeeName = slots.name as string;
        details.amount = slots.amount as number;
        details.bonusType = slots.bonusType as string;
        details.reason = slots.reason as string;
        break;

      case 'change_title':
        details.employeeName = slots.name as string;
        details.fromValue = slots.currentTitle as string;
        details.toValue = slots.newTitle as string;
        details.effectiveDate = slots.effectiveDate as string;
        break;

      case 'terminate_employee':
        details.employeeName = slots.name as string;
        details.terminationDate = slots.termDate as string;
        details.reason = slots.reason as string;
        break;

      default:
        // For view commands, store the query details
        if (slots.name) details.employeeName = slots.name as string;
        break;
    }

    return details;
  }

  static formatLogForDisplay(log: ActionLog): string {
    const date = new Date(log.timestamp).toLocaleString();
    const status = log.success ? '✅' : '❌';
    
    let description = '';
    switch (log.action) {
      case 'hire_employee':
        description = `Hired ${log.details.employeeName} to ${log.details.team} team in ${log.details.country}`;
        break;
      case 'give_bonus':
        description = `Gave ${log.details.employeeName} a $${log.details.amount} bonus`;
        break;
      case 'change_title':
        description = `Changed ${log.details.employeeName}'s title to ${log.details.toValue}`;
        break;
      case 'terminate_employee':
        description = `Terminated ${log.details.employeeName} effective ${log.details.terminationDate}`;
        break;
      default:
        description = `Executed ${log.action}${log.details.employeeName ? ` for ${log.details.employeeName}` : ''}`;
        break;
    }

    return `${status} ${description} (${date})`;
  }
}