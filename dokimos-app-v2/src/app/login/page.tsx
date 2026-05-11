"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DEMO_DEFAULT_PASSWORD } from "@/lib/demoConsumerAccounts";
import { DokimosBrandBackdrop } from "@/components/dokimos/DokimosBrandBackdrop";

/** Same card shell as `PlaidSplitOnboardingLayout` (Upload your ID). */
const loginCardClass =
  "mx-auto flex w-full max-w-[520px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_40px_rgba(15,23,42,0.08)]";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/vault";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEMO_DEFAULT_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("demo-credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password. Use a demo account and password demo1234.");
        setLoading(false);
        return;
      }
      try {
        localStorage.setItem("dokimos_user", JSON.stringify({ email: email.trim() }));
      } catch {
        /* ignore */
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Sign-in failed. Is the TEE (Fastify) running?");
      setLoading(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[15px] text-slate-900 shadow-sm transition-colors focus:border-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/30";

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden font-sans">
      <DokimosBrandBackdrop />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className={loginCardClass}>
            <div className="px-6 pb-2 pt-6 text-left sm:px-8 sm:pt-8">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Back to home"
              >
                <ArrowLeft size={22} strokeWidth={2} />
              </button>
            </div>

            <div className="px-6 pb-2 pt-1 text-center sm:px-8">
              <h1 className="font-landing flex flex-wrap items-center justify-center gap-3 text-[clamp(1.5rem,4vw,1.875rem)] font-bold leading-none tracking-[-0.03em] text-slate-900">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-slate-900 text-[15px] font-bold text-white shadow-lg shadow-teal-900/40"
                  aria-hidden
                >
                  D
                </span>
                <span>Dokimos</span>
              </h1>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5">
              {error ? (
                <div className="mb-4">
                  <p className="text-left text-[13px] text-red-600" role="alert">
                    {error}
                  </p>
                </div>
              ) : null}

              <form id="dokimos-login-form" onSubmit={handleDemoSignIn} className="space-y-4">
                <div className="text-left">
                  <label htmlFor="email" className="block text-[13px] font-medium text-slate-800">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="text-left">
                  <label htmlFor="password" className="block text-[13px] font-medium text-slate-800">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </form>

              <div className="grid w-full min-w-0 grid-cols-2 gap-3 pt-6">
                <Link
                  href="/onboarding"
                  className="flex h-11 min-h-[44px] min-w-0 items-center justify-center rounded-lg border border-slate-800/80 bg-[#0F172A] text-[14px] font-semibold text-white shadow-sm transition-colors hover:border-slate-600 hover:bg-[#1e293b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2DD4BF]"
                >
                  Sign up
                </Link>
                <button
                  type="submit"
                  form="dokimos-login-form"
                  disabled={loading}
                  className={`flex h-11 min-h-[44px] min-w-0 items-center justify-center rounded-lg text-[14px] font-semibold shadow-sm transition-colors ${
                    !loading
                      ? "bg-[#2DD4BF] text-[#0f172a] hover:bg-[#26d9c4]"
                      : "cursor-not-allowed bg-slate-300 text-slate-500"
                  }`}
                >
                  {loading ? "Signing in…" : "Log in"}
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-[100dvh] w-full bg-[#0F172A]" aria-hidden>
          <DokimosBrandBackdrop />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
