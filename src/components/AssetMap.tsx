import React, { useEffect, useRef, useState } from 'react';
import type { Asset, SiteAssessment } from '../types';
import { validateCoordinates } from '../lib/calculations';
import { getDeviceLocation, type DeviceLocationSuccess } from '../lib/geolocation';

interface AssetMapProps {
  assets: Asset[];
  sites?: SiteAssessment[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onPlanSite?: (lat: number, lng: number) => void;
  height?: string;
  filterBlock?: string;
  filterType?: string;
}

export const AssetMap: React.FC<AssetMapProps> = ({
  assets,
  sites = [],
  selectedId,
  onSelect,
  onPlanSite,
  height = '380px',
  filterBlock = 'all',
  filterType = 'all',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pinMarkerRef = useRef<any>(null);
  const gpsMarkerRef = useRef<any>(null);
  const gpsCircleRef = useRef<any>(null);

  const [mapError, setMapError] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const [showAssets, setShowAssets] = useState<boolean>(true);
  const [showSites, setShowSites] = useState<boolean>(true);
  const [pinnedCoords, setPinnedCoords] = useState<[number, number] | null>(null);

  // GPS Location state
  const [gpsCoords, setGpsCoords] = useState<DeviceLocationSuccess | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filter items with valid coordinates
  const filteredAssets = assets
    .filter(a => filterBlock === 'all' || a.block.toLowerCase() === filterBlock.toLowerCase())
    .filter(a => filterType === 'all' || a.type === filterType)
    .filter(
      a => a.latitude !== null && a.longitude !== null && !isNaN(a.latitude) && !isNaN(a.longitude)
    );

  const filteredSites = sites
    .filter(s => filterBlock === 'all' || s.block.toLowerCase() === filterBlock.toLowerCase())
    .filter(s => filterType === 'all' || s.siteType === filterType)
    .filter(
      s => s.latitude !== null && s.longitude !== null && !isNaN(s.latitude) && !isNaN(s.longitude)
    );

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const L = (await import('leaflet')).default;

        if (!isMounted) return;

        // Cleanup existing map instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Purulia district central coordinates: approx 23.33, 86.36
        const defaultCenter: [number, number] = [23.332, 86.365];
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 10,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        // Add OSM tile layer with tileerror event listener
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        });

        tileLayer.on('tileerror', () => {
          if (isMounted) {
            setIsOfflineFallback(true);
          }
        });

        tileLayer.addTo(map);

        const markers: any[] = [];

        // Draw Purulia District approximate geographic context bounding box (dashed guide)
        const puruliaBounds: [[number, number], [number, number]] = [
          [22.70, 85.80],
          [23.85, 87.05],
        ];
        L.rectangle(puruliaBounds, {
          color: '#1a5276',
          weight: 1.5,
          dashArray: '4, 4',
          fillOpacity: 0.02,
        }).bindTooltip('Purulia District Context Area (Approx)', { permanent: false, direction: 'center' }).addTo(map);

