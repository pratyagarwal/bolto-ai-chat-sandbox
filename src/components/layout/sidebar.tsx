import { NewChatButton } from '../conversation/new-chat-button';

interface SidebarProps {
  onNewChat: () => void;
}

export function Sidebar({ onNewChat }: SidebarProps) {
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
      <div className="flex-1 px-4">
        <div className="text-sm text-gray-500 mb-2">Recent conversations</div>
        <div className="space-y-1">
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer text-sm text-gray-700">
            Hired Alex Rodriguez to Engineering
          </div>
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer text-sm text-gray-700">
            Sarah Chen bonus approval
          </div>
          <div className="p-2 rounded hover:bg-gray-100 cursor-pointer text-sm text-gray-700">
            Title change for Maria Lopez
          </div>
        </div>
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