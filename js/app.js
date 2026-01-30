// Main Application Entry Point

// ============================================
// APPLICATION INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
async function initApp() {
    console.log('Initializing Control Horario App...');

    try {
        // Initialize authentication
        await initAuth();

        // Set up auth state listener
        onAuthStateChange((event, session) => {
            console.log('Auth event:', event);

            if (event === 'SIGNED_OUT') {
                window.location.hash = '#/login';
            }
        });

        // Initialize router
        initRouter();

        console.log('App initialized successfully');

    } catch (error) {
        console.error('Error initializing app:', error);
        handleError(error, true);
    }
}

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

/**
 * Set up global error handlers
 */
function setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        handleError(event.reason, false);
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        handleError(event.error, false);
    });
}

// ============================================
// START APPLICATION
// ============================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupGlobalErrorHandlers();
        initApp();
    });
} else {
    setupGlobalErrorHandlers();
    initApp();
}
