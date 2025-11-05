// Aplicación principal - Punto de entrada
class CamilaApp {
    constructor() {
        this.authModal = document.getElementById('authModal');
        this.mainApp = document.getElementById('mainApp');
        this.termsModal = document.getElementById('termsModal'); // ✅ NUEVO
        this.chatManager = null;
        this.isInitialized = false;
        this.currentUser = null;
        this.currentForm = 'login'; // 'login' o 'register'
    }
    
    // Inicializar la aplicación
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Verificar autenticación
            await this.checkAuthentication();
            
            // Mostrar aplicación principal directamente (ahora permite anónimos)
            this.showMainApp();
            
            // Configurar event listeners
            this.setupAuthListeners();
            
            // Configurar manejo de errores
            this.setupErrorHandling();
            
            //console.log('🚀 Camila - Aplicación inicializada correctamente');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.showError('Error al cargar la aplicación. Por favor, recarga la página.');
        }
    }
    
    // Verificar autenticación (modificado para permitir anónimos)
    async checkAuthentication() {
        if (apiService.isAuthenticated) {
            try {
                await apiService.getProfile();
                this.currentUser = apiService.getCurrentUser();
            } catch (error) {
                console.log('Token inválido, continuando como anónimo');
                await apiService.logout();
                this.currentUser = null;
            }
        } else {
            this.currentUser = null;
        }
    }
    
    // Configurar event listeners de autenticación
    setupAuthListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // Switch between forms - CORREGIDO
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // ✅ NUEVO: Términos y condiciones
        document.getElementById('showTermsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.currentForm = 'register';
            this.showTermsModal();
        });

        document.getElementById('showTermsLinkLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.currentForm = 'login';
            this.showTermsModal();
        });

        // Cerrar modales
        document.getElementById('closeAuthModal').addEventListener('click', () => {
            this.hideAuthModal();
        });

        document.getElementById('closeTermsModal').addEventListener('click', () => {
            this.hideTermsModal();
        });

        document.getElementById('closeTermsBtn').addEventListener('click', () => {
            this.hideTermsModal();
        });

        document.getElementById('acceptTermsModal').addEventListener('click', () => {
            this.acceptTerms();
        });

        // Cerrar modales al hacer clic fuera
        this.authModal.addEventListener('click', (e) => {
            if (e.target === this.authModal) {
                this.hideAuthModal();
            }
        });

        this.termsModal.addEventListener('click', (e) => {
            if (e.target === this.termsModal) {
                this.hideTermsModal();
            }
        });
    }
    
    // Manejar login
    async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const acceptedTerms = document.getElementById('loginAcceptTerms').checked;

    if (!email || !password) {
        this.showError('Por favor completa todos los campos');
        return;
    }

    if (!Utils.isValidEmail(email)) {
        this.showError('Por favor ingresa un email válido');
        return;
    }

    // ✅ VALIDAR TÉRMINOS Y CONDICIONES EN LOGIN
    if (!acceptedTerms) {
        this.showError('Debes aceptar los términos y condiciones');
        document.getElementById('loginTermsError').textContent = 'Debes aceptar los términos y condiciones';
        document.getElementById('loginTermsError').style.display = 'block';
        return;
    } else {
        document.getElementById('loginTermsError').style.display = 'none';
    }

    try {
        this.setLoadingState(true);

        console.log('🔐 Intentando login...', { email, acceptedTerms });

        // ✅ ENVIAR acceptedTerms como viene del checkbox
        const response = await apiService.login({ 
            email, 
            password, 
            acceptedTerms: acceptedTerms // ✅ Enviar el valor real del checkbox
        });
        
        this.currentUser = response.data.user;
        
        console.log('✅ Login exitoso:', { 
            user: this.currentUser.name,
            acceptedTerms: this.currentUser.acceptedTerms 
        });

        this.showSuccess('¡Bienvenido de nuevo!');
        this.hideAuthModal();

        // Redirigir según el rol del usuario
        this.redirectByRole(this.currentUser.role);

    } catch (error) {
        console.error('❌ Error en login:', error);
        this.showError(error.message);
    } finally {
        this.setLoadingState(false);
    }
}

    // Redirigir usuario según su rol
    redirectByRole(role) {
        switch(role) {
            case 'superadmin':
                window.location.href = './admin-panel.html';
                break;
            case 'expert':
                window.location.href = './expert-panel.html';
                break;
            case 'institutional_admin':
                window.location.href = './institutional-admin.html';
                break;
            default:
                // Usuario normal - actualizar chat manager y UI
                if (this.chatManager) {
                    this.chatManager.onUserLogin();
                }
                this.updateUserInfo();
                break;
        }
    }
    
    // Manejar registro
    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const age = document.getElementById('registerAge').value;
        const password = document.getElementById('registerPassword').value;
        const acceptedTerms = document.getElementById('acceptTerms').checked; // ✅ NUEVO
        
        if (!name || !email || !password) {
            this.showError('Por favor completa los campos obligatorios');
            return;
        }
        
        if (!Utils.isValidEmail(email)) {
            this.showError('Por favor ingresa un email válido');
            return;
        }
        
        if (password.length < 6) {
            this.showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // ✅ VALIDAR TÉRMINOS Y CONDICIONES
        if (!acceptedTerms) {
            this.showError('Debes aceptar los términos y condiciones');
            document.getElementById('termsError').textContent = 'Debes aceptar los términos y condiciones';
            document.getElementById('termsError').style.display = 'block';
            return;
        } else {
            document.getElementById('termsError').style.display = 'none';
        }
        
        try {
            this.setLoadingState(true);
            
            const userData = { name, email, password, acceptedTerms: true }; // ✅ Incluir términos
            if (age) userData.age = parseInt(age);
            
            const response = await apiService.register(userData);
            this.currentUser = response.data.user;
            
            this.showSuccess('¡Cuenta creada exitosamente!');
            this.hideAuthModal();
            
            // Actualizar chat manager
            if (this.chatManager) {
                this.chatManager.onUserLogin();
            }
            
            // Actualizar UI
            this.updateUserInfo();
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    // Manejar logout
    async handleLogout() {
        try {
            await apiService.logout();
            this.currentUser = null;
            this.showSuccess('Sesión cerrada exitosamente');

            // Actualizar UI
            this.updateUserInfo();

            // Actualizar botones de auth y ocultar historial
            if (this.chatManager) {
                this.chatManager.updateAuthButtons();
                this.chatManager.startNewChat();
            }

        } catch (error) {
            console.error('Error en logout:', error);
            // Forzar logout incluso si hay error
            this.currentUser = null;
            this.updateUserInfo();

            if (this.chatManager) {
                this.chatManager.updateAuthButtons();
                this.chatManager.startNewChat();
            }
        }
    }
    
    // Mostrar formulario de registro - CORREGIDO
    showRegisterForm() {
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768 && this.chatManager) {
            this.chatManager.closeMobileSidebar();
        }

        // Primero mostrar el modal si está oculto
        this.authModal.classList.remove('hidden');

        // Cambiar a formulario de registro
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registerForm').classList.add('active');
        
        this.currentForm = 'register';
    }

    // Mostrar formulario de login - CORREGIDO
    showLoginForm() {
        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768 && this.chatManager) {
            this.chatManager.closeMobileSidebar();
        }

        // Primero mostrar el modal si está oculto
        this.authModal.classList.remove('hidden');

        // Cambiar a formulario de login
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
        
        this.currentForm = 'login';
    }
    
    // Mostrar modal de autenticación (siempre muestra login por defecto) - CORREGIDO
    showAuthModal() {
        this.authModal.classList.remove('hidden');
        this.showLoginForm(); // Mostrar login por defecto
    }
    
    // Ocultar modal de autenticación
    hideAuthModal() {
        this.authModal.classList.add('hidden');
        
        // Limpiar formularios
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        
        // Limpiar errores
        document.getElementById('loginTermsError').style.display = 'none';
        document.getElementById('termsError').style.display = 'none';
    }
    
    // Mostrar aplicación principal
    showMainApp() {
        this.authModal.classList.add('hidden');
        this.mainApp.classList.remove('hidden');
        
        // Actualizar información del usuario si está autenticado
        this.updateUserInfo();
        
        // Inicializar chat manager si no existe
        if (!this.chatManager) {
            this.chatManager = new ChatManager();
            this.chatManager.init();
        }
    }
    
    // Actualizar información del usuario en la UI
    updateUserInfo() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.currentUser) {
            userAvatar.textContent = Utils.generateAvatar(this.currentUser.name);
            userName.textContent = this.currentUser.name;
            logoutBtn.style.display = 'block';
        } else {
            userAvatar.textContent = '?';
            userName.textContent = 'Invitado';
            logoutBtn.style.display = 'none';
        }
    }
    
    // Establecer estado de carga
    setLoadingState(loading) {
        const loginButton = document.querySelector('#loginForm .btn-primary');
        const registerButton = document.querySelector('#registerForm .btn-primary');
        
        if (loginButton) {
            loginButton.disabled = loading;
            loginButton.textContent = loading ? 'Cargando...' : 'Iniciar Sesión';
        }
        
        if (registerButton) {
            registerButton.disabled = loading;
            registerButton.textContent = loading ? 'Cargando...' : 'Crear Cuenta';
        }
    }
    
    // Configurar manejo de errores
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Error global:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rechazada no manejada:', event.reason);
            event.preventDefault();
        });
    }
    
    // Mostrar error
    showError(message) {
        Utils.showNotification(message, 'error');
    }
    
    // Mostrar éxito
    showSuccess(message) {
        Utils.showNotification(message, 'success');
    }

    // ✅ NUEVO: Mostrar modal de términos
    async showTermsModal() {
    try {
        // Cargar términos desde el backend (usando puerto 5001)
        const backendUrl = 'http://localhost:5001'; // ✅ CORREGIDO: Puerto del backend
        const response = await fetch(`${backendUrl}/api/auth/terms`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('termsContent').innerHTML = data.data.content;
        } else {
            document.getElementById('termsContent').innerHTML = '<p>Error al cargar los términos y condiciones.</p>';
        }
    } catch (error) {
        console.error('❌ Error cargando términos:', error);
        document.getElementById('termsContent').innerHTML = `
            <div class="error-message">
                <p><strong>Error de conexión:</strong> No se pudieron cargar los términos y condiciones.</p>
                <p>Por favor, verifica que el servidor esté funcionando en el puerto 5001.</p>
                <p>Detalles: ${error.message}</p>
            </div>
        `;
    }
    
    this.termsModal.classList.remove('hidden');
}

    // ✅ NUEVO: Ocultar modal de términos
    hideTermsModal() {
        this.termsModal.classList.add('hidden');
    }

    // ✅ NUEVO: Aceptar términos desde el modal
    acceptTerms() {
        if (this.currentForm === 'register') {
            document.getElementById('acceptTerms').checked = true;
            document.getElementById('termsError').style.display = 'none';
        } else if (this.currentForm === 'login') {
            document.getElementById('loginAcceptTerms').checked = true;
            document.getElementById('loginTermsError').style.display = 'none';
        }
        
        this.hideTermsModal();
        this.showSuccess('Términos y condiciones aceptados');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new CamilaApp();
    app.init();
    window.app = app; // Hacer accesible globalmente
});