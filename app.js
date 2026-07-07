// Sistema Ultrafarma Salas
// Importante: o Firebase é carregado apenas quando você preencher o firebase-config.js.
// Assim o site não fica em branco no Vercel quando ainda estiver em modo demonstração.

let initializeApp, getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, getDocs, serverTimestamp;

const rooms = [
  { id: "sala-1", name: "Sala 1", capacity: 4, type: "Sala de reunião", image: "assets/sala-1.jpeg", resources: ["TV/Monitor", "Mesa executiva", "Quadro"] },
  { id: "sala-7", name: "Sala 7", capacity: 4, type: "Sala de reunião", image: "assets/sala-7.jpeg", resources: ["Mesa executiva", "Ambiente reservado", "Tomadas"] },
  { id: "sala-4", name: "Sala 4", capacity: 8, type: "Sala de reunião", image: "assets/sala-4.jpeg", resources: ["Mesa ampla", "Áudio", "Quadro"] },
  { id: "sala-5", name: "Sala 5", capacity: 8, type: "Sala de reunião", image: "assets/sala-5.jpeg", resources: ["Mesa ampla", "Videoconferência", "Quadro"] },
  { id: "sala-8", name: "Sala 8", capacity: 4, type: "Sala de reunião", image: "assets/sala-8.jpeg", resources: ["Ambiente reservado", "Tomadas", "Privacidade"] },
  { id: "auditorio", name: "Auditório", capacity: 100, type: "Auditório", image: "assets/sala-5.jpeg", resources: ["Apresentações", "Eventos", "Treinamentos"] }
];

const firebaseEnabled = Boolean(window.firebaseConfig?.apiKey && window.firebaseConfig?.projectId);
let db = null;

const state = {
  bookings: [],
  employees: [],
  selectedDate: todayISO(),
  selectedRoom: "all",
  view: "agenda",
  mode: firebaseEnabled ? "firebase" : "demo",
  editingBookingId: null
};

const demoBookings = [
  {
    id: "demo-1",
    roomId: "sala-4",
    roomName: "Sala 4",
    date: todayISO(),
    startTime: "09:00",
    endTime: "10:00",
    title: "Reunião Marketing",
    requester: "Equipe Marketing",
    email: "marketing@ultrafarma.com.br",
    people: 6,
    status: "confirmada",
    notes: "Apresentação semanal"
  },
  {
    id: "demo-2",
    roomId: "auditorio",
    roomName: "Auditório",
    date: todayISO(),
    startTime: "14:00",
    endTime: "16:00",
    title: "Treinamento interno",
    requester: "RH",
    email: "rh@ultrafarma.com.br",
    people: 60,
    status: "confirmada",
    notes: ""
  }
];

const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function timeToMinutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(aEnd) > timeToMinutes(bStart);
}

function roomById(id) {
  return rooms.find(room => room.id === id);
}

