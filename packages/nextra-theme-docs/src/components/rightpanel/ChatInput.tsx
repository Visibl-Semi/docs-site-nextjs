import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Plus, RefreshCw, Copy, X, Image, Command, CornerDownLeft, ChevronDown, ChevronUp, Pin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MentionDropdown from './MentionDropdown';
import { getAllFiles } from '@/utils/fileUtils';
import { Editor } from '@monaco-editor/react';
import { useBlockPreview } from '@/context/BlockPreviewContext';

const modelOptions = [
  { id: 'gpt-4o', name: 'gpt-4o' },
  { id: 'cursor-small', name: 'cursor-small' },
  { id: 'gpt-3.5', name: 'gpt-3.5' },
  { id: 'claude-3.5-sonnet', name: 'claude-3.5-sonnet' },
  { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
];

const searchBehaviors = [
  { id: 'embeddings', name: 'embeddings' },
  { id: 'reranker', name: 'reranker' },
];

const mentionOptions = [
  { id: 'files', name: 'Files' },
  { id: 'folders', name: 'Folders' },
  { id: 'code', name: 'Code' },
  { id: 'web', name: 'Web' },
  { id: 'docs', name: 'Docs' },
  { id: 'git', name: 'Git' },
  { id: 'codebase', name: 'Codebase' },
];

const ChatInput = () => {
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [selectedSearchBehavior, setSelectedSearchBehavior] = useState(searchBehaviors[0]);
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const [mentionedFiles, setMentionedFiles] = useState<any[]>([]);
  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [codePreviews, setCodePreviews] = useState<any[]>([]);
  const { blockPreviews, addBlockPreview, removeBlockPreview } = useBlockPreview();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch all files when the component mounts
    const fetchFiles = async () => {
      const files = await getAllFiles();
      setAllFiles(files);
    };
    fetchFiles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatInputRef.current &&
        !chatInputRef.current.contains(event.target as Node)
      ) {
        setMentionVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [chatInputRef]);

  // Handle Command + L to add selected SVG as context
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        // Add the selected SVG as context
        const selectedSvgContent = getSelectedSvgContent(); // Implement this function to get the selected SVG content
        if (selectedSvgContent) {
          addBlockPreview(selectedSvgContent);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addBlockPreview]);

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          setPastedImages((prevImages) => [...prevImages, e.target?.result as string]);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setPastedImages((prevImages) => [...prevImages, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setPastedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const mentionStart = value.lastIndexOf('@');
    const mentionEnd = value.indexOf(' ', mentionStart);

    if (mentionStart !== -1 && (mentionEnd === -1 || mentionEnd > mentionStart)) {
      setMentionVisible(true);
      setMentionQuery(value.substring(mentionStart + 1, mentionEnd === -1 ? value.length : mentionEnd));
    } else {
      setMentionVisible(false);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (option: { id: string; name: string }) => {
    const value = inputRef.current?.value || '';
    const mentionStart = value.lastIndexOf('@');
    const newValue = value.substring(0, mentionStart + 1) + option.name + ' ';
    if (inputRef.current) {
      inputRef.current.value = newValue;
      inputRef.current.focus();
    }
    setMentionVisible(false);
    setMentionQuery('');

    // Add the selected file to mentionedFiles
    const selectedFile = allFiles.find(file => file.name === option.name);
    if (selectedFile) {
      setMentionedFiles([...mentionedFiles, selectedFile]);
      addCodePreview(selectedFile);
    }
  };

  const addCodePreview = (file) => {
    setCodePreviews([...codePreviews, file]);
  };

  const removeCodePreview = (index: number) => {
    setCodePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
  };

  const toggleCodePreviewHeight = (index: number) => {
    setCodePreviews((prevPreviews) =>
      prevPreviews.map((preview, i) =>
        i === index ? { ...preview, expanded: !preview.expanded } : preview
      )
    );
  };

  const handleMentionClick = () => {
    if (inputRef.current) {
      inputRef.current.value += '@';
      inputRef.current.focus();
      setMentionVisible(true);
      setMentionQuery('');
    }
  };

  return (
    <div ref={chatInputRef}>
      <div className="flex items-center justify-between p-2 rounded-t-md mb-2">
        <span className="text-zinc-400 dark:text-zinc-500 text-xs">CHAT</span>
        <div className="flex space-x-2">
          <Plus className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer" />
          <RefreshCw className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer" />
          <Copy className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer" />
          <X className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer" />
        </div>
      </div>
      <div className="relative flex flex-col bg-white dark:bg-charcoal-800 border border-zinc-200 dark:border-charcoal-600 rounded-md">
        <div className="relative flex flex-col items-center mb-8">
          {pastedImages.map((image, index) => (
            <div key={index} className="m-2 border border-charcoal-600 rounded-md relative mb-2 group">
              {/* Adjust rendering based on image type */}
              {image.startsWith('data:image/svg+xml') ? (
                <div
                  className="max-w-full h-auto rounded-md"
                  dangerouslySetInnerHTML={{ __html: atob(image.split(',')[1]) }}
                />
              ) : (
                <img src={image} alt={`pasted-${index}`} className="max-w-full h-auto rounded-md" />
              )}
              <X
                className="absolute top-1 right-1 text-zinc-200 bg-black bg-opacity-50 rounded-sm p-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4"
                onClick={() => removeImage(index)}
              />
            </div>
          ))}
          {codePreviews.map((file, index) => (
            <div key={index} className="relative mb-2 group w-full">
              <div className="flex items-center justify-between mx-2 mt-2 p-2 bg-gray-100 dark:bg-charcoal-900 rounded-t-md border-t border-l border-r border-charcoal-600">
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{file.name}</span>
                  <span className="text-xs text-gray-500">{file.path}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Pin className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer" />
                  <ChevronDown className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer" onClick={() => toggleCodePreviewHeight(index)} />
                  <X
                    className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer"
                    onClick={() => removeCodePreview(index)}
                  />
                </div>
              </div>
              <div className={`mx-2 bg-gray-50 dark:bg-charcoal-700 rounded-b-md border-l border-r border-b border-charcoal-600 ${file.expanded ? 'max-h-80' : 'max-h-60'} overflow-auto`}>
                <Editor
                  height={file.expanded ? "320px" : "180px"}
                  width="100%"
                  theme="custom-dark"
                  language={file.language || 'plaintext'}
                  value={file.content}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                  }}
                  beforeMount={(monaco) => {
                    monaco.editor.defineTheme('custom-dark', {
                      base: 'vs-dark',
                      inherit: true,
                      rules: [],
                      colors: {
                        'editor.background': '#0b0b0b',
                      }
                    });
                    monaco.editor.setTheme('custom-dark');

                    if (!monaco.languages.getLanguages().some(lang => lang.id === 'verilog')) {
                      monaco.languages.register({ id: 'verilog' });
                      monaco.languages.setMonarchTokensProvider('verilog', {
                        keywords: [
                          'module', 'endmodule', 'input', 'output', 'wire', 'reg', 'always', 'begin', 'end'
                        ],
                        tokenizer: {
                          root: [
                            [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
                            [/\/\/.*/, 'comment'],
                            [/"([^"\\]|\\.)*$/, 'string.invalid'],
                            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                          ],
                          string: [
                            [/[^\\"]+/, 'string'],
                            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
                          ],
                        },
                      });
                    }
                  }}
                  className="flex-grow bg-[#0b0b0b]"
                />
                <div className="absolute bottom-2 left-0 right-0 mx-2 flex justify-center bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity group">
                  {file.expanded ? (
                    <ChevronUp className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => toggleCodePreviewHeight(index)} />
                  ) : (
                    <ChevronDown className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => toggleCodePreviewHeight(index)} />
                  )}
                </div>
              </div>
            </div>
          ))}
          {blockPreviews.map((svgContent, index) => (
            <div key={index} className="relative mb-2 group w-full">
              <div className="flex items-center justify-between mx-2 mt-2 p-2 bg-gray-100 dark:bg-charcoal-900 rounded-t-md border-t border-l border-r border-charcoal-600">
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Block Preview</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Pin className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer" />
                  <X
                    className="text-gray-500 dark:text-zinc-500 w-4 h-4 cursor-pointer"
                    onClick={() => removeBlockPreview(index)}
                  />
                </div>
              </div>
              <div className="mx-2 bg-gray-50 dark:bg-charcoal-900 rounded-b-md border-l border-r border-b border-charcoal-600 overflow-auto">
                <div
                  className="max-w-full h-auto rounded-md"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>
            </div>
          ))}
          <Input
            ref={inputRef}
            placeholder="Ask anything (⌘L)"
            className="bg-white dark:bg-charcoal-800 border-none dark:placeholder-zinc-500 text-xs caret-blackdark:caret-white"
            onPaste={handlePaste}
            onChange={handleInputChange}
          />
          {mentionVisible && (
            <MentionDropdown
              mentionOptions={mentionOptions}
              mentionQuery={mentionQuery}
              mentionIndex={mentionIndex}
              handleMentionSelect={handleMentionSelect}
              allFiles={allFiles}
              addCodePreview={addCodePreview}
            />
          )}
        </div>
        <div className="absolute bottom-3 left-0 right-0 flex space-x-2 items-center flex-wrap">
          <div className="absolute right-3 flex space-x-2 items-center">
            <span className="flex items-center text-zinc-400 dark:text-zinc-500 text-xxs cursor-pointer truncate flex-shrink-0">
              <CornerDownLeft className="mr-1 h-3 w-3 text-zinc-400 dark:text-zinc-500" /> chat
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-zinc-400 dark:text-zinc-500 text-xxs cursor-pointer truncate flex-shrink-0">
                <span className="flex items-center">
                  <Command className="mr-1 h-3 w-3" /> 
                  <CornerDownLeft className="mr-1 h-3 w-3 text-zinc-400 dark:text-zinc-500" /> 
                  with codebase
                </span>
                <ChevronDown className="ml-1 h-3 w-3 text-zinc-400 dark:text-zinc-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-auto text-xxs bg-white dark:bg-charcoal-700 border-zinc-400 dark:border-charcoal-500 mr-6">
                <DropdownMenuItem className="hover:bg-transparent focus:bg-transparent">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center text-zinc-400 dark:text-zinc-500 text-xxs cursor-pointer truncate flex-shrink-0">
                      Search behaviour:
                      <ChevronDown className="mx-1 h-3 w-3" />
                      <span>{selectedSearchBehavior.name}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-auto text-xxs bg-white dark:bg-charcoal-700 border-zinc-400 dark:border-charcoal-500">
                      {searchBehaviors.map((option) => (
                        <DropdownMenuItem
                          key={option.id}
                          className="hover:bg-transparent focus:bg-transparent"
                          onSelect={() => setSelectedSearchBehavior(option)}
                        >
                          <span className="text-xxs text-zinc-400 dark:text-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
                            {option.name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center text-zinc-400 dark:text-zinc-500 text-xxs cursor-pointer truncate flex-shrink-0">
              <ChevronDown className="mr-1 h-3 w-3" />
              <span>{selectedModel.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32 text-xxs bg-white dark:bg-charcoal-700 border-zinc-400 dark:border-charcoal-500 text-zinc-400 dark:text-zinc-500">
              {modelOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  className="hover:bg-transparent focus:bg-transparent text-zinc-400 dark:text-zinc-500"
                  onSelect={() => setSelectedModel(option)}
                >
                  <span className="text-xxs hover:text-charcoal-700 dark:hover:text-zinc-300 transition-colors">
                    {option.name}
                  </span>
                </DropdownMenuItem>
              ))}
              <div className="flex px-2 py-1">
                <span className="text-zinc-400 dark:text-zinc-500 text-xxxs text-zinc-400 dark:hover:text-zinc-500 transition-colors">toggle model</span>
                <span className="text-zinc-400 dark:text-zinc-500 text-xxxs">⌘/</span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-zinc-400 dark:text-zinc-500 text-xxs cursor-pointer truncate flex-shrink-0" onClick={handleMentionClick}>@ Mention</span>
          <div className="flex" onClick={() => fileInputRef.current?.click()}>
            <Image className="text-zinc-400 dark:text-zinc-500 w-3 h-3 cursor-pointer mr-1" />
            <span className="text-zinc-400 dark:text-zinc-500 text-xxs cursor-pointer truncate flex-shrink-0">Image</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput;