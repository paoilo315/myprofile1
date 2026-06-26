  // Disable form controls while sending (show spinner on submit button)
  const sendBtn = document.querySelector('#contactForm button[type="submit"]');
  const originalBtnText = sendBtn ? sendBtn.textContent : null;
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; }
  const controls = Array.from(document.querySelectorAll('#contactForm button, #contactForm input, #contactForm textarea'));
  controls.forEach(c => c.disabled = true);

  try {
    const resp = await fetch('/.netlify/functions/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });

    if (resp.ok) {
      appendMessage(submission);
      showSnackbar('Message sent — thank you!');
      form.reset();

      // also submit to Netlify Forms so entries appear in dashboard
      try {
        const netlifyForm = new URLSearchParams();
        netlifyForm.append('form-name', 'contact');
        netlifyForm.append('fullname', submission.fullname);
        netlifyForm.append('email', submission.email);
        netlifyForm.append('contact', submission.contact);
        netlifyForm.append('message', submission.message);
        netlifyForm.append('bot-field', '');

        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: netlifyForm.toString()
        }).catch(err => console.warn('Netlify Forms submit failed', err));
      } catch (e) { console.warn('Netlify Forms submit failed', e); }

    } else {
      const text = await resp.text().catch(()=>resp.statusText);
      appendMessage(submission);
      showSnackbar('Saved locally — server send failed.');
      console.warn('Server responded with error:', resp.status, text);

      // try netlify forms as fallback
      try {
        const netlifyForm = new URLSearchParams();
        netlifyForm.append('form-name', 'contact');
        netlifyForm.append('fullname', submission.fullname);
        netlifyForm.append('email', submission.email);
        netlifyForm.append('contact', submission.contact);
        netlifyForm.append('message', submission.message);
        netlifyForm.append('bot-field', '');

        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: netlifyForm.toString()
        }).catch(err => console.warn('Netlify Forms submit failed', err));
      } catch (e) { console.warn('Netlify Forms submit failed', e); }
    }
  } catch (err) {
    appendMessage(submission);
    showSnackbar('Network error — message saved locally.');
    console.warn('Network error sending contact:', err);

    // try netlify forms as fallback
    try {
      const netlifyForm = new URLSearchParams();
      netlifyForm.append('form-name', 'contact');
      netlifyForm.append('fullname', submission.fullname);
      netlifyForm.append('email', submission.email);
      netlifyForm.append('contact', submission.contact);
      netlifyForm.append('message', submission.message);
      netlifyForm.append('bot-field', '');

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: netlifyForm.toString()
      }).catch(err => console.warn('Netlify Forms submit failed', err));
    } catch (e) { console.warn('Netlify Forms submit failed', e); }
  } finally {
    controls.forEach(c => c.disabled = false);
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = originalBtnText; }
  }
});
