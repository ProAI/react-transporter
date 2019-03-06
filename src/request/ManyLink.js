import isConnection from '../utils/isConnection';
import isString from '../utils/isString';
import isSameEntity from '../utils/isSameEntity';

function getLinks(type, idOrIds) {
  if (isString(type)) {
    if (isString(idOrIds)) {
      // case 1) one type, one id
      return [[type, idOrIds]];
    }

    // case 2) one type, many ids
    return idOrIds.map(id => [type, id]);
  }

  // case 3) many types, many ids
  return type;
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
    const filteredLinks = this.eliminate(inputLinks);

    this.link = [...inputLinks, ...filteredLinks];

    return this;
  }

  syncAppend(type, idOrIds) {
    const inputLinks = getLinks(type, idOrIds);
    const filteredLinks = this.eliminate(inputLinks);

    this.link = [...filteredLinks, ...inputLinks];

    return this;
  }

  detach(type, idOrIds) {
    const inputLinks = getLinks(type, idOrIds);

    if (inputLinks === null) {
      this.link = [];
    } else {
      this.link = this.eliminate(inputLinks);
    }

    return this;
  }

  eliminate(inputLinks) {
    return this.link.filter(link => !inputLinks.some(inputLink => isSameEntity(link, inputLink)));
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
