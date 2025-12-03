// stores/useWeatherStore.ts
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

// Models
import * as OpenMeteoRaw from './models/open-meteo-raw-models'
import * as JebySimple from './models/simple-city-models'

// Utils
import * as idbUtils from './utils/db-utils'

/* ================= Constants ================= */

const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'
const DEFAULT_TTL = 1000 * 60 * 10 // 10 minutes
const DEFAULT_FORECAST_DAYS = 7

/* ================= Helpers ================= */

function cityIdFrom(lat: number, lon: number, name?: string) {
  return `${lat.toFixed(6)}:${lon.toFixed(6)}:${(name ?? '').replace(/\s+/g, '_')}`
}
function now() {
  return Date.now()
}

function getTodayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

/* ===== Forecast Conversion Helper ===== */

export function forecastToSimple(f: OpenMeteoRaw.ForecastResponse): JebySimple.SimpleForecast {
  const hourlyBlock: OpenMeteoRaw.HourlyBlock = f.hourly ?? { time: [] }
  const dailyBlock: OpenMeteoRaw.DailyBlock = f.daily ?? { time: [] }

  const hourlyParams = (Object.keys(hourlyBlock) as (keyof OpenMeteoRaw.HourlyBlock)[]).filter((k) => k !== 'time') as OpenMeteoRaw.HourlyParam[]
  const dailyParams = (Object.keys(dailyBlock) as (keyof OpenMeteoRaw.DailyBlock)[]).filter((k) => k !== 'time') as OpenMeteoRaw.DailyParam[]

  const hourly: JebySimple.SimpleHourlyPoint[] = (hourlyBlock.time ?? []).map((t, i) => {
    const values: Partial<Record<OpenMeteoRaw.HourlyParam, number | null>> = {}
    for (const p of hourlyParams) {
      const arr = hourlyBlock[p]
      const v = Array.isArray(arr) ? arr[i] : undefined
      values[p] = typeof v === 'number' ? v : (v == null ? null : Number(v))
    }
    return { time: t, timeParsed: new Date(t), values }
  })

  const daily: JebySimple.SimpleDailyPoint[] = (dailyBlock.time ?? []).map((t, i) => {
    const values: Partial<Record<OpenMeteoRaw.DailyParam, number | string | null>> = {}
    for (const p of dailyParams) {
      const arr = dailyBlock[p]
      const v = Array.isArray(arr) ? arr[i] : undefined
      values[p] = v == null ? null : v
    }
    return { time: t, timeParsed: new Date(t), values }
  })

  return {
    latitude: f.latitude,
    longitude: f.longitude,
    timezone: f.timezone,
    generationtime_ms: f.generationtime_ms,
    hourlyUnits: f.hourly_units,
    dailyUnits: f.daily_units,
    current: f.current_weather ?? null,
    hourly,
    daily,
    raw: f
  }
}

export function getHourlyValueFromSimple(
  simple: JebySimple.SimpleForecast,
  param: OpenMeteoRaw.HourlyParam,
  target: Date,
  interpolate = false
): number | null {
  const arr = simple.hourly
  if (!arr || arr.length === 0) return null

  for (const p of arr) if (!p.timeParsed) p.timeParsed = new Date(p.time)

  let bestIdx = 0
  let bestDiff = Math.abs(arr[0]!.timeParsed!.getTime() - target.getTime())
  for (let i = 1; i < arr.length; i++) {
    const d = Math.abs(arr[i]!.timeParsed!.getTime() - target.getTime())
    if (d < bestDiff) {
      bestDiff = d
      bestIdx = i
    }
  }

  const valAtBest = arr[bestIdx]!.values[param] ?? null
  if (!interpolate) return (typeof valAtBest === 'number' ? valAtBest : null)

  if (arr[bestIdx]!.timeParsed!.getTime() === target.getTime()) {
    return (typeof valAtBest === 'number' ? valAtBest : null)
  }

  let left = bestIdx, right = bestIdx
  if (arr[bestIdx]!.timeParsed!.getTime() < target.getTime()) {
    left = bestIdx
    right = Math.min(bestIdx + 1, arr.length - 1)
  } else {
    right = bestIdx
    left = Math.max(bestIdx - 1, 0)
  }

  const tL = arr[left]!.timeParsed!.getTime()
  const tR = arr[right]!.timeParsed!.getTime()
  const vL = arr[left]!.values[param]
  const vR = arr[right]!.values[param]

  if (!Number.isFinite(vL as number) || !Number.isFinite(vR as number) || tR === tL) {
    return (typeof valAtBest === 'number' ? valAtBest : null)
  }

  const frac = (target.getTime() - tL) / (tR - tL)
  return (vL as number) + ((vR as number) - (vL as number)) * frac
}

