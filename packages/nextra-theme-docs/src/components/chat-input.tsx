import React, { useState, useRef } from 'react';
import { MentionPopup } from './mention-popup';

interface Mention {
  start: number;
  end: number;
  text: string;
}

const ChatInput = () => {
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionFilter, setMentionFilter] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [mentions, setMentions] = useState<Mention[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height (capped at ~10 lines)
      const maxHeight = 24 * 10; // Assuming 24px per line
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      
      textarea.style.height = `${newHeight}px`;
      
      // Sync scroll position between textarea and display div
      const displayDiv = textarea.nextElementSibling as HTMLDivElement;
      if (displayDiv) {
        displayDiv.scrollTop = textarea.scrollTop;
      }
    }
  };

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const displayDiv = textarea.nextElementSibling as HTMLDivElement;
    if (displayDiv) {
      displayDiv.scrollTop = textarea.scrollTop;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setCursorPosition(event.target.selectionEnd || 0);
    adjustTextareaHeight();
    
    if (value.slice(-1) === '@') {
      const input = inputRef.current;
      if (input) {
        // Get input element's position
        const inputRect = input.getBoundingClientRect();
        const cursorPosition = input.selectionEnd || 0;
        
        // Calculate approximate cursor position based on character width
        const textWidth = getTextWidth(value.substring(0, cursorPosition), getComputedStyle(input).font);
        
        // Set popup position relative to cursor position
        setMentionPosition({
          top: inputRect.height + 5, // Position below input with small gap
          left: Math.min(textWidth, inputRect.width - 384) // 384px is popup width
        });
        
        setShowMentionPopup(true);
        setMentionFilter('');
      }
    } else {
      checkForMentionTrigger(value);
    }
  };

  // Helper function to calculate text width
  const getTextWidth = (text: string, font: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font;
      return context.measureText(text).width;
    }
    return 0;
  };

  const checkForMentionTrigger = (value: string) => {
    const input = inputRef.current;
    if (!input) return;
    
    const cursorPosition = input.selectionEnd || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setShowMentionPopup(false);
      return;
    }

    const textAfterLastAt = textBeforeCursor.slice(lastAtIndex + 1);
    if (textAfterLastAt.includes(' ')) {
      setShowMentionPopup(false);
      return;
    }

    // Calculate position based on cursor position
    const inputRect = input.getBoundingClientRect();
    const textWidth = getTextWidth(textBeforeCursor, getComputedStyle(input).font);
    
    setMentionPosition({
      top: inputRect.height + 5,
      left: Math.min(textWidth, inputRect.width - 384)
    });
    
    setMentionFilter(textAfterLastAt);
  };

  const handleMentionSelect = (mention: string) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.slice(0, lastAtIndex) + mention + ' ';
    setInputValue(newValue);
    setMentions([...mentions, {
      start: lastAtIndex,
      end: lastAtIndex + mention.length,
      text: mention
    }]);
    setShowMentionPopup(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(event.currentTarget.selectionStart || 0);
    
    // Handle mention deletion
    if (event.key === 'Backspace') {
      const cursorPos = event.currentTarget.selectionStart || 0;
      const mention = mentions.find(m => m.end === cursorPos);
      
      if (mention) {
        event.preventDefault();
        const newValue = inputValue.slice(0, mention.start) + inputValue.slice(mention.end);
        setInputValue(newValue);
        setMentions(mentions.filter(m => m !== mention));
        setCursorPosition(mention.start);
      }
    }
    
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      const cursorPosition = event.currentTarget.selectionStart || 0;
      const newValue = 
        inputValue.slice(0, cursorPosition) + '\n' + 
        inputValue.slice(cursorPosition);
      setInputValue(newValue);
      // Adjust height after adding new line
      setTimeout(adjustTextareaHeight, 0);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    setCursorPosition(textarea.selectionStart || 0);
  };

  const renderStyledText = () => {
    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    mentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {inputValue.slice(lastIndex, mention.start)}
          </span>
        );
      }
      // Add mentioned text with styling
      elements.push(
        <span 
          key={`mention-${index}`}
          className="_bg-blue-500/30 _text-blue-400"
        >
          {mention.text}
        </span>
      );
      lastIndex = mention.end;
    });

    // Add remaining text with cursor
    if (lastIndex < inputValue.length) {
      const remainingText = inputValue.slice(lastIndex);
      const cursorOffset = cursorPosition - lastIndex;
      
      if (cursorOffset >= 0 && cursorOffset <= remainingText.length) {
        elements.push(
          <span key="text-end">
            {remainingText.slice(0, cursorOffset)}
            <span className="_inline-block _w-[2px] _h-[1.2em] _bg-gray-400 _animate-blink _align-middle" />
            {remainingText.slice(cursorOffset)}
          </span>
        );
      } else {
        elements.push(
          <span key="text-end">{remainingText}</span>
        );
      }
    } else if (cursorPosition === inputValue.length) {
      // Add cursor at the end if needed
      elements.push(
        <span key="cursor" className="_inline-block _w-[2px] _h-[1.2em] _bg-gray-400 _animate-blink _align-middle" />
      );
    }

    return elements;
  };

  return (
    <div className="_container _px-4 _relative">
      <div className="_rounded-md _p-3 _border _border-white/10">
        <div className="_header _mb-2">
        
        </div>

        <div className="_input-section _flex _items-center">
          <div
            className="_flex-1 _bg-transparent _text-gray-200 focus:_outline-none _min-h-[24px] _max-h-[240px] _relative"
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onClick={handleClick}
              className="_absolute _inset-0 _opacity-0 _w-full _h-full _resize-none _overflow-y-auto _scrollbar-thin"
              placeholder="Ask anything (⌘L), ↑ to select"
              rows={1}
              style={{ maxHeight: '240px' }}
            />
            <div 
              className="_whitespace-pre-wrap _overflow-y-auto _scrollbar-thin" 
              style={{ maxHeight: '240px', minHeight: '24px' }}
            >
              {inputValue ? renderStyledText() : (
                <span className="_text-gray-400">Ask anything (⌘L), ↑ to select</span>
              )}
            </div>
          </div>
        </div>

        <MentionPopup
          isVisible={showMentionPopup}
          position={mentionPosition}
          onSelect={handleMentionSelect}
          searchTerm={mentionFilter}
        />

        <div className="_buttons-section _flex _justify-between _items-center _mt-3">
          <select className="_border-none _bg-transparent _text-gray-400 _text-xs">
            <option>claude-3.5-sonnet</option>
            <option>gpt-4</option>
            <option>code-davinci</option>
          </select>
          
          <div className="_flex _gap-2">
            <button className="_chat-btn _flex _items-center _px-2 _py-1 _text-gray-400 _rounded-md _text-xs">
              <span className="_flex _items-center _gap-1">
                <span className="_opacity-70">↵</span>
                <span>chat</span>
              </span>
            </button>
            <button className="_codebase-btn _flex _items-center _px-2 _py-1 _text-gray-400 _rounded-md _text-xs">
              <span className="_flex _items-center _gap-1">
                <span className="">⌘↵</span>
                <span>code</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 

export default ChatInput;