import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { ICON_NAMES } from "../src/ui/components/icon-names.ts";

const VIRTUAL_ID = "virtual:icon-collections";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

interface IconSet {
  readonly prefix: string;
  readonly width?: number;
  readonly height?: number;
  readonly icons: Readonly<Record<string, unknown>>;
}

const readSet = (prefix: string): IconSet =>
  JSON.parse(
    readFileSync(join(process.cwd(), `node_modules/@iconify-json/${prefix}/icons.json`), "utf8"),
  );

const collectionSource = (): string => {
  const sets = new Map<string, IconSet>();
  const grouped = new Map<string, Record<string, unknown>>();

  for (const name of ICON_NAMES) {
    const [prefix, iconName] = name.split(":");

    if (prefix === undefined || iconName === undefined) {
      throw new Error(`Invalid icon name: ${name}`);
    }

    const set = sets.get(prefix) ?? readSet(prefix);
    sets.set(prefix, set);

    const icons = grouped.get(prefix) ?? {};
    grouped.set(prefix, icons);

    const icon = set.icons[iconName];

    if (icon === undefined) {
      throw new Error(`Missing ${prefix}:${iconName}`);
    }

    icons[iconName] = icon;
  }

  const collections = [...grouped.entries()].map(([prefix, icons]) => {
    const set = sets.get(prefix);

    return `addCollection(${JSON.stringify({
      prefix,
      icons,
      width: set?.width,
      height: set?.height,
    })});`;
  });

  return ['import { addCollection } from "@iconify-icon/solid";', "", ...collections, ""].join(
    "\n",
  );
};

export const iconifySubset = (): Plugin => ({
  name: "iconify-subset",
  resolveId(id) {
    return id === VIRTUAL_ID ? RESOLVED_ID : null;
  },
  load(id) {
    return id === RESOLVED_ID ? collectionSource() : null;
  },
});
