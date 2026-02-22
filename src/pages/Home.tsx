import { motion } from "framer-motion";
import { Scale, ArrowRight, Shield, Zap, Users, BookOpen, Mic, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  {
    icon: Scale,
    title: "Live Trial Simulation",
    description: "Step into a realistic courtroom with AI-powered judges, opposing counsel, and real-time proceedings.",
  },
  {
    icon: Mic,
    title: "Deposition Practice",
    description: "Prepare for depositions with AI witnesses that respond dynamically to your questioning strategy.",
  },
  {
    icon: Shield,
    title: "AI Strategy Assistant",
    description: "Receive real-time suggestions, counterarguments, and precedent citations as the trial unfolds.",
  },
  {
    icon: Users,
    title: "Judge Persona Engine",
    description: "Practice against AI judges modeled on real judicial styles — from Sotomayor to Learned Hand.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Get scored on persuasiveness, objection success rate, logical consistency, and speaking cadence.",
  },
  {
    icon: BookOpen,
    title: "Case Document Ingestion",
    description: "Upload entire case files. Our AI parses, indexes, and references them during your simulation.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Scale className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight font-display">
              SpecterRoss<span className="text-primary">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors duration-200">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors duration-200">How it Works</a>
              <a href="#pricing" className="hover:text-foreground transition-colors duration-200">Pricing</a>
            </nav>
            <ThemeToggle />
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 hidden sm:inline">
              Sign In
            </a>
            <button
              onClick={() => navigate("/configure")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient pt-36 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 dark:border-primary/30 text-xs font-semibold text-primary mb-10 tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Legal Simulation Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-8"
          >
            The Courtroom, <br />
            <span className="text-gradient-primary">Reimagined by AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Enterprise-grade simulation for legal professionals and law students. Practice trials, depositions, and oral arguments against AI judges and opposing counsel — with real-time strategy coaching and performance analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <button
              onClick={() => navigate("/configure")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/95 transition-all"
            >
              Start Your Simulation
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="px-6 py-4 rounded-xl text-sm font-semibold text-foreground border-2 border-border hover:border-foreground/20 hover:bg-muted/50 dark:bg-muted/30 dark:border-muted-foreground/20 dark:hover:bg-muted/50 transition-all"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-card/50 dark:bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "10,000+", label: "Simulations Run" },
            { value: "<300ms", label: "AI Response Latency" },
            { value: "50+", label: "Judge Personas" },
            { value: "98%", label: "User Satisfaction" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Everything You Need to Prepare
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base">
              From courtroom simulations to post-trial analytics, SpecterRossAI equips you with the tools to sharpen your advocacy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="surface-elevated p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2 font-display">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-28 px-6 bg-muted/30 dark:bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-muted-foreground text-base">
              Three simple steps to your AI-powered courtroom.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "Configure Your Trial",
                desc: "Select your trial type, choose a judge persona, and upload your case documents. Our AI ingests and indexes everything instantly.",
              },
              {
                step: "02",
                title: "Enter the Courtroom",
                desc: "Join a live simulation with AI judge and opposing counsel. Present your arguments, raise objections, and reference evidence in real-time.",
              },
              {
                step: "03",
                title: "Review & Improve",
                desc: "After the session, review your performance analytics — persuasiveness score, objection success rate, logical consistency, and more.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex gap-8 items-start surface-elevated p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <span className="text-4xl font-bold text-primary/15 shrink-0 tabular-nums font-display">
                  {item.step}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-2 font-display">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Ready to Sharpen Your Advocacy?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-base">
              Join thousands of attorneys and law students who prepare smarter with SpecterRossAI.
            </p>
            <button
              onClick={() => navigate("/configure")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/95 transition-all"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/80 dark:bg-card/50 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground font-display">
              SpecterRoss<span className="text-primary">AI</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 SpecterRossAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
