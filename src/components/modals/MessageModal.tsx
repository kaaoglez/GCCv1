// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - MessageModal Component
// COMPOSE MODE — Send a new message to a listing author
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Loader2, CheckCircle2, X, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export function MessageModal() {
  const { locale, tp } = useI18n();
  const {
    messageConfig,
    isMessageOpen,
    closeMessage,
    openAuth,
  } = useModalStore();
  const { data: session, status } = useSession();

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Reset form when config changes
  useEffect(() => {
    if (messageConfig) {
      if (messageConfig.listingTitle) {
        const template = tp('messages', 'messageAbout');
        setSubject(template.replace('{title}', messageConfig.listingTitle));
      } else {
        setSubject('');
      }
      setContent('');
      setError('');
      setSuccess(false);
    }
  }, [messageConfig, tp]);

  const handleClose = () => {
    setSubject('');
    setContent('');
    setError('');
    setSuccess(false);
    setSending(false);
    closeMessage();
  };

  const handleLogin = () => {
    closeMessage();
    openAuth();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !messageConfig) return;

    if (!content.trim()) {
      setError(tp('messages', 'errorSending'));
      return;
    }

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: messageConfig.receiverId,
          subject: subject.trim() || undefined,
          content: content.trim(),
          listingId: messageConfig.listingId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tp('messages', 'errorSending'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(tp('messages', 'errorSending'));
    } finally {
      setSending(false);
    }
  };

  // Determine if user is logged in
  const isLoggedIn = status === 'authenticated';

  return (
    <Dialog open={isMessageOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">{tp('messages', 'compose')}</DialogTitle>
        <DialogDescription className="sr-only">{tp('messages', 'compose')}</DialogDescription>

        {/* Header with green gradient */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-foreground/20">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="font-heading font-bold text-sm">
                {tp('messages', 'compose')}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Not logged in */}
          {!isLoggedIn ? (
            <motion.div
              key="login-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{tp('messages', 'loginRequired')}</h3>
              </div>
              <Button
                onClick={handleLogin}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {tp('auth', 'title')}
              </Button>
            </motion.div>
          ) : success ? (
            /* Success state */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{tp('messages', 'messageSent')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tp('messages', 'messageSentDesc')}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleClose}
                className="font-semibold"
              >
                {tp('common', 'close')}
              </Button>
            </motion.div>
          ) : (
            /* Compose form */
            <motion.div
              key="form"
              ref={formRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Listing info if available */}
                {messageConfig?.listingTitle && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    {messageConfig.listingImage && (
                      <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={messageConfig.listingImage}
                          alt={messageConfig.listingTitle}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{tp('messages', 'aboutListing')}</p>
                      <p className="text-sm font-semibold truncate">{messageConfig.listingTitle}</p>
                    </div>
                  </div>
                )}

                {/* Recipient (read-only) */}
                <div className="space-y-2">
                  <Label>{tp('messages', 'to')}</Label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {messageConfig?.receiverName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{messageConfig?.receiverName}</span>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="msg-subject">{tp('messages', 'subject')}</Label>
                  <Input
                    id="msg-subject"
                    type="text"
                    placeholder={tp('messages', 'subjectPlaceholder')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    disabled={sending}
                  />
                </div>

                {/* Message content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="msg-content">{tp('messages', 'content')}</Label>
                    <span className="text-xs text-muted-foreground">
                      {tp('messages', 'charactersLeft').replace('{count}', String(2000 - content.length))}
                    </span>
                  </div>
                  <Textarea
                    id="msg-content"
                    placeholder={tp('messages', 'contentPlaceholder')}
                    value={content}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        setContent(e.target.value);
                      }
                    }}
                    rows={5}
                    disabled={sending}
                    className="resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {error}
                  </p>
                )}

                {/* Send button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
                  disabled={sending || !content.trim()}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {tp('messages', 'sending')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {tp('messages', 'send')}
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
