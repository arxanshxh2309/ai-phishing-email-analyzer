export interface Brand {
  name: string;
  domains: string[];
}

// Small curated list of frequently-impersonated brands for lookalike-domain detection.
// Not exhaustive by design — kept short to keep false positives low.
export const COMMONLY_IMPERSONATED_BRANDS: Brand[] = [
  { name: "PayPal", domains: ["paypal.com"] },
  { name: "Microsoft", domains: ["microsoft.com", "live.com", "outlook.com", "office.com"] },
  { name: "Apple", domains: ["apple.com", "icloud.com"] },
  { name: "Google", domains: ["google.com", "gmail.com"] },
  { name: "Amazon", domains: ["amazon.com"] },
  { name: "Netflix", domains: ["netflix.com"] },
  { name: "Bank of America", domains: ["bankofamerica.com"] },
  { name: "Chase", domains: ["chase.com"] },
  { name: "Wells Fargo", domains: ["wellsfargo.com"] },
  { name: "DHL", domains: ["dhl.com"] },
  { name: "FedEx", domains: ["fedex.com"] },
  { name: "USPS", domains: ["usps.com"] },
  { name: "DocuSign", domains: ["docusign.com"] },
  { name: "LinkedIn", domains: ["linkedin.com"] },
  { name: "Facebook", domains: ["facebook.com"] },
  { name: "Instagram", domains: ["instagram.com"] },
  { name: "Coinbase", domains: ["coinbase.com"] },
  { name: "Binance", domains: ["binance.com"] },
  { name: "Dropbox", domains: ["dropbox.com"] },
  { name: "Adobe", domains: ["adobe.com"] },
];

export const FREEMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);

export const URL_SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "tiny.cc",
  "s.id",
  "lnkd.in",
]);

export const RISKY_TLDS = new Set([
  "zip",
  "review",
  "country",
  "kim",
  "cricket",
  "science",
  "work",
  "party",
  "gq",
  "cf",
  "tk",
  "ml",
  "ga",
  "top",
  "xyz",
  "click",
  "link",
]);

export const DANGEROUS_ATTACHMENT_EXTENSIONS = new Set([
  "exe",
  "scr",
  "bat",
  "cmd",
  "com",
  "pif",
  "vbs",
  "vbe",
  "js",
  "jse",
  "wsf",
  "wsh",
  "msi",
  "msc",
  "jar",
  "ps1",
  "hta",
  "reg",
  "lnk",
  "iso",
  "img",
  "html",
  "htm",
]);

export const OFFICE_MACRO_EXTENSIONS = new Set([
  "docm",
  "xlsm",
  "pptm",
  "dotm",
  "xltm",
  "potm",
]);
