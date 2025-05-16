class ApiService {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api';
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    return response.json();
  }

  // Projects
  async getProjects(page = 1, perPage = 10) {
    const response = await fetch(
      `${this.baseUrl}/projects?page=${page}&perPage=${perPage}`
    );
    return this.handleResponse(response);
  }

  async getProject(id) {
    const response = await fetch(`${this.baseUrl}/projects/${id}`);
    return this.handleResponse(response);
  }

  // Diagrams
  async getDiagrams(projectId, options = {}) {
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.search) params.append('search', options.search);
    if (options.page) params.append('page', options.page);
    if (options.perPage) params.append('perPage', options.perPage);

    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/diagrams?${params}`
    );
    return this.handleResponse(response);
  }

  async createDiagram(projectId, data) {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/diagrams`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async updateDiagram(projectId, diagramId, data) {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/diagrams/${diagramId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    return this.handleResponse(response);
  }

  async deleteDiagram(projectId, diagramId) {
    const response = await fetch(
      `${this.baseUrl}/projects/${projectId}/diagrams/${diagramId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
  }
}

export const apiService = new ApiService();
