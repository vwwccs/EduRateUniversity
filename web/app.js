
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
          <article class="stat-card">
            <div class="stat-icon blue">👨‍🎓</div>
            <p>Студенты</p><h3>—</h3>
            <small>После подключения базы данных</small>
          </article>
          <article class="stat-card">
            <div class="stat-icon green">✓</div>
            <p>Посещаемость</p><h3>—</h3>
            <small>Статистика занятий</small>
          </article>
          <article class="stat-card">
            <div class="stat-icon orange">★</div>
            <p>Средний балл</p><h3>—</h3>
            <small>Успеваемость</small>
          </article>
          <article class="stat-card">
            <div class="stat-icon purple">🏆</div>
            <p>Рейтинг</p><h3>—</h3>
            <small>Рейтинг студентов</small>
          </article>
        </div>
      </section>
    `
  },

  profile: {
    title: "Мой профиль",
    description: "Личная информация пользователя",
    content: `
      <section class="content-card">
        <div class="profile-placeholder">👤</div>
        <h2>Личный кабинет</h2>
        <p>Профиль появится после подключения регистрации и авторизации.</p>
      </section>
    `
  },

  attendance: {
    title: "Посещаемость",
    description: "Журнал посещаемости студентов",
    content: `
      <section class="content-card">
        <h2>Журнал посещаемости</h2>
        <p>Здесь будет отображаться посещение занятий.</p>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Дата</th><th>Предмет</th><th>Статус</th></tr></thead>
            <tbody><tr><td colspan="3">Данные пока отсутствуют</td></tr></tbody>
          </table>
        </div>
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
        <div class="table-scroll">
          <table>
            <thead><tr><th>Предмет</th><th>Оценка</th><th>Семестр</th></tr></thead>
            <tbody><tr><td colspan="3">Оценок пока нет</td></tr></tbody>
          </table>
        </div>
      </section>
    `
  },

  rating: {
    title: "Рейтинг",
    description: "Рейтинг студентов университета",
    content: `
      <section class="content-card">
        <h2>🏆 Рейтинг студентов</h2>
        <p>Рейтинг будет рассчитываться на основе оценок и успеваемости.</p>
      </section>
    `
  },

  schedule: {
    title: "Расписание",
    description: "Учебное расписание",
    content: `
      <section class="content-card">
        <h2>Расписание занятий</h2>
        <p>Расписание пока не добавлено.</p>
      </section>
    `
  },

  calendar: {
    title: "Календарь",
    description: "Учебные события и даты",
    content: `
      <section class="content-card">
        <h2>📅 Учебный календарь</h2>
        <p>Здесь появятся занятия, экзамены и мероприятия.</p>
      </section>
    `
  },

  announcements: {
    title: "Объявления",
    description: "Новости университета",
    content: `
      <section class="content-card">
        <h2>📢 Объявления</h2>
        <p>Пока объявлений нет.</p>
      </section>
    `
  }
};

const main = document.querySelector(".main-content");
const originalHeader = main.querySelector(".topbar");

function openPage(pageId) {
  const page = pages[pageId];
  if (!page) return;

  main.innerHTML = `
    <header class="topbar">
      <div>
        <h2>${page.title}</h2>
        <p>${page.description}</p>
      </div>
      <div class="top-actions">
        <button class="icon-button" aria-label="Уведомления">♧</button>
        <div class="user-avatar">U</div>
      </div>
    </header>
    ${page.content}
    <footer>© 2026 EduRate University. Все права защищены.</footer>
  `;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  history.replaceState(null, "", `#${pageId}`);
}

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", event => {
    event.preventDefault();
    openPage(item.dataset.page);
  });
});

const initialPage = location.hash.slice(1);
openPage(pages[initialPage] ? initialPage : "home");
