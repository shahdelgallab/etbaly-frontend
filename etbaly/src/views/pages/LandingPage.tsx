import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Layers, Package, Bot, UploadCloud } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import { useFadeInView } from '../../hooks/useFadeInView';

const TICKER_WORDS = [
  '3D PRINTING',
  'CUSTOM MODELS',
  'AI DESIGN',
  'PRECISION',
  'INNOVATION',
  'ETBALY',
];

const STEPS = [
  { num: '01', title: 'DESCRIBE TO AI',  desc: 'Chat with our AI — type a description or upload a reference image.',   icon: <Bot size={32} /> },
  { num: '02', title: 'PREVIEW IN 3D',   desc: 'See a live 3D model instantly. Confirm it or refine your description.', icon: <Layers size={32} /> },
  { num: '03', title: 'PRINT & DELIVER', desc: 'Choose your material, place the order, and receive it at your door.',   icon: <Package size={32} /> },
];

const STATS = [
  { value: '500+', label: 'MODELS' },
  { value: '99%', label: 'PRECISION' },
  { value: '6', label: 'MATERIALS' },
  { value: '24/7', label: 'SUPPORT' },
];

export default function LandingPage() {
  const heroRef = useFadeInView();
  const aboutRef = useFadeInView();
  const stepsRef = useFadeInView();
  const aiRef = useFadeInView();
  const statsRef = useFadeInView();
  const ctaRef = useFadeInView();

  return (
    <PageWrapper className="overflow-hidden">
      
      {/* ═══ HERO SECTION (100vh) ═══ */}
      <section 
        ref={heroRef.ref as React.RefObject<HTMLElement>}
        className="gradient-bg blob-coral-tr blob-teal-bl relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={heroRef.isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Massive Bebas Neue heading */}
          <h1 className="font-display text-hero leading-none mb-6">
            <span className="block text-text">PRINT THE</span>
            <span className="block text-outline">FUTURE</span>
          </h1>

          <p className="text-text-muted text-lg md:text-xl max-w-lg mx-auto mb-12 font-body">
            AI-powered 3D printing platform. Design, customize, and order physical objects — all from your browser.
          </p>

          {/* Two sharp buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/products" className="cursor-hover">
              <button className="btn-primary flex items-center gap-2">
                EXPLORE MODELS <ArrowRight size={18} />
              </button>
            </Link>
            <Link to="/chat" className="cursor-hover">
              <button className="btn-secondary flex items-center gap-2">
                <Zap size={18} /> TRY AI DESIGNER
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Scrolling ticker tape at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border py-6 bg-bg/50 backdrop-blur-sm overflow-hidden">
          <div className="ticker">
            <div className="ticker-content">
              {[...TICKER_WORDS, ...TICKER_WORDS].map((word, i) => (
                <span key={i} className="font-display text-4xl text-text-dim">
                  {word}
                </span>
              ))}
            </div>
            <div className="ticker-content" aria-hidden="true">
              {[...TICKER_WORDS, ...TICKER_WORDS].map((word, i) => (
                <span key={i} className="font-display text-4xl text-text-dim">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT/INTRO SECTION (100vh) ═══ */}
      <section 
        ref={aboutRef.ref as React.RefObject<HTMLElement>}
        className="gradient-bg blob-teal-left blob-purple-right relative min-h-screen flex items-center px-6 py-20"
      >
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={aboutRef.isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            {/* Left: Chapter number + heading */}
            <div>
              <div className="chapter-number">01</div>
              <p className="section-label mb-6">/ WHAT WE DO</p>
              <h2 className="font-display text-section text-text leading-none mb-8">
                WHERE IDEAS<br />BECOME OBJECTS
              </h2>
            </div>

            {/* Right: Body text */}
            <div className="space-y-6 text-text-muted font-body text-lg leading-relaxed">
              <p>
                Etbaly is an AI-powered 3D printing platform that bridges the gap between imagination and reality. Whether you have a complete design file or just a rough idea, we handle the entire process.
              </p>
              <p>
                Our AI chatbot can generate custom 3D models from text descriptions or reference images. Preview your design in real-time, choose from 6 premium materials, and have it printed and delivered to your door.
              </p>
              <Link to="/chat" className="cursor-hover inline-block">
                <button className="btn-primary mt-4">
                  START DESIGNING
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS (CARDS) ═══ */}
      <section 
        ref={stepsRef.ref as React.RefObject<HTMLElement>}
        className="relative bg-bg px-6 py-32"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={stepsRef.isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <div className="chapter-number">02</div>
            <p className="section-label mb-6">/ PROCESS</p>
            <h2 className="font-display text-section text-text">
              HOW IT WORKS
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                animate={stepsRef.isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                className="card group cursor-hover"
              >
                <div className="text-primary mb-6">{step.icon}</div>
                <div className="chapter-number text-6xl mb-4">{step.num}</div>
                <h3 className="font-display text-2xl text-text mb-4">{step.title}</h3>
                <p className="text-text-muted font-body leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI FEATURE SECTION ═══ */}
      <section 
        ref={aiRef.ref as React.RefObject<HTMLElement>}
        className="gradient-bg relative min-h-screen flex items-center px-6 py-20"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        }}
      >
        {/* Purple/blue gradient blobs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-accent-2 opacity-10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full bg-accent-3 opacity-10 blur-[120px]" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={aiRef.isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="chapter-number mx-auto">03</div>
            <p className="section-label mb-6">/ TECHNOLOGY</p>
            <h2 className="font-display text-hero text-text leading-none mb-8">
              AI-POWERED<br />DESIGN
            </h2>
            <p className="text-text-muted font-body text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Describe your idea in plain language or upload a reference image. Our AI generates a complete 3D model in seconds. No CAD skills required.
            </p>

            {/* Large visual placeholder */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="aspect-video rounded-lg border border-border bg-surface-2 flex items-center justify-center">
                <div className="text-center">
                  <Bot size={64} className="text-primary mx-auto mb-4" />
                  <p className="text-text-muted font-body">AI Chat Preview</p>
                </div>
              </div>
            </div>

            <Link to="/chat" className="cursor-hover">
              <button className="btn-primary flex items-center gap-2 mx-auto">
                <Zap size={18} /> TRY IT NOW
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS SECTION (GRADIENT BACKGROUND) ═══ */}
      <section 
        ref={statsRef.ref as React.RefObject<HTMLElement>}
        className="relative py-24 px-6"
        style={{
          background: `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--color-primary')} 0%, ${getComputedStyle(document.documentElement).getPropertyValue('--color-accent')} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={statsRef.isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-12"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={statsRef.isVisible ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                className="text-center"
              >
                <div className="font-display text-6xl md:text-7xl text-bg mb-2">
                  {stat.value}
                </div>
                <div className="font-body text-sm tracking-widest text-bg/80">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section 
        ref={ctaRef.ref as React.RefObject<HTMLElement>}
        className="relative bg-bg px-6 py-32"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={ctaRef.isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-hero text-text leading-none mb-8">
              START PRINTING<br />TODAY
            </h2>
            <p className="text-text-muted font-body text-xl mb-12 max-w-2xl mx-auto">
              Join thousands of makers already using Etbaly to bring their 3D designs to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="cursor-hover">
                <button className="btn-primary">
                  CREATE FREE ACCOUNT
                </button>
              </Link>
              <Link to="/upload" className="cursor-hover">
                <button className="btn-secondary flex items-center gap-2">
                  <UploadCloud size={18} /> UPLOAD MODEL
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </PageWrapper>
  );
}
