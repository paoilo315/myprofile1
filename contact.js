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
  const messageCount = document.getElementById('messageCount');

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
    return String(text).replace(/[&<>"']/g, (m)=>({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;"
    }[m]));
  }

  function initials(name){
    if(!name) return '??';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }

  function colorFromString(s){
    let h = 0; for(let i=0;i<s.length;i++) h = (h<<5) - h + s.charCodeAt(i);
    const hue = Math.abs(h) % 360;
    return `hsl(${hue} 70% 45%)`;
  }

  function renderMessages(){
    const list = readMessages();
    messagesList.innerHTML = '';
    messageCount.textContent = `${list.length} message${list.length===1 ? '' : 's'}`;
    if(list.length === 0){
      messagesList.innerHTML = '<p style="color:#555; margin:0">No messages yet.</p>';
      return;
    }
    // render newest first by iterating from the end
    for(let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      const div = document.createElement('div');
      div.className = 'msg-card';
      const name = escapeHtml(m.fullname || '—');
      const mail = escapeHtml(m.email || '—');
      const contact = escapeHtml(m.contact || '—');
      const body = escapeHtml(m.message || '');
      const time = m.submittedAt ? formatDate(m.submittedAt) : '';

      // avatar
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.style.background = colorFromString(name || mail || String(i));
      avatar.textContent = initials(name || mail);

      const content = document.createElement('div');
      content.style.flex = '1';
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="font-weight:700">${name}</div>
          <div class="meta">${time}</div>
        </div>
        <div class="meta">${mail} • ${contact}</div>
        <div style="margin-top:8px; white-space:pre-wrap">${body}</div>
      `;

      // delete button
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn small secondary';
      delBtn.textContent = 'Delete';
      delBtn.style.position = 'absolute';
      delBtn.style.right = '12px';
      delBtn.style.top = '12px';
      delBtn.addEventListener('click', ()=>{
        if(!confirm('Delete this message? This cannot be undone.')) return;
        const current = readMessages();
        // remove the item at index i in original array
        current.splice(i, 1);
        saveMessages(current);
      });

      div.appendChild(avatar);
      div.appendChild(content);
      div.appendChild(delBtn);
      messagesList.appendChild(div);
    }
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
