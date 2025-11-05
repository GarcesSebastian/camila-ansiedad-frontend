let filtersLoaded = false;
let institutionConfigLoaded = false;

class ExpertPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.patients = [];
        this.recommendations = [];
        this.currentUser = null;
        this.apiService = window.apiService;
        
        if (!this.apiService) {
            console.error('❌ apiService no está disponible');
            Utils.showNotification('Error de configuración del sistema', 'error');
            return;
        }
        
        this.init();
    }

    setupResponsiveDesign() {
    //console.log('📱 Configurando diseño responsive...');
    
    // Crear botón hamburguesa si no existe
    this.createHamburgerButton();
    
    // Crear overlay para móvil
    this.createMobileOverlay();
    
    // Configurar event listeners responsive
    this.setupResponsiveEventListeners();
    
    // Inicializar estado responsive
    this.handleResize();
    
    //console.log('✅ Diseño responsive configurado');
}

createHamburgerButton() {
    if (!document.getElementById('expertHamburgerBtn')) {
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.id = 'expertHamburgerBtn';
        hamburgerBtn.className = 'expert-hamburger-btn';
        hamburgerBtn.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        document.body.appendChild(hamburgerBtn);
    }
}

createMobileOverlay() {
    if (!document.getElementById('expertSidebarOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'expertSidebarOverlay';
        overlay.className = 'expert-sidebar-overlay';
        document.body.appendChild(overlay);
    }
}

setupResponsiveEventListeners() {
    const hamburgerBtn = document.getElementById('expertHamburgerBtn');
    const overlay = document.getElementById('expertSidebarOverlay');
    const sidebar = document.querySelector('.expert-sidebar');
    
    // Toggle sidebar en móvil
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileSidebar();
        });
    }
    
    // Cerrar sidebar al hacer clic en overlay
    if (overlay) {
        overlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });
    }
    
    // Cerrar sidebar al hacer clic en un nav-item en móvil
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-item') && window.innerWidth <= 768) {
                setTimeout(() => {
                    this.closeMobileSidebar();
                }, 300);
            }
        });
    }
    
    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
        this.handleResize();
    });
    
    // Cerrar sidebar al presionar Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            this.closeMobileSidebar();
        }
    });
}

toggleMobileSidebar() {
    const sidebar = document.querySelector('.expert-sidebar');
    const overlay = document.getElementById('expertSidebarOverlay');
    const hamburgerBtn = document.getElementById('expertHamburgerBtn');
    
    if (sidebar && overlay && hamburgerBtn) {
        const isActive = sidebar.classList.contains('active');
        
        if (isActive) {
            this.closeMobileSidebar();
        } else {
            this.openMobileSidebar();
        }
    }
}

openMobileSidebar() {
    const sidebar = document.querySelector('.expert-sidebar');
    const overlay = document.getElementById('expertSidebarOverlay');
    const hamburgerBtn = document.getElementById('expertHamburgerBtn');
    
    if (sidebar && overlay && hamburgerBtn) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

closeMobileSidebar() {
    const sidebar = document.querySelector('.expert-sidebar');
    const overlay = document.getElementById('expertSidebarOverlay');
    const hamburgerBtn = document.getElementById('expertHamburgerBtn');
    
    if (sidebar && overlay && hamburgerBtn) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
}

handleResize() {
    const width = window.innerWidth;
    
    // En desktop, asegurarse de que el sidebar esté visible
    if (width > 768) {
        this.closeMobileSidebar();
        
        // Asegurar que el contenido tenga el margen correcto
        const sidebar = document.querySelector('.expert-sidebar');
        const content = document.querySelector('.expert-content');
        
        if (sidebar && content) {
            content.style.marginLeft = '';
        }
    }
    
    // Optimizar layout para tablets
    if (width <= 1024 && width > 768) {
        //console.log('📱 Modo tablet activado');
    }
    
    // Optimizar layout para móviles
    if (width <= 768) {
       // console.log('📱 Modo móvil activado');
    }
}

setupScrollBehavior() {
    
    // Forzar redibujado del scroll después de cargar contenido
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (this.expertContent) {
                this.expertContent.scrollTop = 0;
            }
        }, 100);
    });
    
    // Manejar cambios de orientación en móviles
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            this.handleResize();
        }, 300);
    });
}

fixMobileScroll() {
    // console.log('🔄 Configurando scroll para móviles...');
    
    const expertContent = document.querySelector('.expert-content');
    if (!expertContent) return;
    
    // Forzar altura en móviles
    if (window.innerWidth <= 768) {
        const headerHeight = document.querySelector('.expert-header').offsetHeight;
        const availableHeight = window.innerHeight - headerHeight;
        
        expertContent.style.height = `${availableHeight}px`;
        expertContent.style.overflowY = 'auto';
        expertContent.style.webkitOverflowScrolling = 'touch';
    }
    
    // Re-calcular en resize
    window.addEventListener('resize', () => {
        setTimeout(() => this.fixMobileScroll(), 100);
    });
}

// ✅ ACTUALIZA tu función init() para incluir el sistema responsive
async init() {
    try {
        // Verificar autenticación primero
        if (!this.apiService.isAuthenticated) {
            console.log('🔐 No autenticado, redirigiendo...');
            window.location.href = '../index.html';
            return;
        }
        
        // Verificar que el usuario es experto
        await this.verifyExpertAccess();
        
        // ✅ CORREGIDO: Cargar información del usuario PRIMERO
        await this.loadUserAndInstitution();
        
        // ✅ CORREGIDO: Configurar diseño responsive
        this.setupResponsiveDesign();
        this.fixMobileScroll();
        this.setupScrollBehavior();
        
        // ✅ NUEVO: Cargar configuración institucional UNA SOLA VEZ
        await this.loadInstitutionConfigForUI();
        
        // ✅ CORREGIDO: Configurar polling DESPUÉS de cargar todo
        this.setupPolling();
        
        // Inicializar gestión universitaria
        this.initUniversityManagement();
        
        // Inicializar gestión de palabras clave
        this.initKeywordsManagement();
        
        // Inicializar gestión de documentos
        this.initDocumentsManagement();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar listeners de gestión universitaria
        this.setupUniversityManagementListeners();
        
        // Configurar listeners de palabras clave
        this.setupKeywordsManagementListeners();
        
        // Configurar listeners de documentos
        this.setupDocumentsManagementListeners();
        
        // Inicializar análisis de riesgo
        this.initRiskAnalysis();
        
        // Configurar listeners de análisis
        this.setupRiskAnalysisListeners();
        
        // Cargar datos iniciales del dashboard
        await this.loadDashboardData();
        
        console.log('✅ Panel de experto inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando panel de experto:', error);
        Utils.showNotification('Error inicializando el panel', 'error');
    }
}

async loadInstitutionConfigForUI() {
    try {
        const response = await this.apiService.request(
            '/api/expert/institution-config',
            'GET'
        );

        if (response.success) {
            // Solo actualizar información de UI, no los filtros
            this.institutionType = response.data.institutionType;
            this.institutionName = response.data.institutionName;
            
            console.log('🏢 Configuración UI cargada:', {
                type: this.institutionType,
                name: this.institutionName
            });
            
            // Actualizar título del dashboard si existe
            const dashboardTitle = document.querySelector('#dashboard-section h2');
            if (dashboardTitle) {
                dashboardTitle.textContent = `Dashboard de Seguimiento - ${this.institutionName}`;
            }
            
            return true;
        }
    } catch (error) {
        console.log('ℹ️ Configuración institucional no disponible, usando valores por defecto');
        this.institutionType = 'university';
        this.institutionName = 'Institución';
        return false;
    }
}

    // ✅ NUEVO MÉTODO: Inicializar gestión universitaria
    initUniversityManagement() {
        this.programs = [];
        this.faculties = [];
        this.currentEditId = null;
        this.currentEditType = null;
    }

    // ✅ NUEVO MÉTODO: Cargar información del usuario e institución
    async loadUserAndInstitution() {
    try {
        // Obtener perfil actualizado del usuario
        const profileResponse = await this.apiService.getProfile();
        
        if (profileResponse.success) {
            this.currentUser = profileResponse.data.user;
            
            // ✅ OBTENER tipo de institución desde el perfil del usuario
            if (this.currentUser.institution) {
                // ✅ SOLO establecer si no está definido
                if (!this.institutionType) {
                    this.institutionType = this.currentUser.institution.type || 'university';
                    this.institutionName = this.currentUser.institution.name || 'Institución';
                    
                    console.log('🏢 Institución desde perfil:', {
                        type: this.institutionType,
                        name: this.institutionName
                    });
                }
            }
            
            // Actualizar la interfaz con la información del usuario
            this.updateUserInterface();
        } else {
            throw new Error('No se pudo cargar el perfil del usuario');
        }
    } catch (error) {
        console.error('Error cargando información del usuario:', error);
        Utils.showNotification('Error cargando información del usuario', 'error');
    }
}

    // ✅ NUEVO MÉTODO: Actualizar interfaz con datos del usuario
    updateUserInterface() {
        // Actualizar nombre del experto
        const expertNameElement = document.getElementById('expertName');
        if (expertNameElement && this.currentUser) {
            expertNameElement.textContent = this.currentUser.name;
        }
        
        // Actualizar institución
        const expertInstitutionElement = document.getElementById('expertInstitution');
        if (expertInstitutionElement && this.currentUser.institution) {
            expertInstitutionElement.textContent = this.currentUser.institution.name;
        } else if (expertInstitutionElement) {
            expertInstitutionElement.textContent = 'Institución no asignada';
        }
        
        // Cargar áreas asignadas
        this.loadAssignedAreas();
    }

    async verifyExpertAccess() {
        try {
            // Verificar que el usuario está autenticado
            if (!this.apiService.isAuthenticated) {
                window.location.href = '../index.html';
                return;
            }

            // Verificar que el usuario tiene rol de experto
            if (!this.apiService.isExpert) {
                Utils.showNotification('Acceso denegado: Se requiere rol de experto', 'error');
                window.location.href = '../index.html';
                return;
            }

            // Opcional: Verificar perfil de experto
            const user = this.apiService.getCurrentUser();
            if (!user.expertProfile) {
                Utils.showNotification('Perfil de experto incompleto', 'error');
                // Podrías redirigir a una página de completar perfil
            }

            //console.log('✅ Acceso de experto verificado correctamente');
            
        } catch (error) {
            console.error('Error verificando acceso de experto:', error);
            window.location.href = '../index.html';
        }
    }

    loadAssignedAreas() {
        const container = document.getElementById('assignedAreas');
        const expertProfile = this.currentUser.expertProfile;

        if (!expertProfile || (
            expertProfile.assignedPrograms.length === 0 &&
            expertProfile.assignedFaculties.length === 0 &&
            expertProfile.assignedCareers.length === 0
        )) {
            container.innerHTML = '<div class="area-tag">Toda la institución</div>';
            return;
        }

        let areas = [];

        if (expertProfile.assignedPrograms.length > 0) {
            areas = areas.concat(expertProfile.assignedPrograms.map(p => 
                `<div class="area-tag">📚 ${p.name}</div>`
            ));
        }

        if (expertProfile.assignedFaculties.length > 0) {
            areas = areas.concat(expertProfile.assignedFaculties.map(f => 
                `<div class="area-tag">🏛️ ${f.name}</div>`
            ));
        }

        if (expertProfile.assignedCareers.length > 0) {
            areas = areas.concat(expertProfile.assignedCareers.map(c => 
                `<div class="area-tag">🎓 ${c.name}</div>`
            ));
        }

        container.innerHTML = areas.join('');
    }

    setupEventListeners() {
    
    // Navegación - Solo si existen
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            this.showSection(section);
        });
    });

    // Botones de acción - Con verificación de existencia
    this.setupButton('refreshBtn', () => this.refreshData());
    this.setupButton('logoutBtn', () => this.handleLogout());
    // ELIMINA ESTA LÍNEA: this.setupButton('newRecommendationBtn', () => this.showRecommendationModal());
    this.setupButton('createPatientBtn', () => this.showCreatePatientModal());

    // Filtros - Con verificación de existencia
    this.setupInput('patientSearch', 'input', (e) => this.filterPatients(e.target.value));
    this.setupInput('riskFilter', 'change', (e) => this.filterPatientsByRisk(e.target.value));

    // Formularios - Con verificación de existencia
    // ELIMINA ESTA LÍNEA: this.setupForm('recommendationForm', (e) => { ... });
    
    this.setupForm('createPatientForm', (e) => {
        this.handleCreatePatient(e);
    });

    // Cerrar modales - Solo si existen
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            this.hideAllModals();
        });
    });

    // Rango de tiempo - Con verificación de existencia
    this.setupInput('timeRange', 'change', (e) => {
        this.loadDashboardData();
    });
}

// ✅ NUEVO MÉTODO: Configurar botones de forma segura
setupButton(elementId, callback) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener('click', callback);
        // console.log(`✅ Botón ${elementId} configurado`);
    } else {
        // console.warn(`⚠️ Botón ${elementId} no encontrado`);
    }
}

// ✅ NUEVO MÉTODO: Configurar inputs de forma segura
setupInput(elementId, eventType, callback) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, callback);
        // console.log(`✅ Input ${elementId} configurado para evento ${eventType}`);
    } else {
        // console.warn(`⚠️ Input ${elementId} no encontrado`);
    }
}

// ✅ NUEVO MÉTODO: Configurar formularios de forma segura
setupForm(formId, callback) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', callback);
        // console.log(`✅ Formulario ${formId} configurado`);
    } else {
        // console.warn(`⚠️ Formulario ${formId} no encontrado`);
    }
}

    // ✅ NUEVO: Configurar event listeners para gestión universitaria
    setupUniversityManagementListeners() {
    
    // Botones de creación - Con verificación de existencia
    this.setupButton('createProgramBtn', () => this.showProgramModal());
    this.setupButton('createFacultyBtn', () => this.showFacultyModal());

    // Formularios - Con verificación de existencia
    this.setupForm('programForm', (e) => this.handleProgramSubmit(e));
    this.setupForm('facultyForm', (e) => this.handleFacultySubmit(e));

    // Búsqueda - Con verificación de existencia
    this.setupInput('programSearch', 'input', (e) => this.filterPrograms(e.target.value));
    this.setupInput('facultySearch', 'input', (e) => this.filterFaculties(e.target.value));

    // Confirmación de eliminación - Con verificación de existencia
    this.setupButton('confirmDeleteBtn', () => this.handleConfirmDelete());

    // Tabs de gestión universitaria - Solo si existen
    document.querySelectorAll('.university-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.getAttribute('data-tab');
            this.showUniversityTab(tab);
        });
    });
}

    showSection(sectionName) {
    console.log('🎯 Mostrando sección:', sectionName);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remover active de todos los items de navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const targetNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }

    // Cargar datos de la sección
    this.loadSectionData(sectionName);
}

   async loadSectionData(sectionName) {
    console.log('🔀 Cambiando a sección:', sectionName);
    
    // Resetear estado si cambiamos de sección
    if (sectionName !== this.currentSection) {
        this.currentSection = sectionName;
    }
    
    switch (sectionName) {
        case 'dashboard':
            await this.loadDashboardData();
            break;
        case 'patients':
            // ✅ CORREGIDO: Cargar filtros SOLO si no están cargados
            if (!filtersLoaded) {
                await this.setupDynamicFilters();
                filtersLoaded = true;
            }
            await this.loadPatients();
            break;
        case 'university-management':
            await this.loadUniversityManagementSection();
            break;
        case 'keywords-management':
            await this.loadKeywords();
            break;
        case 'documents-management':
            await this.loadDocuments();
            break;
    }
}


    // ✅ NUEVO MÉTODO: Cargar sección de gestión universitaria
    async loadUniversityManagementSection() {
        // Verificar que es una universidad
        if (this.currentUser?.institution?.type !== 'university') {
            Utils.showNotification('Esta sección solo está disponible para universidades', 'warning');
            this.showSection('dashboard');
            return;
        }
        
        // Cargar programas y facultades
        await this.loadPrograms();
        await this.loadFaculties();
    }

   async loadDashboardData() {
    try {
        console.log('🚀 INICIANDO CARGA DEL DASHBOARD');
        
        // 1. CARGAR DATOS DEL BACKEND
        const statsResponse = await this.apiService.request(
            '/api/expert/dashboard/advanced-stats',
            'GET'
        );
        
        let dashboardData = {};
        
        if (statsResponse.success) {
            console.log('✅ Datos recibidos del backend:', statsResponse.data);
            dashboardData = statsResponse.data;
            
            // ✅ NO actualizar institutionType desde aquí
            // Solo usar los datos para renderizar, no para estado
            console.log('📊 Dashboard data - Tipo:', dashboardData.institutionType, 'Estado actual:', this.institutionType);
            
            // 2. ACTUALIZAR ESTADÍSTICAS
            this.updateAdvancedDashboardStats(dashboardData);

            // 3. RENDERIZAR GRÁFICAS
            this.renderAdvancedCharts(dashboardData);
        } else {
            console.warn('⚠️ Usando datos de ejemplo');
            this.renderSampleCharts();
        }

        // 4. CARGAR DATOS ADICIONALES
        const patientsRes = await this.fetchMyPatients();
        this.updateAdditionalStats(patientsRes);
        
        // ✅ CORREGIDO: Cargar actividad reciente REAL
        await this.loadRecentActivity();

    } catch (error) {
        console.error('💥 ERROR CRÍTICO en loadDashboardData:', error);
        
        // MOSTRAR DATOS DE EJEMPLO SI HAY ERROR
        this.renderSampleCharts();
        this.loadRecentActivity();
        
        Utils.showNotification('Dashboard cargado con datos de ejemplo', 'info');
    }
}

renderSampleCharts() {
    const institutionType = this.currentUser?.institution?.type || 'university';
    console.log('🎲 Generando datos de ejemplo para:', institutionType);
    
    let sampleData = {};
    
    switch (institutionType) {
        case 'university':
            sampleData = {
                byFaculty: [
                    { _id: "Ingeniería", count: 12 },
                    { _id: "Medicina", count: 8 },
                    { _id: "Humanidades", count: 5 }
                ],
                byProgram: [
                    { _id: "Ingeniería Sistemas", count: 8 },
                    { _id: "Medicina General", count: 6 },
                    { _id: "Psicología", count: 4 }
                ]
            };
            break;
        case 'school':
            sampleData = {
                byGrade: [
                    { _id: "10", count: 15 },
                    { _id: "11", count: 12 },
                    { _id: "9", count: 8 }
                ],
                bySection: [
                    { _id: "A", count: 12 },
                    { _id: "B", count: 10 },
                    { _id: "C", count: 8 }
                ]
            };
            break;
        case 'company':
            sampleData = {
                byDepartment: [
                    { _id: "Recursos Humanos", count: 8 },
                    { _id: "Tecnología", count: 12 },
                    { _id: "Ventas", count: 6 }
                ],
                byPosition: [
                    { _id: "Analista", count: 10 },
                    { _id: "Gerente", count: 4 },
                    { _id: "Asistente", count: 8 }
                ]
            };
            break;
        default:
            sampleData = {
                byDepartment: [
                    { _id: "Departamento A", count: 10 },
                    { _id: "Departamento B", count: 7 },
                    { _id: "Departamento C", count: 5 }
                ],
                byCourse: [
                    { _id: "Curso Básico", count: 8 },
                    { _id: "Curso Avanzado", count: 6 },
                    { _id: "Taller Especial", count: 4 }
                ]
            };
    }
    
    // Datos comunes de ansiedad
    const anxietyData = [
        { _id: "alto", count: 3 },
        { _id: "medio", count: 7 },
        { _id: "bajo", count: 10 },
        { _id: "minimo", count: 5 }
    ];
    
    // Renderizar según el tipo de institución
    switch (institutionType) {
        case 'university':
            this.renderChartWithData('facultyDistributionChart', sampleData.byFaculty, 'bar', 'Distribución por Facultad');
            this.renderChartWithData('programDistributionChart', sampleData.byProgram, 'doughnut', 'Distribución por Programa');
            break;
        case 'school':
            this.renderChartWithData('facultyDistributionChart', sampleData.byGrade, 'bar', 'Distribución por Grado');
            this.renderChartWithData('programDistributionChart', sampleData.bySection, 'pie', 'Distribución por Sección');
            break;
        case 'company':
            this.renderChartWithData('facultyDistributionChart', sampleData.byDepartment, 'bar', 'Distribución por Departamento');
            this.renderChartWithData('programDistributionChart', sampleData.byPosition, 'bar', 'Distribución por Cargo');
            break;
        default:
            this.renderChartWithData('facultyDistributionChart', sampleData.byDepartment, 'bar', 'Distribución por Departamento');
            this.renderChartWithData('programDistributionChart', sampleData.byCourse, 'bar', 'Distribución por Curso');
    }
    
    // Siempre renderizar gráfica de ansiedad
    this.renderChartWithData('anxietyLevelChart', anxietyData, 'bar', 'Niveles de Ansiedad', true);
    
    Utils.showNotification('Se muestran datos de ejemplo para demostración', 'info', 3000);
}

async loadBasicDashboardData() {
    try {
        const statsResponse = await this.apiService.getExpertDashboardStats();
        if (statsResponse.success) {
            this.updateDashboardStats(statsResponse.data);
        }
    } catch (error) {
        console.error('Error cargando estadísticas básicas:', error);
    }
}

// ✅ NUEVO: Actualizar estadísticas avanzadas
updateAdvancedDashboardStats(dashboardData) {
    const basicStats = dashboardData.basicStats || {};
    const institutionName = dashboardData.institutionName || 'Institución';
    const institutionType = dashboardData.institutionType || 'unknown';
    
    // Actualizar título del dashboard
    const dashboardTitle = document.querySelector('#dashboard-section h2');
    if (dashboardTitle) {
        dashboardTitle.textContent = `Dashboard de Seguimiento - ${institutionName}`;
    }
    
    // Actualizar tarjetas principales
    document.getElementById('totalPatients').textContent = basicStats.totalPatients || 0;
    document.getElementById('activePatients').textContent = basicStats.activePatients || 0;
    
    // Actualizar tarjetas de riesgo
    const anxietyData = dashboardData.distributions?.byAnxietyLevel || [];
    const highRiskCount = anxietyData.find(d => d._id === 'alto')?.count || 0;
    const mediumRiskCount = anxietyData.find(d => d._id === 'medio')?.count || 0;
    
    document.getElementById('highRiskPatients').textContent = highRiskCount;
    document.getElementById('mediumRiskPatients').textContent = mediumRiskCount;
}

// ✅ NUEVO: Renderizar gráficas avanzadas
renderAdvancedCharts(dashboardData) {
    try {
        console.log('🎯 INICIANDO RENDERIZADO DE GRÁFICAS', dashboardData);
        
        // ✅ USAR el tipo del dashboardData SOLO para renderizado, NO para estado
        const dashboardInstitutionType = dashboardData.institutionType;
        const currentInstitutionType = this.institutionType;
        
        console.log('📊 Tipos de institución:', {
            dashboard: dashboardInstitutionType,
            actual: currentInstitutionType,
            sonIguales: dashboardInstitutionType === currentInstitutionType
        });
        
        const distributions = dashboardData.distributions || {};
        const byInstitutionType = distributions.byInstitutionType || {};
        
        console.log('📈 Distribuciones disponibles:', Object.keys(byInstitutionType));

        // ✅ ACTUALIZAR TÍTULOS PRIMERO usando el tipo ACTUAL
        this.updateChartTitles(currentInstitutionType);

        // ✅ RENDERIZAR GRÁFICAS SEGÚN TIPO DE INSTITUCIÓN ACTUAL
        switch (currentInstitutionType) {
            case 'university':
                this.renderUniversityCharts(byInstitutionType);
                break;
            case 'school':
                this.renderSchoolCharts(byInstitutionType);
                break;
            case 'company':
                this.renderCompanyCharts(byInstitutionType);
                break;
            case 'health_center':
                this.renderHealthCenterCharts(byInstitutionType);
                break;
            default:
                this.renderGenericCharts(byInstitutionType);
        }
        
        // ✅ SIEMPRE RENDERIZAR GRÁFICA DE ANSIEDAD
        this.renderAnxietyChart(distributions.byAnxietyLevel);

    } catch (error) {
        console.error('❌ ERROR CRÍTICO en renderAdvancedCharts:', error);
        this.renderEmergencyCharts();
    }
}

