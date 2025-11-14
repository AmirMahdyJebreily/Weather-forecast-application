// stores/useWeatherStore.ts
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

/* ================= Strong Types for Open-Meteo ================= */

/**
 * شناسه شهر: lat:lon:name
 */
export type City = {
  id: string
  name: string
  country?: string
  country_code: string
  latitude: number
  longitude: number
  admin1?: string
  timezone?: string
  population?: number
}

/* --- Geocoding --- */
export type GeocodingResultItem = {
  id?: string
  name: string
  latitude: number
  longitude: number
  elevation?: number
  country?: string
  country_code?: string
  admin1?: string
  timezone?: string
  population?: number
  local_names?: Record<string, string>
  alternative_names?: string[]
}

export type GeocodingResponse = {
  results?: GeocodingResultItem[]
}

/* --- Hourly / Daily variable names (most common variables from Open-Meteo docs) --- */
export type HourlyParam =
  | 'temperature_2m'
  | 'relativehumidity_2m'
  | 'dewpoint_2m'
  | 'apparent_temperature'
  | 'precipitation'
  | 'rain'
  | 'showers'
  | 'snowfall'
  | 'snow_depth'
  | 'windspeed_10m'
  | 'winddirection_10m'
  | 'windgusts_10m'
  | 'pressure_msl'
  | 'surface_pressure'
  | 'cloudcover'
  | 'cloudcover_low'
  | 'visibility'
  | 'evapotranspiration'
  | 'weathercode'

export type DailyParam =
  | 'temperature_2m_max'
  | 'temperature_2m_min'
  | 'apparent_temperature_max'
  | 'apparent_temperature_min'
  | 'precipitation_sum'
  | 'rain_sum'
  | 'showers_sum'
  | 'snowfall_sum'
  | 'weathercode'
  | 'sunrise'
  | 'sunset'
  | 'windspeed_10m_max'
  | 'windgusts_10m_max'
  | 'precipitation_hours'

/* --- units objects returned by API --- */
export type HourlyUnits = Partial<Record<HourlyParam | 'time', string>>
export type DailyUnits = Partial<Record<DailyParam | 'time', string>>

/* --- hourly/daily blocks typed precisely --- */
export type HourlyBlock = {
  time: string[]
} & Partial<Record<HourlyParam, number[]>>

export type DailyBlock = {
  time: string[]
} & Partial<Record<DailyParam, (number | string)[]>>

/* --- current_weather block (present in many endpoints) --- */
export type CurrentWeather = {
  temperature: number
  windspeed: number
  winddirection: number
  weathercode: number
  time: string
}

/* --- Forecast response typed --- */
export type ForecastResponse = {
  latitude: number
  longitude: number
  generationtime_ms?: number
  utc_offset_seconds?: number
  timezone?: string
  timezone_abbreviation?: string
  elevation?: number
  hourly_units?: HourlyUnits
  daily_units?: DailyUnits
  hourly?: HourlyBlock
  daily?: DailyBlock
  current_weather?: CurrentWeather
  // any additional fields preserved as unknown
  [k: string]: unknown
}

/* --- app-level types --- */
export type WeatherData = {
  fetchedAt: number
  timezone?: string
  hourly?: HourlyBlock
  daily?: DailyBlock
  current?: CurrentWeather | null
  raw?: ForecastResponse
}

type CacheEntry = {
  id: string
  data: WeatherData
  ttl: number
}

/* ================= Simple / UI-friendly Open-Meteo format + helpers ================= */

/** یک نقطهٔ ساعتی ساده‌شده */
export type SimpleHourlyPoint = {
  time: string
  timeParsed?: Date
  values: Partial<Record<HourlyParam, number | null>>
}

/** یک نقطهٔ روزانه ساده‌شده */
export type SimpleDailyPoint = {
  time: string
  timeParsed?: Date
  values: Partial<Record<DailyParam, number | string | null>>
}

/** فرمت ساده برای استفادهٔ مستقیم در UI */
export type SimpleForecast = {
  latitude: number
  longitude: number
  timezone?: string
  generationtime_ms?: number
  hourlyUnits?: HourlyUnits
  dailyUnits?: DailyUnits
  current?: CurrentWeather | null
  hourly: SimpleHourlyPoint[]
  daily: SimpleDailyPoint[]
  raw?: ForecastResponse
}

