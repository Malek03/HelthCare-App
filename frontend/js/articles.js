/**
 * Articles Listing Functionality
 * Handles rendering the View All Medical Articles grid
 */

document.addEventListener('DOMContentLoaded', () => {
    initArticlesLibrary();
});

// Using Mock Data resembling the Prisma `Article` Model
async function initArticlesLibrary() {
    const gridContainer = document.getElementById('articles-grid');
    if (!gridContainer) return;
    
    try {
        const response = await window.ApiService.getArticles(1, 20);
        const articles = (response.data && response.data.articles) || [];

        renderArticleCards(articles, gridContainer);

    } catch (error) {
        console.error('Error fetching articles:', error);
        gridContainer.innerHTML = `
            <div class="loading-state" style="color: var(--sys-color-error);">
                <i class="ph ph-warning-circle"></i>
                <p>عذراً، حدث خطأ أثناء تحميل المقالات. يرجى المحاولة لاحقاً.</p>
            </div>
        `;
    }
}

function renderArticleCards(articles, container) {
    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="ph ph-article"></i>
                <p>لا توجد مقالات متاحة حالياً.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ''; // Clear loading state
    
    articles.forEach(article => {
        const cardHTML = ArticleCard(article);
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

/**
 * Reusable Component: ArticleCard
 * Returns HTML string mapped to the Article schema
 */
function ArticleCard(article) {
    const authorName = article.doctor?.user?.name || article.admin?.name || 'محرر المنصة';
    
    const dateObj = new Date(article.created_at);
    const formattedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    // Link URL matching detail page requirement
    const detailURL = `article-detail.html?id=${article.id}`;

    return `
        <article class="card article-listing-card">
            <!-- Navigation bound to entire card implicitly holding its URL -->
            <a href="${detailURL}" class="article-listing-link">
                <!-- Image Container -->
                <img src="${article.image || 'https://via.placeholder.com/600x400?text=Medical+Article'}" alt="${article.title}" class="article-listing-image">
                
                <!-- Text Container -->
                <div class="article-listing-content">
                    <h3 class="article-listing-title">${article.title}</h3>
                    <!-- Truncated preview using CSS line-clamp -->
                    <p class="article-listing-preview">${article.content}</p>
                    
                    <div class="article-listing-footer">
                        <div class="article-listing-meta">
                            <i class="ph-fill ph-user-circle" style="font-size: 1.5rem;"></i>
                            <span>${authorName} • ${formattedDate}</span>
                        </div>
                        <span class="read-more-text">اقرأ المزيد <i class="ph ph-arrow-left"></i></span>
                    </div>
                </div>
            </a>
        </article>
    `;
}
