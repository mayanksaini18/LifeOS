"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GoogleLogin } from "@/components/auth/google-login";
import type { AuthResponse } from "@/types/user";
import { ArrowLeft01Icon } from "hugeicons-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const verifyReason = searchParams.get("reason");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(null);
    setResendNote("");
    setLoading(true);
    try {
      const data = await fetchApi<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: data.accessToken }),
      });
      setUser(data.user);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.data?.requiresVerification) {
        setNeedsVerification((err.data.email as string) || email);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!needsVerification) return;
    setResending(true);
    setResendNote("");
    try {
      await fetchApi("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: needsVerification }),
      });
      setResendNote("Sent. Check your inbox.");
    } catch (err) {
      setResendNote(err instanceof Error ? err.message : "Could not resend.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div>
        <Link
          href="/welcome"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft01Icon className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your account
        </p>
      </div>

      {verified === "1" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
          <p className="text-sm text-foreground">Email verified. Sign in to continue.</p>
        </div>
      )}

      {verified === "0" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">
            {verifyReason === "expired"
              ? "That verification link is invalid or has expired. Sign in and we'll send a new one."
              : "Missing verification token."}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {needsVerification && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 space-y-2">
          <p className="text-sm text-foreground">
            Please verify your email to continue. We sent a link to{" "}
            <span className="font-medium">{needsVerification}</span>.
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending…" : "Resend email"}
            </Button>
            {resendNote && <span className="text-xs text-muted-foreground">{resendNote}</span>}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <GoogleLogin />

      <Button
        render={<Link href="/phone-login" />}
        variant="outline"
        className="w-full h-12 border-border hover:bg-accent flex items-center justify-center gap-3"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Continue with phone
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-foreground hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
