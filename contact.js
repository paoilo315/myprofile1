document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const fullname = document.getElementById('fullname');
  const email = document.getElementById('email');
  const contactInput = document.getElementById('contactInput');
  const message = document.getElementById('message');

  const messagesList = document.getElementById('messagesList');
  const exportBtn = document.getElementById('exportCsv');
  const clearAllBtn = document.getElementById('clearAll');
  const clearFormBtn = document.getElementById('clearForm');

  const STORAGE_KEY = 'contactSubmissions';

  function readMessages(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }catch(e){
      console.error('Failed to parse stored messages', e);
      return [];
    }
  }

  function saveMessages(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // trigger render
    renderMessages();
  }

  function formatDate(iso){
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function escapeHtml(text){
    if(!text && text !== 0) return '';
    return String(text).replace(/[&<>\"']/g, (m)=>({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":"&#39;"
    }[m]));
  }

  function renderMessages(){
    const list = readMessages();
    messagesList.innerHTML = '';
    if(list.length === 0){
      messagesList.innerHTML = '<p style="color:#444;">No messages yet.</p>';
      return;
    }
    // newest first
    list.slice().reverse().forEach((m, idx)=>{
      const div = document.createElement('div');
      div.className = 'msg-card';
      const name = escapeHtml(m.fullname || '—');
      const mail = escapeHtml(m.email || '—');
      const contact = escapeHtml(m.contact || '—');
      const body = escapeHtml(m.message || '');
      const time = m.submittedAt ? formatDate(m.submittedAt) : '';

      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="font-weight:700">${name}</div>
          <div class="meta">${time}</div>
        </div>
        <div class="meta">${mail} • ${contact}</div>
        <div style="margin-top:8px">${body.replace(/\n/g,'<br>')}</div>
      `;

      messagesList.appendChild(div);
    });
  }

  function appendMessage(obj){
    const list = readMessages();
    list.push(obj);
    saveMessages(list);
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // simple validation
    if(!fullname.value.trim()){
      alert('Please enter your full name');
      fullname.focus();
      return;
    }
    const emailVal = email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(emailVal)){
      alert('Please enter a valid email address');
      email.focus();
      return;
    }
    if(!message.value.trim()){
      alert('Please enter your message');
      message.focus();
      return;
    }

    const submission = {
      fullname: fullname.value.trim(),
      email: emailVal,
      contact: contactInput.value.trim(),
      message: message.value.trim(),
      submittedAt: new Date().toISOString()
    };

    appendMessage(submission);

    // feedback to user
    alert('Thanks! Your message has been saved.');

    form.reset();
  });

  clearFormBtn.addEventListener('click', ()=>{ form.reset(); });

  exportBtn.addEventListener('click', ()=>{
    const list = readMessages();
    if(list.length === 0){ alert('No messages to export'); return; }
    const headers = ['fullname','email','contact','message','submittedAt'];
    const rows = list.map(r => headers.map(h => '"' + (String(r[h] || '').replace(/"/g,'""')) + '"').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messages.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  clearAllBtn.addEventListener('click', ()=>{
    if(!confirm('Clear all stored messages on this browser? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderMessages();
  });

  // storage event (sync across tabs)
  window.addEventListener('storage', (e)=>{
    if(e.key === STORAGE_KEY) renderMessages();
  });

  // initial render
  renderMessages();
});