        // Add registered assets if enabled
        if (showAssets) {
          filteredAssets.forEach(asset => {
            if (asset.latitude === null || asset.longitude === null) return;

            const coordCheck = validateCoordinates(asset.latitude, asset.longitude);
            const isSelected = asset.id === selectedId;

            const markerColor =
              asset.condition === 'good'
                ? '#27864a'
                : asset.condition === 'fair'
                ? '#2e86c1'
                : asset.condition === 'poor'
                ? '#c0392b'
                : '#7f8c8d';

            const marker = L.circleMarker([asset.latitude, asset.longitude], {
              radius: isSelected ? 11 : 7,
              fillColor: markerColor,
              color: isSelected ? '#0e2f44' : '#ffffff',
              weight: isSelected ? 3 : 1.5,
              opacity: 1,
              fillOpacity: 0.9,
            }).addTo(map);

            const simBadge = asset.isSimulated
              ? '<span style="background: #fcf3cf; color: #7d6608; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">SIMULATED</span>'
              : '<span style="background: #d4efdf; color: #145a32; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">FIELD ASSET</span>';

            const geoWarning = !coordCheck.inPuruliaDistrict
              ? `<div style="color: #b7791f; font-size: 11px; margin-top: 3px;">⚠️ ${coordCheck.message}</div>`
              : '';

            marker.bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 200px;">
                <div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <strong>${asset.name}</strong>
                  ${simBadge}
                </div>
                <div><strong>Type:</strong> ${asset.type.replace('_', ' ')}</div>
                <div><strong>Condition:</strong> <span style="text-transform: capitalize;">${asset.condition}</span></div>
                <div><strong>Block/Village:</strong> ${asset.block || 'Not specified'}${asset.village ? ', ' + asset.village : ''}</div>
                ${asset.storageCapacityLitres ? `<div><strong>Capacity:</strong> ${asset.storageCapacityLitres.toLocaleString()} L</div>` : ''}
                ${asset.maintenanceStatus !== 'none_required' ? `<div><strong>Maintenance:</strong> <span style="color: #c0392b;">${asset.maintenanceStatus.replace('_', ' ')}</span></div>` : ''}
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Lat: ${asset.latitude.toFixed(4)}, Lon: ${asset.longitude.toFixed(4)}</div>
                ${geoWarning}
              </div>
            `);

            if (onSelect) {
              marker.on('click', () => onSelect(asset.id));
            }

            markers.push(marker);
          });
        }

        // Add candidate sites if enabled
        if (showSites) {
          filteredSites.forEach(site => {
            if (site.latitude === null || site.longitude === null) return;

            const coordCheck = validateCoordinates(site.latitude, site.longitude);
            const isSelected = site.id === selectedId;

            const marker = L.circleMarker([site.latitude, site.longitude], {
              radius: isSelected ? 11 : 7,
              fillColor: '#d35400',
              color: isSelected ? '#0e2f44' : '#ffffff',
              weight: isSelected ? 3 : 1.5,
              opacity: 1,
              fillOpacity: 0.9,
            }).addTo(map);

            const simBadge = site.isSimulated
              ? '<span style="background: #fcf3cf; color: #7d6608; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">SIMULATED</span>'
              : '<span style="background: #e8daef; color: #5b2c6f; padding: 2px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">CANDIDATE</span>';

            const geoWarning = !coordCheck.inPuruliaDistrict
              ? `<div style="color: #b7791f; font-size: 11px; margin-top: 3px;">⚠️ ${coordCheck.message}</div>`
              : '';

            marker.bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 200px;">
                <div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <strong>[Candidate] ${site.name}</strong>
                  ${simBadge}
                </div>
                <div><strong>Site Type:</strong> ${site.siteType.replace('_', ' ')}</div>
                <div><strong>Block/Village:</strong> ${site.block || 'Not specified'}${site.village ? ', ' + site.village : ''}</div>
                ${site.catchmentAreaSqm ? `<div><strong>Catchment:</strong> ${site.catchmentAreaSqm.toLocaleString()} m²</div>` : '<div style="color: #c0392b;">Catchment: Unmeasured</div>'}
                <div><strong>Slope:</strong> ${site.slopeCategory} | <strong>Soil:</strong> ${site.soilType}</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Lat: ${site.latitude.toFixed(4)}, Lon: ${site.longitude.toFixed(4)}</div>
                ${geoWarning}
              </div>
            `);

            if (onSelect) {
              marker.on('click', () => onSelect(site.id));
            }

            markers.push(marker);
          });
        }

        // If markers exist, fit bounds with padding
        if (markers.length > 0) {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.2));
        }

        // Enable click-to-pin on map to plan a candidate site
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setPinnedCoords([lat, lng]);

          if (pinMarkerRef.current) {
            pinMarkerRef.current.remove();
          }

          const coordCheck = validateCoordinates(lat, lng);
          const pinColor = coordCheck.inPuruliaDistrict ? '#8e44ad' : '#d35400';

          const pin = L.circleMarker([lat, lng], {
            radius: 9,
            fillColor: pinColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.95,
          }).addTo(map);

          pinMarkerRef.current = pin;

          const popupContent = document.createElement('div');
          popupContent.style.fontFamily = 'sans-serif';
          popupContent.style.fontSize = '12px';
          popupContent.style.lineHeight = '1.4';
          popupContent.style.minWidth = '220px';

          popupContent.innerHTML = `
            <div style="font-weight: 700; color: ${pinColor}; margin-bottom: 4px;">
              📍 Pinned Candidate Location
            </div>
            <div><strong>Latitude:</strong> ${lat.toFixed(5)}° N</div>
            <div><strong>Longitude:</strong> ${lng.toFixed(5)}° E</div>
            <div style="font-size: 11px; margin-top: 4px; color: ${coordCheck.inPuruliaDistrict ? '#27864a' : '#d35400'};">
              ${coordCheck.inPuruliaDistrict ? '✓ Within Purulia District context area' : '⚠️ Outside Purulia District bounds'}
            </div>
          `;

          if (onPlanSite) {
            const btn = document.createElement('button');
            btn.innerText = 'Assess Rainwater Site at this Point →';
            btn.style.marginTop = '8px';
            btn.style.width = '100%';
            btn.style.padding = '6px 10px';
            btn.style.background = '#1a5276';
            btn.style.color = '#ffffff';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.fontWeight = '600';
            btn.style.cursor = 'pointer';
            btn.onclick = () => onPlanSite(lat, lng);
            popupContent.appendChild(btn);
          }

          pin.bindPopup(popupContent).openPopup();
        });
      } catch (err) {
        console.warn('Map initialization failed (likely offline):', err);
        if (isMounted) {
          setMapError('Map library unavailable or network offline.');
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (gpsMarkerRef.current) {
        gpsMarkerRef.current.remove();
        gpsMarkerRef.current = null;
      }
      if (gpsCircleRef.current) {
        gpsCircleRef.current.remove();
        gpsCircleRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [filteredAssets.length, filteredSites.length, selectedId, showAssets, showSites, filterBlock, filterType]);

  const handleDetectGps = async () => {
    setGpsLoading(true);
    setGpsError(null);

    try {
      const loc = await getDeviceLocation();
      setGpsCoords(loc);
      setGpsLoading(false);

      if (mapInstanceRef.current) {
        const L = (await import('leaflet')).default;
        const map = mapInstanceRef.current;

        // Clean up previous GPS marker & accuracy circle if any
        if (gpsMarkerRef.current) {
          gpsMarkerRef.current.remove();
          gpsMarkerRef.current = null;
        }
        if (gpsCircleRef.current) {
          gpsCircleRef.current.remove();
          gpsCircleRef.current = null;
        }

        // Add GPS accuracy circle if accuracy is available
        if (loc.accuracy && loc.accuracy > 0) {
          const accuracyCircle = L.circle([loc.latitude, loc.longitude], {
            radius: loc.accuracy,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.15,
            weight: 1.5,
            dashArray: '4, 4',
          }).addTo(map);
          gpsCircleRef.current = accuracyCircle;
        }

        // Add distinct GPS location marker (pulsing blue ring)
        const coordCheck = validateCoordinates(loc.latitude, loc.longitude);
        const marker = L.circleMarker([loc.latitude, loc.longitude], {
          radius: 10,
          fillColor: '#0284c7',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.95,
        }).addTo(map);
        gpsMarkerRef.current = marker;

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'sans-serif';
        popupContent.style.fontSize = '12px';
        popupContent.style.lineHeight = '1.45';
        popupContent.style.minWidth = '230px';

        popupContent.innerHTML = `
          <div style="font-weight: 700; color: #0284c7; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            <span>📍 Current Device Location (GPS)</span>
          </div>
          <div><strong>Latitude:</strong> ${loc.latitude.toFixed(5)}° N</div>
          <div><strong>Longitude:</strong> ${loc.longitude.toFixed(5)}° E</div>
          <div><strong>Accuracy:</strong> &plusmn;${Math.round(loc.accuracy)} metres</div>
          <div style="font-size: 11px; margin-top: 4px; color: ${coordCheck.inPuruliaDistrict ? '#145a32' : '#b7791f'};">
            ${coordCheck.inPuruliaDistrict ? '✓ Within Purulia District context area' : '⚠️ ' + coordCheck.message}
          </div>
          <div style="font-size: 10px; color: #666; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px;">
            * Accuracy depends on device, browser &amp; GPS/network signals.
          </div>
        `;

        if (onPlanSite) {
          const btn = document.createElement('button');
          btn.innerText = 'Assess Rainwater Site at GPS Location →';
          btn.style.marginTop = '8px';
          btn.style.width = '100%';
          btn.style.padding = '6px 10px';
          btn.style.background = '#0284c7';
          btn.style.color = '#ffffff';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
          btn.style.fontWeight = '600';
          btn.style.cursor = 'pointer';
          btn.onclick = () => onPlanSite(loc.latitude, loc.longitude);
          popupContent.appendChild(btn);
        }

        marker.bindPopup(popupContent).openPopup();

        // Smoothly centre map to detected location
        map.setView([loc.latitude, loc.longitude], Math.max(map.getZoom(), 14), { animate: true });
      }
    } catch (err: any) {
      setGpsLoading(false);
      setGpsError(err.message || 'Failed to detect GPS location.');
    }
  };

  if (mapError) {
    return (
      <div
        className="card"
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-sand)',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
          Map Display Fallback (Offline Mode)
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '440px', marginBottom: '1rem' }}>
          Interactive map tiles could not be loaded. Below is the list of geo-located assets ({filteredAssets.length}) and candidate sites ({filteredSites.length}).
        </p>
        <div style={{ maxHeight: '200px', overflowY: 'auto', width: '100%', fontSize: '0.8125rem' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredAssets.map(a => (
              <li key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <strong>{a.name}</strong> ({a.type.replace('_', ' ')}) &bull; Lat: {a.latitude}, Lon: {a.longitude}
                <span style={{ float: 'right', fontSize: '0.75rem', color: a.condition === 'good' ? '#27864a' : '#c0392b' }}>
                  {a.condition}
                </span>
              </li>
            ))}
            {filteredSites.map(s => (
              <li key={s.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <em>[Candidate]</em> <strong>{s.name}</strong> &bull; Lat: {s.latitude}, Lon: {s.longitude} ({s.siteType.replace('_', ' ')})
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Map Layer Controls & Legend */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '6px 12px',
          borderRadius: 'var(--radius)',
          fontSize: '0.75rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600, color: '#1a5276' }}>
          <input
            type="checkbox"
            checked={showAssets}
            onChange={e => setShowAssets(e.target.checked)}
          />
          Assets ({filteredAssets.length})
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600, color: '#d35400' }}>
          <input
            type="checkbox"
            checked={showSites}
            onChange={e => setShowSites(e.target.checked)}
          />
          Candidate Sites ({filteredSites.length})
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#555', fontSize: '0.7rem' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#27864a' }}></span> Good
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2e86c1' }}></span> Fair
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#c0392b' }}></span> Poor/Overdue
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#d35400' }}></span> Candidate
        </div>

        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleDetectGps}
          disabled={gpsLoading}
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: gpsLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Detect your device location using browser GPS"
        >
          {gpsLoading ? '⏳ Detecting GPS...' : '📍 Locate Me (GPS)'}
        </button>

        {/* Detected GPS summary and action */}
        {gpsCoords && (
          <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>
            GPS: {gpsCoords.latitude.toFixed(4)}°, {gpsCoords.longitude.toFixed(4)}° (&plusmn;{Math.round(gpsCoords.accuracy)}m)
          </span>
        )}

        {gpsCoords && onPlanSite && (
          <button
            type="button"
            onClick={() => onPlanSite(gpsCoords.latitude, gpsCoords.longitude)}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Start site assessment at detected GPS coordinates"
          >
            Assess at GPS Location →
          </button>
        )}

        {pinnedCoords && onPlanSite && (
          <button
            type="button"
            onClick={() => onPlanSite(pinnedCoords[0], pinnedCoords[1])}
            style={{
              background: '#8e44ad',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📍 Assess Pinned ({pinnedCoords[0].toFixed(3)}, {pinnedCoords[1].toFixed(3)}) →
          </button>
        )}
      </div>

      {/* GPS Error Notification with Retry */}
      {gpsError && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            left: '10px',
            right: '10px',
            maxWidth: '520px',
            zIndex: 1000,
            background: 'rgba(254, 242, 242, 0.98)',
            border: '1px solid #f87171',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            fontSize: '0.75rem',
            color: '#991b1b',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span>⚠️ {gpsError}</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleDetectGps}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setGpsError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
              title="Dismiss error message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Click-to-Pin Hint Banner */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '10px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '0.7rem',
          color: '#2c3e50',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
        }}
      >
        💡 <strong>Map Planner:</strong> Click anywhere on the map to drop a candidate site pin
      </div>

      {isOfflineFallback && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: 'rgba(255, 243, 205, 0.95)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            border: '1px solid #ffeeba',
            color: '#856404',
          }}
        >
          OSM tiles loading slowly or offline
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', background: '#e5e3df', zIndex: 1 }}
        aria-label="Map of water harvesting assets and candidate sites in Purulia"
      />
    </div>
  );
};