function filteredBookings() {
  return state.bookings
    .filter(b => b.date === state.selectedDate)
    .filter(b => state.selectedRoom === "all" || b.roomId === state.selectedRoom)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function bookingsForRoom(roomId) {
  return state.bookings
    .filter(b => b.date === state.selectedDate && b.roomId === roomId)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function statusClass(status) {
  return status === "cancelada" ? "is-canceled" : status === "pendente" ? "is-pending" : "is-confirmed";
}

function nextAvailability(roomId) {
  const slots = bookingsForRoom(roomId).filter(b => b.status !== "cancelada");
  const now = new Date();
  const today = todayISO();
  let start = state.selectedDate === today ? Math.max(8 * 60, now.getHours() * 60 + now.getMinutes()) : 8 * 60;
  const endDay = 19 * 60;
  for (const booking of slots) {
    const bStart = timeToMinutes(booking.startTime);
    const bEnd = timeToMinutes(booking.endTime);
    if (start + 30 <= bStart) break;
    if (start >= bStart && start < bEnd) start = bEnd;
  }
  if (start >= endDay) return "Sem janela hoje";
  return `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
}

function seedLocalData() {
  const existing = storage.get("uf_bookings", null);
  if (!existing) storage.set("uf_bookings", demoBookings);
  state.bookings = storage.get("uf_bookings", demoBookings);
  state.employees = storage.get("uf_employees", []);
}

function subscribeFirebase() {
  onSnapshot(collection(db, "bookings"), snapshot => {
    state.bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  });
  onSnapshot(collection(db, "employees"), snapshot => {
    state.employees = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  });
}

async function saveBooking(payload) {
  const room = roomById(payload.roomId);
  payload.roomName = room.name;
  payload.people = Number(payload.people || 1);
  payload.status = payload.status || "confirmada";

  if (payload.people > room.capacity) {
    alert(`A capacidade da ${room.name} é de ${room.capacity} pessoas.`);
    return;
  }
  if (timeToMinutes(payload.startTime) >= timeToMinutes(payload.endTime)) {
    alert("O horário final precisa ser maior que o horário inicial.");
    return;
  }

  if (!firebaseEnabled) {
    const conflict = state.bookings.find(b =>
      b.id !== state.editingBookingId && b.roomId === payload.roomId && b.date === payload.date && b.status !== "cancelada" &&
      overlaps(payload.startTime, payload.endTime, b.startTime, b.endTime)
    );
    if (conflict) return alert(`Conflito com: ${conflict.title} (${conflict.startTime} às ${conflict.endTime}).`);
    if (state.editingBookingId) {
      state.bookings = state.bookings.map(b => b.id === state.editingBookingId ? { ...b, ...payload } : b);
    } else {
      state.bookings.push({ id: crypto.randomUUID(), ...payload });
    }
    storage.set("uf_bookings", state.bookings);
    closeModal();
    render();
    return;
  }

  const dayQuery = query(collection(db, "bookings"), where("roomId", "==", payload.roomId), where("date", "==", payload.date));
  const snap = await getDocs(dayQuery);
  const conflict = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(b =>
    b.id !== state.editingBookingId && b.status !== "cancelada" && overlaps(payload.startTime, payload.endTime, b.startTime, b.endTime)
  );
  if (conflict) return alert(`Conflito com: ${conflict.title} (${conflict.startTime} às ${conflict.endTime}).`);

  if (state.editingBookingId) {
    await updateDoc(doc(db, "bookings", state.editingBookingId), { ...payload, updatedAt: serverTimestamp() });
  } else {
    await addDoc(collection(db, "bookings"), { ...payload, createdAt: serverTimestamp() });
  }
  closeModal();
}

async function saveEmployee(payload) {
  if (!payload.name || !payload.email) return alert("Preencha nome e e-mail.");
  if (!firebaseEnabled) {
    state.employees.push({ id: crypto.randomUUID(), ...payload });
    storage.set("uf_employees", state.employees);
    render();
    return;
  }
  await addDoc(collection(db, "employees"), { ...payload, createdAt: serverTimestamp() });
}

async function removeBooking(id) {
  if (!confirm("Deseja cancelar esta reserva?")) return;
  if (!firebaseEnabled) {
    state.bookings = state.bookings.map(b => b.id === id ? { ...b, status: "cancelada" } : b);
    storage.set("uf_bookings", state.bookings);
    render();
    return;
  }
  await updateDoc(doc(db, "bookings", id), { status: "cancelada", updatedAt: serverTimestamp() });
}

async function deleteEmployee(id) {
  if (!confirm("Deseja remover este cadastro?")) return;
  if (!firebaseEnabled) {
    state.employees = state.employees.filter(e => e.id !== id);
    storage.set("uf_employees", state.employees);
    render();
    return;
  }
  await deleteDoc(doc(db, "employees", id));
}

function openModal(roomId = "sala-1", booking = null) {
  state.editingBookingId = booking?.id || null;
  const modal = document.querySelector("#bookingModal");
  modal.classList.add("open");
  const form = document.querySelector("#bookingForm");
  form.roomId.value = booking?.roomId || roomId;
  form.date.value = booking?.date || state.selectedDate;
  form.startTime.value = booking?.startTime || "09:00";
  form.endTime.value = booking?.endTime || "10:00";
  form.title.value = booking?.title || "";
  form.requester.value = booking?.requester || "";
  form.email.value = booking?.email || "";
  form.people.value = booking?.people || "1";
  form.notes.value = booking?.notes || "";
  form.status.value = booking?.status || "confirmada";
  document.querySelector("#modalTitle").textContent = booking ? "Editar reserva" : "Nova reserva";
}

function closeModal() {
  document.querySelector("#bookingModal")?.classList.remove("open");
  state.editingBookingId = null;
}

function renderHeader() {
  return `
    <header class="topbar">
      <div class="brand">
        <img src="assets/logo-ultrafarma-com.png" alt="Ultrafarma" />
        <span>Reserva de Salas</span>
      </div>
      <nav>
        <button class="nav-btn ${state.view === "agenda" ? "active" : ""}" data-view="agenda">Agenda</button>
        <button class="nav-btn ${state.view === "salas" ? "active" : ""}" data-view="salas">Salas</button>
        <button class="nav-btn ${state.view === "cadastros" ? "active" : ""}" data-view="cadastros">Cadastros</button>
      </nav>
    </header>
  `;
}

function renderHero() {
  const totalToday = state.bookings.filter(b => b.date === state.selectedDate && b.status !== "cancelada").length;
  const occupied = rooms.filter(room => bookingsForRoom(room.id).some(b => b.status !== "cancelada")).length;
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">Sistema interno Ultrafarma</p>
        <h1>Agendamento de salas de reunião e auditório</h1>
        <p class="hero-text">Reserve salas, consulte disponibilidade em tempo real e evite conflitos de agenda.</p>
        <div class="hero-actions">
          <button class="primary" id="newBookingBtn">+ Nova reserva</button>
          <button class="secondary" id="todayBtn">Ver hoje</button>
        </div>
      </div>
      <div class="stats-card">
        <div><strong>${rooms.length}</strong><span>Espaços</span></div>
        <div><strong>${totalToday}</strong><span>Reservas no dia</span></div>
        <div><strong>${occupied}</strong><span>Salas com agenda</span></div>
        <div><strong>${state.mode === "firebase" ? "Online" : "Demo"}</strong><span>Banco de dados</span></div>
      </div>
    </section>
  `;
}

function renderFilters() {
  return `
    <section class="filters">
      <label>Data <input type="date" id="dateFilter" value="${state.selectedDate}" /></label>
      <label>Sala
        <select id="roomFilter">
          <option value="all">Todas as salas</option>
          ${rooms.map(r => `<option value="${r.id}" ${state.selectedRoom === r.id ? "selected" : ""}>${r.name} — ${r.capacity} lugares</option>`).join("")}
        </select>
      </label>
    </section>
  `;
}

function renderAgenda() {
  return `
    ${renderHero()}
    ${renderFilters()}
    <section class="section-head">
      <div>
        <p class="eyebrow">Agenda</p>
        <h2>${formatDate(state.selectedDate)}</h2>
      </div>
    </section>
    <section class="timeline">
      ${rooms
        .filter(room => state.selectedRoom === "all" || room.id === state.selectedRoom)
        .map(room => {
          const list = bookingsForRoom(room.id);
          return `
            <article class="room-line">
              <div class="room-line-head">
                <img src="${room.image}" alt="${room.name}" />
                <div><h3>${room.name}</h3><p>${room.capacity} lugares • Próximo horário: ${nextAvailability(room.id)}</p></div>
                <button class="small primary" data-book-room="${room.id}">Reservar</button>
              </div>
              <div class="booking-list">
                ${list.length ? list.map(b => `
                  <div class="booking ${statusClass(b.status)}">
                    <div class="booking-time">${b.startTime}<span>${b.endTime}</span></div>
                    <div class="booking-body">
                      <strong>${b.title}</strong>
                      <p>${b.requester} • ${b.people} pessoa(s) • ${b.status}</p>
                      ${b.notes ? `<small>${b.notes}</small>` : ""}
                    </div>
                    <div class="booking-actions">
                      <button class="icon" data-edit="${b.id}">Editar</button>
                      ${b.status !== "cancelada" ? `<button class="icon danger" data-cancel="${b.id}">Cancelar</button>` : ""}
                    </div>
                  </div>
                `).join("") : `<div class="empty">Nenhuma reserva para esta sala nesta data.</div>`}
              </div>
            </article>
          `;
        }).join("")}
    </section>
  `;
}

function renderRooms() {
  return `
    <section class="section-head padded">
      <div><p class="eyebrow">Espaços</p><h2>Salas disponíveis</h2></div>
      <button class="primary" id="newBookingBtn">+ Nova reserva</button>
    </section>
    <section class="room-grid">
      ${rooms.map(room => `
        <article class="room-card">
          <img src="${room.image}" alt="${room.name}" />
          <div class="room-card-body">
            <span class="badge">${room.type}</span>
            <h3>${room.name}</h3>
            <p class="capacity">${room.capacity} lugares</p>
            <div class="chips">${room.resources.map(item => `<span>${item}</span>`).join("")}</div>
            <button class="primary full" data-book-room="${room.id}">Reservar ${room.name}</button>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderCadastros() {
  return `
    <section class="section-head padded">
      <div><p class="eyebrow">Cadastros</p><h2>Colaboradores autorizados</h2></div>
    </section>
    <section class="cadastro-layout">
      <form class="employee-form" id="employeeForm">
        <h3>Novo colaborador</h3>
        <label>Nome<input name="name" placeholder="Nome completo" required /></label>
        <label>E-mail<input name="email" type="email" placeholder="nome@ultrafarma.com.br" required /></label>
        <label>Departamento<input name="department" placeholder="Marketing, RH, Comercial..." /></label>
        <button class="primary full">Cadastrar</button>
      </form>
      <div class="employees">
        ${state.employees.length ? state.employees.map(e => `
          <div class="employee">
            <div><strong>${e.name}</strong><p>${e.email} ${e.department ? `• ${e.department}` : ""}</p></div>
            <button class="icon danger" data-delete-employee="${e.id}">Remover</button>
          </div>
        `).join("") : `<div class="empty big">Nenhum cadastro ainda. Cadastre colaboradores para facilitar as reservas.</div>`}
      </div>
    </section>
  `;
}

function renderModal() {
  return `
    <div class="modal" id="bookingModal">
      <div class="modal-backdrop" data-close-modal></div>
      <div class="modal-card">
        <button class="close" data-close-modal>×</button>
        <h2 id="modalTitle">Nova reserva</h2>
        <form id="bookingForm" class="booking-form">
          <label>Sala<select name="roomId">${rooms.map(r => `<option value="${r.id}">${r.name} — ${r.capacity} lugares</option>`).join("")}</select></label>
          <label>Data<input type="date" name="date" required /></label>
          <div class="two-cols">
            <label>Início<input type="time" name="startTime" min="07:00" max="22:00" step="900" required /></label>
            <label>Fim<input type="time" name="endTime" min="07:00" max="22:00" step="900" required /></label>
          </div>
          <label>Título da reunião<input name="title" placeholder="Ex.: Alinhamento semanal" required /></label>
          <div class="two-cols">
            <label>Responsável<input name="requester" placeholder="Nome" required /></label>
            <label>E-mail<input type="email" name="email" placeholder="email@ultrafarma.com.br" required /></label>
          </div>
          <div class="two-cols">
            <label>Pessoas<input type="number" min="1" name="people" required /></label>
            <label>Status<select name="status"><option value="confirmada">Confirmada</option><option value="pendente">Pendente</option><option value="cancelada">Cancelada</option></select></label>
          </div>
          <label>Observações<textarea name="notes" rows="3" placeholder="Equipamentos, visitantes, café, etc."></textarea></label>
          <button class="primary full">Salvar reserva</button>
        </form>
      </div>
    </div>
  `;
}

function render() {
  const view = state.view === "agenda" ? renderAgenda() : state.view === "salas" ? renderRooms() : renderCadastros();
  document.querySelector("#app").innerHTML = `
    ${renderHeader()}
    <main>${view}</main>
    ${renderModal()}
  `;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => { state.view = btn.dataset.view; render(); }));
  document.querySelector("#dateFilter")?.addEventListener("change", e => { state.selectedDate = e.target.value; render(); });
  document.querySelector("#roomFilter")?.addEventListener("change", e => { state.selectedRoom = e.target.value; render(); });
  document.querySelectorAll("#newBookingBtn").forEach(btn => btn.addEventListener("click", () => openModal(state.selectedRoom === "all" ? "sala-1" : state.selectedRoom)));
  document.querySelector("#todayBtn")?.addEventListener("click", () => { state.selectedDate = todayISO(); render(); });
  document.querySelectorAll("[data-book-room]").forEach(btn => btn.addEventListener("click", () => openModal(btn.dataset.bookRoom)));
  document.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
  document.querySelectorAll("[data-cancel]").forEach(btn => btn.addEventListener("click", () => removeBooking(btn.dataset.cancel)));
  document.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => openModal("sala-1", state.bookings.find(b => b.id === btn.dataset.edit))));
  document.querySelector("#bookingForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    await saveBooking(payload);
  });
  document.querySelector("#employeeForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    await saveEmployee(payload);
    e.target.reset();
  });
  document.querySelectorAll("[data-delete-employee]").forEach(btn => btn.addEventListener("click", () => deleteEmployee(btn.dataset.deleteEmployee)));
}

