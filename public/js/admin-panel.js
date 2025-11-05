// Panel de Administración - Super Admin
class AdminPanel {
    constructor() {
    this.currentSection = 'dashboard';
    this.institutions = [];
    this.experts = [];
    this.filteredInstitutions = [];
    this.filteredExperts = [];
    
    // ✅ CORRECCIÓN: Binding para mantener el contexto
    this.loadDashboardData = this.loadDashboardData.bind(this);
    this.updateDashboardStats = this.updateDashboardStats.bind(this);
    this.createCharts = this.createCharts.bind(this);
    this.updateRecentActivity = this.updateRecentActivity.bind(this);
    
    this.init();
}

    checkDOMReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}

    async init() {
    // Verificar que el usuario es superadmin
    await this.verifyAdminAccess();
    
    // Esperar a que el DOM esté completamente listo
    await this.checkDOMReady();
    
    console.log('✅ DOM completamente cargado');
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Cargar datos iniciales
    await this.loadDashboardData();
    
    console.log('🚀 Panel de Admin inicializado');
}

    async verifyAdminAccess() {
        try {
            const user = apiService.getCurrentUser();
            if (!user || user.role !== 'superadmin') {
                window.location.href = '../index.html';
                return;
            }
        } catch (error) {
            console.error('Error verificando acceso:', error);
            window.location.href = '../index.html';
        }
    }

    setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            this.showSection(section);
        });
    });

    // Event listeners para modales de edición
    document.getElementById('editInstitutionForm')?.addEventListener('submit', (e) => this.handleEditInstitution(e));
    document.getElementById('editExpertForm')?.addEventListener('submit', (e) => this.handleEditExpert(e));
    
    // Cerrar modales de edición
    document.querySelectorAll('#editInstitutionModal .close-modal, #editExpertModal .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('editInstitutionModal')?.classList.add('hidden');
            document.getElementById('editExpertModal')?.classList.add('hidden');
        });
    });
    
    // Cerrar modales al hacer clic fuera
    document.getElementById('editInstitutionModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('editInstitutionModal')) {
            this.hideEditInstitutionModal();
        }
    });
    
    document.getElementById('editExpertModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('editExpertModal')) {
            this.hideEditExpertModal();
        }
    });

    // Botones de creación
    document.getElementById('createInstitutionBtn').addEventListener('click', () => {
        this.showCreateInstitutionModal();
    });

    document.getElementById('createExpertBtn').addEventListener('click', () => {
        this.showCreateExpertModal();
    });

    // Formularios
    document.getElementById('createInstitutionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateInstitution();
    });

    document.getElementById('createExpertForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateExpert();
    });

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        this.handleLogout();
    });

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            this.hideAllModals();
        });
    });

    // Botón de actualizar estadísticas
    const refreshBtn = document.getElementById('refreshStatsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            this.loadDashboardData();
        });
    }

    // Filtros de Instituciones
    const institutionSearch = document.getElementById('institutionSearch');
    const institutionTypeFilter = document.getElementById('institutionTypeFilter');
    
    if (institutionSearch) {
        institutionSearch.addEventListener('input', (e) => {
            this.filterInstitutions();
        });
    }

    if (institutionTypeFilter) {
        institutionTypeFilter.addEventListener('change', (e) => {
            this.filterInstitutions();
        });
    }

    // Filtros de Expertos
    const expertSearch = document.getElementById('expertSearch');
    const expertInstitutionFilter = document.getElementById('expertInstitutionFilter');
    const expertSpecializationFilter = document.getElementById('expertSpecializationFilter');
    
    if (expertSearch) {
        expertSearch.addEventListener('input', (e) => {
            this.filterExperts();
        });
    }

    if (expertInstitutionFilter) {
        expertInstitutionFilter.addEventListener('change', (e) => {
            this.filterExperts();
        });
    }

    if (expertSpecializationFilter) {
        expertSpecializationFilter.addEventListener('change', (e) => {
            this.filterExperts();
        });
    }

    // Menú hamburguesa para mobile
    this.setupMobileMenu();
}

    showSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remover active de todos los items de navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Mostrar sección seleccionada
        const sectionElement = document.getElementById(`${sectionName}-section`);
        const navElement = document.querySelector(`[data-section="${sectionName}"]`);
        
        if (sectionElement) sectionElement.classList.add('active');
        if (navElement) navElement.classList.add('active');

        // Actualizar currentSection antes de cargar datos
        this.currentSection = sectionName;
        
        // Cargar datos de la sección
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'institutions':
                await this.loadInstitutions();
                break;
            case 'experts':
                await this.loadExperts();
                break;
        }
    }

   loadDashboardData = async () => {
    try {
        console.log('📊 Cargando datos del dashboard...');
        
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js no está cargado.');
        }
        
        this.showLoadingState(true);
        
        const statsResponse = await this.fetchSuperAdminStats();
        
        console.log('📋 Datos recibidos del backend');
        
        if (statsResponse.success && statsResponse.data) {
            console.log('🚀 Ejecutando métodos de actualización...');
            
            // ✅ Ahora this siempre será correcto con arrow functions
            this.updateDashboardStats(statsResponse.data);
            await this.createCharts(statsResponse.data.charts);
            this.updateRecentActivity(statsResponse.data.recentActivity);
            
        } else {
            throw new Error(statsResponse.message || 'Error en la respuesta');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        Utils.showNotification('Error: ' + error.message, 'error');
    } finally {
        this.showLoadingState(false);
    }
};

