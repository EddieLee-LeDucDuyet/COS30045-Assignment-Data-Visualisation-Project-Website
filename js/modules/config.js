// ===========================
// Configuration Module
// All constants, colors, and settings
// ===========================

export const config = {
    // Chart margins
    margin: { 
        top: 40, 
        right: 120, 
        bottom: 60, 
        left: 80 
    },
    
    // Color schemes
    colors: {
        // Jurisdiction colors - vibrant for dark theme
        jurisdictions: {
            'NSW': '#ff6b9d',      // Pink
            'VIC': '#00d4ff',      // Cyan
            'QLD': '#a055ff',      // Purple
            'SA': '#ffa502',       // Orange
            'WA': '#4ecca3',       // Teal
            'TAS': '#778ca3',      // Blue-gray
            'ACT': '#ff6348',      // Red
            'NT': '#7bed9f'        // Green
        },
        
        // Detection method colors
        police: '#00d4ff',         // Cyan
        camera: '#ff6348',         // Red-orange
        
        // Age group colors
        ageGroups: [
            '#3498db',  // 0-16
            '#9b59b6',  // 17-25
            '#e74c3c',  // 26-39
            '#f39c12',  // 40-64
            '#1abc9c',  // 65 and over
            '#34495e'   // Additional
        ],
        
        // Location colors (for treemap)
        locations: {
            'Major Cities of Australia': '#2c3e50',
            'Inner Regional Australia': '#3498db',
            'Outer Regional Australia': '#95a5a6',
            'Remote Australia': '#bdc3c7',
            'Very Remote Australia': '#ecf0f1'
        }
    },
    
    // Animation durations (ms)
    animation: {
        fast: 200,
        normal: 500,
        slow: 1000
    },
    
    // Chart dimensions (will be calculated dynamically)
    defaultWidth: 1000,
    defaultHeight: 500,
    
    // Data filters
    dataFilters: {
        generalLocation: 'General',
        allAges: '0-65+',
        majorCities: 'Major Cities of Australia'
    }
};

// Age group ordering for consistent display
export const ageGroupOrder = [
    '0-16',
    '17-25',
    '26-39',
    '40-64',
    '65 and over',
    '0-65+'
];

// Location ordering for consistent display
export const locationOrder = [
    'Major Cities of Australia',
    'Inner Regional Australia',
    'Outer Regional Australia',
    'Remote Australia',
    'Very Remote Australia',
    'General'
];

// Jurisdiction full names
export const jurisdictionNames = {
    'ACT': 'Australian Capital Territory',
    'NSW': 'New South Wales',
    'NT': 'Northern Territory',
    'QLD': 'Queensland',
    'SA': 'South Australia',
    'TAS': 'Tasmania',
    'VIC': 'Victoria',
    'WA': 'Western Australia'
};

// Key insights for storytelling
export const insights = {
    nswSpike: {
        year: 2020,
        beforeFines: 25463,
        afterFines: 138847,
        increase: '445%'
    },
    qldEfficiency: {
        year: 2024,
        ageGroup: '40-64',
        cameraFines: 28641,
        policeFines: 849,
        ratio: '33:1'
    },
    urbanDominance: {
        jurisdiction: 'SA',
        year: 2024,
        ageGroup: '26-39',
        majorCityFines: 1575,
        remoteFines: 16,
        veryRemoteFines: 8
    }
};