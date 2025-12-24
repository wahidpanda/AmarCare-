// ===================== DOCTOR FINDER - GUARANTEED WORKING SOLUTION =====================

let currentSpecialty = '';
let userLocation = null;

// Initialize doctor finder when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDoctorFinderUI();
    checkLocationSupport();
});

// Initialize UI elements
function initializeDoctorFinderUI() {
    // Check if we're on a disease page
    const path = window.location.pathname;
    if (path.includes('diabetes')) currentSpecialty = 'diabetes';
    else if (path.includes('heart')) currentSpecialty = 'heart';
    else if (path.includes('kidney')) currentSpecialty = 'kidney';
    else currentSpecialty = 'general';
}

// Check browser location support
function checkLocationSupport() {
    if (!navigator.geolocation) {
        updateLocationStatus('unsupported', 'Your browser does not support location services.');
        return false;
    }
    
    // Try to get permission state (newer browsers)
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'granted') {
                updateLocationStatus('granted', 'Location access is enabled.');
                getCurrentLocation(); // Automatically get location if already granted
            } else if (result.state === 'prompt') {
                updateLocationStatus('prompt', 'Click "Auto-detect" to allow location access.');
            } else {
                updateLocationStatus('denied', 'Location is blocked. Use manual entry or quick cities.');
            }
            
            // Listen for changes
            result.onchange = () => {
                updateLocationStatus(result.state, getStatusMessage(result.state));
            };
        });
    }
    
    return true;
}

// Update location status display
function updateLocationStatus(status, message) {
    const badge = document.getElementById('location-badge');
    const messageEl = document.getElementById('location-message');
    
    if (!badge || !messageEl) return;
    
    switch(status) {
        case 'granted':
            badge.className = 'badge bg-success me-2';
            badge.innerHTML = '<i class="fas fa-check-circle"></i> Location Enabled';
            break;
        case 'denied':
            badge.className = 'badge bg-danger me-2';
            badge.innerHTML = '<i class="fas fa-ban"></i> Location Blocked';
            break;
        case 'unsupported':
            badge.className = 'badge bg-secondary me-2';
            badge.innerHTML = '<i class="fas fa-times-circle"></i> Not Supported';
            break;
        default:
            badge.className = 'badge bg-warning me-2';
            badge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Location Required';
    }
    
    messageEl.textContent = message;
}

function getStatusMessage(status) {
    switch(status) {
        case 'granted': return 'Location access is enabled.';
        case 'denied': return 'Location is blocked. Use manual entry or quick cities.';
        case 'prompt': return 'Click "Auto-detect" to allow location access.';
        default: return 'Location service status unknown.';
    }
}

// Main function to request location
function requestLocationPermission() {
    const resultsContainer = document.getElementById('doctor-results');
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Requesting location access...</p>
            <p class="small text-muted">Please check for browser permission prompt</p>
        </div>
    `;
    
    // IMPORTANT: Use a timeout to trigger the permission prompt
    setTimeout(() => {
        if (!navigator.geolocation) {
            showError('Geolocation is not supported by your browser.');
            return;
        }
        
        const options = {
            enableHighAccuracy: false, // Set to false for better compatibility
            timeout: 10000,
            maximumAge: 0
        };
        
        // Method 1: Try getCurrentPosition first
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success!
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                updateLocationStatus('granted', 'Location obtained successfully!');
                findDoctorsByCoordinates(userLocation.lat, userLocation.lng);
            },
            (error) => {
                console.log('getCurrentPosition failed:', error);
                
                // Method 2: Try watchPosition (sometimes works better)
                tryWatchPosition();
            },
            options
        );
    }, 100);
}

// Alternative method using watchPosition
function tryWatchPosition() {
    const resultsContainer = document.getElementById('doctor-results');
    
    resultsContainer.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Trying alternative location method...</p>
        </div>
    `;
    
    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            // Success with watchPosition
            navigator.geolocation.clearWatch(watchId);
            
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            updateLocationStatus('granted', 'Location obtained!');
            findDoctorsByCoordinates(userLocation.lat, userLocation.lng);
        },
        (error) => {
            navigator.geolocation.clearWatch(watchId);
            handleLocationError(error);
        },
        {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 0
        }
    );
    
    // Fallback after 8 seconds
    setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        showManualLocationOptions();
    }, 8000);
}

