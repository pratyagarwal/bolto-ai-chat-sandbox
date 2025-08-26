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

export async function extractSlotsFromMessage(message: string): Promise<SlotExtractionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an HR assistant that extracts structured data from natural language commands. 

Supported commands:
1. hire_employee: "hire [name] to [team] in [country]" - Extract: name, team, country, title?, salary?, startDate?
2. give_bonus: "give [name] a $[amount] bonus" - Extract: name, amount, bonusType?, reason?  
3. change_title: "change [name]'s title to [title]" - Extract: name, newTitle, effectiveDate?
4. terminate_employee: "terminate [name] effective [date]" - Extract: name, termDate, reason?

Return JSON with:
- intent: one of the command types above, or "unknown"
- slots: object with extracted values (use null for missing required fields)
- confidence: 0.0-1.0 confidence score
- needsConfirmation: true if this action needs user confirmation

Example: "hire John Smith to engineering team in Canada"
Response: {
  "intent": "hire_employee",
  "slots": {"name": "John Smith", "team": "engineering", "country": "Canada"},
  "confidence": 0.95,
  "needsConfirmation": true
}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content) as SlotExtractionResult;
    
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
          - "I will terminate Alex Kim effective January 31st, 2024. This will trigger offboarding procedures. Should I proceed?"`
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