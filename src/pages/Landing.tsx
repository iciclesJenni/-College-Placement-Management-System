import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  ChevronRight,
  Terminal,
  Code2,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/landing/FaqSection";
import { useNavigate } from "react-router";
import logo from "@/assets/logo.svg";

const features = [
  {
    icon: Briefcase,
    title: "Job Board",
    desc: "Browse active company drives with automatic eligibility checks against your CGPA, backlogs, and department — no guessing involved.",
  },
  {
    icon: Zap,
    title: "One-Click Apply",
    desc: "Apply to drives instantly and track your pipeline from Applied through Shortlisted, Assessment, and Interview to Selected.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    desc: "TPO dashboard with department-wide placement charts, salary distribution breakdowns, and real-time candidate pipeline tracking.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Dedicated views for Students, Training & Placement Officers, and Company Recruiters — each role sees exactly what it needs.",
  },
  {
    icon: Users,
    title: "Student Database",
    desc: "Searchable, filterable student profiles with skills, CGPA, and placement status. Export verified lists to CSV in one click.",
  },
  {
    icon: CheckCircle2,
    title: "Eligibility Engine",
    desc: "Candidates only see drives they qualify for. CGPA thresholds, backlog limits, and department filters are enforced automatically.",
  },
];

const stats = [
  { value: "1,200+", label: "Students" },
  { value: "85%", label: "Placed" },
  { value: "45+", label: "Companies" },
  { value: "₹12 LPA", label: "Avg CTC" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="nb-scene min-h-screen bg-background">
      <div className="nb-noise" aria-hidden="true" />
      {/* Nav */}
      <nav className="border-b-2 border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-border bg-primary/10 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-sm font-black tracking-tight uppercase">Placement Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="nb-btn-secondary hidden sm:flex"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
            <Button
              className="nb-btn-primary"
              onClick={() => navigate("/auth")}
            >
              Enter Placement Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b-2 border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl"
          >
            <div className="nb-tag bg-accent/15 text-accent mb-6">
              <Code2 className="h-3 w-3 mr-1.5" aria-hidden="true" />
              Placement Season 2025
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Campus placements,
              <br />
              <span className="bg-primary/20 px-2 py-1 border-2 border-border inline-block mt-2 text-primary">
                systematized.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
              The centralized platform for managing college placements end-to-end.
              Students discover opportunities, TPOs orchestrate drives, and
              companies find talent — all from a single interface.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="nb-btn-primary text-base px-8 py-6"
                onClick={() => navigate("/auth")}
              >
                Enter as Student
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>            <Button
              size="lg"
              variant="outline"
              className="nb-btn-secondary text-base px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Open TPO Console
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="nb-btn-secondary text-base px-8 py-6"
              onClick={() => {
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Read the FAQ
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b-2 border-border bg-accent/10">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="text-center relative z-10"
              >
                <div className="text-3xl md:text-4xl font-black text-accent">
                  {stat.value}
                </div>
                <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b-2 border-border">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12">
            <div className="nb-tag bg-primary/15 text-primary mb-4">
              <Database className="h-3 w-3 mr-1.5" aria-hidden="true" />
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Everything you need to run placements
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="nb-card nb-card-hover p-6"
              >
                <div className="mb-4 inline-flex items-center justify-center w-10 h-10 border-2 border-border bg-primary/15">
                  <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b-2 border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12">
            <div className="nb-tag bg-accent/15 text-accent mb-4">
              <Terminal className="h-3 w-3 mr-1.5" aria-hidden="true" />
              How it works
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Three steps to your first offer
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                desc: "Sign up and fill in your details — CGPA, skills, department, backlogs. The system auto-calculates your eligibility for every active drive.",
              },
              {
                step: "02",
                title: "Browse and Apply",
                desc: "See which drives you qualify for, review the details, and apply with a single click. No more missed deadlines or confusion.",
              },
              {
                step: "03",
                title: "Track Until Placement",
                desc: "Follow your application through each round in real time. Get notified at every stage until the offer lands.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="relative"
              >
                <div className="text-6xl font-black text-border mb-4 select-none">
                  {item.step}
                </div>
                <h3 className="text-xl font-black mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Ready to start?
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
              Join hundreds of students who found their first roles through the Placement Portal.
            </p>
            <Button
              size="lg"
              className="nb-btn-primary text-lg px-12 py-7"
              onClick={() => navigate("/auth")}
            >
              Enter Placement Portal
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer — extra bottom padding so the fixed Demo Sandbox widget
          never overlaps the stats/content above the fold */}
      <footer className="border-t-2 border-border">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:pb-32 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black uppercase">
            <Terminal className="h-4 w-4 text-primary" aria-hidden="true" />
            Placement Portal
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-foreground font-bold transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate("/terms")}
              className="hover:text-foreground font-bold transition-colors"
            >
              Terms of Service
            </button>
            <span>© 2025 Placement Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
