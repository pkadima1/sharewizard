
import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleTheme}
        className="p-2 rounded-full bg-background hover:bg-muted transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' && <Sun size={20} className="text-amber-500" />}
        {theme === 'dark' && <Moon size={20} className="text-indigo-400" />}
        {theme === 'system' && <Laptop size={20} className="text-foreground" />}
      </button>
    </div>
  );
};

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-full transition-colors ${
          theme === 'light' ? 'bg-muted' : 'hover:bg-muted'
        }`}
        aria-label="Light theme"
      >
        <Sun size={20} className={theme === 'light' ? 'text-amber-500' : 'text-muted-foreground'} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-full transition-colors ${
          theme === 'dark' ? 'bg-muted' : 'hover:bg-muted'
        }`}
        aria-label="Dark theme"
      >
        <Moon size={20} className={theme === 'dark' ? 'text-indigo-400' : 'text-muted-foreground'} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-full transition-colors ${
          theme === 'system' ? 'bg-muted' : 'hover:bg-muted'
        }`}
        aria-label="System theme"
      >
        <Laptop size={20} className={theme === 'system' ? 'text-foreground' : 'text-muted-foreground'} />
      </button>
    </div>
  );
};

export default ThemeToggle;
