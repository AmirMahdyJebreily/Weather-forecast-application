// models/open-meteo-raw-models.ts

/* --- Hourly / Daily Parameters (Weather) --- */
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

/* --- Air Quality Parameters --- */
export type AirQualityParam =
  | 'pm10'
  | 'pm2_5'
  | 'carbon_monoxide'
  | 'nitrogen_dioxide'
  | 'sulphur_dioxide'
  | 'ozone'
  | 'aerosol_optical_depth'
  | 'dust'
  | 'uv_index'
  | 'uv_index_clear_sky'
  | 'european_aqi'
  | 'us_aqi'

/* --- Units Objects --- */
export type HourlyUnits = Partial<Record<HourlyParam | 'time', string>>
export type DailyUnits = Partial<Record<DailyParam | 'time', string>>
export type AirQualityUnits = Partial<Record<AirQualityParam | 'time', string>>

/* --- Data Blocks (Raw Arrays) --- */
export type HourlyBlock = {
  time: string[]
} & Partial<Record<HourlyParam, number[]>>

export type DailyBlock = {
  time: string[]
} & Partial<Record<DailyParam, (number | string)[]>>

export type AirQualityBlock = {
  time: string[]
} & Partial<Record<AirQualityParam, number[]>>

/* --- Current Blocks --- */
export type CurrentWeather = {
  temperature: number
  windspeed: number
  winddirection: number
  weathercode: number
  time: string
}

export type CurrentAirQuality = {
  time: string
  interval: number
} & Partial<Record<AirQualityParam, number>>

/* --- Main Forecast Response --- */
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
  [k: string]: unknown
}

/* --- Air Quality Response --- */
export type AirQualityResponse = {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  hourly_units?: AirQualityUnits
  hourly?: AirQualityBlock
  current?: CurrentAirQuality
  [k: string]: unknown
}

/* --- Geocoding Raw Response --- */
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
