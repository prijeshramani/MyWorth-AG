import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/useUiStore';
import {
  Search,
  LayoutDashboard,
  Bot,
  PieChart,
  Wallet,
  FileText,
  ShieldCheck,
  Building2,
  Users,
  Settings,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'AI Assistant' | 'Actions';
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setActiveTab } = useUiStore();

  const commands: CommandItem[] = [
    {
      id: 'dash',
      title: 'Go to AI Mission Control',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-[#4F7FFF]" />,
      shortcut: 'G D',
      action: () => { setActiveTab('dashboard'); onClose(); }
    },
    {
      id: 'advisor',
      title: 'Ask AI Wealth Advisor',
      category: 'AI Assistant',
      icon: <Bot className="w-4 h-4 text-[#8B5CF6]" />,
      shortcut: 'G A',
      action: () => { setActiveTab('ai-advisor'); onClose(); }
    },
    {
      id: 'portfolio',
      title: 'View Portfolio & Investments',
      category: 'Navigation',
      icon: <PieChart className="w-4 h-4 text-[#32D583]" />,
      shortcut: 'G P',
      action: () => { setActiveTab('portfolio'); onClose(); }
    },
    {
      id: 'accounts',
      title: 'View Accounts & Institutions',
      category: 'Navigation',
      icon: <Wallet className="w-4 h-4 text-[#F79009]" />,
      shortcut: 'G C',
      action: () => { setActiveTab('accounts'); onClose(); }
    },
    {
      id: 'tax',
      title: 'Tax Optimization Center',
      category: 'Navigation',
      icon: <FileText className="w-4 h-4 text-[#38BDF8]" />,
      shortcut: 'G T',
      action: () => { setActiveTab('tax'); onClose(); }
    },
    {
      id: 'estate',
      title: 'Estate Planning & Knowledge Graph',
      category: 'Navigation',
      icon: <Building2 className="w-4 h-4 text-[#F04438]" />,
      shortcut: 'G E',
      action: () => { setActiveTab('estate'); onClose(); }
    },
    {
      id: 'family',
      title: 'Family Members & Entities',
      category: 'Navigation',
      icon: <Users className="w-4 h-4 text-[#E879F9]" />,
      action: () => { setActiveTab('family'); onClose(); }
    },
    {
      id: 'protection',
      title: 'Protection & Insurance Gaps',
      category: 'Navigation',
      icon: <ShieldCheck className="w-4 h-4 text-[#32D583]" />,
      action: () => { setActiveTab('protection'); onClose(); }
    },
    {
      id: 'settings',
      title: 'Platform & Settings',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4 text-[#9CA3AF]" />,
      action: () => { setActiveTab('settings'); onClose(); }
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        } else if (query.trim()) {
          setActiveTab('ai-advisor');
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, query, onClose, setActiveTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-white dark:bg-[#15161A] border border-slate-200 dark:border-[#2B2E35] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Search Header */}
          <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-[#2B2E35] bg-slate-50/50 dark:bg-transparent">
            <Search className="w-5 h-5 text-slate-400 dark:text-[#9CA3AF] mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or ask AI wealth advisor..."
              className="w-full bg-transparent text-sm text-slate-900 dark:text-[#F3F4F6] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:text-[#6B7280] dark:hover:text-[#F3F4F6] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Command List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-[#4F7FFF]/15 dark:text-[#4F7FFF] dark:border-[#4F7FFF]/30'
                        : 'text-slate-700 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-[#1E2025] hover:text-slate-900 dark:hover:text-[#F3F4F6]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {cmd.icon}
                      <span>{cmd.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cmd.shortcut && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-[#2B2E35] text-slate-600 dark:text-[#9CA3AF] rounded border border-slate-200 dark:border-slate-700/50 font-bold">
                          {cmd.shortcut}
                        </span>
                      )}
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-[#4F7FFF]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div
                onClick={() => {
                  if (query.trim()) {
                    setActiveTab('ai-advisor');
                    onClose();
                  }
                }}
                className="p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1E2025] rounded-xl transition"
              >
                <div className="inline-flex items-center justify-center p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F3F4F6]">
                  Ask AI Advisor: "{query}"
                </p>
                <p className="text-xs text-slate-500 dark:text-[#6B7280] mt-1">
                  Press Enter to execute AI query with contextual financial context
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-[#2B2E35] bg-slate-50 dark:bg-[#0B0B0C] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#6B7280]">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-[#1E2025] rounded text-slate-700 dark:text-[#9CA3AF] font-bold border border-slate-300/60 dark:border-slate-700">↑↓</kbd>
              <span>Navigate</span>
              <kbd className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-[#1E2025] rounded text-slate-700 dark:text-[#9CA3AF] font-bold border border-slate-300/60 dark:border-slate-700">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-[#1E2025] rounded text-slate-700 dark:text-[#9CA3AF] font-bold border border-slate-300/60 dark:border-slate-700">ESC</kbd>
              <span>Close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
