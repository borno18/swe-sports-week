import { getPublicRevision } from "@/lib/public-revision";

export async function GET() {
  return Response.json({ revision: await getPublicRevision() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