async fetchSuperAdminStats() {
    try {
        console.log('🔍 Fetching super admin stats...');
        
        const response = await fetch(`${apiService.baseURL}/api/admin/super-admin/stats`, {
            method: 'GET',
            headers: apiService.getHeaders(),
            credentials: 'include'
        });
        
        console.log('📥 Stats response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Stats data received (COMPLETE STRUCTURE):', data);
        
        // Debug detallado de la estructura
        if (data && data.data) {
            console.log('🔍 Estructura de data.data:', {
                hasTotals: !!data.data.totals,
                totalsKeys: data.data.totals ? Object.keys(data.data.totals) : 'NO TOTALS',
                totalsValues: data.data.totals || 'NO TOTALS',
                hasCharts: !!data.data.charts,
                hasRecentActivity: !!data.data.recentActivity
            });
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        throw error;
    }
}

updateDashboardStats = (data) => {
    try {
        console.log('🔄 updateDashboardStats EJECUTADO con data:', data);
        
        if (!data?.totals) {
            console.error('❌ data.totals no disponible');
            return;
        }
        
        const { users = 0, experts = 0, institutions = 0 } = data.totals;
        
        console.log('🔢 Actualizando estadísticas:', { users, experts, institutions });
        
        // Actualizar directamente
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`✅ ${id} actualizado a: ${value}`);
            } else {
                console.error(`❌ Elemento ${id} no encontrado`);
            }
        };
        
        updateElement('total-users', users);
        updateElement('total-experts', experts);
        updateElement('total-institutions', institutions);
        
        console.log('🎉 Estadísticas actualizadas correctamente');
        
    } catch (error) {
        console.error('💥 Error en updateDashboardStats:', error);
    }
};

async createCharts(chartsData) {
    try {
        console.log('🎨 Creando gráficas con data:', chartsData);
        
        // ✅ Estructura CORRECTA: chartsData ya viene como data.charts
        console.log('📊 Datos de gráficas:', chartsData);
        
        // Verificar que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js no está disponible');
        }
        
        // Destruir gráficas existentes si las hay
        if (this.expertsChart) {
            this.expertsChart.destroy();
        }
        if (this.institutionsChart) {
            this.institutionsChart.destroy();
        }
        
        // Crear gráficas
        await this.createExpertsByInstitutionChart(chartsData.expertsByInstitution || []);
        await this.createInstitutionsByTypeChart(chartsData.institutionsByType || []);
        
    } catch (error) {
        console.error('Error creando gráficas:', error);
        throw error;
    }
}

createExpertsByInstitutionChart(data) {
    return new Promise((resolve, reject) => {
        try {
            const ctx = document.getElementById('expertsByInstitutionChart');
            if (!ctx) {
                throw new Error('Canvas de expertos no encontrado');
            }
            
            // Si no hay datos, mostrar mensaje
            if (!data || data.length === 0) {
                this.showNoDataMessage(ctx, 'No hay datos de expertos por institución');
                resolve();
                return;
            }
            
            // Preparar datos para la gráfica
            const labels = data.map(item => item.institutionName || 'Sin nombre');
            const expertCounts = data.map(item => item.expertCount || 0);
            
            // Colores para la gráfica de barras
            const backgroundColors = this.generateColors(data.length, 0.8);
            const borderColors = this.generateColors(data.length, 1);
            
            this.expertsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Número de Expertos',
                        data: expertCounts,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Distribución de Expertos',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return `Expertos: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            title: {
                                display: true,
                                text: 'Cantidad de Expertos'
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 11
                                },
                                maxRotation: 45
                            },
                            grid: {
                                display: false
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
            
            console.log('✅ Gráfica de expertos creada correctamente');
            resolve();
            
        } catch (error) {
            console.error('❌ Error creando gráfica de expertos:', error);
            reject(error);
        }
    });
}

createInstitutionsByTypeChart(data) {
    return new Promise((resolve, reject) => {
        try {
            const ctx = document.getElementById('institutionsByTypeChart');
            if (!ctx) {
                throw new Error('Canvas de instituciones no encontrado');
            }
            
            // Si no hay datos, mostrar mensaje
            if (!data || data.length === 0) {
                this.showNoDataMessage(ctx, 'No hay datos de instituciones por tipo');
                resolve();
                return;
            }
            
            // Mapear tipos a nombres legibles en español
            const typeLabels = {
                'university': 'Universidades',
                'school': 'Colegios',
                'company': 'Empresas',
                'health_center': 'Centros de Salud'
            };
            
            const labels = data.map(item => typeLabels[item.type] || item.type);
            const counts = data.map(item => item.count || 0);
            
            // Colores para la gráfica circular
            const backgroundColors = [
                'rgba(54, 162, 235, 0.8)',  // Azul - Universidades
                'rgba(255, 99, 132, 0.8)',  // Rojo - Colegios
                'rgba(75, 192, 192, 0.8)',  // Verde - Empresas
                'rgba(255, 159, 64, 0.8)',  // Naranja - Centros de Salud
                'rgba(153, 102, 255, 0.8)', // Morado - Otros
                'rgba(201, 203, 207, 0.8)'  // Gris - Otros
            ];
            
            this.institutionsChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: backgroundColors,
                        borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                        borderWidth: 2,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 12
                                },
                                usePointStyle: true
                            }
                        },
                        title: {
                            display: true,
                            text: 'Distribución por Tipo',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '50%',
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
            
            console.log('✅ Gráfica de instituciones creada correctamente');
            resolve();
            
        } catch (error) {
            console.error('❌ Error creando gráfica de instituciones:', error);
            reject(error);
        }
    });
}

showNoDataMessage(canvasElement, message) {
    const ctx = canvasElement.getContext('2d');
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvasElement.width / 2, canvasElement.height / 2);
}

showChartError() {
    const expertsCanvas = document.getElementById('expertsByInstitutionChart');
    const institutionsCanvas = document.getElementById('institutionsByTypeChart');
    
    if (expertsCanvas) {
        this.showNoDataMessage(expertsCanvas, 'Error cargando gráfica');
    }
    
    if (institutionsCanvas) {
        this.showNoDataMessage(institutionsCanvas, 'Error cargando gráfica');
    }
}

