import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Zap, Layers, Users, Palette,
  Cpu, Package, Bot, UploadCloud, CheckCircle2,
  Boxes, Wrench, Gem, Building2, Star,
  Shield, Clock, Globe, ChevronRight,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const COLLECTIONS = [
  { label: 'Home Decor',        icon: <Boxes size={28} />,     grad: 'from-blue-500/20 to-cyan-500/10',     desc: 'Functional & beautiful pieces for your space'   },
  { label: 'Mechanical Parts',  icon: <Wrench size={28} />,    grad: 'from-orange-500/20 to-yellow-500/10', desc: 'Precision-engineered components & assemblies'    },
  { label: 'Art & Sculptures',  icon: <Gem size={28} />,       grad: 'from-purple-500/20 to-pink-500/10',   desc: 'Unique artistic creations & collectibles'        },
  { label: 'Architecture',      icon: <Building2 size={28} />, grad: 'from-green-500/20 to-teal-500/10',    desc: 'Scale models & structural design prototypes'     },
];

const STEPS = [
  { icon: <Bot size={30} />,     step: '01', title: 'Describe to AI',  desc: 'Chat with our AI — type a description or upload a reference image.'   },
  { icon: <Layers size={30} />,  step: '02', title: 'Preview in 3D',   desc: 'See a live 3D model instantly. Confirm it or refine your description.' },
  { icon: <Package size={30} />, step: '03', title: 'Print & Deliver', desc: 'Choose your material, place the order, and receive it at your door.'   },
];

const STATS = [
  { value: '10,000+', label: 'Models Available',  icon: <Layers size={22} />       },
  { value: '5,000+',  label: 'Happy Customers',   icon: <Users size={22} />        },
  { value: '6',       label: 'Materials',          icon: <Palette size={22} />      },
  { value: '99.8%',   label: 'Print Success Rate', icon: <CheckCircle2 size={22} /> },
];

const FEATURES = [
  { icon: <Cpu size={20} />,         title: 'AI-Powered Design',  desc: 'Generate custom 3D models from text or images in seconds.'   },
  { icon: <Shield size={20} />,      title: 'Quality Guaranteed', desc: 'Every print is quality-checked before shipping.'             },
  { icon: <Clock size={20} />,       title: 'Fast Turnaround',    desc: '3–5 business days from order to delivery.'                   },
  { icon: <Globe size={20} />,       title: 'Worldwide Shipping', desc: 'We ship to 50+ countries with real-time tracking.'           },
  { icon: <UploadCloud size={20} />, title: 'Upload Your Own',    desc: 'Already have an STL or OBJ? Upload and print directly.'      },
  { icon: <Star size={20} />,        title: 'Community Rated',    desc: 'Browse thousands of community-reviewed designs.'             },
];

const TESTIMONIALS = [
  { name: 'Ahmed K.', role: 'Product Designer', text: 'The AI chatbot generated exactly what I had in mind. Incredible experience.', rating: 5 },
  { name: 'Sara M.',  role: 'Architect',         text: 'Scale models for my presentations have never been this easy to produce.',      rating: 5 },
  { name: 'Omar T.',  role: 'Hobbyist',          text: 'Uploaded my own STL and had it printed in PLA within 4 days. Flawless.',       rating: 5 },
];

