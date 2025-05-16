const config = require('./config');
const prompts = require('./prompts');

class GPTService {
  constructor() {
    this.config = config;
    this.conversations = new Map(); // хранение контекста чатов
  }

  async makeRequest(messages) {
    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content;
    } catch (error) {
      console.error('GPT request failed:', error);
      throw new Error('Failed to process GPT request');
    }
  }

  buildPrompt(template, params) {
    return template.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
  }

  async analyzeDiagram(params) {
    const { type, code } = params;
    
    const prompt = this.buildPrompt(prompts.analyze.template, {
      type,
      code
    });

    const messages = [
      {
        role: 'system',
        content: prompts.analyze.system
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return this.makeRequest(messages);
  }

  async chat(params) {
    const { sessionId, type, code, message } = params;

    // Получаем или создаем историю чата
    let conversation = this.conversations.get(sessionId) || {
      messages: [
        {
          role: 'system',
          content: prompts.chat.system
        }
      ]
    };

    // Если это первое сообщение в чате, добавляем анализ диаграммы
    if (conversation.messages.length === 1) {
      const analysis = await this.analyzeDiagram({ type, code });
      conversation.messages.push({
        role: 'assistant',
        content: `Initial diagram analysis:\n${analysis}`
      });
    }

    // Добавляем сообщение пользователя с контекстом
    const prompt = this.buildPrompt(prompts.chat.template, {
      type,
      code,
      message
    });

    conversation.messages.push({
      role: 'user',
      content: prompt
    });

    // Получаем ответ от GPT
    const response = await this.makeRequest(conversation.messages);

    // Добавляем ответ в историю
    conversation.messages.push({
      role: 'assistant',
      content: response
    });

    // Ограничиваем историю последними N сообщениями
    const maxHistory = 10;
    if (conversation.messages.length > maxHistory + 2) { // +2 для system message и initial analysis
      conversation.messages = [
        conversation.messages[0], // system
        conversation.messages[1], // initial analysis
        ...conversation.messages.slice(-maxHistory)
      ];
    }

    // Сохраняем обновленную историю
    this.conversations.set(sessionId, conversation);

    // Извлекаем код, если он есть в ответе
    const codeBlock = this.extractCode(response);

    return {
      message: response,
      code: codeBlock,
      hasCode: !!codeBlock
    };
  }

  async explainDiagram(params) {
    const { type, code } = params;

    const prompt = this.buildPrompt(prompts.explain.template, {
      type,
      code
    });

    const messages = [
      {
        role: 'system',
        content: prompts.chat.system
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return this.makeRequest(messages);
  }

  extractCode(response) {
    // Извлекаем код из ответа, удаляя все лишнее
    const codeMatch = response.match(/```[\s\S]*?\n([\s\S]*?)```/) || 
                     response.match(/<#([\s\S]*?)#>/) ||
                     response.match(/'''([\s\S]*?)'''/);
    
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    return null;
  }

  async retryWithExponentialBackoff(operation, maxAttempts = 3) {
    let attempt = 1;
    let delay = 1000; // начальная задержка 1 секунда

    while (attempt <= maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempt++;
        delay *= 2; // увеличиваем задержку экспоненциально
      }
    }
  }

  // Очистка старых сессий
  cleanupSessions() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа
    const now = Date.now();

    for (const [sessionId, conversation] of this.conversations.entries()) {
      if (now - conversation.lastActivity > maxAge) {
        this.conversations.delete(sessionId);
      }
    }
  }
}

module.exports = new GPTService();
