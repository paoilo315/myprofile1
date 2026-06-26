document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const fullname = document.getElementById('fullname');
  const email = document.getElementById('email');
  const contactInput = document.getElementById('contactInput');
  const message = document.getElementById('message');

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    if (!fullname.value.trim()) {
      alert('Please enter your full name');
      fullname.focus();
      return;
    }

    const emailValue = email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
      alert('Please enter a valid email address');
      email.focus();
      return;
    }

    if (!message.value.trim()) {
      alert('Please enter your message');
      message.focus();
      return;
    }

    // Save submission to localStorage (no backend in this repo)
    const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    submissions.push({
      fullname: fullname.value.trim(),
      email: emailValue,
      contact: contactInput.value.trim(),
      message: message.value.trim(),
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem('contactSubmissions', JSON.stringify(submissions));

    // Replace the form with a thank-you message
    const contactDiv = document.getElementById('contact');
    contactDiv.innerHTML = `\n      <h1>Thank you!</h1>\n      <p>Thanks, ${escapeHtml(fullname.value)} — your message has been received.</p>\n      <p>We'll get back to you at <strong>${escapeHtml(emailValue)}</strong> if needed.</p>\n    `;
  });
});
