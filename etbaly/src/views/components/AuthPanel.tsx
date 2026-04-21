import { motion } from 'framer-motion';
import { Cpu, Layers, Zap } from 'lucide-react';

const FEATURES = [
  { icon: <Zap size={16} />,    text: 'AI-powered 3D model generation'   },
  { icon: <Layers size={16} />, text: 'Live 3D preview before you print'  },
  { icon: <Cpu size={16} />,    text: '6 premium materials to choose from'},
];

/** Decorative left panel shown on desktop auth pages */
export default function AuthPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-deep via-[#0d2151] to-[#050d1a] relative overflow-hidden">
      {/* Circuit grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
      </div>

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
            <rect x="6" y="1" width="8" height="11" rx="2" fill="#3b82f6" opacity="0.9" />
            <polygon points="6,12 14,12 12,19 8,19" fill="#00d4ff" opacity="0.7" />
            <circle cx="10" cy="20.5" r="1.5" fill="#3b82f6" />
          </svg>
          <span className="font-orbitron text-xl font-black text-white tracking-widest">ETBALY</span>
        </div>
        <p className="text-blue-300/70 text-xs font-exo">Print the future. Today.</p>
      </div>

      {/* Animated nozzle */}
      <motion.div
        className="relative z-10 flex justify-center"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="160" height="200" viewBox="0 0 160 200" fill="none" aria-hidden="true">
          <rect x="55" y="10" width="50" height="90" rx="10" fill="#3b82f6" opacity="0.15" />
          <rect x="55" y="10" width="50" height="90" rx="10" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
          <rect x="63" y="80" width="34" height="20" rx="3" fill="#3b82f6" opacity="0.3" />
          <polygon points="63,100 97,100 90,145 70,145" fill="#00d4ff" opacity="0.2" />
          <polygon points="63,100 97,100 90,145 70,145" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
          <rect x="74" y="145" width="12" height="6" rx="2" fill="#00d4ff" opacity="0.7" />
          <motion.line
            x1="80" y1="151" x2="80" y2="185"
            stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round"
            animate={{ y2: [185, 168, 185] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="80" cy="151" r="4"
            fill="#00d4ff"
            animate={{ opacity: [0.4, 1, 0.4], r: [3, 6, 3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>

      {/* Feature list */}
      <div className="relative z-10 space-y-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.text}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.15, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              {f.icon}
            </div>
            <span className="text-sm text-blue-100/80 font-exo">{f.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
