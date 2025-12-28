import { Link } from "wouter";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[10%] right-[5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[10%] left-[5%] w-[40rem] h-[40rem] bg-purple-500/5 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                v1.0.0 Now Available
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground"
              >
                Build your next SaaS <br />
                <span className="text-gradient">faster than ever.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                The Master SaaS Muse Template gives you the foundation to build production-ready applications with modern design, robust architecture, and seamless authentication.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              >
                <Link href="/auth/register">
                  <Button size="lg" className="h-14 px-8 rounded-full text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg font-semibold hover:bg-muted/50 transition-all hover:-translate-y-1">
                    View Demo
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-20 relative rounded-2xl border border-border/50 shadow-2xl shadow-black/10 overflow-hidden bg-card/50 backdrop-blur-sm"
            >
              {/* Fake UI Header */}
              <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              
              {/* Unsplash Image as Placeholder for "App Screenshot" */}
              {/* dashboard analytics placeholder */}
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                 <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2400&q=80" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover object-top opacity-90"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">Everything you need</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Stop reinventing the wheel. We've included all the essential features you need to launch your next big idea.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  desc: "Built on Vite and React for instant page loads and seamless interactions."
                },
                {
                  icon: Shield,
                  title: "Enterprise Secure",
                  desc: "Bank-grade security practices implemented by default for your peace of mind."
                },
                {
                  icon: Globe,
                  title: "Global Scale",
                  desc: "Designed to scale with your user base from day one, no refactoring needed."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-card p-8 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors duration-300 shadow-sm hover:shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
