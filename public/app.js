// Global state
let currentFlights = [];
let debounceTimer = null;

// DOM Elements
const searchForm = document.getElementById('searchForm');
const originInput = document.getElementById('origin');
const originCode = document.getElementById('originCode');
const originResults = document.getElementById('originResults');
const destinationInput = document.getElementById('destination');
const destinationCode = document.getElementById('destinationCode');
const destinationResults = document.getElementById('destinationResults');
const departDateInput = document.getElementById('departDate');
const returnDateInput = document.getElementById('returnDate');
const passengersInput = document.getElementById('passengers');
const sortBySelect = document.getElementById('sortBy');
const resultsSection = document.getElementById('resultsSection');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const resultsContainer = document.getElementById('resultsContainer');

// Initialize
function init() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    departDateInput.setAttribute('min', today);
    departDateInput.value = today;

    // Setup event listeners
    searchForm.addEventListener('submit', handleSearchSubmit);
    originInput.addEventListener('input', (e) => handleAirportInput(e, originResults, originCode));
    destinationInput.addEventListener('input', (e) => handleAirportInput(e, destinationResults, destinationCode));
    sortBySelect.addEventListener('change', handleSortChange);

    // Update return date minimum when departure date changes
    departDateInput.addEventListener('change', () => {
        returnDateInput.setAttribute('min', departDateInput.value);
        if (returnDateInput.value && returnDateInput.value < departDateInput.value) {
            returnDateInput.value = '';
        }
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!originInput.contains(e.target)) {
            originResults.classList.remove('active');
        }
        if (!destinationInput.contains(e.target)) {
            destinationResults.classList.remove('active');
        }
    });
}

// Airport autocomplete with debounce
function handleAirportInput(event, resultsElement, codeInput) {
    const query = event.target.value.trim();

    if (query.length < 2) {
        resultsElement.classList.remove('active');
        resultsElement.innerHTML = '';
        codeInput.value = '';
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            const response = await fetch(`/search/airports?query=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch airports');
            }

            const airports = await response.json();
            renderAirportDropdown(resultsElement, airports, event.target, codeInput);
        } catch (error) {
            console.error('Airport search error:', error);
            resultsElement.innerHTML = '<div class="autocomplete-item">Failed to load airports</div>';
            resultsElement.classList.add('active');
        }
    }, 300);
}

// Render airport dropdown
function renderAirportDropdown(resultsElement, airports, inputElement, codeInput) {
    if (!airports || airports.length === 0) {
        resultsElement.innerHTML = '<div class="autocomplete-item">No airports found</div>';
        resultsElement.classList.add('active');
        return;
    }

    const html = airports.map(airport => `
        <div class="autocomplete-item" data-code="${airport.code}" data-name="${airport.name}">
            <div>
                <span class="airport-code">${airport.code}</span>
                <span class="airport-name">${airport.name}</span>
            </div>
            <div class="airport-location">${airport.city}, ${airport.country}</div>
        </div>
    `).join('');

    resultsElement.innerHTML = html;
    resultsElement.classList.add('active');

    // Add click handlers
    resultsElement.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const code = item.dataset.code;
            const name = item.dataset.name;
            inputElement.value = `${code} - ${name}`;
            codeInput.value = code;
            resultsElement.classList.remove('active');
        });
    });
}

// Handle search form submission
async function handleSearchSubmit(event) {
    event.preventDefault();

    const origin = originCode.value;
    const destination = destinationCode.value;
    const departDate = departDateInput.value;
    const returnDate = returnDateInput.value || undefined;
    const passengers = parseInt(passengersInput.value);

    // Validation
    if (!origin || !destination) {
        showError('Please select valid origin and destination airports from the dropdown');
        return;
    }

    if (origin === destination) {
        showError('Origin and destination must be different');
        return;
    }

    // Show loading state
    resultsSection.style.display = 'block';
    loadingSpinner.style.display = 'block';
    errorMessage.style.display = 'none';
    resultsContainer.innerHTML = '';

    const searchButton = searchForm.querySelector('button[type="submit"]');
    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';

    try {
        const requestBody = {
            origin,
            destination,
            departDate,
            passengers
        };

        if (returnDate) {
            requestBody.returnDate = returnDate;
        }

        const response = await fetch('/search/flights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to search flights');
        }

        const flights = await response.json();
        currentFlights = flights;

        // Hide loading, show results
        loadingSpinner.style.display = 'none';

        if (flights.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No flights found for your search. Try different dates or airports.</div>';
        } else {
            renderFlights(flights);
        }
    } catch (error) {
        console.error('Search error:', error);
        loadingSpinner.style.display = 'none';
        showError(error.message || 'Failed to search flights. Please try again.');
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = 'Search Flights';
    }
}

// Handle sort change
function handleSortChange() {
    if (currentFlights.length > 0) {
        renderFlights(currentFlights);
    }
}

// Render flight results
function renderFlights(flights) {
    const sortBy = sortBySelect.value;

    // Sort flights
    const sortedFlights = [...flights].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return a.price - b.price;
            case 'duration':
                return a.durationMinutes - b.durationMinutes;
            case 'stops':
                return a.stops - b.stops;
            default:
                return 0;
        }
    });

    const html = sortedFlights.map(flight => renderFlightCard(flight)).join('');
    resultsContainer.innerHTML = html;
}

// Render individual flight card
function renderFlightCard(flight) {
    const stopsText = flight.stops === 0 ? 'Non-stop' :
                     flight.stops === 1 ? '1 stop' :
                     `${flight.stops} stops`;

    const stopsClass = `stops-${Math.min(flight.stops, 2)}`;

    const duration = formatDuration(flight.durationMinutes);

    const segmentsHtml = flight.segments.map(segment => `
        <div class="segment">
            <div class="segment-point">
                <div class="segment-time">${formatTime(segment.departAt)}</div>
                <div class="segment-airport">${segment.from}</div>
            </div>
            <div class="segment-arrow">
                <div>→</div>
                <div class="segment-flight">${segment.carrier} ${segment.flightNumber}</div>
            </div>
            <div class="segment-point">
                <div class="segment-time">${formatTime(segment.arriveAt)}</div>
                <div class="segment-airport">${segment.to}</div>
            </div>
        </div>
    `).join('');

    return `
        <div class="flight-card">
            <div class="flight-header">
                <div class="flight-price">$${flight.price.toFixed(2)}</div>
                <div class="flight-info">
                    <div class="info-item">
                        <span class="info-label">Duration</span>
                        <span class="info-value">${duration}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Stops</span>
                        <span class="info-value">
                            <span class="stops-badge ${stopsClass}">${stopsText}</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Provider</span>
                        <span class="info-value">${flight.provider}</span>
                    </div>
                </div>
            </div>
            <div class="flight-segments">
                <div class="segment-title">Flight Details</div>
                ${segmentsHtml}
            </div>
        </div>
    `;
}

// Format duration from minutes to readable format
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Format ISO datetime to readable time
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    resultsSection.style.display = 'block';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
