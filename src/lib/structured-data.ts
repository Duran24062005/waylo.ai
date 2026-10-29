import { SITE_URL } from "@/lib/site";

/** What the home page is, as schema.org data: the organization behind it and the website itself. */
export function homeStructuredData(input: { description: string; language: string }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Waylo",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description: input.description,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Waylo",
        url: SITE_URL,
        description: input.description,
        inLanguage: input.language,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

/** JSON for a script tag: "<" is escaped so the data can never close the tag early. */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
