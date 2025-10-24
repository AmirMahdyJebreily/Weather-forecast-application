// stores/useWeatherStore.ts
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'

/* ================= Types ================= */

export type City = {
  id: string
  name: string
  country?: string
  latitude: number
  longitude: number
  admin1?: string
  timezone?: string
  population?: number
}

export type GeocodingResultItem = {
  id?: string
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
  timezone?: string
  population?: number
  local_names?: Record<string, string>
  alternative_names?: string[]
}

export type GeocodingResponse = { results?: GeocodingResultItem[] }

export type HourlyBlock = {
  time: string[]
  [param: string]: number[] | string[] | undefined
}

export type DailyBlock = {
  time: string[]
  [param: string]: number[] | string[] | undefined
}

export type ForecastResponse = {
  latitude: number
  longitude: number
  timezone?: string
  hourly?: HourlyBlock
  daily?: DailyBlock
  [k: string]: unknown
}

export type WeatherData = {
  fetchedAt: number
  timezone?: string
  hourly?: HourlyBlock
  daily?: DailyBlock
  raw?: unknown
}

type CacheEntry = {
  id: string
  data: WeatherData
  ttl: number
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
function now() { return Date.now() }

/* ===== IndexedDB tiny wrapper (no deps) ===== */

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('favorites')) db.createObjectStore('favorites', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'id' })
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

/* ===== Store ===== */

