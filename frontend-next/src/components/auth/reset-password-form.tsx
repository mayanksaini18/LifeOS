"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";
import { Alert02Icon } from "hugeicons-react";

const MIN_PASSWORD_LENGTH = 6;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Checked here as well as by `required`/`minLength` so the mismatch case
    // reports before a pointless round trip.
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      // The API deliberately doesn't hand back a session, so send them to sign
      // in with what they just chose.
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
          <Alert02Icon className="h-5 w-5 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Link incomplete</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This page needs a reset token, and the link you followed didn&apos;t
            include one. Request a fresh link and use the button in that email.
          </p>
        </div>
        <Button
          render={<Link href="/forgot-password" />}
          nativeButton={false}
          className="w-full h-10"
        >
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose something you don&apos;t use anywhere else.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>New password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Confirm new password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        </div>
        <Button type="submit" className="w-full h-10" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="text-foreground hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
