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

  // Methods با type-safe overloads
  isVersionAtLeast(version: string): boolean
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  setBottomBarColor(color: string): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  enableVerticalSwipes(): void
  disableVerticalSwipes(): void

  // Event handlers با overload برای type safety
  onEvent(eventType: 'viewportChanged', eventHandler: (params: ViewportChangedEventData) => void): void
  onEvent(eventType: 'popupClosed', eventHandler: (params: PopupClosedEventData) => void): void
  onEvent(eventType: 'qrTextReceived', eventHandler: (params: QrTextReceivedEventData) => void): void
  onEvent(eventType: 'writeAccessRequested', eventHandler: (params: WriteAccessRequestedEventData) => void): void
  onEvent(eventType: 'contactRequested', eventHandler: (params: ContactRequestedEventData) => void): void
  onEvent(eventType: 'fullscreenFailed', eventHandler: (params: FullscreenFailedEventData) => void): void
  onEvent(eventType: 'homeScreenChecked', eventHandler: (params: HomeScreenCheckedEventData) => void): void
  onEvent(eventType: 'themeChanged' | 'activated' | 'deactivated' | 'safeAreaChanged' | 'contentSafeAreaChanged' | 'mainButtonClicked' | 'backButtonClicked' | 'settingsButtonClicked' | 'scanQrPopupClosed' | 'fullscreenChanged' | 'homeScreenAdded', eventHandler: () => void): void

  offEvent(eventType: 'viewportChanged', eventHandler: (params: ViewportChangedEventData) => void): void
  offEvent(eventType: 'popupClosed', eventHandler: (params: PopupClosedEventData) => void): void
  offEvent(eventType: 'qrTextReceived', eventHandler: (params: QrTextReceivedEventData) => void): void
  offEvent(eventType: 'writeAccessRequested', eventHandler: (params: WriteAccessRequestedEventData) => void): void
  offEvent(eventType: 'contactRequested', eventHandler: (params: ContactRequestedEventData) => void): void
  offEvent(eventType: 'fullscreenFailed', eventHandler: (params: FullscreenFailedEventData) => void): void
  offEvent(eventType: 'homeScreenChecked', eventHandler: (params: HomeScreenCheckedEventData) => void): void
  offEvent(eventType: 'themeChanged' | 'activated' | 'deactivated' | 'safeAreaChanged' | 'contentSafeAreaChanged' | 'mainButtonClicked' | 'backButtonClicked' | 'settingsButtonClicked' | 'scanQrPopupClosed' | 'fullscreenChanged' | 'homeScreenAdded', eventHandler: () => void): void

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

// ... بقیه interfaceها

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
