import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <main className="flex-1">
        {/* Hero Section */}
        <Hero 
          primaryCtaHref="/auth/signup"
          secondaryCtaHref="/auth/login"
          secondaryCtaText="Sign In"
        />
      </main>

      <Footer />
    </div>
  );
}
