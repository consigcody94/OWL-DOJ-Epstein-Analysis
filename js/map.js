/**
 * Interactive Flight Map
 * Leaflet.js with dark tiles showing Epstein's locations and flight paths
 */

class FlightMap {
    constructor() {
        this.map = null;
        this.locations = [
            {
                name: 'Palm Beach, FL',
                coords: [26.7056, -80.0364],
                code: 'PBI',
                type: 'property',
                details: '358 El Brillo Way - Primary residence, site of extensive abuse',
                flights: 127
            },
            {
                name: 'Teterboro, NJ',
                coords: [40.8501, -74.0608],
                code: 'TEB',
                type: 'airport',
                details: 'Private airport - Major hub for NY/NJ operations',
                flights: 89
            },
            {
                name: 'St. Thomas, USVI',
                coords: [18.3381, -64.8941],
                code: 'STT',
                type: 'airport',
                details: 'Airport serving Little St. James access',
                flights: 156
            },
            {
                name: 'Little St. James',
                coords: [18.3000, -64.8256],
                code: 'LSJ',
                type: 'property',
                details: 'Private island - Site of extensive criminal activity',
                flights: 156
            },
            {
                name: 'Santa Fe, NM',
                coords: [35.6870, -105.9378],
                code: 'SAF',
                type: 'airport',
                details: 'Airport serving Zorro Ranch',
                flights: 42
            },
            {
                name: 'Zorro Ranch, NM',
                coords: [35.6103, -105.5278],
                code: 'NMR',
                type: 'property',
                details: '7,500-acre ranch - Site of documented abuse',
                flights: 42
            },
            {
                name: 'New York, NY',
                coords: [40.7649, -73.9708],
                code: 'NYC',
                type: 'property',
                details: '9 E 71st St - Manhattan townhouse',
                flights: 98
            },
            {
                name: 'Paris, France',
                coords: [48.8566, 2.3522],
                code: 'CDG',
                type: 'international',
                details: 'International travel hub',
                flights: 23
            }
        ];

        this.flightPaths = [
            { from: 'TEB', to: 'PBI', frequency: 45 },
            { from: 'TEB', to: 'STT', frequency: 67 },
            { from: 'PBI', to: 'STT', frequency: 78 },
            { from: 'STT', to: 'LSJ', frequency: 156 },
            { from: 'TEB', to: 'SAF', frequency: 21 },
            { from: 'SAF', to: 'NMR', frequency: 42 },
            { from: 'NYC', to: 'TEB', frequency: 89 },
            { from: 'TEB', to: 'CDG', frequency: 15 }
        ];

        this.init();
    }

    init() {
        // Wait for the section to exist
        const checkSection = setInterval(() => {
            const timelineSection = document.getElementById('timeline');
            if (timelineSection) {
                clearInterval(checkSection);
                this.createMapSection();
                this.initMap();
            }
        }, 100);
    }

    createMapSection() {
        const timelineSection = document.getElementById('timeline');
        const mapSection = document.createElement('section');
        mapSection.id = 'flight-map';
        mapSection.innerHTML = `
            <div class="section-header">
                <div class="icon" aria-hidden="true">✈️</div>
                <h2>Flight Network</h2>
            </div>
            <div class="map-description">
                <p>Interactive map showing documented locations and flight paths from aircraft records.</p>
            </div>
            <div class="map-container">
                <div id="leaflet-map" style="height: 600px; border-radius: 8px; overflow: hidden;"></div>
            </div>
            <div class="map-legend">
                <div class="legend-item">
                    <span class="legend-marker property"></span>
                    <span>Property</span>
                </div>
                <div class="legend-item">
                    <span class="legend-marker airport"></span>
                    <span>Airport</span>
                </div>
                <div class="legend-item">
                    <span class="legend-path"></span>
                    <span>Flight Path</span>
                </div>
            </div>
        `;

        // Insert before timeline
        timelineSection.parentNode.insertBefore(mapSection, timelineSection);
    }

    initMap() {
        // Wait for Leaflet to load
        const waitForLeaflet = setInterval(() => {
            if (typeof L !== 'undefined') {
                clearInterval(waitForLeaflet);
                this.createMap();
            }
        }, 100);
    }

