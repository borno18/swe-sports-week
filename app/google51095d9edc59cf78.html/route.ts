export async function GET() {
  return new Response("google-site-verification: google51095d9edc59cf78.html\n", {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
