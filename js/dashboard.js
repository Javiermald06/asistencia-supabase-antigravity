// Dashboard Page Logic
// Execute when script loads, with retry for DOM readiness
(async function () {
    // Wait for elements to exist
    const waitForElement = (id, maxAttempts = 50) => {
        return new Promise((resolve) => {
            let attempts = 0;
            const checkExist = setInterval(() => {
                const el = document.getElementById(id);
                if (el || attempts >= maxAttempts) {
                    clearInterval(checkExist);
                    resolve(el);
                }
                attempts++;
            }, 50);
        });
    };

    // Wait for key element to exist
    await waitForElement('user-name');

    // Now initialize
    await initDashboard();
})();

async function initDashboard() {
    // Load user info
    const user = getCurrentUser();
    if (!user) {
        window.location.hash = '#/login';
        return;
    }

    document.getElementById('user-name').textContent = user.nombre_completo.split(' ')[0];
    document.getElementById('user-name-sidebar').textContent = user.nombre_completo;
    document.getElementById('user-role-sidebar').textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1);

    // Update current time and date
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // Load today's active jornada
    await loadTodayJornada();

    // Load stats
    await loadStats();

    // Set up event listeners
    setupEventListeners();
}

function updateCurrentTime() {
    const now = new Date();
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');

    // Only update if elements exist (we're on dashboard page)
    if (timeEl) timeEl.textContent = formatTime(now);
    if (dateEl) dateEl.textContent = formatDate(now);
}

async function loadTodayJornada() {
    const jornada = await getTodayActiveJornada();

    if (jornada) {
        // Show clock-out section
        document.getElementById('clock-in-section').classList.add('hidden');
        document.getElementById('clock-out-section').classList.remove('hidden');

        // Check for active pause
        const pause = await getActivePause();
        if (pause) {
            document.getElementById('start-pause-btn').classList.add('hidden');
            document.getElementById('end-pause-btn').classList.remove('hidden');
        }

        startTimer();
    } else {
        // Show clock-in section
        document.getElementById('clock-in-section').classList.remove('hidden');
        document.getElementById('clock-out-section').classList.add('hidden');
    }
}

async function loadStats() {
    const stats = await getTodayStats();

    if (stats) {
        document.getElementById('today-hours').textContent = formatDuration(stats.netTime);
        document.getElementById('break-time').textContent = formatDuration(stats.breakTime);
    }

    // Load weekly stats
    await loadWeeklyStats();

    // Load today's activity
    await loadTodayActivity();
}

