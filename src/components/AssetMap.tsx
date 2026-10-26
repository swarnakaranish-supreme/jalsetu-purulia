import React, { useEffect, useRef, useState } from 'react';
import type { Asset, SiteAssessment } from '../types';

interface AssetMapProps {
  assets: Asset[];
  sites?: SiteAssessment[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  height?: string;
}

export const AssetMap: React.FC<AssetMapProps> = ({
  assets,
  sites = [],
  selectedId,
  onSelect,
  height = '360px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);

  // Filter items with valid coordinates
  const validAssets = assets.filter(
    a => a.latitude !== null && a.longitude !== null && !isNaN(a.latitude) && !isNaN(a.longitude)
  );
  const validSites = sites.filter(
    s => s.latitude !== null && s.longitude !== null && !isNaN(s.latitude) && !isNaN(s.longitude)
  );

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        // Dynamically import leaflet to prevent SSR or bundling issues
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
          zoom: 11,
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

        // Add assets
        validAssets.forEach(asset => {
          if (asset.latitude === null || asset.longitude === null) return;

          const isSelected = asset.id === selectedId;
          const marker = L.circleMarker([asset.latitude, asset.longitude], {
            radius: isSelected ? 10 : 7,
            fillColor: asset.condition === 'good' ? '#27864a' : asset.condition === 'poor' ? '#c0392b' : '#2e86c1',
            color: isSelected ? '#0e2f44' : '#ffffff',
            weight: isSelected ? 3 : 1.5,
            opacity: 1,
            fillOpacity: 0.85,
          }).addTo(map);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px;">
              <strong>${asset.name}</strong><br/>
              <span style="color: #666;">Type: ${asset.type.replace('_', ' ')}</span><br/>
              <span style="color: #666;">Condition: ${asset.condition}</span><br/>
              <small>${asset.block || ''}${asset.village ? ', ' + asset.village : ''}</small>
            </div>
          `);

          if (onSelect) {
            marker.on('click', () => onSelect(asset.id));
          }

          markers.push(marker);
        });

        // Add candidate sites
        validSites.forEach(site => {
          if (site.latitude === null || site.longitude === null) return;

          const isSelected = site.id === selectedId;
          const marker = L.circleMarker([site.latitude, site.longitude], {
            radius: isSelected ? 10 : 7,
            fillColor: '#b7791f',
            color: isSelected ? '#0e2f44' : '#ffffff',
            weight: isSelected ? 3 : 1.5,
            opacity: 1,
            fillOpacity: 0.85,
          }).addTo(map);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px;">
              <strong>[Candidate] ${site.name}</strong><br/>
              <span style="color: #666;">Type: ${site.siteType.replace('_', ' ')}</span><br/>
              <small>${site.block || ''}${site.village ? ', ' + site.village : ''}</small>
            </div>
          `);

          if (onSelect) {
            marker.on('click', () => onSelect(site.id));
          }

          markers.push(marker);
        });

        // If markers exist, fit bounds
        if (markers.length > 0) {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.2));
        }
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [validAssets.length, validSites.length, selectedId]);

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
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '420px', marginBottom: '1rem' }}>
          Interactive map tiles could not be loaded. Below is the list of geo-located assets and candidate sites.
        </p>
        <div style={{ maxHeight: '180px', overflowY: 'auto', width: '100%', fontSize: '0.8125rem' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {validAssets.map(a => (
              <li key={a.id} style={{ padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                <strong>{a.name}</strong> — Lat: {a.latitude}, Lon: {a.longitude} ({a.condition})
              </li>
            ))}
            {validSites.map(s => (
              <li key={s.id} style={{ padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                <em>[Candidate]</em> <strong>{s.name}</strong> — Lat: {s.latitude}, Lon: {s.longitude}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {isOfflineFallback && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
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