renderAnxietyChart(anxietyData) {
    console.log('😔 Renderizando gráfica de ansiedad', anxietyData);
    
    const data = anxietyData || [];
    this.renderChartWithData('anxietyLevelChart', data, 'bar', 'Niveles de Ansiedad', true);
}

renderChartWithData(containerId, data, chartType, title, isAnxietyChart = false) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('❌ Contenedor no encontrado:', containerId);
        return;
    }

    // Verificar si hay datos
    if (!data || data.length === 0) {
        container.innerHTML = this.getEmptyChartHTML(title.toLowerCase());
        console.log('📭 No hay datos para:', title);
        return;
    }

    console.log(`🎨 Renderizando gráfica: ${title}`, data);

    // Limpiar contenedor y crear canvas
    container.innerHTML = `<canvas id="${containerId}Canvas"></canvas>`;
    
    const ctx = document.getElementById(`${containerId}Canvas`).getContext('2d');
    
    // Preparar datos
    const labels = data.map(item => {
        if (isAnxietyChart) {
            return this.getRiskLabel(item._id);
        }
        return item._id && item._id !== 'null' ? item._id : 'Sin especificar';
    });
    
    const values = data.map(item => item.count || 0);

    // Configurar colores
    let backgroundColor;
    if (isAnxietyChart) {
        backgroundColor = data.map(item => this.getRiskColor(item._id));
    } else {
        backgroundColor = this.generateColors(data.length);
    }

    // Configuración específica por tipo de gráfica
    const chartConfig = {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor.map(color => this.darkenColor(color)),
                borderWidth: 2,
                borderRadius: chartType === 'bar' ? 6 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: chartType === 'pie' || chartType === 'doughnut',
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: 10
                }
            },
            scales: chartType === 'bar' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Número de Pacientes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: labels.length > 5 ? '' : title.replace('Distribución por ', '')
                    }
                }
            } : undefined
        }
    };

    // Crear gráfica
    try {
        new Chart(ctx, chartConfig);
        console.log(`✅ Gráfica renderizada exitosamente: ${title}`);
    } catch (error) {
        console.error(`❌ Error creando gráfica ${title}:`, error);
        container.innerHTML = this.getErrorChartHTML(title, error.message);
    }
}

getErrorChartHTML(title, error) {
    return `
        <div class="error-chart">
            <div class="error-chart-icon">❌</div>
            <h4>Error en ${title}</h4>
            <p>${error}</p>
            <small>Intenta recargar la página</small>
        </div>
    `;
}

renderEmergencyCharts() {
    console.log('🚨 Renderizando gráficas de emergencia');
    
    // Datos de ejemplo básicos
    const sampleData = [
        { _id: "Ejemplo 1", count: 10 },
        { _id: "Ejemplo 2", count: 8 },
        { _id: "Ejemplo 3", count: 5 }
    ];
    
    const anxietyData = [
        { _id: "alto", count: 2 },
        { _id: "medio", count: 3 },
        { _id: "bajo", count: 5 }
    ];
    
    // Renderizar gráficas básicas
    this.renderChartWithData('facultyDistributionChart', sampleData, 'bar', 'Datos de Ejemplo');
    this.renderChartWithData('programDistributionChart', sampleData, 'bar', 'Datos de Ejemplo'); 
    this.renderChartWithData('anxietyLevelChart', anxietyData, 'bar', 'Niveles de Ansiedad', true);
    
    Utils.showNotification('Se muestran datos de ejemplo temporalmente', 'info');
}

renderFallbackCharts(institutionType) {
    console.log('🔄 Mostrando gráficas de respaldo para:', institutionType);
    
    // Mostrar mensajes de datos no disponibles
    const chart1 = document.getElementById('facultyDistributionChart');
    const chart2 = document.getElementById('programDistributionChart');
    const chart3 = document.getElementById('anxietyLevelChart');
    
    if (chart1) {
        chart1.innerHTML = this.getEmptyChartHTML(this.getChart1Label(institutionType));
    }
    if (chart2) {
        chart2.innerHTML = this.getEmptyChartHTML(this.getChart2Label(institutionType));
    }
    if (chart3) {
        chart3.innerHTML = this.getEmptyChartHTML('niveles de ansiedad');
    }
}

getChart1Label(institutionType) {
    const labels = {
        'university': 'facultades',
        'school': 'grados',
        'company': 'departamentos',
        'health_center': 'departamentos médicos'
    };
    return labels[institutionType] || 'departamentos';
}

getChart2Label(institutionType) {
    const labels = {
        'university': 'programas',
        'school': 'secciones', 
        'company': 'cargos',
        'health_center': 'especialidades'
    };
    return labels[institutionType] || 'cursos';
}

renderUniversityChartsWithChartJS(distributions) {
    this.renderFacultyChartWithChartJS(distributions?.byFaculty);
    this.renderProgramChartWithChartJS(distributions?.byProgram);
}

renderFacultyChartWithChartJS(facultyData) {
    const chartContainer = document.getElementById('facultyDistributionChart');
    if (!chartContainer) return;

    if (!facultyData || facultyData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('facultades');
        return;
    }

    // Limpiar contenedor
    chartContainer.innerHTML = '<canvas id="facultyChart"></canvas>';
    
    const ctx = document.getElementById('facultyChart').getContext('2d');
    
    // Preparar datos para Chart.js
    const labels = facultyData.map(item => item._id);
    const data = facultyData.map(item => item.count);
    const backgroundColors = this.generateColors(labels.length);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pacientes por Facultad',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => this.darkenColor(color)),
                borderWidth: 1,
                borderRadius: 6,
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
                    text: 'Distribución por Facultad',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Número de Pacientes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Facultades'
                    }
                }
            }
        }
    });
}

renderProgramChartWithChartJS(programData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!programData || programData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('programas');
        return;
    }

    chartContainer.innerHTML = '<canvas id="programChart"></canvas>';
    
    const ctx = document.getElementById('programChart').getContext('2d');
    
    const labels = programData.map(item => item._id);
    const data = programData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Distribución por Programa',
                    font: {
                        size: 14
                    }
                }
            },
            cutout: '50%'
        }
    });
}

renderAnxietyLevelChartWithChartJS(anxietyData) {
    const chartContainer = document.getElementById('anxietyLevelChart');
    if (!chartContainer) return;

    if (!anxietyData || anxietyData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('niveles de ansiedad');
        return;
    }

    chartContainer.innerHTML = '<canvas id="anxietyChart"></canvas>';
    
    const ctx = document.getElementById('anxietyChart').getContext('2d');
    
    // Ordenar por nivel de riesgo
    const riskOrder = ['critico', 'alto', 'medio', 'bajo', 'minimo'];
    const sortedData = anxietyData.sort((a, b) => 
        riskOrder.indexOf(a._id) - riskOrder.indexOf(b._id)
    );

    const labels = sortedData.map(item => this.getRiskLabel(item._id));
    const data = sortedData.map(item => item.count);
    const backgroundColors = sortedData.map(item => this.getRiskColor(item._id));
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pacientes',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => this.darkenColor(color)),
                borderWidth: 1,
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
                    text: 'Distribución por Nivel de Ansiedad',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Número de Pacientes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Niveles de Ansiedad'
                    }
                }
            }
        }
    });
}

renderSchoolChartsWithChartJS(distributions) {
    this.renderGradeChartWithChartJS(distributions?.byGrade);
    this.renderSectionChartWithChartJS(distributions?.bySection);
}

renderGradeChartWithChartJS(gradeData) {
    const chartContainer = document.getElementById('facultyDistributionChart');
    if (!chartContainer) return;

    if (!gradeData || gradeData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('grados');
        return;
    }

    chartContainer.innerHTML = '<canvas id="gradeChart"></canvas>';
    
    const ctx = document.getElementById('gradeChart').getContext('2d');
    
    const labels = gradeData.map(item => this.getGradeLabel(item._id));
    const data = gradeData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Estudiantes por Grado',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Grado',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Estudiantes'
                    }
                }
            }
        }
    });
}

renderSectionChartWithChartJS(sectionData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!sectionData || sectionData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('secciones');
        return;
    }

    chartContainer.innerHTML = '<canvas id="sectionChart"></canvas>';
    
    const ctx = document.getElementById('sectionChart').getContext('2d');
    
    const labels = sectionData.map(item => `Sección ${item._id}`);
    const data = sectionData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#8AC926', '#1982C4'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Sección',
                    font: {
                        size: 14
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

renderCompanyChartsWithChartJS(distributions) {
    this.renderDepartmentChartWithChartJS(distributions?.byDepartment, 'Departamentos');
    this.renderPositionChartWithChartJS(distributions?.byPosition);
}

renderPositionChartWithChartJS(positionData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!positionData || positionData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('cargos');
        return;
    }

    chartContainer.innerHTML = '<canvas id="positionChart"></canvas>';
    
    const ctx = document.getElementById('positionChart').getContext('2d');
    
    const labels = positionData.map(item => item._id);
    const data = positionData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Empleados por Cargo',
                data: data,
                backgroundColor: 'rgba(255, 159, 64, 0.8)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Cargo',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Empleados'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// ✅ NUEVO: Gráficas para centro de salud
renderHealthCenterChartsWithChartJS(distributions) {
    this.renderDepartmentChartWithChartJS(distributions?.byDepartment, 'Departamentos Médicos');
    this.renderSpecialtyChartWithChartJS(distributions?.bySpecialty);
}

// ✅ NUEVO: Gráfica de especialidades para centro de salud
renderSpecialtyChartWithChartJS(specialtyData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!specialtyData || specialtyData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('especialidades');
        return;
    }

    chartContainer.innerHTML = '<canvas id="specialtyChart"></canvas>';
    
    const ctx = document.getElementById('specialtyChart').getContext('2d');
    
    const labels = specialtyData.map(item => item._id);
    const data = specialtyData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
                    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Especialidad',
                    font: {
                        size: 14
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ✅ NUEVO: Gráficas genéricas
renderGenericChartsWithChartJS(distributions) {
    this.renderDepartmentChartWithChartJS(distributions?.byDepartment, 'Departamentos');
    this.renderCourseChartWithChartJS(distributions?.byCourse);
}

// ✅ NUEVO: Gráfica de cursos para instituciones genéricas
renderCourseChartWithChartJS(courseData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!courseData || courseData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('cursos');
        return;
    }

    chartContainer.innerHTML = '<canvas id="courseChart"></canvas>';
    
    const ctx = document.getElementById('courseChart').getContext('2d');
    
    const labels = courseData.map(item => item._id);
    const data = courseData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Participantes por Curso',
                data: data,
                backgroundColor: 'rgba(106, 76, 147, 0.8)',
                borderColor: 'rgba(106, 76, 147, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Curso',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Participantes'
                    }
                }
            }
        }
    });
}

// ✅ NUEVO: Gráfica de departamentos con Chart.js
renderDepartmentChartWithChartJS(departmentData, title = 'Departamentos') {
    const chartContainer = document.getElementById('facultyDistributionChart');
    if (!chartContainer) return;

    if (!departmentData || departmentData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML(title.toLowerCase());
        return;
    }

    chartContainer.innerHTML = '<canvas id="departmentChart"></canvas>';
    
    const ctx = document.getElementById('departmentChart').getContext('2d');
    
    const labels = departmentData.map(item => item._id);
    const data = departmentData.map(item => item.count);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Pacientes por ${title}`,
                data: data,
                backgroundColor: 'rgba(153, 102, 255, 0.8)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Distribución por ${title}`,
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Empleados'
                    }
                }
            }
        }
    });
}

// ✅ NUEVO: Función para generar colores
generateColors(count) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
        '#6A4C93', '#F25F5C', '#FFE066', '#247BA0',
        '#70D6FF', '#FF70A6', '#FF9770', '#FFD670',
        '#E9FF70', '#8AC926', '#06D6A0', '#118AB2'
    ];
    
    if (count > colors.length) {
        const additionalColors = [];
        for (let i = colors.length; i < count; i++) {
            const hue = (i * 137.508) % 360; // Golden angle approximation
            additionalColors.push(`hsl(${hue}, 70%, 65%)`);
        }
        return [...colors, ...additionalColors].slice(0, count);
    }
    
    return colors.slice(0, count);
}

// ✅ NUEVO: Función para oscurecer color (para bordes)
darkenColor(color) {
    if (color.startsWith('hsl')) {
        return color.replace(/(\d+)%\)/, (match, lightness) => {
            return `${Math.max(0, parseInt(lightness) - 15)}%)`;
        });
    }
    
    // Para colores hex
    return color.replace(/^#/, '').replace(/../g, color => 
        ('0' + Math.min(255, Math.max(0, parseInt(color, 16) - 30)).toString(16)).substr(-2)
    );
}

// Obtener color según nivel de riesgo
getRiskColor(riskLevel) {
    const colors = {
        'critico': '#e74c3c',
        'alto': '#e67e22', 
        'medio': '#f39c12',
        'bajo': '#f1c40f',
        'minimo': '#2ecc71'
    };
    return colors[riskLevel] || '#95a5a6';
}



updateChartTitles(institutionType) {
    const chart1 = document.querySelector('#facultyDistributionChart')?.closest('.chart-card');
    const chart2 = document.querySelector('#programDistributionChart')?.closest('.chart-card');
    const chart3 = document.querySelector('#anxietyLevelChart')?.closest('.chart-card');

    if (chart1 && chart2 && chart3) {
        const titles = this.getChartTitles(institutionType);
        
        const title1 = chart1.querySelector('h3');
        const title2 = chart2.querySelector('h3'); 
        const title3 = chart3.querySelector('h3');
        
        if (title1) title1.innerHTML = titles.chart1;
        if (title2) title2.innerHTML = titles.chart2;
        if (title3) title3.innerHTML = titles.chart3;
    }
}

getChartTitles(institutionType) {
    const titles = {
        university: {
            chart1: '📊 Distribución por Facultad',
            chart2: '🎓 Distribución por Programa', 
            chart3: '😔 Niveles de Ansiedad'
        },
        school: {
            chart1: '📚 Distribución por Grado',
            chart2: '👥 Distribución por Sección',
            chart3: '😔 Niveles de Ansiedad'
        },
        company: {
            chart1: '🏢 Distribución por Departamento',
            chart2: '💼 Distribución por Cargo',
            chart3: '😔 Niveles de Ansiedad'
        },
        health_center: {
            chart1: '🏥 Distribución por Departamento',
            chart2: '🩺 Distribución por Especialidad',
            chart3: '😔 Niveles de Ansiedad'
        }
    };
    
    return titles[institutionType] || {
        chart1: '🏢 Distribución por Departamento',
        chart2: '📖 Distribución por Curso',
        chart3: '😔 Niveles de Ansiedad'
    };
}

renderUniversityCharts(distributions) {
    console.log('🏛️ Renderizando gráficas para universidad', distributions);
    
    // Gráfica 1: Facultades
    const facultyData = distributions.byFaculty || [];
    this.renderChartWithData('facultyDistributionChart', facultyData, 'bar', 'Distribución por Facultad');
    
    // Gráfica 2: Programas  
    const programData = distributions.byProgram || [];
    this.renderChartWithData('programDistributionChart', programData, 'doughnut', 'Distribución por Programa');
}

// ✅ NUEVO: Gráficas para COLEGIO
renderSchoolCharts(distributions) {
    console.log('🏫 Renderizando gráficas para colegio', distributions);
    
    // Gráfica 1: Grados
    const gradeData = distributions.byGrade || [];
    this.renderChartWithData('facultyDistributionChart', gradeData, 'bar', 'Distribución por Grado');
    
    // Gráfica 2: Secciones
    const sectionData = distributions.bySection || [];
    this.renderChartWithData('programDistributionChart', sectionData, 'pie', 'Distribución por Sección');
}

async loadPatientsByGrade() {
    try {
        const response = await this.apiService.request(
            '/api/expert/patients/by-grade',
            'GET'
        );
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cargando pacientes por grado:', error);
        return [];
    }
}

async loadPatientsBySection() {
    try {
        const response = await this.apiService.request(
            '/api/expert/patients/by-section',
            'GET'
        );
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cargando pacientes por sección:', error);
        return [];
    }
}

// ✅ NUEVO: Gráficas para EMPRESA
renderCompanyCharts(distributions) {
    console.log('🏢 Renderizando gráficas para empresa', distributions);
    
    // Gráfica 1: Departamentos
    const deptData = distributions.byDepartment || [];
    this.renderChartWithData('facultyDistributionChart', deptData, 'bar', 'Distribución por Departamento');
    
    // Gráfica 2: Cargos
    const positionData = distributions.byPosition || [];
    this.renderChartWithData('programDistributionChart', positionData, 'bar', 'Distribución por Cargo');
}

// ✅ NUEVO: Gráficas para CENTRO DE SALUD
renderHealthCenterCharts(distributions) {
    console.log('🏥 Renderizando gráficas para centro de salud', distributions);
    
    // Gráfica 1: Departamentos médicos
    const deptData = distributions.byDepartment || [];
    this.renderChartWithData('facultyDistributionChart', deptData, 'bar', 'Distribución por Departamento Médico');
    
    // Gráfica 2: Especialidades
    const specialtyData = distributions.bySpecialty || [];
    this.renderChartWithData('programDistributionChart', specialtyData, 'pie', 'Distribución por Especialidad');
}

// ✅ NUEVO: Gráficas genéricas
renderGenericCharts(distributions) {
    console.log('🏢 Renderizando gráficas genéricas', distributions);
    
    // Gráfica 1: Departamentos
    const deptData = distributions.byDepartment || [];
    this.renderChartWithData('facultyDistributionChart', deptData, 'bar', 'Distribución por Departamento');
    
    // Gráfica 2: Cursos
    const courseData = distributions.byCourse || [];
    this.renderChartWithData('programDistributionChart', courseData, 'bar', 'Distribución por Curso');
}

