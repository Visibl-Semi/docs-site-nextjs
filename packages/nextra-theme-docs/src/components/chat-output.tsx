import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { streamChat, type ChatMessage } from '../../lib/ollama-client'
import styles from './chat-output.module.css'
import { processFunctionCall } from '../../lib/functions'

interface ChatOutputProps {
  messages: ChatMessage[]
  selectedModel: string
  setIsWaiting?: (waiting: boolean) => void
}

interface FunctionCallDisplay {
  name: string;
  status: 'processing' | 'complete';
  result?: any;
}

export const ChatOutput: React.FC<ChatOutputProps> = ({ messages, selectedModel, setIsWaiting }) => {
  const [streamedContent, setStreamedContent] = useState('')
  const [functionCalls, setFunctionCalls] = useState<FunctionCallDisplay[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingDots, setLoadingDots] = useState('...')
  const outputRef = useRef<HTMLDivElement>(null)
  const [functionCallBuffer, setFunctionCallBuffer] = useState('')

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setIsStreaming(true)
      setStreamedContent('')
      setFunctionCalls([])
      setFunctionCallBuffer('')
      
      streamChat(
        selectedModel,
        messages,
        (chunk: string) => {
          console.log('Received chunk in chat-output:', chunk);
          
          let content = '';
          try {
            const parsedChunk = JSON.parse(chunk);
            content = parsedChunk.message?.content || '';
            setStreamedContent(prev => prev + content);
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
          
          // Combine with any buffered data
          let combinedContent = functionCallBuffer + content;
          let updatedFunctionCallBuffer = '';

          // Extract and process function calls
          const regex = /#FUNC_START#([\s\S]*?)#FUNC_END#/g;
          let match;
          while ((match = regex.exec(combinedContent)) !== null) {
            const functionCallText = match[1];
            combinedContent = combinedContent.replace(match[0], '');

            try {
              const functionCall = JSON.parse(functionCallText);
              setFunctionCalls(prev => [...prev, {
                name: functionCall.name,
                status: 'processing'
              }]);
              
              processFunctionCall(functionCall).then(result => {
                setFunctionCalls(prev => {
                  const index = prev.findIndex(fc => fc.name === functionCall.name && fc.status === 'processing');
                  if (index !== -1) {
                    return [
                      ...prev.slice(0, index),
                      { ...prev[index], status: 'complete', result },
                      ...prev.slice(index + 1)
                    ];
                  }
                  return prev;
                });
              });
            } catch (e) {
              console.error('Error parsing function call:', e);
            }
          }

          // Update functionCallBuffer with any remaining partial data
          const lastMatchEnd = regex.lastIndex;
          if (lastMatchEnd < combinedContent.length) {
            updatedFunctionCallBuffer = combinedContent.slice(lastMatchEnd);
          } else {
            updatedFunctionCallBuffer = '';
          }
          setFunctionCallBuffer(updatedFunctionCallBuffer);
        },
        (error) => {
          console.error('Error in streamChat:', error);
        }
      )
      .then(() => {
        setIsStreaming(false);
        setIsWaiting?.(false);
      })
      .catch((error) => {
        console.error('Chat streaming error:', error);
        setIsStreaming(false);
        setIsWaiting?.(false);
      });
    }
  }, [messages, selectedModel, setIsWaiting]);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setLoadingDots(dots => dots.length >= 3 ? '.' : dots + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    // Scroll to bottom when new content arrives
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamedContent, functionCalls]);

  // Render content with markdown support
  const renderContent = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          code({ inline, className, children, ...props }: ReactMarkdownProps) {
            const match = /language-(\w+)/.exec(className || '');
            const hasMermaid = match?.[1] === 'mermaid';
            const hasNetlistsvg = match?.[1] === 'netlistsvg';

            if (hasMermaid || hasNetlistsvg) {
              return (
                <div
                  dangerouslySetInnerHTML={{
                    __html: (children ?? '').toString()
                  }}
                  className={hasMermaid ? 'mermaid' : 'netlistsvg'}
                />
              );
            }

            return inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <pre className={className}>
                <code {...props}>{children}</code>
              </pre>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  // Add function to render function call boxes
  const renderFunctionCall = (functionCall: FunctionCallDisplay) => {
    return (
      <div className="_border _border-gray-600 _rounded-md _p-4 _my-2 _bg-gray-800">
        <div className="_text-sm _text-gray-400 _mb-2">
          Function: {functionCall.name} 
          {functionCall.status === 'processing' && ' (Processing...)'}
        </div>
        {functionCall.status === 'complete' && functionCall.result && (
          <div className="_mt-2">
            {functionCall.result.type === 'markdown' ? (
              renderContent(functionCall.result.content)
            ) : (
              <div 
                className={functionCall.result.graphType}
                dangerouslySetInnerHTML={{ __html: functionCall.result.content }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={outputRef}
      className="_chat-output _mt-2 _overflow-y-auto _max-h-[50vh]"
    >
      {/* Show streaming content */}
      <div className="_text-gray-200 _px-2">
        {isStreaming ? (
          <div className="_whitespace-pre-wrap">
            {streamedContent && renderContent(streamedContent)}
            {functionCalls.map((call, idx) => (
              <React.Fragment key={idx}>
                {renderFunctionCall(call)}
              </React.Fragment>
            ))}
            <span className="_inline-block _w-2 _h-4 _bg-gray-400 _animate-blink" />
          </div>
        ) : (
          <div className="_whitespace-pre-wrap">
            {streamedContent && renderContent(streamedContent)}
          </div>
        )}
      </div>
    </div>
  );
}