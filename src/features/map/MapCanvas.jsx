import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

export default function MapCanvas(props) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng] = useState(0);
    const [lat] = useState(0);
    const [zoom] = useState(1);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize Map
    useEffect(() => {
        if (map.current) return;

        const bgColor = getComputedStyle(document.body).getPropertyValue('--color-bg-base').trim();

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {},
                layers: [
                    {
                        id: 'background',
                        type: 'background',
                        paint: {
                            'background-color': bgColor || '#0d1117'
                        }
                    }
                ]
            },
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false
        });

        map.current.on('load', () => {
            setIsLoaded(true);
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }, [lng, lat, zoom]);

    // Handle Image Overlay
    useEffect(() => {
        if (!map.current || !isLoaded || !props.imageOverlay) return;

        const sourceId = 'overlay-source';
        const layerId = 'overlay-layer';

        if (map.current.getSource(sourceId)) {
            if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
            map.current.removeSource(sourceId);
        }

        const coordinates = [
            [-0.001, 0.001], [0.001, 0.001], [0.001, -0.001], [-0.001, -0.001]
        ];

        map.current.addSource(sourceId, {
            type: 'image',
            url: props.imageOverlay,
            coordinates: coordinates
        });

        map.current.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: { 'raster-fade-duration': 0, 'raster-opacity': 1 }
        });

        const bounds = new maplibregl.LngLatBounds([-0.001, -0.001], [0.001, 0.001]);
        map.current.fitBounds(bounds, { padding: 50 });

    }, [props.imageOverlay, isLoaded]);

    // Graph Rendering (Nodes & Edges)
    useEffect(() => {
        if (!map.current || !isLoaded) return;
        const sourceId = 'graph-source';
        const nodeLayerId = 'graph-nodes';
        const edgeLayerId = 'graph-edges';

        if (!map.current.getSource(sourceId)) {
            map.current.addSource(sourceId, {
                type: 'geojson',
                data: props.graph || { type: 'FeatureCollection', features: [] }
            });

            // Edges
            map.current.addLayer({
                id: edgeLayerId,
                type: 'line',
                source: sourceId,
                filter: ['==', '$type', 'LineString'],
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#00d4ff', 'line-width': 3 }
            });

            // Nodes
            map.current.addLayer({
                id: nodeLayerId,
                type: 'circle',
                source: sourceId,
                filter: ['==', '$type', 'Point'],
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#ffffff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#00d4ff'
                }
            });
        } else {
            map.current.getSource(sourceId).setData(props.graph || { type: 'FeatureCollection', features: [] });
        }
    }, [props.graph, isLoaded]);

    // Active Path Rendering
    useEffect(() => {
        if (!map.current || !isLoaded) return;
        const sourceId = 'path-source';
        const layerId = 'path-layer';

        if (!map.current.getSource(sourceId)) {
            map.current.addSource(sourceId, {
                type: 'geojson',
                data: props.activePath || { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': '#00ff41', // Bright Green
                    'line-width': 5,
                    'line-opacity': 0.8
                }
            });
        } else {
            map.current.getSource(sourceId).setData(props.activePath || { type: 'FeatureCollection', features: [] });
        }
    }, [props.activePath, isLoaded]);

    // Interaction Handlers (Click)
    useEffect(() => {
        if (!map.current) return;

        let lastNode = null;

        const onClick = (e) => {
            const coords = [e.lngLat.lng, e.lngLat.lat];

            // Notify parent of click (for Navigation)
            if (props.onMapClick) {
                props.onMapClick(coords);
            }

            // Edit Logic
            if (props.mode === 'edit' && props.onGraphUpdate) {
                const newNode = {
                    type: 'Feature',
                    properties: { id: Date.now() },
                    geometry: { type: 'Point', coordinates: coords }
                };
                const newFeatures = [newNode];

                if (lastNode) {
                    newFeatures.push({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: [lastNode.geometry.coordinates, coords]
                        }
                    });
                }

                const updatedGraph = {
                    ...props.graph,
                    features: [...props.graph.features, ...newFeatures]
                };
                props.onGraphUpdate(updatedGraph);
                lastNode = newNode;
            }
        };

        const onDblClick = (e) => {
            if (props.mode === 'edit') {
                e.preventDefault();
                lastNode = null;
                console.log("Path drawing stopped");
            }
        };

        map.current.on('click', onClick);
        map.current.on('dblclick', onDblClick);

        return () => {
            if (map.current) {
                map.current.off('click', onClick);
                map.current.off('dblclick', onDblClick);
            }
        };
    }, [props.mode, props.graph, props.onMapClick]);

    return (
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    );
}
