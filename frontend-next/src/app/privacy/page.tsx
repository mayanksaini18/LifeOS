import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — LifeOS",
  description:
    "What LifeOS stores, which services process it, and how to export or delete your data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      summary="LifeOS holds things people don't usually write down — how you slept, how you felt, what you journalled. This explains exactly what is stored, who it reaches, and what you can do about it."
    >
      <LegalSection heading="What we collect">
        <p>
          <strong>Account details.</strong> Your name, email address, and
          timezone. Your password is stored only as a bcrypt hash — we never
          hold the plaintext and cannot recover it for you. Your timezone is
          detected from your browser because every streak, reminder and daily
          total is calculated against your local midnight rather than UTC.
        </p>
        <p>
          <strong>Google sign-in.</strong> If you sign in with Google, Firebase
          passes us the email address, name and account identifier on your
          Google profile. No password is created for that account.
        </p>
        <p>
          <strong>What you track.</strong> Mood ratings and notes, sleep hours,
          water intake, workouts, habits and their check-ins, and journal
          entries. Journal entries and mood notes are free text, so they are as
          personal as you choose to make them.
        </p>
        <p>
          <strong>AI conversations.</strong> Messages you send to the assistant
          and the replies it returns, kept so a conversation survives a page
          reload.
        </p>
        <p>
          <strong>Preferences and progress.</strong> Daily goals, reminder
          times, whether email reminders are on, and your XP, level and
          challenge progress.
        </p>
        <p>
          <strong>Notification subscriptions.</strong> If you turn on browser
          notifications, the push endpoint and keys your browser issues.
        </p>
        <p>
          <strong>Technical logs.</strong> Our hosting providers keep standard
          server request logs, including IP address and browser user-agent, for
          operating the service and preventing abuse.
        </p>
      </LegalSection>

      <LegalSection heading="What we don't do">
        <ul>
          <li>
            No analytics or advertising trackers. There is no Google Analytics,
            no tracking pixel and no ad SDK in the app.
          </li>
          <li>We do not sell your data or share it for advertising.</li>
          <li>
            We do not read your journal entries or chat history, except where an
            AI feature you invoked sends them onward as described below.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          Only the two needed to keep you signed in. <strong>access_token</strong>{" "}
          is a short-lived session cookie that expires after 15 minutes, and{" "}
          <strong>jid</strong> is a refresh cookie lasting 7 days that renews
          your session without making you log in again. Both are httpOnly, so
          JavaScript cannot read them, and both are marked Secure in production.
        </p>
        <p>
          Your light/dark theme preference is kept in your browser&apos;s local
          storage and never sent to us. There are no cookies for tracking or
          advertising.
        </p>
      </LegalSection>

      <LegalSection heading="AI features — what leaves the app">
        <p>
          Three features send your data to Anthropic&apos;s Claude API for
          processing. This is the only place your entries leave our own
          infrastructure in a form tied to what you wrote:
        </p>
        <ul>
          <li>
            <strong>Assistant chat</strong> — your recent mood, sleep, water,
            fitness, habit and journal entries are summarised into the prompt so
            the assistant can answer with context about you.
          </li>
          <li>
            <strong>Journal analysis</strong> — the full text of the entry you
            ask it to analyse.
          </li>
          <li>
            <strong>Weekly insights</strong> — your aggregated statistics for
            the week.
          </li>
        </ul>
        <p>
          Anthropic processes this to generate a response and returns it to us.
          Under Anthropic&apos;s commercial terms, API inputs and outputs are
          not used to train their models. If you would rather nothing left the
          app at all, simply don&apos;t use chat, journal analysis or insights —
          every tracker works without them.
        </p>
      </LegalSection>

      <LegalSection heading="Who else processes your data">
        <p>
          Each of these is a service provider acting on our instructions, not an
          independent recipient free to reuse your data:
        </p>
        <ul>
          <li>
            <strong>MongoDB</strong> — the database where your account and
            entries are stored.
          </li>
          <li>
            <strong>Render</strong> — hosts the backend API.
          </li>
          <li>
            <strong>Vercel</strong> — hosts the web app.
          </li>
          <li>
            <strong>Google Firebase Authentication</strong> — verifies the
            token issued when you sign in with Google.
          </li>
          <li>
            <strong>Anthropic</strong> — powers the AI features described above.
          </li>
          <li>
            <strong>Resend</strong> — delivers verification and reminder emails.
          </li>
          <li>
            <strong>Your browser&apos;s push service</strong> (Google, Apple or
            Mozilla, depending on your browser) — delivers notifications if you
            enable them.
          </li>
        </ul>
        <p>
          We may also disclose data where the law requires it, or where it is
          necessary to investigate a security incident or abuse of the service.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Your entries stay for as long as your account exists, or until you
          delete them individually in the app. Refresh tokens are replaced each
          time your session renews and cleared when you log out. Email
          verification tokens expire on their own. When you ask us to delete
          your account, we remove your account record and the entries attached
          to it.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Under India&apos;s Digital Personal Data Protection Act, 2023, you can
          exercise the following — and most of them don&apos;t require asking us
          at all:
        </p>
        <ul>
          <li>
            <strong>Access and portability.</strong> Settings → Export all data
            gives you your entire history as JSON or CSV, immediately, with no
            request needed.
          </li>
          <li>
            <strong>Correction.</strong> Every entry can be edited or deleted in
            the app, and your name, goals and reminders in Settings.
          </li>
          <li>
            <strong>Erasure.</strong> There is no self-serve delete button yet.
            Email us from your registered address and we will delete your
            account and its data.
          </li>
          <li>
            <strong>Withdrawing consent.</strong> Turn off email reminders and
            push notifications in Settings, and stop using the AI features, at
            any time.
          </li>
          <li>
            <strong>Grievance redressal.</strong> Write to us at the address
            below. We aim to respond within 30 days.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Passwords are hashed with bcrypt. Session cookies are httpOnly, Secure
          and sent over HTTPS, and access tokens expire after 15 minutes.
          Authentication and AI endpoints are rate-limited per account, and
          state-changing requests are checked against an allowlist of permitted
          origins.
        </p>
        <p>
          To be straightforward with you: this is a small, independently run
          service. No system is perfectly secure, and we can&apos;t promise your
          data will never be exposed. Please use a password you don&apos;t reuse
          anywhere else.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          LifeOS is not intended for anyone under 18, and we do not knowingly
          collect data from children. If you believe a child has created an
          account, contact us and we will remove it.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          If this policy changes materially, we will tell you by email or in the
          app before the change takes effect. The date at the top always
          reflects the current version.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          For any privacy question, data request or account deletion, email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>{" "}
          from the address on your account.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