generateColors(count, alpha = 1) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
        const hue = (i * hueStep) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, ${alpha})`);
    }
    
    return colors;
}

updateRecentActivity(activity) {
    try {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        // ✅ activity ya viene como data.recentActivity
        if (!activity || activity.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>No hay actividad reciente</p>
                </div>
            `;
            return;
        }
        
        const activityHTML = activity.map(item => `
            <div class="activity-item">
                <div class="activity-icon">${this.getRoleIcon(item.role)}</div>
                <div class="activity-content">
                    <div class="activity-title">${item.name}</div>
                    <div class="activity-description">
                        ${item.email} • ${this.getRoleLabel(item.role)}
                    </div>
                    <div class="activity-time">
                        ${new Date(item.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            </div>
        `).join('');
        
        activityList.innerHTML = activityHTML;
        
        console.log('✅ Actividad reciente actualizada:', activity.length, 'elementos');
        
    } catch (error) {
        console.error('Error actualizando actividad reciente:', error);
    }
}

getRoleIcon(role) {
    const icons = {
        'superadmin': '👑',
        'institutional_admin': '🏛️',
        'expert': '👨‍⚕️',
        'user': '👤'
    };
    return icons[role] || '👤';
}

getRoleLabel(role) {
    const labels = {
        'superadmin': 'Super Admin',
        'institutional_admin': 'Admin Institucional',
        'expert': 'Experto',
        'user': 'Usuario'
    };
    return labels[role] || role;
}

showLoadingState(loading) {
    try {
        const refreshBtn = document.getElementById('refreshStatsBtn');
        const statsCards = document.querySelectorAll('.stat-card');
        
        if (loading) {
            if (refreshBtn) {
                refreshBtn.classList.add('loading');
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '⏳ Cargando...';
            }
            statsCards.forEach(card => card.style.opacity = '0.6');
        } else {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '🔄 Actualizar';
            }
            statsCards.forEach(card => card.style.opacity = '1');
        }
    } catch (error) {
        console.error('Error mostrando estado de carga:', error);
    }
}


    async fetchInstitutions() {
    try {
        console.log('🔍 Fetching institutions from API...');
        // 🔥 CORRECCIÓN: Agregar /api/ en la URL
        const response = await fetch(`${apiService.baseURL}/api/institution/institutions`, {
            method: 'GET',
            headers: apiService.getHeaders(),
            credentials: 'include'
        });
        
        console.log('📥 Institutions response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Institutions data:', data);
        
        return data;
    } catch (error) {
        console.error('❌ Error fetching institutions:', error);
        Utils.showNotification('Error cargando instituciones: ' + error.message, 'error');
        return { data: { institutions: [] } };
    }
}

