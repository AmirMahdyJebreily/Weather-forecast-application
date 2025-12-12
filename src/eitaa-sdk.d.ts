// src/types/eitaa-webapp.d.ts

declare global {
  interface Window {
    Eitaa?: {
      WebApp: EitaaWebApp
    }
  }
}

export interface EitaaWebApp {
  // Properties
  initData: string
  initDataUnsafe: WebAppInitData
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: ThemeParams
  isExpanded: boolean
  isActive: boolean
  isFullscreen: boolean
  isOrientationLocked: boolean
  isWindowSecureEnabled: boolean
  bottomBarColor: string
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  isVerticalSwipesEnabled: boolean

  // Objects
  BackButton: BackButton
  MainButton: BottomButton
  SecondaryButton: BottomButton
  SettingsButton: SettingsButton
  HapticFeedback: HapticFeedback
  safeAreaInset: SafeAreaInset
  contentSafeAreaInset: ContentSafeAreaInset
  Accelerometer: Accelerometer
  DeviceOrientation: DeviceOrientation
  Gyroscope: Gyroscope

  // Methods
  isVersionAtLeast(version: string): boolean
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  setBottomBarColor(color: string): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  enableVerticalSwipes(): void
  disableVerticalSwipes(): void
  enableWindowSecure(): void
  disableWindowSecure(): void

  // Event handlers with type-safe overloads
  onEvent(eventType: 'viewportChanged', eventHandler: (params: ViewportChangedEventData) => void): void
  onEvent(eventType: 'popupClosed', eventHandler: (params: PopupClosedEventData) => void): void
  onEvent(eventType: 'qrTextReceived', eventHandler: (params: QrTextReceivedEventData) => void): void
  onEvent(eventType: 'writeAccessRequested', eventHandler: (params: WriteAccessRequestedEventData) => void): void
  onEvent(eventType: 'contactRequested', eventHandler: (params: ContactRequestedEventData) => void): void
  onEvent(eventType: 'fullscreenFailed', eventHandler: (params: FullscreenFailedEventData) => void): void
  onEvent(eventType: 'homeScreenChecked', eventHandler: (params: HomeScreenCheckedEventData) => void): void
  onEvent(
    eventType:
      | 'themeChanged'
      | 'activated'
      | 'deactivated'
      | 'safeAreaChanged'
      | 'contentSafeAreaChanged'
      | 'mainButtonClicked'
      | 'secondaryButtonClicked'
      | 'backButtonClicked'
      | 'settingsButtonClicked'
      | 'scanQrPopupClosed'
      | 'fullscreenChanged'
      | 'windowSecureChanged'
      | 'homeScreenAdded',
    eventHandler: () => void
  ): void

  offEvent(eventType: 'viewportChanged', eventHandler: (params: ViewportChangedEventData) => void): void
  offEvent(eventType: 'popupClosed', eventHandler: (params: PopupClosedEventData) => void): void
  offEvent(eventType: 'qrTextReceived', eventHandler: (params: QrTextReceivedEventData) => void): void
  offEvent(eventType: 'writeAccessRequested', eventHandler: (params: WriteAccessRequestedEventData) => void): void
  offEvent(eventType: 'contactRequested', eventHandler: (params: ContactRequestedEventData) => void): void
  offEvent(eventType: 'fullscreenFailed', eventHandler: (params: FullscreenFailedEventData) => void): void
  offEvent(eventType: 'homeScreenChecked', eventHandler: (params: HomeScreenCheckedEventData) => void): void
  offEvent(
    eventType:
      | 'themeChanged'
      | 'activated'
      | 'deactivated'
      | 'safeAreaChanged'
      | 'contentSafeAreaChanged'
      | 'mainButtonClicked'
      | 'secondaryButtonClicked'
      | 'backButtonClicked'
      | 'settingsButtonClicked'
      | 'scanQrPopupClosed'
      | 'fullscreenChanged'
      | 'windowSecureChanged'
      | 'homeScreenAdded',
    eventHandler: () => void
  ): void

  openLink(url: string, options?: OpenLinkOptions): void
  openEitaaLink(url: string): void
  showPopup(params: PopupParams, callback?: (buttonId: string | null) => void): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  showScanQrPopup(params: ScanQrPopupParams, callback?: (text: string) => boolean): void
  closeScanQrPopup(): void
  requestWriteAccess(callback?: (granted: boolean) => void): void
  requestContact(callback?: (shared: boolean, contactData?: string) => void): void
  ready(): void
  expand(): void
  close(): void
  addToHomeScreen(): void
  checkHomeScreenStatus(callback?: (status: HomeScreenStatus) => void): void
  lockOrientation(): void
  unlockOrientation(): void
  exitFullscreen(): void  // نه exitFullScreen
  requestFullscreen(): void  // نه requestFullScreen
  downloadFile(params: DownloadFileParams): void
}

