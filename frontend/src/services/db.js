const DB_NAME = 'diagramsDB';
const DB_VERSION = 1;
const STORE_NAME = 'diagrams';

class DiagramDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Error opening database'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  async getAllDiagrams() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error('Error getting diagrams'));
      };

      request.onsuccess = () => {
        const diagrams = {};
        request.result.forEach(diagram => {
          diagrams[diagram.id] = diagram;
        });
        resolve(diagrams);
      };
    });
  }

  async getDiagramsByProject(projectId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onerror = () => {
        reject(new Error('Error getting diagrams by project'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async getDiagramsByType(type) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('type');
      const request = index.getAll(type);

      request.onerror = () => {
        reject(new Error('Error getting diagrams by type'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async saveDiagram(id, diagramData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, ...diagramData, updatedAt: new Date().toISOString() });

      request.onerror = () => {
        reject(new Error('Error saving diagram'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async deleteDiagram(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        reject(new Error('Error deleting diagram'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async searchDiagrams(query) {
    const diagrams = await this.getAllDiagrams();
    const searchLower = query.toLowerCase();
    
    return Object.values(diagrams).filter(diagram => 
      diagram.title.toLowerCase().includes(searchLower) ||
      diagram.description?.toLowerCase().includes(searchLower)
    );
  }

  async clearAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        reject(new Error('Error clearing database'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }
}

export const diagramDB = new DiagramDatabase();
