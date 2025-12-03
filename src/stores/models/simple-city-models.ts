// models/simple-city-models.ts
import type {
  HourlyParam,
  DailyParam,
  HourlyUnits,
  DailyUnits,
  CurrentWeather,
  ForecastResponse,
  HourlyBlock,
  DailyBlock
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

/** یک نقطهٔ ساعتی تمیز شده (همراه با Date پارس شده) */
export type SimpleHourlyPoint = {
  time: string
  timeParsed?: Date
  values: Partial<Record<HourlyParam, number | null>>
}

/** یک نقطهٔ روزانه تمیز شده */
export type SimpleDailyPoint = {
  time: string
  timeParsed?: Date
  values: Partial<Record<DailyParam, number | string | null>>
}

/** ساختار نهایی آب و هوا برای استفاده راحت در کامپوننت‌ها */
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

/* --- Cache & Storage Models --- */

export type WeatherData = {
  fetchedAt: number
  timezone?: string
  hourly?: HourlyBlock
  daily?: DailyBlock
  current?: CurrentWeather | null
  raw?: ForecastResponse
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
