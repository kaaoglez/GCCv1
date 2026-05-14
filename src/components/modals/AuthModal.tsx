'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Leaf, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { MUNICIPALITIES } from '@/lib/types';

export function AuthModal() {
  const isAuthOpen = useModalStore((s) => s.isAuthOpen);
  const closeAuth = useModalStore((s) => s.closeAuth);
  const { tp } = useI18n();

  return (
    <Dialog open={isAuthOpen} onOpenChange={(open) => !open && closeAuth()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header with green gradient */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-5 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-foreground/20">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-heading font-bold text-sm">
              {tp('auth', 'title')}
            </span>
          </div>
          <p className="text-primary-foreground/80 text-xs">
            {tp('hero', 'subtitle')}
          </p>
        </div>

        <div className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full h-10">
              <TabsTrigger value="login" className="flex-1">
                {tp('auth', 'title')}
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                {tp('auth', 'register')}
              </TabsTrigger>
            </TabsList>

            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="login" className="mt-4">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="mt-4">
                <RegisterForm />
              </TabsContent>
            </motion.div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Login Form ──────────────────────────────────────────── */
function LoginForm() {
  const { tp } = useI18n();
  const closeAuth = useModalStore((s) => s.closeAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(tp('auth', 'errorRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(tp('auth', 'errorLogin'));
      } else {
        closeAuth();
      }
    } catch {
      setError(tp('auth', 'errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader className="sr-only">
        <DialogTitle>{tp('auth', 'title')}</DialogTitle>
        <DialogDescription>{tp('auth', 'title')}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="login-email">{tp('auth', 'email')}</Label>
        <Input
          id="login-email"
          type="email"
          placeholder={tp('auth', 'emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{tp('auth', 'password')}</Label>
        <Input
          id="login-password"
          type="password"
          placeholder={tp('auth', 'passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {tp('auth', 'loggingIn')}
          </>
        ) : (
          tp('auth', 'loginButton')
        )}
      </Button>
    </form>
  );
}

/* ── Register Form ───────────────────────────────────────── */
function RegisterForm() {
  const { tp } = useI18n();
  const closeAuth = useModalStore((s) => s.closeAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError(tp('auth', 'errorRequired'));
      return;
    }

    if (password.length < 6) {
      setError(tp('auth', 'passwordMin'));
      return;
    }

    if (password !== confirmPassword) {
      setError(tp('auth', 'errorPasswordMatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          municipality: municipality || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(tp('auth', 'errorEmailExists'));
        } else {
          setError(data.error || tp('auth', 'errorRegister'));
        }
        return;
      }

      // Auto-login after successful registration
      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        // Registration succeeded but auto-login failed, still close modal
        closeAuth();
      } else {
        closeAuth();
      }
    } catch {
      setError(tp('auth', 'errorRegister'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader className="sr-only">
        <DialogTitle>{tp('auth', 'register')}</DialogTitle>
        <DialogDescription>{tp('auth', 'register')}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="register-name">{tp('auth', 'name')}</Label>
        <Input
          id="register-name"
          type="text"
          placeholder={tp('auth', 'namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">{tp('auth', 'email')}</Label>
        <Input
          id="register-email"
          type="email"
          placeholder={tp('auth', 'emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">
          {tp('auth', 'password')}
          <span className="text-muted-foreground font-normal ml-1 text-xs">
            {tp('auth', 'passwordMin')}
          </span>
        </Label>
        <Input
          id="register-password"
          type="password"
          placeholder={tp('auth', 'passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">
          {tp('auth', 'confirmPassword')}
        </Label>
        <Input
          id="register-confirm-password"
          type="password"
          placeholder={tp('auth', 'confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-municipality">
          {tp('auth', 'municipality')}
        </Label>
        <Select value={municipality} onValueChange={setMunicipality} disabled={loading}>
          <SelectTrigger id="register-municipality">
            <SelectValue placeholder={tp('auth', 'selectMunicipality')} />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            {MUNICIPALITIES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {tp('auth', 'creatingAccount')}
          </>
        ) : (
          tp('auth', 'registerButton')
        )}
      </Button>
    </form>
  );
}
