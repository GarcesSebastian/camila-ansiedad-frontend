// Utilidades generales para la aplicación
class Utils {
    // Formatear fecha para el historial
    static formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hoy';
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            return date.toLocaleDateString('es-ES');
        }
    }
    
    // Truncar texto para el historial
    static truncateText(text, maxLength = 30) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Sanitizar contenido HTML
    static sanitizeHTML(str) {
        // 🔥 DETECTAR si es el bloque de appointment para permitir HTML
        if (str.includes('appointment-recommendation') || str.includes('appointment-card')) {
            // Para el bloque de citas, permitir HTML específico
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = str;
            
            // Solo permitir elementos y atributos específicos del appointment
            const allowedTags = {
                'div': ['class'],
                'span': ['class'],
                'strong': [],
                'p': [],
                'a': ['href', 'target', 'class'],
                'br': []
            };
            
            const sanitizeNode = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent;
                }
                
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();
                    
                    if (allowedTags[tagName]) {
                        const allowedAttrs = allowedTags[tagName];
                        const newElement = document.createElement(tagName);
                        
                        // Copiar atributos permitidos
                        for (const attr of allowedAttrs) {
                            if (node.hasAttribute(attr)) {
                                newElement.setAttribute(attr, node.getAttribute(attr));
                            }
                        }
                        
                        // Procesar hijos recursivamente
                        for (const child of node.childNodes) {
                            const sanitizedChild = sanitizeNode(child);
                            if (sanitizedChild) {
                                if (typeof sanitizedChild === 'string') {
                                    newElement.appendChild(document.createTextNode(sanitizedChild));
                                } else {
                                    newElement.appendChild(sanitizedChild);
                                }
                            }
                        }
                        
                        return newElement;
                    } else {
                        // Si no está permitido, convertir a texto
                        return document.createTextNode(node.textContent || '');
                    }
                }
                
                return null;
            };
            
            const sanitizedElement = sanitizeNode(tempDiv);
            return sanitizedElement ? sanitizedElement.innerHTML : '';
        } else {
            // 🔥 COMPORTAMIENTO ORIGINAL para texto normal
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    }
    
    // Auto-resize para textarea
    static autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    
    // Detectar nivel de riesgo en el texto
    static detectRiskLevel(content) {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('alto riesgo') || 
            lowerContent.includes('grave') || 
            lowerContent.includes('severa') ||
            lowerContent.includes('urgente') ||
            lowerContent.includes('inmediatamente')) {
            return 'high';
        } else if (lowerContent.includes('moderado') || 
                  lowerContent.includes('medio') ||
                  lowerContent.includes('moderada')) {
            return 'moderate';
        } else if (lowerContent.includes('bajo riesgo') || 
                  lowerContent.includes('leve') ||
                  lowerContent.includes('ligera')) {
            return 'low';
        }
        
        return null;
    }
    
    // Obtener texto del nivel de riesgo
    static getRiskLevelText(level) {
        switch(level) {
            case 'low': return 'Nivel de riesgo: Bajo';
            case 'moderate': return 'Nivel de riesgo: Moderado';
            case 'high': return 'Nivel de riesgo: Alto';
            default: return '';
        }
    }
    
    // Obtener clase CSS del nivel de riesgo
    static getRiskLevelClass(level) {
        switch(level) {
            case 'low': return 'low-risk';
            case 'moderate': return 'moderate-risk';
            case 'high': return 'high-risk';
            default: return '';
        }
    }
    
    // Mostrar notificación temporal
    static showNotification(message, type = 'info', duration = 5000) {
        // Remover notificación existente
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}-message`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            padding: 16px 20px;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    // Validar email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Generar avatar basado en nombre
    static generateAvatar(name) {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    }
}

// Añadir estilos para las notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);