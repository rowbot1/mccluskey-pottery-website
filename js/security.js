// Security utilities for McCluskey Pottery

// Input validation and sanitization
const Security = {
    // Sanitize HTML to prevent XSS
    sanitizeHTML: function(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    // Validate email format
    validateEmail: function(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase());
    },
    
    // Validate phone number (UK/Ireland format)
    validatePhone: function(phone) {
        const re = /^[\+]?[(]?[0-9]{3,4}[)]?[-\s\.]?[(]?[0-9]{3,4}[)]?[-\s\.]?[0-9]{4,9}$/;
        return re.test(String(phone).replace(/\s/g, ''));
    },
    
    // Validate name (letters, spaces, hyphens, apostrophes only)
    validateName: function(name) {
        const re = /^[a-zA-Z\s\-']+$/;
        return re.test(name) && name.trim().length >= 2 && name.trim().length <= 100;
    },
    
    // Validate address
    validateAddress: function(address) {
        return address.trim().length >= 10 && address.trim().length <= 500;
    },
    
    // Validate message/text area
    validateMessage: function(message, minLength = 10, maxLength = 1000) {
        const trimmed = message.trim();
        return trimmed.length >= minLength && trimmed.length <= maxLength;
    },
    
    // Sanitize input for safe display
    sanitizeInput: function(input) {
        if (typeof input !== 'string') return '';
        
        // Remove any HTML tags
        let cleaned = input.replace(/<[^>]*>/g, '');
        
        // Replace dangerous characters
        cleaned = cleaned.replace(/[<>\"']/g, function(match) {
            const escapeMap = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escapeMap[match];
        });
        
        // Trim whitespace
        return cleaned.trim();
    },
    
    // Rate limiting for form submissions
    rateLimiter: {
        submissions: new Map(),
        
        canSubmit: function(formId, maxAttempts = 3, windowMs = 60000) {
            const now = Date.now();
            const key = formId;
            
            if (!this.submissions.has(key)) {
                this.submissions.set(key, []);
            }
            
            const attempts = this.submissions.get(key);
            
            // Remove old attempts outside the window
            const recentAttempts = attempts.filter(time => now - time < windowMs);
            this.submissions.set(key, recentAttempts);
            
            // Check if under limit
            if (recentAttempts.length >= maxAttempts) {
                return false;
            }
            
            // Add new attempt
            recentAttempts.push(now);
            return true;
        },
        
        getRemainingTime: function(formId, windowMs = 60000) {
            const attempts = this.submissions.get(formId) || [];
            if (attempts.length === 0) return 0;
            
            const oldestAttempt = Math.min(...attempts);
            const timeElapsed = Date.now() - oldestAttempt;
            return Math.max(0, windowMs - timeElapsed);
        }
    },
    
    // CSRF token generation (for demonstration - in production this would be server-side)
    generateToken: function() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },
    
    // Validate all form inputs
    validateForm: function(formData) {
        const errors = {};
        
        // Validate each field based on its type
        if (formData.name !== undefined) {
            if (!this.validateName(formData.name)) {
                errors.name = 'Please enter a valid name (2-100 characters, letters only)';
            }
        }
        
        if (formData.email !== undefined) {
            if (!this.validateEmail(formData.email)) {
                errors.email = 'Please enter a valid email address';
            }
        }
        
        if (formData.phone !== undefined && formData.phone) {
            if (!this.validatePhone(formData.phone)) {
                errors.phone = 'Please enter a valid phone number';
            }
        }
        
        if (formData.address !== undefined) {
            if (!this.validateAddress(formData.address)) {
                errors.address = 'Please enter a valid address (10-500 characters)';
            }
        }
        
        if (formData.message !== undefined) {
            if (!this.validateMessage(formData.message)) {
                errors.message = 'Please enter a message (10-1000 characters)';
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    },
    
    // Display validation errors
    displayErrors: function(form, errors) {
        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        // Display new errors
        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field) {
                field.classList.add('error');
                const errorMsg = document.createElement('span');
                errorMsg.className = 'error-message';
                errorMsg.textContent = errors[fieldName];
                errorMsg.style.cssText = 'color: #dc3545; font-size: 14px; display: block; margin-top: 5px;';
                field.parentElement.appendChild(errorMsg);
            }
        });
    }
};

// Auto-apply HTTPS redirect (for production)
if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    window.location.href = window.location.href.replace('http:', 'https:');
}

// Content Security Policy meta tag (added dynamically for demonstration)
const cspMeta = document.createElement('meta');
cspMeta.httpEquiv = 'Content-Security-Policy';
cspMeta.content = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval';";
document.head.appendChild(cspMeta);

// Prevent clickjacking
if (window.top !== window.self) {
    window.top.location = window.self.location;
}