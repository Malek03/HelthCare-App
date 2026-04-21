/**
 * Premium Glassmorphic Toast Notifications
 */

(function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .stitch-toast-container {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
            width: 380px;
        }
        
        .stitch-toast {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            pointer-events: auto;
            overflow: hidden;
            position: relative;
        }
        
        .stitch-toast::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 6px;
            background: var(--toast-color, var(--sys-color-primary));
        }
        
        .stitch-toast.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .stitch-toast-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            flex-shrink: 0;
            background: var(--toast-bg, rgba(var(--sys-color-primary-rgb), 0.1));
            color: var(--toast-color, var(--sys-color-primary));
        }
        
        .stitch-toast-content {
            flex-grow: 1;
        }
        
        .stitch-toast-title {
            font-weight: 800;
            color: #111c2d;
            margin-bottom: 2px;
            font-size: 1rem;
            font-family: 'Cairo', sans-serif;
        }
        
        .stitch-toast-message {
            color: #414754;
            font-size: 0.85rem;
            line-height: 1.4;
            font-family: 'Cairo', sans-serif;
        }

        .stitch-toast.success { --toast-color: #00c853; --toast-bg: rgba(0, 200, 83, 0.1); }
        .stitch-toast.error { --toast-color: #ff5252; --toast-bg: rgba(255, 82, 82, 0.1); }
        .stitch-toast.info { --toast-color: #2196f3; --toast-bg: rgba(33, 150, 243, 0.1); }
        .stitch-toast.warning { --toast-color: #ffab00; --toast-bg: rgba(255, 171, 0, 0.1); }

        @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
        }

        .toast-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: var(--toast-color);
            opacity: 0.3;
            width: 100%;
        }

        @media (max-width: 480px) {
            .stitch-toast-container {
                right: 16px;
                left: 16px;
                width: auto;
            }
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.className = 'stitch-toast-container';
    document.body.appendChild(container);

    window.Toast = {
        show: function(title, message, type = 'success', duration = 4000) {
            const toast = document.createElement('div');
            toast.className = `stitch-toast ${type}`;
            
            let iconClass = 'ph-info';
            if (type === 'success') iconClass = 'ph-check-circle';
            if (type === 'error') iconClass = 'ph-warning-circle';
            if (type === 'warning') iconClass = 'ph-warning';
            
            toast.innerHTML = `
                <div class="stitch-toast-icon">
                    <i class="ph-fill ${iconClass}"></i>
                </div>
                <div class="stitch-toast-content">
                    <div class="stitch-toast-title">${title}</div>
                    <div class="stitch-toast-message">${message}</div>
                </div>
                <div class="toast-progress" style="animation: progress ${duration}ms linear forwards"></div>
            `;
            
            container.appendChild(toast);
            
            // Trigger animation
            void toast.offsetWidth;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, duration);
        }
    };

    // Aliases for convenience
    window.showToast = (msg, type = 'info') => {
        const titles = { success: 'نجاح العملية', error: 'تنبيه خطأ', info: 'إشعار جديد', warning: 'تحذير' };
        window.Toast.show(titles[type] || 'إشعار', msg, type);
    };
})();
