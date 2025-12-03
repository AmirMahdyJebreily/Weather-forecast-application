// models/simple-city-models.ts
import type {
  HourlyParam,
  DailyParam,
  HourlyUnits,
  DailyUnits,
  CurrentWeather,
  ForecastResponse,
  HourlyBlock,
  DailyBlock,
  AirQualityResponse, // New
  CurrentAirQuality   // New
} from './open-meteo-raw-models'

/* --- City Entity (App Domain) --- */
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

/* --- UI-Optimized Weather Models --- */

export type SimpleHourlyPoint = {
  time: string
  timeParsed?: Date
  values: Partial<Record<HourlyParam, number | null>>
}

export type SimpleDailyPoint = {
  time: string
  timeParsed?: Date
  values: Partial<Record<DailyParam, number | string | null>>
}

/** ساختار ساده شده برای کیفیت هوای لحظه‌ای (نمایش در کارت‌ها) */
export type SimpleAirQuality = {
  aqi?: number // معمولاً US AQI را نگه می‌داریم
  pm2_5?: number
  uvIndex?: number
  // هر پارامتر دیگری که در UI مهم است
  rawCurrent?: CurrentAirQuality
}

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

  // New: داده‌های ساده شده کیفیت هوا
  airQuality?: SimpleAirQuality | null
}

/* --- Cache & Storage Models --- */

export type WeatherData = {
  fetchedAt: number
  timezone?: string
  hourly?: HourlyBlock
  daily?: DailyBlock
  current?: CurrentWeather | null
  raw?: ForecastResponse

  // New: ذخیره پاسخ خام کیفیت هوا برای استفاده‌های بعدی (مثل نمودار)
  airQualityRaw?: AirQualityResponse | null
}

export type CacheEntry = {
  id: string
  data: WeatherData
  ttl: number
}

/* --- Enums --- */

export enum SettlementLevel {
  Country = 'کشور',
  Province = 'استان (ایالت)',
  Metropolis = 'کلان‌شهر',
  City = 'شهر',
  Village = 'روستا',
}
