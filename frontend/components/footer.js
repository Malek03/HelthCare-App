/**
 * Footer Component
 * Dark theme footer injected into #footer-container
 */
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('footer-container');
    if (!container) return;
  
    const footerHTML = `
      <style>
        .custom-footer {
          background-color: #1a237e; /* Dark theme contrast as requested */
          color: #ffffff;
          padding: var(--sys-spacing-64) 0 var(--sys-spacing-24);
          font-family: var(--sys-font-body);
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: var(--sys-spacing-32);
          margin-bottom: var(--sys-spacing-48);
        }
        
        .footer-logo {
          font-family: var(--sys-font-headline);
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: var(--sys-spacing-16);
        }
        
        .footer-text {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          max-width: 300px;
        }
        
        .footer-title {
          font-family: var(--sys-font-headline);
          font-size: 1.125rem;
          margin-bottom: var(--sys-spacing-24);
          color: #ffffff;
        }
        
        .footer-links {
          list-style: none;
        }
        
        .footer-links li {
          margin-bottom: 12px;
        }
        
        .footer-links a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .footer-links a:hover {
          color: #ffffff;
        }
        
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: var(--sys-spacing-24);
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
        }
  
        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
  
      <footer class="custom-footer">
        <div class="container">
          <div class="footer-grid">
            
            <div class="footer-col">
              <div class="footer-logo">
                <i class="ph-fill ph-heartbeat color-primary"></i> المنصة الطبية
              </div>
              <p class="footer-text">نقدم رعاية صحية متكاملة وسهلة الوصول، تجمع بين الاستشارات الطبية الدقيقة وتتبع الحالة الصحية اليومية.</p>
            </div>
            
            <div class="footer-col">
              <h4 class="footer-title">روابط سريعة</h4>
              <ul class="footer-links">
                <li><a href="index.html">الرئيسية</a></li>
                <li><a href="doctors.html">الأطباء المعتمدين</a></li>
                <li><a href="bmi.html">حاسبة الكتلة (BMI)</a></li>
                <li><a href="articles.html">مكتبة المقالات</a></li>
              </ul>
            </div>
            
            <div class="footer-col">
              <h4 class="footer-title">الدعم والمساعدة</h4>
              <ul class="footer-links">
                <li><a href="#">الأسئلة الشائعة</a></li>
                <li><a href="#">طريقة حجز استشارة</a></li>
                <li><a href="#">سياسة الخصوصية</a></li>
                <li><a href="#">الشروط والأحكام</a></li>
              </ul>
            </div>
            
            <div class="footer-col">
              <h4 class="footer-title">تواصل معنا</h4>
              <ul class="footer-links">
                <li><i class="ph ph-envelope-simple"></i> support@medicalplatform.com</li>
                <li><i class="ph ph-phone"></i> +966 50 123 4567</li>
              </ul>
            </div>
            
          </div>
          
          <div class="footer-bottom">
            &copy; ${new Date().getFullYear()} المنصة الطبية الشاملة. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    `;
  
    container.innerHTML = footerHTML;
  });
