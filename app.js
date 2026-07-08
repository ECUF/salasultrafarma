const ASSET = 'assets/';
const FALLBACK_IMAGES = {
  'assets/logo-ultrafarma.png':'logo-ultrafarma.png',
  'assets/logo-u.png':'logo-u.png',
  'assets/sala-1.jpeg':'sala-1.jpeg',
  'assets/sala-4.jpeg':'sala-4.jpeg',
  'assets/sala-5.jpeg':'sala-5.jpeg',
  'assets/sala-7.jpeg':'sala-7.jpeg',
  'assets/sala-8.jpeg':'sala-8.jpeg',
  'assets/mapa-referencia.png':'mapa-referencia.png'
};
function img(src, alt='', cls='', style=''){
  const fallback = FALLBACK_IMAGES[src] || src.replace(/^assets\//,'');
  return `<img ${cls?`class="${cls}"`:''} src="${src}" alt="${escapeHtml(alt)}" ${style?`style="${style}"`:''} onerror="this.onerror=null;this.src='${fallback}'">`;
}
const roomsSeed = [
  { id:'sala-1', name:'Sala 1', capacity:4, image:'assets/sala-1.jpeg', images:['assets/sala-1.jpeg'], location:'Administrativo', active:true, resources:'TV, mesa, cadeiras e quadro' },
  { id:'sala-7', name:'Sala 7', capacity:4, image:'assets/sala-7.jpeg', images:['assets/sala-7.jpeg'], location:'Administrativo', active:true, resources:'TV, mesa, cadeiras e ar-condicionado' },
  { id:'sala-4', name:'Sala 4', capacity:8, image:'assets/sala-4.jpeg', images:['assets/sala-4.jpeg','assets/sala-5.jpeg'], location:'Administrativo', active:true, resources:'Mesa executiva, conferência, quadro e ar-condicionado' },
  { id:'sala-5', name:'Sala 5', capacity:8, image:'assets/sala-5.jpeg', images:['assets/sala-5.jpeg','assets/sala-4.jpeg'], location:'Administrativo', active:true, resources:'Mesa executiva, conferência, quadro e ar-condicionado' },
  { id:'sala-8', name:'Sala 8', capacity:4, image:'assets/sala-8.jpeg', images:['assets/sala-8.jpeg'], location:'Administrativo', active:true, resources:'Mesa, cadeiras e espaço reservado' },
  { id:'auditorio', name:'Auditório', capacity:100, image:'assets/mapa-referencia.png', images:['assets/mapa-referencia.png'], location:'Eventos', active:true, resources:'Auditório para eventos, treinamentos e apresentações' }
];
const usersSeed = [
  { id:'admin', name:'Administrador Ultrafarma', email:'admin@ultrafarma.com', password:'admin123', role:'admin', status:'approved', department:'Marketing' },
  { id:'demo', name:'Usuário Demonstração', email:'usuario@ultrafarma.com', password:'123456', role:'user', status:'approved', department:'Comercial' }
];
const todayISO = () => new Date().toISOString().slice(0,10);
const pad = n => String(n).padStart(2,'0');
const minutes = time => { const [h,m]=time.split(':').map(Number); return h*60+m; };
const hm = mins => `${pad(Math.floor(mins/60))}:${pad(mins%60)}`;
const dateLabel = iso => new Date(iso+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
const state = { tab:'agenda', adminTab:'dashboard', view:'day', date:todayISO(), room:'all', currentUser:null, modal:null };
let data = loadData();

function loadData(){
  const saved = localStorage.getItem('ultraReservaDataV2');
  if(saved){
    const parsed = JSON.parse(saved);
    return { rooms: roomsSeed.map(r => ({...r, ...(parsed.rooms||[]).find(x=>x.id===r.id)})).concat((parsed.rooms||[]).filter(r=>!roomsSeed.some(s=>s.id===r.id))), users: parsed.users||usersSeed, reservations: parsed.reservations||[], settings: parsed.settings||defaultSettings() };
  }
  const base = { rooms: roomsSeed, users: usersSeed, reservations: seedReservations(), settings: defaultSettings() };
  localStorage.setItem('ultraReservaDataV2', JSON.stringify(base));
  return base;
}
function save(){ localStorage.setItem('ultraReservaDataV2', JSON.stringify(data)); }
function defaultSettings(){ return { open:'08:00', close:'19:00', minDuration:30, maxDuration:240, slot:30, requireApproval:true, allowCancel:true }; }
function seedReservations(){
  const d=todayISO();
  return [
    {id:crypto.randomUUID(), roomId:'sala-4', userId:'demo', title:'Reunião Marketing', date:d, start:'09:00', end:'10:00', people:6, status:'approved', notes:'Reunião diária'},
    {id:crypto.randomUUID(), roomId:'sala-5', userId:'demo', title:'Alinhamento Comercial', date:d, start:'15:30', end:'16:30', people:5, status:'approved', notes:''}
  ];
}

function setSession(user){ state.currentUser = user; localStorage.setItem('ultraReservaSession', user ? user.id : ''); render(); }
function restoreSession(){ const id = localStorage.getItem('ultraReservaSession'); if(id) state.currentUser = data.users.find(u=>u.id===id) || null; }
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 2600); }
function initials(name){ return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase(); }
function byId(id){ return document.getElementById(id); }
function escapeHtml(str=''){ return String(str).replace(/[&<>'"]/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
function currentReservations(){ return data.reservations.filter(r => r.date===state.date && (state.room==='all' || r.roomId===state.room) && r.status!=='cancelled'); }
function approvedRooms(){ return data.rooms.filter(r=>r.active); }
function hasConflict(roomId,date,start,end,ignoreId=null){
  const s=minutes(start), e=minutes(end);
  return data.reservations.some(r => r.id!==ignoreId && r.roomId===roomId && r.date===date && r.status!=='cancelled' && Math.max(s,minutes(r.start)) < Math.min(e,minutes(r.end)));
}
function getUser(id){ return data.users.find(u=>u.id===id) || {name:'Usuário removido', email:''}; }
function getRoom(id){ return data.rooms.find(r=>r.id===id) || {name:'Sala removida', capacity:0}; }
function isAdmin(){ return state.currentUser?.role === 'admin'; }

function render(){
  if(!state.currentUser) return renderLogin();
  document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          ${img('assets/logo-ultrafarma.png','Ultrafarma')}
          <span class="brand-divider"></span><strong>Reserva de Salas</strong>
        </div>
        <nav class="nav">
          ${navButton('agenda','Agenda')}
          ${navButton('mapa','Mapa ao vivo')}
          ${navButton('salas','Salas')}
          ${isAdmin()?navButton('admin','Admin'):''}
        </nav>
        <div class="userbox compact-userbox">
          <button class="btn-ghost" onclick="logout()">Sair</button>
        </div>
      </header>
      <main class="container">${renderTab()}</main>
    </div>
    ${state.modal ? renderModal() : ''}`;
}
function navButton(tab,label){ return `<button class="${state.tab===tab?'active':''}" onclick="changeTab('${tab}')">${label}</button>`; }
window.changeTab = tab => { state.tab=tab; render(); };
window.logout = () => setSession(null);
function renderTab(){
  if(state.tab==='agenda') return renderAgenda();
  if(state.tab==='mapa') return renderMap();
  if(state.tab==='salas') return renderRooms();
  if(state.tab==='admin' && isAdmin()) return renderAdmin();
  return renderAgenda();
}

function renderLogin(){
  document.getElementById('app').innerHTML = `
  <div class="login-page">
    <div class="login-card">
      <div class="login-left">
        ${img('assets/logo-ultrafarma.png','Ultrafarma')}
        <span class="eyebrow">Sistema interno Ultrafarma</span>
        <h1>Agendamento de salas com acesso restrito.</h1>
        <p class="muted">O colaborador solicita cadastro, o administrador aprova e a agenda fica protegida para uso interno.</p>
        <div class="notice" style="margin-top:28px"><b>Acesso demo:</b><br>Admin: admin@ultrafarma.com / admin123<br>Usuário: usuario@ultrafarma.com / 123456</div>
      </div>
      <div class="login-right">
        <div class="tabs"><button id="loginTabBtn" class="active" onclick="switchAuth('login')">Entrar</button><button id="registerTabBtn" onclick="switchAuth('register')">Solicitar cadastro</button></div>
        <form id="loginForm" class="form" onsubmit="doLogin(event)">
          <div class="field"><label>E-mail</label><input required type="email" name="email" placeholder="seuemail@ultrafarma.com" /></div>
          <div class="field"><label>Senha</label><input required type="password" name="password" placeholder="Sua senha" /></div>
          <button class="btn-primary" type="submit">Entrar no sistema</button>
        </form>
        <form id="registerForm" class="form hidden" onsubmit="doRegister(event)">
          <div class="grid two">
            <div class="field"><label>Nome completo</label><input required name="name" /></div>
            <div class="field"><label>Departamento</label><input required name="department" placeholder="Ex.: Marketing" /></div>
          </div>
          <div class="field"><label>E-mail corporativo</label><input required type="email" name="email" /></div>
          <div class="field"><label>Senha</label><input required type="password" minlength="6" name="password" /></div>
          <button class="btn-primary" type="submit">Enviar para aprovação</button>
          <div class="notice">Após o envio, o administrador precisa aprovar seu acesso em <b>Admin &gt; Pessoas</b>.</div>
        </form>
      </div>
    </div>
  </div>`;
}
window.switchAuth = type => {
  byId('loginForm').classList.toggle('hidden', type!=='login'); byId('registerForm').classList.toggle('hidden', type!=='register');
  byId('loginTabBtn').classList.toggle('active', type==='login'); byId('registerTabBtn').classList.toggle('active', type==='register');
};
window.doLogin = e => {
  e.preventDefault(); const fd=new FormData(e.target); const email=String(fd.get('email')).trim().toLowerCase(); const pass=fd.get('password');
  const user=data.users.find(u=>u.email.toLowerCase()===email && u.password===pass);
  if(!user) return toast('E-mail ou senha inválidos.');
  if(user.status!=='approved') return toast(user.status==='pending'?'Cadastro aguardando aprovação.':'Cadastro bloqueado pelo admin.');
  setSession(user);
};
window.doRegister = e => {
  e.preventDefault(); const fd=new FormData(e.target); const email=String(fd.get('email')).trim().toLowerCase();
  if(data.users.some(u=>u.email.toLowerCase()===email)) return toast('Este e-mail já está cadastrado.');
  data.users.push({id:crypto.randomUUID(), name:fd.get('name'), email, password:fd.get('password'), department:fd.get('department'), role:'user', status:'pending'}); save(); e.target.reset(); switchAuth('login'); toast('Cadastro enviado. Aguarde aprovação do administrador.');
};

function renderAgenda(){
  const rooms=approvedRooms();
  return `
  <section class="hero hero-simple">
    <div><span class="eyebrow">Sistema interno Ultrafarma</span><h1>Agendamento de salas de reunião e auditório</h1><p>Reserve salas, consulte disponibilidade em tempo real e evite conflitos de agenda.</p><div class="hero-actions"><button class="btn-primary" onclick="openReservation()">+ Nova reserva</button><button class="btn-ghost" onclick="setToday()">Ver hoje</button></div></div>
  </section>
  <section class="panel pad">
    ${renderFilters()}
    <div class="section-title"><div><span class="eyebrow">Agenda</span><h2>${dateLabel(state.date)}</h2></div></div>
    ${state.view==='day' ? renderDayView() : state.view==='week' ? renderWeekView() : renderMonthView()}
  </section>`;
}
function renderFilters(){
  return `<div class="filters">
    <div class="field"><label>Data</label><input type="date" value="${state.date}" onchange="setDate(this.value)"></div>
    <div class="field"><label>Sala</label><select onchange="setRoom(this.value)"><option value="all">Todas as salas</option>${approvedRooms().map(r=>`<option value="${r.id}" ${state.room===r.id?'selected':''}>${r.name}</option>`).join('')}</select></div>
    <div class="segmented"><button class="${state.view==='day'?'active':''}" onclick="setView('day')">Dia</button><button class="${state.view==='week'?'active':''}" onclick="setView('week')">Semana</button><button class="${state.view==='month'?'active':''}" onclick="setView('month')">Mês</button></div>
  </div>`;
}
window.setDate = v => { state.date=v; render(); };
window.setRoom = v => { state.room=v; render(); };
window.setView = v => { state.view=v; render(); };
window.setToday = () => { state.date=todayISO(); render(); };
function renderDayView(){
  const rooms = state.room==='all' ? approvedRooms() : approvedRooms().filter(r=>r.id===state.room);
  return `<div class="room-list">${rooms.map(room=>renderRoomDay(room)).join('')}</div>`;
}
function renderRoomDay(room){
  const res = data.reservations.filter(r=>r.roomId===room.id && r.date===state.date && r.status!=='cancelled').sort((a,b)=>minutes(a.start)-minutes(b.start));
  const next = nextFree(room.id, state.date);
  return `<article class="room-card"><div class="room-head">${img(room.image, room.name, 'room-photo')}<div><h3>${room.name}</h3><div class="muted">${room.capacity} lugares • Próximo horário: ${next}</div></div><button class="btn-primary" onclick="openReservation('${room.id}')">Reservar</button></div>${res.length?res.map(renderReservationRow).join(''):`<div class="empty">Nenhuma reserva para esta sala nesta data.</div>`}</article>`;
}
function nextFree(roomId,date){
  const now = new Date(); let start = date===todayISO()? Math.max(minutes(data.settings.open), Math.ceil((now.getHours()*60+now.getMinutes())/30)*30) : minutes(data.settings.open);
  const endDay=minutes(data.settings.close);
  for(let s=start; s+30<=endDay; s+=30){ if(!hasConflict(roomId,date,hm(s),hm(s+30))) return hm(s); }
  return 'Sem horário';
}
function renderReservationRow(r){
  const user=getUser(r.userId);
  return `<div class="reservation-row"><div class="time">${r.start}</div><div><strong>${escapeHtml(r.title)}</strong><br><span class="muted">${r.start}–${r.end} • ${r.people} pessoa(s) • ${escapeHtml(user.name)}</span></div><div>${(isAdmin() || r.userId===state.currentUser.id)?`<button class="btn-danger btn-small" onclick="cancelReservation('${r.id}')">Cancelar</button>`:''}</div></div>`;
}
function renderWeekView(){
  const base=new Date(state.date+'T12:00:00'); const monday=new Date(base); monday.setDate(base.getDate()-((base.getDay()+6)%7));
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday); d.setDate(monday.getDate()+i); return d.toISOString().slice(0,10);});
  const times=[]; for(let m=minutes(data.settings.open);m<minutes(data.settings.close);m+=60) times.push(hm(m));
  return `<div class="week-grid"><div></div>${days.map(d=>`<div class="week-head">${new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit'})}</div>`).join('')}${times.map(t=>`<div class="week-time">${t}</div>${days.map(d=>renderWeekSlot(d,t)).join('')}`).join('')}</div>`;
}
function renderWeekSlot(date,time){
  const s=minutes(time), e=s+60; const list=data.reservations.filter(r=>r.date===date && (state.room==='all'||r.roomId===state.room) && r.status!=='cancelled' && Math.max(s,minutes(r.start))<Math.min(e,minutes(r.end)));
  return `<div class="week-slot ${list.length?'busy':''}">${list.slice(0,2).map(r=>`${getRoom(r.roomId).name}: ${escapeHtml(r.title)}`).join('<br>') || 'Livre'}</div>`;
}
function renderMonthView(){
  const current=new Date(state.date+'T12:00:00'); const first=new Date(current.getFullYear(), current.getMonth(), 1); const start=new Date(first); start.setDate(first.getDate()-first.getDay());
  const cells=Array.from({length:42},(_,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); return d;});
  return `<div class="calendar-month">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<div class="week-head">${x}</div>`).join('')}${cells.map(d=>{const iso=d.toISOString().slice(0,10); const list=data.reservations.filter(r=>r.date===iso && (state.room==='all'||r.roomId===state.room) && r.status!=='cancelled'); return `<div class="day-cell ${d.getMonth()!==current.getMonth()?'off':''}" onclick="setDate('${iso}');setView('day')"><strong>${d.getDate()}</strong>${list.slice(0,4).map(r=>`<div class="mini-event">${getRoom(r.roomId).name} ${r.start}</div>`).join('')}${list.length>4?`<div class="mini-event">+${list.length-4} reserva(s)</div>`:''}</div>`}).join('')}</div>`;
}

function renderMap(){
  const now=new Date(); const currentM= state.date===todayISO() ? now.getHours()*60+now.getMinutes() : minutes(data.settings.open);
  return `<div class="section-title"><div><span class="eyebrow">Tempo real</span><h2>Mapa ao vivo das reservas</h2><p class="muted">Clique em uma sala para ver quem reservou, horário, duração, quantidade de pessoas e observações.</p></div></div><section class="panel pad">${renderMapFilters()}<div class="map-wrap"><div class="live-map"><div class="floor-outline"></div>${approvedRooms().map(room=>renderMapRoom(room,currentM)).join('')}</div><div class="map-side grid">${approvedRooms().map(room=>renderMapLegend(room,currentM)).join('')}</div></div></section>`;
}
function renderMapFilters(){
  return `<div class="filters map-filters">
    <div class="field"><label>Data</label><input type="date" value="${state.date}" onchange="setDate(this.value)"></div>
    <div class="field"><label>Sala</label><select onchange="setRoom(this.value)"><option value="all">Todas as salas</option>${approvedRooms().map(r=>`<option value="${r.id}" ${state.room===r.id?'selected':''}>${r.name}</option>`).join('')}</select></div>
  </div>`;
}
function roomStatus(roomId,m){
  const res=data.reservations.filter(r=>r.roomId===roomId && r.date===state.date && r.status!=='cancelled');
  const busy=res.find(r=>minutes(r.start)<=m && minutes(r.end)>m); if(busy) return {cls:'busy', label:'Ocupada agora', res:busy};
  const soon=res.find(r=>minutes(r.start)>m && minutes(r.start)<=m+60); if(soon) return {cls:'soon', label:`Próxima às ${soon.start}`, res:soon};
  return {cls:'available', label:'Disponível agora', res:null};
}
function renderMapRoom(room,m){ const st=roomStatus(room.id,m); return `<button class="map-room ${st.cls}" data-room="${room.id}" onclick="openRoomDetails('${room.id}')"><h4><span class="dot"></span>${room.name}</h4><p>${st.label}</p><p>${room.capacity} lugares</p></button>`; }
function renderMapLegend(room,m){ const st=roomStatus(room.id,m); return `<button class="room-card map-card" onclick="openRoomDetails('${room.id}')"><div class="room-head" style="grid-template-columns:90px 1fr">${img(room.image, room.name, 'room-photo')}<div><h3>${room.name}</h3><span class="badge ${st.cls==='busy'?'bad':st.cls==='soon'?'wait':'ok'}">${st.label}</span><div class="muted" style="margin-top:8px">${room.capacity} lugares • ${escapeHtml(room.location)}</div></div></div></button>`; }

function roomImages(room){ return (room.images && room.images.length ? room.images : [room.image]).filter(Boolean); }
function renderRoomGallery(room){
  return `<div class="room-gallery">${roomImages(room).map(src=>img(src, room.name, 'gallery-photo')).join('')}</div>`;
}
function renderRooms(){
  return `<div class="section-title"><div><span class="eyebrow">Espaços</span><h2>Salas e auditório</h2><p class="muted">Arraste as fotos para o lado para visualizar todas as imagens de cada espaço.</p></div>${isAdmin()?`<button class="btn-primary" onclick="openRoomForm()">+ Nova sala/espaço</button>`:''}</div><div class="grid three">${approvedRooms().map(room=>`<article class="room-card">${renderRoomGallery(room)}<div class="panel pad" style="border:0;box-shadow:none"><h3 style="margin:0;color:var(--blue);font-size:26px">${room.name}</h3><p class="muted">${room.capacity} lugares • ${escapeHtml(room.location)}</p><p>${escapeHtml(room.resources)}</p><button class="btn-primary" onclick="openReservation('${room.id}')">Reservar este espaço</button></div></article>`).join('')}</div>`;
}

function renderAdmin(){
  return `<div class="section-title"><div><span class="eyebrow">Administração</span><h2>Painel do administrador</h2></div></div><div class="admin-layout"><aside class="side">${adminBtn('dashboard','Visão geral')}${adminBtn('people','Pessoas')}${adminBtn('reservations','Reservas')}${adminBtn('rooms','Salas e espaços')}${adminBtn('settings','Horários e regras')}</aside><section class="panel pad">${renderAdminTab()}</section></div>`;
}
function adminBtn(id,label){ return `<button class="${state.adminTab===id?'active':''}" onclick="setAdminTab('${id}')">${label}</button>`; }
window.setAdminTab = id => { state.adminTab=id; render(); };
function renderAdminTab(){
  if(state.adminTab==='people') return renderPeopleAdmin();
  if(state.adminTab==='reservations') return renderReservationsAdmin();
  if(state.adminTab==='rooms') return renderRoomsAdmin();
  if(state.adminTab==='settings') return renderSettingsAdmin();
  return `<div class="grid three"><div class="metric"><b>${data.users.filter(u=>u.status==='pending').length}</b><span>Cadastros pendentes</span></div><div class="metric"><b>${data.reservations.filter(r=>r.date===todayISO() && r.status!=='cancelled').length}</b><span>Reservas hoje</span></div><div class="metric"><b>${data.rooms.filter(r=>r.active).length}</b><span>Espaços ativos</span></div></div><div class="notice" style="margin-top:20px">Neste painel você aprova usuários, cadastra novas salas, edita horários de funcionamento, gerencia reservas e acompanha a ocupação por sala.</div>`;
}
function renderPeopleAdmin(){
  return `<div class="section-title"><h2>Pessoas cadastradas</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>E-mail</th><th>Departamento</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead><tbody>${data.users.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.department||'-')}</td><td>${u.role}</td><td><span class="badge ${u.status==='approved'?'ok':u.status==='pending'?'wait':'bad'}">${u.status}</span></td><td>${u.status!=='approved'?`<button class="btn-ok btn-small" onclick="setUserStatus('${u.id}','approved')">Aprovar</button>`:''} ${u.status!=='blocked'?`<button class="btn-danger btn-small" onclick="setUserStatus('${u.id}','blocked')">Bloquear</button>`:''} ${u.role==='user'?`<button class="btn-ghost btn-small" onclick="makeAdmin('${u.id}')">Admin</button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderReservationsAdmin(){
  return `<div class="section-title"><h2>Gestão de reservas</h2><button class="btn-primary" onclick="openReservation()">+ Reserva</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Horário</th><th>Sala</th><th>Título</th><th>Pessoa</th><th>Ações</th></tr></thead><tbody>${data.reservations.filter(r=>r.status!=='cancelled').sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).map(r=>`<tr><td>${new Date(r.date+'T12:00:00').toLocaleDateString('pt-BR')}</td><td>${r.start}–${r.end}</td><td>${getRoom(r.roomId).name}</td><td>${escapeHtml(r.title)}</td><td>${escapeHtml(getUser(r.userId).name)}</td><td><button class="btn-danger btn-small" onclick="cancelReservation('${r.id}')">Cancelar</button></td></tr>`).join('')}</tbody></table></div>`;
}
function renderRoomsAdmin(){
  return `<div class="section-title"><h2>Salas e espaços</h2><button class="btn-primary" onclick="openRoomForm()">+ Novo espaço</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Espaço</th><th>Capacidade</th><th>Local</th><th>Status</th><th>Ações</th></tr></thead><tbody>${data.rooms.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${r.capacity}</td><td>${escapeHtml(r.location)}</td><td><span class="badge ${r.active?'ok':'bad'}">${r.active?'Ativa':'Inativa'}</span></td><td><button class="btn-ghost btn-small" onclick="openRoomForm('${r.id}')">Editar</button> <button class="btn-danger btn-small" onclick="toggleRoom('${r.id}')">${r.active?'Inativar':'Ativar'}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function renderSettingsAdmin(){
  const s=data.settings;
  return `<h2 style="color:var(--blue);margin-top:0">Horários e regras</h2><form class="form" onsubmit="saveSettings(event)"><div class="grid two"><div class="field"><label>Abre às</label><input type="time" name="open" value="${s.open}"></div><div class="field"><label>Fecha às</label><input type="time" name="close" value="${s.close}"></div><div class="field"><label>Duração mínima, em minutos</label><input type="number" name="minDuration" value="${s.minDuration}"></div><div class="field"><label>Duração máxima, em minutos</label><input type="number" name="maxDuration" value="${s.maxDuration}"></div></div><button class="btn-primary">Salvar regras</button></form>`;
}
window.setUserStatus=(id,status)=>{ const u=data.users.find(x=>x.id===id); if(u){u.status=status; save(); render(); toast('Status atualizado.');} };
window.makeAdmin=id=>{ const u=data.users.find(x=>x.id===id); if(u){u.role='admin'; u.status='approved'; save(); render(); toast('Usuário promovido a admin.');} };
window.toggleRoom=id=>{ const r=data.rooms.find(x=>x.id===id); if(r){r.active=!r.active; save(); render();} };
window.saveSettings=e=>{ e.preventDefault(); const fd=new FormData(e.target); data.settings={...data.settings, open:fd.get('open'), close:fd.get('close'), minDuration:Number(fd.get('minDuration')), maxDuration:Number(fd.get('maxDuration'))}; save(); render(); toast('Regras salvas.'); };


window.openRoomDetails = (roomId) => { state.modal={type:'roomDetails', roomId}; render(); };
function reservationDuration(r){ return minutes(r.end)-minutes(r.start); }
function renderRoomDetailsModal(){
  const room=getRoom(state.modal.roomId);
  const now=new Date(); const currentM= state.date===todayISO() ? now.getHours()*60+now.getMinutes() : minutes(data.settings.open);
  const st=roomStatus(room.id,currentM);
  const dayReservations=data.reservations.filter(r=>r.roomId===room.id && r.date===state.date && r.status!=='cancelled').sort((a,b)=>minutes(a.start)-minutes(b.start));
  const active=st.res;
  return `<div class="modal-backdrop"><div class="modal modal-large"><div class="modal-head"><h3>${room.name} — informações da reserva</h3><button class="close" onclick="closeModal()">×</button></div>
    <div class="room-detail-grid">
      <div>${renderRoomGallery(room)}<div class="notice" style="margin-top:14px"><b>Status:</b> <span class="badge ${st.cls==='busy'?'bad':st.cls==='soon'?'wait':'ok'}">${st.label}</span><br><b>Capacidade:</b> ${room.capacity} lugares<br><b>Local:</b> ${escapeHtml(room.location)}<br><b>Recursos:</b> ${escapeHtml(room.resources||'-')}</div></div>
      <div>
        <h4 style="margin:0 0 12px;color:var(--blue);font-size:22px">${active ? 'Reserva em destaque' : 'Nenhuma reserva ativa agora'}</h4>
        ${active ? renderReservationDetail(active) : '<div class="empty">Esta sala está livre no horário atual. Veja abaixo as próximas reservas da data selecionada.</div>'}
        <h4 style="margin:20px 0 12px;color:var(--blue);font-size:22px">Agenda do dia</h4>
        ${dayReservations.length ? dayReservations.map(renderReservationDetail).join('') : '<div class="empty">Nenhuma reserva para esta sala nesta data.</div>'}
      </div>
    </div>
  </div></div>`;
}
function renderReservationDetail(r){
  const user=getUser(r.userId); const dur=reservationDuration(r);
  return `<div class="reservation-detail"><div class="time">${r.start}–${r.end}</div><strong>${escapeHtml(r.title)}</strong><br><span class="muted">Reservado por: ${escapeHtml(user.name)} • ${escapeHtml(user.department||'Sem departamento')}</span><br><span class="muted">Duração: ${dur} min • Participantes: ${r.people}</span>${r.notes?`<p>${escapeHtml(r.notes)}</p>`:''}</div>`;
}

window.openReservation = (roomId='') => { state.modal={type:'reservation', roomId: roomId || (state.room==='all'?'':state.room)}; render(); };
window.openRoomForm = (id='') => { state.modal={type:'room', id}; render(); };
window.closeModal = () => { state.modal=null; render(); };
function renderModal(){
  if(state.modal.type==='room') return renderRoomModal();
  if(state.modal.type==='roomDetails') return renderRoomDetailsModal();
  return renderReservationModal();
}
function renderReservationModal(){
  const roomOptions=approvedRooms().map(r=>`<option value="${r.id}" ${state.modal.roomId===r.id?'selected':''}>${r.name} • ${r.capacity} lugares</option>`).join('');
  return `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h3>Nova reserva</h3><button class="close" onclick="closeModal()">×</button></div><form class="form" onsubmit="saveReservation(event)"><div class="field"><label>Sala/espaço</label><select required name="roomId"><option value="">Selecione</option>${roomOptions}</select></div><div class="field"><label>Título da reunião</label><input required name="title" placeholder="Ex.: Reunião de Marketing"></div><div class="grid three"><div class="field"><label>Data</label><input required type="date" name="date" value="${state.date}"></div><div class="field"><label>Início</label><input required type="time" name="start" value="09:00"></div><div class="field"><label>Fim</label><input required type="time" name="end" value="10:00"></div></div><div class="field"><label>Quantidade de pessoas</label><input required type="number" min="1" name="people" value="2"></div><div class="field"><label>Observações</label><textarea name="notes" placeholder="Equipamentos, pauta ou detalhes adicionais"></textarea></div><button class="btn-primary">Confirmar reserva</button></form></div></div>`;
}
window.saveReservation=e=>{
  e.preventDefault(); const fd=new FormData(e.target); const room=getRoom(fd.get('roomId')); const start=fd.get('start'), end=fd.get('end'), date=fd.get('date'); const people=Number(fd.get('people'));
  if(minutes(start)>=minutes(end)) return toast('O horário final precisa ser maior que o inicial.');
  if(minutes(start)<minutes(data.settings.open) || minutes(end)>minutes(data.settings.close)) return toast(`Use horários entre ${data.settings.open} e ${data.settings.close}.`);
  if(minutes(end)-minutes(start)<data.settings.minDuration || minutes(end)-minutes(start)>data.settings.maxDuration) return toast(`Duração permitida: ${data.settings.minDuration} a ${data.settings.maxDuration} minutos.`);
  if(people>room.capacity) return toast(`A capacidade de ${room.name} é de ${room.capacity} lugares.`);
  if(hasConflict(room.id,date,start,end)) return toast('Conflito de horário nesta sala. Escolha outro período.');
  data.reservations.push({id:crypto.randomUUID(), roomId:room.id, userId:state.currentUser.id, title:fd.get('title'), date, start, end, people, notes:fd.get('notes'), status:'approved'}); save(); state.date=date; state.room=room.id; state.modal=null; render(); toast('Reserva confirmada.');
};
function renderRoomModal(){
  const r = data.rooms.find(x=>x.id===state.modal.id) || {name:'',capacity:4,location:'',resources:'',image:'assets/sala-1.jpeg',active:true};
  return `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h3>${state.modal.id?'Editar':'Nova'} sala/espaço</h3><button class="close" onclick="closeModal()">×</button></div><form class="form" onsubmit="saveRoom(event)"><input type="hidden" name="id" value="${state.modal.id||''}"><div class="grid two"><div class="field"><label>Nome</label><input required name="name" value="${escapeHtml(r.name)}"></div><div class="field"><label>Capacidade</label><input required type="number" name="capacity" min="1" value="${r.capacity}"></div></div><div class="field"><label>Localização</label><input name="location" value="${escapeHtml(r.location)}"></div><div class="field"><label>Foto principal/URL da imagem</label><input name="image" value="${escapeHtml(r.image)}"><small class="muted">Para novas fotos, envie a imagem para a pasta assets e informe o caminho. Ex.: assets/nova-sala.jpeg</small></div><div class="field"><label>Galeria de fotos</label><textarea name="images" placeholder="assets/sala-1.jpeg&#10;assets/outra-foto.jpeg">${escapeHtml(roomImages(r).join('\n'))}</textarea><small class="muted">Informe uma imagem por linha. Elas aparecerão em scroll horizontal na aba Salas.</small></div><div class="field"><label>Recursos</label><textarea name="resources">${escapeHtml(r.resources)}</textarea></div><button class="btn-primary">Salvar espaço</button></form></div></div>`;
}
window.saveRoom=e=>{
  e.preventDefault(); const fd=new FormData(e.target); const id=fd.get('id') || fd.get('name').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const images=String(fd.get('images')||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean);
  const room={id, name:fd.get('name'), capacity:Number(fd.get('capacity')), location:fd.get('location'), image:fd.get('image'), images:images.length?images:[fd.get('image')], resources:fd.get('resources'), active:true};
  const i=data.rooms.findIndex(r=>r.id===id); if(i>=0) data.rooms[i]={...data.rooms[i],...room}; else data.rooms.push(room);
  save(); state.modal=null; render(); toast('Sala salva.');
};
window.cancelReservation=id=>{ const r=data.reservations.find(x=>x.id===id); if(r && confirm('Cancelar esta reserva?')){ r.status='cancelled'; save(); render(); toast('Reserva cancelada.'); } };

restoreSession();
render();
