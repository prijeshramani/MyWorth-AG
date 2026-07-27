import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { navItems } from './NavigationDrawer';

export const MobileNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useUiStore();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0e1526] border-t border-slate-800/80 px-2 py-2 flex items-center justify-around z-40">
      {navItems.slice(0, 5).map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span>{item.label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
};
