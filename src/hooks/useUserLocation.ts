import { useState, useEffect } from 'react';

interface LocationInfo {
  country: string | null;
  countryCode: string | null;
  city: string | null;
  currency: string | null;
  loading: boolean;
  error: string | null;
}

export const useUserLocation = () => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    country: null,
    countryCode: null,
    city: null,
    currency: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Use IP-based geolocation (doesn't require permission)
        const response = await fetch('https://ipapi.co/json/');
        
        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }
        
        const data = await response.json();
        
        setLocationInfo({
          country: data.country_name,
          countryCode: data.country_code,
          city: data.city,
          currency: data.currency,
          loading: false,
          error: null
        });
        
        console.log('Location detected:', data.country_name, data.currency);
      } catch (error) {
        console.error('Error detecting location:', error);
        setLocationInfo(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    detectLocation();
  }, []);

  return locationInfo;
};