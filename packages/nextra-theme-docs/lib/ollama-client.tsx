export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Define the available functions
const functions = [
  {
    name: 'generateMarkdown',
    description: 'Generate formatted markdown content.',
    parameters: {
      content: 'string'
    }
  },
  {
    name: 'generateGraph',
    description: 'Generate a graph visualization.',
    parameters: {
      code: 'string',
      type: 'string'
    }
  }
];

export const streamChat = async (
  model: string,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
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

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    let partial = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      console.log('Received chunk:', chunk);
      partial += chunk;

      onChunk(chunk);

      const lines = partial.split('\n');
      partial = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const data = JSON.parse(line);
          if (data.choices) {
            for (const choice of data.choices) {
              if (choice.delta?.content) {
                onChunk(choice.delta.content);
              } else if (choice.delta?.function_call) {
                const { name, arguments: args } = choice.delta.function_call;
                const functionResult = await handleFunctionCall(name, args);
                onChunk(`#FUNC_START#${JSON.stringify({ name, result: functionResult })}#FUNC_END#`);
                messages.push({
                  role: 'assistant',
                  content: '',
                  function_call: { name, arguments: args },
                });
                messages.push({ role: 'function', name, content: functionResult });
                await streamChat(model, messages, onChunk);
                return;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing line:', e, line);
        }
      }
    }
  } catch (error) {
    console.error('Error in streamChat:', error);
    throw error;
  }
}

export const handleFunctionCall = async (name: string, args: string) => {
  const parsedArgs = JSON.parse(args);

  switch (name) {
    case 'generateMarkdown':
      // Process markdown generation
      return await generateMarkdown(parsedArgs.content);

    case 'generateGraph':
      // Process graph generation
      return await generateGraph(parsedArgs.code, parsedArgs.type);

    default:
      throw new Error(`Unknown function: ${name}`);
  }
};

// Example implementations
const generateMarkdown = async (content: string): Promise<string> => {
  // Your logic to generate or modify markdown content
  return `Processed Markdown Content:\n${content}`;
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
    content: `You are an assistant that can generate and modify markdown content and create graph visualizations using the functions provided.

Available functions:

1. **generateMarkdown**:
   - **Description**: Generate formatted markdown content.
   - **Parameters**:
     - \`content\` (string): The markdown content to generate or modify.

2. **generateGraph**:
   - **Description**: Generate a graph visualization.
   - **Parameters**:
     - \`code\` (string): The graph code or description.
     - \`type\` (string): The type of graph to generate ('mermaid' or 'netlistsvg').

When you need to use a function, respond by providing a function call in the following format:

\`\`\`json
{
  "function_call": {
    "name": "function_name",
    "arguments": {
      "argument1": "value1",
      "argument2": "value2"
    }
  }
}
\`\`\`

Only include the function call in your response when necessary, and do not include any extra text outside of the JSON object.`,
  },
  // User messages will be appended here
];