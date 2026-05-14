// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - MessagesPage Component
// Full-page inbox showing conversations grouped by (listingId, otherUser)
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowLeft,
  Send,
  Loader2,
  Inbox,
  MessageSquare,
  CheckCircle2,
  Circle,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useSession } from 'next-auth/react';
import { useModalStore } from '@/lib/modal-store';
import { getRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

// Types for the API responses
interface MessageUser {
  id: string;
  name: string;
  avatar?: string;
}

interface Message {
  id: string;
  listingId?: string;
  sender: MessageUser;
  receiver: MessageUser;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// Conversation summary (grouped by listingId + otherUserId)
interface Conversation {
  listingId: string | null;
  listingTitle?: string;
  otherUser: MessageUser;
  lastMessage: Message;
  unreadCount: number;
}

export function MessagesPage() {
  const { locale, tp } = useI18n();
  const { data: session } = useSession();
  const { openAuth } = useModalStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Fetch all messages and group into conversations
  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/messages?limit=200');
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      const allMessages: Message[] = data.data || [];

      // Group by (listingId, otherUserId)
      const convMap = new Map<string, Conversation>();
      const currentUserId = session.user.id;

      for (const msg of allMessages) {
        const otherUser = msg.senderId === currentUserId ? msg.receiver : msg.sender;
        // We don't have senderId directly, infer from sender/receiver
        const isSender = msg.sender.id === currentUserId;
        const other = isSender ? msg.receiver : msg.sender;

        const key = `${msg.listingId || 'no-listing'}__${other.id}`;

        const existing = convMap.get(key);
        if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
          const unreadCount = existing
            ? existing.unreadCount
            : (!isSender && !msg.isRead ? 1 : 0);

          convMap.set(key, {
            listingId: msg.listingId || null,
            listingTitle: existing?.listingTitle, // Will be resolved if available
            otherUser: other,
            lastMessage: msg,
            unreadCount: isSender ? existing?.unreadCount || 0 : unreadCount,
          });
        } else {
          // Update unread count if this message is unread and received
          if (!isSender && !msg.isRead) {
            existing.unreadCount += 1;
          }
        }
      }

      // Sort by last message date descending
      const sorted = Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );

      setConversations(sorted);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conv: Conversation) => {
    setSelectedConversation(conv);
    setMessagesLoading(true);
    setReplyText('');

    try {
      const params = new URLSearchParams({ userId: conv.otherUser.id });
      if (conv.listingId) params.set('listingId', conv.listingId);

      const res = await fetch(`/api/messages?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      const msgs: Message[] = data.data || [];

      setMessages(msgs);

      // Mark unread messages as read
      const unreadMsgs = msgs.filter(
        (m) => m.receiver.id === session?.user?.id && !m.isRead
      );
      for (const msg of unreadMsgs) {
        fetch(`/api/messages/${msg.id}`, { method: 'PATCH' }).catch(() => {});
      }

      // Update conversation unread count to 0
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser.id === conv.otherUser.id && c.listingId === conv.listingId
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [session?.user?.id]);

  // Send reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation.otherUser.id,
          content: replyText.trim(),
          listingId: selectedConversation.listingId || undefined,
        }),
      });

      if (!res.ok) return;

      const newMsg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
      setReplyText('');

      // Refresh conversations to update last message
      fetchConversations();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  // Not logged in
  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <Mail className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{tp('messages', 'title')}</h1>
          <p className="text-muted-foreground mt-2">{tp('messages', 'loginRequired')}</p>
        </div>
        <Button
          onClick={openAuth}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {tp('auth', 'title')}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Page header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{tp('messages', 'title')}</h1>
                <p className="text-sm text-muted-foreground">{tp('messages', 'inbox')}</p>
              </div>
              {/* Unread badge */}
              {conversations.reduce((acc, c) => acc + c.unreadCount, 0) > 0 && (
                <Badge className="bg-emerald-600 text-white ml-2">
                  {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
                </Badge>
              )}
            </div>
            {selectedConversation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="hidden sm:flex gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {tp('common', 'back')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          /* Loading skeletons */
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : selectedConversation ? (
          /* Conversation view */
          <ConversationView
            conversation={selectedConversation}
            messages={messages}
            loading={messagesLoading}
            replyText={replyText}
            setReplyText={setReplyText}
            sending={sending}
            onSendReply={handleSendReply}
            onBack={() => setSelectedConversation(null)}
            locale={locale}
            tp={tp}
            currentUserId={session.user.id}
          />
        ) : conversations.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{tp('messages', 'noMessages')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{tp('messages', 'noMessagesDesc')}</p>
            </div>
          </div>
        ) : (
          /* Conversation list */
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              {tp('messages', 'conversations')}
            </h2>
            {conversations.map((conv) => (
              <ConversationRow
                key={`${conv.listingId || 'none'}__${conv.otherUser.id}`}
                conversation={conv}
                locale={locale}
                tp={tp}
                onClick={() => fetchMessages(conv)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Conversation List Row ─────────────────────────────────── */
function ConversationRow({
  conversation,
  locale,
  tp,
  onClick,
}: {
  conversation: Conversation;
  locale: string;
  tp: (section: string, key: string) => string;
  onClick: () => void;
}) {
  const { otherUser, lastMessage, unreadCount } = conversation;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left group',
        unreadCount > 0 && 'border-primary/30 bg-primary/[0.03]'
      )}
    >
      {/* Avatar */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0">
        {otherUser.avatar ? (
          <img
            src={otherUser.avatar}
            alt={otherUser.name}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-primary">
            {otherUser.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-semibold text-sm truncate',
            unreadCount > 0 && 'text-foreground',
            unreadCount === 0 && 'text-foreground'
          )}>
            {otherUser.name}
          </span>
          {unreadCount > 0 && (
            <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          )}
        </div>
        <p className={cn(
          'text-sm truncate mt-0.5',
          unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}>
          {lastMessage.content}
        </p>
      </div>

      {/* Time */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-muted-foreground">
          {getRelativeTime(lastMessage.createdAt, locale)}
        </span>
        {unreadCount > 0 && (
          <Badge className="bg-emerald-600 text-white text-xs px-1.5 py-0 min-w-[20px] text-center">
            {unreadCount}
          </Badge>
        )}
      </div>
    </button>
  );
}

/* ── Conversation Detail View ──────────────────────────────── */
function ConversationView({
  conversation,
  messages,
  loading,
  replyText,
  setReplyText,
  sending,
  onSendReply,
  onBack,
  locale,
  tp,
  currentUserId,
}: {
  conversation: Conversation;
  messages: Message[];
  loading: boolean;
  replyText: string;
  setReplyText: (text: string) => void;
  sending: boolean;
  onSendReply: () => void;
  onBack: () => void;
  locale: string;
  tp: (section: string, key: string) => string;
  currentUserId: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)] rounded-xl border bg-card overflow-hidden">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="sm:hidden shrink-0 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
          {conversation.otherUser.avatar ? (
            <img
              src={conversation.otherUser.avatar}
              alt={conversation.otherUser.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-primary">
              {conversation.otherUser.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-sm">{conversation.otherUser.name}</span>
          {conversation.lastMessage.subject && conversation.lastMessage.subject !== 'Sin asunto' && (
            <p className="text-xs text-muted-foreground truncate">
              {conversation.lastMessage.subject}
            </p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(
                'flex gap-2',
                i % 2 === 0 ? 'justify-start' : 'justify-end'
              )}>
                <Skeleton className="h-16 w-48 rounded-xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {tp('messages', 'noMessages')}
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender.id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}
              >
                {/* Other user's avatar */}
                {!isMine && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-1">
                    {conversation.otherUser.avatar ? (
                      <img
                        src={conversation.otherUser.avatar}
                        alt={conversation.otherUser.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {conversation.otherUser.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                <div className={cn(
                  'max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5',
                  isMine
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={cn(
                    'text-[10px] mt-1',
                    isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}>
                    {getRelativeTime(msg.createdAt, locale)}
                    {isMine && (
                      <CheckCircle2 className="inline h-3 w-3 ml-1 opacity-60" />
                    )}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div className="px-4 py-3 border-t bg-muted/30 shrink-0">
        <div className="flex gap-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={tp('messages', 'replyPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendReply();
              }
            }}
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={onSendReply}
            disabled={sending || !replyText.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 gap-2"
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
