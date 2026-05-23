# Firebase Phone Auth — Design

**Date:** 2026-05-24
**Branch:** `feat/firebase-phone-auth`

## Goal

Add phone-number sign-in (Firebase Phone Auth + SMS OTP) as a new authentication
method, alongside the existing email/password and Google sign-in. Phone users are
full, standalone accounts identified by their phone number.

## Architecture

Mirror the existing Google login pattern exactly:

1. Frontend authenticates with Firebase (client SDK) → obtains a Firebase ID token.
2. Frontend sends `{ idToken }` to the backend.
3. Backend verifies the token with `firebase-admin` (`admin.auth().verifyIdToken`).
4. Backend finds-or-creates the local `User`, then issues its own JWT access +
   refresh tokens as `httpOnly` cookies (unchanged session model).

The only structural difference from Google: the identifier is `phone_number`
instead of `email`, and the Firebase flow requires a reCAPTCHA challenge plus a
two-step (send code → confirm code) exchange.

## Decisions

- **Account model:** Phone number is a full identifier. `email` becomes optional,
  `password` becomes optional, and a new unique+sparse `phone` field is added.
  Phone-only accounts have no email and no password.
- **UI placement:** A dedicated `/phone-login` route, linked from the Login page.
- **reCAPTCHA:** Invisible reCAPTCHA, triggered on the "Send code" button.

## Changes

### Backend

- `models/User.js`
  - `email`: remove `required: true`; keep `unique` and add `sparse: true`.
  - `password`: remove `required: true` (optional).
  - Add `phone: { type: String, unique: true, sparse: true }`.
- `controllers/authController.js`
  - New `phoneLogin`: verify ID token, read `phone_number` + `uid`, find user by
    `phone`, else create `{ phone, name: 'there', emailVerified: false }` (no
    password / email). Issue JWTs via existing `setCookieAndRespond`.
  - `setCookieAndRespond` and `getMe` responses gain a `phone` field.
- `routes/auth.js`
  - `POST /auth/phone` under the existing `authLimiter`.

### Frontend

- `types/user.ts`: `email` optional, add `phone?: string`.
- `app/(auth)/phone-login/page.tsx`: new page (mirrors `login/page.tsx`).
- `components/auth/phone-login-form.tsx`: new client component, two-step flow:
  1. **Enter number** — E.164 input → invisible `RecaptchaVerifier` →
     `signInWithPhoneNumber(auth, phone, verifier)` → store `confirmationResult`.
  2. **Enter OTP** — 6-digit input → `confirmationResult.confirm(code)` →
     `getIdToken()` → `POST /auth/phone` → `POST /api/auth/session` → `setUser`
     → `router.push("/")`.
- `components/auth/login-form.tsx`: add a "Sign in with phone" link to
  `/phone-login`.

Verified Firebase v12 API against installed typings:
`new RecaptchaVerifier(auth, containerOrId, parameters?)`,
`signInWithPhoneNumber(auth, phoneNumber, appVerifier?)`,
`confirmationResult.confirm(code)`.

## Out of scope / prerequisites (manual, in Firebase Console)

- Enable **Phone** as a sign-in provider.
- Add `localhost` and the production domain to **Authorized domains**.
- For real SMS delivery, ensure the project is on the Blaze plan / has SMS quota.
- Optionally add a **test phone number + code** for local development.

## Testing / verification

No test harness exists in either package. Verify via:
- `npm run build` (or `tsc`) in `frontend-next` — type-check the new code.
- Backend: lint/sanity-check the controller and route wiring.
- Manual: send-code → enter-OTP → redirected to dashboard (requires Console setup).
