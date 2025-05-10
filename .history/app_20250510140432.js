// Data structure for providers
let providers = [];
let filteredProviders = [];

// DOM Elements
const mainCategorySelect = document.getElementById('mainCategory');
const specialtySelect = document.getElementById('specialty');
const areaSelect = document.getElementById('area');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');

// Initialize the application
async function init() {
    try {
        // Load data from JSON files
        const [hospitals, pharmacies, clinics, labs, doctors] = await Promise.all([
            fetchData('data/hospitals.json'),
            fetchData('data/pharmacies.json'),
            fetchData('data/clinics.json'),
            fetchData('data/labs.json'),
            fetchData('data/doctors.json')
        ]);

        // Combine all providers
        providers = [
            ...hospitals.map(p => ({ ...p, type: 'hospitals' })),
            ...pharmacies.map(p => ({ ...p, type: 'pharmacies' })),
            ...clinics.map(p => ({ ...p, type: 'clinics' })),
            ...labs.map(p => ({ ...p, type: 'labs' })),
            ...doctors.map(p => ({ ...p, type: 'doctors' }))
        ];

        // Initialize filters
        initializeFilters();
        
        // Show all providers initially
        filteredProviders = [...providers];
        renderResults();

        // Add event listeners
        addEventListeners();
    } catch (error) {
        console.error('Error initializing application:', error);
        showError('حدث خطأ أثناء تحميل البيانات');
    }
}

// Fetch data from JSON file
async function fetchData(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
        return [];
    }
}

// Initialize filter options
function initializeFilters() {
    // Get unique specialties and areas
    const specialties = [...new Set(providers.map(p => p.specialty))].filter(Boolean);
    const areas = [...new Set(providers.map(p => p.area))].filter(Boolean);

    // Populate specialty select
    specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtySelect.appendChild(option);
    });

    // Populate area select
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaSelect.appendChild(option);
    });
}

// Add event listeners
function addEventListeners() {
    mainCategorySelect.addEventListener('change', filterResults);
    specialtySelect.addEventListener('change', filterResults);
    areaSelect.addEventListener('change', filterResults);
    searchInput.addEventListener('input', debounce(filterResults, 300));
}

// Filter results based on selected criteria
function filterResults() {
    const category = mainCategorySelect.value;
    const specialty = specialtySelect.value;
    const area = areaSelect.value;
    const searchTerm = searchInput.value.trim().toLowerCase();

    filteredProviders = providers.filter(provider => {
        const matchesCategory = !category || provider.type === category;
        const matchesSpecialty = !specialty || provider.specialty === specialty;
        const matchesArea = !area || provider.area === area;
        const matchesSearch = !searchTerm || 
            provider.name.toLowerCase().includes(searchTerm) ||
            provider.specialty?.toLowerCase().includes(searchTerm) ||
            provider.area.toLowerCase().includes(searchTerm);

        return matchesCategory && matchesSpecialty && matchesArea && matchesSearch;
    });

    renderResults();
}

// Render results to the DOM
function renderResults() {
    resultsContainer.innerHTML = '';

    if (filteredProviders.length === 0) {
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center p-4">
                <p class="text-gray-500">لا توجد نتائج</p>
            </div>
        `;
        return;
    }

    filteredProviders.forEach(provider => {
        const card = createProviderCard(provider);
        resultsContainer.appendChild(card);
    });
}

// Create provider card element
function createProviderCard(provider) {
    const card = document.createElement('div');
    card.className = 'provider-card p-4';
    
    card.innerHTML = `
        <h3 class="text-lg font-bold mb-2">${provider.name}</h3>
        ${provider.specialty ? `<p class="text-gray-600 mb-2">${provider.specialty}</p>` : ''}
        <p class="text-gray-600 mb-2">${provider.area}</p>
        <p class="text-gray-600 mb-2">${provider.address}</p>
        <a href="tel:${provider.phone}" class="phone-link">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            ${provider.phone}
        </a>
    `;

    return card;
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show error message
function showError(message) {
    resultsContainer.innerHTML = `
        <div class="col-span-full text-center p-4">
            <p class="text-red-500">${message}</p>
        </div>
    `;
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 