// Handle location errors
function handleLocationError(error) {
    const resultsContainer = document.getElementById('doctor-results');
    
    let errorMessage = '';
    let showInstructions = false;
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. ';
            showInstructions = true;
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. ';
            break;
        case error.TIMEOUT:
            errorMessage = 'Location request timed out. ';
            break;
        default:
            errorMessage = 'An error occurred while getting location. ';
    }
    
    errorMessage += 'Please use the manual location options below.';
    
    updateLocationStatus('denied', errorMessage);
    showManualLocationOptions();
    
    if (showInstructions) {
        showBrowserInstructions();
    }
}

// Show browser-specific instructions
function showBrowserInstructions() {
    const instructions = `
        <div class="alert alert-warning mt-3">
            <h6><i class="fas fa-question-circle"></i> How to Enable Location in Chrome:</h6>
            <ol class="small mb-2">
                <li>Click the lock icon (🔒) in the address bar</li>
                <li>Click "Site settings"</li>
                <li>Scroll to "Location"</li>
                <li>Change from "Block" to "Allow"</li>
                <li>Refresh this page and try again</li>
            </ol>
            <p class="small mb-0"><strong>Quick fix:</strong> Try accessing your site using <code>http://localhost:5000</code> instead of <code>127.0.0.1</code></p>
        </div>
    `;
    
    const resultsContainer = document.getElementById('doctor-results');
    resultsContainer.innerHTML += instructions;
}

// Manual location options
function showManualLocationOptions() {
    const resultsContainer = document.getElementById('doctor-results');
    
    resultsContainer.innerHTML = `
        <div class="alert alert-info">
            <h6><i class="fas fa-map-marker-alt"></i> Manual Location Search</h6>
            <p class="mb-3">Enter your location to find doctors:</p>
            
            <div class="input-group mb-3">
                <input type="text" 
                       class="form-control" 
                       id="search-location" 
                       placeholder="e.g., New York, NY 10001"
                       autofocus>
                <button class="btn btn-primary" onclick="searchManualLocation()">
                    <i class="fas fa-search"></i> Search
                </button>
            </div>
            
            <div class="quick-search mt-3">
                <p class="small mb-2"><strong>Quick search:</strong></p>
                <div class="d-flex flex-wrap gap-2">
                    ${getCityButtons()}
                </div>
            </div>
        </div>
    `;
}

function getCityButtons() {
    const cities = [
        {name: 'New York', emoji: '🗽'},
        {name: 'Los Angeles', emoji: '🌴'},
        {name: 'Chicago', emoji: '🏙️'},
        {name: 'Houston', emoji: '🛢️'},
        {name: 'Miami', emoji: '🌊'},
        {name: 'London', emoji: '🇬🇧'},
        {name: 'Toronto', emoji: '🇨🇦'},
        {name: 'Sydney', emoji: '🇦🇺'}
    ];
    
    return cities.map(city => 
        `<button class="btn btn-outline-primary btn-sm" onclick="useCity('${city.name}')">
            ${city.emoji} ${city.name}
        </button>`
    ).join('');
}

// Use manual location input
function useManualLocation() {
    const input = document.getElementById('manual-location');
    const location = input.value.trim();
    
    if (!location) {
        showError('Please enter a location first.');
        input.focus();
        return;
    }
    
    findDoctorsByCity(location);
}

function searchManualLocation() {
    const input = document.getElementById('search-location');
    const location = input.value.trim();
    
    if (!location) {
        showError('Please enter a location first.');
        input.focus();
        return;
    }
    
    findDoctorsByCity(location);
}

function useCity(cityName) {
    // Set in input field if exists
    const manualInput = document.getElementById('manual-location');
    const searchInput = document.getElementById('search-location');
    
    if (manualInput) manualInput.value = cityName;
    if (searchInput) searchInput.value = cityName;
    
    findDoctorsByCity(cityName);
}

