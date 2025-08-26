import { NewChatButton } from '../conversation/new-chat-button';
import { Conversation } from '@/hooks/use-chat';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSwitchConversation: (conversationId: string) => void;
}

export function Sidebar({ 
  conversations, 
  activeConversationId, 
  onNewChat, 
  onSwitchConversation 
}: SidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">
          Bolto HR Assistant
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered HR management
        </p>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <NewChatButton onClick={onNewChat} />
      </div>

      {/* Chat History */}
      <div className="flex-1 px-4 overflow-y-auto">
        {conversations.length > 0 && (
          <>
            <div className="text-sm text-gray-500 mb-2">Recent conversations</div>
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSwitchConversation(conversation.id)}
                  className={`p-2 rounded cursor-pointer text-sm truncate transition-colors ${
                    conversation.id === activeConversationId
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={conversation.title}
                >
                  {conversation.title}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-400">
          Version 1.0 - Demo Mode
        </div>
      </div>
    </div>
  );
}