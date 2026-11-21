import { eventCopy } from "./events";
import { uiCopy } from "./ui";

export const vi = { ...uiCopy, ...eventCopy } as const;

export type TranslationKey = keyof typeof vi;

export const t = (key: string, vars?: Readonly<Record<string, string | number>>): string => {
  const template = (vi as Readonly<Record<string, string>>)[key] ?? key;
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = vars[name];
    return value === undefined ? `{${name}}` : String(value);
  });
};

export const errorText = (code: string): string => {
  const direct = t(`error.${code}`);
  return direct === `error.${code}` ? t("error.generic") : direct;
};

export const noticeText = (code: string): string => {
  if (code.startsWith("notice.event:")) return t("notice.event");
  const direct = t(`notice.${code}`);
  return direct === `notice.${code}` ? code : direct;
};

export { eventCopy, uiCopy };
