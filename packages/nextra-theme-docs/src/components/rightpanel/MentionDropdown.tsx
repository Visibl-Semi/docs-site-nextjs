import React, { useState, useEffect, useRef } from 'react';
import { File, FilePlus, Folder, Code, Globe, Book, GitBranch, Database, ChevronRight, Link } from '@geist-ui/react-icons';
import filesContents from './contextoptions/FileOptions';
import foldersContents from './contextoptions/FolderOptions';
import codeContents from './contextoptions/CodeOptions';
import docsContents from './contextoptions/DocsOptions';
import gitContents from './contextoptions/GitOptions';
import { Input } from "@/components/ui/input"; // Add this import
import { CornerDownLeft } from 'lucide-react';

interface MentionOption {
  id: string;
  name: string;
}

interface MentionDropdownProps {
  mentionOptions: MentionOption[];
  mentionQuery: string;
  mentionIndex: number;
  handleMentionSelect: (option: MentionOption) => void;
  allFiles?: string[]; // Make allFiles optional
  addCodePreview: (file: any) => void; // Add this prop
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({
  mentionOptions,
  mentionQuery,
  mentionIndex,
  handleMentionSelect,
  allFiles = [], // Provide a default value
  addCodePreview, // Destructure the prop
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocPrefix, setNewDocPrefix] = useState(''); // Add this line
  const [newDocEntrypoint, setNewDocEntrypoint] = useState(''); // Add this line
  const popupRef = useRef<HTMLDivElement>(null);

  const filteredOptions = mentionOptions.filter((option) =>
    option.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const filteredFiles = allFiles.filter((file) =>
    file.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const getContents = (id: string) => {
    switch (id) {
      case 'files':
        return filesContents.map(file => file.name); // Return only the names
      case 'folders':
        return foldersContents;
      case 'code':
        return codeContents;
      case 'docs':
        return docsContents;
      case 'git':
        return gitContents;
      default:
        return [];
    }
  };

  const getHeader = (id: string) => {
    switch (id) {
      case 'files':
        return 'Files';
      case 'folders':
        return 'Folders';
      case 'code':
        return 'Code';
      case 'docs':
        return 'Docs';
      case 'git':
        return 'Git';
      default:
        return '';
    }
  };

  const handleOptionClick = (option: MentionOption, event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'click' || (event as React.KeyboardEvent).key === 'Enter') {
      if (['web', 'codebase'].includes(option.id)) { // Combine conditions
        handleMentionSelect(option);
      } else {
        setSelectedOption(option.id);
      }
    }
  };

  const handleSubOptionClick = (content: string, event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'click' || (event as React.KeyboardEvent).key === 'Enter') {
      const selectedFile = filesContents.find(file => file.name === content);
      handleMentionSelect({ id: selectedFile?.path || content, name: content });
      if (selectedFile) {
        addCodePreview(selectedFile); // Add the code preview
        setSelectedOption(null);
      }
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'files':
        return <File size={16} />;
      case 'folders':
        return <Folder size={16} />;
      case 'code':
        return <Code size={16} />;
      case 'web':
        return <Globe size={16} />;
      case 'docs':
        return <Book size={16} />;
      case 'git':
        return <GitBranch size={16} />;
      case 'codebase':
        return <Database size={16} />;
      default:
        return null;
    }
  };

  const handleAddNewDoc = () => {
    setShowPopup(true);
  };

  const handleSaveNewDoc = () => {
    if (newDocName.trim()) {
      docsContents.push(newDocName.trim());
      setNewDocName('');
      setNewDocPrefix(''); // Reset the prefix
      setNewDocEntrypoint(''); // Reset the entrypoint
      setShowPopup(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  return (
    <div className="absolute bg-white dark:bg-charcoal-800 border border-charcoal-600 rounded-md mt-10 mr-8 w-full z-10">
      {selectedOption === null ? (
        <>
          {filteredOptions.map((option, index) => (
            <div
              key={option.id}
              className={`px-4 py-2 text-xs cursor-pointer flex items-center justify-between ${index === mentionIndex ? 'bg-zinc-100 dark:bg-charcoal-800' : ''} hover:bg-zinc-200 dark:hover:bg-charcoal-600`}
              onClick={(e) => handleOptionClick(option, e)}
              onKeyPress={(e) => handleOptionClick(option, e)}
              tabIndex={0}
            >
              <span className="flex items-center">
                {getIcon(option.id)}
                <span className="ml-2">{option.name}</span>
              </span>
              {['files', 'folders', 'code', 'docs', 'git'].includes(option.id) && <ChevronRight size={16} />}
            </div>
          ))}
          {filteredFiles.map((file, index) => (
            <div
              key={file}
              className={`p-2 text-xs cursor-pointer ${index === mentionIndex ? 'bg-gray-100 dark:bg-charcoal-800' : ''} hover:bg-gray-200 dark:hover:bg-charcoal-900`}
              onClick={(e) => handleMentionSelect({ id: file, name: file })}
              onKeyPress={(e) => handleMentionSelect({ id: file, name: file })}
              tabIndex={0}
            >
              {file}
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="px-4 py-2 text-xs">
            {getHeader(selectedOption)}
          </div>
          {getContents(selectedOption).map((content, index) => (
            <div
              key={content}
              className={`p-2 text-xs cursor-pointer ${index === mentionIndex ? 'bg-zinc-100 dark:bg-charcoal-800' : ''} hover:bg-zinc-200 dark:hover:bg-charcoal-600`}
              onClick={(e) => handleSubOptionClick(content, e)}
              onKeyPress={(e) => handleSubOptionClick(content, e)}
              tabIndex={0}
            >
              {content}
            </div>
          ))}
          {selectedOption === 'docs' && (
            <div className="p-2 text-xs cursor-pointer hover:bg-zinc-200 dark:hover:bg-charcoal-600" onClick={handleAddNewDoc}>
              + Add New Doc
            </div>
          )}
        </>
      )}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20">
          <div ref={popupRef} className="bg-white dark:bg-charcoal-900 bg-opacity-60 backdrop-blur-md border border-charcoal-600 text-zinc-100 px-4 py-2 rounded-md shadow-md">
            {newDocName ? (
              <>
                <div className="m-3 flex justify-between">
                  <div className="mr-3">
                    <label className="block text-xxs text-zinc-300 dark:text-zinc-700 mb-2">Document Name</label>
                    <Input
                      type="text"
                      value={newDocName}
                      placeholder="Enter document name, e.g., Pytorch"
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="p-2 border border-gray-300 text-black rounded-md w-full"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="flex items-center block text-xxs text-zinc-300 dark:text-zinc-700 mb-2"> <File className="mr-1" size={12} /> URL Prefix</label>
                    <Input
                      type="text"
                      value={newDocPrefix}
                      placeholder="Enter URL prefix, e.g., https://www.apple.com"
                      onChange={(e) => setNewDocPrefix(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md w-full"
                    />
                  </div>
                </div>
                <div className="ml-3 flex items-center">
                  <div>
                    <label className="flex items-center block text-xxs text-zinc-300 dark:text-zinc-700 mb-2"> <Link className="mr-1" size={12} /> Entrypoint URL</label>
                    <Input
                      type="text"
                      value={newDocEntrypoint || newDocName} // Set entrypoint based on newDocName by default
                      placeholder="Enter entrypoint URL, e.g., https://www.apple.com"
                      onChange={(e) => setNewDocEntrypoint(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-end my-2">
                  <button className="flex items-center px-2 py-1 bg-blue-500 text-white text-sm rounded-sm" onClick={handleSaveNewDoc}>
                    <CornerDownLeft className="mr-2" size={12} /> Confirm
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center bg-charcoal-900 bg-opacity-50 backdrop-blur-md text-zinc-100 rounded-md w-full">
                <Input
                    type="text"
                    placeholder="https://www.chipverify.com/verilog/verilog-data-types"
                    className="px-2 bg-charcoal-600 bg-opacity-50 backdrop-blur-md text-zinc-100 rounded-md w-full border-none focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setNewDocName(e.currentTarget.value);
                      }
                    }}
                  />
                <label className="ml-2 cursor-pointer text-zinc-400 dark:text-zinc-500" >
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const fileName = e.target.files[0].name;
                        setNewDocName(fileName);
                      }
                    }}
                  />
                  <FilePlus className="text-zinc-400" size={16} />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionDropdown;