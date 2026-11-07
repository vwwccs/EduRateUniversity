
const API = "https://edurate-universitu.0bezbashe.workers.dev";

const pages = {
  home: {
    title: "Главная",
    description: "Информационная система университета",
    content: `
      <section class="welcome">
        <div>
          <span class="welcome-label">EDURATE UNIVERSITY</span>
          <h1>Добро пожаловать!</h1>
          <p>Управляйте обучением, отслеживайте успеваемость и посещаемость в одном месте.</p>
        </div>
        <div class="welcome-icon">🎓</div>
      </section>
      <section class="section">
        <div class="section-heading">
          <h2>Общая статистика</h2>
          <span>Учебная информация</span>
        </div>
        <div class="stats-grid">
          <article class="stat-card"><div class="stat-icon blue">👨‍🎓</div><p>Студенты</p><h3>—</h3><small>После подключения базы данных</small></article>
          <article class="stat-card"><div class="stat-icon green">✓</div><p>Посещаемость</p><h3>—</h3><small>Статистика занятий</small></article>
          <article class="stat-card"><div class="stat-icon orange">★</div><p>Средний балл</p><h3>—</h3><small>Успеваемость</small></article>
          <article class="stat-card"><div class="stat-icon purple">🏆</div><p>Рейтинг</p><h3>—</h3><small>Рейтинг студентов</small></article>
        </div>
      </section>
    `
  },

  profile: {
    title: "Мой профиль",
    description: "Личная информация пользователя",
    content: `<section class="content-card" id="profileContent"></section>`
  },

  attendance: {
    title: "Посещаемость",
    description: "Журнал посещаемости студентов",
    content: `
      <section class="content-card">
        <h2>Журнал посещаемости</h2>
        <p>Здесь будет отображаться посещение занятий.</p>
        <div class="table-scroll"><table>
          <thead><tr><th>Дата</th><th>Предмет</th><th>Статус</th></tr></thead>
          <tbody><tr><td colspan="3">Данные пока отсутствуют</td></tr></tbody>
        </table></div>
      </section>
    `
  },

  grades: {
    title: "Оценки",
    description: "Академическая успеваемость",
    content: `
      <section class="content-card">
        <h2>Мои оценки</h2>
        <p>Здесь будут отображаться оценки по предметам.</p>
        <div class="table-scroll"><table>
          <thead><tr><th>Предмет</th><th>Оценка</th><th>Семестр</th></tr></thead>
          <tbody><tr><td colspan="3">Оценок пока нет</td></tr></tbody>
        </table></div>
      </section>
    `
  },

  rating: {
    title: "Рейтинг",
    description: "Рейтинг студентов университета",
    content: `<section class="content-card"><h2>🏆 Рейтинг студентов</h2><p>Рейтинг будет рассчитываться на основе оценок и успеваемости.</p></section>`
  },

  schedule: {
    title: "Расписание",
    description: "Учебное расписание",
    content: `<section class="content-card"><h2>Расписание занятий</h2><p>Расписание пока не добавлено.</p></section>`
  },

  calendar: {
    title: "Календарь",
    description: "Учебные события и даты",
    content: `<section class="content-card"><h2>📅 Учебный календарь</h2><p>Здесь появятся занятия, экзамены и мероприятия.</p></section>`
  },

  announcements: {
    title: "Объявления",
    description: "Новости университета",
    content: `<section class="content-card"><h2>📢 Объявления</h2><p>Пока объявлений нет.</p></section>`
  }
};

const main = document.querySelector(".main-content");

let token = localStorage.getItem("edurate_token");
let currentUser = null;
let authMode = "login";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function api(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(API + path, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Ошибка сервера");
  }

  return data;
}

