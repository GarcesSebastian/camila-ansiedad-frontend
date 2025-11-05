// Gestión de la interfaz de chat y mensajes
class ChatManager {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatHistory = document.getElementById('chatHistory');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.authModal = document.getElementById('authModal');
        this.mainApp = document.getElementById('mainApp');
        
        this.currentChat = {
            id: null,
            messages: [],
            isAnonymous: true
        };
        
        this.isWaitingForResponse = false;
        this.isStreamingResponse = false;
        this.anonymousMessageCount = parseInt(localStorage.getItem('camila_anonymous_count') || '0');
        this.maxAnonymousMessages = 5;
    }
    
    // Inicializar el chat
    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.loadChatHistory();
        this.autoResizeTextarea();
        this.showMessageCounter();
        this.updateAuthButtons();
    }
    
    // Configurar event listeners
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Ejemplos de preguntas
        document.querySelectorAll('.example-card').forEach(card => {
            card.addEventListener('click', () => {
                const exampleText = card.getAttribute('data-example');
                this.messageInput.value = exampleText;
                this.sendMessage();
            });
        });
        
        // Nuevo chat
        this.newChatBtn.addEventListener('click', () => {
            this.startNewChat();
        });
    }
    
    // Configurar menú móvil (hamburguesa)
    setupMobileMenu() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (!hamburgerBtn || !sidebar || !sidebarOverlay) return;

        // Guardar referencias para usar en otras funciones
        this.hamburgerBtn = hamburgerBtn;
        this.sidebar = sidebar;
        this.sidebarOverlay = sidebarOverlay;

        // Toggle sidebar con botón hamburguesa
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });

        // Cerrar sidebar al hacer clic en el overlay
        sidebarOverlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });

        // Cerrar sidebar al hacer clic en "Nueva conversación" en móvil
        this.newChatBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                this.closeMobileSidebar();
            }
        });

        // Cerrar sidebar al hacer clic en botones de auth
        const loginBtn = document.querySelector('.login-btn');
        const registerBtn = document.querySelector('.register-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileSidebar();
                }
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileSidebar();
                }
            });
        }
    }

    // Cerrar sidebar en móvil
    closeMobileSidebar() {
        if (this.sidebar && this.sidebarOverlay && this.hamburgerBtn) {
            this.sidebar.classList.remove('active');
            this.sidebarOverlay.classList.remove('active');
            this.hamburgerBtn.classList.remove('active');
        }
    }

    // Auto-resize del textarea
    autoResizeTextarea() {
        this.messageInput.addEventListener('input', () => {
            Utils.autoResizeTextarea(this.messageInput);
        });
    }
    
    // Actualizar botones de autenticación en la sidebar
    // Actualizar botones de autenticación en la sidebar
updateAuthButtons() {
    const sidebarHeader = document.querySelector('.sidebar-header');

    // Remover botones existentes si hay
    const existingAuthButtons = document.getElementById('authButtons');
    if (existingAuthButtons) {
        existingAuthButtons.remove();
    }

    // Mostrar/ocultar botón "Nueva conversación" según autenticación
    if (this.newChatBtn) {
        if (apiService.isAuthenticated) {
            this.newChatBtn.style.display = 'flex';
        } else {
            this.newChatBtn.style.display = 'none';
        }
    }

    // Mostrar/ocultar historial según autenticación
    const chatHistory = document.getElementById('chatHistory');
    if (chatHistory) {
        if (apiService.isAuthenticated) {
            chatHistory.style.display = 'block';
        } else {
            chatHistory.style.display = 'none';
        }
    }

    if (!apiService.isAuthenticated) {
        const authButtonsHtml = `
            <div class="auth-buttons" id="authButtons">
                <button class="auth-btn login-btn" onclick="app.showLoginForm()">
                    <span>🔐</span>
                    Iniciar Sesión
                </button>
                <button class="auth-btn register-btn" onclick="app.showRegisterForm()">
                    <span>📝</span>
                    Registrarse
                </button>
            </div>
        `;

        const userInfo = document.querySelector('.user-info');
        userInfo.insertAdjacentHTML('afterend', authButtonsHtml);
    }
}
    
    // Mostrar contador de mensajes de prueba
    showMessageCounter() {
        if (apiService.isAuthenticated) {
            // Ocultar contador si está autenticado
            const counter = document.getElementById('messageCounter');
            if (counter) counter.style.display = 'none';
            return;
        }
        
        const remaining = this.maxAnonymousMessages - this.anonymousMessageCount;
        let counter = document.getElementById('messageCounter');
        
        if (!counter) {
            counter = this.createMessageCounter();
        }
        
        counter.innerHTML = `
            <div class="counter-content">
                <span class="counter-icon">🎯</span>
                <span class="counter-text">Chats de prueba: <strong>${remaining}/5</strong></span>
                ${remaining === 0 ? '<span class="counter-warning">¡Regístrate para más!</span>' : ''}
            </div>
        `;
        
        counter.className = `message-counter ${remaining <= 2 ? 'warning' : ''} ${remaining === 0 ? 'limit-reached' : ''}`;
        counter.style.display = 'block';
    }
    
    // Crear contador de mensajes
    createMessageCounter() {
        const counter = document.createElement('div');
        counter.id = 'messageCounter';
        counter.className = 'message-counter';
        
        const inputContainer = document.querySelector('.input-container');
        inputContainer.parentNode.insertBefore(counter, inputContainer);
        
        return counter;
    }
    
    // Enviar mensaje con streaming
