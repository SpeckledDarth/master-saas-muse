import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[30rem] h-[30rem] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border-border/50 shadow-lg shadow-black/5">
          <CardContent className="pt-8 pb-8">
            <div className="space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-display font-bold text-foreground">404</h1>
                <p className="text-lg font-semibold text-foreground">Page Not Found</p>
              </div>

              {/* Subtext */}
              <p className="text-center text-muted-foreground leading-relaxed">
                Did you forget to add the page to the router? This page doesn't exist or has been moved.
              </p>

              {/* CTA Button */}
              <div className="pt-2">
                <Link href="/">
                  <Button
                    className="w-full h-11 gap-2 rounded-lg shadow-md shadow-primary/20"
                    size="lg"
                  >
                    <Home className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
