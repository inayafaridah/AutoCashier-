import React from 'react';
import { Globe, MapPin, Check, ChevronDown } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { MOCK_LOCATIONS, LocationID } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';

export function BranchSelector() {
  const { currentLocation, setCurrentLocation, locationName, allBranches } = useLocation();
  const { user } = useAuth();
  
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        disabled={!isSuperAdmin}
        className={cn(
          "flex items-center gap-2 px-6 py-3 bg-indigo-50/80 border-none rounded-full transition-colors group outline-none w-full sm:w-auto justify-between sm:justify-start",
          isSuperAdmin ? "hover:bg-indigo-100/80 cursor-pointer" : "cursor-default opacity-90"
        )}
      >
          <div className="flex items-center gap-2">
            {currentLocation === 'ALL' ? (
              <Globe className="w-4 h-4 text-indigo-600" />
            ) : (
              <MapPin className="w-4 h-4 text-indigo-600" />
            )}
            <span className="text-xs font-bold text-indigo-700">{locationName}</span>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 hidden sm:inline">
              {currentLocation === 'ALL' ? 'CONSOLIDATED' : 'YOUR BRANCH'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors sm:ml-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 bg-white border-gray-100 shadow-2xl">
        <DropdownMenuLabel className="font-bold text-gray-900 border-b border-gray-50 pb-2 mb-2 px-3">Select Operation Unit</DropdownMenuLabel>
        {allBranches.map((loc) => (
            <DropdownMenuItem 
              key={loc.id}
              onClick={() => setCurrentLocation(loc.id as any)}
              className={cn(
                "rounded-xl font-semibold flex items-center justify-between gap-3 p-3 mb-1 cursor-pointer transition-colors",
                currentLocation === loc.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-600"
              )}
            >
              <div className="flex items-center gap-2">
                {loc.id === 'ALL' ? (
                  <Globe className={cn("w-4 h-4", currentLocation === loc.id ? "text-indigo-600" : "opacity-40")} />
                ) : (
                  <MapPin className={cn("w-4 h-4", currentLocation === loc.id ? "text-indigo-600" : "opacity-40")} />
                )}
                {loc.name}
              </div>
              {currentLocation === loc.id && <Check className="w-4 h-4 text-indigo-600" />}
            </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
