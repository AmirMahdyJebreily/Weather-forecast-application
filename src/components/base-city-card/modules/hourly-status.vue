<script async setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useWeatherStore } from '@/stores/weather'
import HumidityIcon from '../../../../public/icons/humidity-svgrepo-com.svg'
import { ClockIcon } from '@heroicons/vue/24/outline'
import type { City, SimpleHourlyPoint } from '@/stores/models/simple-city-models'

const props = withDefaults(
  defineProps<{
    city: City
    rangeHours?: number
    pastHours?: number
  }>(),
  { rangeHours: 24, pastHours: 0 },
)

const hours = ref<SimpleHourlyPoint[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentVisibleIdx = ref<number | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const store = useWeatherStore()
const ui = useUiStore()

function mapWeatherCodeToFarsi(code: number) {
  // ... (همان مپ قبلی بدون تغییر) ...
  const weatherMap: Record<
    number,
    { title: string; description: string; icon_day?: number; icon_night?: number }
  > = {
    0: { title: 'صاف', description: 'صاف و بدون ابر', icon_day: 1, icon_night: 33 },
    1: { title: 'نیمه صاف', description: 'ابرهای پراکنده', icon_day: 2, icon_night: 34 },
    2: { title: 'نیمه‌ابری', description: 'آسمان نیمه‌ابری', icon_day: 3, icon_night: 35 },
    3: { title: 'ابری', description: 'آسمان کاملاً ابری', icon_day: 7, icon_night: 38 },
    45: { title: 'مه', description: 'مه روی زمین', icon_day: 11, icon_night: 11 },
    48: { title: 'مه', description: 'مه همراه با رسوب', icon_day: 11, icon_night: 11 },
    51: { title: 'باران', description: 'نم‌نم سبک', icon_day: 12, icon_night: 39 },
    53: { title: 'باران', description: 'نم‌نم متوسط', icon_day: 12, icon_night: 39 },
    55: { title: 'باران', description: 'نم‌نم شدید', icon_day: 18, icon_night: 40 },
    56: { title: 'باران یخی', description: 'یخی سبک', icon_day: 26, icon_night: 26 },
    57: { title: 'باران یخی', description: 'یخی شدید', icon_day: 26, icon_night: 26 },
    61: { title: 'باران', description: 'خفیف', icon_day: 12, icon_night: 39 },
    63: { title: 'باران', description: 'متوسط', icon_day: 18, icon_night: 40 },
    65: { title: 'باران', description: 'شدید', icon_day: 18, icon_night: 18 },
    66: { title: 'باران یخی', description: 'خفیف', icon_day: 26, icon_night: 26 },
    67: { title: 'باران یخی', description: 'شدید', icon_day: 26, icon_night: 26 },
    71: { title: 'برف', description: 'خفیف', icon_day: 22, icon_night: 22 },
    73: { title: 'برف', description: 'متوسط', icon_day: 22, icon_night: 22 },
    75: { title: 'برف', description: 'شدید', icon_day: 22, icon_night: 22 },
    77: { title: 'برف', description: 'دانه‌های برف', icon_day: 19, icon_night: 19 },
    80: { title: 'رگبار باران', description: 'خفیف', icon_day: 12, icon_night: 39 },
    81: { title: 'رگبار باران', description: 'متوسط', icon_day: 12, icon_night: 40 },
    82: { title: 'رگبار باران', description: 'شدید', icon_day: 18, icon_night: 18 },
    85: { title: 'رگبار برف', description: 'خفیف', icon_day: 21, icon_night: 43 },
    86: { title: 'رگبار برف', description: 'شدید', icon_day: 21, icon_night: 43 },
    95: {
      title: 'رعد و برق',
      description: 'بارش همراه با رعد و برق',
      icon_day: 15,
      icon_night: 15,
    },
    96: { title: 'رعد و برق', description: 'با تگرگ خفیف', icon_day: 15, icon_night: 15 },
    99: { title: 'رعد و برق', description: 'با تگرگ شدید', icon_day: 15, icon_night: 15 },
  }
  return (
    weatherMap[code] ?? {
      title: 'نامشخص',
      description: 'کد آب و هوا نامشخص',
      icon_day: 7,
      icon_night: 38,
    }
  )
}

// Helper: استخراج ساعت (عدد 0 تا 23) از رشته ایزو "YYYY-MM-DDTHH:00"
function getHourFromIso(isoTime: string): number {
  if (!isoTime) return 0
  const parts = isoTime.split('T')
  if (parts.length < 2) return 0
  return parseInt(parts[1]!.substring(0, 2), 10)
}

// Helper: استخراج تاریخ "YYYY-MM-DD" از رشته ایزو
function getDateStrFromIso(isoTime: string): string {
  if (!isoTime) return ''
  return isoTime.split('T')[0]!
}

function getWeatherIconUrl(code: number, isoTime: string) {
  const { icon_day, icon_night } = mapWeatherCodeToFarsi(code)
  const hour = getHourFromIso(isoTime)
  // فرض ساده: ۶ صبح تا ۶ عصر روز است. برای دقت بیشتر می‌توان از sunrise/sunset استفاده کرد.
  const isNight = hour < 6 || hour >= 18
  const icon = isNight ? (icon_night ?? icon_day) : (icon_day ?? icon_night)
  return `https://www.accuweather.com/assets/images/weather-icons/v2a/${icon}.svg`
}

function formatHourDisplay(isoTime: string) {
  // فقط ساعت را از رشته برمی‌داریم. چون رشته محلی است، نیازی به Intl نیست.
  const h = getHourFromIso(isoTime)
  return `${h}:00`
}

/**
 * محاسبه تاریخِ هدف بر اساس selectedDayIndex
 * selectedDayIndex=0 یعنی امروز، 1 یعنی فردا و ...
 */
function getTargetDateString(timezone: string, dayIndex: number): string {
  const now = new Date()
  // اضافه کردن روزها به زمان حال
  now.setDate(now.getDate() + dayIndex)

  // فرمت کردن به YYYY-MM-DD در تایم‌زون مقصد
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const p: Record<string, string> = {}
  parts.forEach(({ type, value }) => {
    p[type] = value
  })
  return `${p.year}-${p.month}-${p.day}`
}

/**
 * پیدا کردن "همین الان" به وقت شهر مقصد به فرمت YYYY-MM-DDTHH:00
 */
function getCurrentCityTimeIso(timezone: string): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const p: Record<string, string> = {}
  parts.forEach(({ type, value }) => {
    p[type] = value
  })

  const h = p.hour === '24' ? '00' : p.hour
  return `${p.year}-${p.month}-${p.day}T${h}:00`
}

