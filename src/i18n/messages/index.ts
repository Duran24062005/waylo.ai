import type { Locale } from "@/i18n/locales";
import { en } from "./en";
import { es, type Messages } from "./es";
import { pt } from "./pt";

export type { Messages };

export const messages: Record<Locale, Messages> = { es, en, pt };
