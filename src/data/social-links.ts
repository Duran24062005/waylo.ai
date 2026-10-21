export type SocialIconName = "globe" | "mail" | "link" | "message" | "phone";

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  icon: SocialIconName;
}

// The owner's real links go here. Leave the list empty until they are provided: the dock renders nothing.
export const socialLinks: SocialLink[] = [];