async function loadHours() {
  debugger
  loading.value = true
  error.value = null
  try {
    const simple = await store.getSimpleForecastForCity(props.city)
    if (!simple || !simple.hourly || simple.hourly.length === 0) {
      error.value = 'دادهٔ ساعتی در دسترس نیست'
      hours.value = []
      return
    }

    // 1. پیدا کردن تاریخِ روز انتخابی (امروز/فردا/...) به وقت شهر مقصد
    const targetDateStr = getTargetDateString(props.city.timezone ?? 'UTC', ui.selectedDayIndex)

    // 2. فیلتر کردن نقاطی که تاریخشان با تاریخ هدف یکی است
    // نکته: p.time در Open-Meteo همیشه لوکال است، پس مستقیم مقایسه می‌کنیم.
    const filtered = simple.hourly.filter((p) => {
      const pDateStr = getDateStrFromIso(p.time)
      console.log(pDateStr, targetDateStr)

      return pDateStr === targetDateStr
    })

    if (filtered.length === 0) {
      // اگر برای روزهای آینده دیتا نداشتیم (مثلاً forecast_days=1 بود ولی ui.selectedDayIndex=2 بود)
      if (ui.selectedDayIndex > 0) {
        error.value = 'داده برای این روز موجود نیست'
      } else {
        error.value = 'دادهٔ ساعتی یافت نشد'
      }
      hours.value = []
      currentVisibleIdx.value = null
    } else {
      // 3. مرتب‌سازی یا چرخش لیست
      // اگر روز "امروز" (selectedDayIndex === 0) باشد، می‌خواهیم از ساعت فعلی شروع شود.
      // اگر روزهای آینده باشد، از ساعت 00:00 شروع شود (که پیش‌فرض مرتب است).

      if (ui.selectedDayIndex === 0) {
        const currentCityIso = getCurrentCityTimeIso(props.city.timezone ?? 'UTC')

        // پیدا کردن اندیس ساعت فعلی در لیست فیلتر شده
        const exactIdx = filtered.findIndex((p) => p.time === currentCityIso)

        if (exactIdx >= 0) {
          // چرخش: ساعت فعلی بیاید اول لیست
          // برش از فعلی تا آخر + برش از اول تا قبل از فعلی
          hours.value = filtered.slice(exactIdx).concat(filtered.slice(0, exactIdx))
          currentVisibleIdx.value = 0 // کارت اول، هایلایت شود
        } else {
          // اگر ساعت دقیق پیدا نشد (مثلاً ساعت فعلی از لیست رد شده یا هنوز نرسیده)،
          // نزدیک‌ترین ساعت آینده را پیدا می‌کنیم
          const currentHour = getHourFromIso(currentCityIso)
          const nextIdx = filtered.findIndex((p) => getHourFromIso(p.time) > currentHour)

          if (nextIdx >= 0) {
            hours.value = filtered.slice(nextIdx).concat(filtered.slice(0, nextIdx))
            currentVisibleIdx.value = 0
          } else {
            // اگر همه ساعات گذشته‌اند (آخر شب)، همان لیست را نشان بده
            hours.value = filtered
            currentVisibleIdx.value = null
          }
        }
      } else {
        // برای روزهای دیگر، ترتیب معمولی (۰۰:۰۰ تا ۲۳:۰۰)
        hours.value = filtered
        currentVisibleIdx.value = null // هیچ کارتی به عنوان "الان" هایلایت نشود
      }
    }
  } catch (e) {
    console.error(e)
    error.value = 'خطا در پردازش داده‌ها'
    hours.value = []
  } finally {
    loading.value = false
  }
}