export const useWeatherStore = defineStore('weather', () => {
  /* state */
  const searchResults = ref<City[]>([])
  const loadingSearch = ref(false)
  const searchError = ref<string | null>(null)
  const inFlightSearchAbort = ref<AbortController | null>(null)

  // in-memory cache map mirrors IndexedDB 'cache' store
  const cache = reactive(new Map<string, CacheEntry>())
  const inFlightRequests = reactive(new Map<string, Promise<WeatherData>>())

  // favorites mirrors IndexedDB 'favorites' store
  const favorites = ref<City[]>([])

  // load from IndexedDB once (async). not blocking store creation.
  loadFromIndexedDB().catch(() => { /* ignore */ })

  const favoriteIds = computed(() => new Set(favorites.value.map(c => c.id)))
  const isFavorite = (city: City) => favoriteIds.value.has(city.id)

  /* ===== IndexedDB sync helpers ===== */

  async function loadFromIndexedDB(): Promise<void> {
    try {
      const favs = await idbGetAll<City>('favorites')
      favorites.value = favs ?? []

      const cached = await idbGetAll<CacheEntry>('cache')
      if (cached && cached.length) {
        for (const e of cached) {
          cache.set(e.id, e)
        }
      }
    } catch {
      // silent failure; UI will fallback to network
      // console.warn('IDB load failed', e)
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
    try { await idbDelete('cache', id) } catch { }
  }

  async function persistFavorite(city: City): Promise<void> {
    const existing = favorites.value.find(f => f.id === city.id)
    if (!existing) favorites.value.push(city)
    try { await idbPut('favorites', city) } catch { }
  }

  async function deleteFavoriteFromDB(id: string): Promise<void> {
    const idx = favorites.value.findIndex(f => f.id === id)
    if (idx >= 0) favorites.value.splice(idx, 1)
    try { await idbDelete('favorites', id) } catch { }
  }

  /* ===== Geocoding / Search (unchanged logic) ===== */

  async function fetchGeocoding(q: string, limit = 10, language = 'en', signal?: AbortSignal) {
    const url = `${GEOCODING_BASE}?name=${encodeURIComponent(q)}&count=${limit}&language=${language}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`geocoding failed: ${res.status}`)
    return (await res.json()) as GeocodingResponse
  }

  /** حذف اعراب و نرمالایز فارسی */
  function normalizePersian(input: string): string {
    if (!input) return input
    const withoutDiacritics = input.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '')
    const map: Record<string, string> = {
      'ي': 'ی', 'ك': 'ک', 'ؤ': 'و', 'إ': 'ا', 'أ': 'ا', 'آ': 'ا',
      'ى': 'ی', 'ة': 'ه', 'ۀ': 'ه', 'ٱ': 'ا'
    }
    let out = withoutDiacritics.replace(/./g, ch => map[ch] ?? ch)
    out = out.replace(/\u200c/g, '').replace(/\s+/g, ' ').trim()
    return out
  }
  function generatePersianVariants(query: string): string[] {
    const normalized = normalizePersian(query)
    const variants = new Set<string>([normalized])
    if (normalized.includes('ط')) variants.add(normalized.replace(/ط/g, 'ت'))
    return Array.from(variants)
  }

  async function searchCities(query: string, limit = 10, language = 'en') {
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

      if (rawResults.length === 0 && containsPersian) {
        const variants = generatePersianVariants(query)
        for (const v of variants) {
          if (v === query) continue
          try {
            const r2 = await fetchGeocoding(v, limit, preferredLang, ac.signal)
            rawResults = r2.results ?? []
            if (rawResults.length > 0) break
          } catch (e: unknown) {
            if ((e as { name?: string }).name === 'AbortError') throw e
          }
        }
      }

      const variantsToMatch = containsPersian ? generatePersianVariants(query).map(s => s.toLowerCase()) : [query.toLowerCase()]

      const results: City[] = (rawResults ?? [])
        .map(r => {
          const id = cityIdFrom(r.latitude, r.longitude, r.name)
          return {
            id,
            name: r.name,
            country: r.country,
            latitude: r.latitude,
            longitude: r.longitude,
            admin1: r.admin1,
            timezone: r.timezone,
            population: r.population
          } as City
        })
        .filter((c, idx) => {
          if (!containsPersian) return true
          const r = rawResults[idx]!
          const nameLower = (r.name ?? '').toLowerCase()
          const localNames: string[] = []
          if (r.local_names) localNames.push(...Object.values(r.local_names))
          if (r.alternative_names) localNames.push(...r.alternative_names)
          const candidates = [nameLower, ...localNames.map(x => x.toLowerCase())]
          return variantsToMatch.some(v => candidates.some(s => s.includes(v)))
        })

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

  /* ===== Forecast / cache logic (persist to IDB) ===== */

  function buildForecastUrl(lat: number, lon: number, opts?: {
    hourly?: string[]; daily?: string[]; timezone?: string; start?: string; end?: string
  }) {
    const hourly = (opts?.hourly ?? [
      'temperature_2m', 'relativehumidity_2m', 'apparent_temperature', 'precipitation',
      'rain', 'showers', 'snowfall', 'windspeed_10m', 'winddirection_10m', 'weathercode'
    ]).join(',')
    const daily = (opts?.daily ?? ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'weathercode']).join(',')
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly,
      daily,
      timezone: opts?.timezone ?? 'auto'
    })
    if (opts?.start) params.set('start_date', opts.start)
    if (opts?.end) params.set('end_date', opts.end)
    return `${FORECAST_BASE}?${params.toString()}`
  }

  function cacheKeyFor(city: City) { return city.id }

  async function getWeatherForCity(city: City, opts?: { force?: boolean; ttl?: number }): Promise<WeatherData> {
    const key = cacheKeyFor(city)
    const existing = cache.get(key)
    const ttl = opts?.ttl ?? defaultTTL

    if (!opts?.force && existing && (now() - existing.data.fetchedAt) < existing.ttl) {
      return existing.data
    }

    // if not in memory, try to read from IDB as fallback before network
    if (!existing) {
      try {
        const e = await idbGet<CacheEntry>('cache', key)
        if (e && (now() - e.data.fetchedAt) < e.ttl) {
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
        if (!res.ok) throw new Error(`forecast failed: ${res.status}`)
        const json = (await res.json()) as ForecastResponse
        const payload: WeatherData = {
          fetchedAt: now(),
          timezone: json.timezone ?? city.timezone,
          hourly: json.hourly,
          daily: json.daily,
          raw: json
        }
        const entry: CacheEntry = { id: key, data: payload, ttl }
        await persistCacheEntry(entry) // persist to memory + IDB
        return payload
      } finally {
        inFlightRequests.delete(key)
      }
    })()

    inFlightRequests.set(key, promise)
    return promise
  }

  async function fetchWeatherForCities(cities: City[], opts?: { force?: boolean; ttl?: number }) {
    const result: Record<string, WeatherData | null> = {}
    await Promise.all(cities.map(async c => {
      try { result[c.id] = await getWeatherForCity(c, opts) } catch { result[c.id] = null }
    }))
    return result
  }

  /* ===== Favorites management (persist to IDB) ===== */

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
      // sync all favorites to IDB (simple approach)
      ; (async () => {
        try {
          // clear and rewrite to keep DB consistent
          const db = await openDB()
          const tx = db.transaction('favorites', 'readwrite')
          const store = tx.objectStore('favorites')
          // clear store
          store.clear()
          for (const f of favorites.value) store.put(f)
        } catch {
          // ignore
        }
      })()
  }

  /* ===== Cache ops ===== */

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
    cache.forEach((v, k) => { out[k] = { ageMs: now() - v.data.fetchedAt, ttl: v.ttl } })
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
    loadFromIndexedDB
  }
})
