'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Home,
  Target,
  Menu,
  X,
  ChevronRight,
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
}

function NavLink({ href, children, icon, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="flex-1">{children}</span>
      {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
    </Link>
  );
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white border shadow-lg hover:bg-accent transition-colors"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r z-40 transition-transform duration-300 ease-in-out",
          "w-64 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">Trajectory</div>
              <div className="text-xs text-muted-foreground">Research Platform</div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            <NavLink
              href="/"
              icon={<Home className="h-5 w-5" />}
              onClick={() => setIsOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              href="/placeknots"
              icon={<Target className="h-5 w-5" />}
              onClick={() => setIsOpen(false)}
            >
              Start Survey
            </NavLink>
            <NavLink
              href="/annotate-all"
              icon={<ListChecks className="h-5 w-5" />}
              onClick={() => setIsOpen(false)}
            >
              Annotate All
            </NavLink>
          </div>
        </nav>

        {/* Bottom CTA */}
        <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-purple-50">
          <Link href="/placeknots" onClick={() => setIsOpen(false)}>
            <Button className="w-full rounded-lg shadow-md hover:shadow-lg transition-all">
              <Target className="mr-2 h-4 w-4" />
              Start Annotation
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="lg:pl-64">
        {/* This empty div creates space for the sidebar on desktop */}
      </div>
    </>
  );
}
