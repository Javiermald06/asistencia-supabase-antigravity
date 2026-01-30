// Time Tracking Module for Labor Time Control Application

// ============================================
// TIME TRACKING STATE
// ============================================

let activeJornada = null;
let activePausa = null;
let timerInterval = null;

// ============================================
// JORNADA (WORK SESSION) FUNCTIONS
// ============================================

/**
 * Clock in - Start work session
 * @returns {Promise<Object>} Created jornada
 */
async function clockIn() {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado');

        // Check if there's already an active jornada today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingJornadas, error: checkError } = await supabase
            .from('jornadas')
            .select('id, estado')
            .eq('usuario_id', user.id)
            .eq('fecha', today);

        if (checkError) throw checkError;

        // If there's already a jornada (active or completed), prevent creating a new one
        if (existingJornadas && existingJornadas.length > 0) {
            const activeJornada = existingJornadas.find(j => j.estado === 'activa');
            if (activeJornada) {
                throw new Error('Ya tienes una jornada activa para hoy.');
            } else {
                throw new Error('Ya has registrado una jornada para hoy. Solo se permite una jornada por día.');
            }
        }

        // Show confirmation dialog
        const confirmed = confirm(
            '⚠️ IMPORTANTE: Solo puedes iniciar una jornada por día.\n\n' +
            'Una vez iniciada, podrás:\n' +
            '• Tomar pausas cuando lo necesites\n' +
            '• Finalizar la jornada cuando termines tu día\n\n' +
            'No podrás iniciar otra jornada hasta mañana.\n\n' +
            '¿Deseas iniciar la jornada ahora?'
        );

        if (!confirmed) {
            return null;
        }

        const now = new Date();
        const { data, error } = await supabase
            .from('jornadas')
            .insert([{
                usuario_id: user.id,
                fecha: today,
                hora_entrada: now.toISOString(),
                estado: 'activa'
            }])
            .select()
            .single();

        if (error) throw error;

        activeJornada = data; // Assuming currentJornada should be activeJornada based on file context
        startTimer(); // Added back from original clockIn
        showToast('¡Jornada iniciada!', 'success'); // Added back from original clockIn
        return data;

    } catch (error) {
        handleError(error); // Changed console.error to handleError for consistency
        return null; // Changed throw error to return null for consistency
    }
}

/**
 * Clock out - End work session
 * @returns {Promise<Object>} Completed jornada
 */
async function clockOut() {
    try {
        if (!activeJornada) {
            throw new Error('No hay jornada activa');
        }

        // End any active pauses first
        if (activePausa) {
            await endPause();
        }

        // Update jornada
        const { data, error } = await supabase
            .from('jornadas')
            .update({
                hora_salida: new Date().toISOString(),
                estado: 'completada'
            })
            .eq('id', activeJornada.id)
            .select()
            .single();

        if (error) throw error;

        stopTimer();
        activeJornada = null;

        showToast('¡Jornada finalizada!', 'success');

        return data;
    } catch (error) {
        handleError(error);
        return null;
    }
}

/**
 * Get today's active jornada
 * @returns {Promise<Object|null>} Active jornada or null
 */
async function getTodayActiveJornada() {
    try {
        const user = getCurrentUser();
        if (!user) return null;

        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('jornadas')
            .select('*')
            .eq('usuario_id', user.id)
            .eq('fecha', today)
            .eq('estado', 'activa')
            .maybeSingle();

        if (error) throw error;

        if (data) {
            activeJornada = data;
            // Also check for active pause
            await getActivePause();
            startTimer();
        }

        return data;
    } catch (error) {
        console.error('Error getting active jornada:', error);
        return null;
    }
}

// ============================================
// PAUSA (BREAK) FUNCTIONS
// ============================================

/**
 * Start a break
 * @param {string} tipo - Break type ('comida', 'descanso', 'personal')
 * @returns {Promise<Object>} Created pausa
 */
async function startPause(tipo = 'descanso') {
    try {
        if (!activeJornada) {
            throw new Error('No hay jornada activa');
        }

        if (activePausa) {
            throw new Error('Ya hay una pausa activa');
        }

        const { data, error } = await supabase
            .from('pausas')
            .insert([{
                jornada_id: activeJornada.id,
                tipo,
                hora_inicio: new Date().toISOString(),
                estado: 'activa'
            }])
            .select()
            .single();

        if (error) throw error;

        activePausa = data;

        showToast(`Pausa iniciada: ${tipo}`, 'info');

        return data;
    } catch (error) {
        handleError(error);
        return null;
    }
}

/**
 * End a break
 * @returns {Promise<Object>} Completed pausa
 */
