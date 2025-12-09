interface Window {
  Eitaa?: {
    WebApp: EitaaWebApp
  }
}

interface EitaaWebApp {
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
  onEvent(eventType: EitaaEventType, eventHandler: (params?: any) => void): void
  offEvent(eventType: EitaaEventType, eventHandler: (params?: any) => void): void
  openLink(url: string, options?: OpenLinkOptions): void
  openEitaaLink(url: string): void
  showPopup(params: PopupParams, callback?: (buttonId: string | null) => void): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  showScanQrPopup(params: ScanQrPopupParams, callback?: (text: string) => boolean): void
  closeScanQrPopup(): void
  requestWriteAccess(callback?: (granted: boolean) => void): void
  requestContact(callback?: (shared: boolean) => void): void
  ready(): void
  expand(): void
  close(): void
  addToHomeScreen(): void
  checkHomeScreenStatus(callback?: (status: HomeScreenStatus) => void): void
  lockOrientation(): void
  unlockOrientation(): void
  exitFullScreen(): void
  requestFullScreen(): void
  downloadFile(params: DownloadFileParams): void
}

interface ThemeParams {
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

interface WebAppInitData {
  query_id?: string
  user?: WebAppUser
  chat_type?: 'private' | 'group' | 'channelOrSupergroup'
  chat_instance?: string
  start_param?: string
  auth_date: number
  device_id: string
  hash: string
}

interface WebAppUser {
  id: number
  first_name: string
  last_name?: string
  language_code?: string
  allows_write_to_pm?: true
}

interface PopupParams {
  title?: string
  message: string
  buttons?: PopupButton[]
}

interface PopupButton {
  id?: string
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
  text?: string
}

interface ScanQrPopupParams {
  text?: string
}

interface OpenLinkOptions {
  try_instant_view?: boolean
  try_browser?: boolean
}

interface DownloadFileParams {
  url: string
  file_name: string
}

interface BackButton {
  isVisible: boolean
  onClick(callback: () => void): void
  offClick(callback: () => void): void
  show(): void
  hide(): void
}

interface BottomButton {
  type: 'main' | 'secondary'
  text: string
  color: string
  textColor: string
  isVisible: boolean
  isActive: boolean
  hasShineEffect: boolean
  position: 'left' | 'right' | 'top' | 'bottom'
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

interface BottomButtonParams {
  text?: string
  color?: string
  text_color?: string
  is_active?: boolean
  is_visible?: boolean
  position?: 'left' | 'right' | 'top' | 'bottom'
  has_shine_effect?: boolean
}

interface SettingsButton {
  isVisible: boolean
  onClick(callback: () => void): void
  offClick(callback: () => void): void
  show(): void
  hide(): void
}

interface HapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

interface SafeAreaInset {
  top: number
  bottom: number
  left: number
  right: number
}

interface ContentSafeAreaInset {
  top: number
  bottom: number
  left: number
  right: number
}

interface Accelerometer {
  isStarted: boolean
  x: number
  y: number
  z: number
  start(params?: AccelerometerStartParams, callback?: (started: boolean) => void): void
  stop(callback?: (stopped: boolean) => void): void
}

interface AccelerometerStartParams {
  refresh_rate?: number
}

interface DeviceOrientation {
  isStarted: boolean
  absolute: boolean
  alpha: number
  beta: number
  gamma: number
  start(params?: DeviceOrientationStartParams, callback?: (started: boolean) => void): void
  stop(callback?: (stopped: boolean) => void): void
}

interface DeviceOrientationStartParams {
  refresh_rate?: number
  need_absolute?: boolean
}

interface Gyroscope {
  isStarted: boolean
  x: number
  y: number
  z: number
  start(params?: GyroscopeStartParams, callback?: (started: boolean) => void): void
  stop(callback?: (stopped: boolean) => void): void
}

interface GyroscopeStartParams {
  refresh_rate?: number
}

type HomeScreenStatus = 'unsupported' | 'unknown' | 'added' | 'missed'

type EitaaEventType =
  | 'themeChanged'
  | 'viewportChanged'
  | 'activated'
  | 'deactivated'
  | 'safeAreaChanged'
  | 'contentSafeAreaChanged'
  | 'mainButtonClicked'
  | 'backButtonClicked'
  | 'settingsButtonClicked'
  | 'popupClosed'
  | 'qrTextReceived'
  | 'scanQrPopupClosed'
  | 'writeAccessRequested'
  | 'contactRequested'
  | 'fullscreenChanged'
  | 'fullscreenFailed'
  | 'homeScreenAdded'
  | 'homeScreenChecked'

interface ViewportChangedEventData {
  isStateStable: boolean
}

interface PopupClosedEventData {
  button_id: string | null
}

interface QrTextReceivedEventData {
  data: string
}

interface WriteAccessRequestedEventData {
  status: 'allowed' | 'cancelled'
}

interface ContactRequestedEventData {
  status: 'sent' | 'cancelled'
}

interface FullscreenFailedEventData {
  error: string
}

interface HomeScreenCheckedEventData {
  status: HomeScreenStatus
}