// Окно входа и регистрации
function showAuth(mode = "login") {
  authMode = mode;

  main.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🎓</div>
        <h1>EduRate</h1>
        <p>Система рейтинга студентов</p>

        <div class="auth-tabs">
          <button type="button" id="loginTab">Вход</button>
          <button type="button" id="registerTab">Регистрация</button>
        </div>

        <form id="authForm">
          <div id="nameField" hidden>
            <input name="full_name" placeholder="ФИО" minlength="2" maxlength="100">
          </div>

          <input name="email" type="email" placeholder="Email" required maxlength="254">

          <input name="password" type="password"
            placeholder="Пароль (минимум 8 символов)"
            minlength="8" maxlength="128" required>

          <button type="submit" id="authSubmit">Войти</button>
        </form>

        <p id="authMessage" role="status"></p>
      </div>
    </div>
  `;

  const form = document.querySelector("#authForm");
  const nameField = document.querySelector("#nameField");
  const submit = document.querySelector("#authSubmit");
  const message = document.querySelector("#authMessage");

  function setMode(nextMode) {
    authMode = nextMode;
    nameField.hidden = nextMode !== "register";
    nameField.querySelector("input").required = nextMode === "register";
    submit.textContent = nextMode === "register"
      ? "Зарегистрироваться"
      : "Войти";

    message.textContent = "";
  }

  document.querySelector("#loginTab").onclick = () => setMode("login");
  document.querySelector("#registerTab").onclick = () => setMode("register");

  setMode(mode);

  form.onsubmit = async event => {
    event.preventDefault();

    submit.disabled = true;
    message.textContent = "Подождите...";

    const values = Object.fromEntries(new FormData(form));

    try {
      if (authMode === "register") {
        await api("/api/register", {
          method: "POST",
          body: JSON.stringify(values)
        });

        form.reset();
        setMode("login");
        message.textContent = "Регистрация успешна! Теперь войдите.";
      } else {
        const result = await api("/api/login", {
          method: "POST",
          body: JSON.stringify(values)
        });

        token = result.token;
        currentUser = result.user;

        localStorage.setItem("edurate_token", token);

        openPage("home");
      }
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  };
}

// Профиль пользователя
function renderProfile() {
  const profile = document.querySelector("#profileContent");
  if (!profile || !currentUser) return;

  const name = escapeHTML(currentUser.full_name);
  const email = escapeHTML(currentUser.email);
  const role = escapeHTML(currentUser.role);
  const group = escapeHTML(currentUser.group_id || "Не указана");

  profile.innerHTML = `
    <div class="profile-placeholder">👤</div>
    <h2>${name}</h2>
    <p>Email: ${email}</p>
    <p>Роль: ${role}</p>
    <p>Группа: ${group}</p>
    <button type="button" id="profileLogout">Выйти из аккаунта</button>
  `;

  document.querySelector("#profileLogout").onclick = logout;
}

// Переключение страниц
function openPage(pageId) {
  const page = pages[pageId];
  if (!page || !currentUser) return;

  main.innerHTML = `
    <header class="topbar">
      <div>
        <h2>${page.title}</h2>
        <p>${page.description}</p>
      </div>
      <div class="top-actions">
        <button class="icon-button" aria-label="Уведомления">♧</button>
        <div class="user-avatar">${escapeHTML(currentUser.full_name.charAt(0).toUpperCase())}</div>
      </div>
    </header>
    ${page.content}
    <footer>© 2026 EduRate University. Все права защищены.</footer>
  `;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  if (pageId === "profile") renderProfile();

  history.replaceState(null, "", `#${pageId}`);
}

// Выход
async function logout() {
  try {
    await api("/api/logout", { method: "POST" });
  } catch (error) {
    console.error(error);
  }

  token = null;
  currentUser = null;

  localStorage.removeItem("edurate_token");
  showAuth();
}

// Навигация
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", event => {
    event.preventDefault();
    openPage(item.dataset.page);
  });
});

// Проверка авторизации
async function startApp() {
  if (!main) return;

  if (token) {
    try {
      const result = await api("/api/me");
      currentUser = result.user;

      const initialPage = location.hash.slice(1);
      openPage(pages[initialPage] ? initialPage : "home");
      return;
    } catch (error) {
      token = null;
      localStorage.removeItem("edurate_token");
    }
  }

  showAuth();
}

startApp();
