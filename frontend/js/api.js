/**
 * API Wrapper for Healthcare Platform Backend
 * Provides mock calls or connects directly to Prisma/Express endpoints.
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';
const BASE_SERVER_URL = 'http://127.0.0.1:5000';

class ApiService {
  /**
   * Formats a local path (like /uploads/...) into a full URL
   */
  static getImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_SERVER_URL}${cleanPath}`;
  }
  /**
   * Internal fetch wrapper handling tokens and JSON parsing
   */
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log(`API Request: ${endpoint}`, { method: options.method || 'GET', headers, body: options.body });
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      console.log(`API Response: ${endpoint}`, { status: response.status, statusText: response.statusText });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Server Error');
      }
      
      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // Auth API
  // ==========================================
  static async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  static async getMe() {
    return this.request('/auth/me', { method: 'GET' });
  }

  // ==========================================
  // Doctors API
  // ==========================================
  static async getDoctors(page = 1, limit = 12, search = '', specialty = '') {
    const query = new URLSearchParams({ page, limit, search, specialty }).toString();
    return this.request(`/doctors?${query}`, { method: 'GET' });
  }

  static async getDoctorProfile(id) {
    return this.request(`/doctors/profile/${id}`, { method: 'GET' });
  }

  static async applyAsDoctor(formData) {
    return this.request('/doctors/apply', {
      method: 'POST',
      body: formData
    });
  }

  // ==========================================
  // Appointments API
  // ==========================================
  static async createAppointment(doctorId, dateTime, notes = '', reason = '') {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctor_id: doctorId, date_time: dateTime, notes, reason })
    });
  }

  static async getMyAppointments(page = 1, limit = 10) {
    return this.request(`/appointments/my?page=${page}&limit=${limit}`, { method: 'GET' });
  }

  // ==========================================
  // Consultations API
  // ==========================================
  static async createConsultation(doctorId, question) {
    return this.request('/consultations', {
      method: 'POST',
      body: JSON.stringify({ doctor_id: doctorId, question })
    });
  }

  static async getMyConsultations() {
    return this.request('/consultations/my', { method: 'GET' });
  }

  // ==========================================
  // Health Tracking API
  // ==========================================
  static async logWater() {
    return this.request('/health/water', { method: 'POST' });
  }

  static async logSleep(hours) {
    return this.request('/health/sleep', {
      method: 'POST',
      body: JSON.stringify({ hours })
    });
  }

  static async logWalk(steps = null) {
    return this.request('/health/walk', {
      method: 'POST',
      body: JSON.stringify({ steps })
    });
  }

  static async getDailySummary(date) {
    // date format: YYYY-MM-DD
    return this.request(`/health/daily-summary/${date}`, { method: 'GET' });
  }

  static async getWeeklySummary() {
    return this.request('/health/weekly-summary', { method: 'GET' });
  }
  
  // ==========================================
  // Articles & Videos API
  // ==========================================
  static async getArticles(page = 1, limit = 9) {
    return this.request(`/articles?page=${page}&limit=${limit}`, { method: 'GET' });
  }

  static async getArticleById(id) {
    return this.request(`/articles/${id}`, { method: 'GET' });
  }

  static async getVideos() {
    return this.request('/videos', { method: 'GET' });
  }

  // ==========================================
  // Doctor Dashboard API
  // ==========================================
  static async getDoctorDashboard() {
    return this.request('/doctors/dashboard', { method: 'GET' });
  }

  static async updateDoctorProfile(data) {
    return this.request('/doctors/my-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async getDoctorSchedule() {
    return this.request('/doctors/schedule', { method: 'GET' });
  }

  static async updateDoctorSchedule(schedules) {
    return this.request('/doctors/schedule', {
      method: 'POST',
      body: JSON.stringify({ schedules }),
    });
  }

  static async getDoctorAppointments(page = 1, limit = 10, status = '') {
    let url = `/appointments/doctor?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.request(url, { method: 'GET' });
  }

  static async updateDoctorAppointmentStatus(id, status, rejectReason = '') {
    return this.request(`/appointments/doctor/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reject_reason: rejectReason })
    });
  }

  // ==========================================
  // Doctor Articles API
  // ==========================================
  static async getMyArticles() {
    return this.request('/articles/doctor/my', { method: 'GET' });
  }

  static async createDoctorArticle(data) {
    return this.request('/articles/doctor', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  static async updateDoctorArticle(id, data) {
    return this.request(`/articles/doctor/${id}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  static async deleteDoctorArticle(id) {
    return this.request(`/articles/doctor/${id}`, { method: 'DELETE' });
  }

  // ==========================================
  // Doctor Consultations API
  // ==========================================
  static async getDoctorConsultations(page = 1, limit = 20, status = '') {
    let url = `/consultations/doctor?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.request(url, { method: 'GET' });
  }

  static async answerConsultation(id, answer) {
    return this.request(`/consultations/doctor/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ answer })
    });
  }

  // ==========================================
  // Admin Dashboard API
  // ==========================================
  static async getAdminStats() {
    return this.request('/admin/stats', { method: 'GET' });
  }

  static async getAdminUsers(page = 1, limit = 20, search = '', role = '') {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    return this.request(`/admin/users?${params.toString()}`, { method: 'GET' });
  }

  static async banUser(id, is_banned = true) {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ is_banned })
    });
  }

  static async deleteUser(id) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  static async promoteUser(id, data) {
    return this.request(`/admin/users/${id}/promote`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  static async getApplications(status = 'PENDING', page = 1, limit = 20) {
    const params = new URLSearchParams({ status, page, limit });
    return this.request(`/admin/applications?${params.toString()}`, { method: 'GET' });
  }

  static async handleApplication(id, status, admin_notes = '') {
    return this.request(`/admin/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, admin_notes })
    });
  }

  static async getAdminDoctors(page = 1, limit = 20) {
    const params = new URLSearchParams({ page, limit });
    return this.request(`/admin/doctors?${params.toString()}`, { method: 'GET' });
  }

  static async deleteDoctor(id) {
    return this.request(`/admin/doctors/${id}`, { method: 'DELETE' });
  }

  static async createAdminArticle(title, content, image = '') {
    return this.request('/admin/articles', {
      method: 'POST',
      body: JSON.stringify({ title, content, image })
    });
  }

  static async createAdminVideo(title, url, description = '', thumbnail = '') {
    return this.request('/admin/videos', {
      method: 'POST',
      body: JSON.stringify({ title, url, description, thumbnail })
    });
  }

  static async getHealthTips() {
    return this.request('/admin/health-tips', { method: 'GET' });
  }

  static async createHealthTip(content) {
    return this.request('/admin/health-tips', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  static async sendHealthTip(id) {
    return this.request(`/admin/health-tips/${id}/send`, { method: 'POST' });
  }

  // ==========================================
  // Notifications API
  // ==========================================
  static async updateFcmToken(fcmToken) {
    return this.request('/auth/update-fcm', {
      method: 'PUT',
      body: JSON.stringify({ fcm_token: fcmToken })
    });
  }

  static async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    let url = `/notifications?page=${page}&limit=${limit}`;
    if (unreadOnly) url += `&unread_only=true`;
    return this.request(url, { method: 'GET' });
  }

  static async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  static async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }
}

// Expose globally for easy component usage
window.ApiService = ApiService;