export function temperatureAt(
  fr: OpenMeteoRaw.ForecastResponse,
  paramDate: Date,
  param: OpenMeteoRaw.HourlyParam = 'temperature_2m',
  interpolate = true
): number | null {
  const simple = forecastToSimple(fr)
  return getHourlyValueFromSimple(simple, param, paramDate, interpolate)
}

/* ===== Classification Helpers ===== */

interface Threshold {
  level: JebySimple.SettlementLevel;
  min: number;
  max: number;
}

const thresholds: readonly Threshold[] = [
  { level: JebySimple.SettlementLevel.Village, min: 100, max: 4_999 },
  { level: JebySimple.SettlementLevel.City, min: 5_000, max: 249_999 },
  { level: JebySimple.SettlementLevel.Metropolis, min: 250_000, max: Number.POSITIVE_INFINITY },
  { level: JebySimple.SettlementLevel.Province, min: 600_000, max: 15_000_000 },
  { level: JebySimple.SettlementLevel.Country, min: 15_000_001, max: Number.POSITIVE_INFINITY },
];

export function classifySettlement(population: number): JebySimple.SettlementLevel {
  const entry = thresholds.find(t => population >= t.min && population <= t.max);
  if (!entry) return JebySimple.SettlementLevel.City
  return entry.level;
}

/* ================= Store Implementation ================= */