/* ================= Constants & Helpers ================= */

const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'
const DB_NAME = 'weather_store_v1'
const DB_VERSION = 1
const defaultTTL = 1000 * 60 * 10 // 10 minutes

function cityIdFrom(lat: number, lon: number, name?: string) {
  return `${lat.toFixed(6)}:${lon.toFixed(6)}:${(name ?? '').replace(/\s+/g, '_')}`
}
function now() {
  return Date.now()
}

/* ===== IndexedDB tiny wrapper (no deps) ===== */

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('favorites')) db.createObjectStore('favorites', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'id2' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut<T extends Record<string, unknown>>(storeName: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T = unknown>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.get(key)
    req.onsuccess = () => resolve((req.result ?? null) as T | null)
    req.onerror = () => reject(req.error)
  })
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function idbGetAll<T = unknown>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => resolve((req.result ?? []) as T[])
    req.onerror = () => reject(req.error)
  })
}

/* ===== helpers: convert ForecastResponse -> SimpleForecast & accessors ===== */

/** تبدیل ForecastResponse -> SimpleForecast */
export function forecastToSimple(f: ForecastResponse): SimpleForecast {
  const hourlyBlock: HourlyBlock = f.hourly ?? { time: [] }
  const dailyBlock: DailyBlock = f.daily ?? { time: [] }

  const hourlyParams = (Object.keys(hourlyBlock) as (keyof HourlyBlock)[]).filter((k) => k !== 'time') as HourlyParam[]
  const dailyParams = (Object.keys(dailyBlock) as (keyof DailyBlock)[]).filter((k) => k !== 'time') as DailyParam[]

  const hourly: SimpleHourlyPoint[] = (hourlyBlock.time ?? []).map((t, i) => {
    const values: Partial<Record<HourlyParam, number | null>> = {}
    for (const p of hourlyParams) {
      const arr = hourlyBlock[p]
      const v = Array.isArray(arr) ? arr[i] : undefined
      values[p] = typeof v === 'number' ? v : (v == null ? null : Number(v))
    }
    return { time: t, timeParsed: new Date(t), values }
  })

  const daily: SimpleDailyPoint[] = (dailyBlock.time ?? []).map((t, i) => {
    const values: Partial<Record<DailyParam, number | string | null>> = {}
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

/**
 * گرفتن مقدار ساعتی از SimpleForecast
 * param: پارامتر (مثلاً 'temperature_2m')
 * target: تاریخ هدف
 * interpolate: اگر true شود بین دو نمونه خطی اینترپول می‌شود
 */
export function getHourlyValueFromSimple(
  simple: SimpleForecast,
  param: HourlyParam,
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

  let left = bestIdx,
    right = bestIdx
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

/** کمکی: اگر یک ForecastResponse دارید و می‌خواهید سریع مقدار دما را بگیرید */
export function temperatureAt(
  fr: ForecastResponse,
  paramDate: Date,
  param: HourlyParam = 'temperature_2m',
  interpolate = true
): number | null {
  const simple = forecastToSimple(fr)
  return getHourlyValueFromSimple(simple, param, paramDate, interpolate)
}


export enum SettlementLevel {
  Country = 'کشور',
  Province = 'استان (ایالت)',
  Metropolis = 'کلان‌شهر',
  City = 'شهر',
  Village = 'روستا',
}

interface Threshold {
  level: SettlementLevel;
  min: number;
  max: number;
}

const thresholds: readonly Threshold[] = [
  { level: SettlementLevel.Village, min: 100, max: 4_999 },
  { level: SettlementLevel.City, min: 5_000, max: 249_999 },
  { level: SettlementLevel.Metropolis, min: 250_000, max: Number.POSITIVE_INFINITY },
  { level: SettlementLevel.Province, min: 600_000, max: 15_000_000 },
  { level: SettlementLevel.Country, min: 15_000_001, max: Number.POSITIVE_INFINITY },
];

export function classifySettlement(population: number): SettlementLevel {
  const entry = thresholds.find(t => population >= t.min && population <= t.max);
  if (!entry) {
    return SettlementLevel.City
  }
  return entry.level;
}

/* ================= Store implementation ======== */

export const useWeatherStore = defineStore('weather', () => {
  /* state */
  const searchResults = ref<City[]>([])
  const loadingSearch = ref(false)
  const searchError = ref<string | null>(null)
  const inFlightSearchAbort = ref<AbortController | null>(null)

  const cache = reactive(new Map<string, CacheEntry>()) // in-memory mirror of IDB 'cache'
  const inFlightRequests = reactive(new Map<string, Promise<WeatherData>>())

  const favorites = ref<City[]>([])

  // async init from indexedDB (non-blocking)
  loadFromIndexedDB().catch(() => { })

  const favoriteIds = computed(() => new Set(favorites.value.map((c) => c.id)))
  const isFavorite = (city: City) => favoriteIds.value.has(city.id)

  /* ===== IndexedDB sync helpers ===== */

  async function loadFromIndexedDB(): Promise<void> {
    try {
      const favs = await idbGetAll<City>('favorites')
      favorites.value = favs ?? []

      const cached = await idbGetAll<CacheEntry>('cache')
      if (cached && cached.length) {
        for (const e of cached) cache.set(e.id, e)
      }
    } catch {
      // silent
    }
  }

  async function persistCacheEntry(entry: CacheEntry): Promise<void> {
    cache.set(entry.id, entry)
    try {
      await idbPut('cache', entry)
    } catch {
      // ignore IDB write errors
    }
  }

  async function removeCacheEntry(id: string): Promise<void> {
    cache.delete(id)
    try {
      await idbDelete('cache', id)
    } catch { }
  }

  async function persistFavorite(city: City): Promise<void> {
    const existing = favorites.value.find((f) => f.id === city.id)
    if (!existing) favorites.value.push(city)
    try {
      await idbPut('favorites', city)
    } catch (err) {
      console.error(err)
    }
  }

  async function deleteFavoriteFromDB(id: string): Promise<void> {
    const idx = favorites.value.findIndex((f) => f.id === id)
    if (idx >= 0) favorites.value.splice(idx, 1)
    try {
      await idbDelete('favorites', id)
    } catch { }
  }

  /* ===== Geocoding / search (Persian-aware) ===== */

  async function fetchGeocoding(q: string, limit = 10, language = 'en', signal?: AbortSignal, country?: string) {
    const url = `${GEOCODING_BASE}?name=${encodeURIComponent(q)}&count=${limit}&language=${language}${(country) ? '&country=' + country : ''}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`geocoding failed: ${res.status} `)
    return (await res.json()) as GeocodingResponse
  }

  function normalizePersian(input: string): string {
    if (!input) return input
    const withoutDiacritics = input.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '')
    const map: Record<string, string> = {
      ي: 'ی',
      ك: 'ک',
      ؤ: 'و',
      إ: 'ا',
      أ: 'ا',
      آ: 'ا',
      ى: 'ی',
      ة: 'ه',
      ۀ: 'ه',
      ٱ: 'ا'
    }
    let out = withoutDiacritics.replace(/./g, (ch) => map[ch] ?? ch)
    out = out.replace(/\u200c/g, '').replace(/\s+/g, ' ').trim()
    return out
  }

  function generatePersianVariants(query: string): string[] {
    const normalized = normalizePersian(query)
    const variants = new Set<string>([normalized])
    if (normalized.includes('ط')) variants.add(normalized.replace(/ط/g, 'ت'))
    // قابل گسترش (ترنسلیترها، نگارش قدیم و ...)
    return Array.from(variants)
  }

  async function searchCities(query: string, limit = 20, language = 'fa', level?: SettlementLevel) {

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
      let rawResults: GeocodingResultItem[] = json.results ?? []

      // fallback: try a few variants but cap the number of variant fetches to avoid worst-case network storm
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

      // prepare variants to match (normalized once)
      const variantsToMatch: string[] = containsPersian
        ? generatePersianVariants(query).map((s) => normalizePersian(s))
        : [query.toLowerCase()]

      // single-pass: build iran-first and others arrays while filtering + mapping
      const iranFirst: City[] = []
      const others: City[] = []

      for (let i = 0; i < (rawResults ?? []).length; i++) {
        const r = rawResults![i]!
        // drop if no admin1
        if (!r.admin1) continue

        // drop if level provided but population missing or not matching
        if (level) {
          if (r.population == null) continue
          try {
            if (classifySettlement(r.population) !== level) continue
          } catch {
            // if classifySettlement throws for any reason, skip the record safely
            continue
          }
        }

        // if not Persian-mode, accept immediately (fast path)
        if (!containsPersian) {
          const cityObj: City = {
            id: cityIdFrom(r.latitude, r.longitude, r.name),
            name: r.name,
            country: r.country,
            country_code: r.country_code,
            latitude: r.latitude,
            longitude: r.longitude,
            admin1: r.admin1,
            timezone: r.timezone,
            population: r.population
          } as City

          if (cityObj.country_code === 'IR') iranFirst.push(cityObj)
          else others.push(cityObj)

          continue
        }

        // Persian-mode: try to match name / local_names / alternative_names with early exits
        const primary = normalizePersian(r.name)
        let matched = variantsToMatch.some((v) => primary.includes(v))
        if (!matched && r.local_names) {
          // iterate local names lazily and stop on first match
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

        // matched: map and push to appropriate partition
        const cityObj: City = {
          id: cityIdFrom(r.latitude, r.longitude, r.name),
          name: r.name,
          country: r.country,
          country_code: r.country_code,
          latitude: r.latitude,
          longitude: r.longitude,
          admin1: r.admin1,
          timezone: r.timezone,
          population: r.population
        } as City

        if (cityObj.country_code === 'IR') iranFirst.push(cityObj)
        else others.push(cityObj)
      }

      const results: City[] = iranFirst.length > 0 ? iranFirst.concat(others) : others

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



  /* ===== Forecast / cache (uses typed ForecastResponse) ===== */

  function buildForecastUrl(
    lat: number,
    lon: number,
    opts?: {
      hourly?: HourlyParam[]
      daily?: DailyParam[]
      timezone?: string
      start?: string
      end?: string
      forecast_days?: number
    }
  ) {
    const hourly = (opts?.hourly ?? [
      'temperature_2m',
      'relativehumidity_2m',
      'apparent_temperature',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'windspeed_10m',
      'winddirection_10m',
      'weathercode'
    ] as HourlyParam[]).join(',')

    const daily = (opts?.daily ?? [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'weathercode',
      'sunrise',
      'sunset'
    ] as DailyParam[]).join(',')

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly,
      daily,
      timezone: opts?.timezone ?? 'auto'
    })
    if (opts?.start) params.set('start_date', opts.start)
    if (opts?.end) params.set('end_date', opts.end)
    if (typeof opts?.forecast_days === 'number') params.set('forecast_days', String(opts.forecast_days))
    return `${FORECAST_BASE}?${params.toString()} `
  }

  function cacheKeyFor(city: City) {
    return city.id
  }

  async function getWeatherForCity(city: City, opts?: { force?: boolean; ttl?: number }): Promise<WeatherData> {
    const key = cacheKeyFor(city)
    const existing = cache.get(key)
    const ttl = opts?.ttl ?? defaultTTL

    if (!opts?.force && existing && now() - existing.data.fetchedAt < existing.ttl) {
      return existing.data
    }

    // try IDB fallback if not in memory
    if (!existing) {
      try {
        const e = await idbGet<CacheEntry>('cache', key)
        if (e && now() - e.data.fetchedAt < e.ttl) {
          cache.set(key, e)
          return e.data
        }
      } catch {
        // ignore IDB read errors
      }
    }

    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key)!
    }

    const promise = (async (): Promise<WeatherData> => {
      try {
        const url = buildForecastUrl(city.latitude, city.longitude, { timezone: city.timezone ?? 'auto' })
        const res = await fetch(url)
        if (!res.ok) throw new Error(`forecast failed: ${res.status} `)
        const json = (await res.json()) as ForecastResponse

        const payload: WeatherData = {
          fetchedAt: now(),
          timezone: json.timezone ?? city.timezone,
          hourly: json.hourly,
          daily: json.daily,
          current: json.current_weather ?? null,
          raw: json
        }

        const entry: CacheEntry = { id: key, data: payload, ttl }
        await persistCacheEntry(entry)
        return payload
      } finally {
        inFlightRequests.delete(key)
      }
    })()

    inFlightRequests.set(key, promise)
    return promise
  }

  async function getSimpleForecastForCity(city: City, opts?: { force?: boolean; ttl?: number }): Promise<SimpleForecast | null> {
    const key = cacheKeyFor(city)
    // try memory first
    const existing = cache.get(key)
    if (!opts?.force && existing && now() - existing.data.fetchedAt < existing.ttl && existing.data.raw) {
      return forecastToSimple(existing.data.raw)
    }

    // try IDB fallback
    if (!existing) {
      try {
        const e = await idbGet<CacheEntry>('cache', key)
        if (e && now() - e.data.fetchedAt < e.ttl && e.data.raw) {
          cache.set(key, e)
          return forecastToSimple(e.data.raw)
        }
      } catch {
        // ignore
      }
    }

    // fetch fresh
    try {
      const w = await getWeatherForCity(city, opts)
      if (w.raw) return forecastToSimple(w.raw)
      return null
    } catch {
      return null
    }
  }

  /** گرفتن قطعات تاریخ (سال،ماه،روز،ساعت) در یک timezone مشخص */
  function getYMDH(date: Date, timeZone?: string) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timeZone ?? 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hour12: false
    }).formatToParts(date)

    let year = 0
    let month = 0
    let day = 0
    let hour = 0

    for (const p of parts) {
      if (p.type === 'year') year = Number(p.value)
      else if (p.type === 'month') month = Number(p.value) - 1
      else if (p.type === 'day') day = Number(p.value)
      else if (p.type === 'hour') hour = Number(p.value)
    }

    return { year, month, day, hour }
  }

  /** پیدا کردن اندیس ساعتِ متناظر با «همان ساعت محلی شهر مقصد» */
  function findCurrentHourIndexWithTimezone(forecast: SimpleForecast, timeZone?: string): number {
    if (!forecast.hourly || forecast.hourly.length === 0) return -1

    const now = new Date()
    const nowParts = getYMDH(now, timeZone)

    // برای هر نقطهٔ ساعتی، قطعات آن را در همان timeZone محاسبه کن و مقایسه کن
    for (let i = 0; i < forecast.hourly.length; i++) {
      const p = forecast.hourly[i]!
      // اطمینان از زمان پارس شده
      const d = p.timeParsed ?? new Date(p.time)
      const pParts = getYMDH(d, timeZone)

      if (
        pParts.year === nowParts.year &&
        pParts.month === nowParts.month &&
        pParts.day === nowParts.day &&
        pParts.hour === nowParts.hour
      ) {
        return i
      }
    }

    return -1
  }

  /* ===== Current weather helper با رعایت timezone ===== */
  async function getCurrentWeatherWithTimezone(city: City) {
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


  async function fetchWeatherForCities(cities: City[], opts?: { force?: boolean; ttl?: number }) {
    const result: Record<string, WeatherData | null> = {}
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

  async function addFavorite(city: City) {
    if (isFavorite(city)) return
    await persistFavorite(city)
  }

  async function removeFavorite(cityId: string) {
    await deleteFavoriteFromDB(cityId)
  }

  async function toggleFavorite(city: City) {
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
          const db = await openDB()
          const tx = db.transaction('favorites', 'readwrite')
          const store = tx.objectStore('favorites')
          store.clear()
          for (const f of favorites.value) store.put(f)
        } catch {
          // ignore
        }
      })()
  }

  /* ===== Cache ops & helpers ===== */

  async function removeFromCache(city: City) {
    await removeCacheEntry(cacheKeyFor(city))
  }

  async function clearCache() {
    cache.clear()
    try {
      const db = await openDB()
      const tx = db.transaction('cache', 'readwrite')
      tx.objectStore('cache').clear()
    } catch { }
  }

  async function getCachedWeatherFromDB(cityId: string): Promise<WeatherData | null> {
    try {
      const e = await idbGet<CacheEntry>('cache', cityId)
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
