"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AuthResponse } from "@/types/user";
import { ArrowLeft01Icon } from "hugeicons-react";

// E.164: a leading "+", a non-zero country digit, then 6–14 more digits.
const E164 = /^\+[1-9]\d{6,14}$/;

export function PhoneLoginForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  function getVerifier() {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return verifierRef.current;
  }

  // Always null the ref, even if clear() throws (Firebase may have already
  // destroyed the widget) — otherwise getVerifier() would try to attach a
  // second reCAPTCHA to the same container and the user couldn't retry.
  function resetVerifier() {
    try {
      verifierRef.current?.clear();
    } catch {
      // widget already gone — nothing to clean up
    } finally {
      verifierRef.current = null;
    }
  }

  // Tear down the invisible reCAPTCHA when leaving the page.
  useEffect(() => {
    return () => {
      try {
        verifierRef.current?.clear();
      } catch {
        // widget already gone
      } finally {
        verifierRef.current = null;
      }
    };
  }, []);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim();
    if (!E164.test(trimmed)) {
      setError("Enter your number in international format, e.g. +14155552671");
      return;
    }
    setLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, trimmed, getVerifier());
      confirmationRef.current = confirmation;
      setCode("");
      setStep("otp");
      toast.success("Code sent. Check your messages.");
    } catch (err) {
      // Reset the reCAPTCHA so the user can request another code.
      resetVerifier();
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!confirmationRef.current) {
      setStep("phone");
      setError("Please request a code first.");
      return;
    }
    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(code.trim());
      const idToken = await result.user.getIdToken();

      const data = await fetchApi<AuthResponse>("/auth/phone", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: data.accessToken }),
      });
      setUser(data.user);
      toast.success("Signed in!");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeNumber() {
    setError("");
    setCode("");
    confirmationRef.current = null;
    setStep("phone");
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft01Icon className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === "phone" ? "Sign in with phone" : "Enter the code"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "phone"
            ? "We'll text you a one-time code."
            : `Sent to ${phone}`}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-2">
            <Label>Phone number</Label>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+14155552671"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? "Sending..." : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label>Verification code</Label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? "Verifying..." : "Verify & sign in"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full h-10"
            onClick={changeNumber}
            disabled={loading}
          >
            Change number
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Prefer email?{" "}
        <Link href="/login" className="text-foreground hover:underline font-medium">
          Sign in
        </Link>
      </p>

      {/* Invisible reCAPTCHA renders here. */}
      <div id="recaptcha-container" />
    </div>
  );
}