async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isWaitingForResponse || this.isStreamingResponse) return;
    
    // Verificar límite para usuarios anónimos
    if (!apiService.isAuthenticated && this.anonymousMessageCount >= this.maxAnonymousMessages) {
        this.showAuthPrompt();
        return;
    }
    
    // Ocultar pantalla de bienvenida si es la primera vez
    this.hideWelcomeScreen();
    
    // Añadir mensaje del usuario
    this.addMessage('user', message);
    this.messageInput.value = '';
    Utils.autoResizeTextarea(this.messageInput);
    
    // Incrementar contador anónimo
    if (!apiService.isAuthenticated) {
        this.anonymousMessageCount++;
        localStorage.setItem('camila_anonymous_count', this.anonymousMessageCount.toString());
        this.showMessageCounter();
    }
    
    // Mostrar indicador de escritura
    this.showTypingIndicator();
    
    try {
        // ✅ CORRECCIÓN: Pasar el chatId actual correctamente
        const requestData = {
            message: message,
            chatId: this.currentChat.id
        };
        
        // ✅ CORRECCIÓN: Para usuarios anónimos, agregar anonymousId
        if (!apiService.isAuthenticated) {
            let anonymousId = localStorage.getItem('camila_anonymous_id');
            if (!anonymousId) {
                anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('camila_anonymous_id', anonymousId);
            }
            requestData.anonymousId = anonymousId;
        }

      //  console.log('📤 Enviando mensaje con datos:', requestData);
        
        // Enviar mensaje a la API
        const response = await apiService.sendMessage(message, this.currentChat.id);
        
        this.hideTypingIndicator();
        
        // ✅ CORRECCIÓN MEJORADA: Extraer el texto de respuesta
        let responseText = '';
        let riskLevel = null;
        
        if (response && response.data) {
          //  console.log('📥 Respuesta completa recibida:', response);
            
            // Para el endpoint /api/chat/message
            if (response.data.response) {
                responseText = response.data.response;
            } 
            // Si viene en data.chat
            else if (response.data.chat && response.data.chat.messages) {
                const lastMessage = response.data.chat.messages[response.data.chat.messages.length - 1];
                responseText = lastMessage.content;
            }
            // Fallback
            else {
                responseText = "Lo siento, no pude procesar la respuesta. Por favor, intenta de nuevo.";
            }
        }
        
        // Validar que tenemos texto para mostrar
        if (!responseText || responseText.trim() === '') {
            responseText = "Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo.";
        }
        
        // Mostrar respuesta con efecto de escritura
        await this.streamResponse(responseText, riskLevel);
        
        // ✅✅✅ CORRECCIÓN CRÍTICA: Actualizar chat actual y recargar historial
        if (response.data.chat) {
            this.currentChat.id = response.data.chat._id || response.data.chat.id;
            this.currentChat.isAnonymous = response.data.chat.isAnonymous;
            
            //console.log('💾 Chat actualizado:', {
              //  id: this.currentChat.id,
               // title: response.data.chat.title,
               // isAnonymous: this.currentChat.isAnonymous,
               // userId: response.data.chat.userId
           // });
        }

        // ✅✅✅ RECARGAR HISTORIAL INMEDIATAMENTE con pequeño delay
        setTimeout(async () => {
           // console.log('🔄 Recargando historial después de mensaje...');
            await this.loadChatHistory();
        }, 500);
        
    } catch (error) {
        this.hideTypingIndicator();
        
        if (error.message.startsWith('LIMIT_REACHED:')) {
            this.showAuthPrompt(error.message.replace('LIMIT_REACHED:', ''));
            this.anonymousMessageCount = this.maxAnonymousMessages;
            localStorage.setItem('camila_anonymous_count', this.anonymousMessageCount.toString());
            this.showMessageCounter();
        } else {
            this.showError('Error: ' + error.message);
        }
        console.error('Error sending message:', error);
    }
}
    
    // Añadir mensaje al chat
    addMessage(role, content, riskLevel = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `avatar ${role}-avatar`;
        avatarDiv.textContent = role === 'user' 
            ? (apiService.isAuthenticated ? Utils.generateAvatar(apiService.getCurrentUser()?.name) : 'Tú') 
            : 'C';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.processContent(content, role, riskLevel);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Guardar en el chat actual
        this.currentChat.messages.push({ role, content });
    }
    
    // Mostrar respuesta con efecto de escritura (streaming)
    async streamResponse(content, riskLevel = null) {
    // Validación crítica del contenido
    if (!content || typeof content !== 'string') {
        console.error('❌ Contenido inválido para streamResponse:', content);
        content = "Lo siento, hubo un problema al procesar la respuesta.";
    }
    
    this.isStreamingResponse = true;
    this.sendButton.disabled = true;
    this.messageInput.disabled = true;

    // Crear elemento de mensaje vacío
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar assistant-avatar';
    avatarDiv.textContent = 'C';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content streaming-content';

    // Agregar indicador de riesgo si existe
    if (riskLevel) {
        const riskText = Utils.getRiskLevelText(riskLevel);
        const riskClass = Utils.getRiskLevelClass(riskLevel);
        contentDiv.innerHTML = `<div class="risk-level ${riskClass}">${riskText}</div>`;
    }

    const textElement = document.createElement('div');
    textElement.className = 'streaming-text';
    contentDiv.appendChild(textElement);

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    this.chatContainer.appendChild(messageDiv);

    // Efecto de escritura mejorado
    const words = content.split(' ');
    let currentIndex = 0;
    const speed = 40; // milisegundos entre grupos de palabras
    const wordsPerBatch = 3; // mostrar 3 palabras a la vez

    const typeWriter = () => {
        if (currentIndex < words.length) {
            // Mostrar palabras en lotes
            const endIndex = Math.min(currentIndex + wordsPerBatch, words.length);
            const textToShow = words.slice(0, endIndex).join(' ');
            
            // 🔥 USAR EL NUEVO PROCESAMIENTO DE CONTENIDO
            textElement.innerHTML = this.processContent(textToShow, 'assistant', riskLevel);
            
            currentIndex = endIndex;
            this.scrollToBottom();
            setTimeout(typeWriter, speed);
        } else {
            // Completado: remover clases de streaming
            textElement.classList.remove('streaming-text');
            contentDiv.classList.remove('streaming-content');

            this.isStreamingResponse = false;
            this.sendButton.disabled = false;
            this.messageInput.disabled = false;
            this.scrollToBottom();

            // Guardar en el chat actual
            this.currentChat.messages.push({
                role: 'assistant',
                content: content
            });
        }
    };

    typeWriter();
    this.scrollToBottom();
}
    // Procesar contenido del mensaje
