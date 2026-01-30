// Utility Functions for Labor Time Control Application

// ============================================
// DATE & TIME UTILITIES
// ============================================

/**
 * Format a date to local string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale string (default: 'es-ES')
 * @returns {string} Formatted date
 */
function formatDate(date, locale = 'es-ES') {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format a time to local string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale string (default: 'es-ES')
 * @returns {string} Formatted time
 */
function formatTime(date, locale = 'es-ES') {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format a datetime to local string
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale string (default: 'es-ES')
 * @returns {string} Formatted datetime
 */
function formatDateTime(date, locale = 'es-ES') {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calculate duration between two dates in seconds
 * @param {Date|string} start - Start date/time
 * @param {Date|string} end - End date/time
 * @returns {number} Duration in seconds
 */
function calculateDuration(start, end) {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    return Math.floor((endDate - startDate) / 1000);
}

/**
 * Format seconds to HH:MM:SS
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format seconds to human readable format (e.g., "8h 30m")
 * @param {number} seconds - Seconds to format
 * @returns {string} Human readable duration
 */
function formatDurationHuman(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Get the start and end of a date range
 * @param {string} range - Range type ('today', 'week', 'month')
 * @returns {Object} Object with start and end dates
 */
function getDateRange(range) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (range) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            start.setDate(now.getDate() - dayOfWeek);
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(start.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
            break;
    }

    return { start, end };
}

// ============================================
// LOCAL STORAGE UTILITIES
// ============================================

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @returns {any} Stored value or null
 */
function getFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

/**
 * Clear all localStorage
 */
function clearLocalStorage() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

// ============================================
// DOM MANIPULATION UTILITIES
// ============================================

/**
 * Create an element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {string|HTMLElement|Array} children - Child content
 * @returns {HTMLElement} Created element
 */
function createElement(tag, attrs = {}, children = null) {
    const element = document.createElement(tag);

    Object.keys(attrs).forEach(key => {
        if (key === 'className') {
            element.className = attrs[key];
        } else if (key === 'dataset') {
            Object.keys(attrs[key]).forEach(dataKey => {
                element.dataset[dataKey] = attrs[key][dataKey];
            });
        } else if (key.startsWith('on') && typeof attrs[key] === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), attrs[key]);
        } else {
            element.setAttribute(key, attrs[key]);
        }
    });

    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            element.textContent = children;
        } else if (children instanceof HTMLElement) {
            element.appendChild(children);
        }
    }

    return element;
}

/**
 * Show element
 * @param {HTMLElement|string} element - Element or selector
 */
function showElement(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.remove('hidden');
}

/**
 * Hide element
 * @param {HTMLElement|string} element - Element or selector
 */
function hideElement(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.add('hidden');
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} element - Element or selector
 */
function toggleElement(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.toggle('hidden');
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;

    let strength = 'weak';
    let score = 0;

    if (password.length >= minLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;

    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return {
        isValid,
        strength,
        score,
        checks: {
            minLength: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar
        }
    };
}

// ============================================
// TOAST NOTIFICATION UTILITIES
// ============================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = createElement('div', { className: 'toast-container' });
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = createElement('div', {
        className: `toast toast-${type} animate-slide-down`
    }, [
        createElement('div', { className: 'toast-message' }, message)
    ]);

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            container.removeChild(toast);
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 300);
    }, duration);
}

// ============================================
// LOADING UTILITIES
// ============================================

/**
 * Show loading spinner
 * @param {HTMLElement|string} container - Container element or selector
 */
function showLoading(container = 'body') {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const spinner = createElement('div', {
        className: 'spinner m-auto',
        id: 'loading-spinner'
    });

    el.appendChild(spinner);
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.remove();
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Handle and display errors
 * @param {Error|string} error - Error object or message
 * @param {boolean} showToUser - Whether to show error to user
 */
function handleError(error, showToUser = true) {
    const errorMessage = error instanceof Error ? error.message : error;
    console.error('Error:', error);

    if (showToUser) {
        showToast(errorMessage, 'error', 5000);
    }
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return num.toLocaleString('es-ES');
}

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @returns {number} Percentage
 */
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

// Export all utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDate,
        formatTime,
        formatDateTime,
        calculateDuration,
        formatDuration,
        formatDurationHuman,
        getDateRange,
        saveToLocalStorage,
        getFromLocalStorage,
        removeFromLocalStorage,
        clearLocalStorage,
        createElement,
        showElement,
        hideElement,
        toggleElement,
        isValidEmail,
        validatePassword,
        showToast,
        showLoading,
        hideLoading,
        handleError,
        formatNumber,
        calculatePercentage
    };
}
