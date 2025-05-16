import { v4 as uuid } from 'uuid';

class GPTService {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api/gpt';
    this.currentSessionId = null;
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    return response.json();
  }

  async analyzeDiagram(type, code) {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          code
        }),
      });

      const result = await this.handleResponse(response);
      return result.analysis;
    } catch (error) {
      console.error('Failed to analyze diagram:', error);
      throw error;
    }
  }

  startNewChat() {
    this.currentSessionId = uuid();
    return this.currentSessionId;
  }

  getCurrentSession() {
    if (!this.currentSessionId) {
      this.currentSessionId = uuid();
    }
    return this.currentSessionId;
  }

  async chat(type, code, message) {
    try {
      const sessionId = this.getCurrentSession();
      const response = await fetch(`${this.baseUrl}/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          code,
          message
        }),
      });

      const result = await this.handleResponse(response);
      return {
        message: result.message,
        code: result.code,
        hasCode: result.hasCode
      };
    } catch (error) {
      console.error('Failed to chat with GPT:', error);
      throw error;
    }
  }

  async explainDiagram(type, code) {
    try {
      const response = await fetch(`${this.baseUrl}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          code
        }),
      });

      const result = await this.handleResponse(response);
      return result.explanation;
    } catch (error) {
      console.error('Failed to explain diagram:', error);
      throw error;
    }
  }

  async endChat() {
    if (this.currentSessionId) {
      try {
        await fetch(`${this.baseUrl}/chat/${this.currentSessionId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to end chat session:', error);
      }
      this.currentSessionId = null;
    }
  }
}

export const gptService = new GPTService();
