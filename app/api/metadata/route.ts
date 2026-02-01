import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookmarkBot/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract title
    let title = "";
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      // Decode HTML entities
      title = title
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
    }

    // Try to get og:title if regular title is empty
    if (!title) {
      const ogTitleMatch = html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      );
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim();
      }
    }

    // Extract favicon
    let favicon: string | null = null;

    // Try link tags first
    const faviconPatterns = [
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
    ];

    for (const pattern of faviconPatterns) {
      const match = html.match(pattern);
      if (match) {
        favicon = match[1];
        break;
      }
    }

    // If no favicon found, try default /favicon.ico
    if (!favicon) {
      favicon = `${parsedUrl.origin}/favicon.ico`;
    } else if (favicon.startsWith("/")) {
      // Make relative URL absolute
      favicon = `${parsedUrl.origin}${favicon}`;
    } else if (!favicon.startsWith("http")) {
      // Handle relative paths without leading slash
      favicon = `${parsedUrl.origin}/${favicon}`;
    }

    // Extract og:image (social preview)
    let ogImage: string | null = null;
    const ogImagePatterns = [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    ];

    for (const pattern of ogImagePatterns) {
      const match = html.match(pattern);
      if (match) {
        ogImage = match[1];
        break;
      }
    }

    // Make og:image URL absolute if needed
    if (ogImage?.startsWith("/")) {
      ogImage = `${parsedUrl.origin}${ogImage}`;
    } else if (ogImage && !ogImage.startsWith("http")) {
      ogImage = `${parsedUrl.origin}/${ogImage}`;
    }

    // Extract description (optional)
    let description = "";
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    );
    if (descMatch) {
      description = descMatch[1].trim();
    }

    return NextResponse.json({
      title: title || parsedUrl.hostname,
      favicon,
      ogImage,
      description,
    });
  } catch (error) {
    console.error("Metadata fetch error:", error);

    // Return basic info based on URL
    try {
      const parsedUrl = new URL(url);
      return NextResponse.json({
        title: parsedUrl.hostname,
        favicon: `${parsedUrl.origin}/favicon.ico`,
        description: "",
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid URL or failed to fetch" },
        { status: 400 },
      );
    }
  }
}
