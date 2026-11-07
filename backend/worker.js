
export default {
  async fetch(request) {
    const url = new URL(request.url);

    return new Response(
      JSON.stringify({
        success: true,
        project: "EduRate",
        message: "EduRate API работает",
        path: url.pathname
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
