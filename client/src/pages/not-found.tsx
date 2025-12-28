import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6 text-center">
            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-5xl font-display font-bold text-foreground">
                404
              </h1>
              <p className="text-xl font-semibold text-foreground">
                Page Not Found
              </p>
            </div>

            {/* Subtext */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              Did you forget to add the page to the router?
            </p>

            {/* CTA Button */}
            <Link href="/">
              <Button className="w-full h-11 gap-2 rounded-lg shadow-md shadow-primary/20">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
