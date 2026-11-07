
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (!env.DB) {
      return json({
        success: false,
        error: "D1 database is not connected"
      }, 500);
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT 1 AS connected"
        ).first();

        return json({
          success: true,
          project: "EduRate",
          database: result?.connected === 1 ? "connected" : "error"
        });
      }

      if (url.pathname === "/api/groups" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT id, name, created_at FROM groups ORDER BY name"
        ).all();

        return json({
          success: true,
          groups: result.results
        });
      }

      return json({
        success: false,
        error: "API route not found"
      }, 404);

    } catch (error) {
      return json({
        success: false,
        error: "Database error"
      }, 500);
    }
  }
};
