import isConnection from '../utils/isConnection';
import isString from '../utils/isString';
import isSameEntity from '../utils/isSameEntity';

function getLinks(type, idOrIds) {
  if (isString(type)) {
    if (isString(idOrIds)) {
      return [[type, idOrIds]];
    }

    return idOrIds.map(id => [type, id]);
  }

  return type;
}

function eliminateFrom(links, badLinks) {
  return links.filter(link => !badLinks.some(badLink => isSameEntity(link, badLink)));
}

export default class ManyLink {
  constructor(type, idOrIds) {
    // object passed to constructor
    if (idOrIds === undefined && type !== undefined && isConnection(type)) {
      this.meta = type.meta;
      this.link = type.link;
    } else {
      this.link = type ? getLinks(type) : [];
    }
  }

  prepend(type, idOrIds) {
    this.link = [...getLinks(type, idOrIds), ...this.link];

    return this;
  }

  append(type, idOrIds) {
    this.link = [...this.link, ...getLinks(type, idOrIds)];

    return this;
  }

  syncPrepend(type, idOrIds) {
    const inputLinks = getLinks(type, idOrIds);
    const filteredLinks = eliminateFrom(this.link, inputLinks);

    this.link = [...inputLinks, ...filteredLinks];

    return this;
  }

  syncAppend(type, idOrIds) {
    const inputLinks = getLinks(type, idOrIds);
    const filteredLinks = eliminateFrom(this.link, inputLinks);

    this.link = [...filteredLinks, ...inputLinks];

    return this;
  }

  detach(type, idOrIds) {
    const inputLinks = getLinks(type, idOrIds);

    if (inputLinks === null) {
      this.link = [];
    } else {
      this.link = eliminateFrom(this.link, inputLinks);
    }

    return this;
  }

  setMeta(meta) {
    if (typeof meta === 'function') {
      this.meta = meta(this.meta);
    } else {
      this.meta = meta;
    }
    return this;
  }

  toSource() {
    return {
      link: this.link,
      meta: this.meta,
    };
  }
}
