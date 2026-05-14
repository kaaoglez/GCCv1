'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { useI18n } from '@/hooks/use-i18n';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminLogin() {
  const { login, isLoading } = useAdminStore();
  const { tp } = useI18n();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    const success = await login(password);
    if (!success) setError(true);
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3">
          <Leaf className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {tp('admin.login')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gran Canaria Conecta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{tp('admin.password')}</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="••••••••"
              className={`pr-10 h-11 ${error ? 'border-destructive' : ''}`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-sm text-destructive">{tp('admin.wrongPassword')}</p>
          )}
        </div>
        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              {tp('common.loading')}
            </span>
          ) : (
            tp('admin.enter')
          )}
        </Button>
      </form>
    </div>
  );
}
