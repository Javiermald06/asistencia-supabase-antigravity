// Router Module for Labor Time Control Application

// ============================================
// ROUTER CONFIGURATION
// ============================================

const routes = {
    '/': 'views/login.html',
    '/login': 'views/login.html',
    '/register': 'views/register.html',
    '/dashboard': 'views/dashboard.html',
    '/reports': 'views/reports.html',
    '/history': 'views/history.html'
};

const protectedRoutes = ['/dashboard', '/reports', '/history'];

// ============================================
// ROUTER FUNCTIONS
// ============================================

/**
 * Initialize router
 */
function initRouter() {
    // Handle initial route
    handleRoute();

    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);

    // Handle browser back/forward buttons
    window.addEventListener('popstate', handleRoute);
}

/**
 * Handle route changes
 */
async function handleRoute() {
    let path = window.location.hash.slice(1) || '/';

    // Remove trailing slash
    if (path !== '/' && path.endsWith('/')) {
        path = path.slice(0, -1);
    }

    // Check if route exists
    if (!routes[path]) {
        path = '/';
    }

    // Check authentication for protected routes
    if (protectedRoutes.includes(path)) {
        const isAuth = await initAuth();
        if (!isAuth) {
            window.location.hash = '#/login';
            return;
        }
    }

    // Load the view
    await loadView(routes[path]);
}

/**
 * Load a view into the app container
 * @param {string} viewPath - Path to the view file
 */
async function loadView(viewPath) {
    const appContainer = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');

    try {
        // Show loading
        if (loadingScreen) loadingScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');

        // Fetch the view
        const response = await fetch(viewPath);

        if (!response.ok) {
            throw new Error(`Failed to load view: ${viewPath}`);
        }

        const html = await response.text();

        // Update app container
        if (appContainer) {
            appContainer.innerHTML = html;
            appContainer.classList.remove('hidden');
        }

        // Hide loading
        if (loadingScreen) loadingScreen.classList.add('hidden');

        // Execute any scripts in the loaded view
        executeViewScripts(appContainer);

    } catch (error) {
        console.error('Error loading view:', error);

        if (appContainer) {
            appContainer.innerHTML = `
                <div class="container text-center" style="margin-top: 20vh;">
                    <h1 class="text-4xl font-bold mb-4">Error</h1>
                    <p class="text-secondary mb-6">No se pudo cargar la página</p>
                    <a href="#/login" class="btn btn-primary">Volver al inicio</a>
                </div>
            `;
            appContainer.classList.remove('hidden');
        }

        if (loadingScreen) loadingScreen.classList.add('hidden');
    }
}

/**
 * Execute scripts in loaded view
 * @param {HTMLElement} container - Container element
 */
function executeViewScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(script => {
        const newScript = document.createElement('script');

        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }

        document.body.appendChild(newScript);

        // Clean up after execution
        setTimeout(() => {
            if (newScript.parentNode) {
                newScript.parentNode.removeChild(newScript);
            }
        }, 100);
    });
}

/**
 * Navigate to a route
 * @param {string} path - Route path
 */
function navigateTo(path) {
    window.location.hash = `#${path}`;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initRouter,
        navigateTo
    };
}