async function endPause() {
    try {
        if (!activePausa) {
            throw new Error('No hay pausa activa');
        }

        const { data, error } = await supabase
            .from('pausas')
            .update({
                hora_fin: new Date().toISOString(),
                estado: 'finalizada'
            })
            .eq('id', activePausa.id)
            .select()
            .single();

        if (error) throw error;

        activePausa = null;

        showToast('Pausa finalizada', 'info');

        return data;
    } catch (error) {
        handleError(error);
        return null;
    }
}

/**
 * Get active pause
 * @returns {Promise<Object|null>} Active pause or null
 */
async function getActivePause() {
    try {
        if (!activeJornada) return null;

        const { data, error } = await supabase
            .from('pausas')
            .select('*')
            .eq('jornada_id', activeJornada.id)
            .eq('estado', 'activa')
            .maybeSingle();

        if (error) throw error;

        if (data) {
            activePausa = data;
        }

        return data;
    } catch (error) {
        console.error('Error getting active pause:', error);
        return null;
    }
}

/**
 * Get all pauses for a jornada
 * @param {string} jornadaId - Jornada ID
 * @returns {Promise<Array>} List of pausas
 */
async function getJornadaPausas(jornadaId) {
    try {
        const { data, error } = await supabase
            .from('pausas')
            .select('*')
            .eq('jornada_id', jornadaId)
            .order('hora_inicio', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error getting pausas:', error);
        return [];
    }
}

// ============================================
// TIMER FUNCTIONS
// ============================================

/**
 * Start the real-time timer
 */
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        updateTimerDisplay();
    }, 1000);

    updateTimerDisplay();
}

/**
 * Stop the timer
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    if (!activeJornada) return;

    const now = new Date();
    const start = new Date(activeJornada.hora_entrada);
    const totalSeconds = calculateDuration(start, now);

    // Update timer display elements
    const timerElement = document.getElementById('timer-display');
    if (timerElement) {
        timerElement.textContent = formatDuration(totalSeconds);
    }

    // Update status display
    const statusElement = document.getElementById('work-status');
    if (statusElement) {
        statusElement.textContent = activePausa ? 'En pausa' : 'Trabajando';
        statusElement.className = activePausa ? 'badge badge-warning' : 'badge badge-success';
    }
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

/**
 * Calculate net work time (total time - breaks)
 * @param {Object} jornada - Jornada object with pausas
 * @returns {number} Net time in seconds
 */
function calculateNetTime(jornada) {
    if (!jornada.hora_salida) return 0;

    const totalTime = calculateDuration(jornada.hora_entrada, jornada.hora_salida);

    // Calculate total break time
    const breakTime = jornada.pausas?.reduce((sum, pausa) => {
        return sum + (pausa.duracion_segundos || 0);
    }, 0) || 0;

    return totalTime - breakTime;
}

/**
 * Get today's statistics
 * @returns {Promise<Object>} Today's stats
 */
async function getTodayStats() {
    try {
        const user = getCurrentUser();
        if (!user) return null;

        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('jornadas')
            .select(`
                *,
                pausas (*)
            `)
            .eq('usuario_id', user.id)
            .eq('fecha', today)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        // Take the first (most recent) jornada
        const jornada = data && data.length > 0 ? data[0] : null;

        if (!jornada) {
            return {
                totalTime: 0,
                breakTime: 0,
                netTime: 0,
                isActive: false,
                hasBreak: false
            };
        }

        const now = new Date();
        const start = new Date(jornada.hora_entrada);
        const end = jornada.hora_salida ? new Date(jornada.hora_salida) : now;

        const totalTime = calculateDuration(start, end);
        const breakTime = jornada.pausas?.reduce((sum, pausa) => {
            const pausaStart = new Date(pausa.hora_inicio);
            const pausaEnd = pausa.hora_fin ? new Date(pausa.hora_fin) : (pausa.estado === 'activa' ? now : pausaStart);
            return sum + calculateDuration(pausaStart, pausaEnd);
        }, 0) || 0;

        const netTime = totalTime - breakTime;

        return {
            totalTime,
            breakTime,
            netTime,
            isActive: jornada.estado === 'activa',
            hasBreak: activePausa !== null,
            overtime: netTime > (8 * 3600) ? netTime - (8 * 3600) : 0
        };
    } catch (error) {
        console.error('Error getting today stats:', error);
        return null;
    }
}

/**
 * Check current work session status
 * @returns {Object} Current status
 */
function getCurrentStatus() {
    return {
        hasActiveJornada: activeJornada !== null,
        hasActivePause: activePausa !== null,
        jornadaId: activeJornada?.id,
        pausaId: activePausa?.id,
        startTime: activeJornada?.hora_entrada,
        pauseType: activePausa?.tipo
    };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        clockIn,
        clockOut,
        getTodayActiveJornada,
        startPause,
        endPause,
        getActivePause,
        getJornadaPausas,
        startTimer,
        stopTimer,
        updateTimerDisplay,
        getTodayStats,
        getCurrentStatus,
        calculateNetTime
    };
}
