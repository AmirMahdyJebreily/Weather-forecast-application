import HomeView from '@/views/home-view.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { ROUTER_VIEWS } from './router-views.constant.ts'

export const views = ROUTER_VIEWS

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: ROUTER_VIEWS.HOME.path,
      name: ROUTER_VIEWS.HOME.name,
      component: HomeView,
      meta: {
        title: ''
      }
    },
    {
      path: ROUTER_VIEWS.SEARCH_LOC.path,
      name: ROUTER_VIEWS.SEARCH_LOC.name,
      component: () => import('@/views/search-view.vue'),
      meta: {
        title: 'جستجوی مکان'
      }
    },
    {
      path: ROUTER_VIEWS.ABOUTUS.path,
      name: ROUTER_VIEWS.ABOUTUS.name,
      component: () => import('@/views/about-view.vue'),
      meta: {
        title: 'دربارۀ ما'
      }
    }
  ],
})

export default router
