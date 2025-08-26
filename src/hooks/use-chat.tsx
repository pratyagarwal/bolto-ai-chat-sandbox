'use client';

import { useState, useCallback } from 'react';
import { ChatMessage, CommandExecution } from '@/lib/models/types';
import { chatClient } from '@/lib/api/chat-client';

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
  pendingCommand: CommandExecution | null;
}

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    sessionId: null,
    pendingCommand: null,
  });

  const sendMessage = useCallback(async (message: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const response = await chatClient.sendMessage({
        message,
        sessionId: state.sessionId || undefined,
      });

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, response.message],
        sessionId: response.sessionId,
        pendingCommand: response.commandExecution || null,
        isLoading: false,
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
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
    }
  }, [state.sessionId]);

  const confirmCommand = useCallback(async (confirmed: boolean) => {
    if (!state.pendingCommand) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await chatClient.confirmCommand(
        state.pendingCommand.id,
        confirmed
      );

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, response.message],
        pendingCommand: null,
        isLoading: false,
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
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
    }
  }, [state.pendingCommand]);

  const startNewChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      sessionId: null,
      pendingCommand: null,
    });
  }, []);

  return {
    ...state,
    sendMessage,
    confirmCommand,
    startNewChat,
  };
}