import React, { useState, useRef } from 'react';
import { MentionPopup } from './mention-popup';

const ChatInput = () => {
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionFilter, setMentionFilter] = useState('');
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    
    if (value.endsWith('@')) {
      const input = inputRef.current;
      if (input) {
        const rect = input.getBoundingClientRect();
        const charWidth = 8;
        const cursorPosition = input.selectionStart || 0;
        const leftOffset = Math.min((cursorPosition * charWidth), rect.width - 384);
        
        setMentionPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + leftOffset
        });
        
        setShowMentionPopup(true);
        setMentionFilter('');
      }
    } else {
      checkForMentionTrigger(value);
    }
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

    setShowMentionPopup(true);
    setMentionFilter(textAfterLastAt);
  };

  const handleMentionSelect = (mention: string) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.slice(0, lastAtIndex) + mention + ' ';
    setInputValue(newValue);
    setShowMentionPopup(false);
    inputRef.current?.focus();
  };

  return (
    <div className="_container _px-4">
      <div className="_rounded-md _p-3 _border _border-white/10">
        <div className="_header _mb-2">
        
        </div>

        <div className="_input-section _flex _items-center ">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInput}
            className="_flex-1 _bg-transparent _text-gray-200 focus:_outline-none"
            placeholder="Ask anything (⌘L), ↑ to select"
          />
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