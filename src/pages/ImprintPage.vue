<template>
  <q-page class="page page-enter">
    <header class="page-head">
      <button class="icon-btn" type="button" :aria-label="t('common.back')" @click="goBack">
        <q-icon name="arrow_back" />
      </button>
      <div class="page-eyebrow">{{ t('legal.eyebrow') }}</div>
      <h1 class="page-title">{{ t('legal.imprint.title') }}</h1>
    </header>

    <section class="legal-section">
      <h2 class="legal-heading">{{ t('legal.imprint.s1') }}</h2>
      <p class="legal-block">
        {{ legalContact.name }}<br />
        {{ legalContact.street }}<br />
        {{ legalContact.cityLine }}<br />
        {{ legalContact.country }}
      </p>

      <h2 class="legal-heading">{{ t('legal.imprint.s2') }}</h2>
      <p class="legal-block">E-Mail: {{ legalContact.email }}</p>

      <h2 class="legal-heading">{{ t('legal.imprint.s3') }}</h2>
      <p class="legal-block">
        {{ legalContact.name }}<br />
        {{ t('legal.imprint.addressAbove') }}
      </p>

      <h2 class="legal-heading">{{ t('legal.imprint.s4') }}</h2>
      <p class="legal-block">
        {{ t('legal.imprint.dispute1') }}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr
        </a>.<br /><br />
        {{ t('legal.imprint.dispute2') }}
      </p>

      <h2 class="legal-heading">{{ t('legal.imprint.s5') }}</h2>
      <p class="legal-block">{{ t('legal.imprint.liability') }}</p>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useLegalContact } from 'src/utils/legalContact';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const legalContact = useLegalContact();

function goBack(): void {
  if (window.history.length > 1) {
    router.back();
  } else {
    void router.push('/settings');
  }
}
</script>

<style scoped>
.legal-section {
  padding: 28px 24px 40px;
}
.legal-heading {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-2);
  margin: 28px 0 8px;
}
.legal-heading:first-child {
  margin-top: 0;
}
.legal-block {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
}
.legal-block a {
  color: var(--accent-deep);
  word-break: break-all;
}
:global(body.body--dark) .legal-block a {
  color: var(--accent);
}
</style>
