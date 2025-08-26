'use client';

import { Sidebar } from './sidebar';
import { ChatWindow } from '../chat/chat-window';
import { useChat } from '@/hooks/use-chat';

export function AppLayout() {
  const { startNewChat } = useChat();

  return (
    <div className="h-screen flex bg-white">
      <Sidebar onNewChat={startNewChat} />
      <ChatWindow />
    </div>
  );
}