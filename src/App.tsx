import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart,
  Sun,
  Moon,
  Shield,
  Lock,
  Zap,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Gift,
  Sparkles,
  X,
  Brain,
  ArrowRight,
  Clock,
  Eye,
} from 'lucide-react';
import { trackLead } from './tracking';

const HOTMART_URL = 'https://pay.hotmart.com/B106469520T?checkoutMode=10';

// ─── Video Progress State (shared via localStorage) ─────────────
const STORAGE_KEY = 'vdl_video_progress';

function getStoredProgress(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? parseFloat(v) : 0;
  } catch {
    return 0;
  }
}

function storeProgress(p: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(p));
  } catch {
    // ignore
  }
}

// ─── Shared video progress hook for CTA visibility ───────────────
function useVideoProgress() {
  const [progress, setProgress] = useState(getStoredProgress);

  const updateProgress = useCallback((p: number) => {
    setProgress(prev => {
      const next = Math.max(prev, p);
      storeProgress(next);
      return next;
    });
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setProgress(getStoredProgress());
  }, []);

  return { progress, updateProgress };
}

// ─── Intersection Observer Hook ─────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ─── Sticky Mobile CTA ─────────────────────────────────────────
function StickyCTA({ ctaVisible }: { ctaVisible: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!ctaVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-lg border-t border-primary-100 px-4 py-3 shadow-lg">
        <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead()} className="btn-primary w-full flex">
          <span className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            QUIERO COMENZAR MI EXPERIENCIA
          </span>
        </a>
      </div>
    </div>
  );
}