// Event Data Interfaces
export interface ViewportChangedEventData {
  isStateStable: boolean
}

export interface PopupClosedEventData {
  button_id: string | null
}

export interface QrTextReceivedEventData {
  data: string
}

export interface WriteAccessRequestedEventData {
  status: 'allowed' | 'cancelled'
}

export interface ContactRequestedEventData {
  status: 'sent' | 'cancelled'
}

export interface FullscreenFailedEventData {
  error: string
}

export interface HomeScreenCheckedEventData {
  status: HomeScreenStatus
}

// Core Interfaces
export interface WebAppInitData {
  query_id?: string
  user?: WebAppUser
  chat_type?: 'private' | 'group' | 'channelOrSupergroup'
  chat_instance?: string
  start_param?: string
  auth_date: number
  device_id: string
  hash: string
}

export interface WebAppUser {
  id: number
  first_name: string
  last_name?: string
  language_code?: string
  allows_write_to_pm?: true
}

export interface ThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
  header_bg_color?: string
  accent_text_color?: string
  section_bg_color?: string
  section_header_text_color?: string
  section_separator_color?: string
  subtitle_text_color?: string
  destructive_text_color?: string
  bottom_bar_bg_color?: string
}

export interface BackButton {
  isVisible: boolean
  onClick(callback: () => void): void
  offClick(callback: () => void): void
  show(): void
  hide(): void
}

export interface SettingsButton {
  isVisible: boolean
  onClick(callback: () => void): void
  offClick(callback: () => void): void
  show(): void
  hide(): void
}

export type ButtonType = 'main' | 'secondary'
export type ButtonPosition = 'left' | 'right' | 'top' | 'bottom'

export interface BottomButton {
  type: ButtonType
  text: string
  color: string
  textColor: string
  isVisible: boolean
  isActive: boolean
  hasShineEffect: boolean
  position: ButtonPosition
  isProgressVisible: boolean

  setText(text: string): void
  onClick(callback: () => void): void
  offClick(callback: () => void): void
  show(): void
  hide(): void
  enable(): void
  disable(): void
  showProgress(leaveActive?: boolean): void
  hideProgress(): void
  setParams(params: BottomButtonParams): void
}

export interface BottomButtonParams {
  text?: string
  color?: string
  text_color?: string
  is_active?: boolean
  is_visible?: boolean
  position?: ButtonPosition
  has_shine_effect?: boolean
}

export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
export type HapticNotificationType = 'error' | 'success' | 'warning'

export interface HapticFeedback {
  impactOccurred(style: HapticImpactStyle): void
  notificationOccurred(type: HapticNotificationType): void
  selectionChanged(): void
}

export interface SafeAreaInset {
  top: number
  bottom: number
  left: number
  right: number
}

export interface ContentSafeAreaInset {
  top: number
  bottom: number
  left: number
  right: number
}

export interface Accelerometer {
  isStarted: boolean
  x: number
  y: number
  z: number
  start(params?: AccelerometerStartParams, callback?: (success: boolean) => void): void
  stop(callback?: (success: boolean) => void): void
}

export interface AccelerometerStartParams {
  refresh_rate?: number
}

export interface DeviceOrientation {
  isStarted: boolean
  absolute: boolean
  alpha: number
  beta: number
  gamma: number
  start(params?: DeviceOrientationStartParams, callback?: (success: boolean) => void): void
  stop(callback?: (success: boolean) => void): void
}

export interface DeviceOrientationStartParams {
  refresh_rate?: number
  need_absolute?: boolean
}

export interface Gyroscope {
  isStarted: boolean
  x: number
  y: number
  z: number
  start(params?: GyroscopeStartParams, callback?: (success: boolean) => void): void
  stop(callback?: (success: boolean) => void): void
}

export interface GyroscopeStartParams {
  refresh_rate?: number
}

// Options and Params Interfaces
export interface OpenLinkOptions {
  try_instant_view?: boolean
  try_browser?: boolean
}

export interface PopupParams {
  title?: string
  message: string
  buttons?: PopupButton[]
}

export type PopupButtonType = 'default' | 'ok' | 'close' | 'cancel' | 'destructive'

export interface PopupButton {
  id?: string
  type?: PopupButtonType
  text?: string
}

export interface ScanQrPopupParams {
  text?: string
}

export interface DownloadFileParams {
  url: string
  file_name: string
}

export type HomeScreenStatus = 'unsupported' | 'unknown' | 'added' | 'missed'

// Type guard functions
export function isEitaaWebAppAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.Eitaa?.WebApp
}

export function getEitaaWebApp(): EitaaWebApp | undefined {
  return window.Eitaa?.WebApp
}
