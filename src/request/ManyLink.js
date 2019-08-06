import isConnection from '../utils/isConnection';
import isString from '../utils/isString';
import isSameEntity from '../utils/isSameEntity';
import isManyLink from '../utils/isManyLink';

function getLink(type, idOrIds) {
  if (isConnection(type)) {
    if (isManyLink(type.link)) {
      return type.link;
    }

    return [type.link];
  }

  if (isString(type)) {
    if (isString(idOrIds)) {
      return [[type, idOrIds]];
    }

    return idOrIds.map(id => [type, id]);
  }

  return type;
}

function eliminateFrom(links, badLinks) {
  return links.filter(
    link => !badLinks.some(badLink => isSameEntity(link, badLink)),
  );
}

export default class ManyLink {
  constructor(type, idOrIds) {
    if (!type) {
      this.link = [];
    } else {
      if (isConnection(type)) {
        this.meta = type.meta;
      }

      this.link = getLink(type, idOrIds);
    }
  }

  prepend(type, idOrIds) {
    const link = getLink(type, idOrIds);

    this.link = [...link, ...this.link];

    return this;
  }

  append(type, idOrIds) {
    const link = getLink(type, idOrIds);

    this.link = [...this.link, ...link];

    return this;
  }

  syncPrepend(type, idOrIds) {
    const inputLink = getLink(type, idOrIds);
    const filteredLink = eliminateFrom(this.link, inputLink);

    this.link = [...inputLink, ...filteredLink];

    return this;
  }

  syncAppend(type, idOrIds) {
    const inputLink = getLink(type, idOrIds);
    const filteredLink = eliminateFrom(this.link, inputLink);

    this.link = [...filteredLink, ...inputLink];

    return this;
  }

  detach(type, idOrIds) {
    const inputLink = getLink(type, idOrIds);

    if (inputLink === null) {
      this.link = [];
    } else {
      this.link = eliminateFrom(this.link, inputLink);
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
