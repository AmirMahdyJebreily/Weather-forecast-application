<script setup lang="ts">
import { useRoute } from 'vue-router'
import BackButton from './components/back-button.vue'

const route = useRoute()
</script>

<template>
  <main dir="rtl" class="app-container" @contextmenu.prevent>
    <section v-if="route.name != 'home'" class="app-bar">
      <BackButton />
      <h1 class="text-slate-500 font-semibold text-lg w-full text-center">
        {{ route.meta.title ?? 'هوای من' }}
      </h1>
      <span class="w-6" />
    </section>
    <router-view v-slot="{ Component }">
      <transition :name="(route.meta.transition as string) || 'slide-up'" mode="out-in">
        <div
          class="flex flex-col items-center justify-start w-full flex-1 overflow-hidden"
          :key="route.fullPath"
        >
          <component :is="Component" :key="route.fullPath" />
        </div>
      </transition>
    </router-view>

    <!-- <footer class="text-slate-500 text-sm flex items-end justify-center">
      &copy; صنایع خلاق نسیم مهر 1404
    </footer> -->
  </main>
</template>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease-out;
  position: relative;
  width: 100%;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(-10%);
  opacity: 0;
}
</style>

<style lang="css" scoped>
.app-bar {
  @apply w-full pb-4 pt-2 px-3 flex items-center justify-between flex-none;
}
.app-container {
  @apply w-dvw max-h-dvh h-dvh pt-2 px-1 overflow-hidden flex flex-col items-center justify-start bg-white font-vazir gap-1;
}
</style>
