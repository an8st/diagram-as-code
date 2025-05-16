const axios = require('axios');

// Mock data
const mockProjects = [
  {
    id: 1,
    name: "Project A",
    description: "Example project A",
    path: "project-a",
    visibility: "private",
    lastActivityAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Project B",
    description: "Example project B",
    path: "project-b",
    visibility: "public",
    lastActivityAt: new Date().toISOString()
  }
];

const mockDiagrams = {
  1: [
    {
      id: "d1",
      projectId: 1,
      title: "System Architecture",
      description: "Main system architecture diagram",
      type: "c4plantuml",
      code: "@startuml\ncomponent A\ncomponent B\nA -> B\n@enduml",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: 1,
        name: "John Doe"
      },
      metadata: {
        path: "diagrams/system-architecture.puml",
        branch: "main"
      }
    }
  ]
};

class GitLabService {
  async getProjects(page = 1, perPage = 10) {
    // Mock implementation
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const projects = mockProjects.slice(start, end);

    return {
      projects,
      pagination: {
        page,
        perPage,
        total: mockProjects.length
      }
    };
  }

  async getProject(id) {
    const project = mockProjects.find(p => p.id === parseInt(id));
    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    return {
      ...project,
      statistics: {
        diagramCount: mockDiagrams[id]?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  async getDiagrams(projectId, options = {}) {
    const { type, search, page = 1, perPage = 10 } = options;
    let diagrams = mockDiagrams[projectId] || [];

    if (type) {
      diagrams = diagrams.filter(d => d.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      diagrams = diagrams.filter(d => 
        d.title.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower)
      );
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedDiagrams = diagrams.slice(start, end);

    return {
      diagrams: paginatedDiagrams,
      pagination: {
        page,
        perPage,
        total: diagrams.length
      }
    };
  }

  async createDiagram(projectId, data) {
    const newDiagram = {
      id: `d${Date.now()}`,
      projectId: parseInt(projectId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: 1,
        name: "John Doe"
      },
      ...data
    };

    if (!mockDiagrams[projectId]) {
      mockDiagrams[projectId] = [];
    }
    mockDiagrams[projectId].push(newDiagram);

    return newDiagram;
  }

  async updateDiagram(projectId, diagramId, data) {
    const diagrams = mockDiagrams[projectId];
    if (!diagrams) {
      const error = new Error('Project not found');
      error.status = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const index = diagrams.findIndex(d => d.id === diagramId);
    if (index === -1) {
      const error = new Error('Diagram not found');
      error.status = 404;
      error.code = 'DIAGRAM_NOT_FOUND';
      throw error;
    }

    const updatedDiagram = {
      ...diagrams[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    diagrams[index] = updatedDiagram;

    return updatedDiagram;
  }

  async deleteDiagram(projectId, diagramId) {
    const diagrams = mockDiagrams[projectId];
    if (!diagrams) {
      const error = new Error('Project not found');
      error.status = 404;
      error.code = 'PROJECT_NOT_FOUND';
      throw error;
    }

    const index = diagrams.findIndex(d => d.id === diagramId);
    if (index === -1) {
      const error = new Error('Diagram not found');
      error.status = 404;
      error.code = 'DIAGRAM_NOT_FOUND';
      throw error;
    }

    diagrams.splice(index, 1);
  }
}

module.exports = new GitLabService();
