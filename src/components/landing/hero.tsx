import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="container py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Build Your SaaS
          <span className="text-primary"> Faster</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground md:text-xl">
          A production-ready template with authentication, payments, and everything you need to launch your next SaaS product.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild data-testid="button-hero-cta">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild data-testid="button-hero-demo">
            <Link href="/demo">View Demo</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}