import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, Mail, MapPin, ExternalLink } from 'lucide-react';

// ─── Inline SVG social icons (lucide-react 1.7 dropped brand icons) ──────────

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/',         label: 'Home'        },
  { to: '/products', label: 'Collections' },
  { to: '/chat',     label: 'AI Chatbot'  },
  { to: '/upload',   label: 'Upload'      },
  { to: '/profile',  label: 'Profile'     },
];

const MATERIALS = ['PLA', 'ABS', 'PETG', 'Resin', 'TPU', 'Nylon'];

const SOCIAL = [
  { icon: <GithubIcon />,   href: 'https://github.com',    label: 'GitHub'   },
  { icon: <TwitterXIcon />, href: 'https://x.com',         label: 'X / Twitter' },
  { icon: <LinkedinIcon />, href: 'https://linkedin.com',  label: 'LinkedIn' },
];

// ─── Blueprint grid background ────────────────────────────────────────────────

function BlueprintGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="footer-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-primary)" strokeWidth="0.4" opacity="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#footer-grid)" />
      </svg>
      {/* Fade-out gradient so grid doesn't bleed into content above */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface-2)] via-transparent to-transparent" />
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border bg-surface-2 overflow-hidden">
      <BlueprintGrid />

      <div className="relative max-w-7xl mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 text-primary mb-4 group" aria-label="Etbaly home">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                <Printer size={22} />
              </motion.div>
              <span className="font-orbitron text-xl font-black tracking-widest">ETBALY</span>
            </Link>

            <p className="text-text-muted text-sm font-exo leading-relaxed mb-5">
              Print the future. Today.<br />
              Your one-stop platform for custom 3D printing — powered by AI.
            </p>

            {/* Social icons */}
            <div className="flex gap-2">
              {SOCIAL.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 glass border border-border rounded-full flex items-center justify-center text-text-muted hover:text-primary hover:border-primary hover:shadow-glow-sm transition-colors"
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h3 className="font-orbitron text-xs font-semibold text-text tracking-widest mb-5 uppercase">
              Navigate
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors font-exo"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary rounded-full transition-all duration-200 overflow-hidden" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Materials */}
          <div>
            <h3 className="font-orbitron text-xs font-semibold text-text tracking-widest mb-5 uppercase">
              Materials
            </h3>
            <ul className="space-y-2.5">
              {MATERIALS.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                  <span className="text-sm text-text-muted font-exo">{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-orbitron text-xs font-semibold text-text tracking-widest mb-5 uppercase">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-text-muted font-exo">
                <Mail size={15} className="text-primary shrink-0 mt-0.5" />
                <a href="mailto:hello@etbaly.io" className="hover:text-primary transition-colors">
                  hello@etbaly.io
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-text-muted font-exo">
                <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                <span>Cairo, Egypt</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-text-muted font-exo">
                <ExternalLink size={15} className="text-primary shrink-0 mt-0.5" />
                <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted font-exo">
            © {new Date().getFullYear()} Etbaly. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs text-text-muted font-exo">All systems operational</span>
          </div>
          <div className="flex gap-4">
            {['Privacy Policy', 'Terms of Service'].map((t) => (
              <a key={t} href="#" className="text-xs text-text-muted hover:text-primary transition-colors font-exo">
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
