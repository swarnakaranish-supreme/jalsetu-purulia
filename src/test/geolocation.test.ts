import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isGeolocationSupported,
  isSecureContextEnvironment,
  getDeviceLocation,
} from '../lib/geolocation';

describe('Device Geolocation Utility', () => {
  const originalGeolocation = navigator.geolocation;
  const originalSecureContext = window.isSecureContext;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: originalSecureContext,
      configurable: true,
      writable: true,
    });
  });

  it('detects when geolocation is supported in navigator', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
      writable: true,
    });
    expect(isGeolocationSupported()).toBe(true);
  });

  it('rejects when geolocation is not supported by the browser', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    await expect(getDeviceLocation()).rejects.toMatchObject({
      isUnsupported: true,
      message: expect.stringContaining('not supported'),
    });
  });

  it('rejects when context is not secure (e.g. non-localhost HTTP)', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
      writable: true,
    });

    await expect(getDeviceLocation()).rejects.toMatchObject({
      isContextInsecure: true,
      message: expect.stringContaining('secure context'),
    });
  });

  it('resolves latitude, longitude, and accuracy upon successful GPS detection', async () => {
    const mockSuccessPosition = {
      coords: {
        latitude: 23.332,
        longitude: 86.365,
        accuracy: 15,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.now(),
      toJSON: () => ({}),
    } as unknown as GeolocationPosition;

    const getCurrentPositionMock = vi.fn((success) => {
      success(mockSuccessPosition);
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });

    const res = await getDeviceLocation();
    expect(res.latitude).toBe(23.332);
    expect(res.longitude).toBe(86.365);
    expect(res.accuracy).toBe(15);
    expect(getCurrentPositionMock).toHaveBeenCalledTimes(1);
  });

  it('handles PERMISSION_DENIED error gracefully with clear guidance', async () => {
    const mockError: GeolocationPositionError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied Geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    const getCurrentPositionMock = vi.fn((_success, error) => {
      error(mockError);
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });

    await expect(getDeviceLocation()).rejects.toMatchObject({
      code: 1,
      isPermissionDenied: true,
      message: expect.stringContaining('permission was denied'),
    });
  });

  it('handles POSITION_UNAVAILABLE error gracefully', async () => {
    const mockError: GeolocationPositionError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    const getCurrentPositionMock = vi.fn((_success, error) => {
      error(mockError);
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });

    await expect(getDeviceLocation()).rejects.toMatchObject({
      code: 2,
      isPositionUnavailable: true,
      message: expect.stringContaining('currently unavailable'),
    });
  });

  it('handles TIMEOUT error gracefully', async () => {
    const mockError: GeolocationPositionError = {
      code: 3, // TIMEOUT
      message: 'Timeout expired',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    const getCurrentPositionMock = vi.fn((_success, error) => {
      error(mockError);
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });

    await expect(getDeviceLocation()).rejects.toMatchObject({
      code: 3,
      isTimeout: true,
      message: expect.stringContaining('timed out'),
    });
  });
});