// Find doctors by coordinates
function findDoctorsByCoordinates(lat, lng) {
    const resultsContainer = document.getElementById('doctor-results');
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Finding specialists near your location...</p>
            <p class="small text-muted">Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}</p>
        </div>
    `;
    
    // Simulate API call delay
    setTimeout(() => {
        showDoctorResults(lat, lng, null);
    }, 1500);
}

// Find doctors by city name
function findDoctorsByCity(city) {
    const resultsContainer = document.getElementById('doctor-results');
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Finding specialists in ${city}...</p>
        </div>
    `;
    
    // Generate mock coordinates for the city
    const mockCoords = getMockCoordinates(city);
    
    // Simulate API call delay
    setTimeout(() => {
        showDoctorResults(mockCoords.lat, mockCoords.lng, city);
    }, 1500);
}

// Get mock coordinates for cities
function getMockCoordinates(city) {
    const cityCoords = {
        'New York': { lat: 40.7128, lng: -74.0060 },
        'Los Angeles': { lat: 34.0522, lng: -118.2437 },
        'Chicago': { lat: 41.8781, lng: -87.6298 },
        'Houston': { lat: 29.7604, lng: -95.3698 },
        'Miami': { lat: 25.7617, lng: -80.1918 },
        'London': { lat: 51.5074, lng: -0.1278 },
        'Toronto': { lat: 43.6511, lng: -79.3470 },
        'Sydney': { lat: -33.8688, lng: 151.2093 }
    };
    
    // Add random variation for realism
    const base = cityCoords[city] || { lat: 40.7128, lng: -74.0060 };
    return {
        lat: base.lat + (Math.random() * 0.1 - 0.05),
        lng: base.lng + (Math.random() * 0.1 - 0.05)
    };
}

