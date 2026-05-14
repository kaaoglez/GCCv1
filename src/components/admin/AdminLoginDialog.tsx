'use client';

import { useAdminStore } from '@/lib/admin-store';
import { useModalStore } from '@/lib/modal-store';
import { AdminLogin } from './AdminLogin';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

export function AdminLoginDialog() {
  const { isAdmin } = useAdminStore();
  const setAdminView = useModalStore((s) => s.setAdminView);

  // Once logged in, AdminPage takes over — hide this dialog
  if (isAdmin) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) setAdminView(false); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Admin Login</DialogTitle>
        <AdminLogin />
      </DialogContent>
    </Dialog>
  );
}
