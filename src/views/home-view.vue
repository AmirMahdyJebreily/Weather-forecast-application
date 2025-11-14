<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import BaseCityCard from '@/components/base-city-card/base-city-card.vue'
import { MapPinIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { useScrollShrink } from '@/composables/useScrollShrink'

const store = useWeatherStore()

const el = useTemplateRef('scroller')

enum HomePageScrollShrinks {
  MAX_HEIGHT = 200,
  MIN_HEIGHT = 75,
  MAX_SCROLL = 100,
}

const { height } = useScrollShrink(
  el,
  HomePageScrollShrinks.MAX_HEIGHT,
  HomePageScrollShrinks.MIN_HEIGHT,
  HomePageScrollShrinks.MAX_SCROLL,
)

const headerStyle = computed(() => ({
  height: height.value ? height.value.toFixed(2) + 'px' : '100%',
}))

let timeout = -1
onMounted(async () => {
  if (el.value) {
    el.value.addEventListener('scroll', () => {
      el.value!.classList.add('scrollbar-visible')
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        el.value!.classList.remove('scrollbar-visible')
      }, 800)
    })
  }
})
</script>

<template>
  <header
    v-if="store.favorites.length > 0"
    class="w-full container flex-col flex gap-2 items-center will-change-scroll justify-center pb-4"
    :style="headerStyle"
  >
    <h1
      class="header-title text-2xl sm:text-3xl font-extrabold text-slate-700 [container-type:height] [&:container(height>150px)]:text-4xl [&:container(height>200px)]:text-5xl"
    >
      هوا چطوره ؟
    </h1>
    <h2
      class="header-time text-lg sm:text-xl font-medium text-slate-600 [container-type:height] [&:container(height>150px)]:text-2xl [&:container(height>200px)]:text-3xl"
    >
      {{
        new Date().toLocaleDateString('fa-IR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        })
      }}، ساعت
      {{
        new Date().toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      }}
    </h2>
  </header>

  <div
    ref="scroller"
    class="w-full flex flex-col scroll-py-2 items-center justify-start bg-gray-200 gap-3 flex-1 h-full overflow-auto p-4 scrollbar-mobile rounded-3xl border-8 border-slate-200"
  >
    <BaseCityCard
      v-for="value in store.favorites"
      :key="value.id"
      :city="value"
      module="now-status"
    >
      <template #actions
        ><button
          @click="store.toggleFavorite(value)"
          class="flex items-center justify-center flex-none p-2 rounded-full bg-rose-200/20"
        >
          <TrashIcon class="size-5 text-rose-600" /></button
      ></template>
    </BaseCityCard>
    <div
      class="flex flex-col items-center justify-center gap-1 h-4/5 text-slate-500/80"
      v-if="store.favorites.length < 1 && !store.loadingSearch"
    >
      <MapPinIcon class="size-20" />
      <span class="text-3xl font-bold">مکانی نیست!</span>
      <span class="text-xl font-light">مکانی انتخاب کنید...</span>
    </div>

    <div class="flex flex-col items-center justify-center gap-1 w-full" v-if="store.loadingSearch">
      <span class="bg-slate-300/60 animate-pulse rounded-3xl h-[174px] w-full"></span>
    </div>

    <RouterLink
      :to="{ name: 'srchloc' }"
      :class="`fixed flex items-center !transition-[left] duration-1000 justify-center size-14 bg-gradient-to-t from-slate-400/50 shadow-lg shadow-slate-4/7000 backdrop-blur-md to-slate-300/50 rounded-full bottom-12 ${!(store.favorites.length < 1 && !store.loadingSearch) ? 'left-6' : 'before:absolute before:rounded-full before:animate-ping animate-bounce z-50 before:bg-gray-100/50 before:z-40 before:size-full'} text-slate-600`"
    >
      <PlusIcon class="size-7" />
    </RouterLink>
  </div>
</template>

<style lang="css" scoped>
/* ابتدا کانتینر را تعریف می‌کنیم */
header {
  container-type: size; /* حتما باید این را داشته باشیم تا container query فعال شود */
}

/* استایل پیش‌فرض برای h1 و h2 */
.header-title {
  font-size: 1.5rem; /* برای ارتفاع کم */
  transition:
    font-size 0.2s ease,
    margin 0.2s ease;
}

.header-time {
  font-size: 1rem;
  transition:
    font-size 0.2s ease,
    margin 0.2s ease;
}

/* وقتی ارتفاع container حداقل 100px باشد */
@container (min-height: 100px) {
  .header-title {
    font-size: 2rem;
  }

  .header-time {
    font-size: 1.25rem;
  }
}

/* وقتی ارتفاع container حداقل 150px باشد */
@container (min-height: 150px) {
  .header-title {
    font-size: 2.5rem;
  }

  .header-time {
    font-size: 1.5rem;
  }
}

/* وقتی ارتفاع container حداقل 200px باشد */
@container (min-height: 200px) {
  .header-title {
    font-size: 3rem;
  }

  .header-time {
    font-size: 1.75rem;
  }
}
</style>
