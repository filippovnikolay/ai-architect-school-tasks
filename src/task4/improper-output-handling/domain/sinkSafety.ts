/**
 * Heuristics for content that must not be written into HTML sinks (innerHTML, etc.)
 * without encoding or a strict allowlist. False positives are acceptable for a demo.
 */
const DANGEROUS_SUBSTRINGS = [
    "<script",
    "</script",
    "<iframe",
    "javascript:",
    "data:text/html",
    "<object",
    "<embed",
    "onerror=",
    "onload=",
    "onclick=",
    "<svg",
] as const;

/** Cloud metadata endpoint — classic SSRF probe when URLs are fetched server-side. */
const SSRF_MARKERS = ["169.254.169.254", "metadata.google.internal", "fd00:ec2::254"] as const;

export function containsDangerousOutput(text: string): boolean {
    const lower = text.toLowerCase();
    for (const s of DANGEROUS_SUBSTRINGS) {
        if (lower.includes(s)) {
            return true;
        }
    }
    for (const h of SSRF_MARKERS) {
        if (text.includes(h)) {
            return true;
        }
    }
    return false;
}

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
