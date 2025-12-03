// utils/weather-display-utils.ts

/**
 * نگاشت کدهای آب‌وهوای Open-Meteo به متن فارسی و آیکون‌ها
 */
export function mapWeatherCodeToFarsi(code: number) {
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

/**
 * دریافت ساعت از رشته ISO
 */
export function getHourFromIso(isoTime: string): number {
  if (!isoTime) return 0
  const parts = isoTime.split('T')
  if (parts.length < 2) return 0
  return parseInt(parts[1]!.substring(0, 2), 10)
}

/**
 * ساخت URL آیکون هواشناسی
 */
export function getWeatherIconUrl(code: number, isoTime: string) {
  const { icon_day, icon_night } = mapWeatherCodeToFarsi(code)
  const hour = getHourFromIso(isoTime)
  // فرض ساده: ۶ صبح تا ۶ عصر روز است
  const isNight = hour < 6 || hour >= 18
  const icon = isNight ? (icon_night ?? icon_day) : (icon_day ?? icon_night)
  return `https://www.accuweather.com/assets/images/weather-icons/v2a/${icon}.svg`
}