function NozzleSVG() {
  return (
    <svg width="220" height="280" viewBox="0 0 220 280" fill="none" aria-hidden="true">
      <rect x="75" y="15" width="70" height="110" rx="12" fill="var(--color-primary)" opacity="0.12" />
      <rect x="75" y="15" width="70" height="110" rx="12" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.4" />
      <rect x="85" y="105" width="50" height="25" rx="4" fill="var(--color-primary)" opacity="0.25" />
      <polygon points="85,130 135,130 122,185 98,185" fill="var(--color-accent)" opacity="0.2" />
      <polygon points="85,130 135,130 122,185 98,185" stroke="var(--color-accent)" strokeWidth="1" opacity="0.45" />
      <rect x="103" y="185" width="14" height="7" rx="3" fill="var(--color-accent)" opacity="0.65" />
      <motion.line x1="110" y1="192" x2="110" y2="255" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round"
        animate={{ y2: [255, 235, 255] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.circle cx="110" cy="192" r="4" fill="var(--color-accent)"
        animate={{ opacity: [0.4, 1, 0.4], r: [3, 6, 3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  );
}


export default function LandingPage() {
  return (
    <PageWrapper>
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center bg-circuit overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[var(--color-bg)] to-transparent pointer-events-none" />
        <motion.div className="absolute right-[8%] top-1/2 -translate-y-1/2 hidden xl:block opacity-80"
          animate={{ y: [0, -16, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <NozzleSVG />
        </motion.div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 glass border border-primary/40 text-primary text-xs font-orbitron tracking-widest rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              NEXT-GEN 3D PRINTING PLATFORM
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="font-orbitron text-5xl md:text-7xl font-black text-text leading-tight tracking-tight mb-6">
            Print the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Future.</span>
            <br /><span className="text-text/70">Today.</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-text-muted font-exo text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe your idea, let our AI generate a 3D model, customize it, and have it printed and delivered — all in one platform.
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/products">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-orbitron font-semibold rounded-xl hover:shadow-glow transition-all">
                Browse Collections <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/chat">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-2 px-8 py-3.5 glass border border-primary/50 text-primary font-orbitron font-semibold rounded-xl hover:shadow-glow hover:border-primary transition-all">
                <Zap size={18} /> Try AI Designer
              </motion.button>
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="mt-8 text-xs text-text-muted font-exo flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-400" /> No account needed to browse</span>
            <span className="w-px h-3 bg-border hidden sm:block" />
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-400" /> Free shipping over $100</span>
          </motion.p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border bg-surface-2 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="flex flex-col items-center gap-2 text-center">
                <span className="text-primary">{s.icon}</span>
                <span className="font-orbitron text-3xl font-black text-text">{s.value}</span>
                <span className="text-text-muted text-xs font-exo tracking-wide">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Collections ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-xs font-orbitron text-primary tracking-widest">EXPLORE</span>
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-text mt-2 mb-3">Featured Collections</h2>
            <p className="text-text-muted font-exo max-w-xl mx-auto">Explore our curated categories of precision 3D printed products</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COLLECTIONS.map((col) => (
              <motion.div key={col.label} variants={fadeUp}>
                <Link to="/products">
                  <motion.div whileHover={{ y: -6 }}
                    className="relative glass border border-border rounded-2xl p-7 text-center cursor-pointer group overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${col.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4 group-hover:shadow-glow-sm transition-all">
                        {col.icon}
                      </div>
                      <h3 className="font-orbitron text-sm font-semibold text-text mb-2 group-hover:text-primary transition-colors">{col.label}</h3>
                      <p className="text-xs text-text-muted font-exo leading-relaxed">{col.desc}</p>
                      <div className="mt-4 flex items-center justify-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-exo">
                        Browse <ChevronRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 bg-surface-2 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-xs font-orbitron text-primary tracking-widest">PROCESS</span>
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-text mt-2 mb-3">How It Works</h2>
            <p className="text-text-muted font-exo max-w-xl mx-auto">From idea to physical object in three simple steps</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div key={step.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl glass border border-primary/30 flex items-center justify-center text-primary">{step.icon}</div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-white font-orbitron text-xs font-bold flex items-center justify-center shadow-glow-sm">{step.step}</span>
                </div>
                <h3 className="font-orbitron text-base font-semibold text-text">{step.title}</h3>
                <p className="text-text-muted text-sm font-exo leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-14">
            <Link to="/chat">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-orbitron font-semibold rounded-xl hover:shadow-glow transition-all">
                <Zap size={18} /> Start Designing Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-xs font-orbitron text-primary tracking-widest">WHY ETBALY</span>
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-text mt-2 mb-3">Everything You Need</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -4 }}
                className="glass border border-border rounded-2xl p-6 group hover:border-primary/40 hover:shadow-glow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 group-hover:shadow-glow-sm transition-all">{f.icon}</div>
                <h3 className="font-orbitron text-sm font-semibold text-text mb-2">{f.title}</h3>
                <p className="text-xs text-text-muted font-exo leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4 bg-surface-2 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <span className="text-xs font-orbitron text-primary tracking-widest">COMMUNITY</span>
            <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-text mt-2 mb-3">What Makers Say</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={fadeUp} whileHover={{ y: -4 }}
                className="glass border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-glow-sm transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-text font-exo leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-orbitron text-sm font-bold text-primary">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-text font-exo">{t.name}</p>
                    <p className="text-xs text-text-muted font-exo">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative glass border border-primary/30 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative z-10">
              <span className="text-xs font-orbitron text-primary tracking-widest">GET STARTED</span>
              <h2 className="font-orbitron text-3xl md:text-5xl font-black text-text mt-3 mb-4 leading-tight">
                Ready to print<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">your ideas?</span>
              </h2>
              <p className="text-text-muted font-exo mb-8 max-w-lg mx-auto">Join thousands of makers already using Etbaly to bring their 3D designs to life.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="px-8 py-3.5 bg-primary text-white font-orbitron font-semibold rounded-xl hover:shadow-glow transition-all">
                    Create Free Account
                  </motion.button>
                </Link>
                <Link to="/products">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-8 py-3.5 glass border border-border text-text-muted font-orbitron font-semibold rounded-xl hover:text-primary hover:border-primary transition-all">
                    Browse First <ChevronRight size={16} />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
}
