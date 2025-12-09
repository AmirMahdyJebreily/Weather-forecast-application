import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../public/main.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')


if ((window as any).Eitaa?.WebApp) {
  const handleBack = () => {
    router.back()
  }

  const webapp = window.Eitaa.WebApp

  // غیرفعال کردن swipe عمودی برای بستن
  webapp.disableVerticalSwipes()

  // expand کردن برنامه
  webapp.expand()

  // گوش دادن به تغییرات viewport و دوباره expand کردن
  webapp.onEvent('viewportChanged', (params) => {
    if (!webapp.isExpanded) {
      webapp.expand()
    }
  })

  webapp.Eitaa.WebApp.BackButton.show()
  webapp.Eitaa.WebApp.BackButton.onClick(handleBack)

  history.pushState({ page: 'current' }, '', '')
  window.addEventListener('popstate', () => {
    handleBack()
    history.pushState({ page: 'current' }, '', '')
  })
}
