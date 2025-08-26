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
  getEmployeeByName, 
  getTeamByName, 
  isCountrySupported, 
  addEmployee, 
  updateEmployee, 
  generateEmployeeId 
} from '../utils/data';

export class CommandService {
  async executeCommand(intent: CommandIntent, slots: CommandSlots): Promise<CommandResult> {
    try {
      switch (intent) {
        case 'hire_employee':
          return await this.executeHireEmployee(slots as HireSlots);
        case 'give_bonus':
          return await this.executeGiveBonus(slots as BonusSlots);
        case 'change_title':
          return await this.executeChangeTitle(slots as ChangeTitleSlots);
        case 'terminate_employee':
          return await this.executeTerminateEmployee(slots as TerminateSlots);
        default:
          return {
            success: false,
            message: 'Unknown command. I can help with hiring, bonuses, title changes, and terminations.',
          };
      }
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
    if (!slots.name || !slots.termDate) {
      return {
        success: false,
        message: 'I need both employee name and termination date.',
      };
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
}