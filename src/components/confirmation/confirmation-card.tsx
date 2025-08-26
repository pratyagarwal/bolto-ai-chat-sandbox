import { CommandExecution } from '@/lib/models/types';
import { CommandPreview } from './command-preview';
import { ActionButtons } from './action-buttons';

interface ConfirmationCardProps {
  commandExecution: CommandExecution;
  onConfirm: (confirmed: boolean) => void;
  loading?: boolean;
}

export function ConfirmationCard({ 
  commandExecution, 
  onConfirm, 
  loading = false 
}: ConfirmationCardProps) {
  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 my-2">
      <div className="flex items-start space-x-2 mb-3">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
          <span className="text-xs font-bold text-yellow-800">!</span>
        </div>
        <div className="flex-1">
          <p className="text-yellow-800 font-medium mb-1">
            Action requires confirmation
          </p>
          <p className="text-yellow-700 text-sm mb-3">
            Please review the details below and confirm if you want to proceed.
          </p>
        </div>
      </div>

      <CommandPreview
        intent={commandExecution.intent}
        slots={commandExecution.slots}
      />

      <ActionButtons
        onConfirm={() => onConfirm(true)}
        onCancel={() => onConfirm(false)}
        loading={loading}
      />
    </div>
  );
}