  // Disable form controls while sending
  const controls = Array.from(document.querySelectorAll('#contactForm button, #contactForm input, #contactForm textarea'));
  controls.forEach(c => c.disabled = true);

  try {
    const resp = await fetch('/.netlify/functions/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });

    if (resp.ok) {
      appendMessage(submission); // keep a local copy too
      showSnackbar('Message sent — thank you!');
      form.reset();
    } else {
      const text = await resp.text().catch(()=>resp.statusText);
      appendMessage(submission);
      showSnackbar('Saved locally — server send failed.');
      console.warn('Server responded with error:', resp.status, text);
    }
  } catch (err) {
    appendMessage(submission);
    showSnackbar('Network error — message saved locally.');
    console.warn('Network error sending contact:', err);
  } finally {
    controls.forEach(c => c.disabled = false);
  }
});
