/**
 * Doctors List Logic
 */

let allDoctors = [];
let specialties = ['طب عام', 'قلب وأوعية دموية', 'أطفال', 'جلدية', 'باطنة', 'أسنان', 'نساء وتوليد'];
let currentPage = 1;
let currentSpecialty = '';
const limit = 8; // items per page

document.addEventListener('DOMContentLoaded', () => {
  renderSpecialties();
  loadDoctors();

  // Enter key in search
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterDoctors();
  });
});

function renderSpecialties() {
  const container = document.getElementById('specialtyFilters');
  let html = `<button class="pill ${currentSpecialty === '' ? 'active' : ''}" onclick="setSpecialty('')">الكل</button>`;
  
  specialties.forEach(sp => {
    html += `<button class="pill ${currentSpecialty === sp ? 'active' : ''}" onclick="setSpecialty('${sp}')">${sp}</button>`;
  });
  
  container.innerHTML = html;
}

function setSpecialty(sp) {
  currentSpecialty = sp;
  currentPage = 1;
  renderSpecialties();
  filterDoctors();
}

function filterDoctors() {
  currentPage = 1;
  loadDoctors();
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  currentSpecialty = '';
  currentPage = 1;
  renderSpecialties();
  loadDoctors();
}

async function loadDoctors() {
  const grid = document.getElementById('doctorsGrid');
  const loading = document.getElementById('loadingState');
  const empty = document.getElementById('emptyState');
  const pagination = document.getElementById('paginationControls');
  const searchStr = document.getElementById('searchInput').value.trim();

  // UI States
  grid.style.display = 'none';
  empty.style.display = 'none';
  pagination.style.display = 'none';
  loading.style.display = 'grid';

  try {
    const res = await window.ApiService.getDoctors(currentPage, limit, searchStr, currentSpecialty);
    const doctors = (res.data && res.data.doctors) || [];
    const pagInfo = (res.data && res.data.pagination) || { page: currentPage, totalPages: 1 };

    loading.style.display = 'none';

    if (doctors.length === 0) {
      empty.style.display = 'block';
      return;
    }

    // Render
    let html = '';
    doctors.forEach(doc => {
      // Handle nested Prisma relations correctly
      const docName = doc.user?.name || doc.name || 'طبيب متطوع';
      const docImg = doc.profile_image || doc.image || '../backend/src/media/doc1.avif';
      const docRating = doc.rating || (4 + Math.random()).toFixed(1);
      const docExp = doc.experience_years || doc.experience || 0;
      const docLoc = doc.location || 'الرياض';
      
      html += `
        <div class="card doctor-card">
          <div class="doctor-img-wrapper">
            <img src="${docImg}" alt="دكتور ${docName}" class="doctor-img">
            <div class="doc-rating">
              <i class="ph-fill ph-star"></i> ${docRating}
            </div>
          </div>
          <div class="doctor-info">
            <span class="doc-specialty">${doc.specialty || 'غير محدد'}</span>
            <h3 class="headline-sm">دكتور ${docName}</h3>
            
            <div class="doc-meta flex-1">
              <div class="meta-item">
                <i class="ph ph-briefcase color-primary"></i>
                <span>خبرة ${docExp} سنوات</span>
              </div>
              <div class="meta-item">
                <i class="ph ph-map-pin color-primary"></i>
                <span>${docLoc}</span>
              </div>
            </div>
            
            <a href="doctor-profile.html?id=${doc.id}" class="btn btn-outline book-btn">
              عرض التفاصيل والحجز
            </a>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
    grid.style.display = 'grid';

    // Pagination
    document.getElementById('pageIndicator').textContent = `صفحة ${pagInfo.page} من ${pagInfo.totalPages}`;
    document.getElementById('prevBtn').disabled = pagInfo.page === 1;
    document.getElementById('nextBtn').disabled = pagInfo.page >= pagInfo.totalPages;
    if (pagInfo.totalPages > 1) {
      pagination.style.display = 'flex';
    }

  } catch (error) {
    console.error("Error loading doctors", error);
    loading.style.display = 'none';
    empty.style.display = 'block';
    empty.innerHTML = `<p style="color:var(--sys-color-error);text-align:center;">تعذر تحميل الأطباء حالياً.</p>`;
  }
}

function changePage(delta) {
  currentPage += delta;
  loadDoctors();
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

// ---------------------------------
// MOCK DATA GENERATOR
// ---------------------------------
function generateMockDoctors(search, specialty) {
  const images = [
    '../backend/src/media/doc1.avif',
    '../backend/src/media/doc2.avif',
    '../backend/src/media/doc3.avif',
    '../backend/src/media/doc4.avif'
  ];

  const names = ['أحمد خالد', 'سارة محمد', 'محمود علي', 'فاطمة صالح', 'حسن عبدالرحمن', 'نورة السعيد', 'فيصل عبدالله'];
  const locations = ['الرياض, مستشفى المملكة', 'جدة, عيادات النخبة', 'الدمام, مجمع الشفاء', 'مكة, المستشفى العام'];

  let mockData = [];
  for(let i=1; i<=20; i++) {
    mockData.push({
      id: i,
      name: names[i % names.length],
      specialty: specialties[i % specialties.length],
      experience: Math.floor(Math.random() * 15) + 3,
      rating: (4 + Math.random()).toFixed(1),
      location: locations[i % locations.length],
      image: images[i % images.length]
    });
  }

  // Filter
  if (specialty) mockData = mockData.filter(d => d.specialty === specialty);
  if (search) {
    const s = search.toLowerCase();
    mockData = mockData.filter(d => d.name.toLowerCase().includes(s) || d.specialty.includes(s));
  }

  return mockData;
}