processContent(content, role, riskLevel = null) {
    if (role !== 'assistant') {
        // Para mensajes del usuario, solo sanitizar
        return Utils.sanitizeHTML(content).replace(/\n/g, '<br>');
    }

    let processedContent = Utils.sanitizeHTML(content);
    
    // 🔥 MEJORAR: Procesar formato markdown básico
    processedContent = this.formatAssistantResponse(processedContent);
    
    // 🔥 NUEVO: Convertir enlaces markdown a HTML
    processedContent = this.convertAppointmentLinks(processedContent);
    
    // Agregar indicador de riesgo si existe
    if (riskLevel) {
        const riskText = Utils.getRiskLevelText(riskLevel);
        const riskClass = Utils.getRiskLevelClass(riskLevel);
        processedContent = `<div class="risk-level ${riskClass}">${riskText}</div>` + processedContent;
    }
    
    return processedContent;
}



convertAppointmentLinks(content) {
    // Detectar el patrón completo de recomendación de cita
    const appointmentPattern = /💙\s*¿Necesitas más apoyo\?[\s\S]*?\[([^\]]+)\]\((https:\/\/sigepsi\.garcessebastian\.com[^\)]*)\)/;
    
    // Si encuentra el patrón, reemplazar toda la sección
    if (appointmentPattern.test(content)) {
        return content.replace(appointmentPattern, (match, linkText, url) => {
            return `
                <div class="appointment-suggestion">
                    <div class="suggestion-header">
                        <span class="suggestion-icon">💙</span>
                        <span class="suggestion-title">¿Necesitas más apoyo?</span>
                    </div>
                    <p class="suggestion-text">Puedes agendar una cita con psicólogos especializados</p>
                    <a href="${url.trim()}" target="_blank" rel="noopener noreferrer" class="suggestion-btn">
                        ${linkText.trim()}
                    </a>
                </div>
            `;
        });
    }
    
    // Si solo hay enlaces simples sin el contexto completo
    const simpleRegex = /\[([^\]]+)\]\((https:\/\/sigepsi\.garcessebastian\.com[^\)]*)\)/g;
    return content.replace(simpleRegex, (match, linkText, url) => {
        return `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer" class="suggestion-btn">${linkText.trim()}</a>`;
    });
}