    createMap() {
        // Initialize map centered on continental US
        this.map = L.map('leaflet-map', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([35.0, -85.0], 4);

        // Dark theme tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        // Add markers
        this.addMarkers();

        // Add flight paths
        this.addFlightPaths();
    }

    addMarkers() {
        const locationsByCode = {};

        this.locations.forEach(location => {
            locationsByCode[location.code] = location;

            // Custom icon based on type
            const iconColor = this.getLocationColor(location.type);
            const icon = L.divIcon({
                className: 'flight-marker',
                html: `
                    <div class="marker-pin" style="background: ${iconColor}">
                        <div class="marker-pulse" style="background: ${iconColor}"></div>
                        ${this.getLocationIcon(location.type)}
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker(location.coords, { icon })
                .addTo(this.map)
                .bindPopup(`
                    <div class="map-popup">
                        <h4>${location.name}</h4>
                        <div class="popup-code">${location.code}</div>
                        <p>${location.details}</p>
                        <div class="popup-stat">
                            <strong>${location.flights}</strong> documented flights
                        </div>
                    </div>
                `);

            marker.on('mouseover', function() {
                this.openPopup();
            });
        });

        this.locationsByCode = locationsByCode;
    }

    addFlightPaths() {
        this.flightPaths.forEach((path, index) => {
            const fromLoc = this.locationsByCode[path.from];
            const toLoc = this.locationsByCode[path.to];

            if (!fromLoc || !toLoc) return;

            // Calculate path with curve
            const latlngs = this.calculateCurvedPath(fromLoc.coords, toLoc.coords);

            // Create animated path
            const opacity = Math.min(0.3 + (path.frequency / 100) * 0.4, 0.7);
            const weight = Math.min(1 + (path.frequency / 50), 4);

            const polyline = L.polyline(latlngs, {
                color: '#06b6d4',
                weight: weight,
                opacity: opacity,
                dashArray: '5, 10',
                className: 'flight-path'
            }).addTo(this.map);

            // Animate with delay
            setTimeout(() => {
                polyline.getElement()?.classList.add('animated');
            }, index * 200);

            // Tooltip
            polyline.bindTooltip(`
                <strong>${fromLoc.code} → ${toLoc.code}</strong><br>
                ${path.frequency} flights
            `, {
                sticky: true
            });
        });
    }

    calculateCurvedPath(start, end) {
        // Simple bezier curve approximation
        const midLat = (start[0] + end[0]) / 2;
        const midLng = (start[1] + end[1]) / 2;
        
        // Add curve offset perpendicular to the path
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
        const perpAngle = angle + Math.PI / 2;
        const curveHeight = 2; // degrees
        
        const curveLat = midLat + Math.sin(perpAngle) * curveHeight;
        const curveLng = midLng + Math.cos(perpAngle) * curveHeight;

        // Return points for smooth curve
        return [
            start,
            [start[0] * 0.75 + curveLat * 0.25, start[1] * 0.75 + curveLng * 0.25],
            [curveLat, curveLng],
            [end[0] * 0.75 + curveLat * 0.25, end[1] * 0.75 + curveLng * 0.25],
            end
        ];
    }

    getLocationColor(type) {
        const colors = {
            property: '#ef4444',
            airport: '#3b82f6',
            international: '#8b5cf6'
        };
        return colors[type] || '#06b6d4';
    }

    getLocationIcon(type) {
        const icons = {
            property: '🏠',
            airport: '✈️',
            international: '🌍'
        };
        return icons[type] || '📍';
    }
}

// Initialize when DOM and Leaflet are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Load Leaflet CSS and JS
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        leafletCSS.crossOrigin = '';
        document.head.appendChild(leafletCSS);

        const leafletJS = document.createElement('script');
        leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        leafletJS.crossOrigin = '';
        document.head.appendChild(leafletJS);

        leafletJS.onload = () => {
            window.flightMap = new FlightMap();
        };
    });
} else {
    // Load Leaflet
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(leafletJS);

    leafletJS.onload = () => {
        window.flightMap = new FlightMap();
    };
}
