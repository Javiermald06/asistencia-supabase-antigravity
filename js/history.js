// History Module for Labor Time Control Application

// ============================================
// HISTORY FUNCTIONS
// ============================================

/**
 * Get jornadas history with filters and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} History data with pagination
 */
async function getJornadasHistory(options = {}) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado');

        const {
            startDate = null,
            endDate = null,
            estado = null,
            page = 1,
            pageSize = 20
        } = options;

        let query = supabase
            .from('jornadas')
            .select(`
                *,
                pausas (*)
            `, { count: 'exact' })
            .eq('usuario_id', user.id);

        if (startDate) {
            query = query.gte('fecha', startDate);
        }

        if (endDate) {
            query = query.lte('fecha', endDate);
        }

        if (estado) {
            query = query.eq('estado', estado);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query
            .order('fecha', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            data: data || [],
            pagination: {
                page,
                pageSize,
                total: count,
                totalPages: Math.ceil(count / pageSize)
            }
        };
    } catch (error) {
        console.error('Error getting jornadas history:', error);
        throw error;
    }
}

/**
 * Update a jornada (for supervisors/admins)
 * @param {string} jornadaId - Jornada ID
 * @param {Object} updates - Updates to apply
 * @param {string} justification - Justification for the change
 * @returns {Promise<Object>} Updated jornada
 */
async function updateJornada(jornadaId, updates, justification) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado');

        // Check if user has permission
        if (user.rol !== 'supervisor' && user.rol !== 'admin') {
            throw new Error('No tienes permisos para editar registros');
        }

        if (!justification) {
            throw new Error('Debes proporcionar una justificación');
        }

        const { data, error } = await supabase
            .from('jornadas')
            .update(updates)
            .eq('id', jornadaId)
            .select()
            .single();

        if (error) throw error;

        showToast('Registro actualizado exitosamente', 'success');

        return data;
    } catch (error) {
        handleError(error);
        throw error;
    }
}

/**
 * Delete a jornada
 * @param {string} jornadaId - Jornada ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteJornada(jornadaId) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado');

        // Check if user has permission
        if (user.rol !== 'admin') {
            throw new Error('Solo los administradores pueden eliminar registros');
        }

        const { error } = await supabase
            .from('jornadas')
            .delete()
            .eq('id', jornadaId);

        if (error) throw error;

        showToast('Registro eliminado exitosamente', 'success');

        return true;
    } catch (error) {
        handleError(error);
        return false;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getJornadasHistory,
        updateJornada,
        deleteJornada
    };
}
