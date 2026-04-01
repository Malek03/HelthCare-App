/**
 * BMI Calculator Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bmiForm');
    if (form) {
      form.addEventListener('submit', calculateBMI);
    }
  });
  
  function calculateBMI(e) {
    e.preventDefault();
  
    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
  
    if (!weight || !heightCm) return;
  
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    const bmiRounded = bmi.toFixed(1);
  
    displayResult(bmiRounded);
  }
  
  function displayResult(bmi) {
    const resultCard = document.getElementById('resultCard');
    const bmiValue = document.getElementById('bmiValue');
    const badge = document.getElementById('bmiCategoryBadge');
    const statusText = document.getElementById('bmiStatusText');
    const adviceText = document.getElementById('bmiAdviceText');
    const ring = document.querySelector('.result-number-container');
  
    resultCard.style.display = 'block';
    bmiValue.textContent = bmi;
  
    // Reset classes
    badge.className = 'label';
    ring.style.borderColor = 'var(--sys-color-surface-variant)';
  
    if (bmi < 18.5) {
      badge.textContent = 'نقص في الوزن';
      badge.classList.add('category-underweight');
      statusText.textContent = 'وزنك أقل من المعدل الطبيعي';
      adviceText.textContent = 'ينصح بتناول وجبات غذائية متوازنة غنية بالسعرات الحرارية الصحية وتفضيل استشارة أخصائي تغذية.';
      ring.style.borderColor = '#0288D1';
    } 
    else if (bmi >= 18.5 && bmi <= 24.9) {
      badge.textContent = 'وزن طبيعي';
      badge.classList.add('category-normal');
      statusText.textContent = 'وزنك مثالي وممتاز!';
      adviceText.textContent = 'حافظ على نمط حياتك الصحي من خلال الاستمرار في تناول الغذاء المتوازن وممارسة الرياضة بانتظام.';
      ring.style.borderColor = '#2E7D32';
    } 
    else if (bmi >= 25 && bmi <= 29.9) {
      badge.textContent = 'زيادة في الوزن';
      badge.classList.add('category-overweight');
      statusText.textContent = 'لديك زيادة بسيطة في الوزن';
      adviceText.textContent = 'ينصح بزيادة النشاط البدني اليومي والتقليل من السكريات والدهون المشبعة للعودة للوزن المثالي.';
      ring.style.borderColor = '#F57C00';
    } 
    else {
      badge.textContent = 'سمنة';
      badge.classList.add('category-obese');
      statusText.textContent = 'وزنك في مرحلة السمنة';
      adviceText.textContent = 'يجب استشارة طبيب متخصص فوراً لوضع خطة آمنة لإنقاص الوزن لتجنب المضاعفات الصحية والمخاطر.';
      ring.style.borderColor = 'var(--sys-color-error)';
    }
  
    // Scroll to result on mobile
    if (window.innerWidth < 768) {
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  
  function resetBMI() {
    document.getElementById('bmiForm').reset();
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('weight').focus();
  }
