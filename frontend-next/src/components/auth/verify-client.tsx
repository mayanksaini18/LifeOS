"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CheckmarkCircle02Icon, Alert02Icon } from "hugeicons-react";

type Status = "loading" | "success" | "error";

export function VerifyClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
          { method: "GET" }
        );
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
          setMessage(body.message || "Email verified. You can now sign in.");
        } else {
          setStatus("error");
          setMessage(body.message || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Could not reach the server. Please try again.");
      }
    })();
  }, [token]);

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      {status === "loading" && (
        <>
          <div className="h-10 w-10 rounded-full border-2 border-muted border-t-foreground animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying your email…</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckmarkCircle02Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">You&apos;re verified</h1>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
          </div>
          <Link href="/login">
            <Button className="w-full h-10">Continue to sign in</Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <Alert02Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Verification failed</h1>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
          </div>
          <div className="space-y-2">
            <Link href="/login">
              <Button variant="outline" className="w-full h-10">Back to sign in</Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Need a new link?{" "}
              <Link href="/login" className="text-foreground hover:underline font-medium">
                Sign in to request one
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
