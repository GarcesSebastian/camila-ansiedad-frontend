// Servicio para comunicación con la API del backend
class ApiService {
    constructor() {
        this.baseURL = 'https://camila-ansiedad-backend-production.up.railway.app';
        this.token = localStorage.getItem('camila_token');
        this.anonymousId = localStorage.getItem('camila_anonymous_id') || this.generateAnonymousId();
        this.isAuthenticated = !!this.token;
        this.currentUser = this.getCurrentUser();
    }
    
    // Generar ID anónimo único
    generateAnonymousId() {
        const id = 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('camila_anonymous_id', id);
        return id;
    }
    
    // Headers comunes
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Anonymous-Id': this.anonymousId
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    // Método request centralizado - ¡ESTE ES EL QUE FALTA!
    async request(endpoint, method = 'GET', data = null) {
    try {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: method,
            headers: this.getHeaders()
        };

        // Si hay data y no es GET, agregarla al body
        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

       // console.log('📡 Enviando request:', {
         //   url: url,
           // method: method,
           // data: data
       // });

        const response = await fetch(url, config);
        return await this.handleResponse(response);
    } catch (error) {
        console.error('❌ Error en request:', error);
        throw error;
    }
}
    
    // Manejar respuesta de la API
    async handleResponse(response) {
        const data = await response.json();
        
        //console.log('📡 Respuesta API:', {
        ////    url: response.url,
         //   status: response.status,
         //   data: data
       // });
        
        if (!response.ok) {
            // Si es error de límite anónimo
            if (response.status === 403 && data.requiresAuth) {
                throw new Error('LIMIT_REACHED:' + data.message);
            }
            
            // Si es error 401, limpiar el token
            if (response.status === 401) {
                this.token = null;
                localStorage.removeItem('camila_token');
                localStorage.removeItem('camila_user');
                this.isAuthenticated = false;
                this.currentUser = null;
            }
            
            throw new Error(data.message || 'Error en la solicitud');
        }
        
        return data;
    }
    
    // ==================== AUTENTICACIÓN ====================
    
    // Autenticación - Registro
    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(userData)
            });
            
            const data = await this.handleResponse(response);
            
            // Guardar token y usuario
            if (data.data && data.data.token) {
                this.token = data.data.token;
                this.isAuthenticated = true;
                this.currentUser = data.data.user;
                localStorage.setItem('camila_token', this.token);
                localStorage.setItem('camila_user', JSON.stringify(data.data.user));
                
                // Limpiar datos anónimos
                localStorage.removeItem('camila_anonymous_count');
                localStorage.removeItem('camila_anonymous_id');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    }
    
    // Autenticación - Login
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(credentials)
            });
            
            const data = await this.handleResponse(response);
            
            // Guardar token y usuario
            if (data.data && data.data.token) {
                this.token = data.data.token;
                this.isAuthenticated = true;
                this.currentUser = data.data.user;
                localStorage.setItem('camila_token', this.token);
                localStorage.setItem('camila_user', JSON.stringify(data.data.user));
                
                // Limpiar datos anónimos
                localStorage.removeItem('camila_anonymous_count');
                localStorage.removeItem('camila_anonymous_id');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    }
    
    // Autenticación - Logout
    async logout() {
        try {
            if (this.token) {
                const response = await fetch(`${this.baseURL}/api/auth/logout`, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
                
                if (response.ok) {
                    await this.handleResponse(response);
                }
            }
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            // Limpiar datos locales siempre
            this.token = null;
            this.isAuthenticated = false;
            this.currentUser = null;
            localStorage.removeItem('camila_token');
            localStorage.removeItem('camila_user');
        }
    }
    
    // Obtener perfil de usuario
    async getProfile() {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/profile`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            const data = await this.handleResponse(response);
            
            // Actualizar usuario actual
            if (data.data && data.data.user) {
                this.currentUser = data.data.user;
                localStorage.setItem('camila_user', JSON.stringify(data.data.user));
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    }
    
    // Registro de administrador institucional (solo superadmin)
    async registerInstitutionalAdmin(adminData) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/register-institutional-admin`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(adminData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // ==================== CHAT Y MENSAJES ====================
    
    // Enviar mensaje a Camila (soporta anónimos)
async sendMessage(message, chatId = null) {
    try {
        const data = { message };
        if (chatId) {
            data.chatId = chatId;
        }
        
        // Para usuarios anónimos, agregar anonymousId
        if (!this.isAuthenticated) {
            let anonymousId = localStorage.getItem('camila_anonymous_id');
            if (!anonymousId) {
                anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('camila_anonymous_id', anonymousId);
            }
            data.anonymousId = anonymousId;
        }

       // console.log('📤 Enviando mensaje con datos:', data);
        
        // ✅ USAR MÉTODO POST EXPLÍCITAMENTE
        const response = await this.request('/api/chat/message', 'POST', data);
        return response;
    } catch (error) {
        console.error('Error en sendMessage:', error);
        throw error;
    }
}
    
    // Obtener chats del usuario (solo autenticados)
    async getChats(page = 1, limit = 20) {
    try {
        //console.log('📂 Solicitando chats...', {
          //  authenticated: this.isAuthenticated,
            //anonymousId: this.anonymousId
        //});
        
        // Incluir anonymousId en la query string para usuarios anónimos
        let url = `${this.baseURL}/api/chat/chats?page=${page}&limit=${limit}`;
        if (!this.isAuthenticated) {
            url += `&anonymousId=${this.anonymousId}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });

        const result = await this.handleResponse(response);
        // console.log('📥 Chats recibidos:', result.data?.chats?.length || 0);
        return result;
        
    } catch (error) {
        console.error('❌ Error en getChats:', error);
        throw error;
    }
}
    
    // Obtener chat específico (solo autenticados)
    async getChat(chatId) {
    return this.request(`/api/chat/chats/${chatId}`, 'GET');
}
    
    // Eliminar chat (solo autenticados)
    async deleteChat(chatId) {
    return this.request(`/api/chat/chats/${chatId}`, 'DELETE'); // ✅ Usar :id
}
    
    // Obtener métricas de ansiedad del usuario
    async getAnxietyMetrics() {
        try {
            const response = await fetch(`${this.baseURL}/api/chat/metrics`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // ==================== ADMINISTRACIÓN ====================
    
    // Crear usuario experto
    async createExpert(expertData) {
    try {
        const response = await fetch(`${this.baseURL}/api/admin/experts`, { // ✅ AGREGAR /api/
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(expertData)
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

async getExperts(institutionId = null) {
    try {
        let url = `${this.baseURL}/api/admin/experts`;
        if (institutionId) {
            url += `?institutionId=${institutionId}`;
        }
        
        // console.log('🔍 Fetching experts from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
            credentials: 'include'
        });
        
        // console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // console.log('📊 Experts data received:', data);
        
        return data;
        
    } catch (error) {
        console.error('❌ Error en getExperts:', error);
        throw error;
    }
}

async getUsersByInstitution(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        
        // Agregar filtros a los parámetros
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                queryParams.append(key, filters[key]);
            }
        });
        
        const url = `${this.baseURL}/api/admin/users?${queryParams.toString()}`; // ✅ AGREGAR /api/
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}
    
    // Obtener análisis detallado de un usuario
    async getUserAnalysis(userId, startDate = null, endDate = null) {
        try {
            let url = `${this.baseURL}/api/admin/users/${userId}/analysis`;
            
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // Agregar recomendación
    async addRecommendation(recommendationData) {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/recommendations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(recommendationData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // Generar reporte institucional
    async generateInstitutionalReport(reportData) {
        try {
            const queryParams = new URLSearchParams();
            
            Object.keys(reportData).forEach(key => {
                if (reportData[key]) {
                    queryParams.append(key, reportData[key]);
                }
            });
            
            const url = `${this.baseURL}/api/admin/reports/institutional?${queryParams.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // ==================== INSTITUCIONES ====================
    
    // Crear nueva institución
    async createInstitution(institutionData) {
    try {
        const response = await fetch(`${this.baseURL}/api/institution/institutions`, { // ✅ AGREGAR /api/
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(institutionData)
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}
    
    // Obtener todas las instituciones
    async getInstitutions() {
    try {
        const response = await fetch(`${this.baseURL}/api/institution/institutions`, { // ✅ AGREGAR /api/
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

async getInstitutionStructure(institutionId) {
    try {
        const response = await fetch(`${this.baseURL}/api/institution/institutions/${institutionId}/structure`, { // ✅ AGREGAR /api/
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}
    
    // Actualizar institución
    async updateInstitution(institutionId, institutionData) {
        try {
            const response = await fetch(`${this.baseURL}/api/institution/institutions/${institutionId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(institutionData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // Crear programa
    async createProgram(programData) {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/programs`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(programData)
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

async updateProgram(programId, programData) {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/programs/${programId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(programData)
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

// Eliminar programa
async deleteProgram(programId) {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/programs/${programId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

// Obtener programas del experto
async getMyPrograms() {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/programs`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}
    
    // Crear facultad
    async createFaculty(facultyData) {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/faculties`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(facultyData)
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

    async updateFaculty(facultyId, facultyData) {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/faculties/${facultyId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(facultyData)
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

async deleteFaculty(facultyId) {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/faculties/${facultyId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}

async getMyFaculties() {
    try {
        const response = await fetch(`${this.baseURL}/api/expert/faculties`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}
    
    // Crear carrera
    async createCareer(careerData) {
        try {
            const response = await fetch(`${this.baseURL}/api/institution/careers`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(careerData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // ==================== EXPERT ENDPOINTS ====================
    
    // Obtener estadísticas del dashboard del experto
    async getExpertDashboardStats(days = 30) {
        try {
            const response = await fetch(`${this.baseURL}/api/expert/dashboard/stats?days=${days}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Crear paciente
    async createPatient(patientData) {
        try {
            const response = await fetch(`${this.baseURL}/api/expert/patients`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(patientData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Obtener pacientes del experto
    async getMyPatients(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/api/expert/patients?${queryParams}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Obtener estructura institucional para formularios
    async getExpertInstitutionStructure(institutionId) {
        try {
            const response = await fetch(`${this.baseURL}/api/expert/institution/structure/${institutionId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Obtener análisis de un paciente
    async getPatientAnalysis(patientId) {
        try {
            const response = await fetch(`${this.baseURL}/api/expert/patients/analysis/${patientId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Crear recomendación para paciente
    async createRecommendation(recommendationData) {
        try {
            const response = await fetch(`${this.baseURL}/api/expert/recommendations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(recommendationData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Obtener recomendaciones del experto
    async getMyRecommendations(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/api/expert/recommendations?${queryParams}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Actualizar recomendación
    async updateRecommendation(recommendationId, updateData) {
        try {
            const response = await fetch(`${this.baseURL}/api/expert/recommendations/${recommendationId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(updateData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // ==================== USER ENDPOINTS ====================
    
    async getUserRecommendations(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });
            
            const url = `${this.baseURL}/api/users/recommendations?${queryParams.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Obtener estadísticas de recomendaciones
    async getUserRecommendationStats() {
        try {
            const response = await fetch(`${this.baseURL}/api/users/recommendations/stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Actualizar estado de recomendación
    async updateRecommendationStatus(recommendationId, updateData) {
        try {
            const response = await fetch(`${this.baseURL}/api/users/recommendations/${recommendationId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(updateData)
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }

    // Completar acción de recomendación
    async completeRecommendationAction(recommendationId, actionIndex) {
        try {
            const response = await fetch(`${this.baseURL}/api/users/recommendations/${recommendationId}/actions/${actionIndex}/complete`, {
                method: 'PUT',
                headers: this.getHeaders()
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            throw error;
        }
    }
    
    // ==================== UTILIDADES ====================
    
    // Verificar salud de la API
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`);
            return await this.handleResponse(response);
        } catch (error) {
            throw new Error('No se puede conectar con el servidor');
        }
    }
    
    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.token;
    }
    
    // Obtener usuario actual
    getCurrentUser() {
        const userStr = localStorage.getItem('camila_user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    // Verificar rol del usuario
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
    
    // Verificar si es superadmin
    isSuperAdmin() {
        return this.hasRole('superadmin');
    }
    
    // Verificar si es admin institucional
    isInstitutionalAdmin() {
        return this.hasRole('institutional_admin');
    }
    
    // Verificar si es experto
    isExpert() {
        return this.hasRole('expert');
    }
    
    // Verificar si es usuario regular
    isRegularUser() {
        return this.hasRole('user');
    }
    
    // Redirigir según el rol del usuario
    redirectBasedOnRole() {
        if (!this.currentUser) {
            return 'index.html';
        }
        
        switch (this.currentUser.role) {
            case 'superadmin':
                return 'admin-panel.html';
            case 'institutional_admin':
                return 'institutional-admin.html';
            case 'expert':
                return 'expert-panel.html';
            case 'user':
                return 'index.html'; // Usuarios normales van a index.html
            default:
                return 'index.html';
        }
    }
    
    // Navegar a la página correspondiente según el rol
    navigateToRolePage() {
        const targetPage = this.redirectBasedOnRole();
        if (window.location.pathname.endsWith(targetPage)) {
            return; // Ya está en la página correcta
        }
        
        window.location.href = targetPage;
    }
    
    // Actualizar token
    setToken(token) {
        this.token = token;
        this.isAuthenticated = true;
        localStorage.setItem('camila_token', token);
    }
    
    // Actualizar estado de autenticación
    updateAuthStatus() {
        this.token = localStorage.getItem('camila_token');
        this.isAuthenticated = !!this.token;
        this.currentUser = this.getCurrentUser();
    }
    
    // Verificar y redirigir automáticamente
    checkAndRedirect() {
        if (this.isAuthenticated && this.currentUser) {
            this.navigateToRolePage();
        }
    }
    
    // Obtener estadísticas rápidas para dashboard
    async getDashboardStats() {
        try {
            // Para expertos - usar el nuevo endpoint
            if (this.isExpert()) {
                const statsResponse = await this.getExpertDashboardStats();
                return statsResponse.data?.stats || {};
            }
            
            // Para superadmin
            if (this.isSuperAdmin()) {
                const [institutionsRes, usersRes, expertsRes] = await Promise.all([
                    this.getInstitutions(),
                    this.getUsersByInstitution(),
                    this.getExperts()
                ]);
                
                return {
                    totalInstitutions: institutionsRes.data.institutions?.length || 0,
                    totalUsers: usersRes.data.users?.length || 0,
                    totalExperts: expertsRes.data.experts?.length || 0
                };
            }
            
            // Para admin institucional
            if (this.isInstitutionalAdmin() && this.currentUser.institution) {
                const [usersRes, expertsRes] = await Promise.all([
                    this.getUsersByInstitution({ institutionId: this.currentUser.institution._id }),
                    this.getExperts(this.currentUser.institution._id)
                ]);
                
                const users = usersRes.data.users || [];
                const highRiskUsers = users.filter(user => 
                    user.stats?.highRiskChats > 0
                ).length;
                
                return {
                    totalStudents: users.length,
                    totalExperts: expertsRes.data.experts?.length || 0,
                    highRiskUsers: highRiskUsers,
                    totalConversations: users.reduce((sum, user) => sum + (user.stats?.totalChats || 0), 0)
                };
            }
            
            return {};
            
        } catch (error) {
            console.error('Error obteniendo estadísticas del dashboard:', error);
            return {};
        }
    }

    async getWeeklyPatientReports(params = {}) {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/api/expert/reports/weekly?${queryParams}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    } catch (error) {
        throw error;
    }
}


async addKeyword(keywordData) {
    try {
        // ✅ CORREGIDO: Pasar parámetros correctamente
        const response = await this.request('/api/expert/keywords', 'POST', keywordData);
        return response;
    } catch (error) {
        console.error('Error adding keyword:', error);
        throw error;
    }
}

async getMyKeywords(symptom = null) {
    try {
        // ✅ CORREGIDO: Pasar parámetros correctamente
        let url = '/api/expert/keywords';
        if (symptom) {
            url += `?symptom=${symptom}`;
        }
        const response = await this.request(url, 'GET');
        return response;
    } catch (error) {
        console.error('Error getting keywords:', error);
        throw error;
    }
}

async updateKeyword(keywordId, updateData) {
    try {
        // ✅ CORREGIDO: Pasar parámetros correctamente
        const response = await this.request(`/api/expert/keywords/${keywordId}`, 'PUT', updateData);
        return response;
    } catch (error) {
        console.error('Error updating keyword:', error);
        throw error;
    }
}

async deleteKeyword(keywordId) {
    try {
        // ✅ CORREGIDO: Pasar parámetros correctamente
        const response = await this.request(`/api/expert/keywords/${keywordId}`, 'DELETE');
        return response;
    } catch (error) {
        console.error('Error deleting keyword:', error);
        throw error;
    }
}

// ==================== DOCUMENTOS ====================

async uploadDocument(documentData) {
    try {
        // ✅ CORREGIDO: Pasar parámetros correctamente
        const response = await this.request('/api/expert/documents', 'POST', documentData);
        return response;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
}

async getMyDocuments(category = null) {
    try {
        // ✅ CORREGIDO: Pasar parámetros correctamente
        let url = '/api/expert/documents';
        if (category) {
            url += `?category=${category}`;
        }
        const response = await this.request(url, 'GET');
        return response;
    } catch (error) {
        console.error('Error getting documents:', error);
        throw error;
    }
}

async deleteDocument(documentId) {
    try {
        // ✅ CORREGIDO: Pasar parámetros correctamente
        const response = await this.request(`/api/expert/documents/${documentId}`, 'DELETE');
        return response;
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
}

    async downloadDocument(documentId) {
        try {
            const response = await this.request(`/api/expert/documents/${documentId}/download`, {
                method: 'PATCH'
            });
            return response;
        } catch (error) {
            console.error('Error downloading document:', error);
            throw error;
        }
    }

    // ✅ NUEVO: Analizar conversación con palabras clave
async analyzeConversationWithKeywords(data) {
    return this.request('/api/expert/analyze/conversation', 'POST', data);
}

// ✅ NUEVO: Obtener estadísticas de palabras clave
async getKeywordStats() {
    return this.request('/api/expert/keywords/stats', 'GET');
}

// ✅ NUEVO: Probar palabra clave
async testKeyword(data) {
    return this.request('/api/expert/keywords/test', 'POST', data);
}

async getPatientRiskHistory(patientId) {
    return this.request(`/api/expert/patients/${patientId}/risk-history`, 'GET');
}

}

// Instancia global del servicio API
window.apiService = new ApiService();

// Verificación automática al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar estado de autenticación
    apiService.updateAuthStatus();
    
    // Si el usuario está autenticado, verificar redirección
    if (apiService.isAuthenticated) {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            apiService.checkAndRedirect();
        }, 100);
    }
    
    // Agregar detección de cambios en autenticación (para múltiples pestañas)
    window.addEventListener('storage', function(e) {
        if (e.key === 'camila_token' || e.key === 'camila_user') {
            apiService.updateAuthStatus();
            apiService.checkAndRedirect();
        }
    });
});
