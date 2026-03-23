"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-xl border bg-white dark:bg-zinc-900 p-6">
        <h1 className="text-lg font-semibold mb-4">Admin Login</h1>
        <div className="space-y-3">
          <label className="block text-sm">
            <div className="text-zinc-700 dark:text-zinc-300 mb-1">Email</div>
            <input
              className="w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-950"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm">
            <div className="text-zinc-700 dark:text-zinc-300 mb-1">Password</div>
            <input
              className="w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-950"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button
            type="button"
            className="w-full rounded-md bg-black text-white py-2"
            onClick={() => {
              void (async () => {
                setLoading(true);
                setError(null);
                try {
                  const supabase = createClient();
                  const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                  });

                  if (error) {
                    setError(error.message);
                    return;
                  }

                  window.location.href = "/dashboard";
                } finally {
                  setLoading(false);
                }
              })();
            }}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

