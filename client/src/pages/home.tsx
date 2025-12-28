import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Zap, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">

      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative rounded-2xl border border-border/50 shadow-2xl shadow-black/10 overflow-hidden bg-card/50 backdrop-blur-sm"
        >
          {/* Fake UI Header */}
          <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          
          {/* Unsplash Image as Placeholder for "App Screenshot" */}
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
             <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2400&q=80" 
              alt="Dashboard Preview" 
              className="w-full h-full object-cover object-top opacity-90"
            />
          </div>
        </motion.div>

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
