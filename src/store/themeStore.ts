import { create } from 'zustand';

export type ThemeMode = 'system' | 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode, coordinates?: { x: number; y: number }) => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('sportix-theme') as ThemeMode;
  if (saved === 'system' || saved === 'dark' || saved === 'light') {
    return saved;
  }
  return 'system';
};

const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  
  if (theme === 'light') {
    root.classList.add('light');
  } else if (theme === 'dark') {
    root.classList.remove('light');
  } else {
    // System preference
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemIsDark) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  }
};

export const useThemeStore = create<ThemeState>((set) => {
  // Initialize theme
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  // Listen to system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    const currentTheme = useThemeStore.getState().theme;
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  };

  try {
    mediaQuery.addEventListener('change', handleSystemChange);
  } catch {
    mediaQuery.addListener(handleSystemChange);
  }

  return {
    theme: initialTheme,
    setTheme: (theme, coordinates) => {
      localStorage.setItem('sportix-theme', theme);
      
      const updateTheme = () => {
        applyTheme(theme);
        set({ theme });
      };

      // Check if View Transitions API is supported
      if (document.startViewTransition) {
        const x = coordinates?.x ?? window.innerWidth / 2;
        const y = coordinates?.y ?? window.innerHeight / 2;
        
        document.documentElement.style.setProperty('--click-x', `${x}px`);
        document.documentElement.style.setProperty('--click-y', `${y}px`);
        document.documentElement.classList.add('theme-transitioning');

        const transition = document.startViewTransition(updateTheme);
        transition.finished.then(() => {
          document.documentElement.classList.remove('theme-transitioning');
        });
      } else {
        updateTheme();
      }
    },
  };
});
