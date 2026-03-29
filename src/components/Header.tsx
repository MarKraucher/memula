"use client";

import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function Header({ search, onSearchChange }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <a href="/" className="text-lg font-bold text-brand">
        Memula
      </a>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Hledat..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="hidden w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand md:block"
        />

        <a
          href="/notes/new"
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Nova
        </a>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600"
          >
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? "U"}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Odhlasit se
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
