import React, { useEffect, useRef, useState } from 'react'
import { streamChat, type ChatMessage } from '../../lib/ollama-client'
import styles from './chat-output.module.css'

interface ChatOutputProps {
  messages: ChatMessage[]
  selectedModel: string
  setIsWaiting?: (waiting: boolean) => void
}

export const ChatOutput: React.FC<ChatOutputProps> = ({ messages, selectedModel, setIsWaiting }) => {
  const [streamedContent, setStreamedContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingDots, setLoadingDots] = useState('...')
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setIsStreaming(true)
      setStreamedContent('')
      
      streamChat(
        selectedModel,
        messages,
        (chunk) => {
          setStreamedContent(prev => prev + chunk)
        }
      )
      .then(() => {
        setIsStreaming(false)
        setIsWaiting?.(false)
      })
      .catch((error) => {
        console.error('Chat streaming error:', error)
        setIsStreaming(false)
        setIsWaiting?.(false)
      })
    }
  }, [messages, selectedModel, setIsWaiting])

  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(() => {
      setLoadingDots(dots => dots.length >= 3 ? '.' : dots + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isStreaming])

  useEffect(() => {
    // Scroll to bottom when new content arrives
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [streamedContent])

  return (
    <div 
      ref={outputRef}
      className="_chat-output _mt-2 _overflow-y-auto _max-h-[50vh]"
    >
      {messages
        .filter(message => message.role !== 'user' && message.role !== 'assistant')
        .map((message, index) => (
          <div key={index} className="_mb-4 _text-gray-200">
            <div className="_whitespace-pre-wrap">{message.content}</div>
          </div>
      ))}
      
      {isStreaming && streamedContent === '' ? (
        <div className="_text-gray-200 _px-2">
          <div className="_mb-1 _flex _items-center _gap-2">
            <span>{loadingDots}</span>
          </div>
        </div>
      ) : (
        <div className="_text-gray-200 _px-2">
          <div className="_whitespace-pre-wrap">
            {streamedContent}
            {isStreaming && <span className="_inline-block _w-2 _h-4 _bg-gray-400 _animate-blink" />}
          </div>
        </div>
      )}
    </div>
  )
}