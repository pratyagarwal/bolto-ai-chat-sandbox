import OpenAI from 'openai';
import { CommandIntent, CommandSlots } from '../models/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SlotExtractionResult {
  intent: CommandIntent;
  slots: CommandSlots;
  confidence: number;
  needsConfirmation: boolean;
}

export async function extractSlotsFromMessage(
  message: string, 
  conversationHistory?: { role: string; content: string }[]
): Promise<SlotExtractionResult> {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are an HR assistant that extracts structured data from natural language commands. 

CRITICAL: You MUST ALWAYS respond with ONLY valid JSON. No explanation, no text, ONLY JSON.

DATE PARSING RULES:
- TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
- Convert ALL relative dates to YYYY-MM-DD format
- "immediately", "today", "now" → today's date
- "tomorrow" → add 1 day to today
- "next Monday", "next Friday", etc. → find next occurrence of that weekday
- "next week" → add 7 days to today
- "end of week" → next Friday
- "end of month" → last day of current month
- Always output parsed dates in YYYY-MM-DD format in the slots

Supported commands:
1. hire_employee: REQUIRED fields: name, team, country
2. give_bonus: REQUIRED fields: name, amount  
3. change_title: REQUIRED fields: name, newTitle
4. terminate_employee: REQUIRED fields: name. For termDate: parse relative dates to YYYY-MM-DD format (e.g., "next Monday" → "2024-09-02", "immediately" → today's date)
5. view_employees: Show all employees - NO required fields
6. view_employee: Show specific employee - REQUIRED: name
7. view_teams: Show all teams - NO required fields
8. view_history: Show this session's action history - NO required fields
9. view_global_history: Show all actions across all sessions - NO required fields
10. help: Show all available commands - NO required fields

CONTEXT EXTRACTION RULES:
- Scan ALL previous messages for names, teams, countries, amounts, dates
- Merge information from conversation history with current message
- If a name was mentioned before, use it even if not in current message
- If user provides additional details, combine with previous information

INCOMPLETE COMMAND HANDLING:
- If ANY required field is missing or null, return "incomplete" intent
- Required fields: hire_employee (name, team, country), give_bonus (name, amount), change_title (name, newTitle)
- For terminate_employee: only name is required, termDate can be inferred as "immediately"
- ALWAYS mark incomplete commands with confidence 0.0 and needsConfirmation false

RESPONSE FORMAT (JSON ONLY):
{"intent": "command_type_or_incomplete_or_unknown", "slots": {"field": "value"}, "confidence": 0.0-1.0, "needsConfirmation": true/false}

Examples:
"hire John Smith to engineering team in Canada" 
→ {"intent": "hire_employee", "slots": {"name": "John Smith", "team": "engineering", "country": "Canada"}, "confidence": 0.95, "needsConfirmation": true}

"terminate John Smith" (no date specified)
→ {"intent": "terminate_employee", "slots": {"name": "John Smith", "termDate": "${new Date().toISOString().split('T')[0]}"}, "confidence": 0.9, "needsConfirmation": true}

"terminate John Smith next Friday" 
→ {"intent": "terminate_employee", "slots": {"name": "John Smith", "termDate": "2024-08-30"}, "confidence": 0.95, "needsConfirmation": true}

"give bonus to John" (missing amount)
→ {"intent": "incomplete", "slots": {"name": "John", "amount": null}, "confidence": 0.0, "needsConfirmation": false}

"change title for Sarah" (missing new title)
→ {"intent": "incomplete", "slots": {"name": "Sarah", "newTitle": null}, "confidence": 0.0, "needsConfirmation": false}

"hire John Smith" (missing team, country)
→ {"intent": "incomplete", "slots": {"name": "John Smith", "team": null, "country": null}, "confidence": 0.0, "needsConfirmation": false}`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      // Add last few messages for context (limit to avoid token overflow)
      const recentHistory = conversationHistory.slice(-4);
      messages.push(...recentHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Clean up the content - sometimes AI adds extra text
    let cleanContent = content.trim();
    
    // Extract JSON if it's wrapped in text
    const jsonMatch = cleanContent.match(/\{.*\}/s);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }

    console.log('Raw OpenAI response:', content);
    console.log('Cleaned JSON:', cleanContent);

    const result = JSON.parse(cleanContent) as SlotExtractionResult;
    
    // Validate the response structure
    if (!result.intent || !result.slots || typeof result.confidence !== 'number') {
      throw new Error('Invalid response structure from OpenAI');
    }

    return result;
  } catch (error) {
    console.error('Error extracting slots:', error);
    
    // Fallback: return unknown intent
    return {
      intent: 'unknown',
      slots: {},
      confidence: 0.0,
      needsConfirmation: false,
    };
  }
}

export async function generateConfirmationMessage(
  intent: CommandIntent, 
  slots: CommandSlots
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a clear, professional confirmation message for HR actions. 
          Be specific about what will happen and ask for explicit confirmation.
          
          Examples:
          - "I will hire John Smith as a Software Engineer in the engineering team located in Canada, starting immediately. Should I proceed?"
          - "I will give Sarah Chen a $5,000 performance bonus. This will be added to her next payroll cycle. Should I proceed?"
          - "I will change Maria Lopez's title from Designer to Senior Designer, effective immediately. Should I proceed?"
          - "I will terminate Alex Kim effective Friday, August 30th, 2024. This will trigger offboarding procedures. Should I proceed?"
          
          For termination dates: Always convert the date from YYYY-MM-DD format to a human-readable format like "Friday, August 30th, 2024"`
        },
        {
          role: 'user',
          content: `Intent: ${intent}, Slots: ${JSON.stringify(slots)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content || 'Please confirm this action.';
  } catch (error) {
    console.error('Error generating confirmation:', error);
    return 'Please confirm this action.';
  }
}

export async function generateIncompleteMessage(slots: CommandSlots): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a helpful message asking for missing information in HR commands.
          Be polite and specific about what's needed.
          
          Examples:
          - "I need more information to proceed. Could you please specify which country for the hire?"
          - "I have the name and team, but which country should I hire them in?"
          - "I see you want to give a bonus, but could you specify the amount?"
          - "I need the termination date to proceed. When should this be effective?"`
        },
        {
          role: 'user',
          content: `Missing information for slots: ${JSON.stringify(slots)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content || 'I need more information to complete this request.';
  } catch (error) {
    console.error('Error generating incomplete message:', error);
    return 'I need more information to complete this request.';
  }
}

export async function generateSuccessMessage(
  intent: CommandIntent, 
  slots: CommandSlots,
  result?: any
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate a success message for completed HR actions.
          Be positive, specific, and mention any next steps or side effects.
          
          Examples:
          - "✅ Successfully hired John Smith! Employee profile created, onboarding packet sent to john@company.com, and manager has been notified."
          - "✅ Bonus approved! $5,000 performance bonus added to Sarah Chen's payroll. Payment will be processed in the next cycle."
          - "✅ Title updated! Maria Lopez is now Senior Designer. Team notifications sent and org chart updated."
          - "✅ Termination processed. Alex Kim's final day is January 31st. Offboarding checklist created and access will be revoked."`
        },
        {
          role: 'user', 
          content: `Intent: ${intent}, Slots: ${JSON.stringify(slots)}, Result: ${JSON.stringify(result)}`
        }
      ],
      temperature: 0.4,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || '✅ Action completed successfully!';
  } catch (error) {
    console.error('Error generating success message:', error);
    return '✅ Action completed successfully!';
  }
}