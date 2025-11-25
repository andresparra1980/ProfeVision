'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase/client';
import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Check if user is admin
        const { data: profesor, error } = await supabase
          .from('profesores')
          .select('subscription_tier')
          .eq('id', session.user.id)
          .single();

        if (error || profesor?.subscription_tier !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch {
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
