/**
 * Stitch Design System Toast Notifications
 * A global floating notification component matching the platform's theme.
 */

(function() {
    // 1. Inject Auto-Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .stitch-toast-container {
            position: fixed;
            bottom: 32px;
            left: 32px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 16px;
            pointer-events: none;
        }
        
        .stitch-toast {
            min-width: 320px;
            max-width: 400px;
            background: var(--sys-color-surface-container-lowest, #ffffff);
            box-shadow: var(--sys-elevation-glass, 0 8px 32px rgba(17,28,45,0.08));
            border-radius: var(--sys-radius-lg, 12px);
            padding: 20px;
            display: flex;
            align-items: flex-start;
            gap: 16px;
            transform: translateX(-120%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
            border-right: 4px solid;
            font-family: var(--sys-font-body, 'Cairo', sans-serif);
        }
        
        .stitch-toast.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .stitch-toast.success {
            border-right-color: #2E7D32;
        }
        .stitch-toast.success i { color: #2E7D32; }
        
        .stitch-toast.error {
            border-right-color: var(--sys-color-error, #ba1a1a);
        }
        .stitch-toast.error i { color: var(--sys-color-error, #ba1a1a); }
        
        .stitch-toast.info {
            border-right-color: var(--sys-color-primary, #005bbf);
        }
        .stitch-toast.info i { color: var(--sys-color-primary, #005bbf); }

        .stitch-toast i {
            font-size: 1.75rem;
            margin-top: 2px;
        }
        
        .stitch-toast-content {
            flex-grow: 1;
        }
        
        .stitch-toast-title {
            font-weight: 700;
            color: var(--sys-color-on-surface, #111c2d);
            margin-bottom: 6px;
            font-size: 1.05rem;
        }
        
        .stitch-toast-message {
            color: var(--sys-color-on-surface-variant, #414754);
            font-size: 0.95rem;
            line-height: 1.5;
        }
        
        @media (max-width: 600px) {
            .stitch-toast-container {
                bottom: 16px;
                left: 16px;
                right: 16px;
            }
            .stitch-toast {
                min-width: unset;
                width: 100%;
                transform: translateY(120%);
            }
            .stitch-toast.show {
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // 2. Inject Container
    const container = document.createElement('div');
    container.className = 'stitch-toast-container';
    document.body.appendChild(container);

    // 3. Expose Global API
    window.Toast = {
        show: function(title, message, type = 'success', duration = 4500) {
            const toast = document.createElement('div');
            toast.className = `stitch-toast ${type}`;
            
            let icon = 'ph-info';
            if (type === 'success') icon = 'ph-check-circle';
            if (type === 'error') icon = 'ph-warning-circle';
            
            toast.innerHTML = `
                <i class="ph-fill ${icon}"></i>
                <div class="stitch-toast-content">
                    <div class="stitch-toast-title">${title}</div>
                    <div class="stitch-toast-message">${message}</div>
                </div>
            `;
            
            container.appendChild(toast);
            
            // Trigger animation
            void toast.offsetWidth;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 400); // Wait for transition
            }, duration);
        }
    };
})();
