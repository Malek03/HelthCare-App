/**
 * Videos Functionality
 * Handles fetching, rendering VideoCard components and managing the ExpandedVideoPlayer
 */

document.addEventListener('DOMContentLoaded', () => {
    initVideoLibrary();
});

// Mock Initial fetch. Will replace with `fetch('/api/videos')` in real implementation.
// Prisma Model Reference: { id, admin_id, title, url, description, thumbnail, is_published, created_at, admin }
async function initVideoLibrary() {
    const gridContainer = document.getElementById('video-grid');
    
    try {
        const response = await window.ApiService.getVideos();
        const videos = (response.data && response.data.videos) || [];

        renderVideoCards(videos, gridContainer);

    } catch (error) {
        console.error('Error fetching videos:', error);
        gridContainer.innerHTML = `
            <div class="loading-state" style="color: var(--sys-color-error);">
                <i class="ph ph-warning-circle" style="color: var(--sys-color-error);"></i>
                <p>عذراً، حدث خطأ أثناء تحميل الفيديوهات. يرجى المحاولة لاحقاً.</p>
            </div>
        `;
    }
}

/**
 * Renders all video cards inside the grid
 */
function renderVideoCards(videos, container) {
    if (!videos || videos.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="ph ph-film-strip"></i>
                <p>لا توجد فيديوهات متاحة حالياً.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ''; // Clear loading state
    
    videos.forEach(video => {
        // Ensure to parse URL correctly from Prisma model "url"
        const cardHTML = VideoCard(video);
        container.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Add event listeners to cards for the opening modal trigger
    const cards = container.querySelectorAll('.video-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const videoDataStr = decodeURIComponent(card.getAttribute('data-video'));
            const videoData = JSON.parse(videoDataStr);
            openVideoPlayer(videoData);
        });
    });

    // Add event listeners for title links so they open the video too (or route to a single page)
    const titleLinks = container.querySelectorAll('.video-title');
    titleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents double firing from the card click
            const card = e.target.closest('.video-card');
            const videoDataStr = decodeURIComponent(card.getAttribute('data-video'));
            const videoData = JSON.parse(videoDataStr);
            openVideoPlayer(videoData);
        });
    });
}

/**
 * Reusable Component: VideoCard
 * Returns the HTML string for a single Video Card.
 */
function VideoCard(video) {
    // We encode the object to pass it via dat-attributes for our vanilla js event listener
    const videoDataStr = encodeURIComponent(JSON.stringify(video));
    const doctorName = video.admin?.name || 'الإدارة';
    
    // Formatting date
    const dateObj = new Date(video.created_at);
    const formattedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('ar-EG');

    return `
        <article class="video-card" data-video="${videoDataStr}">
            <div class="video-card-preview">
                <!-- Using real video element for preview. For a simpler preview, an img tag + thumbnail could also be used -->
                ${video.thumbnail ? 
                    `<img src="${video.thumbnail}" alt="Thumbnail for ${video.title}" style="width:100%; height:100%; object-fit:cover;">` : 
                    `<video src="${video.url}" muted playsinline></video>`
                }
                <i class="ph-fill ph-play-circle play-icon"></i>
            </div>
            <div class="video-card-content">
                <span class="video-title" role="link" tabindex="0">${video.title}</span>
                <div class="video-meta">
                    <span><i class="ph ph-user"></i> ${doctorName}</span>
                    ${formattedDate ? `<span><i class="ph ph-calendar"></i> ${formattedDate}</span>` : ''}
                </div>
                <p class="video-description-preview">${video.description || 'لا يوجد وصف.'}</p>
            </div>
        </article>
    `;
}

/**
 * Reusable Component: ExpandedVideoPlayer
 * Rendered inside the modal overlay and auto-plays
 */
function openVideoPlayer(video) {
    const modal = document.getElementById('video-modal');
    const doctorName = video.admin?.name || 'الإدارة';

    const playerHTML = `
        <div class="expanded-player-container">
            <button class="close-modal-btn" id="close-modal" aria-label="إغلاق المشغل">
                <i class="ph ph-x"></i>
            </button>
            <div class="player-video-wrapper">
                <!-- Video autoPlats using HTML5 attribute -->
                <video src="${video.url}" controls autoplay playsinline controlsList="nodownload"></video>
            </div>
            <div class="player-info-container">
                <h2 class="player-title">${video.title}</h2>
                <div class="player-instructor">
                    <i class="ph-fill ph-user-circle" style="font-size: 1.5rem;"></i>
                    <span>بواسطة: ${doctorName}</span>
                </div>
                <div class="player-description">
                    ${video.description || 'لا يوجد وصف متاح لهذا الفيديو.'}
                </div>
            </div>
        </div>
    `;

    modal.innerHTML = playerHTML;
    modal.classList.remove('hidden');

    // Close logic
    const closeBtn = document.getElementById('close-modal');
    closeBtn.addEventListener('click', closeVideoPlayer);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoPlayer();
        }
    });
}

function closeVideoPlayer() {
    const modal = document.getElementById('video-modal');
    // We empty the innerHTML to stop the video from playing when closed
    modal.innerHTML = ''; 
    modal.classList.add('hidden');
}
