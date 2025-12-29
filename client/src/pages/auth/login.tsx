import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (resetMode) {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a password reset link.',
        });
        setResetMode(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setLocation('/dashboard');
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Google sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-display text-2xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-200">
              M
            </div>
          </Link>
          <CardTitle className="text-2xl font-display font-bold">
            {resetMode ? 'Reset Password' : 'Welcome back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {resetMode
              ? 'Enter your email to receive a reset link'
              : 'Sign in to your account to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!resetMode && (
            <Button
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={handleGoogleSignIn}
              data-testid="button-google-signin"
            >
              <SiGoogle className="w-4 h-4" />
              Continue with Google
            </Button>
          )}

          {!resetMode && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            {!resetMode && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="input-password"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 shadow-md shadow-primary/20"
              disabled={loading}
              data-testid="button-submit"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {resetMode ? 'Send Reset Link' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setResetMode(!resetMode)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-reset"
            >
              {resetMode ? 'Back to sign in' : 'Forgot your password?'}
            </button>

            {!resetMode && (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="text-primary hover:underline font-medium"
                  data-testid="link-signup"
                >
                  Sign up
                </Link>
              </p>
            )}
            <p className="text-sm text-muted-foreground pt-2">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
                data-testid="link-back-home"
              >
                Back to home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
