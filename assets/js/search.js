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

// Check if all required elements exist
function validateElements() {
    const elements = {
        mainCategorySelect,
        specialtySelect,
        areaSelect,
        searchInput,
        resultsContainer
    };

    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Required element not found: ${name}`);
            return false;
        }
    }
    return true;
}

// Initialize Select2 for a dropdown
function initializeSelect2(element, config) {
    try {
        if (!element || !window.jQuery || !window.jQuery.fn.select2) {
            console.error('Required dependencies not found for Select2 initialization');
            return false;
        }

        // Destroy existing Select2 instance if it exists
        if ($(element).data('select2')) {
            $(element).select2('destroy');
        }

        // Initialize new Select2 instance
        $(element).select2(config);
        return true;
    } catch (error) {
        console.error('Error initializing Select2:', error);
        return false;
    }
}

// Initialize the application
async function initializeApp() {
    try {
        // Validate DOM elements
        if (!validateElements()) {
            throw new Error('Required DOM elements not found');
        }

        // Validate jQuery and Select2
        if (!window.jQuery || !window.jQuery.fn.select2) {
            throw new Error('jQuery or Select2 not loaded');
        }

        console.log('Loading data files...');
        // Load data from all JSON files
        const [hospitals, pharmacies, clinics, labs, doctors] = await Promise.all([
            fetchData('data/hospitals.json', 'hospitals'),
            fetchData('data/pharmacies.json', 'pharmacies'),
            fetchData('data/clinics.json', 'clinics'),
            fetchData('data/labs.json', 'labs'),
            fetchData('data/doctors.json', 'doctors')
        ]);

        console.log('Data loaded:', {
            hospitals: hospitals.length,
            pharmacies: pharmacies.length,
            clinics: clinics.length,
            labs: labs.length,
            doctors: doctors.length
        });

        // Combine all providers
        allProviders = [
            ...hospitals,
            ...pharmacies,
            ...clinics,
            ...labs,
            ...doctors
        ];
        
        console.log('Total providers:', allProviders.length);
        
        // Initialize filters
        initializeFilters();
        
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
        console.log(`Fetching ${file}...`);
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log(`Loaded ${data.length} items from ${file}`);
        // Add category to each provider
        return data.map(provider => ({ ...provider, category }));
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
        return [];
    }
}

// Initialize filter options
function initializeFilters() {
    try {
        console.log('Initializing filters...');
        // Get unique areas
        const areas = [...new Set(allProviders.map(p => p.area))].filter(Boolean);
        areas.sort((a, b) => a.localeCompare(b, 'ar'));
        console.log('Found areas:', areas);

        // Populate area select
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        });

        // Initialize select2 for all dropdowns
        const baseSelect2Config = {
            theme: 'bootstrap-5',
            placeholder: 'اختر...',
            allowClear: true,
            dir: 'rtl',
            width: '100%',
            language: {
                noResults: function() {
                    return "لا توجد نتائج";
                },
                searching: function() {
                    return "جاري البحث...";
                }
            }
        };

        // Area dropdown config with search enabled
        const areaSelect2Config = {
            ...baseSelect2Config,
            minimumResultsForSearch: 0, // Always show search
            searchable: true
        };

        // Other dropdowns config without search
        const noSearchSelect2Config = {
            ...baseSelect2Config,
            minimumResultsForSearch: -1, // Disable search
            searchable: false
        };

        console.log('Initializing Select2...');
        
        // Initialize main category select2 (no search)
        if (initializeSelect2(mainCategorySelect, noSearchSelect2Config)) {
            $(mainCategorySelect).on('change', function() {
                console.log('Main category changed:', $(this).val());
                currentFilters.mainCategory = $(this).val();
                updateSpecialties();
                applyFilters();
            });
        }

        // Initialize specialty select2 (no search)
        if (initializeSelect2(specialtySelect, noSearchSelect2Config)) {
            $(specialtySelect).on('change', function() {
                console.log('Specialty changed:', $(this).val());
                currentFilters.specialty = $(this).val();
                applyFilters();
            });
        }

        // Initialize area select2 (with search)
        if (initializeSelect2(areaSelect, areaSelect2Config)) {
            $(areaSelect).on('change', function() {
                console.log('Area changed:', $(this).val());
                currentFilters.area = $(this).val();
                applyFilters();
            });
        }

        // Add search input event listener
        searchInput.addEventListener('input', function() {
            console.log('Search query changed:', this.value);
            currentFilters.searchQuery = this.value.toLowerCase();
            applyFilters();
        });

        // Initialize specialties
        updateSpecialties();
        console.log('Filters initialized successfully');
    } catch (error) {
        console.error('Error initializing filters:', error);
    }
}

// Update specialties based on main category
function updateSpecialties() {
    try {
        console.log('Updating specialties for category:', currentFilters.mainCategory);
        // Clear existing options
        specialtySelect.innerHTML = '<option value="">الكل</option>';
        
        if (!currentFilters.mainCategory) {
            $(specialtySelect).val('').trigger('change');
            return;
        }

        const categorySpecialties = new Set(
            allProviders
                .filter(p => p.category === currentFilters.mainCategory)
                .map(p => p.specialty)
                .filter(Boolean)
        );

        const sortedSpecialties = Array.from(categorySpecialties).sort((a, b) => a.localeCompare(b, 'ar'));
        console.log('Found specialties:', sortedSpecialties);
        
        sortedSpecialties.forEach(specialty => {
            const option = document.createElement('option');
            option.value = specialty;
            option.textContent = specialty;
            specialtySelect.appendChild(option);
        });

        // Trigger select2 update
        $(specialtySelect).trigger('change');
    } catch (error) {
        console.error('Error updating specialties:', error);
    }
}

// Apply all filters
function applyFilters() {
    try {
        console.log('Applying filters:', currentFilters);
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
                (p.specialty && p.specialty.toLowerCase().includes(currentFilters.searchQuery))
            );
        }

        console.log('Filtered results:', filteredProviders.length);
        displayResults(filteredProviders);
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

// Display results
function displayResults(providers) {
    try {
        console.log('Displaying results:', providers.length);
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
    } catch (error) {
        console.error('Error displaying results:', error);
    }
}

// Create provider card
function createProviderCard(provider) {
    try {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200';
        
        // Split phone numbers
        const phoneNumbers = provider.phone
            .split(/[-\s–]/)
            .map(num => num.trim())
            .filter(num => num.length > 0);

        card.innerHTML = `
            <h3 class="text-lg font-bold mb-2">${provider.name}</h3>
            <p class="text-gray-600 mb-2">${provider.specialty || ''}</p>
            <p class="text-gray-500 mb-2">${provider.area}</p>
            <div class="phone-numbers space-y-2">
                ${phoneNumbers.map(phone => `
                    <a href="tel:${phone}" class="phone-link flex items-center text-blue-600 hover:text-blue-800">
                        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        ${phone}
                    </a>
                `).join('')}
            </div>
        `;
        
        return card;
    } catch (error) {
        console.error('Error creating provider card:', error);
        return document.createElement('div'); // Return empty div on error
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 