formatAssistantResponse(content) {
    let formatted = content;

    // 1. Preservar saltos de línea convertiendo \n\n en párrafos
    formatted = formatted.replace(/\n\s*\n/g, '</p><p>');
    
    // 2. Convertir **texto** en <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 3. Convertir listas con • y -
    formatted = formatted.replace(/^[•\-]\s*(.+)$/gm, '<li>$1</li>');
    
    // 4. Agrupar <li> en <ul> si hay múltiples
    if (formatted.includes('<li>')) {
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul class="assistant-list">$1</ul>');
    }
    
    // 5. Encabezados con emojis
    formatted = formatted.replace(/^(\S.*?:)\s*$/gm, '<div class="section-title">$1</div>');
    
    // 6. Si no tiene formato HTML, envolver en párrafo
    if (!formatted.includes('<') && !formatted.includes('</')) {
        formatted = `<p>${formatted}</p>`;
    } else {
        // Asegurar que el contenido esté bien estructurado
        if (!formatted.startsWith('<p>') && !formatted.startsWith('<div') && !formatted.startsWith('<ul')) {
            formatted = `<p>${formatted}</p>`;
        }
    }

    return formatted;
}

enhanceAppointmentLinks(content) {
    // Detectar el patrón de recomendación de cita
    const appointmentPattern = /💙.*Recurso importante.*cita con un psicólogo\./;
    
    if (appointmentPattern.test(content)) {
        const appointmentButton = `
            <div class="appointment-recommendation">
                <div class="appointment-card">
                    <div class="appointment-header">
                        <span class="appointment-icon">💙</span>
                        <strong>Apoyo Profesional Disponible</strong>
                    </div>
                    <p>Te recomendamos agendar una cita con especialistas en salud mental</p>
                    <a href="https://sigepsi.garcessebastian.com/" target="_blank" class="appointment-btn">
                        <span>📅</span>
                        Solicitar Cita Aquí
                    </a>
                    <div class="appointment-features">
                        <span>👥 Psicólogos especializados</span>
                        <span>💬 Sesiones personalizadas</span>
                        <span>🏠 Atención virtual disponible</span>
                    </div>
                </div>
            </div>
        `;
        
        // Reemplazar solo el texto de recomendación con el botón
        content = content.replace(appointmentPattern, appointmentButton);
    }
    
    return content;
}

