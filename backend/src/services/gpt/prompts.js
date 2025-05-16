const prompts = {
  analyze: {
    system: `You are a diagram expert. Analyze diagrams and provide clear, concise feedback. 
Focus on structure, design patterns, and potential improvements.`,
    
    template: `Analyze this {type} diagram:

{code}

Provide a brief analysis of:
1. Main purpose and components
2. Design patterns used
3. Potential improvements

Keep your response concise and focused on the most important aspects.`
  },

  chat: {
    system: `You are a diagram expert specializing in software architecture and system design.
Your role is to help users create, improve, and understand diagrams.
Always provide responses in a clear, structured format.
When suggesting code changes, return them in a code block.`,
    
    template: `Context: The current diagram ({type}):

{code}

User request: {message}

If the user asks for changes, provide them in a code block.
If the user asks for explanations, be concise and focus on key points.
If the user's intent is unclear, ask clarifying questions.`
  },

  explain: {
    template: `Explain this {type} diagram:

{code}

Provide a comprehensive analysis including:
1. Overall Purpose:
   - Main goal of the diagram
   - Target audience
   - Key use cases

2. Components:
   - List and description of main elements
   - Role of each component
   - Important attributes or properties

3. Relationships:
   - Connections between components
   - Flow of information or control
   - Dependencies and interactions

4. Design Decisions:
   - Architecture patterns used
   - Notable design choices
   - Potential trade-offs

5. Suggestions:
   - Possible improvements
   - Best practices to consider
   - Areas that might need clarification`
  }
};

module.exports = prompts;
