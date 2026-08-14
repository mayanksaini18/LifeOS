"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi, ApiError } from "@/lib/api";
import { GoogleLogin } from "@/components/auth/google-login";
import { ArrowLeft01Icon, Mail01Icon } from "hugeicons-react";

type RegisterResponse = {
  ok: boolean;
  requiresVerification?: boolean;
  email: string;
  message?: string;
};

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await fetchApi<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setSentTo(data.email || email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!sentTo) return;
    setResending(true);
    setResendNote("");
    try {
      await fetchApi("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: sentTo }),
      });
      setResendNote("Sent. Check your inbox.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not resend. Try again later.";
      setResendNote(msg);
    } finally {
      setResending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Mail01Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a verification link to{" "}
            <span className="text-foreground font-medium">{sentTo}</span>. Tap it to finish creating your account.
          </p>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full h-10" onClick={handleResend} disabled={resending}>
            {resending ? "Sending…" : "Resend email"}
          </Button>
          {resendNote && (
            <p className="text-xs text-muted-foreground text-center">{resendNote}</p>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => { setSentTo(null); setResendNote(""); }}
              className="text-foreground hover:underline font-medium"
            >
              Start over
            </button>
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground pt-2">
          Already verified?{" "}
          <Link href="/login" className="text-foreground hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    );
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
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Start your wellness journey
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <GoogleLogin />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
