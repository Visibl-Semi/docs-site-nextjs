import { useState, useCallback, useEffect, useRef, type ReactElement } from 'react'
import cn from 'clsx'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatPopupProps {
  onClose: () => void
}

export function AIChatPopup({ onClose }: AIChatPopupProps): ReactElement {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Try both focus and select immediately
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
    
    // Try again after a short delay to ensure it works
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // TODO: Replace with your actual AI integration
    // This is just a mock response
    const aiMessage: Message = {
      role: 'assistant',
      content: 'This is a mock AI response. Implement your AI integration here.'
    }
    setMessages(prev => [...prev, aiMessage])
  }, [input])

  return (
    <div className="_fixed _inset-0 _z-50 _flex _items-center _justify-center _bg-black/50">
      <div className="_w-full _max-w-2xl _h-[600px] _bg-white dark:_bg-gray-900 _rounded-lg _shadow-xl _flex _flex-col">
        {/* Header */}
        <div className="_p-4 _border-b dark:_border-gray-800 _flex _justify-between _items-center">
          <h2 className="_text-lg _font-semibold">AI Chat Assistant</h2>
          <button
            onClick={onClose}
            className="_p-2 _hover:_bg-gray-100 dark:_hover:_bg-gray-800 _rounded"
          >
            ×
          </button>
        </div>

        {/* Chat Messages */}
        <div className="_flex-1 _overflow-y-auto _p-4 _space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                '_p-3 _rounded-lg _max-w-[80%]',
                message.role === 'user'
                  ? '_bg-blue-100 dark:_bg-blue-900 _ml-auto'
                  : '_bg-gray-100 dark:_bg-gray-800'
              )}
            >
              {message.content}
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="_p-4 _border-t dark:_border-gray-800">
          <div className="_flex _gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="_flex-1 _px-3 _py-2 _border _rounded-lg dark:_bg-gray-800 dark:_border-gray-700"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="_px-4 _py-2 _bg-blue-500 _text-white _rounded-lg _hover:_bg-blue-600"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 