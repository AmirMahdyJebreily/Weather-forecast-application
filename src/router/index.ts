import HomeView from '@/views/home-view.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        title: 'هوا چطوره؟'
      }
    },
    {
      path: "/search-location",
      name: 'srchloc',
      component: () => import('@/views/search-view.vue'),
      meta: {
        title: 'جستجوی مکان'
      }
    }
  ],
})

export default router
