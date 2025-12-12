// src/composables/useEitaaWebApp.ts
import { onMounted, onUnmounted } from 'vue';
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
    };
  }

  const webapp = getEitaaWebApp()!;
  let unregisterAfterEach: (() => void) | null = null;

  /**
   * تشخیص اینکه واقعا می‌شه برگشت یا نه
   * Vue Router به طور پیش‌فرض position رو در history.state نگه می‌داره [web:26].
   */
  const canGoBack = (): boolean => {
    const state = window.history.state as
      | { back: string | null; position: number }
      | null;

    // اگر state در دسترس نیست، فرض می‌کنیم اولین صفحه است
    if (!state) return false;

    // اگر back = null باشه یعنی این اولین entry history برای SPA است [web:26]
    if (state.back === null) return false;

    // position === 0 هم یعنی اولین entry
    if (state.position === 0) return false;

    return true;
  };

  const updateBackButton = () => {
    if (canGoBack()) {
      if (!webapp.BackButton.isVisible) {
        webapp.BackButton.show();
      }
    } else {
      if (webapp.BackButton.isVisible) {
        webapp.BackButton.hide();
      }
    }
  };

  const handleBack = () => {
    if (canGoBack()) {
      router.back();
    } else {
      // اگر دیگه route قبلی نداریم، به‌جای خراب کردن history، mini-app رو ببند
      webapp.close();
    }
  };

  const setupBackButton = () => {
    // دوباره ثبت نکن اگر قبلاً set شده
    webapp.BackButton.offClick(handleBack);
    webapp.BackButton.onClick(handleBack);

    // بعد از هر navigation، وضعیت back button را sync کن
    if (unregisterAfterEach) {
      unregisterAfterEach();
    }
    unregisterAfterEach = router.afterEach(() => {
      updateBackButton();
    });

    // روی mount اولیه هم sync
    updateBackButton();
  };

  // اگر این composable داخل یک component استفاده می‌شود
  onMounted(() => {
    // در صورت نیاز می‌توانی تنظیمات عمومی اینجا انجام بدهی
    // مثل webapp.disableVerticalSwipes(), webapp.expand(), webapp.ready()
  });

  onUnmounted(() => {
    webapp.BackButton.offClick(handleBack);
    if (unregisterAfterEach) {
      unregisterAfterEach();
      unregisterAfterEach = null;
    }
  });

  return {
    webapp,
    isAvailable: true as const,
    setupBackButton,
    updateBackButton,
  };
}