// ─── SECTION 1 — HERO WITH VSL (ConverteAI SmartPlayer) ──────────────────────────
function Hero({ videoProgress, onProgress }: { videoProgress: number; onProgress: (p: number) => void }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cta1Visible, setCta1Visible] = useState(videoProgress >= 30);
  const [cta2Visible, setCta2Visible] = useState(videoProgress >= 60);
  const [offerVisible, setOfferVisible] = useState(videoProgress >= 90);
  const playerInitialized = useRef(false);

  // Sync CTA visibility from stored progress
  useEffect(() => {
    setCta1Visible(videoProgress >= 30);
    setCta2Visible(videoProgress >= 60);
    setOfferVisible(videoProgress >= 90);
  }, [videoProgress]);

  // Initialize ConverteAI SmartPlayer tracking
  useEffect(() => {
    let attempts = 0;
    let player: SmartPlayerInstance | undefined;
    let handleTimeUpdate: (() => void) | undefined;
    let handleEnded: (() => void) | undefined;

    const timer = window.setInterval(() => {
      attempts += 1;
      player = window.smartplayer?.instances?.[0];

      if (!player?.video || playerInitialized.current) {
        if (attempts >= 40) window.clearInterval(timer);
        return;
      }

      playerInitialized.current = true;
      window.clearInterval(timer);

      handleTimeUpdate = () => {
        if (!player?.video) return;

        const seconds = player.video.currentTime || 0;
        const videoDuration = player.video.duration || 0;
        const percentage = videoDuration > 0 ? (seconds / videoDuration) * 100 : 0;

        setCurrentTime(seconds);
        setDuration(videoDuration);
        onProgress(percentage);
        if (percentage >= 30) setCta1Visible(true);
        if (percentage >= 60) setCta2Visible(true);
        if (percentage >= 90) setOfferVisible(true);
      };

      handleEnded = () => onProgress(100);
      player.on('timeupdate', handleTimeUpdate);
      player.on('ended', handleEnded);
      handleTimeUpdate();
    }, 500);

    return () => {
      window.clearInterval(timer);
      if (player?.off && handleTimeUpdate && handleEnded) {
        player.off('timeupdate', handleTimeUpdate);
        player.off('ended', handleEnded);
        playerInitialized.current = false;
      }
    };
  }, [onProgress]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-25 via-primary-50 to-white" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #E91E63 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl animate-float animate-delay-200" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 md:pb-24">
        {/* Headline block */}
        <div className="text-center mb-10 md:mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary-100 mb-6 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium text-primary-600 font-heading">
              Programa Guiado de 30 Dias
            </span>
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl leading-[1.15] text-dark mb-5 animate-fade-up animate-delay-100">
            Existe una razon por la que algunas personas{' '}
            <span className="gradient-text">atraen el amor</span> con facilidad...
          </h1>

          <p className="text-lg md:text-xl text-muted leading-relaxed mb-2 animate-fade-up animate-delay-200 max-w-2xl mx-auto">
            Mientras otras parecen repetir los mismos ciclos de rechazo, distancia y relaciones frustradas.
          </p>
        </div>

        {/* Info box */}
        <div className="max-w-3xl mx-auto mb-8 animate-fade-up animate-delay-300">
          <div className="bg-gradient-to-br from-primary-50/90 to-white rounded-2xl p-5 md:p-7 border border-primary-100/60 shadow-lg shadow-primary-500/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-dark text-base md:text-lg mb-2">
                  IMPORTANTE
                </h3>
                <p className="text-dark/80 leading-relaxed text-sm md:text-base mb-4">
                  Antes de comenzar tu experiencia de 30 dias, mira esta breve presentacion.
                  En menos de 5 minutos descubriras como funciona el Metodo Vibracion del Amor™
                  y por que miles de mujeres utilizan frecuencias sonoras para elevar su vibracion amorosa.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-dark/70">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary-500" />
                    Duracion: aproximadamente 5 minutos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-primary-500" />
                    Como funciona el metodo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-primary-500" />
                    Como utilizar las frecuencias correctamente
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    Que esperar durante los proximos 30 dias
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video player */}
        <div className="max-w-4xl mx-auto animate-fade-up animate-delay-400">
          {/* Floating labels */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary-100 text-xs font-heading font-semibold text-dark">
              <Eye className="w-3.5 h-3.5 text-primary-500" />
              Presentacion Exclusiva
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary-100 text-xs font-heading font-semibold text-dark">
              <Clock className="w-3.5 h-3.5 text-primary-500" />
              5 Minutos
            </span>
          </div>

          {/* Video container */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/10 bg-dark">
            {/* Glow ring */}
            <div className="absolute -inset-1 bg-gradient-to-br from-primary-300/30 via-primary-500/20 to-primary-300/30 rounded-2xl md:rounded-3xl blur-md -z-10" />

            {/* Vturb SmartPlayer (4:3 aspect ratio) */}
            <vturb-smartplayer
              id="vid-6a44756079ce81d83fc3a246"
              style={{ display: 'block', margin: '0 auto', width: '100%' }}
            />
          </div>

          {/* Progress bar below video */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-muted font-medium tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-muted font-medium tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* CTA 1 — fades in at 30% */}
          <div
            className={`mt-8 transition-all duration-700 ${
              cta1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead()} className="btn-primary text-lg px-10 py-5 w-full sm:w-auto inline-flex justify-center">
              <span className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                QUIERO COMENZAR MI EXPERIENCIA
              </span>
            </a>
          </div>

          {/* CTA 2 — fades in at 60% */}
          <div
            className={`mt-4 transition-all duration-700 ${
              cta2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead()} className="inline-flex items-center gap-2 text-primary-500 font-heading font-semibold hover:text-primary-700 transition-colors text-base">
              <ArrowRight className="w-4 h-4" />
              Si, quiero acceder ahora por solo US$15,90
            </a>
          </div>

          {/* Offer card — revealed at 90% */}
          <div
            className={`mt-8 transition-all duration-700 ${
              offerVisible ? 'opacity-100 translate-y-0 max-h-[500px]' : 'opacity-0 translate-y-4 max-h-0 pointer-events-none overflow-hidden'
            }`}
          >
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-primary-200/60 shadow-xl shadow-primary-500/10">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className="text-muted text-sm">Oferta especial — Solo hoy</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted line-through text-xl font-heading">US$67</span>
                    <span className="text-primary-500 font-heading font-extrabold text-3xl">US$15,90</span>
                    <span className="bg-primary-100 text-primary-600 text-xs font-heading font-bold px-2 py-0.5 rounded-full">
                      -75%
                    </span>
                  </div>
                </div>
                <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead()} className="btn-primary px-6 py-3 inline-flex">
                  <span className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4" />
                    ACCEDER AHORA
                  </span>
                </a>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-primary-500" /> Pago Seguro</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-primary-500" /> Acceso Inmediato</span>
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-primary-500" /> Garantia 7 Dias</span>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 text-center animate-fade-up animate-delay-500">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted">
              Mas de <strong className="text-dark">5.000 mujeres</strong> ya han iniciado esta experiencia
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 2 — PROBLEM ────────────────────────────────────────
function Problem() {
  const ref = useReveal();
  const painPoints = [
    { icon: Brain, text: 'Ansiedad constante', desc: 'Esa sensacion de nerviosismo que no te permite disfrutar el presente' },
    { icon: X, text: 'Miedo al rechazo', desc: 'El temor que te bloquea y te impide mostrarte tal como eres' },
    { icon: Heart, text: 'Relaciones que no avanzan', desc: 'Patrones repetitivos que te llevan a las mismas situaciones' },
    { icon: ArrowRight, text: 'Distancia emocional', desc: 'Sientes que las personas no se conectan contigo de verdad' },
    { icon: Shield, text: 'Falta de reciprocidad', desc: 'Das todo y recibes muy poco a cambio en tus relaciones' },
  ];

  return (
    <section className="section-padding bg-white relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Pain points */}
          <div>
            <p className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase mb-3">
              Te identificas?
            </p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-dark mb-4 leading-tight">
              Cuando tu vibracion amorosa esta baja, todo se siente{' '}
              <span className="gradient-text">cuesta arriba</span>
            </h2>
            <p className="text-muted text-lg mb-8 max-w-lg">
              Si alguna de estas situaciones te resulta familiar, no estas sola. Millones de mujeres experimentan estos patrones sin saber que existe una forma de transformarlos.
            </p>
            <div className="space-y-4">
              {painPoints.map((point, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-primary-50/50 transition-colors duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                    <point.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-dark text-base">{point.text}</p>
                    <p className="text-muted text-sm mt-0.5">{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Emotional illustration */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Abstract emotional visual */}
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary-50 via-rose-25 to-primary-100/50 p-8 flex items-center justify-center relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-8 right-8 w-24 h-24 rounded-full border-2 border-primary-200/50" />
                <div className="absolute bottom-12 left-8 w-16 h-16 rounded-full border border-primary-300/40" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary-100/50" />

                {/* Central heart with waves */}
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/20">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  {/* Frequency waves */}
                  <div className="flex items-end justify-center gap-1 h-12 mb-4">
                    {[6, 12, 18, 24, 18, 12, 6, 12, 18, 24, 18, 12].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-primary-300"
                        style={{ height: `${h * 1.5}px`, opacity: 0.5 + (i * 0.04) }}
                      />
                    ))}
                  </div>
                  <p className="text-primary-600 font-heading font-semibold text-sm">
                    Tu frecuencia amorosa
                  </p>
                  <p className="text-primary-400 text-xs mt-1">
                    Cuando esta alineada, todo fluye
                  </p>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-4 bg-primary-100/20 rounded-[2rem] blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 3 — HOW IT WORKS ───────────────────────────────────
function HowItWorks() {
  const ref = useReveal();
  const steps = [
    {
      icon: Sun,
      emoji: '☀️',
      title: 'Escucha por la manana',
      desc: 'Comienza tu dia con una frecuencia especifica que activa tu centro emocional y establece una vibracion amorosa desde el primer momento.',
      gradient: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      border: 'border-amber-100',
    },
    {
      icon: Moon,
      emoji: '🌙',
      title: 'Escucha antes de dormir',
      desc: 'Las frecuencias nocturnas reprograman tu subconsciente mientras descansas, eliminando creencias limitantes sobre el amor.',
      gradient: 'from-indigo-400 to-purple-500',
      bg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    {
      icon: Heart,
      emoji: '❤️',
      title: 'Eleva tu vibracion amorosa',
      desc: 'En 30 dias, tu frecuencia emocional se transforma naturalmente, atrayendo relaciones mas sanas y conexion autentica.',
      gradient: 'from-primary-400 to-primary-600',
      bg: 'bg-primary-50',
      iconColor: 'text-primary-600',
      border: 'border-primary-100',
    },
  ];

  return (
    <section className="section-padding relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-rose-25 via-white to-rose-25" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase mb-3">
            Simple y efectivo
          </p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-dark mb-4">
            Como funciona el <span className="gradient-text">Metodo</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Solo necesitas 15 minutos al dia. Las frecuencias sonoras hacen el trabajo por ti.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`glass-card p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${step.border}`}
            >
              <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mb-6`}>
                <step.icon className={`w-8 h-8 ${step.iconColor}`} />
              </div>
              <h3 className="font-heading font-bold text-xl text-dark mb-3">{step.title}</h3>
              <p className="text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 4 — 30 DAY JOURNEY ─────────────────────────────────
function Journey() {
  const ref = useReveal();
  const weeks = [
    {
      week: 'Semana 1',
      title: 'Liberacion emocional',
      desc: 'Suelta el peso emocional del pasado. Las frecuencias te ayudan a liberar dolor, resentimiento y patrones heredados que bloquean tu capacidad de amar.',
      color: 'from-primary-300 to-primary-400',
      icon: Sparkles,
    },
    {
      week: 'Semana 2',
      title: 'Amor propio y autoestima',
      desc: 'Reconecta con tu valor. Las frecuencias reprograman tu dialogo interno, fortaleciendo la confianza y el amor hacia ti misma.',
      color: 'from-primary-400 to-primary-500',
      icon: Heart,
    },
    {
      week: 'Semana 3',
      title: 'Elevacion de la vibracion afectiva',
      desc: 'Tu energia amorosa se eleva. Comienzas a irradiar una frecuencia magnetica que atrae personas y situaciones alineadas contigo.',
      color: 'from-primary-500 to-primary-600',
      icon: Sun,
    },
    {
      week: 'Semana 4',
      title: 'Apertura al amor y nuevas conexiones',
      desc: 'Te abres al amor desde un lugar de plenitud, no de necesidad. Atraes relaciones sanas, reciprocas y autenticas.',
      color: 'from-primary-600 to-primary-700',
      icon: Zap,
    },
  ];

  return (
    <section className="section-padding bg-white relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase mb-3">
            Tu transformacion paso a paso
          </p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-dark mb-4">
            El viaje de <span className="gradient-text">30 dias</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Cada semana del programa esta disenada para guiarte a traves de una fase especifica de tu transformacion amorosa.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary-200 via-primary-400 to-primary-600" />

          <div className="space-y-10 md:space-y-12">
            {weeks.map((w, i) => (
              <div key={i} className="relative pl-16 md:pl-20">
                {/* Dot on timeline */}
                <div
                  className={`absolute left-3 md:left-5 top-1 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br ${w.color} flex items-center justify-center shadow-lg shadow-primary-500/20 z-10`}
                >
                  <w.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                </div>

                <div className="bg-gradient-to-br from-primary-50/80 to-white rounded-2xl p-6 md:p-8 border border-primary-100/60 hover:shadow-lg transition-shadow duration-300">
                  <span className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase">
                    {w.week}
                  </span>
                  <h3 className="font-heading font-bold text-xl md:text-2xl text-dark mt-1 mb-3">
                    {w.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 5 — TESTIMONIALS ───────────────────────────────────
function Testimonials() {
  const ref = useReveal();
  const [current, setCurrent] = useState(0);

  const testimonials = [
    {
      name: 'Carolina M.',
      location: 'Buenos Aires, Argentina',
      text: 'Despues de la segunda semana senti un cambio real. Deje de buscar validacion en otros y empece a sentirme completa por mi misma. El amor llego cuando menos lo esperaba.',
      rating: 5,
    },
    {
      name: 'Isabella R.',
      location: 'Bogota, Colombia',
      text: 'Pense que era otro programa mas, pero las frecuencias son diferentes. Senti una paz que no habia experimentado jamas. Mi relacion mejoro dramaticamente.',
      rating: 5,
    },
    {
      name: 'Lucia P.',
      location: 'Madrid, Espana',
      text: 'Llevaba 3 anos soltera y con miedo a abrirme. A las 3 semanas del programa, la gente notaba algo diferente en mi. Ahora tengo una relacion hermosa y sana.',
      rating: 5,
    },
    {
      name: 'Valentina S.',
      location: 'Santiago, Chile',
      text: 'Las mananas con las frecuencias se convirtieron en mi ritual sagrado. Mi autoestima se transformo completamente. No puedo creer el cambio.',
      rating: 5,
    },
    {
      name: 'Maria Elena D.',
      location: 'Ciudad de Mexico, Mexico',
      text: 'Soy escéptica por naturaleza, pero decidi intentar. La semana 3 fue increible: senti como mi energia cambiaba. Ahora atraiigo personas que me valoran de verdad.',
      rating: 5,
    },
    {
      name: 'Ana Lucia V.',
      location: 'Lima, Peru',
      text: 'Despues de anos de terapia, este programa logro en 30 dias lo que no habia logrado en anos. La combinacion de frecuencias es poderosa.',
      rating: 5,
    },
  ];

  const next = useCallback(() => setCurrent(c => (c + 1) % testimonials.length), [testimonials.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length), [testimonials.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="section-padding relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-rose-25 via-primary-50/30 to-rose-25" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase mb-3">
            Historias reales
          </p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-dark mb-4">
            Lo que dicen las mujeres que ya{' '}
            <span className="gradient-text">viven la experiencia</span>
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative max-w-3xl mx-auto">
          <div className="overflow-hidden rounded-3xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <div key={i} className="w-full shrink-0 px-2">
                  <div className="glass-card p-8 md:p-10 shadow-lg">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-dark/80 text-lg leading-relaxed mb-6 italic">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white font-heading font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-dark text-sm">{t.name}</p>
                        <p className="text-muted text-xs">{t.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-dark" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5 text-dark" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-primary-500' : 'bg-primary-200'
                }`}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 6 — WHAT YOU RECEIVE ───────────────────────────────
function WhatYouReceive() {
  const ref = useReveal();
  const items = [
    'Programa Completo Metodo Vibracion del Amor™',
    '30 Frecuencias Matutinas',
    '30 Frecuencias Nocturnas',
    'Guia de Uso',
    'Calendario de Seguimiento',
  ];
  const bonuses = [
    { name: 'Frecuencia Amor Propio', icon: Heart },
    { name: 'Frecuencia Paz Interior', icon: Moon },
    { name: 'Frecuencia Confianza Femenina', icon: Shield },
  ];

  return (
    <section className="section-padding bg-white relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase mb-3">
            Todo lo que recibes
          </p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-dark mb-4">
            Tu kit completo de <span className="gradient-text">transformacion</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left - Mockup */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary-50 via-rose-25 to-primary-100/50 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl border border-primary-100/40">
                <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-primary-200/40" />
                <div className="absolute bottom-6 left-4 w-12 h-12 rounded-full border border-primary-200/30" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-3 shadow-lg">
                  <Headphones className="w-8 h-8 text-white" />
                </div>
                <p className="font-heading font-bold text-dark text-lg">60 Frecuencias</p>
                <p className="text-primary-500 text-sm">30 matutinas + 30 nocturnas</p>
                <div className="flex items-end justify-center gap-1 h-8 mt-3">
                  {[8, 16, 24, 16, 8, 16, 24, 16, 8].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-primary-300"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute -inset-4 bg-primary-100/20 rounded-[2rem] blur-2xl -z-10" />
            </div>
          </div>

          {/* Right - List */}
          <div>
            <div className="bg-gradient-to-br from-primary-50/80 to-white rounded-3xl p-8 border border-primary-100/60">
              <h3 className="font-heading font-bold text-xl text-dark mb-6">
                Programa Completo
              </h3>
              <div className="space-y-4 mb-8">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-dark">{item}</span>
                  </div>
                ))}
              </div>

              {/* Bonuses */}
              <div className="border-t border-primary-100/60 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-primary-500" />
                  <h4 className="font-heading font-bold text-lg gradient-text">BONOS EXCLUSIVOS</h4>
                </div>
                <div className="space-y-4">
                  {bonuses.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/50 border border-primary-100/40">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                        <b.icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="text-dark font-medium">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Headphones(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

// ─── SECTION 7 — OFFER ──────────────────────────────────────────
function Offer() {
  return (
    <section id="oferta" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-25 via-primary-50/20 to-rose-25" />
      {/* Decorative blobs */}
      <div className="absolute top-10 left-1/4 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-primary-100/30 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase mb-3">
            Oferta especial
          </p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-dark mb-4">
            Comienza tu transformacion <span className="gradient-text">hoy</span>
          </h2>
        </div>

        {/* Offer card */}
        <div className="relative bg-white rounded-3xl shadow-2xl shadow-primary-500/10 overflow-hidden border border-primary-100/40">
          {/* Top banner */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-center">
            <p className="text-white font-heading font-bold text-lg">
              OFERTA POR TIEMPO LIMITADO
            </p>
          </div>

          <div className="p-8 md:p-12">
            {/* Price */}
            <div className="text-center mb-8">
              <p className="text-muted text-base mb-1">Programa completo + 3 bonos</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-muted line-through text-2xl font-heading">US$67</span>
                <span className="text-primary-500 font-heading font-extrabold text-5xl md:text-6xl">
                  US$15,90
                </span>
              </div>
              <p className="text-primary-500 font-heading font-semibold">
                Ahorra 75% hoy
              </p>
            </div>

            {/* What you get summary */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                '60 frecuencias sonoras',
                'Guia de uso completa',
                'Calendario de seguimiento',
                '3 bonos exclusivos',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-primary-50/60">
                  <Check className="w-4 h-4 text-primary-500 shrink-0" />
                  <span className="text-dark text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a href={HOTMART_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackLead()} className="btn-primary w-full text-lg py-5 flex mb-6 animate-pulse-glow">
              <span className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                QUIERO COMENZAR AHORA — US$15,90
              </span>
            </a>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <div className="flex items-center gap-2 text-muted text-sm">
                <Lock className="w-4 h-4 text-primary-500" />
                <span>Pago Seguro</span>
              </div>
              <div className="flex items-center gap-2 text-muted text-sm">
                <Zap className="w-4 h-4 text-primary-500" />
                <span>Acceso Inmediato</span>
              </div>
              <div className="flex items-center gap-2 text-muted text-sm">
                <Shield className="w-4 h-4 text-primary-500" />
                <span>Garantia de 7 Dias</span>
              </div>
            </div>

            {/* Guarantee badge */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-white border border-primary-100/60 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-heading font-bold text-dark text-lg mb-2">
                Garantia de 7 dias
              </h4>
              <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
                Si en 7 dias no sientes un cambio real en tu vibracion emocional, te devolvemos tu dinero. Sin preguntas. Sin complicaciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION 8 — FAQ ─────────────────────────────────────────────
function FAQ() {
  const ref = useReveal();
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Como accedo al programa?',
      a: 'Inmediatamente despues de tu compra, recibes un enlace de acceso a tu area privada donde estan todas las frecuencias, la guia y el calendario. Puedes acceder desde cualquier dispositivo.',
    },
    {
      q: 'Cuanto tiempo necesito dedicar al dia?',
      a: 'Solo necesitas entre 10 y 15 minutos por dia. La frecuencia matutina dura aproximadamente 7 minutos y la nocturna 10 minutos. Puedes escucharlas mientras te preparas por la manana o antes de dormir.',
    },
    {
      q: 'Funciona si actualmente estoy soltera?',
      a: 'Absolutamente. De hecho, muchas mujeres comienzan el programa estando solteras. El Metodo primero transforma tu relacion contigo misma, y desde ese lugar de plenitud es como atraes el amor de forma natural.',
    },
    {
      q: 'Puedo escuchar las frecuencias desde mi celular?',
      a: 'Si, el programa es 100% compatible con celulares, tablets y computadoras. Puedes acceder desde cualquier lugar y en cualquier momento.',
    },
    {
      q: 'Tengo garantia?',
      a: 'Si, tienes una garantia de 7 dias. Si no sientes un cambio real en tu vibracion emocional, te devolvemos el 100% de tu inversion sin preguntas.',
    },
  ];

  return (
    <section className="section-padding bg-white relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-primary-500 font-heading font-semibold text-sm tracking-wide uppercase mb-3">
            Preguntas frecuentes
          </p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-dark">
            Todo lo que necesitas <span className="gradient-text">saber</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-primary-100/60 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-primary-50/30 transition-colors"
              >
                <span className="font-heading font-semibold text-dark pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-primary-500 shrink-0 transition-transform duration-300 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-6 pb-5 text-muted leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-dark text-white/70 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary-400" />
            <span className="font-heading font-bold text-white text-lg">
              Metodo Vibracion del Amor™
            </span>
          </div>
          <div className="flex justify-center gap-6 mb-6">
            <a href="#" className="text-sm hover:text-primary-400 transition-colors">
              Politica de Privacidad
            </a>
            <span className="text-white/20">|</span>
            <a href="#" className="text-sm hover:text-primary-400 transition-colors">
              Terminos y Condiciones
            </a>
          </div>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Metodo Vibracion del Amor™. Todos los derechos reservados.
          </p>
          <p className="text-xs text-white/30 mt-2 max-w-md mx-auto">
            Este producto no pretende sustituir el consejo medico o psicologico profesional. Los resultados pueden variar.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
function App() {
  const { progress, updateProgress } = useVideoProgress();

  return (
    <div className="min-h-screen bg-rose-25">
      <Hero videoProgress={progress} onProgress={updateProgress} />
      <Problem />
      <HowItWorks />
      <Journey />
      <Testimonials />
      <WhatYouReceive />
      <Offer />
      <FAQ />
      <Footer />
      <StickyCTA ctaVisible={progress >= 30} />
    </div>
  );
}

export default App;
