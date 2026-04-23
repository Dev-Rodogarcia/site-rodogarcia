import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";
import { saveAdminImage, listAdminImages } from "@/lib/adminImages";
import { verifyCsrfToken } from "@/lib/csrf";

export async function GET() {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  return NextResponse.json({ images: listAdminImages() });
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const csrfError = verifyCsrfToken(request, adminSession.session.csrfToken);
  if (csrfError) return csrfError;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  try {
    const uploaded = saveAdminImage(String(body.fileName ?? ""), String(body.dataUrl ?? ""));
    return NextResponse.json(
      {
        message: "Imagem enviada com sucesso.",
        image: uploaded,
        images: listAdminImages(),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao salvar imagem." },
      { status: 422 }
    );
  }
}
