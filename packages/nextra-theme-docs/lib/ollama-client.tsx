export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  function_call?: {
    name: string
    arguments: any
  }
}

// Define the available functions
const functions = [
  {
    name: 'generateMarkdown',
    description: 'Generate fully formatted markdown content for documentation.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The markdown content to generate or modify.',
        },
      },
      required: ['content'],
    }
  },
  {
    name: 'generateGraph',
    description: 'Generate a graph visualization.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The graph code or description.',
        },
        type: {
          type: 'string',
          description: "The type of graph to generate ('mermaid' or 'netlistsvg').",
        },
      },
      required: ['code', 'type'],
    }
  }
];

export const streamChat = async (
  model: string,
  onChunk?: (chunk: string) => void
) => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        functions,
        function_call: 'auto',
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log('Raw chunk:', chunk);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          console.log('Parsed data:', data);
          if (data.message?.content) {
            const content = data.message.content;
            console.log('Content chunk:', content);
            if (onChunk && typeof onChunk === 'function') {
              onChunk(content);
            }
            if (data.message.type === 'documentation') {
              fullContent += `§§markdown§§${content}§§/markdown§§`;
            } else {
              fullContent += content;
            }
          }
        } catch (e) {
          console.error('Error parsing line:', e, line);
        }
      }
    }

    return fullContent;
  } catch (error) {
    console.error('Error in streamChat:', error);
    throw error;
  }
};

export const handleFunctionCall = async (name: string, args: string) => {
  const parsedArgs = JSON.parse(args);

  switch (name) {
    case 'generateMarkdown':
      // Process markdown generation
      return `§§markdown§§${await generateMarkdown(parsedArgs.content)}§§/markdown§§`;

    case 'generateGraph':
      // Process graph generation
      const graphTypeFlag = parsedArgs.type === 'mermaid' ? 'mermaid' : 'netlistsvg';
      return `§§${graphTypeFlag}§§${await generateGraph(parsedArgs.code, parsedArgs.type)}§§/${graphTypeFlag}§§`;

    default:
      throw new Error(`Unknown function: ${name}`);
  }
};

// Example implementations
const generateMarkdown = async (content: string): Promise<string> => {
  // Your logic to generate or modify markdown content
  return `<div class="_border _border-blue-500 _rounded-md _p-2 _bg-gray-700">${content}</div>`;
};

const generateGraph = async (code: string, type: string): Promise<string> => {
  // Your logic to generate the graph
  if (type === 'mermaid') {
    // Generate Mermaid graph
    try {
      const svg = await mermaid.render('graph-' + Math.random(), code);
      return svg;
    } catch (e) {
      console.error('Mermaid rendering error:', e);
      return `Error generating Mermaid graph: ${e.message}`;
    }
  } else if (type === 'netlistsvg') {
    // Generate Netlistsvg graph
    try {
      const svg = await renderNetlistSvg(code);
      return svg;
    } catch (e) {
      console.error('Netlist rendering error:', e);
      return `Error generating Netlistsvg graph: ${e.message}`;
    }
  } else {
    throw new Error(`Unsupported graph type: ${type}`);
  }
};


const messages: ChatMessage[] = [
  {
    role: 'system',
    content: `You are an intelligent assistant tasked with generating content that includes both documentation and non-documentation parts. It is crucial that you adhere to the following guidelines when formatting your output:

1. **Documentation Sections**:
   - Wrap documentation content with \`§§markdown§§\` at the beginning and \`§§/markdown§§\` at the end. This ensures that the content is styled as markdown in the chat output.

2. **Graph Visualizations**:
   - For graph content, use \`§§mermaid§§\` or \`§§netlistsvg§§\` at the beginning and \`§§/mermaid§§\` or \`§§/netlistsvg§§\` at the end, depending on the graph type.

3. **Non-Documentation Text**:
   - Any text that introduces, transitions, or concludes the message should not be wrapped with special symbols. This text will appear as regular text in the chat output.

**Example of Complex Output**:
When generating content that includes both documentation and non-documentation parts, ensure only the documentation is wrapped:

\`\`\`
Here is the introduction to the documentation:
§§markdown§§
### Documentation Section

This section provides detailed information about the API usage.
§§/markdown§§

Now, let's move on to the next topic.
\`\`\`

This ensures that the content is processed correctly and only the documentation parts are styled in the chat output.`
  },
  // User messages will be appended here
];
