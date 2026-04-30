import {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import {LocationID, MOCK_LOCATIONS} from '@/lib/api';
import {useAuth} from './AuthContext';

interface LocationContextType {
  currentLocation: LocationID;
  setCurrentLocation: (id: LocationID) => void;
  locationName: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({children}: {children: ReactNode}) {
  const {user} = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationID>(() => {
    const saved = localStorage.getItem('active_location_id');
    return (saved as LocationID) || 'ALL';
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin') {
        const saved = localStorage.getItem('active_location_id');
        if (!saved) {
           setCurrentLocation('ALL');
        }
      } else if (user.location_id !== 'ALL') {
        setCurrentLocation(user.location_id as LocationID);
      }
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('active_location_id', currentLocation);
  }, [currentLocation]);

  const locationName = MOCK_LOCATIONS.find(l => l.id === currentLocation)?.name || 'All Branches';

  return (
    <LocationContext.Provider value={{
      currentLocation,
      setCurrentLocation,
      locationName
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
