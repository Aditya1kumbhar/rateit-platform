"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Initialize Supabase Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw new Error(authError.message);
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError("Account already exists. Please sign in.");
        } else {
          setSuccess("Account created successfully! You may now sign in (check your email for verification if required).");
          setIsSignUp(false);
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw new Error(authError.message);

        if (data.user) {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] text-[#F8FAFC]">
      <div className="w-full max-w-md bg-[#16191E] border border-[#262B33] rounded-lg p-8 shadow-2xl">
        
        <div className="mb-8 text-center">
          <h1 className="font-bold text-3xl tracking-tight mb-2">
            AEROVOLT <span className="text-[#2563EB]">ERS</span>
          </h1>
          <p className="text-sm text-[#94A3B8]">
            {isSignUp ? "Register Engineer Identity" : "Race Engineer Authentication Required"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-sm font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-500 text-sm font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
              Engineer Identity (Email)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#262B33] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#2563EB] transition-colors"
              placeholder="e.g. race.engineer@aerovolt.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
              Passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#262B33] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#2563EB] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded text-sm font-bold tracking-widest uppercase transition-colors
              ${isLoading 
                ? 'bg-[#2563EB]/50 cursor-not-allowed' 
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF]'
              }`}
          >
            {isLoading ? "Processing..." : (isSignUp ? "Register Account" : "Authorize Access")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-[#94A3B8] hover:text-white transition-colors underline underline-offset-4"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need access? Register here"}
          </button>
        </div>

      </div>
    </div>
  );
}
