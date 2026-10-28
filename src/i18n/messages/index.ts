import type { Locale } from '../locales';
import { en, type MessageKey, type Messages } from './en';
import { es } from './es';
import { ptBR } from './pt-BR';

export type { MessageKey, Messages };

export const MESSAGES: Readonly<Record<Locale, Messages>> = {
  'pt-BR': ptBR,
  en,
  es,
};

/** Replaces `{name}` placeholders. Missing params are left visible on purpose. */
export function format(template: string, params?: Readonly<Record<string, string | number>>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