// Mejorar el formato de las respuestas
enhanceResponseFormat(content) {
    let enhancedContent = content;

    // Limpieza básica de saltos de línea
    enhancedContent = enhancedContent
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n');

    // Convertir encabezados comunes
    enhancedContent = enhancedContent.replace(
        /(RECOMENDACIONES|RECURSOS|LÍNEAS|EVALUACIÓN)[:\s]*/gi,
        '<div class="section-title">$1</div>'
    );

    // Convertir listas numeradas o con viñetas
    enhancedContent = enhancedContent.replace(
        /(?:^|\n)(?:\d+\.|•|-)\s*(.+)/g,
        '<li>$1</li>'
    );

    // Envolver las <li> dentro de una lista
    if (enhancedContent.includes('<li>')) {
        enhancedContent = enhancedContent.replace(
            /(<li>[\s\S]*<\/li>)/g,
            '<ul class="assistant-list">$1</ul>'
        );
    }

    // Reemplazar saltos de línea por <br> solo si no hay listas
    if (!enhancedContent.includes('<ul')) {
        enhancedContent = enhancedContent.replace(/\n/g, '<br>');
    }

    // Envolver texto normal en párrafos
    if (!enhancedContent.includes('<div') && !enhancedContent.includes('<p>')) {
        enhancedContent = `<p>${enhancedContent}</p>`;
    }

    return enhancedContent;
}

    
    // Formatear sugerencias como lista
    formatSuggestions(content) {
        // Buscar patrones comunes de listas
        const listPatterns = [
            /(sugerencias|recomendaciones)[:\s]*\n?([•\-]\s*[^\n]*(?:\n[•\-]\s*[^\n]*)*)/gi,
            /(sugerencias|recomendaciones)[:\s]*\n?((?:\d+\.\s*[^\n]*(?:\n\d+\.\s*[^\n]*)*))/gi
        ];
        
        let formattedContent = content;
        
        listPatterns.forEach(pattern => {
            formattedContent = formattedContent.replace(pattern, (match, title, list) => {
                const items = list.split(/\n/).filter(item => item.trim());
                let htmlList = `<div class="suggestion-list"><strong>${title}:</strong><ul>`;
                
                items.forEach(item => {
                    // Limpiar el formato de viñeta o número
                    const cleanItem = item.replace(/^[•\-]\s*|\d+\.\s*/, '').trim();
                    if (cleanItem) {
                        htmlList += `<li>${cleanItem}</li>`;
                    }
                });
                
                htmlList += '</ul></div>';
                return htmlList;
            });
        });
        
        return formattedContent;
    }
    
    // Mostrar indicador de escritura
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator';
        typingDiv.id = 'typingIndicator';

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar assistant-avatar typing-avatar';
        avatarDiv.textContent = 'C';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'typing-content';
        contentDiv.innerHTML = `
            <div class="typing-text">
                <span class="typing-icon">💭</span>
                <span class="typing-message">Camila está pensando</span>
                <span class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </span>
            </div>
        `;

        typingDiv.appendChild(avatarDiv);
        typingDiv.appendChild(contentDiv);

        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();

        this.isWaitingForResponse = true;
        this.sendButton.disabled = true;
        this.messageInput.disabled = true;
    }
    
    // Ocultar indicador de escritura
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        this.isWaitingForResponse = false;
        this.sendButton.disabled = false;
        this.messageInput.disabled = false;
    }
    
    // Desplazar al final del chat
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    // Ocultar pantalla de bienvenida
    hideWelcomeScreen() {
        if (this.welcomeScreen.style.display !== 'none') {
            this.welcomeScreen.style.display = 'none';
        }
    }
    
    // Mostrar pantalla de bienvenida
    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
    }
    
    // Mostrar prompt de autenticación mejorado
    showAuthPrompt(message = '') {
        // Remover prompt existente
        const existingPrompt = document.querySelector('.auth-prompt-container');
        if (existingPrompt) {
            existingPrompt.remove();
        }
        
        const promptHtml = `
            <div class="auth-prompt glow-effect">
                <div class="auth-prompt-header">
                    <div class="prompt-icon">🎯</div>
                    <h3>Continúa Tu Conversación</h3>
                    <p>${message || 'Has usado todos tus chats de prueba. Regístrate para conversaciones ilimitadas con Camila.'}</p>
                </div>
                <div class="auth-prompt-buttons">
                    <button class="btn-primary" onclick="app.showRegisterForm()">
                        <span>🚀</span>
                        Crear Cuenta Gratis
                    </button>
                    <button class="btn-secondary" onclick="app.showLoginForm()">
                        <span>🔐</span>
                        Ya Tengo Cuenta
                    </button>
                </div>
                <div class="auth-prompt-features">
                    <div class="feature">
                        <span class="feature-icon">💬</span>
                        <div>
                            <strong>Chat Ilimitado</strong>
                            <span>Conversa sin restricciones</span>
                        </div>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">📊</span>
                        <div>
                            <strong>Historial Completo</strong>
                            <span>Guarda todas tus conversaciones</span>
                        </div>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🎯</span>
                        <div>
                            <strong>Análisis Profesional</strong>
                            <span>Evaluación detallada</span>
                        </div>
                    </div>
                </div>
                <div class="prompt-footer">
                    <p>¿Solo quieres probar? <a href="#" onclick="location.reload()">Recarga la página para 5 chats más</a></p>
                </div>
            </div>
        `;
        
        const promptDiv = document.createElement('div');
        promptDiv.innerHTML = promptHtml;
        promptDiv.className = 'auth-prompt-container';
        
        this.chatContainer.appendChild(promptDiv);
        this.scrollToBottom();
    }
    
    // Cargar historial de chats
    async loadChatHistory() {
    try {
        //console.log('📂 Cargando historial de chats...', {
          //  autenticado: apiService.isAuthenticated,
            //usuario: apiService.currentUser?.email,
           // token: apiService.token ? 'PRESENTE' : 'AUSENTE'
        //});
        
        const response = await apiService.getChats();
        
       // console.log('📊 Respuesta completa de getChats:', response);
        
        if (!response.success) {
            console.error('❌ Error en respuesta de API:', response.message);
            this.renderChatHistory([]);
            return;
        }
        
        const chats = response.data?.chats || response.data || [];
        
        // console.log('💬 Chats procesados:', {
           // total: chats.length,
           // chats: chats.map(chat => ({
                //id: chat._id,
               // title: chat.title,
             //   updatedAt: chat.updatedAt,
           //     messagesCount: chat.messages?.length || 0
         //   }))
       // });
        
        this.renderChatHistory(chats);
        
    } catch (error) {
        console.error('❌ Error loading chat history:', error);
        console.error('Detalles del error:', {
            mensaje: error.message,
            stack: error.stack
        });
        this.renderChatHistory([]);
    }
}

    
    // Renderizar historial de chats
    renderChatHistory(chats) {
    // console.log('🎨 Renderizando historial con', chats.length, 'chats');
    
    // Limpiar historial actual
    this.chatHistory.innerHTML = '';
    
    if (chats.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'history-empty text-center';
        emptyMessage.innerHTML = `
            <div class="empty-icon">💬</div>
            <p>No hay conversaciones anteriores</p>
            ${!apiService.isAuthenticated ? '<small>Inicia sesión para guardar tu historial</small>' : ''}
        `;
        this.chatHistory.appendChild(emptyMessage);
        return;
    }
    
    // Ordenar chats por fecha (más reciente primero)
    const sortedChats = chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    sortedChats.forEach(chat => {
        const historyItem = this.createHistoryItem(chat);
        this.chatHistory.appendChild(historyItem);
    });
    
    console.log('✅ Historial renderizado correctamente');
}

