function dispatchUpdateEvent(registration: ServiceWorkerRegistration): void {
  window.dispatchEvent(new CustomEvent('volition-pwa-updated', { detail: registration }));
}

function dispatchErrorEvent(error: unknown): void {
  window.dispatchEvent(new CustomEvent('volition-pwa-error', { detail: error }));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(process.env.SERVICE_WORKER_FILE)
      .then((registration) => {
        if (registration.waiting) {
          dispatchUpdateEvent(registration);
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              dispatchUpdateEvent(registration);
            }
          });
        });
      })
      .catch((error: unknown) => {
        dispatchErrorEvent(error);
      });
  });
}
