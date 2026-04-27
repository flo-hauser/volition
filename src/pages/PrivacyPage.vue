<template>
  <q-page class="page page-enter">
    <header class="page-head">
      <button class="icon-btn" type="button" :aria-label="t('common.back')" @click="goBack">
        <q-icon name="arrow_back" />
      </button>
      <div class="page-eyebrow">{{ t('legal.eyebrow') }}</div>
      <h1 class="page-title">{{ t('legal.privacy.title') }}</h1>
    </header>

    <section class="legal-section">
      <h2 class="legal-heading">{{ t('legal.privacy.s1') }}</h2>
      <p class="legal-block">{{ t('legal.privacy.intro') }}</p>

      <h2 class="legal-heading">{{ t('legal.privacy.s2') }}</h2>
      <p class="legal-block">
        [YOUR FULL NAME]<br />
        [STREET AND HOUSE NUMBER]<br />
        [POSTAL CODE] [CITY]<br />
        {{ t('legal.privacy.country') }}<br />
        E-Mail: [YOUR EMAIL ADDRESS]
      </p>

      <h2 class="legal-heading">{{ t('legal.privacy.s3') }}</h2>
      <p class="legal-block">{{ t('legal.privacy.storedIntro') }}</p>
      <ul class="legal-list">
        <li>{{ t('legal.privacy.storedItem1') }}</li>
        <li>{{ t('legal.privacy.storedItem2') }}</li>
        <li>{{ t('legal.privacy.storedItem3') }}</li>
      </ul>
      <p class="legal-block">{{ t('legal.privacy.storedOutro') }}</p>

      <h2 class="legal-heading">{{ t('legal.privacy.s4') }}</h2>
      <ul class="legal-list">
        <li>{{ t('legal.privacy.notItem1') }}</li>
        <li>{{ t('legal.privacy.notItem2') }}</li>
        <li>{{ t('legal.privacy.notItem3') }}</li>
        <li>{{ t('legal.privacy.notItem4') }}</li>
        <li>{{ t('legal.privacy.notItem5') }}</li>
      </ul>

      <h2 class="legal-heading">{{ t('legal.privacy.s5') }}</h2>
      <p class="legal-block">{{ t('legal.privacy.localStorageText') }}</p>

      <h2 class="legal-heading">{{ t('legal.privacy.s6') }}</h2>
      <p class="legal-block">{{ t('legal.privacy.rights1') }}</p>
      <p class="legal-block">{{ t('legal.privacy.rights2') }}</p>

      <h2 class="legal-heading">{{ t('legal.privacy.s7') }}</h2>
      <p class="legal-block">{{ t('legal.privacy.changes') }}</p>

      <p class="legal-date">{{ t('legal.privacy.lastUpdated') }}</p>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();

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
  padding: 16px 24px 40px;
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
  margin-bottom: 8px;
}
.legal-list {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text);
  padding-left: 20px;
  margin-bottom: 8px;
}
.legal-date {
  margin-top: 40px;
  font-size: 12px;
  color: var(--text-3);
  font-family: var(--font-mono);
}
</style>
