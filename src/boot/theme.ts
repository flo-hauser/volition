import { Dark } from 'quasar';
import { defineBoot } from '#q-app/wrappers';

import { getStoredThemeMode } from 'src/composables/useAppPreferences';

export default defineBoot(() => {
  const mode = getStoredThemeMode();

  if (mode === 'light') {
    Dark.set(false);
    return;
  }

  if (mode === 'dark') {
    Dark.set(true);
    return;
  }

  Dark.set('auto');
});
