/**
 * A short, readable name for a device from its user agent, such as "Chrome · Windows".
 * Only the browser and the system are kept: enough to recognize a session, nothing that identifies the person.
 * Empty when neither can be told, and the screen words that case in the person's language.
 */
export function describeDevice(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";

  // Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari".
  let browser = "";
  if (/Edg(e|A|iOS)?\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Firefox\/|FxiOS\//.test(ua)) browser = "Firefox";
  else if (/Chrome\/|CriOS\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = "Safari";

  let system = "";
  if (/Windows/.test(ua)) system = "Windows";
  else if (/iPhone|iPad|iPod/.test(ua)) system = "iOS";
  else if (/Android/.test(ua)) system = "Android";
  else if (/Mac OS X|Macintosh/.test(ua)) system = "macOS";
  else if (/CrOS/.test(ua)) system = "ChromeOS";
  else if (/Linux|X11/.test(ua)) system = "Linux";

  return [browser, system].filter(Boolean).join(" · ");
}
