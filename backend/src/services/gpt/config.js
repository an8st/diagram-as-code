const gptConfig = {
  apiKey: process.env.OPENAI_API_KEY || 'ASDF',
  model: 'gpt-3.5-turbo',
  baseUrl: process.env.GPT_API_URL || 'https://api.kroki.mts-corp.ru/v1/gpt',
  maxTokens: 2000,
  temperature: 0.7,
  timeoutMs: 30000,
  retryAttempts: 3,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 минут
    maxRequests: 100 // максимум запросов
  }
};

module.exports = gptConfig;
