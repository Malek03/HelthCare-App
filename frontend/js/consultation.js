/**
 * General Consultation Submission Logic
 * Handles Authentication Guard, Doctor Loading, and Form Submission mapping to Consultation Model
 */

document.addEventListener('DOMContentLoaded', () => {
    initConsultationPage();
});

async function initConsultationPage() {
    const authGuard = document.getElementById('auth-guard-container');
    const formContainer = document.getElementById('consultation-form-container');
    const token = localStorage.getItem('token');

    // Authentication Guard
    if (!token) {
        // Not logged in -> Show Guard UI
        authGuard.classList.remove('hidden');
    } else {
        // Logged In -> Show Form UI and load dependencies
        formContainer.classList.remove('hidden');
        await loadDoctorsList();
        bindFormSubmission();
    }
}

/**
 * Feeds the doctor selection dropdown from the API
 */
async function loadDoctorsList() {
    const selectEl = document.getElementById('doctorSelect');
    
    try {
        const response = await window.ApiService.getDoctors(1, 100);
        const doctors = (response.data && response.data.doctors) || [];

        if(doctors.length === 0) {
             selectEl.innerHTML = '<option value="" disabled selected>لا يوجد أطباء متاحين حالياً</option>';
             return;
        }

        selectEl.innerHTML = '<option value="" disabled selected>اختر الطبيب...</option>';
        doctors.forEach(doc => {
            // Prisma mapping for DoctorProfile -> user name
            const doctorName = doc.user?.name || 'طبيب';
            const option = document.createElement('option');
            option.value = doc.id; // Consultation model requires doctor_id from DoctorProfile
            option.textContent = `د. ${doctorName} - ${doc.specialty}`;
            selectEl.appendChild(option);
        });

    } catch (error) {
        console.error("Failed to load doctors:", error);
        selectEl.innerHTML = '<option value="" disabled selected>فشل في تحميل الأطباء</option>';
    }
}

/**
 * Handle Schema-driven Consultation submission
 */
function bindFormSubmission() {
    const form = document.getElementById('consultationForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const doctorId = document.getElementById('doctorSelect').value;
        const question = document.getElementById('questionInput').value.trim();

        if (!doctorId || !question) {
            showAlert('error', 'يرجى اختيار طبيب وكتابة تفاصيل الاستشارة.', 'ph-warning-circle');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> جاري الإرسال...';

            // window.ApiService.createConsultation implicitly takes the userId from the token
            await window.ApiService.createConsultation(doctorId, question);
            
            // Show Success Notification
            showAlert('success', 'تم إرسال استشارتك بنجاح. سيقوم الطبيب بالرد عليك قريباً.', 'ph-check-circle');
            
            // Clear form
            form.reset();

        } catch (error) {
            console.error("Consultation Submission Error:", error);
            showAlert('error', error.message || 'حدث خطأ أثناء إرسال الاستشارة. يرجى المحاولة لاحقاً.', 'ph-warning-circle');
        } finally {
            // Reset Button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

/**
 * Notification Helper matching Stitch constraints
 */
function showAlert(type, message, iconClass) {
    if(window.Toast) {
        window.Toast.show(type === 'success' ? 'نجاح' : 'تنبيه', message, type);
    }
}
