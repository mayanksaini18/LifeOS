"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";
import { ArrowLeft01Icon, MailValidation01Icon } from "hugeicons-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      // The API answers identically for unknown addresses, so this screen must
      // too — showing "no such account" here would undo that protection.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/10">
          <MailValidation01Icon className="h-5 w-5 text-success" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If an account exists for <span className="font-medium text-foreground">{email}</span>,
            we&apos;ve sent a link to reset your password. It expires in an hour.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-foreground hover:underline font-medium"
          >
            try another address
          </button>
          .
        </p>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="outline"
          className="w-full h-10"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft01Icon className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
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
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}
