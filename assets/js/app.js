// Global variables
let allProviders = [];

// DOM Elements
const hospitalsCount = document.getElementById('hospitalsCount');
const pharmaciesCount = document.getElementById('pharmaciesCount');
const clinicsCount = document.getElementById('clinicsCount');
const labsCount = document.getElementById('labsCount');
const doctorsCount = document.getElementById('doctorsCount');

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
        
        // Update statistics
        updateStatistics();
        
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

// Update statistics
function updateStatistics() {
    const stats = {
        hospitals: allProviders.filter(p => p.category === 'hospitals').length,
        pharmacies: allProviders.filter(p => p.category === 'pharmacies').length,
        clinics: allProviders.filter(p => p.category === 'clinics').length,
        labs: allProviders.filter(p => p.category === 'labs').length,
        doctors: allProviders.filter(p => p.category === 'doctors').length
    };

    hospitalsCount.textContent = stats.hospitals;
    pharmaciesCount.textContent = stats.pharmacies;
    clinicsCount.textContent = stats.clinics;
    labsCount.textContent = stats.labs;
    doctorsCount.textContent = stats.doctors;
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 