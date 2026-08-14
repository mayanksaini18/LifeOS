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
import { VerifiedBanner, AuthSuccessBanner } from "@/components/auth/verified-banner";
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
  const passwordReset = searchParams.get("reset");

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

      {verified === "1" && <VerifiedBanner />}

      {passwordReset === "1" && (
        <AuthSuccessBanner>
          Password updated. Sign in with your new password.
        </AuthSuccessBanner>
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
        <div className="rounded-lg border border-warning/30 bg-warning/8 px-4 py-3 space-y-2">
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
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
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

      <GoogleLogin />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-foreground hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
