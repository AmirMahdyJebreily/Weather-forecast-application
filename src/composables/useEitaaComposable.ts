// src/composables/useEitaaWebApp.ts
import { onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getEitaaWebApp, isEitaaWebAppAvailable } from '@/eitaa-sdk';

export function useEitaaWebApp() {
  const router = useRouter();

  if (!isEitaaWebAppAvailable()) {
    return {
      webapp: null,
      isAvailable: false,
    };
  }

  const webapp = getEitaaWebApp()!;

  const updateBackButton = () => {
    const canGoBack = window.history.state?.position > 0;

    if (canGoBack) {
      webapp.BackButton.show();
    } else {
      webapp.BackButton.hide();
    }
  };

  const handleBack = () => {
    if (window.history.state?.position > 0) {
      router.back();
    } else {
      webapp.close();
    }
  };

  const setupBackButton = () => {
    webapp.BackButton.onClick(handleBack);

    const unregisterGuard = router.afterEach(() => {
      updateBackButton();
    });

    onUnmounted(() => {
      webapp.BackButton.offClick(handleBack);
      unregisterGuard();
    });

    updateBackButton();
  };

  return {
    webapp,
    isAvailable: true,
    setupBackButton,
    updateBackButton,
  };
}