async fetchExperts() {
    try {
        console.log('🔍 Fetching experts from API...');
        // 🔥 CORRECCIÓN: Agregar /api/ en la URL
        const response = await fetch(`${apiService.baseURL}/api/admin/experts`, {
            method: 'GET',
            headers: apiService.getHeaders(),
            credentials: 'include'
        });
        
        console.log('📥 Experts response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Experts raw data:', data);
        
        // Manejar diferentes estructuras de respuesta
        if (data.data && data.data.experts) {
            return data;
        } else if (data.data && Array.isArray(data.data)) {
            return { data: { experts: data.data } };
        } else if (Array.isArray(data)) {
            return { data: { experts: data } };
        } else {
            console.warn('⚠️ Unexpected response structure:', data);
            return { data: { experts: [] } };
        }
        
    } catch (error) {
        console.error('❌ Error fetching experts:', error);
        Utils.showNotification('Error cargando expertos: ' + error.message, 'error');
        return { data: { experts: [] } };
    }
}

    async fetchDashboardStats() {
        // En implementación real, harías fetch a un endpoint de estadísticas
        return { 
            data: { 
                totalUsers: 150,
                highRiskCases: 12,
                activeConversations: 45
            } 
        };
    }

    updateDashboardStats(institutionsRes, expertsRes, statsRes) {
        const totalInstitutions = document.getElementById('totalInstitutions');
        const totalUsers = document.getElementById('totalUsers');
        const totalExperts = document.getElementById('totalExperts');
        const highRiskCases = document.getElementById('highRiskCases');
        
        if (totalInstitutions) totalInstitutions.textContent = institutionsRes.data.institutions?.length || 0;
        if (totalUsers) totalUsers.textContent = statsRes.data.totalUsers || 0;
        if (totalExperts) totalExperts.textContent = expertsRes.data.experts?.length || 0;
        if (highRiskCases) highRiskCases.textContent = statsRes.data.highRiskCases || 0;
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">📊</div>
                <div class="activity-content">
                    <div class="activity-title">Sistema Iniciado</div>
                    <div class="activity-description">Panel de administración cargado correctamente</div>
                    <div class="activity-time">Hace unos momentos</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="activity-icon">👤</div>
                <div class="activity-content">
                    <div class="activity-title">Sesión Iniciada</div>
                    <div class="activity-description">Super administrador conectado</div>
                    <div class="activity-time">Hace unos momentos</div>
                </div>
            </div>
        `;
    }

    async loadInstitutions() {
        try {
            const response = await this.fetchInstitutions();
            this.institutions = response.data.institutions || [];
            this.filteredInstitutions = [...this.institutions];
            this.renderInstitutions();
            this.setupInstitutionFilters();

        } catch (error) {
            console.error('Error cargando instituciones:', error);
            Utils.showNotification('Error cargando instituciones: ' + error.message, 'error');
        }
    }

    setupInstitutionFilters() {
        // El HTML ya tiene los filtros, solo necesitamos configurar los options si es necesario
    }

    renderInstitutions() {
    const container = document.getElementById('institutionsList');
    if (!container) return;

    if (this.filteredInstitutions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏛️</div>
                <h3>No hay instituciones</h3>
                <p>No se encontraron instituciones con los filtros aplicados</p>
            </div>
        `;
        return;
    }

    // Tabla para desktop - SIN BOTÓN DE OJO
    const tableHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Código</th>
                        <th>Estado</th>
                        <th>Fecha Creación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredInstitutions.map(institution => `
                        <tr>
                            <td>
                                <div class="institution-name">${institution.name}</div>
                            </td>
                            <td>
                                <span class="badge badge-${institution.type}">
                                    ${this.getInstitutionTypeLabel(institution.type)}
                                </span>
                            </td>
                            <td>${institution.contactEmail}</td>
                            <td>${institution.phone || 'N/A'}</td>
                            <td>${institution.settings?.institutionCode || 'N/A'}</td>
                            <td>
                                <span class="badge ${institution.isActive ? 'badge-university' : 'badge-health_center'}">
                                    ${institution.isActive ? 'Activa' : 'Inactiva'}
                                </span>
                            </td>
                            <td>${new Date(institution.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-secondary btn-sm" onclick="adminPanel.editInstitution('${institution._id}')">
                                        ✏️ Editar
                                    </button>
                                    <button class="btn-danger btn-sm" onclick="adminPanel.deleteInstitution('${institution._id}')">
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Cards para mobile - SIN BOTÓN DE OJO
    const cardsHTML = `
        <div class="mobile-cards-grid">
            ${this.filteredInstitutions.map(institution => `
                <div class="data-card">
                    <div class="data-card-header">
                        <h3 class="data-card-title">${institution.name}</h3>
                        <span class="badge badge-${institution.type}">
                            ${this.getInstitutionTypeLabel(institution.type)}
                        </span>
                    </div>
                    <div class="data-card-body">
                        <div class="data-card-field">
                            <span class="data-card-label">Email:</span>
                            <span class="data-card-value">${institution.contactEmail}</span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Teléfono:</span>
                            <span class="data-card-value">${institution.phone || 'N/A'}</span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Código:</span>
                            <span class="data-card-value">${institution.settings?.institutionCode || 'N/A'}</span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Estado:</span>
                            <span class="data-card-value ${institution.isActive ? 'status-active' : 'status-inactive'}">
                                ${institution.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Creado:</span>
                            <span class="data-card-value">${new Date(institution.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="data-card-actions">
                        <button class="btn-secondary btn-sm" onclick="adminPanel.editInstitution('${institution._id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-danger btn-sm" onclick="adminPanel.deleteInstitution('${institution._id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = tableHTML + cardsHTML;
}

    filterInstitutions() {
        const searchTerm = document.getElementById('institutionSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('institutionTypeFilter')?.value || '';
        
        this.filteredInstitutions = this.institutions.filter(institution => {
            const matchesSearch = 
                institution.name.toLowerCase().includes(searchTerm) ||
                institution.contactEmail.toLowerCase().includes(searchTerm) ||
                (institution.settings?.institutionCode && institution.settings.institutionCode.toLowerCase().includes(searchTerm));
            
            const matchesType = !typeFilter || institution.type === typeFilter;
            
            return matchesSearch && matchesType;
        });
        
        this.renderInstitutions();
    }

    getInstitutionTypeLabel(type) {
        const types = {
            'university': 'Universidad',
            'school': 'Colegio', 
            'company': 'Empresa',
            'health_center': 'Centro de Salud'
        };
        return types[type] || type;
    }

    async loadExperts() {
        try {
            console.log('🔄 Cargando lista de expertos...');
            const response = await this.fetchExperts();
            
            let experts = [];
            if (response.data && response.data.experts) {
                experts = response.data.experts;
            } else if (response.data && Array.isArray(response.data)) {
                experts = response.data;
            } else if (Array.isArray(response)) {
                experts = response;
            } else {
                console.warn('⚠️ Estructura de respuesta inesperada:', response);
            }
            
            this.experts = experts;
            this.filteredExperts = [...this.experts];
            console.log(`✅ ${this.experts.length} expertos cargados:`, this.experts);
            
            this.renderExperts();
            this.setupExpertFilters();

        } catch (error) {
            console.error('❌ Error cargando expertos:', error);
            Utils.showNotification('Error cargando expertos: ' + error.message, 'error');
        }
    }

    setupExpertFilters() {
        const institutionFilter = document.getElementById('expertInstitutionFilter');
        const specializationFilter = document.getElementById('expertSpecializationFilter');
        
        if (institutionFilter) {
            // Obtener instituciones únicas
            const institutions = [...new Set(this.experts
                .filter(expert => expert.institution)
                .map(expert => expert.institution.name))];
            
            institutionFilter.innerHTML = '<option value="">Todas las instituciones</option>' +
                institutions.map(inst => `<option value="${inst}">${inst}</option>`).join('');
        }
        
        if (specializationFilter) {
            // Obtener especializaciones únicas
            const specializations = [...new Set(this.experts
                .filter(expert => expert.expertProfile?.specialization)
                .map(expert => expert.expertProfile.specialization))];
            
            specializationFilter.innerHTML = '<option value="">Todas las especializaciones</option>' +
                specializations.map(spec => `<option value="${spec}">${spec}</option>`).join('');
        }
    }

    renderExperts() {
    const container = document.getElementById('expertsList');
    if (!container) {
        console.error('❌ Contenedor de expertos no encontrado');
        return;
    }

    console.log('🎨 Renderizando expertos:', this.filteredExperts.length);

    if (this.filteredExperts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍⚕️</div>
                <h3>No hay expertos</h3>
                <p>No se encontraron expertos con los filtros aplicados</p>
            </div>
        `;
        return;
    }

    // Tabla para desktop - SIN BOTÓN DE OJO
    const tableHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Especialización</th>
                        <th>Experiencia</th>
                        <th>Institución</th>
                        <th>Estado</th>
                        <th>Licencia</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredExperts.map(expert => `
                        <tr>
                            <td>
                                <div class="expert-name">${expert.name}</div>
                            </td>
                            <td>${expert.email}</td>
                            <td>
                                <span class="specialization-badge">
                                    ${expert.expertProfile?.specialization || 'Sin especialización'}
                                </span>
                            </td>
                            <td>
                                ${expert.expertProfile?.yearsOfExperience ?
                                    `${expert.expertProfile.yearsOfExperience} años` :
                                    'N/A'}
                            </td>
                            <td>${expert.institution?.name || 'No asignada'}</td>
                            <td>
                                <span class="badge ${expert.isActive ? 'badge-university' : 'badge-health_center'}">
                                    ${expert.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td>${expert.expertProfile?.licenseNumber || 'N/A'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-secondary btn-sm" onclick="adminPanel.editExpert('${expert._id}')">
                                        ✏️ Editar
                                    </button>
                                    <button class="btn-danger btn-sm" onclick="adminPanel.deleteExpert('${expert._id}')">
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Cards para mobile - SIN BOTÓN DE OJO
    const cardsHTML = `
        <div class="mobile-cards-grid">
            ${this.filteredExperts.map(expert => `
                <div class="data-card">
                    <div class="data-card-header">
                        <h3 class="data-card-title">${expert.name}</h3>
                        <span class="badge badge-university">
                            ${expert.expertProfile?.specialization || 'Sin especialización'}
                        </span>
                    </div>
                    <div class="data-card-body">
                        <div class="data-card-field">
                            <span class="data-card-label">Email:</span>
                            <span class="data-card-value">${expert.email}</span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Experiencia:</span>
                            <span class="data-card-value">${expert.expertProfile?.yearsOfExperience ?
                                `${expert.expertProfile.yearsOfExperience} años` :
                                'N/A'}</span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Institución:</span>
                            <span class="data-card-value">${expert.institution?.name || 'No asignada'}</span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Estado:</span>
                            <span class="data-card-value ${expert.isActive ? 'status-active' : 'status-inactive'}">
                                ${expert.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                        <div class="data-card-field">
                            <span class="data-card-label">Licencia:</span>
                            <span class="data-card-value">${expert.expertProfile?.licenseNumber || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="data-card-actions">
                        <button class="btn-secondary btn-sm" onclick="adminPanel.editExpert('${expert._id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-danger btn-sm" onclick="adminPanel.deleteExpert('${expert._id}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = tableHTML + cardsHTML;
}

editInstitution = async (institutionId) => {
    try {
        console.log('✏️ Editando institución:', institutionId);
        
        const institution = this.institutions.find(inst => inst._id === institutionId);
        if (!institution) {
            throw new Error('Institución no encontrada');
        }

        // Llenar el modal con los datos actuales
        document.getElementById('editInstitutionId').value = institution._id;
        document.getElementById('editInstitutionName').value = institution.name;
        document.getElementById('editInstitutionType').value = institution.type;
        document.getElementById('editInstitutionEmail').value = institution.contactEmail;
        document.getElementById('editInstitutionPhone').value = institution.phone || '';
        document.getElementById('editInstitutionCode').value = institution.settings?.institutionCode || '';
        document.getElementById('editInstitutionStatus').value = institution.isActive.toString();
        
        // Mostrar modal
        document.getElementById('editInstitutionModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error al preparar edición:', error);
        Utils.showNotification('Error: ' + error.message, 'error');
    }
};

handleEditInstitution = async (e) => {
    e.preventDefault();
    
    try {
        const institutionId = document.getElementById('editInstitutionId').value;
        const name = document.getElementById('editInstitutionName').value;
        const type = document.getElementById('editInstitutionType').value;
        const contactEmail = document.getElementById('editInstitutionEmail').value;
        const phone = document.getElementById('editInstitutionPhone').value;
        const institutionCode = document.getElementById('editInstitutionCode').value;
        const isActive = document.getElementById('editInstitutionStatus').value === 'true';
        
        if (!name || !type || !contactEmail || !institutionCode) {
            throw new Error('Todos los campos requeridos deben estar completos');
        }
        
        const formData = {
            name,
            type,
            contactEmail,
            phone: phone || '',
            settings: {
                institutionCode
            },
            isActive
        };
        
        console.log('📤 Actualizando institución:', institutionId, formData);
        
        const response = await fetch(`${apiService.baseURL}/api/institution/institutions/${institutionId}`, {
            method: 'PUT',
            headers: apiService.getHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error actualizando institución');
        }
        
        const result = await response.json();
        
        if (result.success) {
            Utils.showNotification('Institución actualizada exitosamente', 'success');
            this.hideEditInstitutionModal();
            await this.loadInstitutions();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ Error actualizando institución:', error);
        Utils.showNotification('Error actualizando institución: ' + error.message, 'error');
    }
};

deleteInstitution = async (institutionId) => {
    try {
        const institution = this.institutions.find(inst => inst._id === institutionId);
        if (!institution) {
            throw new Error('Institución no encontrada');
        }
        
        const confirmMessage = `¿Estás seguro de que quieres eliminar la institución "${institution.name}"?\n\n` +
                              `Email: ${institution.contactEmail}\n` +
                              `Tipo: ${this.getInstitutionTypeLabel(institution.type)}\n\n` +
                              `⚠️ Esta acción no se puede deshacer.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        Utils.showNotification('Eliminando institución...', 'info');
        
        const response = await fetch(`${apiService.baseURL}/api/institution/institutions/${institutionId}`, {
            method: 'DELETE',
            headers: apiService.getHeaders()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            
            let errorMessage = 'Error eliminando institución';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.success) {
            Utils.showNotification('Institución eliminada exitosamente', 'success');
            await this.loadInstitutions();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ Error eliminando institución:', error);
        Utils.showNotification('Error eliminando institución: ' + error.message, 'error');
    }
};

hideEditInstitutionModal = () => {
    document.getElementById('editInstitutionModal').classList.add('hidden');
};

editExpert = async (expertId) => {
    try {
        console.log('✏️ Editando experto:', expertId);
        
        const expert = this.experts.find(exp => exp._id === expertId);
        if (!expert) {
            throw new Error('Experto no encontrada');
        }

        // Cargar instituciones para el select
        await this.loadInstitutionsForEdit();
        
        // Llenar el modal con los datos actuales
        document.getElementById('editExpertId').value = expert._id;
        document.getElementById('editExpertName').value = expert.name;
        document.getElementById('editExpertEmail').value = expert.email;
        document.getElementById('editExpertSpecialization').value = expert.expertProfile?.specialization || '';
        document.getElementById('editExpertLicense').value = expert.expertProfile?.licenseNumber || '';
        document.getElementById('editExpertExperience').value = expert.expertProfile?.yearsOfExperience || 0;
        document.getElementById('editExpertMaxPatients').value = expert.expertProfile?.maxPatients || 50;
        document.getElementById('editExpertBio').value = expert.expertProfile?.bio || '';
        document.getElementById('editExpertStatus').value = expert.isActive.toString();
        
        // Llenar select de instituciones
        this.populateInstitutionSelect('editExpertInstitution', expert.institution?._id);
        
        // Mostrar modal
        document.getElementById('editExpertModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error al preparar edición:', error);
        Utils.showNotification('Error: ' + error.message, 'error');
    }
};

handleEditExpert = async (e) => {
    e.preventDefault();
    
    try {
        const expertId = document.getElementById('editExpertId').value;
        const name = document.getElementById('editExpertName').value;
        const email = document.getElementById('editExpertEmail').value;
        const institutionId = document.getElementById('editExpertInstitution').value;
        const specialization = document.getElementById('editExpertSpecialization').value;
        const licenseNumber = document.getElementById('editExpertLicense').value;
        const yearsOfExperience = document.getElementById('editExpertExperience').value;
        const maxPatients = document.getElementById('editExpertMaxPatients').value;
        const bio = document.getElementById('editExpertBio').value;
        const isActive = document.getElementById('editExpertStatus').value === 'true';
        
        // Validaciones
        if (!name || !email || !institutionId || !specialization) {
            throw new Error('Todos los campos requeridos deben estar completos');
        }
        
        const formData = {
            name,
            email,
            institutionId, // ✅ CORREGIDO: usar institutionId en lugar de institution
            isActive,
            expertProfile: {
                specialization,
                licenseNumber: licenseNumber || '',
                yearsOfExperience: parseInt(yearsOfExperience) || 0,
                maxPatients: parseInt(maxPatients) || 50,
                bio: bio || ''
            }
        };
        
        console.log('📤 Actualizando experto:', expertId, formData);
        
        // Hacer petición PUT
        const response = await fetch(`${apiService.baseURL}/api/admin/experts/${expertId}`, {
            method: 'PUT',
            headers: apiService.getHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            
            let errorMessage = 'Error actualizando experto';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.success) {
            Utils.showNotification('Experto actualizado exitosamente', 'success');
            this.hideEditExpertModal();
            await this.loadExperts(); // Recargar la lista
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ Error actualizando experto:', error);
        Utils.showNotification('Error actualizando experto: ' + error.message, 'error');
    }
};

deleteExpert = async (expertId) => {
    try {
        const expert = this.experts.find(exp => exp._id === expertId);
        if (!expert) {
            throw new Error('Experto no encontrado');
        }
        
        const confirmMessage = `¿Estás seguro de que quieres eliminar al experto "${expert.name}"?\n\n` +
                              `Email: ${expert.email}\n` +
                              `Especialización: ${expert.expertProfile?.specialization || 'No especificada'}\n` +
                              `Institución: ${expert.institution?.name || 'No asignada'}\n\n` +
                              `⚠️ Esta acción no se puede deshacer.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        Utils.showNotification('Eliminando experto...', 'info');
        
        const response = await fetch(`${apiService.baseURL}/api/admin/experts/${expertId}`, {
            method: 'DELETE',
            headers: apiService.getHeaders()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            
            let errorMessage = 'Error eliminando experto';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.success) {
            Utils.showNotification('Experto eliminado exitosamente', 'success');
            await this.loadExperts();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ Error eliminando experto:', error);
        Utils.showNotification('Error eliminando experto: ' + error.message, 'error');
    }
};


hideEditExpertModal = () => {
    document.getElementById('editExpertModal').classList.add('hidden');
};

loadInstitutionsForEdit = async () => {
    try {
        const response = await this.fetchInstitutions();
        this.institutionsForEdit = response.data.institutions || [];
    } catch (error) {
        console.error('Error cargando instituciones para edición:', error);
        this.institutionsForEdit = [];
    }
};

populateInstitutionSelect = (selectId, selectedInstitutionId) => {
    const select = document.getElementById(selectId);
    if (!select || !this.institutionsForEdit) return;
    
    select.innerHTML = '<option value="">Seleccionar institución...</option>' +
        this.institutionsForEdit.map(inst => 
            `<option value="${inst._id}" ${inst._id === selectedInstitutionId ? 'selected' : ''}>
                ${inst.name}
            </option>`
        ).join('');
};

    filterExperts() {
        const searchTerm = document.getElementById('expertSearch')?.value.toLowerCase() || '';
        const institutionFilter = document.getElementById('expertInstitutionFilter')?.value || '';
        const specializationFilter = document.getElementById('expertSpecializationFilter')?.value || '';
        
        this.filteredExperts = this.experts.filter(expert => {
            const matchesSearch = 
                expert.name.toLowerCase().includes(searchTerm) ||
                expert.email.toLowerCase().includes(searchTerm) ||
                (expert.institution?.name && expert.institution.name.toLowerCase().includes(searchTerm));
            
            const matchesInstitution = !institutionFilter || expert.institution?.name === institutionFilter;
            const matchesSpecialization = !specializationFilter || expert.expertProfile?.specialization === specializationFilter;
            
            return matchesSearch && matchesInstitution && matchesSpecialization;
        });
        
        this.renderExperts();
    }

    showCreateInstitutionModal() {
        const modal = document.getElementById('createInstitutionModal');
        if (modal) modal.classList.remove('hidden');
    }

    showCreateExpertModal() {
        this.loadInstitutionsForExpert();
        const modal = document.getElementById('createExpertModal');
        if (modal) modal.classList.remove('hidden');
    }

    async loadInstitutionsForExpert() {
        const select = document.getElementById('expertInstitution');
        if (!select) return;
        
        select.innerHTML = '<option value="">Cargando instituciones...</option>';

        try {
            const response = await this.fetchInstitutions();
            const institutions = response.data.institutions || [];
            
            select.innerHTML = '<option value="">Seleccionar institución...</option>' +
                institutions.map(inst => 
                    `<option value="${inst._id}">${inst.name}</option>`
                ).join('');

        } catch (error) {
            console.error('Error cargando instituciones:', error);
            select.innerHTML = '<option value="">Error cargando instituciones</option>';
        }
    }

    async handleCreateInstitution() {
    const name = document.getElementById('institutionName')?.value;
    const type = document.getElementById('institutionType')?.value;
    const contactEmail = document.getElementById('institutionEmail')?.value;
    const phone = document.getElementById('institutionPhone')?.value;
    const institutionCode = document.getElementById('institutionCode')?.value;

    if (!name || !type || !contactEmail || !institutionCode) {
        Utils.showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    const formData = {
        name,
        type,
        contactEmail,
        phone: phone || '',
        settings: {
            institutionCode
        }
    };

    console.log('📤 Enviando datos de institución:', formData);

    try {
        // 🔥 CORRECCIÓN: Agregar /api/ en la URL
        const response = await fetch(`${apiService.baseURL}/api/institution/institutions`, {
            method: 'POST',
            headers: apiService.getHeaders(),
            body: JSON.stringify(formData)
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            
            let errorMessage = 'Error creando institución';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ Resultado:', result);

        if (result.success) {
            Utils.showNotification('Institución creada exitosamente', 'success');
            this.hideAllModals();
            document.getElementById('createInstitutionForm').reset();
            await this.loadInstitutions();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('❌ Error creando institución:', error);
        Utils.showNotification('Error creando institución: ' + error.message, 'error');
    }
}

    async handleCreateExpert() {
    // Obtener valores con verificación de existencia
    const nameElement = document.getElementById('expertName');
    const emailElement = document.getElementById('expertEmail');
    const passwordElement = document.getElementById('expertPassword');
    const institutionElement = document.getElementById('expertInstitution');
    const specializationElement = document.getElementById('expertSpecialization');
    const licenseElement = document.getElementById('expertLicense');
    const experienceElement = document.getElementById('expertExperience');
    const bioElement = document.getElementById('expertBio');

    // Verificar que todos los elementos existan
    if (!nameElement || !emailElement || !passwordElement || !specializationElement) {
        console.error('❌ Elementos del formulario no encontrados');
        Utils.showNotification('Error: formulario incompleto', 'error');
        return;
    }

    const name = nameElement.value;
    const email = emailElement.value;
    const password = passwordElement.value;
    const institutionId = institutionElement ? institutionElement.value : null;
    const specialization = specializationElement.value;
    const licenseNumber = licenseElement ? licenseElement.value : '';
    const yearsExperience = experienceElement ? experienceElement.value : '';
    const bio = bioElement ? bioElement.value : '';

    console.log('📝 Datos del formulario:', {
        name, email, institutionId, specialization
    });

    // Validaciones básicas
    if (!name || !email || !password || !specialization) {
        Utils.showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    if (password.length < 6) {
        Utils.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    const formData = {
        name: name,
        email: email,
        password: password,
        institutionId: institutionId,
        specialization: specialization,
        licenseNumber: licenseNumber,
        yearsOfExperience: yearsExperience ? parseInt(yearsExperience) : 0,
        bio: bio
    };

    console.log('📤 Enviando datos del experto:', formData);

    try {
        // 🔥 CORRECCIÓN: Agregar /api/ en la URL
        const response = await fetch(`${apiService.baseURL}/api/admin/experts`, {
            method: 'POST',
            headers: apiService.getHeaders(),
            body: JSON.stringify(formData)
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            
            let errorMessage = 'Error creando experto';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ Resultado:', result);

        if (result.success) {
            Utils.showNotification('Experto creado exitosamente', 'success');
            this.hideAllModals();
            document.getElementById('createExpertForm').reset();
            
            // FORZAR RECARGA DE LA LISTA DE EXPERTOS
            await this.loadExperts();
            
            // También recargar el dashboard para actualizar estadísticas
            if (this.currentSection === 'dashboard') {
                await this.loadDashboardData();
            }
            
            console.log('🔄 Lista de expertos actualizada después de crear nuevo experto');
        } else {
            throw new Error(result.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('❌ Error creando experto:', error);
        Utils.showNotification('Error creando experto: ' + error.message, 'error');
    }
}

    // Funciones para editar instituciones
    async editInstitution(institutionId) {
    try {
        const institution = this.institutions.find(inst => inst._id === institutionId);
        if (!institution) {
            throw new Error('Institución no encontrada');
        }

        const newName = prompt('Nuevo nombre de la institución:', institution.name);
        if (newName && newName !== institution.name) {
            // 🔥 CORRECCIÓN: Agregar /api/ en la URL
            const response = await fetch(`${apiService.baseURL}/api/institution/institutions/${institutionId}`, {
                method: 'PUT',
                headers: apiService.getHeaders(),
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error actualizando institución');
            }

            const result = await response.json();
            
            if (result.success) {
                Utils.showNotification('Institución actualizada exitosamente', 'success');
                await this.loadInstitutions();
            } else {
                throw new Error(result.message);
            }
        }

    } catch (error) {
        console.error('Error editando institución:', error);
        Utils.showNotification('Error editando institución: ' + error.message, 'error');
    }
}

    async deleteInstitution(institutionId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta institución? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // 🔥 CORRECCIÓN: Agregar /api/ en la URL
        const response = await fetch(`${apiService.baseURL}/api/institution/institutions/${institutionId}`, {
            method: 'DELETE',
            headers: apiService.getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error eliminando institución');
        }

        const result = await response.json();
        
        if (result.success) {
            Utils.showNotification('Institución eliminada exitosamente', 'success');
            await this.loadInstitutions();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Error eliminando institución:', error);
        Utils.showNotification('Error eliminando institución: ' + error.message, 'error');
    }
}

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    async handleLogout() {
        try {
            await apiService.logout();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = '../index.html';
        }
    }

    // Métodos para reportes
    async generateReport() {
        try {
            Utils.showNotification('Generando reporte...', 'info');
            
            // Aquí implementarías la generación de reportes
            // Por ahora es un placeholder
            setTimeout(() => {
                Utils.showNotification('Reporte generado exitosamente', 'success');
            }, 2000);

        } catch (error) {
            console.error('Error generando reporte:', error);
            Utils.showNotification('Error generando reporte', 'error');
        }
    }

    async loadReportsData() {
        // Cargar datos para la sección de reportes
        console.log('Cargando datos de reportes...');
    }

    // Métodos para configuración
    async loadSettingsData() {
        // Cargar configuración actual
        const anonymousLimit = document.getElementById('anonymousLimit');
        const sessionDuration = document.getElementById('sessionDuration');
        const highRiskThreshold = document.getElementById('highRiskThreshold');
        const emailAlerts = document.getElementById('emailAlerts');
        
        if (anonymousLimit) anonymousLimit.value = 5;
        if (sessionDuration) sessionDuration.value = 24;
        if (highRiskThreshold) highRiskThreshold.value = 7;
        if (emailAlerts) emailAlerts.checked = true;
    }

    async saveSettings() {
        try {
            const anonymousLimit = document.getElementById('anonymousLimit');
            const sessionDuration = document.getElementById('sessionDuration');
            const highRiskThreshold = document.getElementById('highRiskThreshold');
            const emailAlerts = document.getElementById('emailAlerts');

            const settings = {
                anonymousLimit: anonymousLimit ? parseInt(anonymousLimit.value) : 5,
                sessionDuration: sessionDuration ? parseInt(sessionDuration.value) : 24,
                highRiskThreshold: highRiskThreshold ? parseInt(highRiskThreshold.value) : 7,
                emailAlerts: emailAlerts ? emailAlerts.checked : true
            };

            // Aquí enviarías la configuración al backend
            // Por ahora es un placeholder
            Utils.showNotification('Configuración guardada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error guardando configuración:', error);
            Utils.showNotification('Error guardando configuración', 'error');
        }
    }

    async resetSettings() {
        if (!confirm('¿Estás seguro de que quieres restablecer la configuración a los valores por defecto?')) {
            return;
        }

        this.loadSettingsData();
        Utils.showNotification('Configuración restablecida', 'info');
    }

    // Métodos de visualización (placeholders)
    viewInstitution(institutionId) {
        const institution = this.institutions.find(inst => inst._id === institutionId);
        if (institution) {
            alert(`Detalles de ${institution.name}\n\nEmail: ${institution.contactEmail}\nTipo: ${this.getInstitutionTypeLabel(institution.type)}\nCódigo: ${institution.settings?.institutionCode || 'N/A'}`);
        }
    }

    viewExpert(expertId) {
        const expert = this.experts.find(exp => exp._id === expertId);
        if (expert) {
            alert(`Perfil de ${expert.name}\n\nEmail: ${expert.email}\nEspecialización: ${expert.expertProfile?.specialization || 'No especificada'}\nExperiencia: ${expert.expertProfile?.yearsOfExperience || 0} años`);
        }
    }

    editExpert(expertId) {
        Utils.showNotification(`Editando experto ${expertId} - Funcionalidad en desarrollo`, 'info');
    }

    // Función de debug para testing
    async debugExperts() {
        console.log('=== DEBUG EXPERTOS ===');
        console.log('📊 Sección actual:', this.currentSection);
        console.log('👥 Expertos en memoria:', this.experts);
        console.log('🏛️ Instituciones disponibles:', this.institutions.length);
        
        // Forzar recarga desde el servidor
        await this.loadExperts();
        
        // Verificar el DOM
        const container = document.getElementById('expertsList');
        console.log('📦 Contenedor encontrado:', !!container);
        if (container) {
            console.log('📝 Contenido del contenedor:', container.innerHTML);
        }
    }

    // Función para forzar recarga de expertos
    async forceReloadExperts() {
        console.log('🔄 Forzando recarga de expertos...');
        
        // Limpiar cache
        this.experts = [];
        
        // Forzar recarga
        await this.loadExperts();
        
        // Si estamos en la sección de expertos, re-renderizar
        if (this.currentSection === 'experts') {
            this.renderExperts();
        }
        
        Utils.showNotification('Lista de expertos recargada', 'info');
    }

    // Función de test para creación de expertos
    async testExpertCreation() {
    if (this.institutions.length === 0) {
        Utils.showNotification('Primero crea una institución para probar', 'error');
        return;
    }

    const testData = {
        name: "Test Expert",
        email: "testexpert" + Date.now() + "@test.com",
        password: "test123",
        specialization: "Psicología Clínica",
        institutionId: this.institutions[0]._id
    };

    try {
        console.log('🧪 Probando creación de experto...', testData);
        // 🔥 CORRECCIÓN: Agregar /api/ en la URL
        const response = await fetch(`${apiService.baseURL}/api/admin/experts`, {
            method: 'POST',
            headers: apiService.getHeaders(),
            body: JSON.stringify(testData)
        });

        console.log('Status:', response.status);
        const result = await response.json();
        console.log('Resultado:', result);

        if (result.success) {
            Utils.showNotification('✅ Test exitoso - Experto creado', 'success');
            await this.loadExperts();
        } else {
            Utils.showNotification('❌ Test fallido: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error en test:', error);
        Utils.showNotification('❌ Test fallido: ' + error.message, 'error');
    }
}

    // Configurar menú móvil (hamburguesa)
    setupMobileMenu() {
        const hamburgerBtn = document.getElementById('adminHamburgerBtn');
        const sidebar = document.querySelector('.admin-sidebar');
        const sidebarOverlay = document.getElementById('adminSidebarOverlay');

        if (!hamburgerBtn || !sidebar || !sidebarOverlay) return;

        // Toggle sidebar con botón hamburguesa
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });

        // Cerrar sidebar al hacer clic en el overlay
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            hamburgerBtn.classList.remove('active');
        });

        // Cerrar sidebar al hacer clic en un nav-item en mobile
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    hamburgerBtn.classList.remove('active');
                }
            });
        });
    }

}

// Inicializar el panel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});