createHistoryItem(chat) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.setAttribute('data-chat-id', chat._id);

    const chatContent = document.createElement('div');
    chatContent.className = 'history-content';
    
    // Título del chat (primer mensaje o título generado)
    const title = chat.title || this.extractTitleFromChat(chat);
    const date = Utils.formatDate(chat.updatedAt || chat.createdAt);
    
    chatContent.innerHTML = `
        <div class="history-title">${Utils.sanitizeHTML(title)}</div>
        <div class="history-date">${date}</div>
        ${chat.riskLevel ? `<div class="history-risk risk-${chat.riskLevel}">${Utils.getRiskLevelText(chat.riskLevel)}</div>` : ''}
    `;

    // Botón de eliminar (solo para usuarios autenticados)
    if (apiService.isAuthenticated) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-chat-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Eliminar conversación';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteChat(chat._id);
        };

        historyItem.appendChild(deleteBtn);
    }

    // Evento para cargar el chat
    chatContent.addEventListener('click', () => {
      //  console.log('🔄 Cargando chat:', chat._id);
        this.loadChat(chat._id);
        
        // Cerrar sidebar en móvil al hacer clic en un chat
        if (window.innerWidth <= 768) {
            this.closeMobileSidebar();
        }
    });

    historyItem.appendChild(chatContent);
    return historyItem;
}