async function boot() {
  try {
    if (firebaseEnabled) {
      const firebaseApp = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js");
      const firestore = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js");

      initializeApp = firebaseApp.initializeApp;
      getFirestore = firestore.getFirestore;
      collection = firestore.collection;
      doc = firestore.doc;
      addDoc = firestore.addDoc;
      updateDoc = firestore.updateDoc;
      deleteDoc = firestore.deleteDoc;
      query = firestore.query;
      where = firestore.where;
      onSnapshot = firestore.onSnapshot;
      getDocs = firestore.getDocs;
      serverTimestamp = firestore.serverTimestamp;

      const app = initializeApp(window.firebaseConfig);
      db = getFirestore(app);
      subscribeFirebase();
    } else {
      seedLocalData();
    }
    render();
  } catch (error) {
    console.error("Erro ao iniciar o sistema:", error);
    document.querySelector("#app").innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 780px; margin: auto;">
        <img src="assets/logo-ultrafarma.png" alt="Ultrafarma" style="height: 46px; margin-bottom: 24px;">
        <h1 style="color:#003f73;">Não foi possível carregar o sistema</h1>
        <p>Verifique se todos os arquivos foram enviados para o GitHub na raiz do projeto: <strong>index.html</strong>, <strong>app.js</strong>, <strong>styles.css</strong>, <strong>firebase-config.js</strong> e a pasta <strong>assets</strong>.</p>
        <p>Detalhe técnico: ${error.message}</p>
      </div>`;
  }
}

boot();
