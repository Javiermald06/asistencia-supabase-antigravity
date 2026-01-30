// Supabase Configuration
const SUPABASE_URL = 'https://dgqlblfwrqkdephpripi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncWxibGZ3cnFrZGVwaHByaXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODM3MjYsImV4cCI6MjA4NTM1OTcyNn0.IN77z4lJ98bFsBjUD1AUVpF45NNVJu1mYNbSEImvsFc';

// Initialize Supabase client (using window.supabase from CDN)
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application Constants
const APP_CONFIG = {
    VERSION: '1.0.0',
    APP_NAME: 'Control Horario',
    DEFAULT_TIMEZONE: 'America/New_York',
    PAGINATION_SIZE: 20,
    MAX_WORK_HOURS: 8,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Routes
const ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    REPORTS: '/reports',
    HISTORY: '/history',
    PROFILE: '/profile'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabase, APP_CONFIG, ROUTES };
}
