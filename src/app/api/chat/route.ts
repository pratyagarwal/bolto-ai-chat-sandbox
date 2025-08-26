import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ChatRequestSchema } from '@/lib/models/schemas';
import { 
  ChatMessage, 
  ChatResponse, 
  CommandExecution,
  ConversationSession 
} from '@/lib/models/types';
import { extractSlotsFromMessage, generateConfirmationMessage } from '@/lib/utils/openai';
import { CommandService } from '@/lib/services/command-service';

// In-memory storage for conversations (persists during server session)
const conversations: Map<string, ConversationSession> = new Map();
const pendingCommands: Map<string, CommandExecution> = new Map();

const commandService = new CommandService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validationResult = ChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { message, sessionId } = validationResult.data;

    // Get or create conversation session
    let session = sessionId ? conversations.get(sessionId) : null;
    if (!session) {
      const newSessionId = uuidv4();
      session = {
        id: newSessionId,
        userId: 'demo_user', // For MVP, single user
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      conversations.set(newSessionId, session);
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    session.messages.push(userMessage);

    // Extract intent and slots using OpenAI
    console.log('Extracting slots for message:', message);
    const slotExtraction = await extractSlotsFromMessage(message);
    console.log('Slot extraction result:', slotExtraction);

    let assistantMessage: ChatMessage;
    let commandExecution: CommandExecution | undefined;
    let needsConfirmation = false;

    if (slotExtraction.intent === 'unknown' || slotExtraction.confidence < 0.7) {
      // Handle unknown or low-confidence commands
      assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `I'm not sure how to help with that. I can assist you with:
        
• **Hiring**: "Hire [name] to the [team] team in [country]"
• **Bonuses**: "Give [name] a $[amount] bonus"  
• **Title changes**: "Change [name]'s title to [new title]"
• **Terminations**: "Terminate [name] effective [date]"

Could you please rephrase your request using one of these formats?`,
        timestamp: new Date().toISOString(),
        type: 'text',
      };
    } else {
      // Create command execution record
      commandExecution = {
        id: uuidv4(),
        sessionId: session.id,
        intent: slotExtraction.intent,
        slots: slotExtraction.slots,
        status: 'pending_confirmation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store pending command
      pendingCommands.set(commandExecution.id, commandExecution);

      // Generate confirmation message
      const confirmationText = await generateConfirmationMessage(
        slotExtraction.intent, 
        slotExtraction.slots
      );

      assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: confirmationText,
        timestamp: new Date().toISOString(),
        type: 'confirmation',
      };

      needsConfirmation = true;
    }

    session.messages.push(assistantMessage);
    session.updatedAt = new Date().toISOString();

    const response: ChatResponse = {
      message: assistantMessage,
      sessionId: session.id,
      commandExecution,
      needsConfirmation,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle command confirmations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { commandId, confirmed } = body;

    if (!commandId || typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing commandId or confirmed field' },
        { status: 400 }
      );
    }

    const commandExecution = pendingCommands.get(commandId);
    if (!commandExecution) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      );
    }

    const session = conversations.get(commandExecution.sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    let assistantMessage: ChatMessage;

    if (confirmed) {
      // Execute the command
      commandExecution.status = 'executing';
      commandExecution.updatedAt = new Date().toISOString();

      const result = await commandService.executeCommand(
        commandExecution.intent,
        commandExecution.slots
      );

      commandExecution.status = result.success ? 'completed' : 'failed';
      commandExecution.result = result;
      commandExecution.updatedAt = new Date().toISOString();

      if (result.success) {
        // Generate success message using OpenAI
        const { generateSuccessMessage } = await import('@/lib/utils/openai');
        const successText = await generateSuccessMessage(
          commandExecution.intent,
          commandExecution.slots,
          result.data
        );

        assistantMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: result.warnings && result.warnings.length > 0 
            ? `${successText}\n\n⚠️ ${result.warnings.join(' ')}`
            : successText,
          timestamp: new Date().toISOString(),
          type: 'success',
        };
      } else {
        assistantMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `❌ ${result.message}`,
          timestamp: new Date().toISOString(),
          type: 'error',
        };
      }
    } else {
      // User declined confirmation
      commandExecution.status = 'failed';
      commandExecution.updatedAt = new Date().toISOString();

      assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'No problem! The action has been cancelled. Is there anything else I can help you with?',
        timestamp: new Date().toISOString(),
        type: 'text',
      };
    }

    session.messages.push(assistantMessage);
    session.updatedAt = new Date().toISOString();

    // Clean up pending command
    pendingCommands.delete(commandId);

    const response: ChatResponse = {
      message: assistantMessage,
      sessionId: session.id,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Command confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}