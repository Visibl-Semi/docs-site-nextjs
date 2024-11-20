import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { 
  File, 
  Folder, 
  Code, 
  Globe, 
  Book, 
  Database,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  hasSubmenu: boolean;
  submenuItems?: string[];
}

interface MentionPopupProps {
  isVisible: boolean;
  position: { top: number; left: number };
  onSelect: (mention: string) => void;
  searchTerm?: string;
}

// New interfaces for structured data
interface FileItem {
  name: string;
  path: string;
}

interface CodeSnippet {
  title: string;
  language: string;
  code: string;
}

interface DocItem {
  title: string;
  path: string;
}

// Sample data structure
const MENTION_DATA = {
  files: [
    { name: 'package.json', path: '/package.json' },
    { name: 'tsconfig.json', path: '/tsconfig.json' },
    { name: 'next.config.js', path: '/next.config.js' },
    { name: 'README.md', path: '/docs/README.md' },
  ] as FileItem[],
  
  folders: [
    { name: 'components', path: '/components' },
    { name: 'pages', path: '/pages' },
    { name: 'styles', path: '/styles' },
    { name: 'public', path: '/public' },
  ] as FileItem[],
  
  code: [
    { 
      title: 'React Component',
      language: 'tsx',
      code: 'export function Component() { return <div>Hello</div> }',
    },
    { 
      title: 'API Route',
      language: 'ts',
      code: 'export default function handler(req, res) { res.status(200).json({}) }',
    },
  ] as CodeSnippet[],
  
  docs: [
    { title: 'Getting Started', path: '/docs/getting-started.md' },
    { title: 'API Reference', path: '/docs/api-reference.md' },
    { title: 'Components', path: '/docs/components.md' },
  ] as DocItem[],
};

export function MentionPopup({ isVisible, position, onSelect, searchTerm = '' }: MentionPopupProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Move menuItems declaration before the useEffect
  const menuItems: MenuItem[] = [
    { 
      icon: <File className="_w-4 _h-4" />, 
      label: 'Files',
      hasSubmenu: true,
      submenuItems: MENTION_DATA.files.map(f => (
        `${f.name} <span class="text-zinc-500">→ ${f.path}</span>`
      ))
    },
    { 
      icon: <Folder className="_w-4 _h-4" />, 
      label: 'Folders',
      hasSubmenu: true,
      submenuItems: MENTION_DATA.folders.map(f => (
        `${f.name} <span class="text-zinc-500">→ ${f.path}</span>`
      ))
    },
    { 
      icon: <Code className="_w-4 _h-4" />, 
      label: 'Code',
      hasSubmenu: true,
      submenuItems: MENTION_DATA.code.map(c => `${c.title} (${c.language})`)
    },
    { 
      icon: <Book className="_w-4 _h-4" />, 
      label: 'Docs',
      hasSubmenu: true,
      submenuItems: MENTION_DATA.docs.map(d => (
        `${d.title} <span class="text-zinc-500">→ ${d.path}</span>`
      ))
    },
    { 
      icon: <Globe className="_w-4 _h-4" />, 
      label: 'Web',
      hasSubmenu: false
    },
    { 
      icon: <Database className="_w-4 _h-4" />, 
      label: 'CodeBase',
      hasSubmenu: false
    },
  ];

  useEffect(() => {
    if (isVisible) {
      if (!searchTerm) {
        setActiveSubmenu(null);
        setHighlightedIndex(0);
      }
    }
  }, [isVisible, searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (activeSubmenu) {
            const activeItem = menuItems.find(item => item.label === activeSubmenu);
            const submenuItems = activeItem?.submenuItems || [];
            if (submenuItems[highlightedIndex]) {
              const plainName = submenuItems[highlightedIndex].split(' <')[0].split(' (')[0];
              onSelect(`@${plainName}`);
            }
          } else {
            const filteredItems = getFilteredMenuItems();
            const item = filteredItems[highlightedIndex];
            if (item.hasSubmenu) {
              setActiveSubmenu(item.label);
              setHighlightedIndex(0);
            } else {
              onSelect(`@${item.label.toLowerCase()}`);
            }
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => {
            const items = activeSubmenu 
              ? getFilteredSubmenuItems(menuItems.find(item => item.label === activeSubmenu)?.submenuItems)
              : getFilteredMenuItems();
            return prev > 0 ? prev - 1 : items.length - 1;
          });
          break;

        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => {
            const items = activeSubmenu 
              ? getFilteredSubmenuItems(menuItems.find(item => item.label === activeSubmenu)?.submenuItems)
              : getFilteredMenuItems();
            return prev < items.length - 1 ? prev + 1 : 0;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, activeSubmenu, highlightedIndex, onSelect, menuItems]);

  const getFilteredSubmenuItems = (items?: string[]) => {
    if (!items) return [];
    return items.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredMenuItems = () => {
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.submenuItems?.some(subItem => 
        subItem.toLowerCase().includes(searchTerm.toLowerCase())
      ) ?? false)
    );
  };

  const popupStyles = {
    top: position.top,
    left: position.left,
    height: '16rem',
    maxWidth: '384px',
    position: 'absolute' as const,
    transform: 'none',
  };

  if (!isVisible) return null;

  if (activeSubmenu) {
    const activeItem = menuItems.find(item => item.label === activeSubmenu);
    const items = activeItem?.submenuItems || [];
    const filteredItems = searchTerm.includes('/') 
      ? getFilteredSubmenuItems(items)
      : items;

    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="absolute _z-[9999] _bg-popover _border _rounded-lg _shadow-lg _p-2 _w-96"
        style={popupStyles}
      >
        <div className="_flex _items-center _gap-2 _mb-2 _px-2">
          <span className="_font-normal">{activeSubmenu}</span>
        </div>
        <div className="_flex _flex-col _gap-1 _overflow-y-auto" style={{ height: 'calc(100% - 2.5rem)' }}>
          {filteredItems.map((item, index) => (
            <button
              key={item}
              variant="ghost"
              className={`_flex _items-center _justify-start _w-full ${
                index === highlightedIndex ? '_bg-accent' : ''
              }`}
              onClick={() => {
                const plainName = item.split(' <')[0].split(' (')[0];
                onSelect(`@${plainName}`);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute _z-[9999] _bg-popover _border _rounded-lg _p-2 _shadow-lg _w-96"
      style={popupStyles}
    >
      <div className="_flex _flex-col _gap-1 _overflow-y-auto _h-full">
        {getFilteredMenuItems().map((item, index) => (
          <button
            key={item.label}
            variant="ghost"
            className={`_flex _items-center _justify-between _w-full ${
              index === highlightedIndex ? '_bg-accent' : ''
            }`}
            onClick={() => item.hasSubmenu 
              ? setActiveSubmenu(item.label)
              : onSelect(`@${item.label.toLowerCase()}`)
            }
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            <div className="_flex _items-center _gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.hasSubmenu && <ChevronRight className="_w-4 _h-4" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
} 