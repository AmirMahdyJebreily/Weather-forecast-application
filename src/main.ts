// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import '../public/main.css';

import { isEitaaWebAppAvailable, getEitaaWebApp } from '@/eitaa-sdk';
import { useEitaaWebApp } from './composables/useEitaaComposable';

const app = createApp(App);

app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount('#app');

  if (!isEitaaWebAppAvailable()) {
    return;
  }

  const webapp = getEitaaWebApp()!;

  webapp.disableVerticalSwipes();
  webapp.expand();
  webapp.ready();

  const { setupBackButton, updateBackButton } = useEitaaWebApp();

  setupBackButton();
  updateBackButton();
});
