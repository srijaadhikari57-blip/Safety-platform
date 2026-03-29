import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import './Map.css';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const Map = ({
  center,
  markers = [],
  path = [],
  onMapClick,
  showUserLocation = true,
  userLocation,
  zoom = 14
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || '',
    libraries: ['places']
  });

  const mapRef = useRef(null);
  const [mapCenter, setMapCenter] = useState(center || defaultCenter);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback((e) => {
    if (onMapClick) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, [onMapClick]);

  if (loadError) {
    return (
      <div className="map-error">
        <p>Error loading maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      }}
    >
      {showUserLocation && userLocation && (
        <Marker
          position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#6366f1',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }}
        />
      )}

      {markers.map((marker, index) => (
        <Marker
          key={marker.id || index}
          position={{ lat: marker.lat, lng: marker.lng }}
          title={marker.title}
          icon={marker.icon}
        />
      ))}

      {path.length > 1 && (
        <Polyline
          path={path}
          options={{
            strokeColor: '#6366f1',
            strokeOpacity: 0.8,
            strokeWeight: 4
          }}
        />
      )}
    </GoogleMap>
  );
};

export default Map;
