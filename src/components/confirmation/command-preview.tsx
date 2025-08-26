import { CommandIntent, CommandSlots } from '@/lib/models/types';

interface CommandPreviewProps {
  intent: CommandIntent;
  slots: CommandSlots;
}

export function CommandPreview({ intent, slots }: CommandPreviewProps) {
  const formatCommand = () => {
    switch (intent) {
      case 'hire_employee':
        return {
          title: '👥 Hiring Employee',
          details: [
            { label: 'Name', value: slots.name },
            { label: 'Team', value: slots.team },
            { label: 'Country', value: slots.country },
            { label: 'Start Date', value: slots.startDate || 'Immediately' },
          ],
        };
      case 'give_bonus':
        return {
          title: '💰 Bonus Payment',
          details: [
            { label: 'Employee', value: slots.name },
            { label: 'Amount', value: typeof slots.amount === 'number' ? `$${slots.amount.toLocaleString()}` : slots.amount },
            { label: 'Type', value: slots.bonusType || 'Performance' },
            { label: 'Reason', value: slots.reason || 'Not specified' },
          ],
        };
      case 'change_title':
        return {
          title: '📋 Title Change',
          details: [
            { label: 'Employee', value: slots.name },
            { label: 'New Title', value: slots.newTitle },
            { label: 'Effective Date', value: slots.effectiveDate || 'Immediately' },
          ],
        };
      case 'terminate_employee':
        return {
          title: '⚠️ Employee Termination',
          details: [
            { label: 'Employee', value: slots.name },
            { label: 'Termination Date', value: slots.termDate },
            { label: 'Reason', value: slots.reason || 'Not specified' },
          ],
        };
      default:
        return {
          title: '🤖 Unknown Command',
          details: [{ label: 'Intent', value: intent }],
        };
    }
  };

  const { title, details } = formatCommand();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
      <h4 className="font-semibold text-blue-900 mb-2">{title}</h4>
      <div className="space-y-1">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-blue-700 font-medium">{detail.label}:</span>
            <span className="text-blue-900">{detail.value || 'N/A'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}