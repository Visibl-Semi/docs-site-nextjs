export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

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
      }),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Parse the chunk and extract the content
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(Boolean);
      
      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.message?.content) {
          onChunk(data.message.content);
        }
      }
    }
  } catch (error) {
    console.error('Error in streamChat:', error);
    throw error;
  }
}