export const useWeatherStore = defineStore('weather', () => {
  /* state */
  const searchResults = ref<JebySimple.City[]>([])
  const loadingSearch = ref(false)
  const searchError = ref<string | null>(null)
  const inFlightSearchAbort = ref<AbortController | null>(null)

  const cache = reactive(new Map<string, JebySimple.CacheEntry>())
  const inFlightRequests = reactive(new Map<string, Promise<JebySimple.WeatherData>>())

  const favorites = ref<JebySimple.City[]>([])

  // async init
  loadFromIndexedDB().catch(() => { })

  const favoriteIds = computed(() => new Set(favorites.value.map((c) => c.id)))
  const isFavorite = (city: JebySimple.City) => favoriteIds.value.has(city.id)

  /* ===== IndexedDB sync helpers ===== */

  async function loadFromIndexedDB(): Promise<void> {
    try {
      // UPDATE: Use idbUtils
      const favs = await idbUtils.idbGetAll<JebySimple.City>('favorites')
      favorites.value = favs ?? []

      const cached = await idbUtils.idbGetAll<JebySimple.CacheEntry>('cache')
      if (cached && cached.length) {
        for (const e of cached) cache.set(e.id, e)
      }
    } catch { /* silent */ }
  }

  async function persistCacheEntry(entry: JebySimple.CacheEntry): Promise<void> {
    cache.set(entry.id, entry)
    try {
      // UPDATE: Use idbUtils
      await idbUtils.idbPut('cache', entry)
    } catch { /* ignore IDB write errors */ }
  }

  async function removeCacheEntry(id: string): Promise<void> {
    cache.delete(id)
    try {
      // UPDATE: Use idbUtils
      await idbUtils.idbDelete('cache', id)
    } catch { }
  }

  async function persistFavorite(city: JebySimple.City): Promise<void> {
    const existing = favorites.value.find((f) => f.id === city.id)
    if (!existing) favorites.value.push(city)
    try {
      // UPDATE: Use idbUtils
      await idbUtils.idbPut('favorites', city)
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteFavoriteFromDB(id: string): Promise<void> {
    const idx = favorites.value.findIndex((f) => f.id === id)
    if (idx >= 0) favorites.value.splice(idx, 1)
    try {
      // UPDATE: Use idbUtils
      await idbUtils.idbDelete('favorites', id)
    } catch { }
  }

  /* ===== Geocoding / search ===== */

  async function fetchGeocoding(q: string, limit = 10, language = 'en', signal?: AbortSignal, country?: string) {
    const url = `${GEOCODING_BASE}?name=${encodeURIComponent(q)}&count=${limit}&language=${language}${(country) ? '&country=' + country : ''}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`geocoding failed: ${res.status} `)
    return (await res.json()) as OpenMeteoRaw.GeocodingResponse
  }

  function normalizePersian(input: string): string {
    if (!input) return input
    const withoutDiacritics = input.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '')
    const map: Record<string, string> = {
      ي: 'ی', ك: 'ک', ؤ: 'و', إ: 'ا', أ: 'ا', آ: 'ا', ى: 'ی', ة: 'ه', ۀ: 'ه', ٱ: 'ا'
    }
    let out = withoutDiacritics.replace(/./g, (ch) => map[ch] ?? ch)
    out = out.replace(/\u200c/g, '').replace(/\s+/g, ' ').trim()
    return out
  }

  function generatePersianVariants(query: string): string[] {
    const normalized = normalizePersian(query)
    const variants = new Set<string>([normalized])
    if (normalized.includes('ط')) variants.add(normalized.replace(/ط/g, 'ت'))
    return Array.from(variants)
  }

  async function searchCities(query: string, limit = 20, language = 'fa', level?: JebySimple.SettlementLevel) {
    if (!query || query.trim().length === 0) {
      searchResults.value = []
      return []
    }

    const containsPersian = /[\u0600-\u06FF]/.test(query)
    const preferredLang = containsPersian ? 'fa' : language

    if (inFlightSearchAbort.value) inFlightSearchAbort.value.abort()
    const ac = new AbortController()
    inFlightSearchAbort.value = ac
    loadingSearch.value = true
    searchError.value = null

    try {
      const json = await fetchGeocoding(query, limit, preferredLang, ac.signal)
      let rawResults: OpenMeteoRaw.GeocodingResultItem[] = json.results ?? []

      if (rawResults.length === 0 && containsPersian) {
        const variants = generatePersianVariants(query)
        const MAX_VARIANT_FETCH = 5
        let tries = 0
        for (const v of variants) {
          if (v === query) continue
          if (++tries > MAX_VARIANT_FETCH) break
          try {
            const r2 = await fetchGeocoding(v, limit, preferredLang, ac.signal)
            rawResults = r2.results ?? []
            if (rawResults.length > 0) break
          } catch (e: unknown) {
            if ((e as { name?: string }).name === 'AbortError') throw e
          }
        }
      }

      const variantsToMatch: string[] = containsPersian
        ? generatePersianVariants(query).map((s) => normalizePersian(s))
        : [query.toLowerCase()]

      const iranFirst: JebySimple.City[] = []
      const others: JebySimple.City[] = []

      for (let i = 0; i < (rawResults ?? []).length; i++) {
        const r = rawResults![i]!
        if (!r.admin1) continue

        if (level) {
          if (r.population == null) continue
          try {
            if (classifySettlement(r.population) !== level) continue
          } catch { continue }
        }

        if (!containsPersian) {
          const cityObj: JebySimple.City = {
            id: cityIdFrom(r.latitude, r.longitude, r.name),
            name: r.name,
            country: r.country,
            country_code: r.country_code,
            latitude: r.latitude,
            longitude: r.longitude,
            admin1: r.admin1,
            timezone: r.timezone,
            population: r.population
          } as JebySimple.City

          if (cityObj.country_code === 'IR') iranFirst.push(cityObj)
          else others.push(cityObj)
          continue
        }

        const primary = normalizePersian(r.name)
        let matched = variantsToMatch.some((v) => primary.includes(v))
        if (!matched && r.local_names) {
          const values = Object.values(r.local_names)
          for (let j = 0; j < values.length && !matched; j++) {
            const ln = normalizePersian(String(values[j]))
            if (variantsToMatch.some((v) => ln.includes(v))) matched = true
          }
        }

        if (!matched && r.alternative_names) {
          for (let j = 0; j < r.alternative_names.length && !matched; j++) {
            const an = normalizePersian(String(r.alternative_names[j]))
            if (variantsToMatch.some((v) => an.includes(v))) matched = true
          }
        }

        if (!matched) continue

        const cityObj: JebySimple.City = {
          id: cityIdFrom(r.latitude, r.longitude, r.name),
          name: r.name,
          country: r.country,
          country_code: r.country_code,
          latitude: r.latitude,
          longitude: r.longitude,
          admin1: r.admin1,
          timezone: r.timezone,
          population: r.population
        } as JebySimple.City

        if (cityObj.country_code === 'IR') iranFirst.push(cityObj)
        else others.push(cityObj)
      }

      const results: JebySimple.City[] = iranFirst.length > 0 ? iranFirst.concat(others) : others
      searchResults.value = results
      return results
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return []
      searchError.value = String(err)
      searchResults.value = []
      return []
    } finally {
      loadingSearch.value = false
      inFlightSearchAbort.value = null
    }
  }

  /* ===== Forecast ===== */

  function buildForecastUrl(
    lat: number,
    lon: number,
    opts?: {
      hourly?: OpenMeteoRaw.HourlyParam[]
      daily?: OpenMeteoRaw.DailyParam[]
      timezone?: string
      start?: string
      end?: string
      forecast_days?: number
    }
  ) {
    const hourly = (opts?.hourly ?? [
      'temperature_2m', 'relativehumidity_2m', 'apparent_temperature', 'precipitation', 'rain',
      'showers', 'snowfall', 'windspeed_10m', 'winddirection_10m', 'weathercode'
    ] as OpenMeteoRaw.HourlyParam[]).join(',')

    const daily = (opts?.daily ?? [
      'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'weathercode', 'sunrise', 'sunset'
    ] as OpenMeteoRaw.DailyParam[]).join(',')

    const tz = opts?.timezone ?? 'auto'
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly,
      daily,
      timezone: tz
    })

    if (opts?.start && opts?.end) {
      params.set('start_date', opts.start)
      params.set('end_date', opts.end)
    } else {
      const days = opts?.forecast_days ?? DEFAULT_FORECAST_DAYS
      const targetTz = tz === 'auto' ? 'Asia/Tehran' : tz
      const todayStr = getTodayInTimezone(targetTz)
      const endDateStr = addDaysToDate(todayStr, days > 1 ? days - 1 : 0)

      params.set('start_date', todayStr)
      params.set('end_date', endDateStr)
    }

    return `${FORECAST_BASE}?${params.toString()}`
  }

  function cacheKeyFor(city: JebySimple.City) {
    return city.id
  }

  async function getWeatherForCity(city: JebySimple.City, opts?: { force?: boolean; ttl?: number }): Promise<JebySimple.WeatherData> {
    const key = cacheKeyFor(city)
    const existing = cache.get(key)
    const ttl = opts?.ttl ?? DEFAULT_TTL

    if (!opts?.force && existing && now() - existing.data.fetchedAt < existing.ttl) {
      return existing.data
    }

    // try IDB
    if (!existing) {
      try {
        // UPDATE: Use idbUtils
        const e = await idbUtils.idbGet<JebySimple.CacheEntry>('cache', key)
        if (e && now() - e.data.fetchedAt < e.ttl) {
          cache.set(key, e)
          return e.data
        }
      } catch { /* ignore */ }
    }

    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key)!
    }

    const promise = (async (): Promise<JebySimple.WeatherData> => {
      try {
        const url = buildForecastUrl(city.latitude, city.longitude, { timezone: city.timezone ?? 'auto' })
        const res = await fetch(url)
        if (!res.ok) throw new Error(`forecast failed: ${res.status} `)
        const json = (await res.json()) as OpenMeteoRaw.ForecastResponse

        const payload: JebySimple.WeatherData = {
          fetchedAt: now(),
          timezone: json.timezone ?? city.timezone,
          hourly: json.hourly,
          daily: json.daily,
          current: json.current_weather ?? null,
          raw: json
        }

        const entry: JebySimple.CacheEntry = { id: key, data: payload, ttl }
        await persistCacheEntry(entry)
        return payload
      } finally {
        inFlightRequests.delete(key)
      }
    })()

    inFlightRequests.set(key, promise)
    return promise
  }

  async function getSimpleForecastForCity(city: JebySimple.City, opts?: { force?: boolean; ttl?: number }): Promise<JebySimple.SimpleForecast | null> {
    const key = cacheKeyFor(city)
    const existing = cache.get(key)
    if (!opts?.force && existing && now() - existing.data.fetchedAt < existing.ttl && existing.data.raw) {
      return forecastToSimple(existing.data.raw)
    }

    if (!existing) {
      try {
        // UPDATE: Use idbUtils
        const e = await idbUtils.idbGet<JebySimple.CacheEntry>('cache', key)
        if (e && now() - e.data.fetchedAt < e.ttl && e.data.raw) {
          cache.set(key, e)
          return forecastToSimple(e.data.raw)
        }
      } catch { /* ignore */ }
    }

    try {
      const w = await getWeatherForCity(city, opts)
      if (w.raw) return forecastToSimple(w.raw)
      return null
    } catch {
      return null
    }
  }

  /* ===== Timezone Helpers ===== */

  function findCurrentHourIndexWithTimezone(forecast: JebySimple.SimpleForecast, timeZone?: string): number {
    if (!forecast.hourly || forecast.hourly.length === 0) return -1

    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone ?? 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', hour12: false, minute: '2-digit'
    }).formatToParts(now)

    const p: Record<string, string> = {}
    parts.forEach(({ type, value }) => { p[type] = value })

    const targetHour = p.hour === '24' ? '00' : p.hour
    const targetPrefix = `${p.year}-${p.month}-${p.day}T${targetHour}:00`

    for (let i = 0; i < forecast.hourly.length; i++) {
      const timeStr = forecast.hourly[i]!.time
      if (timeStr === targetPrefix) {
        return i
      }
    }
    return -1
  }

  async function getCurrentWeatherWithTimezone(city: JebySimple.City) {
    const simple = await getSimpleForecastForCity(city)
    if (!simple) return null

    const idx = findCurrentHourIndexWithTimezone(simple, city.timezone)
    if (idx < 0) return null

    const point = simple.hourly[idx]!
    return {
      temperature: point.values.temperature_2m ?? 0,
      humidity: point.values.relativehumidity_2m ?? 0,
      windspeed: point.values.windspeed_10m ?? 0,
      weatherCode: point.values.weathercode ?? 0,
      index: idx
    }
  }

  async function fetchWeatherForCities(cities: JebySimple.City[], opts?: { force?: boolean; ttl?: number }) {
    const result: Record<string, JebySimple.WeatherData | null> = {}
    await Promise.all(
      cities.map(async (c) => {
        try {
          result[c.id] = await getWeatherForCity(c, opts)
        } catch {
          result[c.id] = null
        }
      })
    )
    return result
  }

  /* ===== Favorites (persisted) ===== */

  async function addFavorite(city: JebySimple.City) {
    if (isFavorite(city)) return
    await persistFavorite(city)
  }

  async function removeFavorite(cityId: string) {
    await deleteFavoriteFromDB(cityId)
  }

  async function toggleFavorite(city: JebySimple.City) {
    if (isFavorite(city)) await removeFavorite(city.id)
    else await addFavorite(city)
  }

  function reorderFavorites(from: number, to: number) {
    const arr = favorites.value
    if (from === to) return
    if (from < 0 || from >= arr.length) return
    const item = arr.splice(from, 1)[0]!
    const toIndex = Math.max(0, Math.min(to, arr.length))
    arr.splice(toIndex, 0, item)
      // sync favorites snapshot to IDB (simple approach)
      ; (async () => {
        try {
          // UPDATE: Use idbUtils
          await idbUtils.idbClear('favorites')
          for (const f of favorites.value) await idbUtils.idbPut('favorites', f)
        } catch { /* ignore */ }
      })()
  }

  /* ===== Cache ops & helpers ===== */

  async function removeFromCache(city: JebySimple.City) {
    await removeCacheEntry(cacheKeyFor(city))
  }

  async function clearCache() {
    cache.clear()
    try {
      // UPDATE: Use idbUtils
      await idbUtils.idbClear('cache')
    } catch { }
  }

  async function getCachedWeatherFromDB(cityId: string): Promise<JebySimple.WeatherData | null> {
    try {
      // UPDATE: Use idbUtils
      const e = await idbUtils.idbGet<JebySimple.CacheEntry>('cache', cityId)
      return e ? e.data : null
    } catch {
      return null
    }
  }

  function cacheSnapshot() {
    const out: Record<string, { ageMs: number; ttl: number }> = {}
    cache.forEach((v, k) => {
      out[k] = { ageMs: now() - v.data.fetchedAt, ttl: v.ttl }
    })
    return out
  }

  /* ===== Return public API ===== */

  return {
    // state
    searchResults,
    loadingSearch,
    searchError,
    favorites,
    // getters
    isFavorite,
    // actions
    searchCities,
    getWeatherForCity,
    getSimpleForecastForCity,
    fetchWeatherForCities,
    // favorites
    addFavorite,
    removeFavorite,
    toggleFavorite,
    reorderFavorites,
    // cache
    removeFromCache,
    clearCache,
    getCachedWeatherFromDB,
    cacheSnapshot,
    // admin
    loadFromIndexedDB,
    // helpers (exposed for UI convenience)
    forecastToSimple,
    getHourlyValueFromSimple,
    temperatureAt,
    getCurrentWeatherWithTimezone
  }
})
