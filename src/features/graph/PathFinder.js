import createGraph from 'ngraph.graph';
import path from 'ngraph.path';
import * as turf from '@turf/turf';

class PathFinder {
    constructor() {
        this.graph = createGraph();
        this.pathFinder = null;
    }

    /**
     * Build graph from GeoJSON
     * @param {Object} geojson FeatureCollection
     */
    buildGraph(geojson) {
        this.graph.clear();

        geojson.features.forEach(feature => {
            if (feature.geometry.type === 'LineString') {
                const coords = feature.geometry.coordinates;
                // Add edges between consecutive points
                for (let i = 0; i < coords.length - 1; i++) {
                    const from = coords[i];
                    const to = coords[i + 1];
                    // Use stringified coords as IDs
                    const fromId = from.join(',');
                    const toId = to.join(',');

                    // Add nodes (idempotent)
                    this.graph.addNode(fromId, { x: from[0], y: from[1] });
                    this.graph.addNode(toId, { x: to[0], y: to[1] });

                    // Calculate distance for weight
                    const distance = turf.distance(from, to);
                    this.graph.addLink(fromId, toId, { weight: distance });
                    this.graph.addLink(toId, fromId, { weight: distance }); // Bidirectional
                }
            }
        });

        this.pathFinder = path.aStar(this.graph, {
            distance(fromNode, toNode, link) {
                return link.data.weight;
            },
            heuristic(fromNode, toNode) {
                return turf.distance(
                    [fromNode.data.x, fromNode.data.y],
                    [toNode.data.x, toNode.data.y]
                );
            }
        });

        console.log(`Graph built: ${this.graph.getNodesCount()} nodes, ${this.graph.getLinksCount()} links`);
    }

    /**
     * Find path between two coordinates
     * @param {Array} startCoords [lng, lat]
     * @param {Array} endCoords [lng, lat]
     * @returns {Array} Array of coordinates [[lng, lat], ...]
     */
    findPath(startCoords, endCoords) {
        if (!this.pathFinder) return [];

        const startNodeId = this.findNearestNode(startCoords);
        const endNodeId = this.findNearestNode(endCoords);

        if (!startNodeId || !endNodeId) return [];

        const pathNodes = this.pathFinder.find(startNodeId, endNodeId);

        // ngraph.path returns nodes in reverse order (goal -> start)
        return pathNodes.map(node => [node.data.x, node.data.y]);
    }

    findNearestNode(coords) {
        let nearestId = null;
        let minDist = Infinity;

        this.graph.forEachNode(node => {
            const dist = turf.distance(coords, [node.data.x, node.data.y]);
            if (dist < minDist) {
                minDist = dist;
                nearestId = node.id;
            }
        });
        return nearestId;
    }
}

export const pathFinder = new PathFinder();
