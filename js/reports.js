// Reports Module for Labor Time Control Application

// ============================================
// REPORT GENERATION FUNCTIONS
// ============================================

/**
 * Get daily report
 * @param {Date} date - Date for the report
 * @returns {Promise<Object>} Daily report data
 */
async function getDailyReport(date = new Date()) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado');

        const dateStr = date.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('jornadas')
            .select(`
                *,
                pausas (*)
            `)
            .eq('usuario_id', user.id)
            .eq('fecha', dateStr)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        // Take the first (most recent) jornada
        const jornada = data && data.length > 0 ? data[0] : null;

        if (!jornada) {
            return {
                fecha: dateStr,
                trabajado: false,
                totalTime: 0,
                breakTime: 0,
                netTime: 0,
                pausas: []
            };
        }

        const now = new Date();
        const start = new Date(jornada.hora_entrada);
        const end = jornada.hora_salida ? new Date(jornada.hora_salida) : (jornada.estado === 'activa' ? now : start);

        const totalTime = calculateDuration(start, end);
        const breakTime = jornada.pausas?.reduce((sum, pausa) => {
            if (pausa.duracion_segundos) {
                return sum + pausa.duracion_segundos;
            }
            // For active pauses
            if (pausa.estado === 'activa') {
                const pausaStart = new Date(pausa.hora_inicio);
                return sum + calculateDuration(pausaStart, now);
            }
            return sum;
        }, 0) || 0;

        const netTime = totalTime - breakTime;

        return {
            fecha: dateStr,
            trabajado: true,
            horaEntrada: jornada.hora_entrada,
            horaSalida: jornada.hora_salida,
            estado: jornada.estado,
            totalTime,
            breakTime,
            netTime,
            overtime: netTime > (8 * 3600) ? netTime - (8 * 3600) : 0,
            pausas: jornada.pausas || []
        };
    } catch (error) {
        console.error('Error getting daily report:', error);
        throw error;
    }
}

/**
 * Get weekly report
 * @param {Date} startDate - Start of week
 * @returns {Promise<Object>} Weekly report data
 */
async function getWeeklyReport(startDate = null) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado');

        const range = startDate ?
            { start: startDate, end: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000) } :
            getDateRange('week');

        const { data, error } = await supabase
            .from('jornadas')
            .select(`
                *,
                pausas (*)
            `)
            .eq('usuario_id', user.id)
            .gte('fecha', range.start.toISOString().split('T')[0])
            .lte('fecha', range.end.toISOString().split('T')[0])
            .order('fecha', { ascending: true });

        if (error) throw error;

        let totalNetTime = 0;
        let totalBreakTime = 0;
        let totalOvertimeTime = 0;
        let daysWorked = 0;

        const dailyData = [];

        data.forEach(jornada => {
            if (jornada.estado === 'completada' && jornada.tiempo_neto_segundos) {
                totalNetTime += jornada.tiempo_neto_segundos;
                daysWorked++;

                const breakTime = jornada.pausas?.reduce((sum, p) => sum + (p.duracion_segundos || 0), 0) || 0;
                totalBreakTime += breakTime;

                if (jornada.tiempo_neto_segundos > 8 * 3600) {
                    totalOvertimeTime += jornada.tiempo_neto_segundos - (8 * 3600);
                }

                dailyData.push({
                    fecha: jornada.fecha,
                    netTime: jornada.tiempo_neto_segundos,
                    breakTime
                });
            }
        });

        return {
            startDate: range.start.toISOString().split('T')[0],
            endDate: range.end.toISOString().split('T')[0],
            totalNetTime,
            totalBreakTime,
            totalOvertimeTime,
            daysWorked,
            averageDaily: daysWorked > 0 ? Math.floor(totalNetTime / daysWorked) : 0,
            dailyData
        };
    } catch (error) {
        console.error('Error getting weekly report:', error);
        throw error;
    }
}

/**
 * Get monthly report
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Promise<Object>} Monthly report data
 */
async function getMonthlyReport(month = null, year = null) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado');

        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0);

        const { data, error } = await supabase
            .from('jornadas')
            .select(`
                *,
                pausas (*)
            `)
            .eq('usuario_id', user.id)
            .gte('fecha', startDate.toISOString().split('T')[0])
            .lte('fecha', endDate.toISOString().split('T')[0])
            .order('fecha', { ascending: true });

        if (error) throw error;

        let totalNetTime = 0;
        let totalBreakTime = 0;
        let totalOvertimeTime = 0;
        let daysWorked = 0;

        const weeklyData = {};

        data.forEach(jornada => {
            if (jornada.estado === 'completada' && jornada.tiempo_neto_segundos) {
                totalNetTime += jornada.tiempo_neto_segundos;
                daysWorked++;

                const breakTime = jornada.pausas?.reduce((sum, p) => sum + (p.duracion_segundos || 0), 0) || 0;
                totalBreakTime += breakTime;

                if (jornada.tiempo_neto_segundos > 8 * 3600) {
                    totalOvertimeTime += jornada.tiempo_neto_segundos - (8 * 3600);
                }

                // Group by week
                const date = new Date(jornada.fecha);
                const weekNum = Math.ceil(date.getDate() / 7);
                if (!weeklyData[weekNum]) {
                    weeklyData[weekNum] = {
                        week: weekNum,
                        totalTime: 0,
                        days: 0
                    };
                }
                weeklyData[weekNum].totalTime += jornada.tiempo_neto_segundos;
                weeklyData[weekNum].days++;
            }
        });

        return {
            month: targetMonth,
            year: targetYear,
            totalNetTime,
            totalBreakTime,
            totalOvertimeTime,
            daysWorked,
            averageDaily: daysWorked > 0 ? Math.floor(totalNetTime / daysWorked) : 0,
            weeklyData: Object.values(weeklyData)
        };
    } catch (error) {
        console.error('Error getting monthly report:', error);
        throw error;
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getDailyReport,
        getWeeklyReport,
        getMonthlyReport
    };
}
