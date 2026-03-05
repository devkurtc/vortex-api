'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/shared/mode-toggle';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, Table2, Settings, ScrollText, LogOut, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/user', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/user/scheduler', icon: Calendar, label: 'Scheduler' },
  { href: '/user/tabular', icon: Table2, label: 'Tabular' },
  { href: '/user/settings', icon: Settings, label: 'Settings' },
  { href: '/audit', icon: ScrollText, label: 'Audit Log' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const getUsername = useAuthStore((s) => s.getUsername);

  return (
    <div className="flex h-screen">
      {/* Side nav */}
      <nav className="flex w-16 flex-col items-center border-r bg-muted/30 py-4">
        <div className="mb-6">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'mb-1 h-10 w-10',
                  isActive && 'bg-primary/10 text-primary'
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}
        <div className="mt-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title="Logout"
            onClick={() => {
              clearTokens();
              router.push('/login');
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">VLTC Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <span className="text-sm text-muted-foreground">
              Hi, {getUsername()}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
