document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const fullname = document.getElementById('fullname');
  const email = document.getElementById('email');
  const contactInput = document.getElementById('contactInput');
  const message = document.getElementById('message');

  const messagesList = document.getElementById('messagesList');
  const searchBox = document.getElementById('searchBox');
  const filterTags = document.querySelectorAll('.tag');
  const exportBtn = document.getElementById('exportCsv');
  const clearAllBtn = document.getElementById('clearAll');
  const clearFormBtn = document.getElementById('clearForm');
  const messageCount = document.getElementById('messageCount');
  const paginationDiv = document.getElementById('pagination');

  const STORAGE_KEY = 'contactSubmissions';
  const ITEMS_PER_PAGE = 5;
  
  let currentFilter = 'all';
  let currentPage = 1;
  let lastDeletedMsg = null;
  let lastDeletedIdx = null;

  function readMessages(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ console.error('Failed to parse stored messages', e); return []; }
  }

  function saveMessages(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    currentPage = 1;
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

  function showSnackbar(text, duration = 3000){
    const snack = document.createElement('div');
    snack.className = 'snackbar';
    snack.textContent = text;
    document.body.appendChild(snack);
    setTimeout(() => snack.remove(), duration);
  }

  function getFilteredMessages(){
    const list = readMessages();
    const search = searchBox.value.toLowerCase().trim();
    return list.filter((m) => {
      const matchFilter = currentFilter === 'unread' ? !m.read : true;
      if(!search) return matchFilter;
      const text = `${m.fullname} ${m.email} ${m.contact} ${m.message}`.toLowerCase();
      return matchFilter && text.includes(search);
    });
  }

  function renderMessages(){
    const filtered = getFilteredMessages();
    messagesList.innerHTML = '';
    messageCount.textContent = `${filtered.length} message${filtered.length===1 ? '' : 's'}`;
    
    if(filtered.length === 0){
      messagesList.innerHTML = '<p style="color:#555; margin:0">No messages found.</p>';
      paginationDiv.innerHTML = '';
      return;
    }

    // pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    if(currentPage > totalPages) currentPage = totalPages;
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const page = filtered.slice().reverse().slice(start, end);

    // render messages
    page.forEach((m) => {
      const allMessages = readMessages();
      const originalIdx = allMessages.findIndex(x => x.submittedAt === m.submittedAt);
      
      const div = document.createElement('div');
      div.className = 'msg-card';
      if(m.read !== true) div.classList.add('unread');

      const name = escapeHtml(m.fullname || '—');
      const mail = escapeHtml(m.email || '—');
      const contact = escapeHtml(m.contact || '—');
      const body = escapeHtml(m.message || '');
      const time = m.submittedAt ? formatDate(m.submittedAt) : '';

      // avatar
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.style.background = colorFromString(name || mail || String(originalIdx));
      avatar.textContent = initials(name || mail);

      const content = document.createElement('div');
      content.className = 'content';
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div style="display:flex; gap:8px; align-items:center">
            <div style="font-weight:700">${name}</div>
            ${!m.read ? '<span class="badge">Unread</span>' : ''}
          </div>
          <div class="meta">${time}</div>
        </div>
        <div class="meta">${mail} • ${contact}</div>
        <div style="margin-top:8px; white-space:pre-wrap">${body}</div>
      `;

      // click to mark as read/unread
      div.addEventListener('click', (e) => {
        if(!e.target.closest('button')) {
          const list = readMessages();
          if(list[originalIdx]) {
            list[originalIdx].read = !list[originalIdx].read;
            saveMessages(list);
          }
        }
      });

      // action buttons
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';
      actions.style.position = 'absolute';
      actions.style.top = '12px';
      actions.style.right = '12px';
      actions.style.flexWrap = 'wrap';
      actions.style.justifyContent = 'flex-end';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn small secondary';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editMessage(originalIdx);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn small danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if(!confirm('Delete this message?')) return;
        const list = readMessages();
        lastDeletedMsg = {index: originalIdx, data: JSON.parse(JSON.stringify(list[originalIdx]))};
        lastDeletedIdx = originalIdx;
        list.splice(originalIdx, 1);
        saveMessages(list);
        
        // show undo snackbar
        const undo = document.createElement('div');
        undo.style.position = 'fixed';
        undo.style.bottom = '20px';
        undo.style.right = '20px';
        undo.style.background = 'var(--accent-2)';
        undo.style.color = 'white';
        undo.style.padding = '12px 16px';
        undo.style.borderRadius = '10px';
        undo.style.zIndex = '9999';
        undo.style.display = 'flex';
        undo.style.gap = '12px';
        undo.style.alignItems = 'center';
        undo.style.boxShadow = '0 6px 18px rgba(16,24,40,0.2)';
        
        const text = document.createElement('span');
        text.textContent = 'Message deleted';
        
        const undoBtn = document.createElement('button');
        undoBtn.className = 'btn small';
        undoBtn.style.background = 'white';
        undoBtn.style.color = 'var(--accent-2)';
        undoBtn.style.marginTop = '0';
        undoBtn.textContent = 'Undo';
        undoBtn.addEventListener('click', () => {
          const list = readMessages();
          list.splice(lastDeletedIdx, 0, lastDeletedMsg.data);
          saveMessages(list);
          undo.remove();
          showSnackbar('Message restored!');
        });
        
        undo.appendChild(text);
        undo.appendChild(undoBtn);
        document.body.appendChild(undo);
        setTimeout(() => undo.remove(), 5000);
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      div.appendChild(avatar);
      div.appendChild(content);
      div.appendChild(actions);
      messagesList.appendChild(div);
    });

    // render pagination
    paginationDiv.innerHTML = '';
    if(totalPages > 1){
      for(let i = 1; i <= totalPages; i++){
        const pageBtn = document.createElement('button');
        pageBtn.className = 'btn small secondary';
        if(i === currentPage) {
          pageBtn.style.background = 'var(--accent)';
          pageBtn.style.color = 'white';
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          renderMessages();
          messagesList.scrollTop = 0;
        });
        paginationDiv.appendChild(pageBtn);
      }
    }
  }

  function editMessage(idx){
    const list = readMessages();
    const m = list[idx];
    fullname.value = m.fullname;
    email.value = m.email;
    contactInput.value = m.contact || '';
    message.value = m.message;
    list.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    renderMessages();
    showSnackbar('Message loaded for editing. Submit to save as new.');
    fullname.focus();
  }

  function appendMessage(obj){
    const list = readMessages();
    list.push({...obj, read: false});
    saveMessages(list);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!fullname.value.trim()){ alert('Please enter your full name'); fullname.focus(); return; }
    const emailVal = email.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(emailVal)){ alert('Please enter a valid email address'); email.focus(); return; }
    if(!message.value.trim()){ alert('Please enter your message'); message.focus(); return; }

    const submission = {
      fullname: fullname.value.trim(),
      email: emailVal,
      contact: contactInput.value.trim(),
      message: message.value.trim(),
      submittedAt: new Date().toISOString()
    };

    appendMessage(submission);
    showSnackbar('Message saved successfully!');
    form.reset();
  });

  clearFormBtn.addEventListener('click', () => { form.reset(); });

  exportBtn.addEventListener('click', () => {
    const list = readMessages();
    if(list.length === 0){ alert('No messages to export'); return; }
    const headers = ['fullname','email','contact','message','read','submittedAt'];
    const rows = list.map(r => headers.map(h => '"' + (String(r[h] || '').replace(/"/g,'""')) + '"').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showSnackbar('Messages exported to CSV!');
  });

  clearAllBtn.addEventListener('click', () => {
    if(!confirm('Clear all stored messages? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderMessages();
    showSnackbar('All messages cleared');
  });

  searchBox.addEventListener('input', () => {
    currentPage = 1;
    renderMessages();
  });

  filterTags.forEach(tag => {
    tag.addEventListener('click', () => {
      filterTags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      currentFilter = tag.dataset.filter;
      currentPage = 1;
      renderMessages();
    });
  });

  window.addEventListener('storage', (e) => {
    if(e.key === STORAGE_KEY) renderMessages();
  });

  // initial render
  renderMessages();
});
