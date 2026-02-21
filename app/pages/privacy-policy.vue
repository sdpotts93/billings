<script setup lang="ts">
const title = 'Privacy Policy | Billings'
const description = 'How Billings collects, uses, and protects personal information for users in the United States and Canada.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterTitle: title,
  twitterDescription: description
})
</script>

<template>
  <main class="privacy-page">
    <section class="privacy-hero">
      <div class="privacy-shell">
        <p class="privacy-kicker">
          Last updated: February 21, 2026
        </p>
        <h1>Privacy Policy</h1>
        <p class="privacy-lede">
          Billings is built primarily for people in the United States and Canada. This page explains what
          information we collect, how we use it, and your choices.
        </p>
      </div>
    </section>

    <section class="privacy-content">
      <div class="privacy-shell">
        <h2>Information We Collect</h2>
        <p>
          We collect limited information:
        </p>
        <ul>
          <li>
            <strong>Analytics data (with consent):</strong> If you accept cookies, we load Google Tag Manager
            and collect usage data such as pages viewed, approximate device/browser information, and basic
            interaction events.
          </li>
          <li>
            <strong>Email addresses:</strong> If you submit your email to receive updates or subscribe through
            forms on this site (including the footer sign-up form), we collect and process that email address.
          </li>
          <li>
            <strong>Information you choose to submit:</strong> If you use optional interactive features
            (for example, story submissions), we collect the data you enter in those forms.
          </li>
        </ul>

        <h2>How We Use Information</h2>
        <ul>
          <li>To operate and improve the website and its resources.</li>
          <li>To understand site usage trends through analytics (only after cookie consent).</li>
          <li>To send updates to users who voluntarily provide an email address.</li>
          <li>To support user-submitted content or requests.</li>
        </ul>

        <h2>Cookies And Consent</h2>
        <p>
          We use a cookie banner to request consent for optional analytics cookies. If you do not accept,
          analytics tracking is not loaded.
        </p>

        <h2>When We Share Information</h2>
        <p>
          We may share data with service providers that help us run the site and communications, such as hosting,
          analytics, and workflow automation providers. For email submissions, data may be forwarded through our
          configured workflow/webhook processor to handle updates and subscriptions.
        </p>
        <p>
          We may also disclose information when required by law or to protect our rights and users.
        </p>

        <h2>Retention</h2>
        <p>
          We retain personal information only as long as needed for the purposes described above, unless a longer
          period is required by law.
        </p>

        <h2>United States And Canada Privacy Rights</h2>
        <p>
          Depending on where you live, you may have rights to request access to, correction of, or deletion of
          personal information we hold about you, and to withdraw consent where processing is based on consent.
          We review and respond to valid requests in line with applicable U.S. state and Canadian privacy laws.
        </p>

        <h2>Children</h2>
        <p>
          This website is not directed to children under 13, and we do not knowingly collect personal information
          from children under 13.
        </p>

        <h2>Changes To This Policy</h2>
        <p>
          We may update this policy from time to time. The date at the top shows the latest revision.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.privacy-page {
  background: var(--theme-color-muted);
  color: var(--theme-color-accent-contrast);
}

.privacy-shell {
  width: 100%;
  max-width: var(--layout-max-width);
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.privacy-hero {
  background: var(--theme-color-bg);
  color: var(--theme-color-muted);
  border-bottom: 1px solid rgb(255 255 255 / 12%);
}

.privacy-hero .privacy-shell {
  padding-top: clamp(2.5rem, 5vw, 4rem);
  padding-bottom: clamp(2rem, 4vw, 3rem);
}

.privacy-kicker {
  margin: 0;
  font-size: var(--theme-font-size-brand);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.8;
}

.privacy-hero h1 {
  margin: 0.6rem 0 0;
  font-size: clamp(2rem, 5vw, 3.5rem);
  color: var(--theme-color-text);
}

.privacy-lede {
  margin: 0.85rem 0 0;
  max-width: 68ch;
  font-size: var(--theme-font-size-body-lg);
}

.privacy-content .privacy-shell {
  padding-top: clamp(1.7rem, 3vw, 2.4rem);
  padding-bottom: clamp(2.8rem, 4vw, 3.8rem);
}

.privacy-content h2 {
  margin: 1.55rem 0 0.55rem;
  font-size: clamp(1.5rem, 2.6vw, 2rem);
  color: var(--theme-color-bg);
}

.privacy-content h2:first-of-type {
  margin-top: 0;
}

.privacy-content p {
  margin: 0.35rem 0 0;
  max-width: 72ch;
  font-size: var(--theme-font-size-body);
  line-height: 1.55;
}

.privacy-content ul {
  margin: 0.55rem 0 0;
  padding-left: 1.15rem;
  max-width: 78ch;
  display: grid;
  gap: 0.45rem;
}

.privacy-content li {
  line-height: 1.5;
}

@media screen and (max-width: 991px) {
  .privacy-shell {
    padding-inline: var(--space-4);
  }
}
</style>
