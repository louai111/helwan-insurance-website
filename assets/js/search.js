// Global variables
let allProviders = [];
let currentFilters = {
    mainCategory: '',
    specialty: '',
    area: '',
    searchQuery: ''
};

// DOM Elements
const mainCategorySelect = document.getElementById('mainCategory');
const specialtySelect = document.getElementById('specialty');
const areaSelect = document.getElementById('area');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');

// Initialize the application
async function initializeApp() {
    try {
        // Load data from all JSON files
        const [hospitals, pharmacies, clinics, labs, doctors] = await Promise.all([
            fetchData('data/hospitals.json', 'hospitals'),
            fetchData('data/pharmacies.json', 'pharmacies'),
            fetchData('data/clinics.json', 'clinics'),
            fetchData('data/labs.json', 'labs'),
            fetchData('data/doctors.json', 'doctors')
        ]);

        // Combine all providers
        allProviders = [
            ...hospitals,
            ...pharmacies,
            ...clinics,
            ...labs,
            ...doctors
        ];
        
        // Initialize filters
        initializeFilters();
        
        // Set up event listeners
        setupEventListeners();
        
        // Show initial results
        applyFilters();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('حدث خطأ أثناء تحميل البيانات. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    }
}

// Fetch data from JSON file
async function fetchData(file, category) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        // Add category to each provider
        return data.map(provider => ({ ...provider, category }));
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
        return [];
    }
}

// Initialize filter options
function initializeFilters() {
    // Get unique areas
    const areas = [...new Set(allProviders.map(p => p.area))].filter(Boolean);
    areas.sort((a, b) => a.localeCompare(b, 'ar'));

    // Populate area select
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaSelect.appendChild(option);
    });

    // Initialize select2 for area dropdown
    $(areaSelect).select2({
        theme: 'bootstrap-5',
        placeholder: 'اختر المنطقة',
        allowClear: true,
        dir: 'rtl',
        language: {
            noResults: function() {
                return "لا توجد نتائج";
            },
            searching: function() {
                return "جاري البحث...";
            }
        }
    });

    // Initialize specialties
    updateSpecialties();
}

// Update specialties based on main category
function updateSpecialties() {
    specialtySelect.innerHTML = '<option value="">الكل</option>';
    
    if (!currentFilters.mainCategory) return;

    const categorySpecialties = new Set(
        allProviders
            .filter(p => p.category === currentFilters.mainCategory)
            .map(p => p.specialty)
    );

    const sortedSpecialties = Array.from(categorySpecialties).sort((a, b) => a.localeCompare(b, 'ar'));
    
    sortedSpecialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtySelect.appendChild(option);
    });
}

// Set up event listeners
function setupEventListeners() {
    mainCategorySelect.addEventListener('change', handleMainCategoryChange);
    specialtySelect.addEventListener('change', handleFilterChange);
    areaSelect.addEventListener('change', handleFilterChange);
    searchInput.addEventListener('input', handleFilterChange);
}

// Handle main category change
function handleMainCategoryChange() {
    currentFilters.mainCategory = mainCategorySelect.value;
    updateSpecialties();
    handleFilterChange();
}

// Handle filter changes
function handleFilterChange() {
    currentFilters.specialty = specialtySelect.value;
    currentFilters.area = $(areaSelect).val();
    currentFilters.searchQuery = searchInput.value.toLowerCase();
    applyFilters();
}

// Apply all filters
function applyFilters() {
    let filteredProviders = allProviders;

    if (currentFilters.mainCategory) {
        filteredProviders = filteredProviders.filter(p => p.category === currentFilters.mainCategory);
    }

    if (currentFilters.specialty) {
        filteredProviders = filteredProviders.filter(p => p.specialty === currentFilters.specialty);
    }

    if (currentFilters.area) {
        filteredProviders = filteredProviders.filter(p => p.area === currentFilters.area);
    }

    if (currentFilters.searchQuery) {
        filteredProviders = filteredProviders.filter(p => 
            p.name.toLowerCase().includes(currentFilters.searchQuery) ||
            p.specialty.toLowerCase().includes(currentFilters.searchQuery)
        );
    }

    displayResults(filteredProviders);
}

// Display results
function displayResults(providers) {
    resultsContainer.innerHTML = '';
    
    if (providers.length === 0) {
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                لا توجد نتائج تطابق معايير البحث
            </div>
        `;
        return;
    }

    providers.forEach(provider => {
        const card = createProviderCard(provider);
        resultsContainer.appendChild(card);
    });
}

// Create provider card
function createProviderCard(provider) {
    const card = document.createElement('div');
    card.className = 'provider-card p-4';
    
    // Split phone numbers
    const phoneNumbers = provider.phone
        .split(/[-\s–]/)
        .map(num => num.trim())
        .filter(num => num.length > 0);

    card.innerHTML = `
        <h3 class="text-lg font-bold mb-2">${provider.name}</h3>
        <p class="text-gray-600 mb-2">${provider.specialty}</p>
        <p class="text-gray-500 mb-2">${provider.area}</p>
        <div class="phone-numbers">
            ${phoneNumbers.map(phone => `
                <a href="tel:${phone}" class="phone-link">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    ${phone}
                </a>
            `).join('')}
        </div>
    `;
    
    return card;
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 