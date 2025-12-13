// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import '../public/main.css';

import { isEitaaWebAppAvailable, getEitaaWebApp } from '@/eitaa-sdk';

const app = createApp(App);

app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount('#app');

  if (!isEitaaWebAppAvailable()) {
    return;
  }

  const webapp = getEitaaWebApp()!;

  // تنظیمات اولیه
  webapp.disableVerticalSwipes();
  webapp.expand();
  webapp.ready();

  // Handle viewport changes
  webapp.onEvent('viewportChanged', (event) => {
    if (!webapp.isExpanded && event.isStateStable) {
      webapp.expand();
    }
  });


});
