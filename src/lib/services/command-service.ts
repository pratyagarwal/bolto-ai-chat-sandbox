import { 
  CommandIntent, 
  CommandSlots, 
  CommandResult, 
  HireSlots, 
  BonusSlots, 
  ChangeTitleSlots, 
  TerminateSlots,
  Employee 
} from '../models/types';
import { 
  getEmployees,
  getEmployeeByName, 
  getTeams,
  getTeamByName, 
  isCountrySupported, 
  addEmployee, 
  updateEmployee, 
  generateEmployeeId 
} from '../utils/data';
import { AuditService } from './audit-service';

export class CommandService {
  async executeCommand(intent: CommandIntent, slots: CommandSlots, sessionId: string = 'unknown', userId: string = 'demo_user'): Promise<CommandResult> {
    try {
      let result: CommandResult;

      switch (intent) {
        case 'hire_employee':
          result = await this.executeHireEmployee(slots as HireSlots);
          break;
        case 'give_bonus':
          result = await this.executeGiveBonus(slots as BonusSlots);
          break;
        case 'change_title':
          result = await this.executeChangeTitle(slots as ChangeTitleSlots);
          break;
        case 'terminate_employee':
          result = await this.executeTerminateEmployee(slots as TerminateSlots);
          break;
        case 'view_employees':
          result = await this.executeViewEmployees();
          break;
        case 'view_employee':
          result = await this.executeViewEmployee(slots);
          break;
        case 'view_teams':
          result = await this.executeViewTeams();
          break;
        case 'view_history':
          result = await this.executeViewHistory(sessionId);
          break;
        case 'view_global_history':
          result = await this.executeViewHistory(); // No sessionId = global
          break;
        case 'help':
          result = await this.executeHelp();
          break;
        default:
          result = {
            success: false,
            message: 'Unknown command. I can help with hiring, bonuses, title changes, terminations, and viewing data.',
          };
          break;
      }

      // Log action commands (not view commands)
      const actionCommands = ['hire_employee', 'give_bonus', 'change_title', 'terminate_employee'];
      if (actionCommands.includes(intent)) {
        AuditService.logAction(sessionId, userId, intent, slots, result.success, result.success ? undefined : result.message);
      }

      return result;
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        success: false,
        message: 'An error occurred while processing your request. Please try again.',
      };
    }
  }

  private async executeHireEmployee(slots: HireSlots): Promise<CommandResult> {
    // Validate required fields
    if (!slots.name || !slots.team || !slots.country) {
      return {
        success: false,
        message: 'Missing required information. I need name, team, and country to hire someone.',
      };
    }

    // Check if employee already exists
    const existingEmployee = getEmployeeByName(slots.name);
    if (existingEmployee) {
      return {
        success: false,
        message: `${slots.name} is already employed in our system.`,
      };
    }

    // Validate team exists
    const team = getTeamByName(slots.team);
    if (!team) {
      return {
        success: false,
        message: `Team "${slots.team}" does not exist. Available teams: engineering, platform, design, operations.`,
      };
    }

    // Validate country is supported
    if (!isCountrySupported(slots.country)) {
      return {
        success: false,
        message: `We cannot hire in ${slots.country} at this time. This country may be embargoed or not supported by our EOR partner.`,
      };
    }

    // Create new employee
    const newEmployee: Employee = {
      id: generateEmployeeId(),
      name: slots.name,
      team: slots.team.toLowerCase(),
      country: slots.country,
      title: slots.title || 'Software Engineer',
      salary: slots.salary || 80000,
      currency: 'USD',
      manager: team.manager,
      startDate: slots.startDate || new Date().toISOString().split('T')[0],
      status: 'active',
    };

    addEmployee(newEmployee);

    return {
      success: true,
      message: `Successfully hired ${slots.name}!`,
      data: { employeeId: newEmployee.id, employee: newEmployee },
    };
  }

  private async executeGiveBonus(slots: BonusSlots): Promise<CommandResult> {
    if (!slots.name || !slots.amount) {
      return {
        success: false,
        message: 'I need both employee name and bonus amount.',
      };
    }

    const employee = getEmployeeByName(slots.name);
    if (!employee) {
      return {
        success: false,
        message: `Could not find employee "${slots.name}". Please check the spelling.`,
      };
    }

    // Check for unusual bonus amounts (warning threshold)
    const warnings: string[] = [];
    if (slots.amount > employee.salary * 0.3) {
      warnings.push(`This bonus (${slots.amount}) is more than 30% of ${employee.name}'s annual salary.`);
    }

    return {
      success: true,
      message: `Bonus approved for ${employee.name}!`,
      data: { 
        employeeId: employee.id, 
        bonusAmount: slots.amount,
        bonusType: slots.bonusType || 'performance'
      },
      warnings,
    };
  }

  private async executeChangeTitle(slots: ChangeTitleSlots): Promise<CommandResult> {
    if (!slots.name || !slots.newTitle) {
      return {
        success: false,
        message: 'I need both employee name and the new title.',
      };
    }

    const employee = getEmployeeByName(slots.name);
    if (!employee) {
      return {
        success: false,
        message: `Could not find employee "${slots.name}". Please check the spelling.`,
      };
    }

    const oldTitle = employee.title;
    const updatedEmployee = updateEmployee(employee.id, {
      title: slots.newTitle,
    });

    if (!updatedEmployee) {
      return {
        success: false,
        message: 'Failed to update employee title.',
      };
    }

    return {
      success: true,
      message: `Title updated for ${employee.name}!`,
      data: { 
        employeeId: employee.id,
        oldTitle,
        newTitle: slots.newTitle,
        effectiveDate: slots.effectiveDate || new Date().toISOString().split('T')[0]
      },
    };
  }

  private async executeTerminateEmployee(slots: TerminateSlots): Promise<CommandResult> {
    if (!slots.name) {
      return {
        success: false,
        message: 'I need the employee name to proceed with termination.',
      };
    }

    // If no termDate provided, default to today's date
    if (!slots.termDate) {
      slots.termDate = new Date().toISOString().split('T')[0];
    }

    const employee = getEmployeeByName(slots.name);
    if (!employee) {
      return {
        success: false,
        message: `Could not find employee "${slots.name}". Please check the spelling.`,
      };
    }

    if (employee.status === 'terminated') {
      return {
        success: false,
        message: `${employee.name} has already been terminated.`,
      };
    }

    const updatedEmployee = updateEmployee(employee.id, {
      status: 'terminated',
    });

    if (!updatedEmployee) {
      return {
        success: false,
        message: 'Failed to process termination.',
      };
    }

    // Calculate final pay (simplified)
    const finalPay = Math.round(employee.salary / 12); // One month severance

    return {
      success: true,
      message: `Termination processed for ${employee.name}.`,
      data: {
        employeeId: employee.id,
        terminationDate: slots.termDate,
        reason: slots.reason || 'Not specified',
        finalPay,
      },
    };
  }

  private async executeViewEmployees(): Promise<CommandResult> {
    const employees = getEmployees();
    
    const employeeList = employees.map(emp => 
      `• ${emp.name} - ${emp.title} (${emp.team} team, ${emp.country}) - ${emp.status}`
    ).join('\n');

    return {
      success: true,
      message: `Current Employees (${employees.length}):\n\n${employeeList}`,
      data: { employees, count: employees.length },
    };
  }

  private async executeViewEmployee(slots: CommandSlots): Promise<CommandResult> {
    if (!slots.name) {
      return {
        success: false,
        message: 'Please specify which employee you want to view.',
      };
    }

    const employee = getEmployeeByName(slots.name);
    if (!employee) {
      return {
        success: false,
        message: `Could not find employee "${slots.name}".`,
      };
    }

    const details = [
      `**Name:** ${employee.name}`,
      `**Title:** ${employee.title}`,
      `**Team:** ${employee.team}`,
      `**Country:** ${employee.country}`,
      `**Salary:** $${employee.salary.toLocaleString()} ${employee.currency}`,
      `**Start Date:** ${employee.startDate}`,
      `**Status:** ${employee.status}`,
      `**Employee ID:** ${employee.id}`
    ].join('\n');

    return {
      success: true,
      message: `Employee Details:\n\n${details}`,
      data: { employee },
    };
  }

  private async executeViewTeams(): Promise<CommandResult> {
    const teams = getTeams();
    
    const teamList = teams.map(team => 
      `• ${team.name} (${team.department})`
    ).join('\n');

    return {
      success: true,
      message: `Available Teams (${teams.length}):\n\n${teamList}`,
      data: { teams, count: teams.length },
    };
  }

  private async executeViewHistory(sessionId?: string): Promise<CommandResult> {
    const logs = sessionId ? AuditService.getSessionLogs(sessionId) : AuditService.getAllLogs();
    
    if (logs.length === 0) {
      return {
        success: true,
        message: sessionId 
          ? "No actions have been taken in this session yet."
          : "No actions have been logged yet.",
        data: { logs: [] },
      };
    }

    const logMessages = logs.map(log => AuditService.formatLogForDisplay(log));
    const title = sessionId 
      ? `Session Action History (${logs.length} actions):`
      : `All Action History (${logs.length} actions):`;

    return {
      success: true,
      message: `${title}\n\n${logMessages.join('\n')}`,
      data: { logs, count: logs.length },
    };
  }

  private async executeHelp(): Promise<CommandResult> {
    const helpMessage = `Available HR Assistant Commands:

EMPLOYEE MANAGEMENT:
• Hire Employee: "Hire [name] to the [team] team in [country]"
• Give Bonus: "Give [name] a $[amount] bonus"
• Change Title: "Change [name]'s title to [new title]"
• Terminate Employee: "Terminate [name] effective [date]"

VIEW DATA:
• View All Employees: "Show me all employees"
• View Specific Employee: "Show me [employee name]"
• View Teams: "Show me all teams"
• View History: "Show conversation history"

EXAMPLES:
• "Hire John Smith to the engineering team in Canada"
• "Give Sarah Chen a $5000 performance bonus"
• "Change Maria Lopez's title to Senior Designer"
• "Terminate Alex Kim effective 2024-12-31"
• "Show me all employees"

Just ask in natural language - I'll understand what you need!`;

    return {
      success: true,
      message: helpMessage,
      data: { 
        commands: [
          'hire_employee',
          'give_bonus', 
          'change_title',
          'terminate_employee',
          'view_employees',
          'view_employee',
          'view_teams',
          'view_history'
        ]
      },
    };
  }
}