// Show doctor results
function showDoctorResults(lat, lng, city = null) {
    const resultsContainer = document.getElementById('doctor-results');
    const doctorType = getDoctorType(currentSpecialty);
    
    const locationText = city 
        ? `in ${city}`
        : `near your location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    
    resultsContainer.innerHTML = `
        <div class="doctors-results">
            <div class="alert alert-success">
                <h5><i class="fas fa-stethoscope"></i> ${doctorType}s Found</h5>
                <p class="mb-0">Showing ${doctorType.toLowerCase()}s ${locationText}</p>
            </div>
            
            ${generateDoctorCards(doctorType, lat, lng)}
            
            <div class="additional-actions mt-4">
                <div class="d-grid gap-2">
                    <a href="https://www.google.com/maps/search/${doctorType}+near+me/@${lat},${lng},15z" 
                       target="_blank" 
                       class="btn btn-success">
                        <i class="fas fa-external-link-alt"></i> View on Google Maps
                    </a>
                    <button class="btn btn-outline-primary" onclick="showEmergencyContacts()">
                        <i class="fas fa-ambulance"></i> Emergency Contacts
                    </button>
                    <button class="btn btn-outline-secondary" onclick="resetDoctorSearch()">
                        <i class="fas fa-redo"></i> New Search
                    </button>
                </div>
                
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle"></i>
                    <small>
                        <strong>Note:</strong> These are simulated results for demonstration. 
                        In a production application, this would connect to real healthcare databases.
                    </small>
                </div>
            </div>
        </div>
    `;
}

// Generate doctor cards
function generateDoctorCards(doctorType, lat, lng) {
    const doctors = [
        {
            name: `City General Hospital - ${doctorType} Department`,
            distance: (Math.random() * 5 + 0.5).toFixed(1),
            phone: "(555) 123-4567",
            hours: "Open until 7:00 PM",
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            reviews: Math.floor(Math.random() * 150 + 50),
            address: "123 Medical Center Dr",
            icon: "fas fa-hospital"
        },
        {
            name: `${doctorType} Specialty Center`,
            distance: (Math.random() * 3 + 1).toFixed(1),
            phone: "(555) 987-6543",
            hours: "Open until 5:30 PM",
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            reviews: Math.floor(Math.random() * 100 + 30),
            address: "456 Health Avenue",
            icon: "fas fa-clinic-medical"
        },
        {
            name: `Dr. ${doctorType.split(' ')[0]}'s Private Practice`,
            distance: (Math.random() * 4 + 2).toFixed(1),
            phone: "(555) 456-7890",
            hours: "By appointment",
            rating: (Math.random() * 1.5 + 4.0).toFixed(1),
            reviews: Math.floor(Math.random() * 80 + 20),
            address: "789 Wellness Street",
            icon: "fas fa-user-md"
        }
    ];
    
    return doctors.map(doctor => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${doctor.name}</h5>
                        <p class="text-muted mb-1">
                            <i class="${doctor.icon}"></i> ${doctor.distance} miles away
                        </p>
                    </div>
                    <span class="badge bg-success">${doctor.rating} ★</span>
                </div>
                
                <div class="doctor-details mt-3">
                    <p class="mb-1">
                        <i class="fas fa-map-marker-alt text-danger"></i> ${doctor.address}
                    </p>
                    <p class="mb-1">
                        <i class="fas fa-phone text-success"></i> ${doctor.phone}
                    </p>
                    <p class="mb-1">
                        <i class="fas fa-clock text-info"></i> ${doctor.hours}
                    </p>
                    <p class="mb-3">
                        <i class="fas fa-star text-warning"></i> ${doctor.rating} (${doctor.reviews} reviews)
                    </p>
                </div>
                
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="getDirections(${lat}, ${lng})">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="callDoctor('${doctor.phone}')">
                        <i class="fas fa-phone"></i> Call
                    </button>
                    <button class="btn btn-outline-success btn-sm" onclick="bookAppointment('${doctor.name}')">
                        <i class="fas fa-calendar-check"></i> Book
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper functions
function getDoctorType(specialty) {
    const types = {
        diabetes: "Endocrinologist",
        heart: "Cardiologist",
        kidney: "Nephrologist",
        general: "General Practitioner"
    };
    return types[specialty] || "Specialist";
}

function showError(message) {
    const resultsContainer = document.getElementById('doctor-results');
    resultsContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i> ${message}
        </div>
    `;
}

function showEmergencyContacts() {
    const emergencyHTML = `
        <div class="modal fade" id="emergencyModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title"><i class="fas fa-ambulance"></i> Emergency Contacts</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <strong>This is NOT an emergency service.</strong>
                            <p class="mb-0">If you're experiencing a medical emergency, call your local emergency number immediately.</p>
                        </div>
                        
                        <h6>Emergency Numbers:</h6>
                        <ul class="list-group mb-3">
                            <li class="list-group-item">
                                <strong>United States:</strong> 911
                                <button class="btn btn-sm btn-outline-danger float-end" onclick="window.open('tel:911')">
                                    <i class="fas fa-phone"></i> Call
                                </button>
                            </li>
                            <li class="list-group-item">
                                <strong>United Kingdom:</strong> 999 or 112
                            </li>
                            <li class="list-group-item">
                                <strong>Canada:</strong> 911
                            </li>
                            <li class="list-group-item">
                                <strong>Australia:</strong> 000
                            </li>
                            <li class="list-group-item">
                                <strong>European Union:</strong> 112
                            </li>
                        </ul>
                        
                        <h6>Additional Resources:</h6>
                        <ul class="list-group">
                            <li class="list-group-item">
                                <strong>Suicide Prevention (US):</strong> 988
                                <button class="btn btn-sm btn-outline-primary float-end" onclick="window.open('tel:988')">
                                    <i class="fas fa-phone"></i> Call
                                </button>
                            </li>
                            <li class="list-group-item">
                                <strong>Poison Control (US):</strong> 1-800-222-1222
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page if not exists
    if (!document.getElementById('emergencyModal')) {
        document.body.insertAdjacentHTML('beforeend', emergencyHTML);
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('emergencyModal'));
    modal.show();
}

function getDirections(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

function callDoctor(phoneNumber) {
    if (confirm(`Call ${phoneNumber}?`)) {
        window.open(`tel:${phoneNumber}`);
    }
}

function bookAppointment(doctorName) {
    alert(`Appointment booking feature would open for ${doctorName}.`);
}

function resetDoctorSearch() {
    const resultsContainer = document.getElementById('doctor-results');
    resultsContainer.innerHTML = '';
    document.getElementById('manual-location').value = '';
}

// Make functions globally available
window.requestLocationPermission = requestLocationPermission;
window.useManualLocation = useManualLocation;
window.useCity = useCity;
window.searchManualLocation = searchManualLocation;