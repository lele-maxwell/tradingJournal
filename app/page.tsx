"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Methodology } from "@/components/landing/Methodology";
import { FolderIcon } from "@/components/icons/FolderIcon";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderIcon className="w-8 h-8 text-accent" />
            <span className="text-xl font-bold tracking-tight text-white">
              MaxStrat<span className="text-accent">.</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-text-secondary hover:text-accent transition-colors">Features</Link>
            <Link href="#methodology" className="text-sm text-text-secondary hover:text-accent transition-colors">Methodology</Link>
            <Link href="#pricing" className="text-sm text-text-secondary hover:text-accent transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-24 h-9 bg-white/5 animate-pulse rounded" />
            ) : user ? (
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
                  Dashboard
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-white/10">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-white max-w-[120px] truncate hidden sm:block">
                    {user.email}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary px-5 py-2 text-sm font-bold">
                  Join MaxStrat
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <Features />
        <Methodology />
      </main>

      <style jsx>{`
        .landing-root {
          min-height: 100vh;
          background-color: var(--bg-base);
          color: var(--text-primary);
        }
        .landing-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          display: flex;
          align-items: center;
          background: rgba(8, 8, 8, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          z-index: 100;
        }
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
      `}</style>
    </div>
  );
}
