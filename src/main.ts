import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '../public/main.css';

import App from './App.vue';
import router from './router';
import { isEitaaWebAppAvailable, getEitaaWebApp } from './eitaa-sdk';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Eitaa WebApp global setup
if (isEitaaWebAppAvailable()) {
  const webapp = getEitaaWebApp()!;

  webapp.disableVerticalSwipes();
  webapp.expand();
  webapp.ready();

  webapp.onEvent('viewportChanged', (event) => {
    if (!webapp.isExpanded && event.isStateStable) {
      webapp.expand();
    }
  });

  // Back button management
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

  webapp.BackButton.onClick(handleBack);
  router.afterEach(() => updateBackButton());

  // Initial check after router is ready
  router.isReady().then(() => updateBackButton());
}

app.mount('#app');
