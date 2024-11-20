import { StreamingTextResponse } from 'ai';
import { customModel } from '@/lib/ai';

export async function POST(req: Request) {
  const { messages, modelId } = await req.json();
  
  const model = customModel(modelId);
  const response = await model.invoke(messages);
  
  return new StreamingTextResponse(response);
} 