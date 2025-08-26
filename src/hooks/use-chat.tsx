'use client';

import { useState, useCallback } from 'react';
import { ChatMessage, CommandExecution } from '@/lib/models/types';
import { chatClient } from '@/lib/api/chat-client';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  pendingCommand: CommandExecution | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
}

const generateTitle = (firstMessage: string): string => {
  return firstMessage.length > 50 
    ? firstMessage.substring(0, 47) + '...' 
    : firstMessage;
};

export function useChat() {
  const [state, setState] = useState<ChatState>({
    conversations: [],
    activeConversationId: null,
  });

  const activeConversation = state.conversations.find(
    conv => conv.id === state.activeConversationId
  );

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      sessionId: null,
      isLoading: false,
      pendingCommand: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      conversations: [newConversation, ...prev.conversations],
      activeConversationId: newConversation.id,
    }));

    return newConversation.id;
  }, []);

  const switchConversation = useCallback((conversationId: string) => {
    setState(prev => ({
      ...prev,
      activeConversationId: conversationId,
    }));
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!state.activeConversationId) {
      createNewConversation();
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    // Add user message and set loading for active conversation only
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv => 
        conv.id === state.activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title: conv.messages.length === 0 ? generateTitle(message) : conv.title,
              isLoading: true,
              updatedAt: new Date().toISOString(),
            }
          : conv
      ),
    }));

    try {
      const response = await chatClient.sendMessage({
        message,
        sessionId: activeConversation?.sessionId || undefined,
      });

      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, response.message],
                sessionId: response.sessionId,
                isLoading: false,
                pendingCommand: response.commandExecution || null,
                updatedAt: new Date().toISOString(),
              }
            : conv
        ),
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        type: 'error',
      };

      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, errorMessage],
                isLoading: false,
                updatedAt: new Date().toISOString(),
              }
            : conv
        ),
      }));
    }
  }, [state.activeConversationId, activeConversation?.sessionId, createNewConversation]);

  const confirmCommand = useCallback(async (confirmed: boolean) => {
    if (!state.activeConversationId) return;
    
    const activeConv = state.conversations.find(conv => conv.id === state.activeConversationId);
    if (!activeConv?.pendingCommand) return;

    // Set loading for active conversation only
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv => 
        conv.id === state.activeConversationId
          ? { ...conv, isLoading: true }
          : conv
      ),
    }));

    try {
      const response = await chatClient.confirmCommand(
        activeConv.pendingCommand.id,
        confirmed
      );

      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, response.message],
                pendingCommand: null,
                isLoading: false,
                updatedAt: new Date().toISOString(),
              }
            : conv
        ),
      }));
    } catch (error) {
      console.error('Failed to confirm command:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your confirmation.',
        timestamp: new Date().toISOString(),
        type: 'error',
      };

      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, errorMessage],
                isLoading: false,
                updatedAt: new Date().toISOString(),
              }
            : conv
        ),
      }));
    }
  }, [state.activeConversationId, state.conversations]);

  return {
    ...state,
    messages: activeConversation?.messages || [],
    sessionId: activeConversation?.sessionId || null,
    isLoading: activeConversation?.isLoading || false,
    pendingCommand: activeConversation?.pendingCommand || null,
    sendMessage,
    confirmCommand,
    createNewConversation,
    switchConversation,
  };
}