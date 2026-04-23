import { NextResponse } from "next/server";
import { readContentData, preparePublicContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = readContentData();
  const publicData = preparePublicContent(content);
  return NextResponse.json(publicData);
}
