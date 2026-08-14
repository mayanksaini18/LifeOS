import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — LifeOS",
  description:
    "The terms you agree to when using LifeOS, including what the app is not, how AI features work, and who owns what you log.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      summary="The short version: LifeOS is a wellness tracker, not healthcare. What you log stays yours. Use it kindly and it stays available."
    >
      <LegalSection heading="1. Agreement">
        <p>
          By creating an account or using LifeOS, you agree to these terms. If
          you don&apos;t agree with them, please don&apos;t use the service.
        </p>
      </LegalSection>

      <LegalSection heading="2. What LifeOS is — and isn't">
        <p>
          LifeOS is a personal tracker for habits, mood, sleep, water, fitness
          and journaling, with an assistant that helps you reflect on what you
          log. It is a self-reflection tool, nothing more.
        </p>
        <p>
          <strong>
            It is not a medical device, a healthcare service, or a substitute
            for professional care.
          </strong>{" "}
          Nothing in the app — including anything the AI assistant writes — is
          medical, psychological or professional advice. Never delay seeking
          help from a qualified professional because of something you read here.
        </p>
        <p>
          LifeOS is also not a crisis service, and nobody monitors what you
          write. If you are in danger or in crisis, contact your local emergency
          services. In India, Tele-MANAS offers free mental health support 24/7
          on <strong>14416</strong>.
        </p>
      </LegalSection>

      <LegalSection heading="3. Eligibility">
        <p>
          You must be at least 18 years old to use LifeOS.
        </p>
      </LegalSection>

      <LegalSection heading="4. Your account">
        <p>
          Give an accurate email address so you can verify your account and
          recover access. Keep your password to yourself, use one you don&apos;t
          reuse elsewhere, and tell us promptly if you suspect someone else has
          got in. You are responsible for activity that happens under your
          account. Please keep to one account per person.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>While using LifeOS, don&apos;t:</p>
        <ul>
          <li>break the law, or use the service to harm anyone;</li>
          <li>
            access another person&apos;s account, or try to obtain data that
            isn&apos;t yours;
          </li>
          <li>
            scrape the service, automate bulk access, or circumvent rate limits;
          </li>
          <li>
            probe, reverse-engineer or attack the infrastructure, or knowingly
            introduce malicious code;
          </li>
          <li>resell or redistribute the service as your own;</li>
          <li>
            use the AI features to generate harmful or illegal content, or to
            extract the underlying model.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. AI features">
        <p>
          Chat, journal analysis and weekly insights are powered by a
          third-party language model. Language models produce text that can be
          wrong, incomplete or misleading, stated just as confidently as text
          that is correct. Treat the output as a prompt for your own thinking,
          not as fact, and never as guidance on a consequential decision.
        </p>
        <p>
          These features are rate-limited per account because they cost money to
          run, and may be paused, changed or withdrawn at any time. The trackers
          work without them. What these features send to the AI provider is set
          out in the <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection heading="7. What you log stays yours">
        <p>
          You own everything you put into LifeOS. You grant us a limited,
          non-exclusive licence to store, process and display that content for
          the sole purpose of running the service for you — which includes
          sending the relevant parts to our AI provider when you use an AI
          feature. We make no other use of it: we don&apos;t publish it,
          don&apos;t sell it, and don&apos;t train anything on it. The licence
          ends when you delete the content or your account.
        </p>
      </LegalSection>

      <LegalSection heading="8. Availability">
        <p>
          LifeOS is offered free, on modest infrastructure, and maintained on a
          best-effort basis. There is no uptime guarantee. Features may change
          or be removed, and the service may be interrupted for maintenance or
          by an outage. Please export your data periodically from Settings →
          Export all data so you always hold your own copy.
        </p>
      </LegalSection>

      <LegalSection heading="9. Ending your use">
        <p>
          You can stop using LifeOS at any time and email us to have your
          account deleted. We may suspend or terminate an account that breaches
          these terms or abuses the service, and we may discontinue LifeOS
          entirely — in which case we will give reasonable notice and an
          opportunity to export your data wherever it is practical to do so.
        </p>
      </LegalSection>

      <LegalSection heading="10. Disclaimer and liability">
        <p>
          LifeOS is provided &quot;as is&quot; and &quot;as available&quot;,
          without warranties of any kind to the fullest extent permitted by
          law. We are not liable for indirect, incidental or consequential
          losses, for lost or corrupted data, or for decisions you make based on
          anything in the app, including AI output.
        </p>
        <p>
          Where liability cannot be excluded by law, our total liability to you
          is limited to the greater of the amount you paid us in the preceding
          12 months — currently nothing, as the service is free — or INR 1,000.
        </p>
      </LegalSection>

      <LegalSection heading="11. Changes to these terms">
        <p>
          We may update these terms. The date at the top reflects the current
          version, and we will notify you of material changes. Continuing to use
          LifeOS after a change means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="12. Governing law">
        <p>
          These terms are governed by the laws of India, and the competent
          courts in India have exclusive jurisdiction over any dispute arising
          from them.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact">
        <p>
          Questions about these terms? Email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
