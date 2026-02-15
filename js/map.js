/**
 * OWL Analysis System v4.0
 * Flight Map with Leaflet
 */

document.addEventListener('DOMContentLoaded', () => {
    initFlightMap();
});

function initFlightMap() {
    const mapContainer = document.getElementById('flightMap');
    
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }

    // Initialize map
    const map = L.map('flightMap').setView([25.0, -70.0], 4);

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Property locations
    const properties = [
        {
            name: 'Palm Beach Mansion',
            location: [26.7056, -80.0364],
            address: '358 El Brillo Way, Palm Beach, FL',
            type: 'Primary Residence'
        },
        {
            name: 'New York Townhouse',
            location: [40.7719, -73.9658],
            address: '9 East 71st Street, New York, NY',
            type: 'Residence'
        },
        {
            name: 'Zorro Ranch',
            location: [35.6870, -104.9207],
            address: 'Santa Fe, NM',
            type: 'Ranch'
        },
        {
            name: 'Little St. James',
            location: [18.3001, -64.8251],
            address: 'U.S. Virgin Islands',
            type: 'Private Island'
        },
        {
            name: 'Great St. James',
            location: [18.3062, -64.8189],
            address: 'U.S. Virgin Islands',
            type: 'Private Island'
        },
        {
            name: 'Paris Apartment',
            location: [48.8566, 2.3522],
            address: 'Paris, France',
            type: 'International Property'
        }
    ];

    // Add markers for each property
    properties.forEach(property => {
        const marker = L.marker(property.location, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #0d0f14; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"></div>',
                iconSize: [20, 20]
            })
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; color: var(--text-primary);">
                <h3 style="margin: 0 0 0.5rem; color: var(--cyan); font-size: 1rem;">${property.name}</h3>
                <p style="margin: 0.25rem 0; font-size: 0.875rem;"><strong>Type:</strong> ${property.type}</p>
                <p style="margin: 0.25rem 0; font-size: 0.875rem;"><strong>Address:</strong> ${property.address}</p>
            </div>
        `);
    });

    // Flight routes (sample data - would connect from flight logs)
    const routes = [
        [[26.7056, -80.0364], [18.3001, -64.8251]], // Palm Beach to Little St. James
        [[40.7719, -73.9658], [18.3001, -64.8251]], // NYC to Little St. James
        [[26.7056, -80.0364], [40.7719, -73.9658]], // Palm Beach to NYC
        [[35.6870, -104.9207], [26.7056, -80.0364]]  // Zorro Ranch to Palm Beach
    ];

    routes.forEach(route => {
        L.polyline(route, {
            color: '#06b6d4',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10'
        }).addTo(map);
    });
}
