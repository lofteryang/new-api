// AI Assistant Interface Script
class AIAssistant {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatArea = document.getElementById('chatArea');
        this.isLoading = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.showWelcomeMessage();
    }

    bindEvents() {
        // Send button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Enter key press
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input focus effects
        this.messageInput.addEventListener('focus', () => {
            this.addInputFocusEffect();
        });

        this.messageInput.addEventListener('blur', () => {
            this.removeInputFocusEffect();
        });

        // Auto-resize input (if needed for textarea)
        this.messageInput.addEventListener('input', () => {
            this.updateSendButtonState();
        });
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.addMessage('assistant', "Hello! I'm Grok, your AI assistant. What would you like to know today?");
        }, 1000);
    }

    sendMessage() {
        const message = this.messageInput.value.trim();

        if (!message || this.isLoading) {
            return;
        }

        // Add user message
        this.addMessage('user', message);

        // Clear input
        this.messageInput.value = '';
        this.updateSendButtonState();

        // Show loading and simulate AI response
        this.showLoading();
        this.simulateAIResponse(message);
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        messageDiv.appendChild(contentDiv);
        this.chatArea.appendChild(messageDiv);

        // Scroll to bottom
        this.chatArea.scrollTop = this.chatArea.scrollHeight;

        // Add typing animation effect
        this.animateMessage(contentDiv);
    }

    animateMessage(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';

        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    showLoading() {
        this.isLoading = true;
        this.updateSendButtonState();

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant loading-message';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
        `;

        this.chatArea.appendChild(loadingDiv);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;
    }

    hideLoading() {
        const loadingMessage = this.chatArea.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
        this.isLoading = false;
        this.updateSendButtonState();
    }

    simulateAIResponse(userMessage) {
        // Simulate network delay
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds

        setTimeout(() => {
            this.hideLoading();

            // Generate a contextual response
            const response = this.generateResponse(userMessage);
            this.addMessage('assistant', response);
        }, delay);
    }

    generateResponse(message) {
        const responses = {
            greetings: [
                "Hello! How can I help you today?",
                "Hi there! What's on your mind?",
                "Greetings! I'm here to assist you.",
            ],
            questions: [
                "That's an interesting question. Let me think about that...",
                "Great question! Here's what I think:",
                "I'd be happy to help with that.",
            ],
            general: [
                "I understand what you're asking. Here's my perspective:",
                "That's a thoughtful point. Let me elaborate:",
                "I see what you mean. Here's how I'd approach that:",
            ]
        };

        const lowerMessage = message.toLowerCase();

        if (lowerMessage.match(/hello|hi|hey|greetings/)) {
            return this.getRandomResponse(responses.greetings);
        } else if (lowerMessage.match(/\?|what|how|why|when|where/)) {
            return this.getRandomResponse(responses.questions) + " " + this.generateContextualResponse(message);
        } else {
            return this.getRandomResponse(responses.general) + " " + this.generateContextualResponse(message);
        }
    }

    generateContextualResponse(message) {
        const contextualResponses = [
            "Based on current knowledge, this topic involves multiple perspectives that are worth considering.",
            "This is a complex subject that benefits from careful analysis and understanding.",
            "There are several factors to consider when approaching this question.",
            "This touches on important concepts that have practical applications.",
            "The answer to this involves both theoretical understanding and real-world implications.",
        ];

        return this.getRandomResponse(contextualResponses);
    }

    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    updateSendButtonState() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isLoading;

        if (hasText && !this.isLoading) {
            this.sendButton.style.opacity = '1';
        } else {
            this.sendButton.style.opacity = '0.5';
        }
    }

    addInputFocusEffect() {
        document.body.style.setProperty('--input-glow', 'rgba(255, 255, 255, 0.1)');
    }

    removeInputFocusEffect() {
        document.body.style.setProperty('--input-glow', 'transparent');
    }
}

// Enhanced Light Effects Controller
class LightEffectsController {
    constructor() {
        this.lightBeams = document.querySelectorAll('.light-beam');
        this.particles = document.querySelectorAll('.particle');
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.init();
    }

    init() {
        if (this.isReducedMotion) {
            this.disableAnimations();
            return;
        }

        this.enhanceLightEffects();
        this.addInteractivity();
        this.optimizePerformance();
    }

    enhanceLightEffects() {
        this.lightBeams.forEach((beam, index) => {
            // Add random variations to make effects more dynamic
            const delay = Math.random() * 2;
            const duration = 3 + Math.random() * 2; // 3-5 seconds

            beam.style.animationDelay = `-${delay}s`;
            beam.style.animationDuration = `${duration}s`;
        });
    }

    addInteractivity() {
        let mouseX = 0;
        let mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth;
            mouseY = e.clientY / window.innerHeight;

            this.updateLightDirection(mouseX, mouseY);
        });
    }

    updateLightDirection(mouseX, mouseY) {
        // Subtle mouse interaction with light effects
        const intensity = mouseX * 0.1; // Subtle effect

        this.lightBeams.forEach((beam, index) => {
            const offset = (index + 1) * 0.02;
            beam.style.opacity = 0.3 + intensity + offset;
        });
    }

    optimizePerformance() {
        // Use intersection observer to pause animations when not visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                } else {
                    entry.target.style.animationPlayState = 'paused';
                }
            });
        });

        this.lightBeams.forEach(beam => observer.observe(beam));
        this.particles.forEach(particle => observer.observe(particle));
    }

    disableAnimations() {
        this.lightBeams.forEach(beam => {
            beam.style.animation = 'none';
        });

        this.particles.forEach(particle => {
            particle.style.animation = 'none';
        });
    }
}

// Utility Functions
class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();

        this.monitor();
    }

    monitor() {
        const currentTime = performance.now();
        this.frameCount++;

        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;

            // Adjust quality based on performance
            this.adjustQuality();
        }

        requestAnimationFrame(() => this.monitor());
    }

    adjustQuality() {
        const lightBeams = document.querySelectorAll('.light-beam');

        if (this.fps < 30) {
            // Reduce quality for better performance
            lightBeams.forEach(beam => {
                beam.style.filter = 'blur(10px)';
            });
        } else if (this.fps > 50) {
            // Restore quality
            lightBeams.forEach(beam => {
                beam.style.filter = 'blur(20px)';
            });
        }
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize AI Assistant
    const aiAssistant = new AIAssistant();

    // Initialize Light Effects
    const lightEffects = new LightEffectsController();

    // Initialize Performance Monitor (only in development)
    if (window.location.hostname === 'localhost') {
        const performanceMonitor = new PerformanceMonitor();
    }

    // Add resize handler
    window.addEventListener('resize', Utils.debounce(() => {
        // Handle any resize-specific logic here
        console.log('Window resized');
    }, 250));

    // Service Worker registration (for PWA support)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    }
});

// Export for external use
window.AIAssistant = AIAssistant;