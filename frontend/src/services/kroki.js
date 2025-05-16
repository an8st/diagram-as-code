import pako from 'pako';

class KrokiService {
  constructor() {
    this.baseUrl = 'https://kroki.io';
  }

  // Преобразует текст диаграммы в base64-encoded deflate
  encodeText(text) {
    const compressed = pako.deflate(text, { level: 9 });
    return btoa(String.fromCharCode.apply(null, compressed))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  // Получает URL для отображения диаграммы
  getDiagramUrl(type, code) {
    const encodedCode = this.encodeText(code);
    return `${this.baseUrl}/${type}/svg/${encodedCode}`;
  }

  // Получает SVG диаграммы
  async getDiagramSvg(type, code) {
    try {
      const encodedCode = this.encodeText(code);
      const response = await fetch(`${this.baseUrl}/${type}/svg/${encodedCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error fetching diagram:', error);
      throw error;
    }
  }

  // Проверяет валидность диаграммы
  async validateDiagram(type, code) {
    try {
      const encodedCode = this.encodeText(code);
      const response = await fetch(`${this.baseUrl}/${type}/svg/${encodedCode}`);
      return response.ok;
    } catch (error) {
      console.error('Error validating diagram:', error);
      return false;
    }
  }
}

export const krokiService = new KrokiService();