extractTitleFromChat(chat) {
    if (chat.messages && chat.messages.length > 0) {
        // Buscar el primer mensaje del usuario
        const userMessage = chat.messages.find(msg => msg.role === 'user');
        if (userMessage && userMessage.content) {
            return userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
        }
    }
    return 'Nueva conversación';
}
    
    // Cargar un chat específico
    async loadChat(chatId) {
    if (!apiService.isAuthenticated) {
        this.showError('Debes iniciar sesión para acceder al historial de chats');
        return;
    }
    
    try {
       // console.log('🔄 Cargando chat específico:', chatId);
        
        const response = await apiService.getChat(chatId);
        const chat = response.data.chat;
        
        console.log('📋 Chat cargado:', {
            id: chat._id,
            messagesCount: chat.messages?.length,
            title: chat.title
        });
        
        // Limpiar chat actual
        this.clearChat();
        
        // Ocultar pantalla de bienvenida
        this.hideWelcomeScreen();
        
        // Cargar mensajes
        if (chat.messages && Array.isArray(chat.messages)) {
            chat.messages.forEach(message => {
                this.addMessage(message.role, message.content);
            });
        } else {
            console.warn('⚠️ El chat no tiene mensajes:', chat);
        }
        
        // Actualizar chat actual
        this.currentChat = {
            id: chat._id,
            messages: chat.messages || [],
            isAnonymous: false
        };
        
        console.log('✅ Chat cargado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar el chat:', error);
        this.showError('Error al cargar el chat: ' + error.message);
        
        // Mostrar detalles del error para debugging
        if (error.message.includes('404')) {
            this.showError('Chat no encontrado. Puede que haya sido eliminado.');
        } else if (error.message.includes('401')) {
            this.showError('No tienes permiso para acceder a este chat.');
        }
    }
}
    
    // Limpiar chat actual
    clearChat() {
        this.chatContainer.innerHTML = '';
        this.currentChat = {
            id: null,
            messages: [],
            isAnonymous: !apiService.isAuthenticated
        };
    }
    
    // Iniciar nueva conversación
    startNewChat() {
        this.clearChat();
        this.showWelcomeScreen();
        this.showMessageCounter();
        // Recargar historial para mostrar el chat anterior guardado
        this.loadChatHistory();
    }

    // Eliminar un chat
    async deleteChat(chatId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
            return;
        }

        try {
            await apiService.deleteChat(chatId);
            this.showSuccess('Conversación eliminada exitosamente');

            // Si el chat eliminado es el actual, limpiar y mostrar pantalla de bienvenida
            if (this.currentChat.id === chatId) {
                this.clearChat();
                this.showWelcomeScreen();
            }

            // Recargar historial
            this.loadChatHistory();
        } catch (error) {
            this.showError('Error al eliminar la conversación: ' + error.message);
            console.error('Error deleting chat:', error);
        }
    }

    // Mostrar error
    showError(message) {
        Utils.showNotification(message, 'error');
    }
    
    // Mostrar éxito
    showSuccess(message) {
        Utils.showNotification(message, 'success');
    }
    
    // Actualizar estado después de login
    onUserLogin() {
    console.log('🔑 Usuario logueado, actualizando interfaz...');
    
    this.anonymousMessageCount = 0;
    localStorage.removeItem('camila_anonymous_count');
    this.showMessageCounter();
    
    // Recargar historial con los chats del usuario
    this.loadChatHistory();
    this.updateAuthButtons();
    
    // Remover prompt de auth si existe
    const authPrompt = document.querySelector('.auth-prompt-container');
    if (authPrompt) {
        authPrompt.remove();
    }
    
    // Mostrar mensaje de bienvenida
    this.showSuccess('¡Bienvenido! Ahora tienes acceso completo a Camila.');
    
    // Forzar actualización de la interfaz
    setTimeout(() => {
        this.loadChatHistory();
    }, 500);
}
    
    // Reiniciar contador (para pruebas)
    resetCounter() {
        this.anonymousMessageCount = 0;
        localStorage.setItem('camila_anonymous_count', '0');
        this.showMessageCounter();
        
        // Remover prompt de auth si existe
        const authPrompt = document.querySelector('.auth-prompt-container');
        if (authPrompt) {
            authPrompt.remove();
        }
        
        this.showSuccess('¡Chats de prueba reiniciados! Tienes 5 mensajes disponibles.');
    }
}

// Agregar función global para resetear contador
window.resetTestChats = function() {
    if (window.chatManager) {
        window.chatManager.resetCounter();
    }
};