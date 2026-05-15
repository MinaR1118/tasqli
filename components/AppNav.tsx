"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const VA_NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Proposals", href: "/proposals/new" },
  { label: "Projects", href: "/projects" },
];

const CLIENT_NAV = [{ label: "Projects", href: "/projects" }];

interface NavProps {
  role: string;
  displayName: string;
}

async function signOutAndRedirect() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
}

export function AppSidebar({ role, displayName }: NavProps) {
  const navItems = role === "client" ? CLIENT_NAV : VA_NAV;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <span className="text-xl font-semibold text-brand-500">tasqli</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer: user + sign out */}
      <div className="shrink-0 border-t border-gray-200 px-4 py-4">
        <p className="mb-3 truncate text-xs text-gray-500" title={displayName}>
          {displayName}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={signOutAndRedirect}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export function MobileTopBar({ role }: NavProps) {
  const navItems = role === "client" ? CLIENT_NAV : VA_NAV;

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <span className="text-lg font-semibold text-brand-500">tasqli</span>
        <Button variant="ghost" size="sm" onClick={signOutAndRedirect}>
          Sign out
        </Button>
      </div>
      {/* Scrollable nav row */}
      <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-3 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