async function loadTodayActivity() {
    const container = document.getElementById('today-activity');

    try {
        const user = getCurrentUser();
        if (!user) return;

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

        const jornada = data && data.length > 0 ? data[0] : null;

        if (!jornada) {
            container.innerHTML = '<p class="text-center text-secondary py-8">No hay actividad registrada hoy</p>';
            return;
        }

        // Calculate times
        const now = new Date();
        const start = new Date(jornada.hora_entrada);
        const end = jornada.hora_salida ? new Date(jornada.hora_salida) : now;
        const totalTime = calculateDuration(start, end);

        const breakTime = jornada.pausas?.reduce((sum, pausa) => {
            if (pausa.duracion_segundos) {
                return sum + pausa.duracion_segundos;
            }
            if (pausa.estado === 'activa') {
                const pausaStart = new Date(pausa.hora_inicio);
                return sum + calculateDuration(pausaStart, now);
            }
            return sum;
        }, 0) || 0;

        const netTime = totalTime - breakTime;

        // Build HTML
        container.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center p-4" style="background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    <div>
                        <p class="text-sm text-secondary">Entrada</p>
                        <p class="text-lg font-semibold">${formatTime(jornada.hora_entrada)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-secondary">Salida</p>
                        <p class="text-lg font-semibold">${jornada.hora_salida ? formatTime(jornada.hora_salida) : 'En progreso'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-secondary">Estado</p>
                        <span class="badge badge-${jornada.estado === 'activa' ? 'success' : 'info'}">${jornada.estado === 'activa' ? 'Activa' : 'Completada'}</span>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                    <div class="p-3 text-center" style="background: var(--bg-tertiary); border-radius: var(--radius-md);">
                        <p class="text-xs text-secondary">Tiempo Total</p>
                        <p class="text-lg font-bold">${formatDurationHuman(totalTime)}</p>
                    </div>
                    <div class="p-3 text-center" style="background: var(--bg-tertiary); border-radius: var(--radius-md);">
                        <p class="text-xs text-secondary">En Pausas</p>
                        <p class="text-lg font-bold">${formatDurationHuman(breakTime)}</p>
                    </div>
                    <div class="p-3 text-center" style="background: var(--bg-tertiary); border-radius: var(--radius-md);">
                        <p class="text-xs text-secondary">Tiempo Neto</p>
                        <p class="text-lg font-bold text-primary-600">${formatDurationHuman(netTime)}</p>
                    </div>
                </div>

                ${jornada.pausas && jornada.pausas.length > 0 ? `
                    <div>
                        <p class="font-semibold mb-2">Pausas (${jornada.pausas.length})</p>
                        <div class="space-y-2">
                            ${jornada.pausas.map(pausa => `
                                <div class="flex justify-between items-center p-3" style="background: var(--bg-tertiary); border-radius: var(--radius-md);">
                                    <span class="badge badge-${pausa.tipo === 'comida' ? 'warning' : pausa.tipo === 'personal' ? 'info' : 'secondary'}">${pausa.tipo}</span>
                                    <span class="text-sm">${formatTime(pausa.hora_inicio)} - ${pausa.hora_fin ? formatTime(pausa.hora_fin) : 'En progreso'}</span>
                                    <span class="text-sm font-semibold">${pausa.duracion_segundos ? formatDurationHuman(pausa.duracion_segundos) : formatDurationHuman(calculateDuration(new Date(pausa.hora_inicio), now))}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : '<p class="text-sm text-secondary text-center py-4">Sin pausas registradas</p>'}
            </div>
        `;
    } catch (error) {
        console.error('Error loading today activity:', error);
        container.innerHTML = '<p class="text-center text-secondary py-8">Error al cargar la actividad</p>';
    }
}

async function loadWeeklyStats() {
    try {
        const user = getCurrentUser();
        const { start, end } = getDateRange('week');

        const { data, error } = await supabase
            .from('jornadas')
            .select('tiempo_neto_segundos')
            .eq('usuario_id', user.id)
            .eq('estado', 'completada')
            .gte('fecha', start.toISOString().split('T')[0])
            .lte('fecha', end.toISOString().split('T')[0]);

        if (error) throw error;

        const totalSeconds = data.reduce((sum, j) => sum + (j.tiempo_neto_segundos || 0), 0);
        const hours = Math.floor(totalSeconds / 3600);

        document.getElementById('week-hours').textContent = `${hours}h`;
    } catch (error) {
        console.error('Error loading weekly stats:', error);
    }
}

function setupEventListeners() {
    // Clock in button - use clone to remove previous listeners
    const clockInBtn = document.getElementById('clock-in-btn');
    const newClockInBtn = clockInBtn.cloneNode(true);
    clockInBtn.parentNode.replaceChild(newClockInBtn, clockInBtn);

    newClockInBtn.addEventListener('click', async () => {
        newClockInBtn.disabled = true;

        const result = await clockIn();

        if (result) {
            document.getElementById('clock-in-section').classList.add('hidden');
            document.getElementById('clock-out-section').classList.remove('hidden');
            document.getElementById('work-status').textContent = 'TRABAJANDO';
            document.getElementById('work-status').className = 'badge badge-success';
            await loadStats();
        }

        newClockInBtn.disabled = false;
    });

    // Clock out button - use clone to remove previous listeners
    const clockOutBtn = document.getElementById('clock-out-btn');
    const newClockOutBtn = clockOutBtn.cloneNode(true);
    clockOutBtn.parentNode.replaceChild(newClockOutBtn, clockOutBtn);

    newClockOutBtn.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que quieres finalizar la jornada?')) return;

        newClockOutBtn.disabled = true;

        await clockOut();

        document.getElementById('clock-out-section').classList.add('hidden');
        document.getElementById('clock-in-section').classList.remove('hidden');
        document.getElementById('work-status').textContent = 'Sin iniciar';
        document.getElementById('work-status').className = 'badge badge-info';

        await loadStats();

        newClockOutBtn.disabled = false;
    });

    // Start pause button - use clone to remove previous listeners
    const startPauseBtn = document.getElementById('start-pause-btn');
    const newStartPauseBtn = startPauseBtn.cloneNode(true);
    startPauseBtn.parentNode.replaceChild(newStartPauseBtn, startPauseBtn);

    newStartPauseBtn.addEventListener('click', () => {
        document.getElementById('pause-type-selector').classList.remove('hidden');
    });

    // Pause type buttons - use event delegation on the pause selector container
    const pauseSelector = document.getElementById('pause-type-selector');

    // Remove old clone if exists and create new one
    const newPauseSelector = pauseSelector.cloneNode(true);
    pauseSelector.parentNode.replaceChild(newPauseSelector, pauseSelector);

    // Use event delegation for pause type buttons
    newPauseSelector.addEventListener('click', async (e) => {
        const btn = e.target.closest('.pause-type-btn');
        if (!btn) return;

        const tipo = btn.dataset.type;
        btn.disabled = true;

        await startPause(tipo);

        document.getElementById('pause-type-selector').classList.add('hidden');
        document.getElementById('start-pause-btn').classList.add('hidden');
        document.getElementById('end-pause-btn').classList.remove('hidden');

        await loadStats();
        btn.disabled = false;
    });

    // End pause button - use clone to remove previous listeners
    const endPauseBtn = document.getElementById('end-pause-btn');
    const newEndPauseBtn = endPauseBtn.cloneNode(true);
    endPauseBtn.parentNode.replaceChild(newEndPauseBtn, endPauseBtn);

    newEndPauseBtn.addEventListener('click', async () => {
        newEndPauseBtn.disabled = true;

        await endPause();

        document.getElementById('end-pause-btn').classList.add('hidden');
        document.getElementById('start-pause-btn').classList.remove('hidden');

        await loadStats();
        newEndPauseBtn.disabled = false;
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            await logout();
            window.location.hash = '#/login';
        }
    });

    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function (e) {
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
}
