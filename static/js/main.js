/**
 * Main JavaScript file for Braille World
 * Handles common functionality across all pages
 */

class BrailleWorld {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.setupTooltips();
        this.setupScrollEffects();
        this.setupAccessibility();
    }
    
    /**
     * Navigation enhancements
     */
    setupNavigation() {
        // Highlight current page in navigation
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    /**
     * Initialize Bootstrap tooltips
     */
    setupTooltips() {
        // Initialize tooltips if Bootstrap is available
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }
    
    /**
     * Scroll effects and animations
     */
    setupScrollEffects() {
        // Add scroll-to-top functionality
        this.createScrollToTopButton();
        
        // Intersection Observer for animations
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        }
    }
    
    /**
     * Create scroll to top button
     */
    createScrollToTopButton() {
        const scrollButton = document.createElement('button');
        scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollButton.className = 'btn btn-primary btn-floating position-fixed';
        scrollButton.style.cssText = `
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: none;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        scrollButton.setAttribute('aria-label', 'Scroll to top');
        
        document.body.appendChild(scrollButton);
        
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollButton.style.display = 'block';
            } else {
                scrollButton.style.display = 'none';
            }
        });
        
        // Scroll to top on click
        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    /**
     * Setup intersection observer for animations
     */
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements that should animate in
        document.querySelectorAll('.service-card, .feature-item').forEach(el => {
            observer.observe(el);
        });
    }
    
    /**
     * Accessibility enhancements
     */
    setupAccessibility() {
        // Enhanced keyboard navigation
        this.setupKeyboardNavigation();
        
        // Skip link functionality
        this.setupSkipLinks();
        
        // High contrast mode detection
        this.detectHighContrastMode();
    }
    
    /**
     * Enhanced keyboard navigation
     */
    setupKeyboardNavigation() {
        // Allow keyboard navigation for service cards
        document.querySelectorAll('.service-card').forEach(card => {
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const link = card.querySelector('a');
                    if (link) {
                        link.click();
                    }
                }
            });
        });
        
        // Enhanced focus management
        document.addEventListener('keydown', (e) => {
            // Escape key handling
            if (e.key === 'Escape') {
                // Close any open modals or dropdowns
                const activeElement = document.activeElement;
                if (activeElement && activeElement.blur) {
                    activeElement.blur();
                }
            }
        });
    }
    
    /**
     * Setup skip links for screen readers
     */
    setupSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 9999;
            border-radius: 4px;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content ID if not exists
        const main = document.querySelector('main');
        if (main && !main.id) {
            main.id = 'main-content';
        }
    }
    
    /**
     * Detect high contrast mode
     */
    detectHighContrastMode() {
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast-mode');
        }
        
        // Listen for changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                if (e.matches) {
                    document.body.classList.add('high-contrast-mode');
                } else {
                    document.body.classList.remove('high-contrast-mode');
                }
            });
        }
    }
    
    /**
     * Utility function to show notifications
     */
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
        return notification;
    }
    
    /**
     * Utility function to format file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Utility function to validate file type
     */
    static isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
        return validTypes.includes(file.type);
    }
    
    /**
     * Utility function to debounce function calls
     */
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    /**
     * Utility function to throttle function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

/**
 * Animation styles for intersection observer
 */
const animationStyles = `
    .service-card, .feature-item {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .service-card.animate-in, .feature-item.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    @media (prefers-reduced-motion: reduce) {
        .service-card, .feature-item {
            opacity: 1;
            transform: none;
            transition: none;
        }
    }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BrailleWorld();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrailleWorld;
}
