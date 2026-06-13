export async function GET() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${apiBase}/api/health`, { cache: "no-store" });
    const payload = await response.json();

    return Response.json({
      proxied: true,
      upstream: payload
    });
  } catch {
    return Response.json({
      proxied: false,
      status: "ok",
      service: "hr-system-hhc-web"
    });
  }
}
