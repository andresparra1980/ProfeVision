import { AuthHeader } from '@/components/shared/auth-header';
import { AuthFooter } from '@/components/shared/auth-footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      <main className="auth-main flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
        {/* Background gradient - same as hero section */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b890f]/10 to-[#bc152b]/5 dark:from-[#76f47a]/5 dark:to-[#ea4359]/5" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ffd60a]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#0b890f]/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10">
          {children}
        </div>
      </main>
      <AuthFooter />
    </div>
  );
} 