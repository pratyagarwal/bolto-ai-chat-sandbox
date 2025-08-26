import { ChatMessage, CommandExecution } from '@/lib/models/types';
import { Avatar } from '../ui/avatar';
import { ConfirmationCard } from '../confirmation/confirmation-card';

interface MessageBubbleProps {
  message: ChatMessage;
  commandExecution?: CommandExecution;
  onConfirm?: (confirmed: boolean) => void;
  loading?: boolean;
}

export function MessageBubble({ 
  message, 
  commandExecution, 
  onConfirm, 
  loading = false 
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isConfirmation = message.type === 'confirmation';
  const isSuccess = message.type === 'success';
  const isError = message.type === 'error';

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageBubbleClasses = () => {
    if (isUser) {
      return 'bg-blue-500 text-white ml-auto';
    }
    
    if (isSuccess) {
      return 'bg-green-50 text-green-900 border border-green-200';
    }
    
    if (isError) {
      return 'bg-red-50 text-red-900 border border-red-200';
    }
    
    return 'bg-gray-100 text-gray-900';
  };

  return (
    <div className={`flex items-start space-x-3 px-4 py-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {!isUser && <Avatar type="bot" size="sm" />}
      
      <div className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'} max-w-2xl`}>
        <div className={`rounded-2xl px-4 py-3 ${getMessageBubbleClasses()} max-w-full`}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        
        {/* Show confirmation card for confirmation messages */}
        {isConfirmation && commandExecution && onConfirm && (
          <div className="w-full max-w-lg">
            <ConfirmationCard
              commandExecution={commandExecution}
              onConfirm={onConfirm}
              loading={loading}
            />
          </div>
        )}
        
        <span className="text-xs text-gray-500 px-2">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
      
      {isUser && <Avatar type="user" size="sm" />}
    </div>
  );
}