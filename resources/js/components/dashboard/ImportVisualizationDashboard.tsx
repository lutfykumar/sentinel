import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { RefreshCcw } from 'lucide-react';
import { 
  fetchImportVisualization, 
  refreshImportVisualizationView 
} from '@/utils/dashboardApi';
import { 
  ImportData,
  ArcData 
} from '@/types/dashboard';
import { 
  getCountryName, 
  getCountryCoordinates, 
  INDONESIA_COORDINATES 
} from '@/utils/countryMapping';
import * as THREE from 'three';
import { useToast } from '@/hooks/useToast';

// Declare THREE as a global for clouds implementation
declare global {
  interface Window {
    THREE: typeof THREE;
  }
}

interface ImportVisualizationDashboardProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const ImportVisualizationDashboard: React.FC<ImportVisualizationDashboardProps> = ({ 
  refreshTrigger, 
  onRefresh,
  isRefreshing: externalRefreshing = false
}) => {
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [topCountries, setTopCountries] = useState<ImportData[]>([]);
  const [totalCountries, setTotalCountries] = useState(0);
  const [totalImports, setTotalImports] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globeError, setGlobeError] = useState(false);
  const toast = useToast();
  
  const globeRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Function to center globe on Indonesia
  const centerGlobeOnIndonesia = useCallback(() => {
    if (globeRef.current) {
      setTimeout(() => {
        try {
          globeRef.current.pointOfView({
            lat: INDONESIA_COORDINATES.lat,
            lng: INDONESIA_COORDINATES.lng,
            altitude: 2.5
          }, 1000); // 1 second transition
        } catch (err) {
          console.warn('Could not center globe:', err);
        }
      }, 100);
    }
  }, []);
  
  // Create arcs data for ALL countries with consistent small green lines
  const arcsData = useMemo(() => {
    if (importData.length === 0) return [];
    
    return importData.map((item): ArcData | null => {
      const coordinates = getCountryCoordinates(item.country_code);
      
      // Skip countries without coordinates (should be very rare now)
      if (!coordinates) {
        console.warn(`No coordinates found for country code: ${item.country_code}`);
        return null;
      }
      
      // Use consistent small lines with green color
      const strokeWidth = 1; // Consistent small width for all lines
      const color = '#22c55e'; // Consistent green color (green-500)
      
      return {
        startLat: coordinates.lat,
        startLng: coordinates.lng,
        endLat: INDONESIA_COORDINATES.lat,
        endLng: INDONESIA_COORDINATES.lng,
        color,
        strokeWidth,
        country_code: item.country_code,
        country_name: item.country_name,
        count: item.count
      };
    }).filter(Boolean) as ArcData[];
  }, [importData]);
  
  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchImportVisualization();
      
      if (response.success) {
        setImportData(response.data);
        setTopCountries(response.top_countries);
        setTotalCountries(response.total_countries);
        setTotalImports(response.total_imports);
        setError(null);
      } else {
        const errorMsg = response.message || 'Failed to load import visualization data';
        setError(errorMsg);
        toast.error('Error loading visualization', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      toast.error('Error loading visualization', errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Refresh function
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await refreshImportVisualizationView();
      
      if (response.success) {
        toast.success('Visualization refreshed', 'Import visualization data has been refreshed successfully.');
        // Reload data after successful refresh
        await loadData();
        // Notify parent component
        onRefresh?.();
      } else {
        const errorMsg = response.message || 'Failed to refresh data';
        setError(errorMsg);
        toast.error('Refresh failed', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMsg);
      toast.error('Refresh failed', errorMsg);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, onRefresh]);
  
  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // External refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadData();
    }
  }, [refreshTrigger, loadData]);
  
  // Handle globe errors
  useEffect(() => {
    const handleGlobeError = () => {
      console.warn('Globe rendering failed, showing fallback');
      setGlobeError(true);
    };
    
    window.addEventListener('error', handleGlobeError);
    return () => window.removeEventListener('error', handleGlobeError);
  }, []);
  
  // Center globe when data changes
  useEffect(() => {
    if (arcsData.length > 0) {
      // Wait a bit for globe to render, then center
      const timer = setTimeout(() => {
        centerGlobeOnIndonesia();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [arcsData, centerGlobeOnIndonesia]);
  
  // State to track container size
  const [containerSize, setContainerSize] = useState({ width: 600, height: 500 });
  
  // Handle container resize with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial size
    const initialWidth = containerRef.current.clientWidth - 32;
    const initialHeight = containerRef.current.clientHeight - 32;
    if (initialWidth > 100 && initialHeight > 100) {
      setContainerSize({ width: initialWidth, height: initialHeight });
    }
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const newWidth = Math.max(width - 32, 300); // Minimum width
        const newHeight = Math.max(height - 32, 300); // Minimum height
        setContainerSize({ 
          width: newWidth,
          height: newHeight
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);
  
  
  const isCurrentlyRefreshing = refreshing || externalRefreshing;
  
  if (loading && importData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading import visualization...</p>
        </div>
      </div>
    );
  }
  
  if (error && importData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={loadData} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 h-full p-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <span>🌍</span>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Indonesia Import Flow
            </span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {totalCountries} countries • {totalImports.toLocaleString()} total imports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={centerGlobeOnIndonesia}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/25"
            title="Center globe on Indonesia"
          >
            <span>🇮🇩</span>
            <span>Center</span>
          </button>
        </div>
      </div>
      
      {/* Main Content Layout: Globe Left, Top Countries Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
        
        {/* Globe Container - Left Side */}
        <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-700 rounded-lg p-4 shadow-lg flex items-center justify-center h-full w-full overflow-hidden" ref={containerRef}>
          {loading && (
            <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                <p className="text-sm text-blue-200">Loading globe...</p>
              </div>
            </div>
          )}
          {globeError ? (
            <div className="flex items-center justify-center h-[500px] bg-gradient-to-br from-blue-900 to-slate-900 rounded-lg">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-2">Import Flow Visualization</h3>
                <p className="text-blue-200 mb-4">3D Globe temporarily unavailable</p>
                <button 
                  onClick={() => setGlobeError(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Globe
                key={`${containerSize.width}-${containerSize.height}`}
                ref={globeRef}
                width={containerSize.width}
                height={containerSize.height}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"
                showGlobe={true}
                showAtmosphere={true}
                atmosphereColor="#87CEEB"
                atmosphereAltitude={0.25}
                arcsData={arcsData}
                arcStartLat={(d: ArcData) => d.startLat}
                arcStartLng={(d: ArcData) => d.startLng}
                arcEndLat={(d: ArcData) => d.endLat}
                arcEndLng={(d: ArcData) => d.endLng}
                arcColor={(d: ArcData) => d.color}
                arcStroke={(d: ArcData) => d.strokeWidth}
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashInitialGap={() => Math.random()}
                arcDashAnimateTime={2000}
                arcAltitude={0.2}
                arcAltitudeAutoScale={0.5}
                arcsTransitionDuration={1000}
                arcLabel={(d: ArcData) => `${d.country_name} → Indonesia: ${d.count.toLocaleString()}`}
                onArcHover={(arc: ArcData | null) => {
                  if (arc) {
                    console.log(`${arc.country_name}: ${arc.count.toLocaleString()} imports`);
                  }
                }}
                onGlobeReady={() => {
                  console.log('Globe loaded with', arcsData.length, 'countries');
                  
                  // Add clouds layer
                  const CLOUDS_IMG_URL = 'https://globe.gl/example/clouds/clouds.png';
                  const CLOUDS_ALT = 0.004;
                  const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame
                  
                  // Set THREE on window for globe access
                  window.THREE = THREE;
                  
                  if (globeRef.current) {
                    new THREE.TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture: any) => {
                      const clouds = new THREE.Mesh(
                        new THREE.SphereGeometry(globeRef.current.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
                        new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true })
                      );
                      globeRef.current.scene().add(clouds);
                      
                      // Animate clouds rotation
                      const rotateClouds = () => {
                        if (clouds) {
                          clouds.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
                          requestAnimationFrame(rotateClouds);
                        }
                      };
                      rotateClouds();
                    });
                  }
                  
                  centerGlobeOnIndonesia();
                }}
              />
            </div>
          )}
        </div>
        
        {/* Top 10 Countries - Right Side */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <h3 className="text-3xl font-semibold mb-4 flex items-center gap-2">
            <span>🏆</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Top Importing Countries
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {topCountries.slice(0, 10).map((country, index) => (
              <div 
                key={country.country_code}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 h-fit"
              >
                {/* Compact horizontal layout */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-700">#{index + 1}</span>
                    <span className="font-semibold text-sm text-gray-800 dark:text-white truncate" title={country.country_name}>
                      {country.country_name}
                    </span>
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-medium">
                    {country.country_code}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {country.count.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">imports</span>
                  </div>
                  <div className="text-emerald-500 text-lg">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ImportVisualizationDashboard;
