/**
 * Article Detail Functionality
 * Fetches and displays a specific article dynamically from ID
 */

document.addEventListener('DOMContentLoaded', () => {
    loadArticleDetail();
});

async function loadArticleDetail() {
    // Determine ID from URL: article-detail.html?id=101
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        showError("لم يتم العثور على المقال المطلوب.");
        return;
    }

    try {
        const response = await window.ApiService.getArticleById(articleId);
        const article = (response.data && response.data.article) || response.data; // Sometimes detail APIs return it directly outside the wrapper

        if (!article) {
             showError("عذراً، المقال غير موجود أو تم حذفه.");
             return;
        }

        renderArticleDetail(article);

    } catch(err) {
        console.error(err);
        showError("تعذر تحميل بيانات المقال. تحقق من اتصالك وحاول مجدداً.");
    }
}

function renderArticleDetail(article) {
    const heroContainer = document.getElementById('article-hero');
    const contentWrapper = document.getElementById('article-content-wrapper');

    const authorName = article.doctor?.user?.name || article.admin?.name || 'محرر المنصة';
    const dateObj = new Date(article.created_at);
    const formattedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    // 1. Inject Hero Image (Requirement)
    heroContainer.innerHTML = `
        <img src="${article.image || 'https://via.placeholder.com/1200x500?text=Medical+Hero'}" alt="Hero Image: ${article.title}" class="article-hero-image">
    `;

    // 2. Format Body properly handling line-breaks natively if it's plain text vs HTML
    // We replace \n with <br> for plain text content just to visualize it correctly if it contains spaces.
    let parsedContent = article.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    if(!parsedContent.startsWith('<p>')) parsedContent = `<p>${parsedContent}</p>`;

    // 3. Inject Layout Data Container (Requirement)
    contentWrapper.innerHTML = `
        <!-- Title Prominently displayed -->
        <h1 class="article-detail-title">${article.title}</h1>
        
        <div class="article-detail-meta">
            <span><i class="ph-fill ph-user-circle" style="font-size: 1.5rem;"></i> ${authorName}</span>
            <span style="color: var(--sys-color-on-surface-variant);">•</span>
            <span style="color: var(--sys-color-on-surface-variant);"><i class="ph ph-calendar-blank"></i> ${formattedDate}</span>
        </div>

        <!-- Full Content wrapping properly -->
        <div class="article-full-content">
            ${parsedContent}
        </div>
    `;
}

function showError(msg) {
    const heroContainer = document.getElementById('article-hero');
    if(heroContainer) heroContainer.style.display = 'none';

    const contentWrapper = document.getElementById('article-content-wrapper');
    if(contentWrapper) {
        contentWrapper.innerHTML = `
            <div class="loading-state" style="color: var(--sys-color-error);">
                <i class="ph ph-warning-circle" style="font-size: 3rem;"></i>
                <p style="margin-top: 16px;">${msg}</p>
                <a href="articles.html" class="btn btn-primary" style="margin-top: 24px;">العودة للمقالات</a>
            </div>
        `;
    }
}
