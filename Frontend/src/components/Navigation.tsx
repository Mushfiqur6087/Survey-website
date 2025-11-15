'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  Target,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  Database,
  FileText,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
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
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline-block text-lg">
              Trajectory <span className="text-primary">Research</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" icon={<Home className="h-4 w-4" />}>
              Home
            </NavLink>
            <NavLink href="/placeknots" icon={<Target className="h-4 w-4" />}>
              Start Survey
            </NavLink>
            <NavLink href="/sys2025" icon={<BarChart3 className="h-4 w-4" />}>
              Dashboard
            </NavLink>

            {/* Admin Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                Admin
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  adminDropdownOpen && "rotate-180"
                )} />
              </button>

              {adminDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAdminDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover p-1 shadow-lg z-50">
                    <Link
                      href="/sys2025"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/sys2025/tracks"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <Database className="h-4 w-4" />
                      All Tracks
                    </Link>
                    <Separator className="my-1" />
                    <Link
                      href="/test-password"
                      onClick={() => setAdminDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Test Password
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CTA Button - Desktop */}
          <div className="hidden md:block">
            <Link href="/placeknots">
              <Button size="sm" className="rounded-full">
                Start Annotation
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-4 py-4 space-y-1">
            <NavLink
              href="/"
              icon={<Home className="h-4 w-4" />}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              href="/placeknots"
              icon={<Target className="h-4 w-4" />}
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Survey
            </NavLink>
            <NavLink
              href="/sys2025"
              icon={<BarChart3 className="h-4 w-4" />}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>

            <Separator className="my-2" />

            <div className="text-xs font-semibold text-muted-foreground px-4 py-2">
              Admin
            </div>
            <NavLink
              href="/sys2025/tracks"
              icon={<Database className="h-4 w-4" />}
              onClick={() => setMobileMenuOpen(false)}
            >
              All Tracks
            </NavLink>
            <NavLink
              href="/test-password"
              icon={<FileText className="h-4 w-4" />}
              onClick={() => setMobileMenuOpen(false)}
            >
              Test Password
            </NavLink>

            <div className="pt-4">
              <Link href="/placeknots" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full">
                  Start Annotation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