// Watch for prop/store changes to reload
watch(
  () => [props.city, ui.selectedDayIndex],
  async () => {
    await loadHours()
  },
)

// load for the initial mount
await loadHours()

onMounted(async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 30))
  if (!containerRef.value) return
  containerRef.value.scrollTo({ left: 0, behavior: 'smooth' })
})
</script>

<template>
  <div class="hourly-module">
    <template v-if="loading">
      <div class="flex gap-3 overflow-x-auto py-2 px-1">
        <div
          v-for="n in 6"
          :key="n"
          class="w-28 h-36 rounded-xl bg-slate-200 animate-pulse flex-shrink-0"
        />
      </div>
    </template>

    <template v-else-if="error">
      <div
        class="flex items-center justify-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300"
      >
        <p class="text-sm text-slate-400">{{ error }}</p>
      </div>
    </template>

    <template v-else>
      <div ref="containerRef" class="overflow-x-auto -mx-1 py-2 dir-ltr-scroll">
        <TransitionGroup name="hour-fade" tag="div" class="flex gap-3 px-1">
          <div
            v-for="(h, idx) in hours"
            :key="h.time"
            class="hour-card w-28 flex-shrink-0 bg-white rounded-xl p-3 text-center shadow transition-all duration-300"
            :class="{
              'current-card ring-2 ring-sky-400 ring-offset-2':
                idx === currentVisibleIdx && ui.selectedDayIndex === 0,
            }"
          >
            <p
              class="flex items-center justify-center text-sm font-bold text-gray-500 bg-slate-100 w-2/3 rounded-3xl py-1 mb-2 gap-1 mx-auto"
            >
              <span class="pt-0.5">{{ formatHourDisplay(h.time) }}</span>
              <ClockIcon class="size-3.5" />
            </p>

            <img
              class="mx-auto size-10 mb-2 object-contain"
              :src="getWeatherIconUrl((h.values.weathercode ?? 0) as number, h.time)"
              :alt="mapWeatherCodeToFarsi((h.values.weathercode ?? 0) as number).title"
              loading="lazy"
            />

            <p dir="ltr" class="text-2xl font-bold text-slate-800 mb-1">
              {{ Math.round(h.values.temperature_2m ?? 0) }}°
            </p>

            <div class="text-xs text-gray-500 flex items-center justify-center gap-1 mt-auto">
              <HumidityIcon class="w-3.5 h-3.5 fill-slate-400" />
              <span>{{ h.values.relativehumidity_2m ?? '-' }}%</span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </template>
  </div>
</template>

<style scoped lang="css">
.hourly-module {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

/* اسکرول افقی تمیز */
.dir-rtl-scroll {
  direction: rtl; /* مهم: اسکرول بار سمت راست نماند */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* استایل کارت‌ها */
.hour-card {
  display: flex;
  flex-direction: column;
  min-height: 10rem; /* ارتفاع ثابت برای یکدستی */
}
.hour-card:hover {
  transform: translateY(-2px);
}

/* Custom Scrollbar */
.hourly-module ::-webkit-scrollbar {
  height: 6px;
}
.hourly-module ::-webkit-scrollbar-track {
  background: transparent;
}
.hourly-module ::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.hourly-module ::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* Animations */
.hour-fade-enter-active,
.hour-fade-leave-active {
  transition: all 0.3s ease;
}
.hour-fade-enter-from,
.hour-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
