export class ValueObject {
  equals(other) {
    if (other === null || other === undefined) return false;
    if (other.constructor.name !== this.constructor.name) return false;

    let props1 = Object.getOwnPropertyNames(this);
    let props2 = Object.getOwnPropertyNames(other);
    if (props1.length !== props2.length) return false;

    for (let i = 0; i < props1.length; i++) {
      let prop = props1[i];
      if (this[prop] !== other[prop]) return false;
    }
    return true;
  }
}
