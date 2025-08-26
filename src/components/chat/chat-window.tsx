'use client';

import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { ChatMessage, CommandExecution } from '@/lib/models/types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  pendingCommand: CommandExecution | null;
  onSendMessage: (message: string) => void;
  onConfirmCommand: (confirmed: boolean) => void;
}

export function ChatWindow({ 
  messages, 
  isLoading, 
  pendingCommand, 
  onSendMessage, 
  onConfirmCommand 
}: ChatWindowProps) {

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">HR Assistant</h2>
            <p className="text-sm text-gray-500">
              {isLoading ? 'AI is thinking...' : 'Ready to help with HR tasks'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ChatMessages
        messages={messages}
        pendingCommand={pendingCommand}
        onConfirm={onConfirmCommand}
        isLoading={isLoading}
      />

      {/* Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        disabled={isLoading}
        placeholder="Ask me to hire someone, give a bonus, change a title, or terminate an employee..."
      />
    </div>
  );
}