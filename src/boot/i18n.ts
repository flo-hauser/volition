import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';
import { getStoredLocale } from 'src/composables/useAppPreferences';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en-US'];

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
  export interface DefineDateTimeFormat {}
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

function detectLocale(): MessageLanguages {
  const stored = getStoredLocale();

  if (stored) {
    return stored;
  }

  const browserLocale = navigator.language.toLowerCase();

  if (browserLocale.startsWith('de')) {
    return 'de-DE';
  }

  return 'en-US';
}

export default defineBoot(({ app }) => {
  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: detectLocale(),
    fallbackLocale: 'en-US',
    legacy: false,
    messages,
  });

  app.use(i18n);
});
