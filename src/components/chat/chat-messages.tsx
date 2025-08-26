'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage, CommandExecution } from '@/lib/models/types';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

interface ChatMessagesProps {
  messages: ChatMessage[];
  pendingCommand: CommandExecution | null;
  onConfirm: (confirmed: boolean) => void;
  isLoading: boolean;
}

export function ChatMessages({ 
  messages, 
  pendingCommand, 
  onConfirm, 
  isLoading 
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome to Bolto HR Assistant
          </h3>
          <p className="text-gray-500 max-w-md">
            I can help you with hiring, bonuses, title changes, and terminations. 
            Just tell me what you need in plain English!
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <div>Examples:</div>
            <div>"Hire Alex Rodriguez to engineering in Spain"</div>
            <div>"Give Sarah Chen a $5000 bonus"</div>
            <div>"Change John's title to Senior Engineer"</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="py-4">
        {messages.map((message) => {
          // Find the command execution for confirmation messages
          const commandExecution = message.type === 'confirmation' ? pendingCommand : undefined;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              commandExecution={commandExecution}
              onConfirm={commandExecution ? onConfirm : undefined}
              loading={isLoading}
            />
          );
        })}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}