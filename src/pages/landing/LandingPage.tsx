import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  QrCode,
  Star,
  Copy,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Store,
  Coffee,
  UtensilsCrossed,
  Hotel,
  Scissors,
  HeartPulse,
  ShoppingBag,
  Dumbbell,
  Wrench
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StarRating } from '../../components/feedback/StarRating';
import { APP_CONFIG } from '../../config';

export const LandingPage: React.FC = () => {
  // Interactive mini demo state in hero
  const [heroStar, setHeroStar] = useState<number>(5);
  const [heroCopied, setHeroCopied] = useState<boolean>(false);

  const heroReviewText =
    heroStar === 5
      ? 'Had a wonderful experience at Underground Bar. The craft cocktails and warm ambience made our evening unforgettable. Friendly service from start to finish!'
      : 'Solid 4-star experience! Great atmosphere and attentive team. Would definitely recommend stopping by.';

  const handleHeroCopy = () => {
    navigator.clipboard.writeText(heroReviewText);
    setHeroCopied(true);
    setTimeout(() => setHeroCopied(false), 2500);
  };

  const industries = [
    { name: 'Restaurants', icon: UtensilsCrossed, count: '450+ venues' },
    { name: 'Cafes & Bars', icon: Coffee, count: '320+ venues' },
    { name: 'Hotels & Lodging', icon: Hotel, count: '180+ properties' },
    { name: 'Salons & Spas', icon: Scissors, count: '290+ studios' },
    { name: 'Clinics & Care', icon: HeartPulse, count: '140+ practices' },
    { name: 'Retail Stores', icon: ShoppingBag, count: '210+ shops' },
    { name: 'Fitness Gyms', icon: Dumbbell, count: '160+ clubs' },
    { name: 'Services', icon: Wrench, count: '380+ contractors' },
  ];

  const steps = [
    {
      step: '01',
      title: 'Scan Table QR',
      description: 'Customer opens the review app with a quick smartphone scan. Zero registration, no apps to install.',
      icon: QrCode,
    },
    {
      step: '02',
      title: 'Rate In Seconds',
      description: 'Customers choose 1 to 5 stars and select quick sentiment chips tailored to what made their visit special.',
      icon: Star,
    },
    {
      step: '03',
      title: 'AI Drafts Review',
      description: 'Intelligent synthesis generates natural, human drafts reflecting only their authentic experience.',
      icon: Sparkles,
    },
    {
      step: '04',
      title: 'Publish to Google',
      description: 'Customer copies their draft and jumps directly to your Google Business Profile to post.',
      icon: ExternalLink,
    },
  ];

  const features = [
    {
      title: 'Smart QR Generation',
      description: 'Instant vector SVGs, high-res PNGs, and print-ready table stands with your brand logo.',
    },
    {
      title: 'AI-Assisted Writing',
      description: 'Helps delighted customers overcome writer’s block with genuine, honest review drafts in seconds.',
    },
    {
      title: 'Google Review Integration',
      description: 'Direct deep-linking to your official Google Business Profile review dialog.',
    },
    {
      title: 'Real-time Analytics Funnel',
      description: 'Track scans, star distribution, draft completions, copy rates, and Google clicks.',
    },
    {
      title: 'Multi-Location Support',
      description: 'Manage multiple branches, stores, or venues under a single administrative dashboard.',
    },
    {
      title: 'Google Authenticity First',
      description: 'No gating, no fake reviews, no automated postings. 100% compliant with Google policies.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Call to actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Reputation Engine for Modern Venues</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Turn Every Customer Experience Into{' '}
                <span className="text-primary underline decoration-primary/30 underline-offset-8">
                  Meaningful Feedback.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Customers scan a QR code at your tables, rate their experience in under 30 seconds, and turn genuine feedback into beautifully drafted reviews ready for your Google profile.
              </p>



              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>No customer login needed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Google policy compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Print-ready QR stands</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Interactive Phone Simulation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="w-full max-w-[360px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
                {/* Phone screen */}
                <div className="bg-[#F8FAFC] rounded-[32px] p-5 space-y-4 text-center overflow-hidden">
                  <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

                  {/* Business header */}
                  <div className="flex flex-col items-center">
                    <img
                      src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=120&q=80"
                      alt="Underground Bar"
                      className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm mb-2"
                    />
                    <h3 className="font-bold text-sm text-slate-900">Underground Bar</h3>
                    <p className="text-[10px] text-slate-400">Downtown Manhattan</p>
                  </div>

                  {/* Rating prompt */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <p className="text-xs font-semibold text-slate-800">
                      How was your experience?
                    </p>
                    <StarRating
                      value={heroStar}
                      onChange={(s) => setHeroStar(s)}
                      size="md"
                    />
                    <div className="flex flex-wrap gap-1 justify-center pt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary text-white font-medium">
                        ✓ Craft Cocktails
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary text-white font-medium">
                        ✓ Great Ambience
                      </span>
                    </div>
                  </div>

                  {/* AI Generated Review Card */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-left shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-primary">
                        <Sparkles className="w-3 h-3" /> AI Draft
                      </span>
                      <span>★★★★★</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">
                      "{heroReviewText}"
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <Button
                      variant={heroCopied ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-full text-xs justify-center py-2"
                      leftIcon={heroCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      onClick={handleHeroCopy}
                    >
                      {heroCopied ? 'Copied to Clipboard!' : 'Copy Review Text'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs justify-center py-2 border-slate-300"
                      leftIcon={<ExternalLink className="w-3.5 h-3.5 text-amber-500" />}
                    >
                      Review us on Google
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Streamlined Journey
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            From Table Scan to 5-Star Review in 30 Seconds
          </h2>
          <p className="text-sm text-slate-600">
            Frictionless for your patrons, authentic for Google, transformative for your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-premium flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-200">{s.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="bg-slate-50 border-y border-slate-200/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Enterprise Ready
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Engineered For Busy Venues and Demanding Owners
            </h2>
            <p className="text-sm text-slate-600">
              Everything you need to scale social proof without nagging your customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-premium transition-shadow"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-xs mb-4">
                  0{i + 1}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* BUILT FOR */}
      <section id="built-for" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Universal Versatility
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Trusted Across Experience-Driven Industries
          </h2>
          <p className="text-sm text-slate-600">
            From cocktail lounges to boutique medical practices, Feedora elevates public reputation.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {industries.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.name}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:border-primary/40 transition-colors text-center flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{ind.name}</h4>
                <span className="text-[11px] text-slate-500 font-medium">{ind.count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-float">
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto text-white shadow-lg shadow-primary/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Turn Happy Guests Into Your Biggest Advocates?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Launch your venue's branded QR code in 2 minutes and watch your Google reviews compound naturally.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full justify-center">
                  Sign In as Venue Owner
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
