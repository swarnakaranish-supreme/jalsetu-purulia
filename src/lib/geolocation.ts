/**
 * JalSetu Purulia — Device Geolocation Helper
 *
 * Utilizes the native browser Geolocation API (navigator.geolocation.getCurrentPosition)
 * to detect device coordinates for field assessment and map positioning.
 *
 * Privacy & Security:
 * - Position is only requested upon explicit user interaction (GPS button click).
 * - Never polled continuously in the background.
 * - Coordinates remain strictly local and are never transmitted to any external service.
 * - Requires a secure context (HTTPS or localhost).
 */

export interface DeviceLocationSuccess {
  latitude: number;
  longitude: number;
  accuracy: number; // In metres
  timestamp: number;
}

export interface DeviceLocationError {
  code: number;
  message: string;
  isPermissionDenied: boolean;
  isTimeout: boolean;
  isPositionUnavailable: boolean;
  isUnsupported: boolean;
  isContextInsecure: boolean;
}

/**
 * Checks whether the browser runtime supports the Geolocation API.
 */
export function isGeolocationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'geolocation' in navigator &&
    typeof navigator.geolocation !== 'undefined' &&
    navigator.geolocation !== null
  );
}

/**
 * Checks whether the application is running in a secure context (HTTPS or localhost).
 */
export function isSecureContextEnvironment(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext !== false;
}

/**
 * Request device location once using navigator.geolocation.getCurrentPosition().
 */
export function getDeviceLocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  }
): Promise<DeviceLocationSuccess> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      const err: DeviceLocationError = {
        code: -1,
        message: 'Geolocation is not supported by your browser. Please use a modern browser with GPS support.',
        isPermissionDenied: false,
        isTimeout: false,
        isPositionUnavailable: false,
        isUnsupported: true,
        isContextInsecure: false,
      };
      return reject(err);
    }

    if (!isSecureContextEnvironment()) {
      const err: DeviceLocationError = {
        code: -2,
        message: 'Geolocation requires a secure context (HTTPS or localhost). Please ensure the site is running securely.',
        isPermissionDenied: false,
        isTimeout: false,
        isPositionUnavailable: false,
        isUnsupported: false,
        isContextInsecure: true,
      };
      return reject(err);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (geoErr) => {
        let msg = 'Unable to retrieve location.';
        const isPerm = geoErr.code === geoErr.PERMISSION_DENIED;
        const isTime = geoErr.code === geoErr.TIMEOUT;
        const isPos = geoErr.code === geoErr.POSITION_UNAVAILABLE;

        if (isPerm) {
          msg = 'Location permission was denied. Please allow location access in your browser settings to use GPS.';
        } else if (isTime) {
          msg = 'GPS location request timed out. Please verify device GPS signal and click Retry.';
        } else if (isPos) {
          msg = 'GPS position is currently unavailable. Please check that device location services or GPS toggle are enabled.';
        } else if (geoErr.message) {
          msg = geoErr.message;
        }

        const err: DeviceLocationError = {
          code: geoErr.code,
          message: msg,
          isPermissionDenied: isPerm,
          isTimeout: isTime,
          isPositionUnavailable: isPos,
          isUnsupported: false,
          isContextInsecure: false,
        };
        reject(err);
      },
      options
    );
  });
}
