import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  floating?: boolean;
}

export default function ThemeToggle({ floating = false }: Props) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={
        floating
          ? [
              'cursor-hover fixed bottom-6 right-6 z-50',
              'w-12 h-12 sharp-corners',
              'flex items-center justify-center',
              'bg-surface border border-border',
              'text-text-muted hover:text-primary hover:border-primary transition-all',
            ].join(' ')
          : [
              'cursor-hover w-10 h-10 sharp-corners',
              'border border-border',
              'flex items-center justify-center',
              'text-text-muted hover:text-primary hover:border-primary',
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
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Sun size={floating ? 18 : 16} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <Moon size={floating ? 18 : 16} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
