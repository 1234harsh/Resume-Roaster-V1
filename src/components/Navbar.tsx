import React from 'react';
import { Sun, Moon } from 'lucide-react';

export type NavTab = 'analyze' | 'reports' | 'builder' | 'tips' | 'about';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  reportCount: number;
  onStartRoast: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  reportCount,
  onStartRoast,
}) => {
  const navItems: { id: NavTab; label: string }[] = [
    { id: 'analyze', label: 'Analyze Resume' },
    { id: 'reports', label: reportCount > 0 ? `My Reports (${reportCount})` : 'My Reports' },
    { id: 'builder', label: 'Resume Builder' },
    { id: 'tips', label: 'Tips' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('analyze')}
          className="text-lg font-bold tracking-tight font-display text-neutral-950 dark:text-white whitespace-nowrap cursor-pointer"
        >
          Resume Roaster
        </button>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-orange-600 text-neutral-950 dark:text-white font-semibold'
                    : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onStartRoast}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Roast My Resume
          </button>
        </div>
      </div>
    </header>
  );
};
