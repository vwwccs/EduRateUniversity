
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const ITERATIONS = 100000;
const encoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function sha256(value) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64url(new Uint8Array(hash));
}

async function makePassword(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt: encoder.encode(salt),
    iterations: ITERATIONS,
    hash: "SHA-256"
  }, key, 256);

  return base64url(new Uint8Array(bits));
}

async function authenticate(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return null;

  const tokenHash = await sha256(token);

  const session = await env.DB.prepare(`
    SELECT users.id, users.full_name, users.email,
           users.role, users.group_id, users.avatar_url
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
      AND sessions.expires_at > datetime('now')
  `).bind(tokenHash).first();

  return session || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (!env.DB) return json({ success: false, error: "D1 не подключена" }, 500);

    try {
      if (path === "/" || path === "/api/health") {
        await env.DB.prepare("SELECT 1").first();
        return json({ success: true, project: "EduRate", database: "connected" });
      }

      // Регистрация
      if (path === "/api/register" && request.method === "POST") {
        const body = await request.json();
        const fullName = String(body.full_name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const groupId = body.group_id ? Number(body.group_id) : null;

        if (fullName.length < 2 || fullName.length > 100) {
          return json({ success: false, error: "Проверьте имя" }, 400);
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
          return json({ success: false, error: "Неверный email" }, 400);
        }

        if (password.length < 8 || password.length > 128) {
          return json({ success: false, error: "Пароль должен содержать от 8 до 128 символов" }, 400);
        }

        if (groupId !== null) {
          const group = await env.DB.prepare(
            "SELECT id FROM groups WHERE id = ?"
          ).bind(groupId).first();

          if (!group) return json({ success: false, error: "Группа не найдена" }, 400);
        }

        const salt = randomToken();
        const passwordHash = await makePassword(password, salt);
        const storedHash = `pbkdf2$${ITERATIONS}$${salt}$${passwordHash}`;

        const result = await env.DB.prepare(`
          INSERT INTO users (full_name, email, password_hash, role, group_id)
          VALUES (?, ?, ?, 'student', ?)
        `).bind(fullName, email, storedHash, groupId).run();

        return json({
          success: true,
          message: "Регистрация успешна",
          user_id: result.meta.last_row_id
        }, 201);
      }

      // Вход
      if (path === "/api/login" && request.method === "POST") {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        const user = await env.DB.prepare(`
          SELECT id, full_name, email, password_hash, role, group_id, avatar_url
          FROM users WHERE email = ?
        `).bind(email).first();

        if (!user) return json({ success: false, error: "Неверный email или пароль" }, 401);

        const parts = user.password_hash.split("$");
        if (parts.length !== 4 || parts[0] !== "pbkdf2" || Number(parts[1]) !== ITERATIONS) {
          return json({ success: false, error: "Ошибка формата пароля" }, 500);
        }

        const calculated = await makePassword(password, parts[2]);

        if (calculated !== parts[3]) {
          return json({ success: false, error: "Неверный email или пароль" }, 401);
        }

        const token = randomToken();
        const tokenHash = await sha256(token);

        await env.DB.prepare(`
          INSERT INTO sessions (user_id, token_hash, expires_at)
          VALUES (?, ?, datetime('now', '+7 days'))
        `).bind(user.id, tokenHash).run();

        return json({
          success: true,
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            group_id: user.group_id,
            avatar_url: user.avatar_url
          }
        });
      }

      // Текущий пользователь
      if (path === "/api/me" && request.method === "GET") {
        const user = await authenticate(request, env);
        if (!user) return json({ success: false, error: "Не авторизован" }, 401);
        return json({ success: true, user });
      }

      // Выход
      if (path === "/api/logout" && request.method === "POST") {
        const auth = request.headers.get("Authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

        if (token) {
          await env.DB.prepare(
            "DELETE FROM sessions WHERE token_hash = ?"
          ).bind(await sha256(token)).run();
        }

        return json({ success: true, message: "Вы вышли из аккаунта" });
      }

      // Список групп
      if (path === "/api/groups" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT id, name FROM groups ORDER BY name"
        ).all();

        return json({ success: true, groups: result.results });
      }

      return json({ success: false, error: "API route not found" }, 404);

    } catch (error) {
      if (error.message?.includes("UNIQUE constraint failed: users.email")) {
        return json({ success: false, error: "Этот email уже зарегистрирован" }, 409);
      }

      return json({
        success: false,
        error: "Внутренняя ошибка сервера"
      }, 500);
    }
  }
};
