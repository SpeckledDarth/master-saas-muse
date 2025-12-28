import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface HeroProps {
  heading?: string;
  subheading?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  showBadge?: boolean;
  badgeText?: string;
}

export function Hero({
  heading = "Build your next SaaS",
  subheading = "The Master SaaS Muse Template gives you the foundation to build production-ready applications with modern design, robust architecture, and seamless authentication.",
  primaryCtaText = "Get Started Free",
  primaryCtaHref = "/auth/register",
  secondaryCtaText = "View Demo",
  secondaryCtaHref = "/dashboard",
  showBadge = true,
  badgeText = "v1.0.0 Now Available",
}: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-20 pb-32">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[40rem] h-[40rem] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          {showBadge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {badgeText}
            </motion.div>
          )}

          {/* Heading with gradient accent */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground"
          >
            {heading}
            <br />
            <span className="text-gradient">faster than ever.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {subheading}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href={primaryCtaHref}>
              <Button
                size="lg"
                className="h-14 px-8 rounded-full text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
              >
                {primaryCtaText}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href={secondaryCtaHref}>
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full text-lg font-semibold hover:bg-muted/50 transition-all hover:-translate-y-1"
              >
                {secondaryCtaText}
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
