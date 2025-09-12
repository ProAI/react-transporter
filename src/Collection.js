import Link from './Link';
import { TYPENAME } from './constants';

const transformEntitiesToLinks = (value) => {
  // eslint-disable-next-line no-use-before-define
  if (value instanceof Collection || value instanceof Link) {
    return value;
  }

  if (Array.isArray(value)) {
    // eslint-disable-next-line no-use-before-define
    return new Collection(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (TYPENAME in value) {
    return new Link(value);
  }

  const item = {};

  Object.entries(value).forEach(([k, v]) => {
    item[k] = transformEntitiesToLinks(v);
  });

  return item;
};

const convertToLinks = (values) => {
  const items = Array.isArray(values) ? values : [values];

  return items.map(transformEntitiesToLinks);
};

const removeDuplicateLinks = (currentRefs, items) =>
  currentRefs.filter((refLink) => !items.some((link) => refLink.equals(link)));

export default class Collection {
  items;

  constructor(values = []) {
    this.items = convertToLinks(values);
  }

  static fromNative(items) {
    const instance = new Collection();
    instance.items = items;

    return instance;
  }

  prepend(values) {
    this.items = [...convertToLinks(values), ...this.items];

    return this;
  }

  append(values) {
    this.items = [...this.items, ...convertToLinks(values)];

    return this;
  }

  syncPrepend(values) {
    const items = convertToLinks(values);
    const filteredLinks = removeDuplicateLinks(this.items, items);

    this.items = [...items, ...filteredLinks];

    return this;
  }

  syncAppend(values) {
    const items = convertToLinks(values);
    const filteredLinks = removeDuplicateLinks(this.items, items);

    this.items = [...filteredLinks, ...items];

    return this;
  }

  detach(values) {
    const items = convertToLinks(values);
    this.items = removeDuplicateLinks(this.items, items);

    return this;
  }

  all() {
    return this.items;
  }

  toNative() {
    return this.all();
  }
}
