import { NextResponse } from "next/server";

const faviconPath = "/favicon-rodogarcia-20260718.svg";

function redirectToFavicon() {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: faviconPath },
  });
}

// Browsers may still request the conventional ICO path even when the document
// declares the versioned SVG icon in its metadata.
export const GET = redirectToFavicon;
export const HEAD = redirectToFavicon;
