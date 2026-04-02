/**
 * Home Page Logic
 * Handles Hero Slider, Mock API for Videos and Articles
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    loadMockVideos();
    loadMockArticles();
  });
  
  // 1. Hero Slider Logic
  function initHeroSlider() {
    const images = [
      "../backend/src/media/landing_page1.avif",
      "../backend/src/media/landing_page2.avif"
    ];
  
    const sliderContainer = document.getElementById('heroSlider');
    const dotsContainer = document.querySelector('.slider-dots');
    if (!sliderContainer || !dotsContainer) return;
  
    // Clear initial markup
    sliderContainer.innerHTML = '<div class="hero-overlay"></div>';
    dotsContainer.innerHTML = '';
  
    let slides = [];
    let dots = [];
  
    // Generate slides and dots
    images.forEach((src, index) => {
      // Slide
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.style.backgroundImage = `url('${src}')`;
      sliderContainer.appendChild(slide);
      slides.push(slide);
  
      // Dot
      const dot = document.createElement('span');
      dot.className = `dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
  
    let currentSlide = 0;
    
    function goToSlide(index) {
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      
      currentSlide = index;
      
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }
  
    // Auto slide
    setInterval(() => {
      let next = (currentSlide + 1) % slides.length;
      goToSlide(next);
    }, 5000);
  }
  
  // 2. Load Videos
  async function loadMockVideos() {
    const container = document.getElementById('videoList');
    if (!container) return;
try {
    const resp = await window.ApiService.getVideos();
    
    // 👈 الوصول للمصفوفة الصحيحة بناءً على هيكل الباك إند الخاص بك
    const videos = (resp.data && resp.data.videos) || []; 
    
    let html = '';
    
    if (videos.length === 0) {
        container.innerHTML = '<p>لا توجد فيديوهات حالياً.</p>';
        return;
    }

    videos.forEach(v => {
        html += `
          <div class="card video-card">
            <div class="video-thumb">
              <img src="${v.thumbnail}" alt="${v.title}">
              <div class="play-overlay"><i class="ph-fill ph-play"></i></div>
              <span class="duration-badge">${v.description || 'مقطع'}</span>
            </div>
            <div class="video-info">
              <h4 class="headline-sm" style="font-size: 1rem; margin-bottom: 0;">${v.title}</h4>
            </div>
          </div>
        `;
    });
    
    container.innerHTML = html;
}catch(e) {
      console.error("Error loading videos:", e);
      container.innerHTML = '<p class="text-center w-100" style="color:var(--sys-color-error);">تعذر تحميل المقاطع حالياً.</p>';
    }
  }
  
  // 3. Load Articles
  async function loadMockArticles() {
    const container = document.getElementById('articleGrid');
    if (!container) return;
  
    try {
      const resp = await window.ApiService.getArticles(1, 3);
      const articles = resp.data.articles || [];
      let html = '';
      articles.forEach(a => {
        // Handle author based on backend logic (could be doctor or admin)
        const authorName = a.doctor?.user?.name || a.admin?.name || 'محرر المنصة';
        const dateObj = new Date(a.created_at);
        const formattedDate = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        
        html += `
          <div class="card article-card">
            <img src="${a.image}" alt="${a.title}" class="article-img">
            <div class="article-content">
              <span class="category-badge">تثقيف طبي</span>
              <h3 class="headline-sm" style="margin-bottom: 8px;">${a.title}</h3>
              <p class="body-md flex-1">${formattedDate}</p>
              
              <div class="article-author">
                <i class="ph-fill ph-user-circle" style="font-size: 2rem; color: var(--sys-color-outline-variant);"></i>
                <span class="label" style="text-transform: none;">${authorName}</span>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } catch(e) {
      console.error("Error loading articles:", e);
      container.innerHTML = '<p class="text-center w-100" style="color:var(--sys-color-error);">تعذر إحضار المقالات.</p>';
    }
  }
