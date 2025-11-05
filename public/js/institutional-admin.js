class InstitutionalAdmin {
    constructor() {
        this.currentSection = 'overview';
        this.currentUser = null;
        this.institution = null;
        this.students = [];
        this.experts = [];
        this.structure = {
            programs: [],
            faculties: [],
            careers: []
        };
        this.init();
    }

    async init() {
        // Verificar que el usuario es admin institucional
        await this.verifyAdminAccess();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar datos iniciales
        await this.loadInstitutionData();
        await this.loadOverviewData();
        
        console.log('🏛️ Panel Institucional inicializado');
    }

    async verifyAdminAccess() {
        try {
            this.currentUser = apiService.getCurrentUser();
            if (!this.currentUser || 
                (this.currentUser.role !== 'institutional_admin' && this.currentUser.role !== 'superadmin')) {
                window.location.href = '../index.html';
                return;
            }

            // Actualizar información del header
            document.getElementById('adminName').textContent = this.currentUser.name;

        } catch (error) {
            console.error('Error verificando acceso:', error);
            window.location.href = '../index.html';
        }
    }

    async loadInstitutionData() {
        try {
            if (this.currentUser.institution) {
                // Cargar datos de la institución
                const response = await fetch(`${apiService.baseURL}/institution/institutions/${this.currentUser.institution._id}/structure`, {
                    headers: apiService.getHeaders()
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        this.institution = result.data.institution;
                        this.structure = {
                            programs: result.data.programs || [],
                            faculties: result.data.faculties || [],
                            careers: result.data.careers || []
                        };
                        
                        document.getElementById('institutionName').textContent = this.institution.name;
                        this.loadInstitutionSettings();
                    }
                }
            }
        } catch (error) {
            console.error('Error cargando datos de institución:', error);
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

        // Tabs de configuración
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.showSettingsTab(tab);
            });
        });

        // Botones de acción
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSection('institution-settings');
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Botones de estructura
        document.getElementById('addProgramBtn').addEventListener('click', () => {
            this.showAddProgramModal();
        });

        document.getElementById('addFacultyBtn').addEventListener('click', () => {
            this.showAddFacultyModal();
        });

        document.getElementById('addCareerBtn').addEventListener('click', () => {
            this.showAddCareerModal();
        });

        document.getElementById('addExpertBtn').addEventListener('click', () => {
            this.showAddExpertModal();
        });

        // Formularios
        document.getElementById('addProgramForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddProgram();
        });

        document.getElementById('addFacultyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddFaculty();
        });

        document.getElementById('addCareerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCareer();
        });

        document.getElementById('addExpertForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddExpert();
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveInstitutionSettings();
        });

        // Reportes
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('exportReportBtn').addEventListener('click', () => {
            this.exportReport();
        });

        // Filtros
        document.getElementById('studentSearch').addEventListener('input', (e) => {
            this.filterStudents(e.target.value);
        });

        document.getElementById('studentRiskFilter').addEventListener('change', (e) => {
            this.filterStudentsByRisk(e.target.value);
        });

        // Cerrar modales
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });

        // Rango de tiempo
        document.getElementById('overviewTimeRange').addEventListener('change', (e) => {
            this.loadOverviewData();
        });
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
        document.getElementById(`${sectionName}-section`).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Cargar datos de la sección
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'overview':
                await this.loadOverviewData();
                break;
            case 'structure':
                await this.loadStructureData();
                break;
            case 'students':
                await this.loadStudentsData();
                break;
            case 'experts':
                await this.loadExpertsData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'reports':
                await this.loadReportsData();
                break;
            case 'institution-settings':
                await this.loadSettingsData();
                break;
        }
    }

    async loadOverviewData() {
        try {
            // Cargar estadísticas generales
            const [studentsRes, expertsRes, analyticsRes] = await Promise.all([
                this.fetchStudents(),
                this.fetchExperts(),
                this.fetchAnalytics()
            ]);

            this.updateOverviewStats(studentsRes, expertsRes, analyticsRes);
            this.loadOverviewCharts();
            this.loadRecentAlerts();

        } catch (error) {
            console.error('Error cargando overview:', error);
            Utils.showNotification('Error cargando el resumen', 'error');
        }
    }

    async fetchStudents() {
        try {
            const response = await fetch(`${apiService.baseURL}/admin/users`, {
                headers: apiService.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching students:', error);
            return { data: { users: [] } };
        }
    }

    async fetchExperts() {
        try {
            const response = await fetch(`${apiService.baseURL}/admin/experts`, {
                headers: apiService.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching experts:', error);
            return { data: { experts: [] } };
        }
    }

    async fetchAnalytics() {
        // En implementación real, harías fetch a la API de analytics
        return { 
            data: { 
                totalConversations: 150,
                highRiskCount: 12,
                mediumRiskCount: 25,
                lowRiskCount: 113
            } 
        };
    }

    updateOverviewStats(studentsRes, expertsRes, analyticsRes) {
        const students = studentsRes.data.users || [];
        const experts = expertsRes.data.experts || [];
        const analytics = analyticsRes.data;

        const totalStudents = students.length;
        const totalConversations = analytics.totalConversations || 0;
        
        const highRiskCount = analytics.highRiskCount || 0;
        const mediumRiskCount = analytics.mediumRiskCount || 0;
        const lowRiskCount = analytics.lowRiskCount || 0;
        const totalWithRisk = highRiskCount + mediumRiskCount + lowRiskCount;

        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('totalConversations').textContent = totalConversations;
        
        document.getElementById('highRiskCount').textContent = highRiskCount;
        document.getElementById('mediumRiskCount').textContent = mediumRiskCount;
        document.getElementById('lowRiskCount').textContent = lowRiskCount;

        document.getElementById('highRiskPercentage').textContent = 
            totalWithRisk > 0 ? Math.round((highRiskCount / totalWithRisk) * 100) + '%' : '0%';
        document.getElementById('mediumRiskPercentage').textContent = 
            totalWithRisk > 0 ? Math.round((mediumRiskCount / totalWithRisk) * 100) + '%' : '0%';
        document.getElementById('lowRiskPercentage').textContent = 
            totalWithRisk > 0 ? Math.round((lowRiskCount / totalWithRisk) * 100) + '%' : '0%';
    }

    loadOverviewCharts() {
        // En implementación real, usarías una librería como Chart.js
        const programChart = document.getElementById('programDistributionChart');
        const facultyChart = document.getElementById('facultyActivityChart');

        programChart.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 10px;">📚</div>
                <p>Distribución de estudiantes por programa</p>
                <small>Se mostrará con datos reales</small>
            </div>
        `;

        facultyChart.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3em; margin-bottom: 10px;">🏛️</div>
                <p>Actividad de conversaciones por facultad</p>
                <small>Se mostrará con datos reales</small>
            </div>
        `;
    }

    loadRecentAlerts() {
        const container = document.getElementById('recentAlerts');
        container.innerHTML = `
            <div class="alert-item high">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <div class="alert-title">Casos de Alto Riesgo Detectados</div>
                    <div class="alert-description">12 estudiantes requieren atención inmediata</div>
                </div>
                <div class="alert-time">Hace 2 horas</div>
            </div>
            <div class="alert-item medium">
                <div class="alert-icon">📊</div>
                <div class="alert-content">
                    <div class="alert-title">Reporte Semanal Generado</div>
                    <div class="alert-description">El reporte de actividad está listo para revisión</div>
                </div>
                <div class="alert-time">Ayer</div>
            </div>
        `;
    }

    async loadStructureData() {
        this.renderStructureTree();
    }

    renderStructureTree() {
        const container = document.getElementById('structureTree');
        
        if (this.structure.programs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏗️</div>
                    <h3>No hay estructura definida</h3>
                    <p>Comienza agregando programas, facultades y carreras</p>
                </div>
            `;
            return;
        }

        let treeHTML = '';

        this.structure.programs.forEach(program => {
            const programCareers = this.structure.careers.filter(c => c.program?._id === program._id);
            
            treeHTML += `
                <div class="tree-item" data-type="program" data-id="${program._id}">
                    <span class="icon">📚</span>
                    ${program.name}
                </div>
                <div class="tree-children">
            `;

            // Agrupar carreras por facultad
            const facultiesInProgram = [...new Set(programCareers.map(c => c.faculty))];
            
            facultiesInProgram.forEach(faculty => {
                if (faculty) {
                    const facultyCareers = programCareers.filter(c => c.faculty?._id === faculty._id);
                    
                    treeHTML += `
                        <div class="tree-item" data-type="faculty" data-id="${faculty._id}">
                            <span class="icon">🏛️</span>
                            ${faculty.name}
                        </div>
                        <div class="tree-children">
                    `;

                    facultyCareers.forEach(career => {
                        treeHTML += `
                            <div class="tree-item" data-type="career" data-id="${career._id}">
                                <span class="icon">🎓</span>
                                ${career.name}
                            </div>
                        `;
                    });

                    treeHTML += `</div>`;
                }
            });

            treeHTML += `</div>`;
        });

        container.innerHTML = treeHTML;

        // Agregar event listeners a los items del árbol
        container.querySelectorAll('.tree-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showStructureDetails(
                    item.getAttribute('data-type'),
                    item.getAttribute('data-id')
                );
            });
        });
    }

    showStructureDetails(type, id) {
        const detailsContainer = document.getElementById('structureDetails');
        let detailsHTML = '';

        switch (type) {
            case 'program':
                const program = this.structure.programs.find(p => p._id === id);
                if (program) {
                    const programCareers = this.structure.careers.filter(c => c.program?._id === id);
                    const programStudents = this.students.filter(s => s.institutionalPath?.program?._id === id);
                    
                    detailsHTML = `
                        <div class="structure-detail-program">
                            <h3>${program.name}</h3>
                            <div class="detail-info">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>Tipo:</label>
                                        <span>${this.getProgramTypeLabel(program.type)}</span>
                                    </div>
                                    ${program.duration ? `
                                    <div class="info-item">
                                        <label>Duración:</label>
                                        <span>${program.duration}</span>
                                    </div>` : ''}
                                    ${program.description ? `
                                    <div class="info-item full-width">
                                        <label>Descripción:</label>
                                        <span>${program.description}</span>
                                    </div>` : ''}
                                </div>
                            </div>
                            <div class="detail-stats">
                                <h4>Estadísticas</h4>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-value">${programCareers.length}</div>
                                        <div class="stat-label">Carreras</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${programStudents.length}</div>
                                        <div class="stat-label">Estudiantes</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${this.getActiveExpertsCount(program._id)}</div>
                                        <div class="stat-label">Expertos</div>
                                    </div>
                                </div>
                            </div>
                            <div class="detail-actions">
                                <button class="btn-primary" onclick="institutionalAdmin.editProgram('${program._id}')">
                                    ✏️ Editar Programa
                                </button>
                                <button class="btn-secondary" onclick="institutionalAdmin.manageProgramExperts('${program._id}')">
                                    👨‍⚕️ Gestionar Expertos
                                </button>
                            </div>
                        </div>
                    `;
                }
                break;

            case 'faculty':
                const faculty = this.structure.faculties.find(f => f._id === id);
                if (faculty) {
                    const facultyCareers = this.structure.careers.filter(c => c.faculty?._id === id);
                    const facultyStudents = this.students.filter(s => s.institutionalPath?.faculty?._id === id);
                    
                    detailsHTML = `
                        <div class="structure-detail-faculty">
                            <h3>${faculty.name}</h3>
                            <div class="detail-info">
                                <div class="info-grid">
                                    ${faculty.dean ? `
                                    <div class="info-item">
                                        <label>Decano:</label>
                                        <span>${faculty.dean}</span>
                                    </div>` : ''}
                                    ${faculty.contactEmail ? `
                                    <div class="info-item">
                                        <label>Email:</label>
                                        <span>${faculty.contactEmail}</span>
                                    </div>` : ''}
                                </div>
                            </div>
                            <div class="detail-stats">
                                <h4>Estadísticas</h4>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-value">${facultyCareers.length}</div>
                                        <div class="stat-label">Carreras</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${facultyStudents.length}</div>
                                        <div class="stat-label">Estudiantes</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                break;

            case 'career':
                const career = this.structure.careers.find(c => c._id === id);
                if (career) {
                    const careerStudents = this.students.filter(s => s.institutionalPath?.career?._id === id);
                    
                    detailsHTML = `
                        <div class="structure-detail-career">
                            <h3>${career.name}</h3>
                            <div class="detail-info">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label>Programa:</label>
                                        <span>${career.program?.name || 'No asignado'}</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Facultad:</label>
                                        <span>${career.faculty?.name || 'No asignada'}</span>
                                    </div>
                                    ${career.code ? `
                                    <div class="info-item">
                                        <label>Código:</label>
                                        <span>${career.code}</span>
                                    </div>` : ''}
                                </div>
                            </div>
                            <div class="detail-stats">
                                <h4>Estadísticas</h4>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-value">${careerStudents.length}</div>
                                        <div class="stat-label">Estudiantes</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${career.semesters?.length || 0}</div>
                                        <div class="stat-label">Semestres</div>
                                    </div>
                                </div>
                            </div>
                            ${career.semesters && career.semesters.length > 0 ? `
                            <div class="semesters-list">
                                <h4>Semestres</h4>
                                <div class="semesters-grid">
                                    ${career.semesters.map(semester => `
                                        <div class="semester-item">
                                            <strong>${semester.number}° Semestre</strong>
                                            <span>${semester.name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>` : ''}
                        </div>
                    `;
                }
                break;
        }

        detailsContainer.innerHTML = detailsHTML;
    }

    getProgramTypeLabel(type) {
        const types = {
            'pregrado': 'Pregrado',
            'posgrado': 'Posgrado',
            'diplomado': 'Diplomado',
            'curso': 'Curso'
        };
        return types[type] || type;
    }

    getActiveExpertsCount(programId) {
        return this.experts.filter(expert => 
            expert.expertProfile?.assignedPrograms?.some(p => p._id === programId)
        ).length;
    }

    async loadStudentsData() {
        try {
            const response = await this.fetchStudents();
            this.students = response.data.users || [];
            this.renderStudentsTable();

        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            Utils.showNotification('Error cargando estudiantes', 'error');
        }
    }

    renderStudentsTable() {
        const tbody = document.getElementById('studentsTableBody');
        
        if (this.students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-table">
                        <div class="empty-icon">👥</div>
                        <h4>No hay estudiantes registrados</h4>
                        <p>Los estudiantes aparecerán aquí cuando se registren con el código de la institución</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.students.map(student => {
            const riskLevel = this.getStudentRiskLevel(student);
            
            return `
                <tr>
                    <td>
                        <div class="student-info">
                            <strong>${student.name}</strong>
                            <div class="student-email">${student.email}</div>
                        </div>
                    </td>
                    <td>${student.institutionalPath?.program?.name || '-'}</td>
                    <td>${student.institutionalPath?.faculty?.name || '-'}</td>
                    <td>${student.institutionalPath?.career?.name || '-'}</td>
                    <td>${student.stats?.totalChats || 0}</td>
                    <td>
                        <span class="risk-indicator risk-${riskLevel}">
                            ${this.getRiskLabel(riskLevel)}
                        </span>
                    </td>
                    <td>${this.formatLastActivity(student.stats?.lastActivity)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-sm btn-primary" onclick="institutionalAdmin.viewStudentDetail('${student._id}')">
                                Ver
                            </button>
                            <button class="btn-sm btn-secondary" onclick="institutionalAdmin.contactStudent('${student._id}')">
                                Contactar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStudentRiskLevel(student) {
        if (student.stats?.highRiskChats > 0) return 'high';
        if (student.stats?.totalChats > 0) return 'medium';
        return 'low';
    }

    getRiskLabel(riskLevel) {
        const labels = {
            'high': 'Alto',
            'medium': 'Medio', 
            'low': 'Bajo',
            'none': 'Sin datos'
        };
        return labels[riskLevel] || 'Sin datos';
    }

    formatLastActivity(dateString) {
        if (!dateString) return 'Nunca';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        
        return date.toLocaleDateString();
    }

    async loadExpertsData() {
        try {
            const response = await this.fetchExperts();
            this.experts = response.data.experts || [];
            this.renderExpertsGrid();

        } catch (error) {
            console.error('Error cargando expertos:', error);
            Utils.showNotification('Error cargando expertos', 'error');
        }
    }

    renderExpertsGrid() {
        const container = document.getElementById('expertsGrid');
        
        if (this.experts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👨‍⚕️</div>
                    <h3>No hay expertos asignados</h3>
                    <p>Agrega expertos psicológicos para atender a los estudiantes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.experts.map(expert => {
            const assignedAreas = this.getExpertAssignedAreas(expert);
            
            return `
                <div class="expert-card">
                    <div class="expert-header">
                        <h3 class="expert-name">${expert.name}</h3>
                        <span class="expert-specialization">${expert.expertProfile.specialization}</span>
                    </div>
                    
                    <div class="expert-info">
                        <div class="expert-field">
                            <span class="label">Email:</span>
                            <span class="value">${expert.email}</span>
                        </div>
                        ${expert.expertProfile.licenseNumber ? `
                        <div class="expert-field">
                            <span class="label">Licencia:</span>
                            <span class="value">${expert.expertProfile.licenseNumber}</span>
                        </div>` : ''}
                        ${expert.expertProfile.yearsOfExperience ? `
                        <div class="expert-field">
                            <span class="label">Experiencia:</span>
                            <span class="value">${expert.expertProfile.yearsOfExperience} años</span>
                        </div>` : ''}
                    </div>
                    
                    ${assignedAreas.length > 0 ? `
                    <div class="expert-assignments">
                        <div class="expert-field">
                            <span class="label">Áreas Asignadas:</span>
                        </div>
                        <div class="assignment-tags">
                            ${assignedAreas.map(area => `
                                <span class="assignment-tag">${area}</span>
                            `).join('')}
                        </div>
                    </div>` : ''}
                    
                    ${expert.expertProfile.bio ? `
                    <div class="expert-bio">
                        <p>${expert.expertProfile.bio}</p>
                    </div>` : ''}
                    
                    <div class="expert-actions">
                        <button class="btn-primary btn-sm" onclick="institutionalAdmin.viewExpertProfile('${expert._id}')">
                            Ver Perfil
                        </button>
                        <button class="btn-secondary btn-sm" onclick="institutionalAdmin.editExpert('${expert._id}')">
                            Editar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getExpertAssignedAreas(expert) {
        const areas = [];
        
        if (expert.expertProfile.assignedPrograms) {
            areas.push(...expert.expertProfile.assignedPrograms.map(p => `📚 ${p.name}`));
        }
        
        if (expert.expertProfile.assignedFaculties) {
            areas.push(...expert.expertProfile.assignedFaculties.map(f => `🏛️ ${f.name}`));
        }
        
        if (expert.expertProfile.assignedCareers) {
            areas.push(...expert.expertProfile.assignedCareers.map(c => `🎓 ${c.name}`));
        }
        
        return areas.slice(0, 3); // Mostrar máximo 3 áreas
    }

    // Métodos para mostrar modales
    showAddProgramModal() {
        document.getElementById('addProgramModal').classList.remove('hidden');
    }

    showAddFacultyModal() {
        document.getElementById('addFacultyModal').classList.remove('hidden');
    }

    showAddCareerModal() {
        this.loadProgramsAndFacultiesForCareer();
        document.getElementById('addCareerModal').classList.remove('hidden');
    }

    showAddExpertModal() {
        this.loadAssignmentOptions();
        document.getElementById('addExpertModal').classList.remove('hidden');
    }

    async loadProgramsAndFacultiesForCareer() {
        const programSelect = document.getElementById('careerProgram');
        const facultySelect = document.getElementById('careerFaculty');

        programSelect.innerHTML = '<option value="">Seleccionar programa...</option>' +
            this.structure.programs.map(p => `<option value="${p._id}">${p.name}</option>`).join('');

        facultySelect.innerHTML = '<option value="">Seleccionar facultad...</option>' +
            this.structure.faculties.map(f => `<option value="${f._id}">${f.name}</option>`).join('');
    }

    async loadAssignmentOptions() {
        const programsContainer = document.getElementById('programAssignments');
        const facultiesContainer = document.getElementById('facultyAssignments');

        programsContainer.innerHTML = this.structure.programs.map(program => `
            <label>
                <input type="checkbox" name="assignedPrograms" value="${program._id}">
                ${program.name}
            </label>
        `).join('');

        facultiesContainer.innerHTML = this.structure.faculties.map(faculty => `
            <label>
                <input type="checkbox" name="assignedFaculties" value="${faculty._id}">
                ${faculty.name}
            </label>
        `).join('');
    }

    // Métodos para manejar formularios
    async handleAddProgram() {
        const formData = {
            name: document.getElementById('programName').value,
            type: document.getElementById('programType').value,
            duration: document.getElementById('programDuration').value,
            description: document.getElementById('programDescription').value,
            institutionId: this.institution._id
        };

        try {
            const response = await fetch(`${apiService.baseURL}/institution/programs`, {
                method: 'POST',
                headers: apiService.getHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    Utils.showNotification('Programa creado exitosamente', 'success');
                    this.hideAllModals();
                    document.getElementById('addProgramForm').reset();
                    await this.loadInstitutionData();
                    await this.loadStructureData();
                }
            }
        } catch (error) {
            console.error('Error creando programa:', error);
            Utils.showNotification('Error creando programa', 'error');
        }
    }

    async handleAddFaculty() {
        const formData = {
            name: document.getElementById('facultyName').value,
            dean: document.getElementById('facultyDean').value,
            contactEmail: document.getElementById('facultyEmail').value,
            institutionId: this.institution._id
        };

        try {
            const response = await fetch(`${apiService.baseURL}/institution/faculties`, {
                method: 'POST',
                headers: apiService.getHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    Utils.showNotification('Facultad creada exitosamente', 'success');
                    this.hideAllModals();
                    document.getElementById('addFacultyForm').reset();
                    await this.loadInstitutionData();
                    await this.loadStructureData();
                }
            }
        } catch (error) {
            console.error('Error creando facultad:', error);
            Utils.showNotification('Error creando facultad', 'error');
        }
    }

    async handleAddCareer() {
        const formData = {
            name: document.getElementById('careerName').value,
            code: document.getElementById('careerCode').value,
            programId: document.getElementById('careerProgram').value,
            facultyId: document.getElementById('careerFaculty').value,
            institutionId: this.institution._id
        };

        try {
            const response = await fetch(`${apiService.baseURL}/institution/careers`, {
                method: 'POST',
                headers: apiService.getHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    Utils.showNotification('Carrera creada exitosamente', 'success');
                    this.hideAllModals();
                    document.getElementById('addCareerForm').reset();
                    await this.loadInstitutionData();
                    await this.loadStructureData();
                }
            }
        } catch (error) {
            console.error('Error creando carrera:', error);
            Utils.showNotification('Error creando carrera', 'error');
        }
    }

    async handleAddExpert() {
        const formData = {
            name: document.getElementById('expertFullName').value,
            email: document.getElementById('expertEmail').value,
            password: document.getElementById('expertPassword').value,
            specialization: document.getElementById('expertSpecialization').value,
            licenseNumber: document.getElementById('expertLicense').value,
            yearsOfExperience: parseInt(document.getElementById('expertExperience').value) || 0,
            bio: document.getElementById('expertBio').value,
            institutionId: this.institution._id,
            assignedPrograms: Array.from(document.querySelectorAll('input[name="assignedPrograms"]:checked')).map(cb => cb.value),
            assignedFaculties: Array.from(document.querySelectorAll('input[name="assignedFaculties"]:checked')).map(cb => cb.value)
        };

        try {
            const response = await fetch(`${apiService.baseURL}/admin/experts`, {
                method: 'POST',
                headers: apiService.getHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    Utils.showNotification('Experto creado exitosamente', 'success');
                    this.hideAllModals();
                    document.getElementById('addExpertForm').reset();
                    await this.loadExpertsData();
                }
            }
        } catch (error) {
            console.error('Error creando experto:', error);
            Utils.showNotification('Error creando experto', 'error');
        }
    }

    // Métodos para configuración
    loadInstitutionSettings() {
        if (!this.institution) return;

        document.getElementById('institutionNameSetting').value = this.institution.name;
        document.getElementById('institutionEmailSetting').value = this.institution.contactEmail;
        document.getElementById('institutionPhoneSetting').value = this.institution.phone || '';
        document.getElementById('institutionCodeSetting').value = this.institution.settings.institutionCode;
        
        if (this.institution.settings.maxUsers) {
            document.getElementById('studentLimit').value = this.institution.settings.maxUsers;
        }
    }

    async saveInstitutionSettings() {
        const settings = {
            name: document.getElementById('institutionNameSetting').value,
            contactEmail: document.getElementById('institutionEmailSetting').value,
            phone: document.getElementById('institutionPhoneSetting').value,
            settings: {
                institutionCode: document.getElementById('institutionCodeSetting').value,
                maxUsers: parseInt(document.getElementById('studentLimit').value) || 100
            }
        };

        try {
            const response = await fetch(`${apiService.baseURL}/institution/institutions/${this.institution._id}`, {
                method: 'PUT',
                headers: apiService.getHeaders(),
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                Utils.showNotification('Configuración guardada exitosamente', 'success');
                await this.loadInstitutionData();
            }
        } catch (error) {
            console.error('Error guardando configuración:', error);
            Utils.showNotification('Error guardando configuración', 'error');
        }
    }

    showSettingsTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar tab seleccionado
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    // Métodos de utilidad
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

    async refreshData() {
        Utils.showNotification('Actualizando datos...', 'info');
        await this.loadInstitutionData();
        await this.loadSectionData(this.currentSection);
        Utils.showNotification('Datos actualizados', 'success');
    }

    // Métodos placeholder para otras funciones
    async loadAnalyticsData() {
        // Cargar datos para analytics
    }

    async loadReportsData() {
        // Cargar datos para reportes
    }

    async loadSettingsData() {
        // Cargar datos para configuración
    }

    viewStudentDetail(studentId) {
        Utils.showNotification(`Viendo detalle del estudiante ${studentId}`, 'info');
    }

    contactStudent(studentId) {
        Utils.showNotification(`Contactando al estudiante ${studentId}`, 'info');
    }

    viewExpertProfile(expertId) {
        Utils.showNotification(`Viendo perfil del experto ${expertId}`, 'info');
    }

    editExpert(expertId) {
        Utils.showNotification(`Editando experto ${expertId}`, 'info');
    }

    editProgram(programId) {
        Utils.showNotification(`Editando programa ${programId}`, 'info');
    }

    manageProgramExperts(programId) {
        Utils.showNotification(`Gestionando expertos del programa ${programId}`, 'info');
    }

    filterStudents(searchTerm) {
        // Implementar filtrado
    }

    filterStudentsByRisk(riskLevel) {
        // Implementar filtrado por riesgo
    }

    generateReport() {
        Utils.showNotification('Generando reporte...', 'info');
    }

    exportReport() {
        Utils.showNotification('Exportando reporte...', 'info');
    }
}

// Inicializar el panel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.institutionalAdmin = new InstitutionalAdmin();
});