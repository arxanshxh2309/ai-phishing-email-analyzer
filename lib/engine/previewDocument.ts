// Pure string templating, no Node-only APIs — safe to import from both the
// server (to compute the default doc once) and the client (to rebuild the
// doc when the user opts in to loading images).

export function buildPreviewDocument(sanitizedBodyHtml: string, opts: { allowImages: boolean }): string {
  const imgSrc = opts.allowImages ? "data: https:" : "data:";
  const csp = [
    "default-src 'none'",
    "script-src 'none'",
    `img-src ${imgSrc}`,
    "font-src data:",
    "style-src 'unsafe-inline'",
    "connect-src 'none'",
    "frame-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join("; ");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
  body { margin: 0; padding: 12px; font-family: system-ui, -apple-system, sans-serif; color: #111; background: #fff; overflow-wrap: anywhere; }
  img { max-width: 100%; }
  a { color: #1a56db; }
</style>
</head>
<body>${sanitizedBodyHtml}</body>
</html>`;
}

/** Client-side only: swaps blocked-image placeholders back to their real source. Pure string transform — no new untrusted content, the URLs were already scheme-validated server-side. */
export function restoreImages(sanitizedBodyHtml: string): string {
  return sanitizedBodyHtml.replace(/<img\b[^>]*>/gi, (imgTag) => {
    const safeSrc = imgTag.match(/data-safe-src="([^"]*)"/i)?.[1];
    if (!safeSrc) return imgTag;
    return imgTag.replace(/\ssrc="[^"]*"/i, ` src="${safeSrc}"`);
  });
}
