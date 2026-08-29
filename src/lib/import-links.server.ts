import { createServerFn } from "@tanstack/react-start";

type ImportedLink = { title: string; url: string };

function extractFromNextData(html: string): ImportedLink[] {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return [];
  try {
    const json = JSON.parse(match[1]);
    const links = json?.props?.pageProps?.links;
    if (!Array.isArray(links)) return [];
    return links
      .filter((l: any) => l?.url && l?.title)
      .map((l: any) => ({ title: String(l.title).trim(), url: String(l.url).trim() }));
  } catch {
    return [];
  }
}

function extractGeneric(html: string, sourceHost: string): ImportedLink[] {
  const results: ImportedLink[] = [];
  const anchorRegex = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const blockedHosts = [sourceHost, "linktr.ee", "beacons.ai", "instagram.com/accounts", "facebook.com/sharer", "twitter.com/intent"];
  let m: RegExpExecArray | null;
  while ((m = anchorRegex.exec(html))) {
    const url = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (!text || text.length > 80) continue;
    if (blockedHosts.some((h) => url.includes(h))) continue;
    if (!/^https?:\/\//.test(url)) continue;
    results.push({ title: text, url });
  }
  // de-dupe by url
  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true)));
}

export const importLinksFromUrl = createServerFn({ method: "POST" })
  .validator((data: { url: string }) => data)
  .handler(async ({ data }) => {
    let target: URL;
    try {
      target = new URL(data.url);
    } catch {
      return { error: "that doesn't look like a valid URL." };
    }
    const allowedHosts = ["linktr.ee", "www.linktr.ee", "beacons.ai", "www.beacons.ai"];
    if (!allowedHosts.includes(target.hostname)) {
      return { error: "only linktr.ee and beacons.ai links are supported right now." };
    }

    let html: string;
    try {
      const res = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; pewsbot/1.0)" } });
      if (!res.ok) return { error: `couldn't load that page (status ${res.status}).` };
      html = await res.text();
    } catch {
      return { error: "couldn't reach that page — check the URL and try again." };
    }

    let links = extractFromNextData(html);
    if (links.length === 0) links = extractGeneric(html, target.hostname);

    if (links.length === 0) {
      return { error: "couldn't find any links on that page — it may have changed its layout, or the profile might be private." };
    }
    return { links: links.slice(0, 30) };
  });
