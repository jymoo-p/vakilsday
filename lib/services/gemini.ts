import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface CaseContext {
  caseNumber: string;
  year?: number;
  appearingFor: string;
  clientName?: string;
  otherParties: string[];
  opponentParty: string;
  court?: string;
  caseType?: string;
  judgeName?: string;
  status: string;
  filingDate: string;
  nextHearingDate?: string;
  synopsis?: string;
  hearings: {
    date: string;
    outcome?: string;
    notes: string[];
  }[];
  documents: {
    title: string;
    type: string;
  }[];
  research: {
    title: string;
    type: string;
  }[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * General legal chat without case context
   */
  async chat(
    message: string,
    history: GeminiMessage[] = []
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      })),
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const systemPrompt = this.getSystemPrompt();
    const fullMessage = history.length === 0
      ? `${systemPrompt}\n\nUser: ${message}`
      : message;

    const result = await chat.sendMessage(fullMessage);
    const response = result.response;
    return response.text();
  }

  /**
   * Chat with user's full context (cases and clients)
   */
  async chatWithContext(
    message: string,
    history: GeminiMessage[] = [],
    userContext: any = null
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      })),
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    });

    const systemPrompt = this.getSystemPrompt();
    const contextPrompt = this.buildUserContextPrompt(userContext);
    const fullMessage = history.length === 0
      ? `${systemPrompt}\n\n${contextPrompt}\n\nUser: ${message}`
      : message;

    const result = await chat.sendMessage(fullMessage);
    const response = result.response;
    return response.text();
  }

  /**
   * Case-specific chat with full context
   */
  async chatWithCaseContext(
    message: string,
    caseContext: CaseContext,
    history: GeminiMessage[] = []
  ): Promise<{ text: string; functionCalls?: any[] }> {
    console.log('[GeminiService] Starting chatWithCaseContext')
    console.log('[GeminiService] History length:', history.length)
    console.log('[GeminiService] Message:', message.substring(0, 100))

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      tools: [{
        functionDeclarations: this.getCaseFunctionDeclarations() as any
      }]
    });

    const contextPrompt = this.buildCaseContextPrompt(caseContext);
    console.log('[GeminiService] Context built, size:', contextPrompt.length, 'chars')

    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      })),
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    });

    const systemPrompt = this.getSystemPrompt();
    const fullMessage = history.length === 0
      ? `${systemPrompt}\n\n${contextPrompt}\n\nUser: ${message}`
      : message;

    console.log('[GeminiService] Sending message to Gemini...')
    const result = await chat.sendMessage(fullMessage);
    console.log('[GeminiService] Got result from Gemini')
    const response = result.response;
    console.log('[GeminiService] Parsed response')

    // Check if AI wants to call functions
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      return {
        text: response.text() || 'I can help you update this case. Please confirm the changes.',
        functionCalls: functionCalls
      };
    }

    return { text: response.text() };
  }

  /**
   * Generate legal draft for a case
   */
  async generateDraft(
    draftType: string,
    caseContext: CaseContext,
    additionalInstructions?: string
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const contextPrompt = this.buildCaseContextPrompt(caseContext);
    const draftPrompt = this.getDraftPrompt(draftType, additionalInstructions);

    const fullPrompt = `${this.getSystemPrompt()}\n\n${contextPrompt}\n\n${draftPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    return response.text();
  }

  /**
   * Get function declarations for case updates
   */
  private getCaseFunctionDeclarations() {
    return [
      {
        name: 'updateNextHearingDate',
        description: 'Update the next hearing date for this case. Use when user asks to change, update, or set the next hearing date.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            date: {
              type: SchemaType.STRING,
              description: 'The new hearing date in YYYY-MM-DD format'
            },
            reason: {
              type: SchemaType.STRING,
              description: 'Optional reason for the change'
            }
          },
          required: ['date']
        }
      },
      {
        name: 'updateCaseStatus',
        description: 'Update the status of this case. Use when user asks to change case status, close case, mark as pending, etc.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: {
              type: SchemaType.STRING,
              enum: ['ACTIVE', 'PENDING', 'CLOSED', 'ARCHIVED'],
              description: 'The new status for the case'
            },
            reason: {
              type: SchemaType.STRING,
              description: 'Optional reason for status change'
            }
          },
          required: ['status']
        }
      },
      {
        name: 'addHearingNote',
        description: 'Add a note to the most recent hearing. Use when user asks to add notes, record observations, or document hearing details.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            note: {
              type: SchemaType.STRING,
              description: 'The note content to add'
            },
            isPrivate: {
              type: SchemaType.BOOLEAN,
              description: 'Whether this note should be private (only visible to creator)'
            }
          },
          required: ['note']
        }
      },
      {
        name: 'updateCaseSynopsis',
        description: 'Update the case synopsis/summary. Use when user asks to update case summary, change description, or revise case overview.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            synopsis: {
              type: SchemaType.STRING,
              description: 'The new synopsis/summary for the case'
            }
          },
          required: ['synopsis']
        }
      },
      {
        name: 'addHearing',
        description: 'Add a new hearing record to the case. Use when user asks to add/create a hearing, schedule a hearing, or record a hearing that happened.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            hearingDate: {
              type: SchemaType.STRING,
              description: 'The date of the hearing in YYYY-MM-DD format. Can be past or future date.'
            },
            outcome: {
              type: SchemaType.STRING,
              description: 'The outcome of the hearing (e.g., "Postponed", "Arguments heard", "Order reserved", "Judgment delivered")'
            },
            notes: {
              type: SchemaType.STRING,
              description: 'Additional notes or comments about the hearing (e.g., "Posted for hearing", "Next date for arguments")'
            },
            nextDate: {
              type: SchemaType.STRING,
              description: 'Optional next hearing date if the case was postponed, in YYYY-MM-DD format'
            }
          },
          required: ['hearingDate']
        }
      }
    ];
  }

  private getSystemPrompt(): string {
    return `You are an AI legal assistant for Indian litigation lawyers. You help with:
- Answering legal questions about Indian law
- Drafting legal documents (petitions, applications, replies, etc.)
- Analyzing case strategy
- Providing relevant case law and statutory references
- **IMPORTANT: Updating case details when instructed - you MUST use the provided functions**

Guidelines:
- Follow Indian legal procedures and citation formats
- Use formal legal language appropriate for Indian courts
- Cite relevant sections of Indian acts and precedents
- Be accurate and conservative in legal advice
- Always remind users to verify with a qualified lawyer before filing

**CRITICAL - Function Calling:**
When the user asks to:
- "Add a hearing for [date]" or "Create hearing" → CALL addHearing function
- "Set next hearing to [date]" → CALL updateNextHearingDate function
- "Change status to [status]" → CALL updateCaseStatus function
- "Mark as closed/pending/archived" → CALL updateCaseStatus function
- "Add note: [text]" → CALL addHearingNote function
- "Update synopsis/summary to [text]" → CALL updateCaseSynopsis function

You MUST call these functions, not just respond with text. The functions will actually update the database.

When adding a hearing, extract:
- The hearing date from phrases like "today", "tomorrow", "Monday", specific dates
- The outcome if mentioned (e.g., "postponed", "adjourned", "arguments heard")
- Any notes/comments the user provides
- Next date if mentioned (e.g., "postponed to Monday")

When drafting documents:
- Use proper legal formatting
- Include appropriate headings and sections
- Follow Indian court conventions
- Leave placeholders like [DATE], [SIGNATURE] where needed`;
  }

  private buildCaseContextPrompt(context: CaseContext): string {
    let prompt = `CASE INFORMATION:\n`;
    prompt += `Case Number: ${context.caseNumber}${context.year ? `/${context.year}` : ''}\n`;
    prompt += `Client: ${context.clientName || 'Not specified'}\n`;

    if (context.otherParties.length > 0) {
      prompt += `Other Parties (Our Side): ${context.otherParties.join(', ')}\n`;
    }

    prompt += `Appearing For: ${context.appearingFor}\n`;
    prompt += `Opponent: ${context.opponentParty}\n`;

    if (context.court) prompt += `Court: ${context.court}\n`;
    if (context.caseType) prompt += `Case Type: ${context.caseType}\n`;
    if (context.judgeName) prompt += `Judge: ${context.judgeName}\n`;

    prompt += `Status: ${context.status}\n`;
    prompt += `Filing Date: ${context.filingDate}\n`;

    if (context.nextHearingDate) {
      prompt += `Next Hearing: ${context.nextHearingDate}\n`;
    }

    if (context.synopsis) {
      prompt += `\nSYNOPSIS:\n${context.synopsis}\n`;
    }

    if (context.hearings.length > 0) {
      prompt += `\nHEARING HISTORY:\n`;
      context.hearings.forEach((h, i) => {
        prompt += `${i + 1}. ${h.date}\n`;
        if (h.outcome) prompt += `   Outcome: ${h.outcome}\n`;
        if (h.notes.length > 0) {
          prompt += `   Notes:\n`;
          h.notes.forEach(note => prompt += `   - ${note}\n`);
        }
      });
    }

    if (context.documents.length > 0) {
      prompt += `\nDOCUMENTS ON RECORD:\n`;
      context.documents.forEach((d, i) => {
        prompt += `${i + 1}. ${d.title} (${d.type})\n`;
      });
    }

    if (context.research.length > 0) {
      prompt += `\nRELEVANT RESEARCH:\n`;
      context.research.forEach((r, i) => {
        prompt += `${i + 1}. ${r.title} (${r.type})\n`;
      });
    }

    return prompt;
  }

  private buildUserContextPrompt(userContext: any): string {
    if (!userContext || (!userContext.cases && !userContext.clients)) {
      return '';
    }

    let prompt = `\n=== YOUR PRACTICE CONTEXT ===\n`;

    // Add cases summary
    if (userContext.cases && userContext.cases.length > 0) {
      prompt += `\nYOUR CASES (${userContext.cases.length} total):\n`;

      userContext.cases.slice(0, 20).forEach((c: any, i: number) => {
        const clientName = c.client ? `${c.client.firstName} ${c.client.lastName}` : (c.otherParties[0] || 'Unknown');
        prompt += `${i + 1}. ${c.caseNumber} - ${clientName} vs ${c.opponentMainParty}\n`;
        prompt += `   Status: ${c.status}`;
        if (c.court?.name) prompt += ` | Court: ${c.court.name}`;
        if (c.nextHearingDate) prompt += ` | Next: ${new Date(c.nextHearingDate).toLocaleDateString()}`;
        prompt += `\n`;
        if (c.synopsis) prompt += `   Synopsis: ${c.synopsis.substring(0, 150)}...\n`;
      });

      if (userContext.cases.length > 20) {
        prompt += `... and ${userContext.cases.length - 20} more cases\n`;
      }
    }

    // Add clients summary
    if (userContext.clients && userContext.clients.length > 0) {
      prompt += `\nYOUR CLIENTS (${userContext.clients.length} total):\n`;

      userContext.clients.slice(0, 15).forEach((client: any, i: number) => {
        prompt += `${i + 1}. ${client.firstName} ${client.lastName || ''}`;
        if (client.phone) prompt += ` (${client.phone})`;
        prompt += `\n`;
      });

      if (userContext.clients.length > 15) {
        prompt += `... and ${userContext.clients.length - 15} more clients\n`;
      }
    }

    prompt += `\nWhen the user asks about "my cases", "my clients", or refers to specific case numbers or client names, use this information to provide relevant, personalized responses.\n`;
    prompt += `=== END CONTEXT ===\n`;

    return prompt;
  }

  private getDraftPrompt(draftType: string, additionalInstructions?: string): string {
    const draftPrompts: Record<string, string> = {
      petition: `Draft a petition for this case. Include:
- Title/heading with court name and case details
- List of parties
- Facts of the case
- Grounds/prayers
- Proper legal citations
- Verification clause`,

      application: `Draft an application for this case. Include:
- Application heading
- Grounds for the application
- Legal basis
- Prayer/relief sought
- Verification`,

      reply: `Draft a reply/response for this case. Include:
- Opening paragraph
- Point-by-point response to opponent's claims
- Counter-arguments with legal backing
- Conclusion and prayer`,

      arguments: `Prepare written arguments for this case. Include:
- Summary of facts
- Issues for consideration
- Arguments on each issue with case law
- Conclusion and prayer`,

      affidavit: `Draft an affidavit for this case. Include:
- Deponent details
- Statement of facts in numbered paragraphs
- Verification and jurat clause`,

      notice: `Draft a legal notice for this case. Include:
- Sender and recipient details
- Facts of the case
- Legal basis for the claim
- Demand/relief sought
- Consequences of non-compliance`,
    };

    const basePrompt = draftPrompts[draftType] ||
      `Draft a ${draftType} document for this case following Indian legal conventions.`;

    return additionalInstructions
      ? `${basePrompt}\n\nAdditional Instructions: ${additionalInstructions}`
      : basePrompt;
  }
}

export async function testGeminiKey(apiKey: string): Promise<boolean> {
  try {
    // Basic validation - check if it looks like a valid API key
    if (!apiKey || apiKey.trim().length < 20) {
      console.error('API key is too short or empty');
      return false;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    // Test with a simple prompt
    const result = await model.generateContent('Hello');
    const response = await result.response;
    const text = response.text();

    console.log('API key validation successful, response:', text.substring(0, 50));
    return true;
  } catch (error: any) {
    console.error('Gemini API key test failed:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    });
    return false;
  }
}
