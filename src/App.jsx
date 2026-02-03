import { useState, useEffect } from 'react'
import './App.css'
import MapCanvas from './features/map/MapCanvas.jsx'
import UploadControl from './components/UploadControl.jsx'
import { PenTool, Navigation } from 'lucide-react'
import { pathFinder } from './features/graph/PathFinder.js'

function App() {
  const [mapImage, setMapImage] = useState(null);
  const [mode, setMode] = useState('view'); // view, edit, navigate
  const [graph, setGraph] = useState({ type: 'FeatureCollection', features: [] });
  const [activePath, setActivePath] = useState(null);
  const [navPoints, setNavPoints] = useState([]); // [start, end]

  // Update PathFinder when graph changes
  useEffect(() => {
    if (graph.features.length > 0) {
      pathFinder.buildGraph(graph);
    }
  }, [graph]);

  // Handle Map Clicks (delegated from MapCanvas)
  const handleMapClick = (coords) => {
    if (mode === 'navigate') {
      const newPoints = [...navPoints, coords];

      if (newPoints.length === 2) {
        // Calculate Path
        const pathCoords = pathFinder.findPath(newPoints[0], newPoints[1]);
        if (pathCoords && pathCoords.length > 0) {
          setActivePath({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: pathCoords
            }
          });
        } else {
          alert("No path found! Ensure nodes are connected.");
        }
        setNavPoints([]); // Reset
      } else {
        setNavPoints(newPoints);
        setActivePath(null); // Clear previous path
      }
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapCanvas
        imageOverlay={mapImage}
        mode={mode}
        graph={graph}
        onGraphUpdate={setGraph}
        activePath={activePath}
        onMapClick={handleMapClick}
      />

      {/* Header */}
      <div className="glass-panel" style={{
        position: 'absolute',
        zIndex: 10,
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '0.8rem 1.5rem',
        pointerEvents: 'none',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>AnyNav</h1>
      </div>

      {/* Mode Switcher */}
      {mapImage && (
        <div className="glass-panel" style={{
          position: 'absolute',
          zIndex: 10,
          top: '80px',
          right: '20px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            className={mode === 'edit' ? 'btn-primary' : ''}
            onClick={() => setMode('edit')}
            title="Edit Graph"
            style={{ padding: '8px', borderRadius: '8px', color: mode === 'edit' ? 'white' : 'var(--color-text-muted)' }}
          >
            <PenTool size={20} />
          </button>
          <button
            className={mode === 'navigate' ? 'btn-primary' : ''}
            onClick={() => setMode('navigate')}
            title="Navigate"
            style={{ padding: '8px', borderRadius: '8px', color: mode === 'navigate' ? 'white' : 'var(--color-text-muted)' }}
          >
            <Navigation size={20} />
          </button>
        </div>
      )}

      {/* Instructions / Status */}
      {mode === 'navigate' && (
        <div className="glass-panel" style={{
          position: 'absolute',
          zIndex: 10,
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.5rem 1rem'
        }}>
          <span style={{ fontSize: '0.9rem' }}>
            {navPoints.length === 0 ? "Tap Start Point" : "Tap Destination"}
          </span>
        </div>
      )}

      {/* Bottom Controls */}
      <div style={{
        position: 'absolute',
        zIndex: 10,
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px'
      }}>
        {!mapImage && (
          <UploadControl onUpload={setMapImage} />
        )}
      </div>
    </div>
  )
}

export default App
