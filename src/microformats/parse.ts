import {
  MicroformatRoot,
  ParentNode,
  PropertyType,
  ParsingOptions,
} from "../types";
import { microformatProperties } from "./properties";
import { textContent } from "../helpers/textContent";
import { getAttributeValue, getClassNames } from "../helpers/attributes";
import { findChildren } from "../helpers/findChildren";
import {
  isMicroformatChild,
  isMicroformatV2Root,
} from "../helpers/nodeMatchers";
import {
  convertV1RootClassNames,
  getBackcompatRootClassNames,
  BackcompatRoot,
} from "../backcompat";
import { applyIncludesToRoot } from "../helpers/includes";

interface ParseMicroformatOptions extends ParsingOptions {
  valueType?: PropertyType;
}

const getMicroformatType = (node: ParentNode): string[] => {
  const v2 = getClassNames(node, "h-");
  return v2.length ? v2 : convertV1RootClassNames(node);
};

const getRoots = (node: ParentNode): BackcompatRoot[] =>
  isMicroformatV2Root(node) ? [] : getBackcompatRootClassNames(node);

const getId = (node: ParentNode): string | undefined =>
  isMicroformatV2Root(node) ? getAttributeValue(node, "id") : undefined;

export const parseMicroformat = (
  node: ParentNode,
  options: ParseMicroformatOptions
): MicroformatRoot => {
  applyIncludesToRoot(node, options);

  const roots = getRoots(node);
  const id = getId(node);
  const children = findChildren(node, isMicroformatChild, options);

  const item: MicroformatRoot = {
    type: getMicroformatType(node).sort(),
    properties: microformatProperties(node, {
      ...options,
      implyProperties: !children.length,
      roots,
    }),
  };

  if (id) {
    item.id = id;
  }

  if (children.length) {
    item.children = children.map((child) => parseMicroformat(child, options));
  }

  if (options.valueType === "p") {
    item.value =
      (item.properties.name && item.properties.name[0]) ??
      getAttributeValue(node, "title") ??
      textContent(node);
  }

  if (options.valueType === "u") {
    item.value =
      (item.properties.url && item.properties.url[0]) ?? textContent(node);
  }

  return item;
};
