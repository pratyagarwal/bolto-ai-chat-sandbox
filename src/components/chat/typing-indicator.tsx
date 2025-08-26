import { Avatar } from '../ui/avatar';

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 px-4 py-3">
      <Avatar type="bot" size="sm" />
      <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}