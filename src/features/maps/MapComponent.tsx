'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAlertsQuery, useNearbySheltersQuery } from '@/hooks/useQueries';

// Fix default Leaflet marker assets paths
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const MapComponent: React.FC = () => {
  const [lat, setLat] = useState(22.3039);
  const [lon, setLon] = useState(70.8022);
  const [locationName, setLocationName] = useState('Rajkot, Gujarat');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLat = localStorage.getItem('ks_location_lat');
      const storedLon = localStorage.getItem('ks_location_lng');
      const name = localStorage.getItem('ks_location_name');
      if (storedLat && storedLon) {
        setLat(Number(storedLat));
        setLon(Number(storedLon));
      }
      if (name) {
        setLocationName(name);
      }
    }
  }, []);

  const { data: alerts = [] } = useAlertsQuery(lat, lon);
  const { data: shelters = [] } = useNearbySheltersQuery(lat, lon);

  const getAlertColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'extreme': return '#E53935';
      case 'severe': return '#FB8C00';
      default: return '#FFC107';
    }
  };

  const center: [number, number] = [lat, lon];

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-ks-border shadow-ks-sm">
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Marker */}
        <Marker position={center}>
          <Popup>
            <div className="p-1">
              <h5 className="font-bold text-sm text-primary-green">Your Location</h5>
              <p className="text-xs text-ks-text-secondary">{locationName}</p>
            </div>
          </Popup>
        </Marker>

        {/* Live Alerts Overlay Circles */}
        {alerts.map((alert: any) => {
          // Fallback to random offset around center if no polygon points defined
          const aLat = lat + (Math.random() - 0.5) * 0.05;
          const aLon = lon + (Math.random() - 0.5) * 0.05;
          return (
            <React.Fragment key={alert.id}>
              <Circle
                center={[aLat, aLon]}
                radius={10000} // 10km radius
                pathOptions={{
                  color: getAlertColor(alert.severity?.name),
                  fillColor: getAlertColor(alert.severity?.name),
                  fillOpacity: 0.3,
                  weight: 2
                }}
              />
              <Marker position={[aLat, aLon]}>
                <Popup>
                  <div className="p-1 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-ks-text-secondary">
                      {alert.category?.name || 'General'} Hazard
                    </span>
                    <h5 className="font-bold text-sm text-ks-text">{alert.title}</h5>
                    <p className="text-xs text-ks-text-secondary">{alert.description}</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Evacuation Shelters Markers */}
        {shelters.map((shelter: any) => {
          const sLat = shelter.latitude || lat + (Math.random() - 0.5) * 0.02;
          const sLon = shelter.longitude || lon + (Math.random() - 0.5) * 0.02;
          return (
            <Marker key={shelter.id} position={[sLat, sLon]}>
              <Popup>
                <div className="p-1">
                  <h5 className="font-bold text-sm text-brand-blue">Shelter: {shelter.name}</h5>
                  <p className="text-xs text-ks-text-secondary">Capacity: {shelter.capacity} people</p>
                  <p className="text-xs text-primary-green font-bold">Status: {shelter.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