// ✅ NUEVO: Gráfica de grados (Colegio)
renderGradeChart(gradeData) {
    const chartContainer = document.getElementById('facultyDistributionChart');
    if (!chartContainer) return;

    if (!gradeData || gradeData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('grados');
        
        // ✅ NUEVO: Agregar botón de debug
        this.addDebugButton(chartContainer, 'grados');
        return;
    }

    const maxCount = Math.max(...gradeData.map(item => item.count));
    
    chartContainer.innerHTML = `
        <div class="chart-content">
            <h4>📚 Distribución por Grado</h4>
            <div class="chart-bars">
                ${gradeData.map(grade => `
                    <div class="chart-bar">
                        <div class="bar-label">${this.getGradeLabel(grade._id)}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${maxCount > 0 ? (grade.count / maxCount) * 100 : 0}%">
                                <span class="bar-value">${grade.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="chart-footer">
                <small>Total: ${gradeData.reduce((sum, grade) => sum + grade.count, 0)} estudiantes</small>
            </div>
        </div>
    `;
}

// ✅ NUEVO: Gráfica de secciones (Colegio)
renderSectionChart(sectionData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!sectionData || sectionData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('secciones');
        
        // ✅ NUEVO: Agregar botón de debug
        this.addDebugButton(chartContainer, 'secciones');
        return;
    }

    const maxCount = Math.max(...sectionData.map(item => item.count));
    
    chartContainer.innerHTML = `
        <div class="chart-content">
            <h4>👥 Distribución por Sección</h4>
            <div class="chart-bars">
                ${sectionData.map(section => `
                    <div class="chart-bar">
                        <div class="bar-label">Sección ${section._id}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${maxCount > 0 ? (section.count / maxCount) * 100 : 0}%">
                                <span class="bar-value">${section.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="chart-footer">
                <small>Total: ${sectionData.reduce((sum, section) => sum + section.count, 0)} estudiantes</small>
            </div>
        </div>
    `;
}

addDebugButton(container, type) {
    const debugBtn = document.createElement('button');
    debugBtn.className = 'btn-debug btn-sm';
    debugBtn.innerHTML = '🔍 Verificar Datos';
    debugBtn.onclick = () => this.debugSchoolData();
    
    const debugSection = document.createElement('div');
    debugSection.className = 'debug-section';
    debugSection.innerHTML = `
        <p>No se encontraron datos de ${type}. Esto puede ser porque:</p>
        <ul>
            <li>Los pacientes no tienen ${type} asignados</li>
            <li>Los datos no se guardaron correctamente</li>
            <li>No hay pacientes de colegio asignados</li>
        </ul>
    `;
    debugSection.appendChild(debugBtn);
    
    container.appendChild(debugSection);
}

// ✅ NUEVO: Debug de datos de colegio
async debugSchoolData() {
    try {
        
        const response = await this.apiService.request(
            '/api/expert/patients/debug-school-data',
            'GET'
        );
        
        if (response.success) {
            const data = response.data;
            
            // Mostrar resultados en consola
            console.log('🏫 DEBUG - Datos de colegio:', data);
            
            // Mostrar alerta con información
            alert(
                `DEBUG - Datos de Colegio:\n\n` +
                `Total pacientes: ${data.totalPatients}\n` +
                `Pacientes de colegio: ${data.schoolPatients}\n\n` +
                `Detalles por paciente:\n` +
                data.patients.map(p => 
                    `• ${p.name}: Grado ${p.grade || 'N/A'}, Sección ${p.section || 'N/A'}`
                ).join('\n') +
                `\n\nRevisa la consola para más detalles.`
            );
            
            // Si no hay pacientes de colegio, sugerir crear uno
            if (data.schoolPatients === 0) {
                if (confirm('No se encontraron pacientes de colegio. ¿Quieres crear uno ahora?')) {
                    this.showCreatePatientModal();
                }
            }
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error en debug:', error);
        alert('Error en debug: ' + error.message);
    }
}

// ✅ NUEVO: Verificar si hay datos de colegio
hasSchoolData() {
    return this.patients.some(patient => 
        patient.institutionalPath?.grade || patient.institutionalPath?.section
    );
}

// ✅ NUEVO: Obtener pacientes de colegio
getSchoolPatients() {
    return this.patients.filter(patient => 
        patient.institutionalPath?.grade || patient.institutionalPath?.section
    );
}

// ✅ NUEVO: Gráfica de departamentos (Común)
renderDepartmentChart(departmentData, title = 'Departamentos') {
    const chartContainer = document.getElementById('facultyDistributionChart');
    if (!chartContainer) return;

    if (!departmentData || departmentData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML(title.toLowerCase());
        return;
    }

    chartContainer.innerHTML = `
        <div class="chart-content">
            <h4>🏢 Distribución por ${title}</h4>
            <div class="chart-bars">
                ${departmentData.map(dept => `
                    <div class="chart-bar">
                        <div class="bar-label">${dept._id}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${(dept.count / Math.max(...departmentData.map(d => d.count))) * 100}%">
                                <span class="bar-value">${dept.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ✅ NUEVO: Gráfica de cargos (Empresa)
renderPositionChart(positionData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!positionData || positionData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('cargos');
        return;
    }

    chartContainer.innerHTML = `
        <div class="chart-content">
            <h4>💼 Distribución por Cargo</h4>
            <div class="chart-bars">
                ${positionData.map(position => `
                    <div class="chart-bar">
                        <div class="bar-label">${position._id}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${(position.count / Math.max(...positionData.map(p => p.count))) * 100}%">
                                <span class="bar-value">${position.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ✅ NUEVO: Gráfica de especialidades (Centro de salud)
renderSpecialtyChart(specialtyData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!specialtyData || specialtyData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('especialidades');
        return;
    }

    chartContainer.innerHTML = `
        <div class="chart-content">
            <h4>🏥 Distribución por Especialidad</h4>
            <div class="chart-bars">
                ${specialtyData.map(specialty => `
                    <div class="chart-bar">
                        <div class="bar-label">${specialty._id}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${(specialty.count / Math.max(...specialtyData.map(s => s.count))) * 100}%">
                                <span class="bar-value">${specialty.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ✅ NUEVO: Gráfica de cursos (Genérico)
renderCourseChart(courseData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!courseData || courseData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('cursos');
        return;
    }

    chartContainer.innerHTML = `
        <div class="chart-content">
            <h4>📖 Distribución por Curso</h4>
            <div class="chart-bars">
                ${courseData.map(course => `
                    <div class="chart-bar">
                        <div class="bar-label">${course._id}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${(course.count / Math.max(...courseData.map(c => c.count))) * 100}%">
                                <span class="bar-value">${course.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ✅ NUEVO: Gráfica de facultades
renderFacultyChart(facultyData) {
    const chartContainer = document.getElementById('facultyDistributionChart');
    if (!chartContainer) return;

    if (!facultyData || facultyData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('facultades');
        return;
    }

    // Usar Chart.js o implementación simple
    chartContainer.innerHTML = `
        <div class="chart-content">
            <div class="chart-bars">
                ${facultyData.map(faculty => `
                    <div class="chart-bar">
                        <div class="bar-label">${faculty._id}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${(faculty.count / Math.max(...facultyData.map(f => f.count))) * 100}%">
                                <span class="bar-value">${faculty.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ✅ NUEVO: Gráfica de programas
renderProgramChart(programData) {
    const chartContainer = document.getElementById('programDistributionChart');
    if (!chartContainer) return;

    if (!programData || programData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('programas');
        return;
    }

    chartContainer.innerHTML = `
        <div class="chart-content">
            <div class="chart-bars">
                ${programData.map(program => `
                    <div class="chart-bar">
                        <div class="bar-label">${program._id}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${(program.count / Math.max(...programData.map(p => p.count))) * 100}%">
                                <span class="bar-value">${program.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ✅ NUEVO: Gráfica de niveles de ansiedad
renderAnxietyLevelChart(anxietyData) {
    const chartContainer = document.getElementById('anxietyLevelChart');
    if (!chartContainer) return;

    if (!anxietyData || anxietyData.length === 0) {
        chartContainer.innerHTML = this.getEmptyChartHTML('niveles de ansiedad');
        return;
    }

    // Ordenar por nivel de riesgo
    const riskOrder = ['critico', 'alto', 'medio', 'bajo', 'minimo'];
    const sortedData = anxietyData.sort((a, b) => 
        riskOrder.indexOf(a._id) - riskOrder.indexOf(b._id)
    );

    chartContainer.innerHTML = `
        <div class="chart-content">
            <div class="chart-bars anxiety-bars">
                ${sortedData.map(level => `
                    <div class="chart-bar">
                        <div class="bar-label">${this.getRiskLabel(level._id)}</div>
                        <div class="bar-container">
                            <div class="bar-fill anxiety-${level._id}" 
                                 style="width: ${(level.count / Math.max(...anxietyData.map(l => l.count))) * 100}%">
                                <span class="bar-value">${level.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ✅ NUEVO: HTML para gráficas vacías
getEmptyChartHTML(type) {
    return `
        <div class="empty-chart">
            <div class="empty-chart-icon">📊</div>
            <h4>No hay datos de ${type}</h4>
            <p>Los datos aparecerán cuando tengas pacientes asignados</p>
            <small>Puedes crear pacientes en la sección "Pacientes"</small>
        </div>
    `;
}

    async fetchMyPatients() {
        try {
            const response = await this.apiService.getMyPatients();
            return response;
        } catch (error) {
            console.error('❌ Error fetching patients:', error);
            return { data: { patients: [] } };
        }
    }

    updateDashboardStats(dashboardData) {
        const stats = dashboardData.stats || {};
        
        document.getElementById('totalPatients').textContent = stats.totalPatients || 0;
        document.getElementById('highRiskPatients').textContent = stats.highRiskPatients || 0;
        document.getElementById('mediumRiskPatients').textContent = stats.mediumRiskPatients || 0;
        document.getElementById('pendingRecommendations').textContent = stats.pendingRecommendations || 0;
    }

    updateAdditionalStats(patientsRes) {
        const patients = patientsRes.data.patients || [];
        
        // Actualizar estadísticas adicionales si es necesario
        const highRiskCount = patients.filter(p => this.getPatientRiskLevel(p) === 'high').length;
        if (highRiskCount > 0) {
            document.getElementById('highRiskPatients').textContent = highRiskCount;
        }
    }

    loadCharts() {
        // En implementación real, usarías una librería como Chart.js
        const riskChart = document.getElementById('riskDistributionChart');
        const trendChart = document.getElementById('weeklyTrendChart');

        riskChart.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 10px;">📊</div>
                <p>Gráfico de distribución de riesgo</p>
                <small>Se mostrará con datos reales</small>
            </div>
        `;

        trendChart.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 10px;">📈</div>
                <p>Gráfico de tendencia semanal</p>
                <small>Se mostrará con datos reales</small>
            </div>
        `;
    }

    async loadRecentActivity() {
    try {
        console.log('🔄 Cargando actividad reciente...');
        
        const response = await this.apiService.request(
            '/api/expert/dashboard/recent-activity?limit=10',
            'GET'
        );

        const container = document.getElementById('recentActivity');
        if (!container) {
            console.error('❌ Contenedor de actividad reciente no encontrado');
            return;
        }

        if (response.success && response.data.activities.length > 0) {
            this.renderRecentActivity(response.data.activities, container);
        } else {
            this.renderEmptyRecentActivity(container, response.data?.message);
        }

    } catch (error) {
        console.error('❌ Error cargando actividad reciente:', error);
        this.renderErrorRecentActivity(error.message);
    }
}

renderRecentActivity(activities, container) {
    console.log('🎨 Renderizando actividad reciente:', activities.length, 'actividades');
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item ${activity.riskLevel ? `risk-${activity.riskLevel}` : ''}">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-meta">
                    <span class="activity-user">${activity.user}</span>
                    ${activity.riskLevel ? `
                        <span class="activity-risk risk-${activity.riskLevel}">
                            ${this.getRiskLabel(activity.riskLevel)}
                        </span>
                    ` : ''}
                    ${activity.metadata?.keywordsDetected ? `
                        <span class="activity-keywords">
                            ${activity.metadata.keywordsDetected} palabra(s) clave
                        </span>
                    ` : ''}
                </div>
                <div class="activity-time">${this.formatRelativeTime(activity.date)}</div>
            </div>
        </div>
    `).join('');
}

// ✅ NUEVA FUNCIÓN: Actividad vacía
renderEmptyRecentActivity(container, message = 'No hay actividad reciente') {
    container.innerHTML = `
        <div class="empty-activity">
            <div class="empty-activity-icon">📊</div>
            <div class="empty-activity-content">
                <div class="empty-activity-title">Sin actividad reciente</div>
                <div class="empty-activity-description">${message}</div>
                <div class="empty-activity-help">
                    La actividad aparecerá cuando tus pacientes inicien conversaciones
                </div>
            </div>
        </div>
    `;
}

// ✅ NUEVA FUNCIÓN: Error en actividad
renderErrorRecentActivity(errorMessage) {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    container.innerHTML = `
        <div class="error-activity">
            <div class="error-activity-icon">⚠️</div>
            <div class="error-activity-content">
                <div class="error-activity-title">Error cargando actividad</div>
                <div class="error-activity-description">${errorMessage}</div>
                <button class="btn-retry" onclick="expertPanel.loadRecentActivity()">
                    Reintentar
                </button>
            </div>
        </div>
    `;
}

// ✅ NUEVA FUNCIÓN: Formatear tiempo relativo
formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace unos momentos';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

  async loadPatients() {
    try {
        // Mostrar estado de carga
        const container = document.getElementById('patientsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando pacientes...</p>
                </div>
            `;
        }

        // ✅ CORREGIDO: Cargar filtros dinámicos solo si no están cargados
        if (!document.querySelector('.advanced-filters')) {
            await this.setupDynamicFilters();
        }

        // Cargar pacientes con filtros actuales
        const currentFilters = this.collectFilterValues();
        await this.loadPatientsAdvanced(currentFilters);

    } catch (error) {
        console.error('Error cargando pacientes:', error);
        Utils.showNotification('Error cargando pacientes', 'error');
        
        const container = document.getElementById('patientsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Error cargando pacientes</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="expertPanel.loadPatients()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

async reloadFilters() {
    const filtersContainer = document.getElementById('advancedFilters');
    if (filtersContainer) {
        filtersContainer.innerHTML = '';
    }
    await this.setupDynamicFilters();
}

debugFilters() {
    console.log('🔍 DEBUG FILTROS:');
    console.log('- Institución tipo:', this.institutionType);
    console.log('- Institución nombre:', this.institutionName);
    console.log('- Filtros actuales:', this.collectFilterValues());
    
    const filtersContainer = document.getElementById('advancedFilters');
    if (filtersContainer) {
        console.log('- Contenedor HTML:', filtersContainer.innerHTML);
    }
}
    renderPatients() {
    const container = document.getElementById('patientsGrid');
    
    if (this.patients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>No hay pacientes asignados</h3>
                <p>Los pacientes aparecerán aquí según tu área de asignación</p>
                <button class="btn-primary" onclick="expertPanel.showCreatePatientModal()">
                    + Crear Primer Paciente
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = this.patients.map(patient => {
        // ✅ CORREGIDO: Obtener nivel de riesgo de forma más robusta
        const riskLevel = this.getPatientRiskLevel(patient);
        const riskClass = this.getRiskClass(riskLevel);
        
        // ✅ NUEVO: Obtener estadísticas reales
        const totalChats = patient.stats?.totalChats || 0;
        const highRiskChats = patient.stats?.highRiskChats || 0;
        const lastActivity = patient.stats?.lastActivity ? 
            new Date(patient.stats.lastActivity).toLocaleDateString() : 'Nunca';
        
        return `
            <div class="patient-card ${riskClass}" onclick="expertPanel.viewPatientDetail('${patient._id}')">
                <div class="patient-header">
                    <h3 class="patient-name">${patient.name}</h3>
                    <span class="risk-badge ${riskLevel}">
                        ${this.getRiskLabel(riskLevel)}
                    </span>
                </div>
                
                <div class="patient-info">
                    <div class="patient-field">
                        <span class="label">Email:</span>
                        <span class="value">${patient.email}</span>
                    </div>
                    <div class="patient-field">
                        <span class="label">Riesgo Actual:</span>
                        <span class="value ${riskLevel}">${this.getRiskLabel(riskLevel)}</span>
                    </div>
                    <div class="patient-field">
                        <span class="label">Última Actividad:</span>
                        <span class="value">${lastActivity}</span>
                    </div>
                    <div class="patient-field">
                        <span class="label">Programa:</span>
                        <span class="value">${patient.institutionalPath?.program?.name || 'No asignado'}</span>
                    </div>
                </div>
                
                <div class="patient-stats">
                    <div class="stat-item">
                        <div class="stat-value">${totalChats}</div>
                        <div class="stat-label">Conversaciones</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${highRiskChats}</div>
                        <div class="stat-label">Alto Riesgo</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.getDaysSinceLastActivity(patient)}</div>
                        <div class="stat-label">Días sin Actividad</div>
                    </div>
                </div>
                
                <div class="patient-actions">
                    <button class="btn-secondary btn-sm" onclick="event.stopPropagation(); expertPanel.viewPatientAnalysis('${patient._id}')">
                        📊 Análisis
                    </button>
                    <button class="btn-warning btn-sm" onclick="event.stopPropagation(); expertPanel.viewPatientChats('${patient._id}')">
                        💬 Conversaciones
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ✅ NUEVO: Ver análisis de palabras clave del paciente
async viewKeywordAnalysis(patientId) {
    try {
        const response = await this.apiService.getPatientRiskHistory(patientId);
        
        if (response.success) {
            this.showKeywordAnalysisModal(patientId, response.data.history);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error viendo análisis de palabras clave:', error);
        Utils.showNotification('Error cargando análisis: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Mostrar modal de análisis de palabras clave
showKeywordAnalysisModal(patientId, history) {
    const patient = this.patients.find(p => p._id === patientId);
    const modalContent = document.getElementById('patientDetailContent');
    
    modalContent.innerHTML = `
        <div class="keyword-analysis">
            <div class="detail-header">
                <h3>Análisis de Palabras Clave - ${patient.name}</h3>
                <span class="risk-badge ${patient.patientProfile?.riskLevel || 'minimo'}">
                    ${this.getRiskLabel(patient.patientProfile?.riskLevel || 'minimo')}
                </span>
            </div>
            
            <div class="analysis-stats">
                <h4>Estadísticas de Detección</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${history.length}</div>
                        <div class="stat-label">Análisis Realizados</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.countHighRiskEvents(history)}</div>
                        <div class="stat-label">Eventos Alto Riesgo</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.countKeywordsDetected(history)}</div>
                        <div class="stat-label">Total Palabras Detectadas</div>
                    </div>
                </div>
            </div>
            
            <div class="risk-history">
                <h4>Historial de Riesgo</h4>
                ${history.length > 0 ? 
                    this.renderRiskHistory(history) : 
                    '<p class="no-data">No hay historial de análisis disponible</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('patientDetailModal').classList.remove('hidden');
}

    getPatientRiskLevel(patient) {
    // Prioridad 1: Del perfil del paciente
    if (patient.patientProfile?.riskLevel) {
        return patient.patientProfile.riskLevel;
    }
    
    // Prioridad 2: Del último assessment
    if (patient.patientProfile?.lastRiskAssessment?.riskLevel) {
        return patient.patientProfile.lastRiskAssessment.riskLevel;
    }
    
    // Prioridad 3: Inferir de estadísticas de chats
    if (patient.stats?.highRiskChats > 0) return 'alto';
    if (patient.stats?.totalChats > 0) return 'medio';
    
    return 'minimo';
}

    getRiskLabel(riskLevel) {
    const labels = {
        'critico': 'Crítico',
        'alto': 'Alto Riesgo',
        'medio': 'Riesgo Moderado', 
        'bajo': 'Riesgo Leve',
        'minimo': 'Mínimo'
    };
    return labels[riskLevel] || 'Sin Evaluar';
}

getRiskClass(riskLevel) {
    const classes = {
        'critico': 'critical-risk',
        'alto': 'high-risk', 
        'medio': 'medium-risk',
        'bajo': 'low-risk',
        'minimo': 'minimal-risk'
    };
    return classes[riskLevel] || 'minimal-risk';
}
    getDaysSinceLastActivity(patient) {
    if (!patient.stats?.lastActivity) return '-';
    const lastActivity = new Date(patient.stats.lastActivity);
    const today = new Date();
    const diffTime = Math.abs(today - lastActivity);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
    

    calculateRiskScore(patient) {
        const highRiskChats = patient.stats?.highRiskChats || 0;
        const totalChats = patient.stats?.totalChats || 1;
        return Math.min(10, Math.round((highRiskChats / totalChats) * 10));
    }

    getPriorityLabel(priority) {
        const labels = {
            'urgent': 'Urgente',
            'high': 'Alta',
            'medium': 'Media',
            'low': 'Baja'
        };
        return labels[priority] || priority;
    }

    // ==================== CREACIÓN DE PACIENTES ====================

    showCreatePatientModal() {
        this.loadInstitutionalStructure();
        document.getElementById('createPatientModal').classList.remove('hidden');
    }

    async loadInstitutionalStructure() {
        try {
            if (!this.currentUser.institution) {
                Utils.showNotification('No tienes una institución asignada', 'error');
                return;
            }

            const response = await this.apiService.getExpertInstitutionStructure(this.currentUser.institution._id);
            
            if (response.success) {
                this.institutionType = response.data.institution?.type;
                this.populateInstitutionalForm(this.institutionType, response.data);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando estructura institucional:', error);
            Utils.showNotification('Error cargando la estructura institucional', 'error');
        }
    }

    async loadInstitutionConfig() {
    try {
        const response = await this.apiService.request(
            '/api/expert/institution-config',
            'GET'
        );

        if (response.success) {
            this.institutionConfig = response.data.config;
            this.institutionType = response.data.institutionType;
            this.institutionName = response.data.institutionName;
            
            console.log('🏢 Configuración cargada:', {
                type: this.institutionType,
                name: this.institutionName,
                config: this.institutionConfig
            });
            
            return true;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cargando configuración institucional:', error);
        // Configuración por defecto para universidad
        this.institutionConfig = this.getDefaultInstitutionConfig();
        this.institutionType = 'university';
        this.institutionName = 'Institución';
        return false;
    }
}

getDefaultInstitutionConfig() {
    return {
        name: 'Universidad',
        filters: {
            program: { label: 'Programa', field: 'program' },
            faculty: { label: 'Facultad', field: 'faculty' },
            riskLevel: { label: 'Nivel de Riesgo', field: 'riskLevel' },
            status: { label: 'Estado', field: 'status' }
        },
        tableColumns: [
            { key: 'name', label: 'Nombre' },
            { key: 'email', label: 'Email' },
            { key: 'program', label: 'Programa' },
            { key: 'faculty', label: 'Facultad' },
            { key: 'riskLevel', label: 'Nivel de Riesgo' },
            { key: 'lastActivity', label: 'Última Actividad' },
            { key: 'status', label: 'Estado' },
            { key: 'actions', label: 'Acciones' }
        ]
    };
}

// ✅ NUEVO: Configurar filtros dinámicos
async setupDynamicFilters() {
    try {
        const filtersContainer = document.getElementById('advancedFilters');
        if (!filtersContainer) {
            console.log('❌ Contenedor de filtros no encontrado');
            return;
        }

        // ✅ VERIFICACIÓN MÁS ESTRICTA: Si ya hay filtros, NO recargar
        const existingFilters = filtersContainer.querySelector('.advanced-filters');
        if (existingFilters && filtersLoaded) {
            console.log('🔄 Filtros ya existen, omitiendo carga duplicada');
            return;
        }

        console.log('🎯 Iniciando carga de filtros dinámicos...');

        // Mostrar loading
        filtersContainer.innerHTML = '<div class="loading-text">🎯 Cargando filtros para tu institución...</div>';

        // Obtener opciones de filtro del backend
        const response = await this.apiService.request(
            '/api/expert/filters/options',
            'GET'
        );

        if (!response.success) {
            throw new Error(response.message);
        }

        const filterOptions = response.data;
        
        // ✅ EN setupDynamicFilters(), después de obtener la respuesta:
        console.log('🔍 OPCIONES DE FILTRO DEL BACKEND:', filterOptions);

        // Verificar qué opciones tiene cada tipo de institución
        if (filterOptions.institutionType === 'university') {
            console.log('🎓 Opciones para universidad:', {
                programs: filterOptions.programs?.length || 0,
                faculties: filterOptions.faculties?.length || 0
            });
        } else if (filterOptions.institutionType === 'school') {
            console.log('🏫 Opciones para colegio:', {
                grades: filterOptions.grades?.length || 0,
                sections: filterOptions.sections?.length || 0
            });
        } else if (filterOptions.institutionType === 'company') {
            console.log('🏢 Opciones para empresa:', {
                departments: filterOptions.departments?.length || 0
            });
        }
        // FIN de los cambios agregados

        // ✅ USAR EXCLUSIVAMENTE el tipo de institución de la respuesta de filtros
        this.institutionType = filterOptions.institutionType;
        this.institutionName = filterOptions.institutionName;
        
        console.log('🎯 Filtros cargados para:', {
            type: this.institutionType,
            name: this.institutionName,
            source: 'filters/options'
        });
        
        // Renderizar filtros según el tipo de institución
        this.renderDynamicFilters(filterOptions, filtersContainer);

        // Cargar valores actuales de los filtros desde URL
        this.loadFilterValuesFromURL();

        // ✅ MARCAR como cargados
        filtersLoaded = true;

        console.log('✅ Filtros dinámicos configurados exitosamente');

    } catch (error) {
        console.error('❌ Error configurando filtros:', error);
        const filtersContainer = document.getElementById('advancedFilters');
        if (filtersContainer) {
            filtersContainer.innerHTML = `
                <div class="error-text">
                    ❌ Error cargando filtros: ${error.message}
                    <br>
                    <button class="btn-small btn-primary" onclick="expertPanel.forceReloadFilters()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

async forceReloadFilters() {
    console.log('🔄 Forzando recarga de filtros...');
    filtersLoaded = false; // Resetear flag
    const filtersContainer = document.getElementById('advancedFilters');
    if (filtersContainer) {
        // Limpiar completamente
        filtersContainer.innerHTML = '';
        // Pequeño delay para asegurar que se limpió
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    await this.setupDynamicFilters();
}

renderDynamicFilters(filterOptions, container) {
    console.log('🎨 Renderizando filtros para:', filterOptions.institutionType);
    
    let filtersHTML = `
        <div class="advanced-filters">
            <!-- Información de institución -->
            <div class="institution-badge">
                🏢 ${filterOptions.institutionName} (${this.getInstitutionTypeLabel(filterOptions.institutionType)})
            </div>
            
            <!-- Búsqueda común -->
            <div class="filter-group">
                <label>Búsqueda:</label>
                <input type="text" id="searchFilter" placeholder="Nombre o email..." 
                       value="${this.getURLParam('search') || ''}">
            </div>
    `;

    // ✅ CORREGIDO: Usar SOLO el tipo de institución de filterOptions
    const institutionType = filterOptions.institutionType;

    // ✅ CORREGIDO: Filtros específicos por tipo de institución
    switch (institutionType) {
        case 'university':
            console.log('🎓 Renderizando filtros para UNIVERSIDAD - Solo Programa');
            
            // ✅ SOLO PROGRAMA (quitamos facultad y semestre)
            if (filterOptions.programs && filterOptions.programs.length > 0) {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Programa:</label>
                        <select id="programFilter">
                            <option value="all">Todos los programas</option>
                            ${filterOptions.programs.map(program => 
                                `<option value="${program._id}" ${this.getURLParam('programId') === program._id ? 'selected' : ''}>
                                    ${program.name}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            } else {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Programa:</label>
                        <select id="programFilter" disabled>
                            <option value="all">No hay programas</option>
                        </select>
                        <small class="filter-help">Crea programas en Gestión Universitaria</small>
                    </div>
                `;
            }
            break;

        case 'school':
            console.log('🏫 Renderizando filtros para COLEGIO - Solo Grado');
            
            // ✅ SOLO GRADO (quitamos sección y jornada)
            if (filterOptions.grades && filterOptions.grades.length > 0) {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Grado:</label>
                        <select id="gradeFilter">
                            <option value="all">Todos los grados</option>
                            ${filterOptions.grades.map(grade => 
                                `<option value="${grade}" ${this.getURLParam('grade') === grade ? 'selected' : ''}>
                                    ${this.getGradeLabel(grade)}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            } else {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Grado:</label>
                        <select id="gradeFilter" disabled>
                            <option value="all">No hay grados</option>
                        </select>
                        <small class="filter-help">Los grados aparecerán cuando crees pacientes</small>
                    </div>
                `;
            }
            break;

        case 'company':
            console.log('🏢 Renderizando filtros para EMPRESA - Solo Departamento');
            
            // ✅ SOLO DEPARTAMENTO para empresas
            if (filterOptions.departments && filterOptions.departments.length > 0) {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Departamento:</label>
                        <select id="departmentFilter">
                            <option value="all">Todos los departamentos</option>
                            ${filterOptions.departments.map(dept => 
                                `<option value="${dept}" ${this.getURLParam('department') === dept ? 'selected' : ''}>
                                    ${dept}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            } else {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Departamento:</label>
                        <select id="departmentFilter" disabled>
                            <option value="all">No hay departamentos</option>
                        </select>
                        <small class="filter-help">Los departamentos aparecerán cuando crees pacientes</small>
                    </div>
                `;
            }
            break;

        case 'health_center':
            console.log('🏥 Renderizando filtros para CENTRO DE SALUD - Solo Departamento');
            
            // ✅ SOLO DEPARTAMENTO para centros de salud
            if (filterOptions.departments && filterOptions.departments.length > 0) {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Departamento Médico:</label>
                        <select id="departmentFilter">
                            <option value="all">Todos los departamentos</option>
                            ${filterOptions.departments.map(dept => 
                                `<option value="${dept}" ${this.getURLParam('department') === dept ? 'selected' : ''}>
                                    ${dept}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            } else {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Departamento Médico:</label>
                        <select id="departmentFilter" disabled>
                            <option value="all">No hay departamentos</option>
                        </select>
                        <small class="filter-help">Los departamentos aparecerán cuando crees pacientes</small>
                    </div>
                `;
            }
            break;

        default:
            console.log('🏛️ Renderizando filtros GENÉRICOS para:', institutionType);
            
            // Filtro genérico de departamento
            if (filterOptions.departments && filterOptions.departments.length > 0) {
                filtersHTML += `
                    <div class="filter-group">
                        <label>Departamento:</label>
                        <select id="departmentFilter">
                            <option value="all">Todos los departamentos</option>
                            ${filterOptions.departments.map(dept => 
                                `<option value="${dept}" ${this.getURLParam('department') === dept ? 'selected' : ''}>
                                    ${dept}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            }
    }

    // Filtros comunes a todos
    filtersHTML += `
            <div class="filter-group">
                <label>Nivel de Riesgo:</label>
                <select id="riskLevelFilter">
                    <option value="all">Todos los niveles</option>
                    ${filterOptions.riskLevels.map(level => 
                        `<option value="${level}" ${this.getURLParam('riskLevel') === level ? 'selected' : ''}>
                            ${this.getRiskLabel(level)}
                        </option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="filter-group">
                <label>Estado:</label>
                <select id="statusFilter">
                    ${filterOptions.statusOptions.map(status => 
                        `<option value="${status}" ${this.getURLParam('status') === status ? 'selected' : ''}>
                            ${status === 'active' ? 'Activos' : 'Inactivos'}
                        </option>`
                    ).join('')}
                    <option value="all" ${this.getURLParam('status') === 'all' ? 'selected' : ''}>Todos</option>
                </select>
            </div>
            
            <div class="filter-buttons">
                <button class="btn-primary btn-small" onclick="expertPanel.applyFilters()">Aplicar Filtros</button>
                <button class="btn-secondary btn-small" onclick="expertPanel.clearFilters()">Limpiar</button>
                <button class="btn-debug btn-small" onclick="expertPanel.debugRenderedFilters()">🔍 Debug</button>
            </div>
        </div>
    `;

    container.innerHTML = filtersHTML;

    // ✅ NUEVO: Debug inmediato después de renderizar
    setTimeout(() => {
        this.debugRenderedFilters();
    }, 100);

    // Agregar event listeners para cambios automáticos
    this.setupFilterEventListeners();
    
    console.log('✅ Filtros renderizados correctamente para:', institutionType);
}

debugRenderedFilters() {
    const filtersContainer = document.getElementById('advancedFilters');
    if (!filtersContainer) {
        console.log('❌ Contenedor de filtros no encontrado');
        return;
    }
    
    console.log('🔍 DEBUG - Contenido actual del contenedor de filtros:');
    console.log('HTML:', filtersContainer.innerHTML);
    
    // Verificar qué filtros están visibles
    const allFilters = filtersContainer.querySelectorAll('.filter-group');
    console.log(`📊 Filtros encontrados: ${allFilters.length}`);
    
    allFilters.forEach((filter, index) => {
        const label = filter.querySelector('label');
        const input = filter.querySelector('input, select');
        console.log(`Filtro ${index + 1}:`, {
            label: label?.textContent,
            inputId: input?.id,
            inputValue: input?.value,
            visible: filter.offsetParent !== null
        });
    });
    
    // Verificar si hay filtros ocultos o duplicados
    const allFilterElements = document.querySelectorAll('.filter-group, .advanced-filters');
    console.log(`🎯 Total de elementos de filtro en la página: ${allFilterElements.length}`);
}

getInstitutionTypeLabel(type) {
    const labels = {
        'university': 'Universidad',
        'school': 'Colegio',
        'company': 'Empresa',
        'health_center': 'Centro de Salud'
    };
    return labels[type] || 'Institución';
}

setupFilterEventListeners() {
    const filterIds = [
        'searchFilter', 'programFilter', 'facultyFilter', 'gradeFilter', 
        'sectionFilter', 'departmentFilter', 'riskLevelFilter', 'statusFilter'
    ];

    filterIds.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', () => {
                this.applyFiltersAutomatically();
            });
        }
    });

    // Input especial para búsqueda con debounce
    const searchInput = document.getElementById('searchFilter');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            this.applyFiltersAutomatically();
        });
    }
}

getURLParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}



// ✅ NUEVO: Renderizar tabla dinámica
renderDynamicPatientsTable() {
    const container = document.getElementById('patientsTableContainer');
    if (!container || !this.institutionConfig) return;

    if (this.patients.length === 0) {
        container.innerHTML = this.getEmptyPatientsState();
        return;
    }

    const columns = this.institutionConfig.tableColumns;

    let tableHTML = `
        <div class="table-responsive">
            <table class="patients-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.patients.map(patient => this.renderDynamicPatientRow(patient, columns)).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// ✅ NUEVO: Renderizar fila dinámica
renderDynamicPatientRow(patient, columns) {
    const riskLevel = this.getPatientRiskLevel(patient);
    const riskClass = this.getRiskClass(riskLevel);
    const lastActivity = patient.stats?.lastActivity ? 
        new Date(patient.stats.lastActivity).toLocaleDateString() : 'Nunca';
    const isActive = patient.isActive !== false;

    let rowHTML = `<tr class="patient-row ${!isActive ? 'inactive' : ''}">`;

    columns.forEach(column => {
        switch (column.key) {
            case 'name':
                rowHTML += `
                    <td class="patient-name">
                        <div class="patient-avatar">
                            ${patient.name.charAt(0).toUpperCase()}
                        </div>
                        ${patient.name}
                    </td>
                `;
                break;
                
            case 'email':
                rowHTML += `<td class="patient-email">${patient.email}</td>`;
                break;
                
            case 'program':
                rowHTML += `
                    <td class="patient-program">
                        ${patient.institutionalPath?.program?.name || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'faculty':
                rowHTML += `
                    <td class="patient-faculty">
                        ${patient.institutionalPath?.faculty?.name || 'No asignada'}
                    </td>
                `;
                break;
                
            case 'grade':
                rowHTML += `
                    <td class="patient-grade">
                        ${patient.institutionalPath?.grade ? this.getGradeLabel(patient.institutionalPath.grade) : 'No asignado'}
                    </td>
                `;
                break;
                
            case 'section':
                rowHTML += `
                    <td class="patient-section">
                        ${patient.institutionalPath?.section || 'No asignada'}
                    </td>
                `;
                break;
                
            case 'department':
                rowHTML += `
                    <td class="patient-department">
                        ${patient.institutionalPath?.department || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'position':
                rowHTML += `
                    <td class="patient-position">
                        ${patient.institutionalPath?.position || patient.institutionalPath?.course || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'specialty':
                rowHTML += `
                    <td class="patient-specialty">
                        ${patient.institutionalPath?.specialty || patient.institutionalPath?.course || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'riskLevel':
                rowHTML += `
                    <td class="patient-risk">
                        <span class="risk-badge ${riskClass}">
                            ${this.getRiskLabel(riskLevel)}
                        </span>
                    </td>
                `;
                break;
                
            case 'lastActivity':
                rowHTML += `<td class="patient-activity">${lastActivity}</td>`;
                break;
                
            case 'status':
                rowHTML += `
                    <td class="patient-status">
                        <span class="status-badge ${isActive ? 'active' : 'inactive'}">
                            ${isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                `;
                break;
                
            case 'actions':
                rowHTML += `
                    <td class="patient-actions">
                        <div class="action-buttons">
                            <button class="btn-analysis btn-sm" 
                                    onclick="expertPanel.showPatientAnalysisModal('${patient._id}')"
                                    title="Análisis Detallado">
                                📊 Analizar
                            </button>
                            <button class="btn-toggle-status btn-sm ${isActive ? 'btn-warning' : 'btn-success'}" 
                                    onclick="expertPanel.togglePatientStatus('${patient._id}')"
                                    title="${isActive ? 'Deshabilitar' : 'Habilitar'}">
                                ${isActive ? '⏸️' : '▶️'}
                            </button>
                        </div>
                    </td>
                `;
                break;
                
            default:
                rowHTML += `<td>--</td>`;
        }
    });

    rowHTML += `</tr>`;
    return rowHTML;
}

    populateInstitutionalForm(institutionType, data) {
    const formContainer = document.getElementById('institutionalFormContainer');
    
    // ✅ NUEVO: Usar el tipo de institución actual si no se proporciona
    const actualInstitutionType = institutionType || this.institutionType;
    
    let formHTML = '';
    
    switch (actualInstitutionType) {
        case 'university':
            formHTML = this.getUniversityForm(data);
            break;
        case 'school':
            formHTML = this.getSchoolForm(data);
            break;
        case 'company':
            formHTML = this.getCompanyForm(data);
            break;
        case 'health_center':
            formHTML = this.getHealthCenterForm(data);
            break;
        default:
            formHTML = this.getDefaultForm();
    }
    
    formContainer.innerHTML = formHTML;
    
    // ✅ NUEVO: Agregar event listeners para dependencias entre campos
    this.setupFormDependencies(actualInstitutionType);
}

debugCurrentState() {
    console.log('🔍 ESTADO ACTUAL DEL PANEL:', {
        institutionType: this.institutionType,
        institutionName: this.institutionName,
        filtersLoaded: filtersLoaded,
        currentSection: this.currentSection,
        userInstitution: this.currentUser?.institution
    });
}

    // ✅ NUEVO MÉTODO: Configurar dependencias entre campos del formulario
    setupFormDependencies(institutionType) {
        if (institutionType === 'university') {
            const facultySelect = document.getElementById('patientFaculty');
            const careerSelect = document.getElementById('patientCareer');
            
            if (facultySelect && careerSelect) {
                facultySelect.addEventListener('change', (e) => {
                    this.filterCareersByFaculty(e.target.value);
                });
            }
        }
    }

    // ✅ NUEVO MÉTODO: Filtrar carreras por facultad
    filterCareersByFaculty(facultyId) {
        const careerSelect = document.getElementById('patientCareer');
        if (!careerSelect) return;
        
        // En una implementación real, harías una llamada a la API
        // Por ahora, mostramos todas las carreras
        console.log('Filtrando carreras por facultad:', facultyId);
    }

    getUniversityForm(data) {
        const programs = data.programs || [];
        const faculties = data.faculties || [];
        
        return `
            <div class="form-row">
                <div class="form-group">
                    <label>Programa *</label>
                    <select id="patientProgram" required>
                        <option value="">Seleccionar programa...</option>
                        ${programs.map(program => 
                            `<option value="${program._id}">${program.name}</option>`
                        ).join('')}
                        ${programs.length === 0 ? 
                            '<option value="general">Programa General</option>' : ''}
                    </select>
                </div>
                <div class="form-group">
                    <label>Facultad *</label>
                    <select id="patientFaculty" required>
                        <option value="">Seleccionar facultad...</option>
                        ${faculties.map(faculty => 
                            `<option value="${faculty._id}">${faculty.name}</option>`
                        ).join('')}
                        ${faculties.length === 0 ? 
                            '<option value="general">Facultad General</option>' : ''}
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Semestre *</label>
                    <select id="patientSemester" required>
                        <option value="">Seleccionar semestre...</option>
                        ${Array.from({length: 10}, (_, i) => 
                            `<option value="${i + 1}">${i + 1}° Semestre</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Curso/Materia</label>
                    <input type="text" id="patientCourse" placeholder="Ej: Matemáticas I">
                </div>
            </div>
        `;
    }

    // En el método getSchoolForm, quitar programa:
    getSchoolForm(data) {
    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
    
    return `
        <div class="form-row">
            <div class="form-group">
                <label>Grado/Curso *</label>
                <select id="patientGrade" required>
                    <option value="">Seleccionar grado...</option>
                    ${grades.map(grade => 
                        `<option value="${grade}">${this.getGradeLabel(grade)}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Sección/Grupo</label>
                <select id="patientSection">
                    <option value="">Seleccionar sección...</option>
                    <option value="A">Sección A</option>
                    <option value="B">Sección B</option>
                    <option value="C">Sección C</option>
                    <option value="D">Sección D</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Periodo Académico *</label>
                <input type="text" id="patientSemester" required 
                       placeholder="Ej: 2024-1" value="${this.getCurrentAcademicPeriod()}">
            </div>
            <div class="form-group">
                <label>Jornada</label>
                <select id="patientSchedule">
                    <option value="">Seleccionar jornada...</option>
                    <option value="morning">Mañana</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noche</option>
                    <option value="full">Jornada Completa</option>
                </select>
            </div>
        </div>
    `;
}

    // ✅ NUEVO MÉTODO: Obtener etiqueta del grado
    getGradeLabel(grade) {
    const grades = {
        '1': '1° Grado',
        '2': '2° Grado', 
        '3': '3° Grado',
        '4': '4° Grado',
        '5': '5° Grado',
        '6': '6° Grado',
        '7': '7° Grado',
        '8': '8° Grado',
        '9': '9° Grado',
        '10': '10° Grado',
        '11': '11° Grado',
        '12': '12° Grado',
        'primero': '1° Grado',
        'segundo': '2° Grado',
        'tercero': '3° Grado',
        'cuarto': '4° Grado',
        'quinto': '5° Grado',
        'sexto': '6° Grado'
    };
    return grades[grade] || `Grado ${grade}`;
}



    // ✅ NUEVO MÉTODO: Obtener período académico actual
    getCurrentAcademicPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const semester = now.getMonth() < 6 ? '1' : '2';
        return `${year}-${semester}`;
    }

    getCompanyForm() {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label>Departamento *</label>
                    <input type="text" id="patientDepartment" required placeholder="Ej: Recursos Humanos">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Puesto/Cargo</label>
                    <input type="text" id="patientCourse" placeholder="Ej: Analista Jr.">
                </div>
            </div>
        `;
    }

    getHealthCenterForm() {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label>Departamento/Área</label>
                    <input type="text" id="patientDepartment" placeholder="Ej: Psiquiatría">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Especialidad</label>
                    <input type="text" id="patientCourse" placeholder="Ej: Psicología Clínica">
                </div>
            </div>
        `;
    }

    getDefaultForm() {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label>Departamento/Área</label>
                    <input type="text" id="patientDepartment" placeholder="Ej: Departamento">
                </div>
                <div class="form-group">
                    <label>Curso/Cargo</label>
                    <input type="text" id="patientCourse" placeholder="Ej: Curso o cargo">
                </div>
            </div>
        `;
    }

    async handleCreatePatient(e) {
    e.preventDefault();
    
    const institutionType = this.institutionType;
    let formData = {
        name: document.getElementById('patientName').value,
        email: document.getElementById('patientEmail').value,
        password: document.getElementById('patientPassword').value,
        age: document.getElementById('patientAge').value || undefined,
        medicalHistory: document.getElementById('patientMedicalHistory').value || undefined,
        emergencyContact: document.getElementById('patientEmergencyContact').value || undefined
    };

    // ✅ CORREGIDO: Agregar campos específicos según el tipo de institución
    switch (institutionType) {
        case 'university':
            formData.programId = document.getElementById('patientProgram').value;
            formData.facultyId = document.getElementById('patientFaculty').value;
            formData.semester = document.getElementById('patientSemester').value;
            formData.course = document.getElementById('patientCourse').value || undefined;
            break;
            
        case 'school':
    formData.grade = document.getElementById('patientGrade').value;
    formData.section = document.getElementById('patientSection').value || undefined;
    formData.schedule = document.getElementById('patientSchedule').value || undefined;
    formData.semester = document.getElementById('patientSemester').value;
    
    console.log('🏫 Datos para colegio:', {
        grade: formData.grade,
        section: formData.section,
        schedule: formData.schedule,
        semester: formData.semester
    });
    break;
            
        case 'company':
            formData.department = document.getElementById('patientDepartment').value;
            formData.position = document.getElementById('patientCourse').value || undefined;
            break;
            
        case 'health_center':
            formData.department = document.getElementById('patientDepartment').value || undefined;
            formData.course = document.getElementById('patientCourse').value || undefined;
            break;
            
        default:
            formData.department = document.getElementById('patientDepartment').value || undefined;
            formData.course = document.getElementById('patientCourse').value || undefined;
    }

   // console.log('📤 Enviando datos del paciente:', formData);

    try {
        Utils.showNotification('Creando paciente...', 'info');
        
        const response = await this.apiService.createPatient(formData);

        if (response.success) {
            Utils.showNotification('Paciente creado exitosamente', 'success');
            this.hideAllModals();
            document.getElementById('createPatientForm').reset();
            
            // ✅ CORREGIDO: Recargar la lista de pacientes inmediatamente
            // Si estamos en la sección de pacientes, recargar
            if (this.currentSection === 'patients') {
                await this.loadPatients();
            }
            // Si estamos en dashboard, recargar estadísticas
            if (this.currentSection === 'dashboard') {
                await this.loadDashboardData();
            }
            
            // ✅ CORREGIDO: También recargar pacientes para mantener sincronizado
            await this.loadPatients();
            
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error creando paciente:', error);
        Utils.showNotification('Error creando paciente: ' + error.message, 'error');
    }
}

async debugSchoolPatients() {
    try {
        const response = await this.apiService.getMyPatients();
        console.log('🏫 PACIENTES EXISTENTES (DEBUG):', response.data.patients);
        
        const schoolPatients = response.data.patients.filter(patient => 
            patient.institutionalPath?.grade || patient.institutionalPath?.section
        );
        
        console.log('📚 PACIENTES CON DATOS DE COLEGIO:', schoolPatients.map(p => ({
            name: p.name,
            grade: p.institutionalPath?.grade,
            section: p.institutionalPath?.section,
            semester: p.institutionalPath?.semester
        })));
    } catch (error) {
        console.error('Error en debug:', error);
    }
}

    viewPatientDetail(patientId) {
    const patient = this.patients.find(p => p._id === patientId);
    if (!patient) return;

    const modalContent = document.getElementById('patientDetailContent');
    modalContent.innerHTML = `
        <div class="patient-detail">
            <div class="detail-header">
                <h3>${patient.name}</h3>
                <span class="risk-badge ${this.getPatientRiskLevel(patient)}">
                    ${this.getRiskLabel(this.getPatientRiskLevel(patient))}
                </span>
            </div>
            
            <div class="detail-info">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${patient.email}</span>
                    </div>
                    <div class="info-item">
                        <label>Edad:</label>
                        <span>${patient.age || 'No especificada'}</span>
                    </div>
                    <div class="info-item">
                        <label>Programa:</label>
                        <span>${patient.institutionalPath?.program?.name || 'No asignado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Facultad:</label>
                        <span>${patient.institutionalPath?.faculty?.name || 'No asignada'}</span>
                    </div>
                    <!-- QUITAMOS CARRERA -->
                    <div class="info-item">
                        <label>Semestre:</label>
                        <span>${patient.institutionalPath?.semester || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <label>Curso:</label>
                        <span>${patient.institutionalPath?.course || 'No especificado'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-stats">
                <h4>Estadísticas de Actividad</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${patient.stats?.totalChats || 0}</div>
                        <div class="stat-label">Total Conversaciones</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${patient.stats?.highRiskChats || 0}</div>
                        <div class="stat-label">Conversaciones Alto Riesgo</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.getDaysSinceLastActivity(patient)}</div>
                        <div class="stat-label">Días sin Actividad</div>
                    </div>
                </div>
            </div>
            
            ${patient.patientProfile?.medicalHistory ? `
            <div class="detail-medical">
                <h4>Historial Médico</h4>
                <p>${patient.patientProfile.medicalHistory}</p>
            </div>
            ` : ''}
            
            ${patient.patientProfile?.emergencyContact ? `
            <div class="detail-emergency">
                <h4>Contacto de Emergencia</h4>
                <p>${patient.patientProfile.emergencyContact}</p>
            </div>
            ` : ''}
            
            <!-- QUITAMOS BOTONES DE RECOMENDACIONES Y DEJAMOS SOLO ANÁLISIS -->
            <div class="detail-actions">
                <button class="btn-primary" onclick="expertPanel.showPatientAnalysisModal('${patient._id}')">
                    📊 Ver Análisis Completo
                </button>
            </div>
        </div>
    `;

    document.getElementById('patientDetailModal').classList.remove('hidden');
}

    async viewPatientAnalysis(patientId) {
    try {
        const response = await this.apiService.getPatientAnalysis(patientId);

        if (response.success) {
            this.showPatientAnalysisModal(response.data.analysis);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error viendo análisis:', error);
        Utils.showNotification('Error cargando el análisis: ' + error.message, 'error');
    }
}

showPatientAnalysisModal(analysisData) {
    const modalContent = document.getElementById('patientDetailContent');
    
    modalContent.innerHTML = `
        <div class="patient-analysis">
            <div class="detail-header">
                <h3>Análisis Detallado - ${analysisData.patient.name}</h3>
                <span class="risk-badge ${analysisData.patient.patientProfile?.riskLevel || 'minimo'}">
                    ${this.getRiskLabel(analysisData.patient.patientProfile?.riskLevel || 'minimo')}
                </span>
            </div>
            
            <div class="analysis-content">
                <div class="analysis-stats">
                    <h4>📊 Estadísticas Generales</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${analysisData.generalStats.totalChats || 0}</div>
                            <div class="stat-label">Total Conversaciones</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysisData.generalStats.highRiskChats || 0}</div>
                            <div class="stat-label">Alto Riesgo</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${analysisData.generalStats.mediumRiskChats || 0}</div>
                            <div class="stat-label">Riesgo Moderado</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${Math.round(analysisData.generalStats.avgRiskScore || 0)}%</div>
                            <div class="stat-label">Riesgo Promedio</div>
                        </div>
                    </div>
                </div>
                
                ${analysisData.frequentKeywords && analysisData.frequentKeywords.length > 0 ? `
                <div class="analysis-keywords">
                    <h4>🔤 Palabras Clave Más Frecuentes</h4>
                    <div class="keywords-grid">
                        ${analysisData.frequentKeywords.slice(0, 10).map(keyword => `
                            <div class="keyword-stat">
                                <span class="keyword-text">${keyword._id}</span>
                                <span class="keyword-count">${keyword.count} veces</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '<div class="no-data">No se detectaron palabras clave frecuentes</div>'}
                
                ${analysisData.recentChats && analysisData.recentChats.length > 0 ? `
                <div class="recent-chats">
                    <h4>💬 Conversaciones Recientes</h4>
                    <div class="chats-mini-list">
                        ${analysisData.recentChats.slice(0, 5).map(chat => `
                            <div class="chat-mini-item risk-${chat.riskLevel || 'minimo'}">
                                <div class="chat-mini-preview">
                                    ${chat.messages && chat.messages.length > 0 ? 
                                        chat.messages[0].content.substring(0, 80) + '...' : 
                                        'Sin mensajes'
                                    }
                                </div>
                                <div class="chat-mini-meta">
                                    <span class="risk ${chat.riskLevel || 'minimo'}">
                                        ${this.getRiskLabel(chat.riskLevel || 'minimo')}
                                    </span>
                                    <span class="date">
                                        ${new Date(chat.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('patientDetailModal').classList.remove('hidden');
}

offerSampleDataCreation(patient, analysisData) {
    const modalContent = document.getElementById('patientDetailContent');
    
    modalContent.innerHTML = `
        <div class="no-data-analysis">
            <div class="no-data-icon">📊</div>
            <h3>Sin Datos de Análisis</h3>
            <p>El paciente <strong>${patient.name}</strong> no tiene conversaciones registradas.</p>
            
            <div class="no-data-actions">
                <button class="btn-primary" onclick="expertPanel.hideAllModals()">
                    Cerrar
                </button>
            </div>
        </div>
    `;
}

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    async handleLogout() {
        try {
            await this.apiService.logout();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error en logout:', error);
            window.location.href = '../index.html';
        }
    }

    async refreshData() {
        Utils.showNotification('Actualizando datos...', 'info');
        await this.loadSectionData(this.currentSection);
        Utils.showNotification('Datos actualizados', 'success');
    }

    async generateReport() {
        Utils.showNotification('Generando reporte...', 'info');
        // Implementar generación de reportes
    }

    async exportReport() {
        Utils.showNotification('Exportando reporte...', 'info');
        // Implementar exportación
    }

    filterPatients(searchTerm) {
        const filteredPatients = this.patients.filter(patient => 
            patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredPatients(filteredPatients);
    }

    renderFilteredPatients(patients) {
        const container = document.getElementById('patientsGrid');
        
        if (patients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No se encontraron pacientes</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }

        // Reutilizar la misma función de renderizado
        this.patients = patients;
        this.renderPatients();
    }

    filterPatientsByRisk(riskLevel) {
        if (!riskLevel) {
            this.renderPatients();
            return;
        }

        const filteredPatients = this.patients.filter(patient => 
            this.getPatientRiskLevel(patient) === riskLevel
        );
        this.renderFilteredPatients(filteredPatients);
    }

    async loadReportsData() {
        // Cargar datos para reportes
        Utils.showNotification('Cargando datos para reportes...', 'info');
    }

    // ✅ NUEVO MÉTODO: Obtener clase CSS para puntaje de riesgo
    getRiskScoreClass(score) {
        if (score >= 70) return 'high-risk';
        if (score >= 40) return 'medium-risk';
        return 'low-risk';
    }

    // ==================== GESTIÓN UNIVERSITARIA ====================

    // ✅ NUEVO: Mostrar tab de gestión universitaria
    showUniversityTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.university-tabs .tab-pane').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.university-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar tab seleccionado
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`.university-tabs [data-tab="${tabName}"]`).classList.add('active');

        // Cargar datos del tab
        if (tabName === 'programs') {
            this.loadPrograms();
        } else if (tabName === 'faculties') {
            this.loadFaculties();
        }
    }

    // ✅ NUEVO: Cargar programas
    async loadPrograms() {
        try {
            const response = await this.apiService.getMyPrograms();
            
            if (response.success) {
                this.programs = response.data.programs || [];
                this.renderPrograms();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando programas:', error);
            Utils.showNotification('Error cargando programas: ' + error.message, 'error');
        }
    }

    // ✅ NUEVO: Renderizar programas
    renderPrograms() {
        const container = document.getElementById('programsGrid');
        
        if (this.programs.length === 0) {
            container.innerHTML = `
                <div class="empty-management">
                    <div class="empty-management-icon">📚</div>
                    <h3>No hay programas creados</h3>
                    <p>Comienza creando tu primer programa académico</p>
                    <button class="btn-primary" onclick="expertPanel.showProgramModal()">
                        + Crear Primer Programa
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.programs.map(program => `
            <div class="item-card">
                <div class="item-header">
                    <h3 class="item-title">${program.name}</h3>
                    <div class="item-actions">
                        <button class="btn-edit btn-sm" onclick="expertPanel.editProgram('${program._id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete btn-sm" onclick="expertPanel.confirmDelete('program', '${program._id}', '${program.name}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
                
                <div class="item-description">
                    ${program.description || 'Sin descripción'}
                </div>
                
                <div class="item-meta">
                    <span>Creado: ${new Date(program.createdAt).toLocaleDateString()}</span>
                    <span class="patient-count">0 pacientes</span>
                </div>
            </div>
        `).join('');
    }

    // ✅ NUEVO: Cargar facultades
    async loadFaculties() {
        try {
            const response = await this.apiService.getMyFaculties();
            
            if (response.success) {
                this.faculties = response.data.faculties || [];
                this.renderFaculties();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error cargando facultades:', error);
            Utils.showNotification('Error cargando facultades: ' + error.message, 'error');
        }
    }

    // ✅ NUEVO: Renderizar facultades
    renderFaculties() {
        const container = document.getElementById('facultiesGrid');
        
        if (this.faculties.length === 0) {
            container.innerHTML = `
                <div class="empty-management">
                    <div class="empty-management-icon">🏛️</div>
                    <h3>No hay facultades creadas</h3>
                    <p>Comienza creando tu primera facultad</p>
                    <button class="btn-primary" onclick="expertPanel.showFacultyModal()">
                        + Crear Primera Facultad
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.faculties.map(faculty => `
            <div class="item-card">
                <div class="item-header">
                    <h3 class="item-title">${faculty.name}</h3>
                    <div class="item-actions">
                        <button class="btn-edit btn-sm" onclick="expertPanel.editFaculty('${faculty._id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete btn-sm" onclick="expertPanel.confirmDelete('faculty', '${faculty._id}', '${faculty.name}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
                
                <div class="item-description">
                    ${faculty.description || 'Sin descripción'}
                </div>
                
                <div class="item-meta">
                    <span>Creado: ${new Date(faculty.createdAt).toLocaleDateString()}</span>
                    <span class="patient-count">0 pacientes</span>
                </div>
            </div>
        `).join('');
    }

    // ✅ NUEVO: Mostrar modal de programa
    showProgramModal(program = null) {
        const modal = document.getElementById('programModal');
        const title = document.getElementById('programModalTitle');
        const submitBtn = document.getElementById('programSubmitBtn');
        
        if (program) {
            title.textContent = 'Editar Programa';
            submitBtn.textContent = 'Actualizar Programa';
            document.getElementById('programId').value = program._id;
            document.getElementById('programName').value = program.name;
            document.getElementById('programDescription').value = program.description || '';
        } else {
            title.textContent = 'Nuevo Programa';
            submitBtn.textContent = 'Crear Programa';
            document.getElementById('programForm').reset();
            document.getElementById('programId').value = '';
        }
        
        modal.classList.remove('hidden');
    }

    // ✅ NUEVO: Mostrar modal de facultad
    showFacultyModal(faculty = null) {
        const modal = document.getElementById('facultyModal');
        const title = document.getElementById('facultyModalTitle');
        const submitBtn = document.getElementById('facultySubmitBtn');
        
        if (faculty) {
            title.textContent = 'Editar Facultad';
            submitBtn.textContent = 'Actualizar Facultad';
            document.getElementById('facultyId').value = faculty._id;
            document.getElementById('facultyName').value = faculty.name;
            document.getElementById('facultyDescription').value = faculty.description || '';
        } else {
            title.textContent = 'Nueva Facultad';
            submitBtn.textContent = 'Crear Facultad';
            document.getElementById('facultyForm').reset();
            document.getElementById('facultyId').value = '';
        }
        
        modal.classList.remove('hidden');
    }

    // ✅ NUEVO: Manejar envío de programa
    async handleProgramSubmit(e) {
        e.preventDefault();
        
        const programId = document.getElementById('programId').value;
        const formData = {
            name: document.getElementById('programName').value,
            description: document.getElementById('programDescription').value
        };

        try {
            let response;
            
            if (programId) {
                response = await this.apiService.updateProgram(programId, formData);
            } else {
                response = await this.apiService.createProgram(formData);
            }

            if (response.success) {
                Utils.showNotification(
                    programId ? 'Programa actualizado exitosamente' : 'Programa creado exitosamente', 
                    'success'
                );
                this.hideAllModals();
                await this.loadPrograms();
                
                // Recargar estructura institucional para formularios
                if (this.currentUser?.institution) {
                    await this.loadInstitutionalStructure();
                }
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error guardando programa:', error);
            Utils.showNotification('Error guardando programa: ' + error.message, 'error');
        }
    }

    // ✅ NUEVO: Manejar envío de facultad
    async handleFacultySubmit(e) {
        e.preventDefault();
        
        const facultyId = document.getElementById('facultyId').value;
        const formData = {
            name: document.getElementById('facultyName').value,
            description: document.getElementById('facultyDescription').value
        };

        try {
            let response;
            
            if (facultyId) {
                response = await this.apiService.updateFaculty(facultyId, formData);
            } else {
                response = await this.apiService.createFaculty(formData);
            }

            if (response.success) {
                Utils.showNotification(
                    facultyId ? 'Facultad actualizada exitosamente' : 'Facultad creada exitosamente', 
                    'success'
                );
                this.hideAllModals();
                await this.loadFaculties();
                
                // Recargar estructura institucional para formularios
                if (this.currentUser?.institution) {
                    await this.loadInstitutionalStructure();
                }
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error guardando facultad:', error);
            Utils.showNotification('Error guardando facultad: ' + error.message, 'error');
        }
    }

    // ✅ NUEVO: Editar programa
    editProgram(programId) {
        const program = this.programs.find(p => p._id === programId);
        if (program) {
            this.showProgramModal(program);
        }
    }

    // ✅ NUEVO: Editar facultad
    editFaculty(facultyId) {
        const faculty = this.faculties.find(f => f._id === facultyId);
        if (faculty) {
            this.showFacultyModal(faculty);
        }
    }

    // ✅ NUEVO: Confirmar eliminación
    confirmDelete(type, id, name) {
        this.currentEditId = id;
        this.currentEditType = type;
        
        const modal = document.getElementById('confirmDeleteModal');
        const message = document.getElementById('confirmDeleteMessage');
        
        message.textContent = `¿Estás seguro de que quieres eliminar ${type === 'program' ? 'el programa' : 'la facultad'} "${name}"? Esta acción no se puede deshacer.`;
        
        modal.classList.remove('hidden');
    }

    // ✅ NUEVO: Manejar eliminación confirmada
    async handleConfirmDelete() {
    if (!this.currentEditId || !this.currentEditType) return;

    try {
        let response;
        
        if (this.currentEditType === 'program') {
            response = await this.apiService.deleteProgram(this.currentEditId);
        } else if (this.currentEditType === 'faculty') {
            response = await this.apiService.deleteFaculty(this.currentEditId);
        } else if (this.currentEditType === 'keyword') { // ✅ NUEVO
            response = await this.apiService.deleteKeyword(this.currentEditId);
        } else if (this.currentEditType === 'document') { // ✅ NUEVO
            response = await this.apiService.deleteDocument(this.currentEditId);
        }

        if (response.success) {
            let message = '';
            if (this.currentEditType === 'program') message = 'Programa eliminado exitosamente';
            else if (this.currentEditType === 'faculty') message = 'Facultad eliminada exitosamente';
            else if (this.currentEditType === 'keyword') message = 'Palabra clave eliminada exitosamente';
            else if (this.currentEditType === 'document') message = 'Documento eliminado exitosamente';
            
            Utils.showNotification(message, 'success');
            this.hideAllModals();
            
            // Recargar la lista correspondiente
            if (this.currentEditType === 'program') {
                await this.loadPrograms();
            } else if (this.currentEditType === 'faculty') {
                await this.loadFaculties();
            } else if (this.currentEditType === 'keyword') { // ✅ NUEVO
                await this.loadKeywords();
            } else if (this.currentEditType === 'document') { // ✅ NUEVO
                await this.loadDocuments();
            }
            
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error eliminando:', error);
        Utils.showNotification('Error eliminando: ' + error.message, 'error');
    } finally {
        this.currentEditId = null;
        this.currentEditType = null;
    }
}


    // ✅ NUEVO: Filtrar programas
    filterPrograms(searchTerm) {
        const filteredPrograms = this.programs.filter(program => 
            program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderFilteredPrograms(filteredPrograms);
    }

    // ✅ NUEVO: Renderizar programas filtrados
    renderFilteredPrograms(programs) {
        const container = document.getElementById('programsGrid');
        
        if (programs.length === 0) {
            container.innerHTML = `
                <div class="empty-management">
                    <div class="empty-management-icon">🔍</div>
                    <h3>No se encontraron programas</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = programs.map(program => `
            <div class="item-card">
                <div class="item-header">
                    <h3 class="item-title">${program.name}</h3>
                    <div class="item-actions">
                        <button class="btn-edit btn-sm" onclick="expertPanel.editProgram('${program._id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete btn-sm" onclick="expertPanel.confirmDelete('program', '${program._id}', '${program.name}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
                
                <div class="item-description">
                    ${program.description || 'Sin descripción'}
                </div>
                
                <div class="item-meta">
                    <span>Creado: ${new Date(program.createdAt).toLocaleDateString()}</span>
                    <span class="patient-count">0 pacientes</span>
                </div>
            </div>
        `).join('');
    }

    // ✅ NUEVO: Filtrar facultades
    filterFaculties(searchTerm) {
        const filteredFaculties = this.faculties.filter(faculty => 
            faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (faculty.description && faculty.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        this.renderFilteredFaculties(filteredFaculties);
    }

    // ✅ NUEVO: Renderizar facultades filtradas
    renderFilteredFaculties(faculties) {
        const container = document.getElementById('facultiesGrid');
        
        if (faculties.length === 0) {
            container.innerHTML = `
                <div class="empty-management">
                    <div class="empty-management-icon">🔍</div>
                    <h3>No se encontraron facultades</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = faculties.map(faculty => `
            <div class="item-card">
                <div class="item-header">
                    <h3 class="item-title">${faculty.name}</h3>
                    <div class="item-actions">
                        <button class="btn-edit btn-sm" onclick="expertPanel.editFaculty('${faculty._id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete btn-sm" onclick="expertPanel.confirmDelete('faculty', '${faculty._id}', '${faculty.name}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
                
                <div class="item-description">
                    ${faculty.description || 'Sin descripción'}
                </div>
                
                <div class="item-meta">
                    <span>Creado: ${new Date(faculty.createdAt).toLocaleDateString()}</span>
                    <span class="patient-count">0 pacientes</span>
                </div>
            </div>
        `).join('');
    }

    // ✅ NUEVO: Inicializar gestión de palabras clave
initKeywordsManagement() {
    this.keywords = [];
    this.filteredKeywords = [];
    this.currentSymptomFilter = 'all';
    this.currentEditKeyword = null;
}

// ✅ NUEVO: Configurar event listeners para palabras clave
setupKeywordsManagementListeners() {
    
    // Botones - Con verificación de existencia
    this.setupButton('addKeywordBtn', () => this.showKeywordModal());
    
    // Formularios - Con verificación de existencia
    this.setupForm('keywordForm', (e) => this.handleKeywordSubmit(e));
    
    // Filtros por síntoma
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const symptom = e.target.getAttribute('data-symptom');
            this.filterKeywordsBySymptom(symptom);
        });
    });
    
    // Búsqueda
    this.setupInput('keywordSearch', 'input', (e) => this.searchKeywords(e.target.value));
}

// ✅ NUEVO: Mostrar modal de palabra clave
showKeywordModal(keyword = null) {
    const modal = document.getElementById('keywordModal');
    const title = document.getElementById('keywordModalTitle');
    const submitBtn = document.getElementById('keywordSubmitBtn');
    
    if (keyword) {
        title.textContent = 'Editar Palabra Clave';
        submitBtn.textContent = 'Actualizar Palabra Clave';
        document.getElementById('keywordId').value = keyword._id;
        document.getElementById('keywordSymptom').value = keyword.symptom;
        document.getElementById('keywordText').value = keyword.keyword;
        
        // Establecer el peso correcto
        document.querySelectorAll('input[name="weight"]').forEach(radio => {
            if (parseInt(radio.value) === keyword.weight) {
                radio.checked = true;
            }
        });
    } else {
        title.textContent = 'Nueva Palabra Clave';
        submitBtn.textContent = 'Guardar Palabra Clave';
        document.getElementById('keywordForm').reset();
        document.getElementById('keywordId').value = '';
        
        // Establecer peso por defecto a 3
        document.querySelector('input[name="weight"][value="3"]').checked = true;
    }
    
    modal.classList.remove('hidden');
}



// ✅ NUEVO: Manejar envío de palabra clave
async handleKeywordSubmit(e) {
    e.preventDefault();
    
    const keywordId = document.getElementById('keywordId').value;
    const formData = {
        symptom: document.getElementById('keywordSymptom').value,
        keyword: document.getElementById('keywordText').value,
        weight: parseInt(document.querySelector('input[name="weight"]:checked').value)
    };

    // Validaciones
    if (!formData.symptom) {
        Utils.showNotification('Por favor selecciona un síntoma', 'error');
        return;
    }
    
    if (!formData.keyword.trim()) {
        Utils.showNotification('Por favor ingresa una palabra clave', 'error');
        return;
    }

    try {
        let response;
        
        if (keywordId) {
            response = await this.apiService.updateKeyword(keywordId, formData);
        } else {
            response = await this.apiService.addKeyword(formData);
        }

        if (response.success) {
            Utils.showNotification(
                keywordId ? 'Palabra clave actualizada exitosamente' : 'Palabra clave agregada exitosamente', 
                'success'
            );
            this.hideAllModals();
            await this.loadKeywords();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error guardando palabra clave:', error);
        Utils.showNotification('Error guardando palabra clave: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Cargar palabras clave
async loadKeywords() {
    try {
        const response = await this.apiService.getMyKeywords();
        
        if (response.success) {
            this.keywords = this.flattenKeywords(response.data.keywords);
            this.filteredKeywords = [...this.keywords];
            this.renderKeywords();
            this.updateKeywordsStats();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cargando palabras clave:', error);
        Utils.showNotification('Error cargando palabras clave: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Convertir keywords agrupadas a array plano
flattenKeywords(groupedKeywords) {
    const flattened = [];
    for (const symptom in groupedKeywords) {
        flattened.push(...groupedKeywords[symptom]);
    }
    return flattened;
}

// ✅ NUEVO: Renderizar palabras clave
renderKeywords() {
    const container = document.getElementById('keywordsTableBody');
    const emptyState = document.getElementById('keywordsEmptyState');
    
    if (this.filteredKeywords.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = this.filteredKeywords.map(keyword => `
        <tr>
            <td class="keyword-cell">${keyword.keyword}</td>
            <td class="symptom-cell">
                <span class="symptom-badge symptom-${keyword.symptom}">
                    ${this.getSymptomLabel(keyword.symptom)}
                </span>
            </td>
            <td class="weight-cell">
                <span class="weight-display weight-${keyword.weight}">
                    ${keyword.weight}
                </span>
            </td>
            <td class="date-cell">
                ${new Date(keyword.createdAt).toLocaleDateString()}
            </td>
            <td class="actions-cell">
                <button class="btn-edit btn-sm" onclick="expertPanel.editKeyword('${keyword._id}')">
                    ✏️ Editar
                </button>
                <button class="btn-delete btn-sm" onclick="expertPanel.confirmDeleteKeyword('${keyword._id}', '${keyword.keyword}')">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// ✅ NUEVO: Obtener etiqueta del síntoma
getSymptomLabel(symptom) {
    const labels = {
        'ansiedad': 'Ansiedad',
        'depresion': 'Depresión', 
        'insomnio': 'Insomnio',
        'estres': 'Estrés',
        'panico': 'Ataque de Pánico',
        'otros': 'Otros'
    };
    return labels[symptom] || symptom;
}

// ✅ NUEVO: Filtrar palabras clave por síntoma
filterKeywordsBySymptom(symptom) {
    this.currentSymptomFilter = symptom;
    
    // Actualizar tabs activos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-symptom="${symptom}"]`).classList.add('active');
    
    if (symptom === 'all') {
        this.filteredKeywords = [...this.keywords];
    } else {
        this.filteredKeywords = this.keywords.filter(k => k.symptom === symptom);
    }
    
    this.renderKeywords();
    this.updateKeywordsStats();
}

// ✅ NUEVO: Buscar palabras clave
searchKeywords(searchTerm) {
    if (!searchTerm) {
        this.filteredKeywords = this.currentSymptomFilter === 'all' ? 
            [...this.keywords] : 
            this.keywords.filter(k => k.symptom === this.currentSymptomFilter);
    } else {
        this.filteredKeywords = this.keywords.filter(keyword =>
            keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
            this.getSymptomLabel(keyword.symptom).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    this.renderKeywords();
}

// ✅ NUEVO: Actualizar estadísticas de palabras clave
updateKeywordsStats() {
    const total = this.filteredKeywords.length;
    const highWeight = this.filteredKeywords.filter(k => k.weight >= 4).length;
    const mediumWeight = this.filteredKeywords.filter(k => k.weight === 3).length;
    const lowWeight = this.filteredKeywords.filter(k => k.weight <= 2).length;
    
    document.getElementById('totalKeywords').textContent = total;
    document.getElementById('highWeightKeywords').textContent = highWeight;
    document.getElementById('mediumWeightKeywords').textContent = mediumWeight;
    document.getElementById('lowWeightKeywords').textContent = lowWeight;
}

// ✅ NUEVO: Editar palabra clave
editKeyword(keywordId) {
    const keyword = this.keywords.find(k => k._id === keywordId);
    if (keyword) {
        this.showKeywordModal(keyword);
    }
}

// ✅ NUEVO: Confirmar eliminación de palabra clave
confirmDeleteKeyword(keywordId, keywordText) {
    this.currentEditId = keywordId;
    this.currentEditType = 'keyword';
    
    const modal = document.getElementById('confirmDeleteModal');
    const message = document.getElementById('confirmDeleteMessage');
    
    message.textContent = `¿Estás seguro de que quieres eliminar la palabra clave "${keywordText}"? Esta acción no se puede deshacer.`;
    
    modal.classList.remove('hidden');
}

// ==================== GESTIÓN DE DOCUMENTOS ====================

// ✅ NUEVO: Inicializar gestión de documentos
initDocumentsManagement() {
    this.documents = [];
    this.filteredDocuments = [];
    this.currentCategoryFilter = 'all';
}

// ✅ NUEVO: Configurar event listeners para documentos
setupDocumentsManagementListeners() {
    
    // Botones - Con verificación de existencia
    this.setupButton('uploadDocumentBtn', () => this.showDocumentModal());
    
    // Formularios - Con verificación de existencia
    this.setupForm('documentForm', (e) => this.handleDocumentSubmit(e));
    
    // Filtros por categoría
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', (e) => {
            const category = e.target.getAttribute('data-category');
            this.filterDocumentsByCategory(category);
        });
    });
    
    // Búsqueda
    this.setupInput('documentSearch', 'input', (e) => this.searchDocuments(e.target.value));
    
    // Manejar selección de archivo
    this.setupInput('documentFile', 'change', (e) => this.handleFileSelect(e));
}

// ✅ NUEVO: Mostrar modal de documento
showDocumentModal() {
    document.getElementById('documentModal').classList.remove('hidden');
}

// ✅ NUEVO: Manejar selección de archivo
handleFileSelect(e) {
    const file = e.target.files[0];
    const fileInfo = document.getElementById('fileInfo');
    
    if (file) {
        const fileSize = (file.size / (1024 * 1024)).toFixed(2); // MB
        fileInfo.innerHTML = `
            <div class="file-selected">
                <strong>${file.name}</strong>
                <span>(${fileSize} MB)</span>
            </div>
        `;
    } else {
        fileInfo.innerHTML = '';
    }
}

// ✅ NUEVO: Manejar envío de documento (versión temporal)
async handleDocumentSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('documentTitle').value,
        description: document.getElementById('documentDescription').value,
        category: document.getElementById('documentCategory').value
    };

    // Validaciones
    if (!formData.title.trim()) {
        Utils.showNotification('Por favor ingresa un título', 'error');
        return;
    }
    
    if (!formData.description.trim()) {
        Utils.showNotification('Por favor ingresa una descripción', 'error');
        return;
    }
    
    if (!formData.category) {
        Utils.showNotification('Por favor selecciona una categoría', 'error');
        return;
    }

    // TEMPORAL: Por ahora solo guardamos metadata sin archivo
    try {
        const response = await this.apiService.uploadDocument(formData);

        if (response.success) {
            Utils.showNotification('Documento creado exitosamente', 'success');
            this.hideAllModals();
            document.getElementById('documentForm').reset();
            document.getElementById('fileInfo').innerHTML = '';
            await this.loadDocuments();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error subiendo documento:', error);
        Utils.showNotification('Error subiendo documento: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Cargar documentos
async loadDocuments() {
    try {
        const response = await this.apiService.getMyDocuments();
        
        if (response.success) {
            this.documents = response.data.documents || [];
            this.filteredDocuments = [...this.documents];
            this.renderDocuments();
            this.updateDocumentsStats();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cargando documentos:', error);
        Utils.showNotification('Error cargando documentos: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Renderizar documentos
renderDocuments() {
    const container = document.getElementById('documentsTableBody');
    const emptyState = document.getElementById('documentsEmptyState');
    
    if (this.filteredDocuments.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = this.filteredDocuments.map(doc => `
        <tr>
            <td class="document-icon-cell">
                <div class="document-icon">
                    ${this.getDocumentIcon(doc.fileType)}
                </div>
            </td>
            <td class="document-title-cell">${doc.title}</td>
            <td class="document-description-cell">
                <p>${doc.description}</p>
            </td>
            <td class="document-category-cell">
                <span class="category-badge category-${doc.category}">
                    ${this.getCategoryLabel(doc.category)}
                </span>
            </td>
            <td class="document-meta-cell">
                <div>📄 ${doc.fileName}</div>
                <div>📊 ${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</div>
                <div>⬇️ ${doc.downloadCount || 0} descargas</div>
            </td>
            <td class="document-actions-cell">
                <button class="btn-primary btn-sm" onclick="expertPanel.downloadDocument('${doc._id}')">
                    📥 Descargar
                </button>
                <button class="btn-edit btn-sm" onclick="expertPanel.viewDocumentDetails('${doc._id}')">
                    👁️ Ver
                </button>
                <button class="btn-delete btn-sm" onclick="expertPanel.confirmDeleteDocument('${doc._id}', '${doc.title}')">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// ✅ NUEVO: Obtener icono según tipo de archivo
getDocumentIcon(fileType) {
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📘';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📙';
    if (fileType.includes('text')) return '📓';
    return '📄';
}

// ✅ NUEVO: Obtener etiqueta de categoría
getCategoryLabel(category) {
    const labels = {
        'protocolo': 'Protocolo',
        'guia': 'Guía',
        'recurso': 'Recurso', 
        'formulario': 'Formulario',
        'otros': 'Otros'
    };
    return labels[category] || category;
}

// ✅ NUEVO: Filtrar documentos por categoría
filterDocumentsByCategory(category) {
    this.currentCategoryFilter = category;
    
    // Actualizar filtros activos
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    if (category === 'all') {
        this.filteredDocuments = [...this.documents];
    } else {
        this.filteredDocuments = this.documents.filter(d => d.category === category);
    }
    
    this.renderDocuments();
    this.updateDocumentsStats();
}

// ✅ NUEVO: Buscar documentos
searchDocuments(searchTerm) {
    if (!searchTerm) {
        this.filteredDocuments = this.currentCategoryFilter === 'all' ? 
            [...this.documents] : 
            this.documents.filter(d => d.category === this.currentCategoryFilter);
    } else {
        this.filteredDocuments = this.documents.filter(doc =>
            doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            this.getCategoryLabel(doc.category).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    this.renderDocuments();
}

// ✅ NUEVO: Actualizar estadísticas de documentos
updateDocumentsStats() {
    const total = this.filteredDocuments.length;
    const totalDownloads = this.filteredDocuments.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
    
    document.getElementById('totalDocuments').textContent = total;
    document.getElementById('totalDownloads').textContent = totalDownloads;
}

// ✅ NUEVO: Descargar documento
async downloadDocument(documentId) {
    try {
        const response = await this.apiService.downloadDocument(documentId);
        
        if (response.success) {
            Utils.showNotification('Documento descargado exitosamente', 'success');
            // Aquí implementarías la descarga real del archivo
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error descargando documento:', error);
        Utils.showNotification('Error descargando documento: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Ver detalles de documento
viewDocumentDetails(documentId) {
    const document = this.documents.find(d => d._id === documentId);
    if (document) {
        const modalContent = document.getElementById('documentDetailContent');
        modalContent.innerHTML = `
            <div class="document-detail">
                <div class="detail-header">
                    <h3>${document.title}</h3>
                    <span class="category-badge category-${document.category}">
                        ${this.getCategoryLabel(document.category)}
                    </span>
                </div>
                
                <div class="detail-description">
                    <h4>Descripción</h4>
                    <p>${document.description}</p>
                </div>
                
                <div class="detail-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Archivo:</label>
                            <span>${document.fileName}</span>
                        </div>
                        <div class="info-item">
                            <label>Tipo:</label>
                            <span>${document.fileType}</span>
                        </div>
                        <div class="info-item">
                            <label>Tamaño:</label>
                            <span>${(document.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        <div class="info-item">
                            <label>Descargas:</label>
                            <span>${document.downloadCount || 0}</span>
                        </div>
                        <div class="info-item">
                            <label>Subido:</label>
                            <span>${new Date(document.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn-primary" onclick="expertPanel.downloadDocument('${document._id}')">
                        📥 Descargar Documento
                    </button>
                </div>
            </div>
        `;
        document.getElementById('documentDetailModal').classList.remove('hidden');
    }
}

// ✅ NUEVO: Confirmar eliminación de documento
confirmDeleteDocument(documentId, documentTitle) {
    this.currentEditId = documentId;
    this.currentEditType = 'document';
    
    const modal = document.getElementById('confirmDeleteModal');
    const message = document.getElementById('confirmDeleteMessage');
    
    message.textContent = `¿Estás seguro de que quieres eliminar el documento "${documentTitle}"? Esta acción no se puede deshacer.`;
    
    modal.classList.remove('hidden');
}

// ✅ NUEVO: Inicializar análisis de riesgo
initRiskAnalysis() {
    this.riskAnalysis = {
        currentAnalysis: null,
        testText: '',
        testKeyword: ''
    };
}

// ✅ NUEVO: Configurar event listeners para análisis
setupRiskAnalysisListeners() {
    
    // Botón de análisis
    this.setupButton('analyzeConversationBtn', () => this.showAnalysisModal());
    
    // Formulario de análisis
    this.setupForm('conversationAnalysisForm', (e) => this.handleConversationAnalysis(e));
    
    // Prueba de palabra clave
    this.setupButton('testKeywordBtn', () => this.testKeyword());
    
    // Ver estadísticas
    this.setupButton('viewKeywordStats', () => this.showKeywordStats());
    
}

// ✅ NUEVO: Mostrar modal de análisis
showAnalysisModal() {
    document.getElementById('conversationAnalysisModal').classList.remove('hidden');
}

// ✅ NUEVO: Manejar análisis de conversación
async handleConversationAnalysis(e) {
    e.preventDefault();
    
    const conversationText = document.getElementById('conversationText').value;
    const patientId = document.getElementById('analysisPatient')?.value || null;
    
    if (!conversationText.trim()) {
        Utils.showNotification('Por favor ingresa el texto a analizar', 'error');
        return;
    }
    
    try {
        Utils.showNotification('Analizando conversación...', 'info');
        
        const response = await this.apiService.analyzeConversationWithKeywords({
            conversationText: conversationText,
            patientId: patientId
        });
        
        if (response.success) {
            this.riskAnalysis.currentAnalysis = response.data.analysis;
            this.displayAnalysisResults(response.data.analysis);
            Utils.showNotification('Análisis completado exitosamente', 'success');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error analizando conversación:', error);
        Utils.showNotification('Error en el análisis: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Mostrar resultados del análisis
displayAnalysisResults(analysis) {
    const resultsContainer = document.getElementById('analysisResults');
    const riskLevel = analysis.riskLevel.toUpperCase();
    
    resultsContainer.innerHTML = `
        <div class="analysis-results">
            <div class="risk-header risk-${analysis.riskLevel}">
                <h3>Nivel de Riesgo: ${riskLevel}</h3>
                <div class="risk-score">Puntuación: ${analysis.riskScore}%</div>
            </div>
            
            <div class="analysis-summary">
                <h4>Resumen del Análisis</h4>
                <p>${analysis.summary}</p>
            </div>
            
            ${analysis.detectedKeywords.length > 0 ? `
            <div class="detected-keywords">
                <h4>Palabras Clave Detectadas (${analysis.detectedKeywords.length})</h4>
                <div class="keywords-grid">
                    ${analysis.detectedKeywords.map(keyword => `
                        <div class="keyword-item weight-${keyword.weight}">
                            <div class="keyword-text">${keyword.keyword}</div>
                            <div class="keyword-meta">
                                <span class="symptom">${this.getSymptomLabel(keyword.symptom)}</span>
                                <span class="weight">Peso: ${keyword.weight}</span>
                            </div>
                            <div class="keyword-context">"${keyword.context}"</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${analysis.contextualAnalysis ? `
            <div class="contextual-analysis">
                <h4>Análisis Contextual</h4>
                <div class="context-content">
                    <p><strong>Contexto Emocional:</strong> ${analysis.contextualAnalysis.emotionalContext}</p>
                    <p><strong>Urgencia:</strong> ${analysis.contextualAnalysis.urgency}</p>
                    
                    ${analysis.contextualAnalysis.keyConcerns && analysis.contextualAnalysis.keyConcerns.length > 0 ? `
                    <div class="concerns-list">
                        <strong>Preocupaciones Principales:</strong>
                        <ul>
                            ${analysis.contextualAnalysis.keyConcerns.map(concern => `
                                <li>${concern}</li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${analysis.contextualAnalysis.recommendations && analysis.contextualAnalysis.recommendations.length > 0 ? `
                    <div class="recommendations-list">
                        <strong>Recomendaciones:</strong>
                        <ul>
                            ${analysis.contextualAnalysis.recommendations.map(rec => `
                                <li>${rec}</li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
            
            <div class="analysis-meta">
                <small>Análisis realizado: ${new Date(analysis.timestamp).toLocaleString()}</small>
            </div>
        </div>
    `;
    
    // Mostrar contenedor de resultados
    resultsContainer.style.display = 'block';
}

// ✅ NUEVO: Probar palabra clave
async testKeyword() {
    const text = document.getElementById('testText').value;
    const keyword = document.getElementById('testKeyword').value;
    
    if (!text.trim() || !keyword.trim()) {
        Utils.showNotification('Por favor ingresa tanto el texto como la palabra clave', 'error');
        return;
    }
    
    try {
        const response = await this.apiService.testKeyword({
            text: text,
            keyword: keyword
        });
        
        if (response.success) {
            this.displayTestResults(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error probando palabra clave:', error);
        Utils.showNotification('Error en la prueba: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Mostrar resultados de prueba
displayTestResults(data) {
    const resultsContainer = document.getElementById('testResults');
    
    resultsContainer.innerHTML = `
        <div class="test-results">
            <h4>Resultado de la Prueba</h4>
            <div class="test-result ${data.detected ? 'detected' : 'not-detected'}">
                <div class="result-icon">
                    ${data.detected ? '✅' : '❌'}
                </div>
                <div class="result-text">
                    <strong>Palabra clave:</strong> "${data.keyword.keyword}"
                    <br>
                    <strong>Resultado:</strong> ${data.detected ? 'DETECTADA' : 'NO DETECTADA'}
                    <br>
                    <strong>Síntoma:</strong> ${this.getSymptomLabel(data.keyword.symptom)}
                    <br>
                    <strong>Peso:</strong> ${data.keyword.weight}
                </div>
            </div>
            
            ${data.detected ? `
            <div class="test-context">
                <strong>Contexto detectado:</strong>
                <p>"${data.context}"</p>
            </div>
            ` : ''}
        </div>
    `;
}

// ✅ NUEVO: Mostrar estadísticas de palabras clave
async showKeywordStats() {
    try {
        const response = await this.apiService.getKeywordStats();
        
        if (response.success) {
            this.displayKeywordStats(response.data.stats);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        Utils.showNotification('Error cargando estadísticas: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Mostrar estadísticas
displayKeywordStats(stats) {
    const modalContent = document.getElementById('keywordStatsContent');
    
    modalContent.innerHTML = `
        <div class="keyword-stats">
            <div class="stats-header">
                <h3>Estadísticas de Palabras Clave</h3>
                <div class="total-keywords">
                    Total: ${stats.totalKeywords} palabras clave
                </div>
            </div>
            
            <div class="stats-by-symptom">
                <h4>Distribución por Síntoma</h4>
                <div class="symptom-stats-grid">
                    ${Object.entries(stats.statsBySymptom).map(([symptom, data]) => `
                        <div class="symptom-stat">
                            <div class="symptom-name">${this.getSymptomLabel(symptom)}</div>
                            <div class="symptom-data">
                                <span class="count">${data.count} palabras</span>
                                <span class="avg-weight">Peso promedio: ${data.averageWeight.toFixed(1)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('keywordStatsModal').classList.remove('hidden');
}

// ✅ NUEVA FUNCIÓN: Ver conversaciones del paciente
async viewPatientChats(patientId) {
    try {
        // Obtener chats del paciente
        const response = await this.apiService.request(`/api/expert/patients/${patientId}/chats`, {
            method: 'GET'
        });

        if (response.success) {
            this.showPatientChatsModal(patientId, response.data.chats);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cargando conversaciones:', error);
        Utils.showNotification('Error cargando conversaciones: ' + error.message, 'error');
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar modal de conversaciones
showPatientChatsModal(patientId, chats) {
    const patient = this.patients.find(p => p._id === patientId);
    const modalContent = document.getElementById('patientDetailContent');
    
    modalContent.innerHTML = `
        <div class="patient-chats">
            <div class="detail-header">
                <h3>Conversaciones - ${patient.name}</h3>
                <span class="chats-count">${chats.length} conversaciones</span>
            </div>
            
            <div class="chats-list">
                ${chats.length > 0 ? 
                    chats.map(chat => this.renderChatItem(chat)).join('') : 
                    '<div class="no-chats">No hay conversaciones registradas</div>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('patientDetailModal').classList.remove('hidden');
}

// ✅ NUEVA FUNCIÓN: Renderizar item de conversación
renderChatItem(chat) {
    const riskLevel = chat.riskLevel || chat.analysis?.keywordAnalysis?.riskLevel || 'minimo';
    const riskScore = chat.riskScore || chat.analysis?.keywordAnalysis?.riskScore || 0;
    const keywords = chat.analysis?.keywordAnalysis?.detectedKeywords || [];
    
    return `
        <div class="chat-item risk-${riskLevel}">
            <div class="chat-header">
                <h4>${chat.title || 'Conversación'}</h4>
                <span class="chat-risk ${riskLevel}">
                    ${this.getRiskLabel(riskLevel)} (${riskScore}%)
                </span>
            </div>
            
            <div class="chat-preview">
                <div class="last-message">
                    ${chat.messages && chat.messages.length > 0 ? 
                        chat.messages[chat.messages.length - 1].content.substring(0, 100) + '...' : 
                        'Sin mensajes'
                    }
                </div>
                
                ${keywords.length > 0 ? `
                <div class="chat-keywords">
                    <strong>Palabras clave detectadas:</strong>
                    <div class="keywords-list">
                        ${keywords.map(kw => 
                            `<span class="keyword-tag small">${kw.keyword} (${kw.weight})</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="chat-meta">
                <span class="chat-date">
                    ${new Date(chat.createdAt).toLocaleDateString()}
                </span>
                <span class="message-count">
                    ${chat.messages ? chat.messages.length : 0} mensajes
                </span>
            </div>
            
            <div class="chat-actions">
                <button class="btn-secondary btn-sm" onclick="expertPanel.viewChatDetail('${chat._id}')">
                    👁️ Ver Detalles
                </button>
            </div>
        </div>
    `;
}

// ✅ NUEVA FUNCIÓN: Debug en tiempo real del paciente
async debugPatientRealTime(patientId) {
    try {
        
        // 1. Obtener datos actualizados del paciente
        const patientsResponse = await this.fetchMyPatients();
        const patient = patientsResponse.data.patients.find(p => p._id === patientId);
        
        console.log('📋 DATOS ACTUALES DEL PACIENTE:');
        console.log('- Nombre:', patient.name);
        console.log('- Email:', patient.email);
        console.log('- Risk Level:', patient.patientProfile?.riskLevel);
        console.log('- Last Assessment:', patient.patientProfile?.lastRiskAssessment);
        console.log('- Keywords Detected:', patient.patientProfile?.lastRiskAssessment?.keywordsDetected);
        
        // 2. Obtener conversaciones recientes
        const chatsResponse = await this.apiService.request(`/api/expert/patients/${patientId}/chats`, {
            method: 'GET'
        });
        
        console.log('💬 CONVERSACIONES RECIENTES:', chatsResponse.data.chats.length);
        chatsResponse.data.chats.forEach((chat, index) => {
            console.log(`   Chat ${index + 1}:`);
            console.log(`   - Título: ${chat.title}`);
            console.log(`   - Risk Level: ${chat.riskLevel}`);
            console.log(`   - Risk Score: ${chat.riskScore}`);
            console.log(`   - Fecha: ${new Date(chat.createdAt).toLocaleString()}`);
            
            if (chat.analysis?.keywordAnalysis) {
                console.log(`   - Palabras clave detectadas: ${chat.analysis.keywordAnalysis.detectedKeywords.length}`);
                chat.analysis.keywordAnalysis.detectedKeywords.forEach(kw => {
                    console.log(`     * "${kw.keyword}" (${kw.symptom}, peso: ${kw.weight})`);
                });
            }
        });

        // 3. Mostrar resumen en modal
        this.showDebugRealTimeModal(patient, chatsResponse.data.chats);
        
    } catch (error) {
        console.error('❌ Error en debug:', error);
        Utils.showNotification('Error en debug: ' + error.message, 'error');
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar modal de debug
showDebugRealTimeModal(patient, chats) {
    const modalContent = document.getElementById('patientDetailContent');
    
    const recentChats = chats.slice(0, 5); // Últimas 5 conversaciones
    
    modalContent.innerHTML = `
        <div class="debug-real-time">
            <div class="debug-header">
                <h3>🔍 Debug en Tiempo Real - ${patient.name}</h3>
                <button class="btn-primary" onclick="expertPanel.loadPatients()">
                    🔄 Actualizar Vista
                </button>
            </div>
            
            <div class="debug-sections">
                <!-- Sección 1: Estado Actual del Paciente -->
                <div class="debug-section">
                    <h4>📊 Estado Actual del Paciente</h4>
                    <div class="debug-grid">
                        <div class="debug-item">
                            <label>Nivel de Riesgo:</label>
                            <span class="value ${patient.patientProfile?.riskLevel || 'minimo'}">
                                ${patient.patientProfile?.riskLevel || 'No evaluado'}
                            </span>
                        </div>
                        <div class="debug-item">
                            <label>Última Evaluación:</label>
                            <span class="value">
                                ${patient.patientProfile?.lastRiskAssessment?.assessedAt ? 
                                    new Date(patient.patientProfile.lastRiskAssessment.assessedAt).toLocaleString() : 
                                    'Nunca'}
                            </span>
                        </div>
                        <div class="debug-item">
                            <label>Palabras Clave Detectadas:</label>
                            <span class="value">
                                ${patient.patientProfile?.lastRiskAssessment?.keywordsDetected || 0}
                            </span>
                        </div>
                        <div class="debug-item">
                            <label>Score de Riesgo:</label>
                            <span class="value">
                                ${patient.patientProfile?.lastRiskAssessment?.riskScore || 0}%
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Sección 2: Conversaciones Recientes -->
                <div class="debug-section">
                    <h4>💬 Conversaciones Recientes (${chats.length})</h4>
                    ${recentChats.length > 0 ? 
                        recentChats.map(chat => `
                            <div class="debug-chat-item">
                                <div class="chat-header">
                                    <strong>${chat.title}</strong>
                                    <span class="chat-risk ${chat.riskLevel || 'minimo'}">
                                        ${chat.riskLevel || 'Sin riesgo'}
                                    </span>
                                </div>
                                <div class="chat-details">
                                    <small>Fecha: ${new Date(chat.createdAt).toLocaleString()}</small>
                                    <small>Score: ${chat.riskScore || 0}%</small>
                                    ${chat.analysis?.keywordAnalysis ? 
                                        `<small>Palabras clave: ${chat.analysis.keywordAnalysis.detectedKeywords.length}</small>` : 
                                        ''
                                    }
                                </div>
                                ${chat.analysis?.keywordAnalysis && chat.analysis.keywordAnalysis.detectedKeywords.length > 0 ? `
                                <div class="chat-keywords">
                                    ${chat.analysis.keywordAnalysis.detectedKeywords.map(kw => `
                                        <span class="keyword-debug" title="${kw.symptom} - Peso: ${kw.weight}">
                                            ${kw.keyword}
                                        </span>
                                    `).join('')}
                                </div>
                                ` : ''}
                            </div>
                        `).join('') : 
                        '<p class="no-data">No hay conversaciones recientes</p>'
                    }
                </div>
                
                <!-- Sección 3: Acciones de Debug -->
                <div class="debug-section">
                    <h4>🔧 Acciones de Debug</h4>
                    <div class="debug-actions">
                        <button class="btn-warning" onclick="expertPanel.forceRiskAnalysis('${patient._id}')">
                            🔍 Forzar Análisis
                        </button>
                        <button class="btn-secondary" onclick="expertPanel.refreshPatientData('${patient._id}')">
                            📥 Recargar Datos
                        </button>
                        <button class="btn-test" onclick="expertPanel.testKeywordsDetection('${patient._id}')">
                            🧪 Probar Detección
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="debug-console">
                <h4>📝 Consola de Debug</h4>
                <div class="console-output">
                    <p>🔍 Revisa la consola del navegador (F12) para ver logs detallados</p>
                    <p>💡 Los datos se actualizan automáticamente cada 30 segundos</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('patientDetailModal').classList.remove('hidden');
    
    // Auto-refresh cada 30 segundos
    setTimeout(() => {
        this.debugPatientRealTime(patient._id);
    }, 30000);
}

// ✅ NUEVA FUNCIÓN: Recargar datos del paciente
async refreshPatientData(patientId) {
    try {
        Utils.showNotification('Recargando datos del paciente...', 'info');
        
        // Forzar recarga de pacientes
        await this.loadPatients();
        
        // Recargar debug
        await this.debugPatientRealTime(patientId);
        
        Utils.showNotification('Datos actualizados correctamente', 'success');
    } catch (error) {
        console.error('Error recargando datos:', error);
        Utils.showNotification('Error recargando datos', 'error');
    }
}

// ✅ NUEVA FUNCIÓN: Probar detección de palabras clave
async testKeywordsDetection(patientId) {
    try {
        const testText = "Me siento muy deprimido y he pensado en el suicidio, no aguanto más esta situación";
        
        Utils.showNotification('Probando detección de palabras clave...', 'info');
        
        const response = await this.apiService.analyzeConversationWithKeywords({
            conversationText: testText,
            patientId: patientId
        });
        
        if (response.success) {
            const analysis = response.data.analysis;
            
            console.log('🧪 RESULTADO DE PRUEBA:');
            console.log('- Texto probado:', testText);
            console.log('- Risk Level:', analysis.riskLevel);
            console.log('- Risk Score:', analysis.riskScore);
            console.log('- Palabras detectadas:', analysis.detectedKeywords.length);
            analysis.detectedKeywords.forEach(kw => {
                console.log(`  * "${kw.keyword}" (${kw.symptom}, peso: ${kw.weight})`);
            });
            
            Utils.showNotification(`Prueba exitosa: ${analysis.riskLevel.toUpperCase()} - ${analysis.detectedKeywords.length} palabras detectadas`, 'success');
            
            // Recargar debug
            await this.debugPatientRealTime(patientId);
        }
    } catch (error) {
        console.error('Error en prueba:', error);
        Utils.showNotification('Error en prueba: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Configurar WebSocket para actualizaciones en tiempo real
setupWebSocket() {
    try {
        // Usar WebSocket para actualizaciones en tiempo real
        this.ws = new WebSocket(`ws://localhost:5001/ws/expert`);
        
        this.ws.onopen = () => {
            console.log('🔌 WebSocket conectado para actualizaciones en tiempo real');
            // Autenticar el WebSocket
            if (this.apiService.token) {
                this.ws.send(JSON.stringify({
                    type: 'auth',
                    token: this.apiService.token
                }));
            }
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('🔌 WebSocket desconectado, reintentando en 5 segundos...');
            setTimeout(() => this.setupWebSocket(), 5000);
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ Error en WebSocket:', error);
        };
        
    } catch (error) {
        console.error('Error configurando WebSocket:', error);
    }
}

// ✅ NUEVO: Manejar mensajes del WebSocket
handleWebSocketMessage(data) {
    switch (data.type) {
        case 'patient_created':
            this.handleNewPatient(data.patient);
            break;
        case 'patient_updated':
            this.handlePatientUpdate(data.patient);
            break;
        case 'chat_analysis':
            this.handleNewChatAnalysis(data.analysis);
            break;
        default:
            console.log('Mensaje WebSocket no manejado:', data);
    }
}

// ✅ NUEVO: Manejar nuevo paciente (agregar sin recargar)
handleNewPatient(patient) {
    // Si estamos en la sección de pacientes, agregar el nuevo paciente
    if (this.currentSection === 'patients') {
        this.patients.unshift(patient);
        this.renderPatientsTable(); // Usar la nueva función de tabla
        Utils.showNotification(`Nuevo paciente agregado: ${patient.name}`, 'success');
    }
    
    // Actualizar estadísticas del dashboard
    if (this.currentSection === 'dashboard') {
        this.loadDashboardData();
    }
}

// ✅ NUEVO: Renderizar tabla de pacientes (nuevo diseño)
renderPatientsTable() {
    const container = document.getElementById('patientsTableContainer');
    if (!container) return;

    if (this.patients.length === 0) {
        container.innerHTML = this.getEmptyPatientsState();
        return;
    }

    // ✅ COLUMNAS DINÁMICAS SEGÚN TIPO DE INSTITUCIÓN
    const columns = this.getTableColumnsByInstitution();
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="patients-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.patients.map(patient => this.renderPatientTableRow(patient, columns)).join('')}
                </tbody>
            </table>
        </div>
    `;
}

getTableColumnsByInstitution() {
    switch (this.institutionType) {
        case 'university':
            return [
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'program', label: 'Programa' },
                { key: 'faculty', label: 'Facultad' },
                { key: 'riskLevel', label: 'Nivel de Riesgo' },
                { key: 'lastActivity', label: 'Última Actividad' },
                { key: 'status', label: 'Estado' },
                { key: 'actions', label: 'Acciones' }
            ];
            
        case 'school':
            return [
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'grade', label: 'Grado' },
                { key: 'section', label: 'Sección' },
                { key: 'riskLevel', label: 'Nivel de Riesgo' },
                { key: 'lastActivity', label: 'Última Actividad' },
                { key: 'status', label: 'Estado' },
                { key: 'actions', label: 'Acciones' }
            ];
            
        case 'company':
            return [
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'department', label: 'Departamento' },
                { key: 'position', label: 'Cargo' },
                { key: 'riskLevel', label: 'Nivel de Riesgo' },
                { key: 'lastActivity', label: 'Última Actividad' },
                { key: 'status', label: 'Estado' },
                { key: 'actions', label: 'Acciones' }
            ];
            
        case 'health_center':
            return [
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'department', label: 'Departamento' },
                { key: 'specialty', label: 'Especialidad' },
                { key: 'riskLevel', label: 'Nivel de Riesgo' },
                { key: 'lastActivity', label: 'Última Actividad' },
                { key: 'status', label: 'Estado' },
                { key: 'actions', label: 'Acciones' }
            ];
            
        default:
            return [
                { key: 'name', label: 'Nombre' },
                { key: 'email', label: 'Email' },
                { key: 'department', label: 'Departamento' },
                { key: 'course', label: 'Curso/Cargo' },
                { key: 'riskLevel', label: 'Nivel de Riesgo' },
                { key: 'lastActivity', label: 'Última Actividad' },
                { key: 'status', label: 'Estado' },
                { key: 'actions', label: 'Acciones' }
            ];
    }
}

// ✅ NUEVO: Crear chat de prueba simple
async createTestChat(patientId) {
    try {
        const patient = this.patients.find(p => p._id === patientId);
        if (!patient) return;

        // Mensajes predefinidos para elegir
        const sampleMessages = [
            "Me siento muy ansioso hoy, no puedo concentrarme en mis estudios",
            "He estado muy estresado con los exámenes finales, no duermo bien",
            "Últimamente me siento muy triste y sin energía para nada",
            "Tengo mucho miedo de no poder con todo, siento que me ahogo",
            "He tenido pensamientos muy negativos sobre el futuro",
            "Me cuesta mucho socializar, me siento muy solo"
        ];

        const message = prompt(
            'Escribe un mensaje o elige uno predefinido:\n\n' +
            sampleMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n') +
            '\n\nO escribe tu propio mensaje:',
            sampleMessages[0]
        );

        if (!message) return;

        Utils.showNotification('💬 Creando chat de prueba...', 'info');

        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/test-chat`,
            'POST',
            { message }
        );

        if (response.success) {
            Utils.showNotification('✅ Chat de prueba creado!', 'success');
            
            // Mostrar resultados del chat creado
            setTimeout(() => {
                this.showTestChatResults(patient, response.data);
            }, 1000);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error creando chat de prueba:', error);
        Utils.showNotification('❌ Error: ' + error.message, 'error');
    }
}

showTestChatResults(patient, data) {
    const modalContent = document.getElementById('patientDetailContent');
    
    modalContent.innerHTML = `
        <div class="test-chat-results">
            <div class="results-header">
                <div class="success-icon">💬</div>
                <h3>Chat de Prueba Creado</h3>
            </div>
            
            <div class="chat-analysis-preview">
                <h4>📊 Análisis Automático Generado:</h4>
                <div class="analysis-details">
                    <div class="analysis-item">
                        <span class="label">Nivel de Riesgo:</span>
                        <span class="value risk-${data.analysis.riskLevel}">${data.analysis.riskLevel.toUpperCase()}</span>
                    </div>
                    <div class="analysis-item">
                        <span class="label">Puntuación:</span>
                        <span class="value">${data.analysis.riskScore}%</span>
                    </div>
                    <div class="analysis-item">
                        <span class="label">Palabras Clave Detectadas:</span>
                        <span class="value">${data.analysis.keywordsDetected}</span>
                    </div>
                </div>
                
                <div class="chat-preview">
                    <h5>💭 Conversación Creada:</h5>
                    <div class="message user-message">
                        <strong>Usuario:</strong> ${data.analysis.context || 'Mensaje de prueba'}
                    </div>
                    <div class="message assistant-message">
                        <strong>Camila:</strong> Entiendo que te sientes así. Estoy aquí para ayudarte...
                    </div>
                </div>
            </div>
            
            <div class="results-actions">
                <button class="btn-primary" onclick="expertPanel.showPatientAnalysisModal('${patient._id}')">
                    📈 Ver Análisis Completo
                </button>
                <button class="btn-secondary" onclick="expertPanel.createTestChat('${patient._id}')">
                    💬 Crear Otro Chat
                </button>
                <button class="btn-generate" onclick="expertPanel.generateSampleData('${patient._id}')">
                    🎯 Generar Más Datos
                </button>
            </div>
        </div>
    `;
}

// ✅ NUEVO: Método simplificado para generar datos
async generateSimpleSampleData(patientId) {
    try {
        if (!confirm('¿Generar datos de ejemplo? Esto creará chats ficticios para pruebas.')) {
            return;
        }

        Utils.showNotification('Generando datos de ejemplo...', 'info');

        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/generate-sample-data`,
            'POST'
        );

        if (response.success) {
            Utils.showNotification('✅ ' + response.message, 'success');
            // Recargar análisis después de 2 segundos
            setTimeout(() => {
                this.showPatientAnalysisModal(patientId);
            }, 2000);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error generando datos:', error);
        Utils.showNotification('❌ Error: ' + error.message, 'error');
        
        // Mostrar error detallado en consola
        console.error('Error detallado:', error);
    }
}

// ✅ NUEVO: Renderizar fila de paciente en tabla
renderPatientTableRow(patient, columns) {
    const riskLevel = this.getPatientRiskLevel(patient);
    const riskClass = this.getRiskClass(riskLevel);
    const lastActivity = patient.stats?.lastActivity ? 
        new Date(patient.stats.lastActivity).toLocaleDateString() : 'Nunca';
    const isActive = patient.isActive !== false;

    let rowHTML = `<tr class="patient-row ${!isActive ? 'inactive' : ''}">`;

    columns.forEach(column => {
        switch (column.key) {
            case 'name':
                rowHTML += `
                    <td class="patient-name">
                        <div class="patient-avatar">
                            ${patient.name.charAt(0).toUpperCase()}
                        </div>
                        ${patient.name}
                    </td>
                `;
                break;
                
            case 'email':
                rowHTML += `<td class="patient-email">${patient.email}</td>`;
                break;
                
            case 'program':
                rowHTML += `
                    <td class="patient-program">
                        ${patient.institutionalPath?.program?.name || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'faculty':
                rowHTML += `
                    <td class="patient-faculty">
                        ${patient.institutionalPath?.faculty?.name || 'No asignada'}
                    </td>
                `;
                break;
                
            case 'grade':
                rowHTML += `
                    <td class="patient-grade">
                        ${patient.institutionalPath?.grade ? this.getGradeLabel(patient.institutionalPath.grade) : 'No asignado'}
                    </td>
                `;
                break;
                
            case 'section':
                rowHTML += `
                    <td class="patient-section">
                        ${patient.institutionalPath?.section || 'No asignada'}
                    </td>
                `;
                break;
                
            case 'department':
                rowHTML += `
                    <td class="patient-department">
                        ${patient.institutionalPath?.department || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'position':
                rowHTML += `
                    <td class="patient-position">
                        ${patient.institutionalPath?.position || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'specialty':
                rowHTML += `
                    <td class="patient-specialty">
                        ${patient.institutionalPath?.specialty || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'course':
                rowHTML += `
                    <td class="patient-course">
                        ${patient.institutionalPath?.course || 'No asignado'}
                    </td>
                `;
                break;
                
            case 'riskLevel':
                rowHTML += `
                    <td class="patient-risk">
                        <span class="risk-badge ${riskClass}">
                            ${this.getRiskLabel(riskLevel)}
                        </span>
                    </td>
                `;
                break;
                
            case 'lastActivity':
                rowHTML += `<td class="patient-activity">${lastActivity}</td>`;
                break;
                
            case 'status':
                rowHTML += `
                    <td class="patient-status">
                        <span class="status-badge ${isActive ? 'active' : 'inactive'}">
                            ${isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                `;
                break;
                
            case 'actions':
                rowHTML += `
                    <td class="patient-actions">
                        <div class="action-buttons">
                            <button class="btn-analysis btn-sm" 
                                    onclick="expertPanel.showPatientAnalysisModal('${patient._id}')"
                                    title="Análisis Detallado">
                                📊 Analizar
                            </button>
                            <button class="btn-toggle-status btn-sm ${isActive ? 'btn-warning' : 'btn-success'}" 
                                    onclick="expertPanel.togglePatientStatus('${patient._id}')"
                                    title="${isActive ? 'Deshabilitar' : 'Habilitar'}">
                                ${isActive ? '⏸️' : '▶️'}
                            </button>
                        </div>
                    </td>
                `;
                break;
                
            default:
                rowHTML += `<td>--</td>`;
        }
    });

    rowHTML += `</tr>`;
    return rowHTML;
}

// ✅ NUEVO: Mostrar modal de análisis del paciente
async showPatientAnalysisModal(patientId, month = null, year = null) {
    try {
        const patient = this.patients.find(p => p._id === patientId);
        if (!patient) {
            Utils.showNotification('Paciente no encontrado', 'error');
            return;
        }

        //console.log('🎯 INICIANDO ANÁLISIS para:', patient.name, 'ID:', patientId);

        // Mostrar estado de carga
        const modalContent = document.getElementById('patientDetailContent');
        modalContent.innerHTML = `
            <div class="loading-analysis">
                <div class="loading-spinner"></div>
                <p>Analizando a ${patient.name}...</p>
                <small>Consultando datos del sistema</small>
            </div>
        `;
        
        document.getElementById('patientDetailModal').classList.remove('hidden');

        // Pequeño delay para mostrar el loading
        await new Promise(resolve => setTimeout(resolve, 500));

        // Obtener análisis
        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/analyze`,
            'POST'
        );

        //console.log('📊 RESPUESTA DEL BACKEND:', response);

        if (response.success) {
            // ✅ CORREGIDO: Verificación más robusta
            const analysis = response.data.analysis;
            const hasData = analysis && analysis.totalChats > 0;

            if (hasData) {
               // console.log('✅ MOSTRANDO ANÁLISIS CON DATOS REALES');
                this.renderPatientAnalysisModal(patient, response.data);
            } else {
                console.log('📭 NO HAY DATOS - MOSTRANDO OPCIÓN DE GENERAR');
                this.offerSampleDataCreation(patient, response.data);
            }
        } else {
            throw new Error(response.message || 'Error al cargar el análisis');
        }

    } catch (error) {
        console.error('❌ ERROR en showPatientAnalysisModal:', error);
        
        const modalContent = document.getElementById('patientDetailContent');
        modalContent.innerHTML = `
            <div class="error-analysis">
                <div class="error-icon">❌</div>
                <h3>Error en el análisis</h3>
                <p>${error.message}</p>
                <div class="error-details">
                    <p><strong>Debug info:</strong></p>
                    <ul>
                        <li>Paciente: ${patientId}</li>
                        <li>Método: POST /analyze</li>
                        <li>Error: ${error.message}</li>
                    </ul>
                </div>
                <div class="error-actions">
                    <button class="btn-primary" onclick="expertPanel.forceAnalysis('${patientId}')">
                        🔧 Forzar Análisis
                    </button>
                    <button class="btn-secondary" onclick="expertPanel.hideAllModals()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
    }
}

forceAnalysis(patientId) {
    this.showPatientAnalysisModal(patientId);
}

// ✅ NUEVO: Renderizar modal de análisis
renderPatientAnalysisModal(patient, analysisData) {
    const modalContent = document.getElementById('patientDetailContent');
    
    //console.log('🎨 RENDERIZANDO con datos:', analysisData);
    
    const analysis = analysisData.analysis;
    const totalChats = analysis.totalChats || 0;
    const highRiskChats = analysis.highRiskChats || 0;
    const avgRiskScore = analysis.averageRiskScore || 0;
    const overallRiskLevel = analysis.overallRiskLevel || 'minimo';
    const frequentKeywords = analysis.frequentKeywords || [];
    const summary = analysis.summary || `Análisis de ${patient.name}`;

    modalContent.innerHTML = `
        <div class="patient-analysis-modal">
            <!-- Header -->
            <div class="analysis-header">
                <div class="header-main">
                    <h3>📊 Análisis Detallado</h3>
                    <span class="patient-name">${patient.name}</span>
                </div>
                <span class="risk-badge large ${overallRiskLevel}">
                    ${this.getRiskLabel(overallRiskLevel)}
                </span>
            </div>

            <!-- Resumen Principal -->
            <div class="analysis-highlights">
                <div class="highlight-card primary">
                    <div class="highlight-value">${totalChats}</div>
                    <div class="highlight-label">Conversaciones Analizadas</div>
                </div>
                <div class="highlight-card ${highRiskChats > 0 ? 'warning' : 'secondary'}">
                    <div class="highlight-value">${highRiskChats}</div>
                    <div class="highlight-label">Chats de Alto Riesgo</div>
                    ${highRiskChats > 0 ? '<div class="risk-alert">⚠️ Necesita atención</div>' : ''}
                </div>
                <div class="highlight-card ${avgRiskScore > 50 ? 'danger' : 'success'}">
                    <div class="highlight-value">${avgRiskScore}%</div>
                    <div class="highlight-label">Riesgo Promedio</div>
                </div>
            </div>

            <!-- Palabras Clave -->
            ${frequentKeywords.length > 0 ? `
            <div class="keywords-section">
                <h4>🔍 Palabras Clave Detectadas</h4>
                <div class="keywords-cloud">
                    ${frequentKeywords.map(keyword => `
                        <span class="keyword-tag size-${Math.min(keyword.count, 5)}" 
                              title="Aparece ${keyword.count} veces">
                            ${keyword.keyword}
                        </span>
                    `).join('')}
                </div>
                <div class="keywords-stats">
                    <small>Se detectaron ${frequentKeywords.length} palabras clave diferentes en ${totalChats} conversaciones</small>
                </div>
            </div>
            ` : ''}

            <!-- Detalles del Riesgo -->
            <div class="risk-breakdown">
                <h4>📈 Desglose de Riesgo</h4>
                <div class="risk-metrics">
                    <div class="metric">
                        <label>Nivel de Riesgo:</label>
                        <span class="value ${overallRiskLevel}">${this.getRiskLabel(overallRiskLevel)}</span>
                    </div>
                    <div class="metric">
                        <label>Puntuación Promedio:</label>
                        <span class="value">${avgRiskScore}%</span>
                    </div>
                    <div class="metric">
                        <label>Chats Críticos:</label>
                        <span class="value ${highRiskChats > 0 ? 'high-risk' : 'low-risk'}">${highRiskChats}</span>
                    </div>
                    <div class="metric">
                        <label>Días con Actividad:</label>
                        <span class="value">${analysis.activityDays || 1}</span>
                    </div>
                </div>
            </div>

            <!-- Resumen -->
            <div class="analysis-summary">
                <h4>🎯 Resumen del Análisis</h4>
                <div class="summary-content">
                    <p>${summary}</p>
                    ${highRiskChats > 0 ? `
                        <div class="priority-alert">
                            <strong>🚨 ACCIÓN RECOMENDADA:</strong> Este paciente tiene ${highRiskChats} conversaciones 
                            de alto riesgo que requieren intervención inmediata.
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- ✅ MODIFICADO: Solo mantener el botón de Cerrar -->
            <div class="analysis-actions">
                <button class="btn-primary" onclick="expertPanel.hideAllModals()">
                    Cerrar
                </button>
            </div>

            <!-- ❌ QUITADO: Información de Debug -->
            <!--
            <div class="debug-info">
                <details>
                    <summary>🔧 Información de Debug</summary>
                    <pre>${JSON.stringify(analysisData, null, 2)}</pre>
                </details>
            </div>
            -->
        </div>
    `;

    //console.log('✅ ANÁLISIS RENDERIZADO CORRECTAMENTE');
}



// ✅ NUEVO: Renderizar día en calendario
renderCalendarDay(day) {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('es', { weekday: 'short' });
    const dayNumber = date.getDate();
    
    return `
        <div class="calendar-day activity-${day.activityLevel} mood-${day.moodIndicator}">
            <div class="day-header">${dayName}</div>
            <div class="day-number">${dayNumber}</div>
            <div class="day-stats">
                <small>${day.totalChats} chat${day.totalChats !== 1 ? 's' : ''}</small>
                ${day.highRiskChats > 0 ? '<div class="risk-indicator">⚠️</div>' : ''}
            </div>
        </div>
    `;
}

renderMonthlyCalendar(dailyReports, month, year) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    let calendarHTML = '';
    
    // Encabezados de días
    dayNames.forEach(dayName => {
        calendarHTML += `<div class="calendar-header">${dayName}</div>`;
    });
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += `<div class="calendar-day empty"></div>`;
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayData = dailyReports.find(report => report.date === dateStr);
        
        let activityClass = 'activity-none';
        let chatCount = 0;
        let hasHighRisk = false;
        
        if (dayData) {
            chatCount = dayData.totalChats;
            hasHighRisk = dayData.highRiskChats > 0;
            
            if (chatCount >= 5) activityClass = 'activity-high';
            else if (chatCount >= 2) activityClass = 'activity-medium';
            else if (chatCount >= 1) activityClass = 'activity-low';
        }
        
        const isToday = this.isToday(dateStr);
        
        calendarHTML += `
            <div class="calendar-day ${activityClass} ${isToday ? 'today' : ''}" 
                 onclick="expertPanel.showDayDetails('${dateStr}')">
                <div class="day-number">${day}</div>
                ${chatCount > 0 ? `
                    <div class="day-stats">
                        <span class="chat-count">${chatCount}💬</span>
                        ${hasHighRisk ? '<span class="risk-indicator">⚠️</span>' : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return calendarHTML;
}

isToday(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
}

filterDailyReports() {
    const showOnlyActive = document.getElementById('showOnlyActiveDays').checked;
    const reportsList = document.getElementById('reportsList');
    
    // En una implementación real, esto filtraría los datos existentes
    // Por ahora solo mostramos un mensaje
    if (showOnlyActive) {
        reportsList.innerHTML = '<p>Mostrando solo días con actividad...</p>';
    } else {
        reportsList.innerHTML = '<p>Mostrando todos los días...</p>';
    }
}

showDayDetails(dateStr) {
    Utils.showNotification(`Detalles del día ${dateStr} - Función en desarrollo`, 'info');
}

async diagnosePatient(patientId) {
    try {
        const patient = this.patients.find(p => p._id === patientId);
        if (!patient) return;

        Utils.showNotification('Ejecutando diagnóstico...', 'info');

        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/diagnose`,
            'GET'
        );

        if (response.success) {
            this.showDiagnosisResults(patient, response.data);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error en diagnóstico:', error);
        Utils.showNotification('Error en diagnóstico: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Mostrar resultados del diagnóstico
showDiagnosisResults(patient, diagnosisData) {
    const modalContent = document.getElementById('patientDetailContent');
    
    modalContent.innerHTML = `
        <div class="diagnosis-results">
            <div class="diagnosis-header">
                <h3>🔍 Diagnóstico - ${patient.name}</h3>
                <div class="patient-info">
                    <span class="email">${patient.email}</span>
                    <span class="risk-badge ${patient.patientProfile?.riskLevel || 'minimo'}">
                        ${this.getRiskLabel(patient.patientProfile?.riskLevel || 'minimo')}
                    </span>
                </div>
            </div>

            <!-- Resumen del Diagnóstico -->
            <div class="diagnosis-summary">
                <h4>Resumen del Diagnóstico</h4>
                <div class="diagnosis-cards">
                    <div class="diagnosis-card ${diagnosisData.diagnosis.hasChats ? 'success' : 'error'}">
                        <div class="diagnosis-icon">${diagnosisData.diagnosis.hasChats ? '✅' : '❌'}</div>
                        <div class="diagnosis-content">
                            <div class="diagnosis-value">${diagnosisData.summary.totalChats}</div>
                            <div class="diagnosis-label">Chats Totales</div>
                        </div>
                    </div>
                    <div class="diagnosis-card ${diagnosisData.diagnosis.hasRecentChats ? 'success' : 'warning'}">
                        <div class="diagnosis-icon">${diagnosisData.diagnosis.hasRecentChats ? '✅' : '⚠️'}</div>
                        <div class="diagnosis-content">
                            <div class="diagnosis-value">${diagnosisData.summary.recentChats}</div>
                            <div class="diagnosis-label">Chats Recientes</div>
                        </div>
                    </div>
                    <div class="diagnosis-card ${diagnosisData.diagnosis.hasRiskData ? 'success' : 'warning'}">
                        <div class="diagnosis-icon">${diagnosisData.diagnosis.hasRiskData ? '✅' : '⚠️'}</div>
                        <div class="diagnosis-content">
                            <div class="diagnosis-value">${diagnosisData.summary.chatsWithRisk}</div>
                            <div class="diagnosis-label">Chats con Riesgo</div>
                        </div>
                    </div>
                    <div class="diagnosis-card ${diagnosisData.diagnosis.hasAnalysisData ? 'success' : 'warning'}">
                        <div class="diagnosis-icon">${diagnosisData.diagnosis.hasAnalysisData ? '✅' : '⚠️'}</div>
                        <div class="diagnosis-content">
                            <div class="diagnosis-value">${diagnosisData.summary.chatsWithAnalysis}</div>
                            <div class="diagnosis-label">Chats con Análisis</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Análisis Detallado -->
            <div class="detailed-analysis">
                <h4>Análisis Detallado de Chats</h4>
                ${diagnosisData.chatAnalysis.length > 0 ? `
                    <div class="chats-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Nivel Riesgo</th>
                                    <th>Score</th>
                                    <th>Mensajes</th>
                                    <th>Análisis</th>
                                    <th>Palabras Clave</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${diagnosisData.chatAnalysis.map(chat => `
                                    <tr>
                                        <td>${new Date(chat.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span class="risk-badge ${chat.riskLevel || 'minimo'}">
                                                ${chat.riskLevel || 'N/A'}
                                            </span>
                                        </td>
                                        <td>${chat.riskScore || 'N/A'}</td>
                                        <td>${chat.messageCount}</td>
                                        <td>${chat.hasAnalysis ? '✅' : '❌'}</td>
                                        <td>${chat.hasKeywords ? '✅' : '❌'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="no-chats-data">
                        <p>No se encontraron chats para este paciente.</p>
                    </div>
                `}
            </div>

            <!-- Chat de Ejemplo -->
            ${diagnosisData.sampleChat ? `
            <div class="sample-chat">
                <h4>Chat de Ejemplo</h4>
                <div class="chat-preview">
                    <pre>${JSON.stringify(diagnosisData.sampleChat, null, 2)}</pre>
                </div>
            </div>
            ` : ''}

            <!-- Acciones -->
            <div class="diagnosis-actions">
                <button class="btn-primary" onclick="expertPanel.generateSampleData('${patient._id}')">
                    🎯 Generar Datos de Ejemplo
                </button>
                <button class="btn-secondary" onclick="expertPanel.showPatientAnalysisModal('${patient._id}')">
                    📊 Probar Análisis Nuevamente
                </button>
                <button class="btn-secondary" onclick="expertPanel.hideAllModals()">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.getElementById('patientDetailModal').classList.remove('hidden');
}

// ✅ NUEVO: Generar datos de ejemplo
async generateSampleData(patientId) {
    try {
        const patient = this.patients.find(p => p._id === patientId);
        if (!patient) return;

        // Mostrar confirmación más informativa
        const confirmed = confirm(`¿Generar datos de ejemplo para ${patient.name}?\n\nSe crearán conversaciones realistas con diferentes niveles de riesgo para probar el sistema de análisis.`);
        
        if (!confirmed) return;

        Utils.showNotification('🎯 Generando datos de ejemplo...', 'info');

        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/generate-sample-data`,
            'POST'
        );

        if (response.success) {
            Utils.showNotification('✅ ' + response.message, 'success');
            
            // Mostrar resultados de lo que se generó
            setTimeout(() => {
                this.showSampleDataResults(patient, response.data);
            }, 1000);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error generando datos de ejemplo:', error);
        Utils.showNotification('❌ Error: ' + error.message, 'error');
    }
}

showSampleDataResults(patient, data) {
    const modalContent = document.getElementById('patientDetailContent');
    
    modalContent.innerHTML = `
        <div class="sample-data-results">
            <div class="results-header">
                <div class="success-icon">✅</div>
                <h3>Datos Generados Exitosamente</h3>
            </div>
            
            <div class="results-summary">
                <p>Se generaron <strong>${data.chatsGenerated} conversaciones</strong> de ejemplo para <strong>${patient.name}</strong></p>
                
                <div class="generated-stats">
                    <h4>📊 Estadísticas Generadas:</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Niveles de Riesgo:</span>
                            <span class="stat-value">${data.sampleData.riskLevels.join(', ')}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total Palabras Clave:</span>
                            <span class="stat-value">${data.sampleData.totalKeywords}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Período Simulado:</span>
                            <span class="stat-value">${new Date(data.sampleData.dateRange.from).toLocaleDateString()} - ${new Date(data.sampleData.dateRange.to).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="results-actions">
                <button class="btn-primary" onclick="expertPanel.showPatientAnalysisModal('${patient._id}')">
                    📊 Ver Análisis Completo
                </button>
                <button class="btn-secondary" onclick="expertPanel.generateSampleData('${patient._id}')">
                    🎯 Generar Más Datos
                </button>
                <button class="btn-test" onclick="expertPanel.createTestChat('${patient._id}')">
                    💬 Agregar Chat Individual
                </button>
            </div>
            
            <div class="results-note">
                <p><strong>💡 Nota:</strong> Los datos generados son realistas y simulan diferentes escenarios de ansiedad y estrés para probar el sistema de detección.</p>
            </div>
        </div>
    `;
}

async analyzePatient(patientId) {
    try {
        //console.log('🎯 Iniciando análisis para paciente:', patientId);
        
        // Mostrar loading
        Utils.showNotification('Analizando paciente...', 'info');
        
        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/analyze`,
            'POST' // Usar POST en lugar de GET
        );

        if (response.success) {
            Utils.showNotification('✅ Análisis completado', 'success');
            this.showAnalysisResults(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error analizando paciente:', error);
        Utils.showNotification('Error en análisis: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Mostrar resultados del análisis
showAnalysisResults(analysisData) {
    const modalContent = document.getElementById('patientDetailContent');
    const { patient, analysis } = analysisData;

    modalContent.innerHTML = `
        <div class="analysis-results">
            <div class="analysis-header">
                <h3>📊 Resultados del Análisis - ${patient.name}</h3>
                <span class="risk-badge ${analysis.overallRiskLevel}">
                    ${this.getRiskLabel(analysis.overallRiskLevel)}
                </span>
            </div>

            <div class="analysis-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-value">${analysis.totalChats}</div>
                        <div class="summary-label">Conversaciones Analizadas</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${analysis.highRiskChats}</div>
                        <div class="summary-label">Chats de Alto Riesgo</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${analysis.averageRiskScore}%</div>
                        <div class="summary-label">Riesgo Promedio</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${analysis.totalKeywordsDetected}</div>
                        <div class="summary-label">Palabras Clave Detectadas</div>
                    </div>
                </div>
            </div>

            ${analysis.frequentKeywords.length > 0 ? `
            <div class="keywords-section">
                <h4>🔤 Palabras Clave Más Frecuentes</h4>
                <div class="keywords-grid">
                    ${analysis.frequentKeywords.map(keyword => `
                        <div class="keyword-item">
                            <span class="keyword-text">${keyword.keyword}</span>
                            <span class="keyword-count">${keyword.count} veces</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="analysis-actions">
                <button class="btn-primary" onclick="expertPanel.viewPatientAnalysis('${patient._id}')">
                    📈 Ver Análisis Detallado
                </button>
                <button class="btn-secondary" onclick="expertPanel.hideAllModals()">
                    Cerrar
                </button>
            </div>
        </div>
    `;

    document.getElementById('patientDetailModal').classList.remove('hidden');
}

// ✅ NUEVO: Renderizar reporte diario
renderDailyReport(day) {
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('es', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return `
        <div class="daily-report">
            <div class="report-header">
                <h5>${formattedDate}</h5>
                <span class="mood-indicator mood-${day.moodIndicator}">
                    ${this.getMoodEmoji(day.moodIndicator)}
                </span>
            </div>
            <div class="report-stats">
                <div class="stat">
                    <span class="label">Conversaciones:</span>
                    <span class="value">${day.totalChats}</span>
                </div>
                <div class="stat">
                    <span class="label">Alto Riesgo:</span>
                    <span class="value">${day.highRiskChats}</span>
                </div>
                <div class="stat">
                    <span class="label">Riesgo Promedio:</span>
                    <span class="value">${day.avgRiskScore}%</span>
                </div>
            </div>
            ${day.keywordStats.total > 0 ? `
            <div class="keywords-detected">
                <strong>Palabras clave detectadas:</strong>
                <div class="keywords-list">
                    ${day.keywordStats.mostFrequent.map(kw => 
                        `<span class="keyword-tag">${kw.keyword} (${kw.count})</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

async debugPatientChats(patientId) {
    try {
        const patient = this.patients.find(p => p._id === patientId);
        if (!patient) return;

        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/chats-debug`,
            'GET'
        );

        if (response.success) {
            //console.log('📊 RESULTADO DEBUG:', response.data);
            
            // Mostrar resultados en un alert simple
            const chatInfo = response.data.chatStructures.map(chat => 
                `📅 ${new Date(chat.createdAt).toLocaleDateString()} | ` +
                `Riesgo: ${chat.riskLevel || 'N/A'} | ` +
                `Mensajes: ${chat.messageCount} | ` +
                `Análisis: ${chat.hasAnalysis ? '✅' : '❌'} | ` +
                `Keywords: ${chat.analysisStructure?.keywords?.join(', ') || 'Ninguna'}`
            ).join('\n');
            
            alert(`CHATS ENCONTRADOS: ${response.data.totalChats}\n\n${chatInfo}`);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error en debug:', error);
        alert('Error en debug: ' + error.message);
    }
}

// ✅ NUEVO: Obtener emoji para el estado de ánimo
getMoodEmoji(mood) {
    const emojis = {
        'very_good': '😊',
        'good': '🙂',
        'neutral': '😐',
        'poor': '😔',
        'very_poor': '😢'
    };
    return emojis[mood] || '😐';
}

// ✅ NUEVO: Toggle estado del paciente
async togglePatientStatus(patientId) {
    try {
        const response = await this.apiService.request(
            `/api/expert/patients/${patientId}/status`,
            'PATCH'
        );

        if (response.success) {
            // Actualizar localmente
            const patientIndex = this.patients.findIndex(p => p._id === patientId);
            if (patientIndex !== -1) {
                this.patients[patientIndex].isActive = response.data.isActive;
                this.renderPatientsTable();
            }
            
            Utils.showNotification(
                `Paciente ${response.data.isActive ? 'activado' : 'deshabilitado'} exitosamente`, 
                'success'
            );
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cambiando estado:', error);
        Utils.showNotification('Error cambiando estado: ' + error.message, 'error');
    }
}

// ✅ NUEVO: Cargar pacientes con filtros avanzados
async loadPatientsAdvanced(filters = {}) {
    try {
        console.log('📥 Cargando pacientes con filtros:', filters);
        
        // Mostrar loading
        const container = document.getElementById('patientsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Aplicando filtros...</p>
                </div>
            `;
        }

        const response = await this.apiService.request(
            `/api/expert/patients-advanced?${new URLSearchParams(filters).toString()}`,
            'GET'
        );

        if (response.success) {
            this.patients = response.data.patients || [];
            console.log(`✅ ${this.patients.length} pacientes cargados con los filtros aplicados`);
            
            // Debug de los datos recibidos
            if (this.patients.length > 0) {
                console.log('📋 Primer paciente como ejemplo:', {
                    name: this.patients[0].name,
                    institutionalPath: this.patients[0].institutionalPath
                });
            }
            
            this.availablePrograms = response.data.filters?.availablePrograms || [];
            this.renderPatientsTable();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        Utils.showNotification('Error cargando pacientes: ' + error.message, 'error');
        
        const container = document.getElementById('patientsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Error aplicando filtros</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="expertPanel.loadPatients()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

applyFiltersAutomatically() {
    // Usar debounce para evitar muchas llamadas
    if (this.filterTimeout) {
        clearTimeout(this.filterTimeout);
    }
    
    this.filterTimeout = setTimeout(() => {
        this.applyFilters();
    }, 800); // 800ms de delay para búsqueda
}

// ✅ NUEVO: Aplicar filtros
applyFilters() {
    const filters = this.collectFilterValues();
    
    console.log('🎯 Aplicando filtros para', this.institutionType + ':', filters);
    
    // ✅ NUEVO: Debug específico por tipo de institución
    switch (this.institutionType) {
        case 'school':
            if (filters.grade) console.log('🏫 Filtrando por grado:', filters.grade);
            if (filters.section) console.log('🏫 Filtrando por sección:', filters.section);
            break;
        case 'university':
            if (filters.programId) console.log('🎓 Filtrando por programa:', filters.programId);
            if (filters.facultyId) console.log('🎓 Filtrando por facultad:', filters.facultyId);
            break;
        case 'company':
            if (filters.department) console.log('🏢 Filtrando por departamento:', filters.department);
            break;
    }

    // Construir URL manteniendo todos los parámetros
    const params = new URLSearchParams();
    
    // Agregar todos los filtros que tengan valor
    Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
            params.append(key, filters[key]);
        }
    });

    // Mantener otros parámetros de la URL actual
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.forEach((value, key) => {
        if (!filters.hasOwnProperty(key) && key !== 'page') {
            params.append(key, value);
        }
    });

    // Navegar a la nueva URL
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    
    // Recargar pacientes con los filtros
    this.loadPatientsAdvanced(filters);
}

collectFilterValues() {
    const filters = {};

    // Búsqueda común
    const searchFilter = document.getElementById('searchFilter');
    if (searchFilter && searchFilter.value.trim()) {
        filters.search = searchFilter.value.trim();
    }

    // ✅ CORREGIDO: Filtros específicos por tipo de institución
    console.log('🔍 Recolectando filtros para:', this.institutionType);
    
    switch (this.institutionType) {
        case 'university':
            // ✅ UNIVERSIDAD: Solo programa
            const programFilter = document.getElementById('programFilter');
            if (programFilter && programFilter.value !== 'all') {
                filters.programId = programFilter.value;
                console.log('🎓 Filtro programa:', programFilter.value);
            }
            break;

        case 'school':
            // ✅ COLEGIO: Solo grado
            const gradeFilter = document.getElementById('gradeFilter');
            if (gradeFilter && gradeFilter.value !== 'all') {
                filters.grade = gradeFilter.value;
                console.log('🏫 Filtro grado:', gradeFilter.value);
            }
            break;

        case 'company':
        case 'health_center':
            // ✅ EMPRESA y CENTRO DE SALUD: Solo departamento
            const departmentFilter = document.getElementById('departmentFilter');
            if (departmentFilter && departmentFilter.value !== 'all') {
                filters.department = departmentFilter.value;
                console.log('🏢 Filtro departamento:', departmentFilter.value);
            }
            break;

        default:
            // Institución genérica: departamento
            const genericDeptFilter = document.getElementById('departmentFilter');
            if (genericDeptFilter && genericDeptFilter.value !== 'all') {
                filters.department = genericDeptFilter.value;
            }
    }

    // Filtros comunes
    const riskLevelFilter = document.getElementById('riskLevelFilter');
    if (riskLevelFilter && riskLevelFilter.value !== 'all') {
        filters.riskLevel = riskLevelFilter.value;
        console.log('📊 Filtro nivel riesgo:', riskLevelFilter.value);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter && statusFilter.value !== 'all') {
        filters.status = statusFilter.value;
        console.log('📊 Filtro estado:', statusFilter.value);
    }

    console.log('📦 Filtros finales recolectados:', filters);
    return filters;
}

testAllInstitutionFilters() {
    console.log('🧪 TEST COMPLETO DE FILTROS POR INSTITUCIÓN');
    
    const testScenarios = {
        'university': {
            programId: '65a1b2c3d4e5f67890123456', // ID de ejemplo
            facultyId: '65a1b2c3d4e5f67890123457', // ID de ejemplo  
            semester: '3',
            riskLevel: 'medio',
            status: 'active'
        },
        'school': {
            grade: '9',
            section: 'A',
            schedule: 'morning',
            riskLevel: 'bajo',
            status: 'active'
        },
        'company': {
            department: 'Recursos Humanos',
            position: 'Analista',
            riskLevel: 'minimo',
            status: 'active'
        }
    };
    
    const currentInstitution = this.institutionType;
    const testFilters = testScenarios[currentInstitution];
    
    if (testFilters) {
        console.log(`🧪 Probando filtros para ${currentInstitution}:`, testFilters);
        this.loadPatientsAdvanced(testFilters);
    } else {
        console.log('❌ No hay escenario de test para:', currentInstitution);
    }
}

// ✅ NUEVO: Verificar estado actual de los filtros
debugCurrentFilters() {
    console.log('🔍 ESTADO ACTUAL DE LOS FILTROS:');
    console.log('- Institución:', this.institutionType);
    
    const filterIds = [
        'programFilter', 'facultyFilter', 'semesterFilter',
        'gradeFilter', 'sectionFilter', 'scheduleFilter', 
        'departmentFilter', 'positionFilter', 'riskLevelFilter', 'statusFilter'
    ];
    
    filterIds.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            console.log(`- ${filterId}:`, {
                exists: true,
                value: element.value,
                options: element.options?.length || 0
            });
        }
    });
}

loadFilterValuesFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Solo si hay parámetros en la URL, aplicamos los filtros automáticamente
    if (urlParams.toString()) {
        setTimeout(() => {
            this.applyFilters();
        }, 100);
    }
}

// ✅ NUEVO: Limpiar filtros
clearFilters() {
    // Limpiar todos los selects e inputs
    const filterIds = [
        'searchFilter', 'programFilter', 'facultyFilter', 'gradeFilter', 
        'sectionFilter', 'departmentFilter', 'riskLevelFilter'
    ];

    filterIds.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            if (element.tagName === 'SELECT') {
                element.value = 'all';
            } else {
                element.value = '';
            }
        }
    });

    // Estado por defecto a "active"
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = 'active';
    }

    // Limpiar URL y recargar
    window.history.pushState({}, '', window.location.pathname);
    this.loadPatientsAdvanced();
}

// ✅ NUEVO: Estado vacío para pacientes
getEmptyPatientsState() {
    return `
        <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No hay pacientes</h3>
            <p>No se encontraron pacientes con los filtros aplicados</p>
            <button class="btn-primary" onclick="expertPanel.clearFilters()">
                Mostrar Todos los Pacientes
            </button>
        </div>
    `;
}

// ✅ NUEVO: Configurar polling para actualizaciones en tiempo real
setupPolling() {
    this.lastUpdateCheck = new Date();
    this.pollingInterval = null;
    
    // Iniciar polling cada 10 segundos
    this.startPolling();
}

// ✅ NUEVO: Iniciar polling
startPolling() {
    // Limpiar intervalo existente
    if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
    }
    
    // Configurar nuevo intervalo
    this.pollingInterval = setInterval(() => {
        this.checkForUpdates();
    }, 10000); // 10 segundos
    
    //console.log('🔄 Sistema de polling iniciado (cada 10 segundos)');
}

// ✅ NUEVO: Detener polling
stopPolling() {
    if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
       // console.log('🔄 Sistema de polling detenido');
    }
}

// ✅ NUEVO: Verificar actualizaciones
async checkForUpdates() {
    try {
        const response = await this.apiService.request(
            `/api/expert/updates/real-time?lastCheck=${this.lastUpdateCheck.toISOString()}`,
            'GET'
        );

        if (response.success) {
            this.handleUpdates(response.data);
            this.lastUpdateCheck = new Date(response.data.currentTime);
        }
    } catch (error) {
        console.log('⚠️ Error en polling (puede ser normal si no hay conexión):', error.message);
    }
}

// ✅ NUEVO: Manejar actualizaciones
handleUpdates(updateData) {
    const { newPatients, highRiskChats, updates } = updateData;
    
    let hasUpdates = false;
    
    // Manejar nuevos pacientes
    if (newPatients && newPatients.length > 0) {
        this.handleNewPatients(newPatients);
        hasUpdates = true;
    }
    
    // Manejar chats de alto riesgo
    if (highRiskChats && highRiskChats.length > 0) {
        this.handleHighRiskChats(highRiskChats);
        hasUpdates = true;
    }
    
    // Mostrar notificación si hay actualizaciones
    if (hasUpdates && this.currentSection !== 'dashboard') {
        this.showUpdateNotification(updates);
    }
}

// ✅ NUEVO: Manejar nuevos pacientes
handleNewPatients(newPatients) {
    // Agregar nuevos pacientes a la lista existente
    newPatients.forEach(patient => {
        // Verificar si el paciente ya existe en la lista
        const existingIndex = this.patients.findIndex(p => p._id === patient._id);
        if (existingIndex === -1) {
            this.patients.unshift(patient);
        }
    });
    
    // Actualizar la vista si estamos en la sección de pacientes
    if (this.currentSection === 'patients') {
        this.renderPatientsTable();
    }
    
    // Actualizar estadísticas del dashboard
    if (this.currentSection === 'dashboard') {
        this.updateDashboardStats();
    }
}

// ✅ NUEVO: Manejar chats de alto riesgo
handleHighRiskChats(highRiskChats) {
    // Mostrar notificación para chats de alto riesgo
    highRiskChats.forEach(chat => {
        Utils.showNotification(
            `⚠️ Nuevo chat de alto riesgo de ${chat.patient.name}`,
            'warning',
            5000
        );
    });
    
    // Actualizar sección de alto riesgo si está activa
    if (this.currentSection === 'high-risk') {
        this.loadHighRiskCases();
    }
}

// ✅ NUEVO: Mostrar notificación de actualizaciones
showUpdateNotification(updates) {
    let message = '';
    
    if (updates.newPatientsCount > 0 && updates.highRiskChatsCount > 0) {
        message = `${updates.newPatientsCount} nuevo(s) paciente(s) y ${updates.highRiskChatsCount} chat(s) de alto riesgo`;
    } else if (updates.newPatientsCount > 0) {
        message = `${updates.newPatientsCount} nuevo(s) paciente(s)`;
    } else if (updates.highRiskChatsCount > 0) {
        message = `${updates.highRiskChatsCount} nuevo(s) chat(s) de alto riesgo`;
    }
    
    if (message) {
        // Crear notificación flotante
        this.createFloatingNotification(message);
    }
}

// ✅ NUEVO: Crear notificación flotante
createFloatingNotification(message) {
    // Evitar notificaciones duplicadas
    const existingNotification = document.querySelector('.floating-update-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'floating-update-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">🔄</span>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ✅ NUEVO: Actualizar estadísticas del dashboard
updateDashboardStats() {
    // Actualizar contadores basados en los datos locales
    const totalPatients = this.patients.length;
    const highRiskPatients = this.patients.filter(p => 
        this.getPatientRiskLevel(p) === 'alto' || this.getPatientRiskLevel(p) === 'critico'
    ).length;
    const mediumRiskPatients = this.patients.filter(p => 
        this.getPatientRiskLevel(p) === 'medio'
    ).length;
    
    // Actualizar la UI
    const totalPatientsEl = document.getElementById('totalPatients');
    const highRiskPatientsEl = document.getElementById('highRiskPatients');
    const mediumRiskPatientsEl = document.getElementById('mediumRiskPatients');
    
    if (totalPatientsEl) totalPatientsEl.textContent = totalPatients;
    if (highRiskPatientsEl) highRiskPatientsEl.textContent = highRiskPatients;
    if (mediumRiskPatientsEl) mediumRiskPatientsEl.textContent = mediumRiskPatients;
}

}

// Inicializar el panel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.expertPanel = new ExpertPanel();
});