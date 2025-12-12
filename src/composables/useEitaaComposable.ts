// src/composables/useEitaaWebApp.ts
import { onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getEitaaWebApp, isEitaaWebAppAvailable } from '@/eitaa-sdk';

export function useEitaaWebApp() {
  const router = useRouter();

  if (!isEitaaWebAppAvailable()) {
    return {
      webapp: null as null,
      isAvailable: false as const,
      setupBackButton: () => { },
      updateBackButton: () => { },
      cleanup: () => { },
    };
  }

  const webapp = getEitaaWebApp()!;
  let unregisterAfterEach: (() => void) | null = null;
  let isSetup = false;

  /**
   * تشخیص اینکه واقعاً می‌شه برگشت یا نه
   */
  const canGoBack = (): boolean => {
    const state = window.history.state as
      | { back: string | null; position: number }
      | null;

    if (!state) return false;
    if (state.back === null) return false;
    if (state.position === 0) return false;

    return true;
  };

  const updateBackButton = () => {
    const shouldShow = canGoBack();

    if (shouldShow) {
      if (!webapp.BackButton.isVisible) {
        webapp.BackButton.show();
        console.log("Back button show");

      }
    } else {
      if (webapp.BackButton.isVisible) {
        webapp.BackButton.hide();
        console.log("Back button hide");

      }
    }
  };

  const handleBack = () => {
    if (canGoBack()) {
      router.back();
    } else {
      webapp.close();
    }
  };

  /**
   * Handler برای popstate event
   * هر بار که history state تغییر می‌کنه (حتی خارج از Vue Router) صدا زده میشه
   */
  const handlePopState = () => {
    // کمی تاخیر بده تا state کامل update بشه
    requestAnimationFrame(() => {
      updateBackButton();
    });
  };

  const setupBackButton = () => {
    if (isSetup) {
      console.warn('BackButton already setup. Call cleanup() first.');
      return;
    }

    // ثبت handler دکمه back
    webapp.BackButton.offClick(handleBack);
    webapp.BackButton.onClick(handleBack);

    // ثبت Vue Router guard
    if (unregisterAfterEach) {
      unregisterAfterEach();
    }
    unregisterAfterEach = router.afterEach(() => {
      updateBackButton();
    });

    // ثبت popstate listener برای catch کردن تمام تغییرات history
    window.addEventListener('popstate', handlePopState);

    isSetup = true;

    // Initial update
    updateBackButton();
  };

  const cleanup = () => {
    if (!isSetup) return;

    webapp.BackButton.offClick(handleBack);

    if (unregisterAfterEach) {
      unregisterAfterEach();
      unregisterAfterEach = null;
    }

    window.removeEventListener('popstate', handlePopState);

    isSetup = false;
  };

  onUnmounted(() => {
    cleanup();
  });

  return {
    webapp,
    isAvailable: true as const,
    setupBackButton,
    updateBackButton,
    cleanup,
  };
}
