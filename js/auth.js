// Authentication Module for Labor Time Control Application

// ============================================
// AUTHENTICATION STATE
// ============================================

let currentUser = null;
let authSession = null;

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Initialize authentication
 * Check if user is already logged in
 */
async function initAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
            authSession = session;
            await loadUserProfile(session.user.id);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Auth initialization error:', error);
        return false;
    }
}

/**
 * Load user profile from database
 * @param {string} userId - User ID
 */
async function loadUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        currentUser = data;
        saveToLocalStorage('user_profile', data);
        return data;
    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
async function register(userData) {
    try {
        const { email, password, nombre_completo, cargo } = userData;

        // Validate input
        if (!email || !password || !nombre_completo) {
            throw new Error('Todos los campos son obligatorios');
        }

        if (!isValidEmail(email)) {
            throw new Error('Correo electrónico inválido');
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números');
        }

        // Register with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('Error al crear la cuenta');
        }

        // Create user profile
        const { data: profileData, error: profileError } = await supabase
            .from('usuarios')
            .insert([{
                id: authData.user.id,
                email,
                nombre_completo,
                cargo: cargo || null,
                rol: 'empleado'
            }])
            .select()
            .single();

        if (profileError) throw profileError;

        showToast('Cuenta creada exitosamente. Por favor, verifica tu correo electrónico.', 'success');

        return {
            success: true,
            user: authData.user,
            profile: profileData
        };
    } catch (error) {
        handleError(error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login result
 */
async function login(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Correo y contraseña son obligatorios');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        authSession = data.session;
        await loadUserProfile(data.user.id);

        showToast('¡Bienvenido/a!', 'success');

        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (error) {
        handleError(error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Logout user
 * @returns {Promise<boolean>} Logout result
 */
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        currentUser = null;
        authSession = null;
        clearLocalStorage();

        showToast('Sesión cerrada', 'info');

        return true;
    } catch (error) {
        handleError(error);
        return false;
    }
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<boolean>} Request result
 */
async function requestPasswordReset(email) {
    try {
        if (!email || !isValidEmail(email)) {
            throw new Error('Correo electrónico inválido');
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password'
        });

        if (error) throw error;

        showToast('Se ha enviado un correo para restablecer tu contraseña', 'success');

        return true;
    } catch (error) {
        handleError(error);
        return false;
    }
}

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Update result
 */
async function updatePassword(newPassword) {
    try {
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números');
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        showToast('Contraseña actualizada exitosamente', 'success');

        return true;
    } catch (error) {
        handleError(error);
        return false;
    }
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated profile
 */
async function updateProfile(updates) {
    try {
        if (!currentUser) {
            throw new Error('No hay usuario autenticado');
        }

        const { data, error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) throw error;

        currentUser = data;
        saveToLocalStorage('user_profile', data);

        showToast('Perfil actualizado', 'success');

        return data;
    } catch (error) {
        handleError(error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
    return authSession !== null && currentUser !== null;
}

/**
 * Get current user
 * @returns {Object|null} Current user object
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has role
 */
function hasRole(role) {
    if (!currentUser) return false;

    if (role === 'admin') {
        return currentUser.rol === 'admin';
    } else if (role === 'supervisor') {
        return currentUser.rol === 'supervisor' || currentUser.rol === 'admin';
    }

    return true;
}

/**
 * Set up auth state change listener
 * @param {Function} callback - Callback function
 */
function onAuthStateChange(callback) {
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event);

        if (event === 'SIGNED_IN' && session) {
            authSession = session;
            await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            authSession = null;
            clearLocalStorage();
        }

        if (callback) {
            callback(event, session);
        }
    });
}

// ============================================
// PROTECTED ROUTE HANDLER
// ============================================

/**
 * Protect routes - redirect to login if not authenticated
 * @param {string} redirectTo - URL to redirect if not authenticated
 */
function protectRoute(redirectTo = '/login') {
    if (!isAuthenticated()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAuth,
        register,
        login,
        logout,
        requestPasswordReset,
        updatePassword,
        updateProfile,
        isAuthenticated,
        getCurrentUser,
        hasRole,
        onAuthStateChange,
        protectRoute
    };
}
