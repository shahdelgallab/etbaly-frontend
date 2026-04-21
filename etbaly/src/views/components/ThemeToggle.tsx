import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  /** Renders as a fixed floating button in the bottom-right corner */
  floating?: boolean;
}

export default function ThemeToggle({ floating = false }: Props) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={
        floating
          ? [
              'fixed bottom-6 right-6 z-50',
              'w-12 h-12 rounded-full',
              'flex items-center justify-center',
              isDark
                ? 'bg-primary text-white shadow-glow animate-pulse-glow'
                : 'bg-accent-3 text-white shadow-glow animate-pulse-glow',
            ].join(' ')
          : [
              'w-9 h-9 rounded-full',
              'glass border border-border',
              'flex items-center justify-center',
              'text-primary',
              'hover:shadow-glow-sm hover:border-primary',
              'transition-all duration-200',
            ].join(' ')
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            <Sun size={floating ? 20 : 16} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            <Moon size={floating ? 20 : 16} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
