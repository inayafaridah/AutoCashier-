import React from 'react';
import { Globe, MapPin, Check, ChevronDown } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
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
  const { currentLocation, setCurrentLocation, locationName } = useLocation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "flex items-center gap-2 px-4 h-14 bg-white border-gray-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-all group outline-none min-w-[220px] justify-between")}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {currentLocation === 'ALL' ? (
                  <Globe className="w-4 h-4 transition-colors" />
                ) : (
                  <MapPin className="w-4 h-4 transition-colors" />
                )}
            </div>
            <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Branch Selector</span>
                <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                  {locationName}
                </span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 bg-white border-gray-100 shadow-2xl">
        <DropdownMenuLabel className="font-bold text-gray-900 border-b border-gray-50 pb-2 mb-2 px-3">Select Operation Unit</DropdownMenuLabel>
        {MOCK_LOCATIONS.map((loc) => (
            <DropdownMenuItem 
              key={loc.id}
              onClick={() => setCurrentLocation(loc.id as LocationID)}
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
