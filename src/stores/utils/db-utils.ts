// utils/db-utils.ts

const DB_NAME = 'weather_store_v1'
const DB_VERSION = 1

/**
 * باز کردن دیتابیس (Internal Helper)
 * این تابع export نمی‌شود چون فقط داخلی استفاده می‌شود
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      // ایجاد آبجکت‌استورها اگر وجود ندارند
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('cache')) {
        // نکته: در کد اصلی از id2 استفاده شده بود، برای حفظ سازگاری دیتا تغییر ندادم
        db.createObjectStore('cache', { keyPath: 'id2' })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** ذخیره یا آپدیت یک آیتم */
export async function idbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** دریافت یک آیتم با کلید */
export async function idbGet<T = unknown>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.get(key)
    req.onsuccess = () => resolve((req.result ?? null) as T | null)
    req.onerror = () => reject(req.error)
  })
}

/** حذف یک آیتم */
export async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** دریافت همه آیتم‌های یک استور */
export async function idbGetAll<T = unknown>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => resolve((req.result ?? []) as T[])
    req.onerror = () => reject(req.error)
  })
}

/** پاک کردن کامل یک استور (اضافه شده برای تمیزکاری Store) */
export async function idbClear(storeName: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
