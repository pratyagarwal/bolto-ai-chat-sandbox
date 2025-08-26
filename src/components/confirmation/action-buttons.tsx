import { Button } from '../ui/button';

interface ActionButtonsProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ActionButtons({ onConfirm, onCancel, loading = false }: ActionButtonsProps) {
  return (
    <div className="flex space-x-2 mt-3">
      <Button
        variant="primary"
        size="sm"
        onClick={onConfirm}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
      >
        {loading ? 'Processing...' : 'Confirm'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onCancel}
        disabled={loading}
      >
        Cancel
      </Button>
    </div>
  );
}