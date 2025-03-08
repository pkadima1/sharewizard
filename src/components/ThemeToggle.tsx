
import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleToggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleToggleTheme}
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full"
            aria-label="Toggle theme"
          >
            {theme === 'light' && <Sun size={18} className="text-amber-500" />}
            {theme === 'dark' && <Moon size={18} className="text-indigo-400" />}
            {theme === 'system' && (
              <Laptop size={18} className={resolvedTheme === 'dark' ? 'text-indigo-400' : 'text-amber-500'} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Current theme: {theme}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/60">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setTheme('light')}
              variant={theme === 'light' ? 'default' : 'ghost'}
              size="icon"
              className={`w-8 h-8 rounded-md ${theme === 'light' ? 'bg-background shadow-sm' : ''}`}
              aria-label="Light theme"
            >
              <Sun size={16} className={theme === 'light' ? 'text-amber-500' : 'text-muted-foreground'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Light theme</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setTheme('dark')}
              variant={theme === 'dark' ? 'default' : 'ghost'}
              size="icon"
              className={`w-8 h-8 rounded-md ${theme === 'dark' ? 'bg-background shadow-sm' : ''}`}
              aria-label="Dark theme"
            >
              <Moon size={16} className={theme === 'dark' ? 'text-indigo-400' : 'text-muted-foreground'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Dark theme</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setTheme('system')}
              variant={theme === 'system' ? 'default' : 'ghost'}
              size="icon"
              className={`w-8 h-8 rounded-md ${theme === 'system' ? 'bg-background shadow-sm' : ''}`}
              aria-label="System theme"
            >
              <Laptop size={16} className={theme === 'system' ? (resolvedTheme === 'dark' ? 'text-indigo-400' : 'text-amber-500') : 'text-muted-foreground'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">System theme</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ThemeToggle;
