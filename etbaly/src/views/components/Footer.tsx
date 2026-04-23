import { Link } from 'react-router-dom';
import { Mail, MapPin, ExternalLink } from 'lucide-react';

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 23.2 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#333]" style={{ background: '#1a1a1a' }}>
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-4" aria-label="Etbaly home">
              <span className="text-xl font-bold font-display text-white">Etbaly</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#c9b99a' }}>
              Print the future. Today.<br />
              Your one-stop platform for custom 3D printing — powered by AI.
            </p>
            <div className="flex gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                  style={{ background: '#2a2a2a', border: '1px solid #333', color: '#c9b99a' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c9b99a')}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider mb-4 uppercase font-sans" style={{ color: '#fff' }}>
              Navigate
            </h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm font-sans transition-colors" style={{ color: '#c9b99a' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#c9b99a')}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Materials */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider mb-4 uppercase font-sans" style={{ color: '#fff' }}>
              Materials
            </h3>
            <ul className="space-y-2.5">
              {MATERIALS.map((m) => (
                <li key={m} className="text-sm font-sans" style={{ color: '#c9b99a' }}>{m}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider mb-4 uppercase font-sans" style={{ color: '#fff' }}>
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm font-sans" style={{ color: '#c9b99a' }}>
                <Mail size={14} className="text-primary shrink-0 mt-0.5" />
                <a href="mailto:hello@etbaly.io" className="transition-colors hover:text-white">
                  hello@etbaly.io
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm font-sans" style={{ color: '#c9b99a' }}>
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <span>Cairo, Egypt</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm font-sans" style={{ color: '#c9b99a' }}>
                <ExternalLink size={14} className="text-primary shrink-0 mt-0.5" />
                <a href="#" className="transition-colors hover:text-white">Documentation</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid #333' }}>
          <p className="text-xs font-sans" style={{ color: '#c9b99a' }}>
            © {new Date().getFullYear()} Etbaly. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
            <span className="text-xs font-sans" style={{ color: '#c9b99a' }}>All systems operational</span>
          </div>
          <div className="flex gap-4">
            {['Privacy Policy', 'Terms of Service'].map((t) => (
              <a key={t} href="#" className="text-xs font-sans transition-colors hover:text-white" style={{ color: '#c9b99a' }}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
