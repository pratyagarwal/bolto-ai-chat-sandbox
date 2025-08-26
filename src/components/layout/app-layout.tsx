'use client';

import { Sidebar } from './sidebar';
import { ChatWindow } from '../chat/chat-window';
import { useChat } from '@/hooks/use-chat';

export function AppLayout() {
  const { 
    conversations, 
    activeConversationId, 
    messages,
    isLoading,
    pendingCommand,
    createNewConversation, 
    switchConversation,
    sendMessage,
    confirmCommand
  } = useChat();

  return (
    <div className="h-screen flex bg-white">
      <Sidebar 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={createNewConversation}
        onSwitchConversation={switchConversation}
      />
      <ChatWindow 
        messages={messages}
        isLoading={isLoading}
        pendingCommand={pendingCommand}
        onSendMessage={sendMessage}
        onConfirmCommand={confirmCommand}
      />
    </div>
  );
}