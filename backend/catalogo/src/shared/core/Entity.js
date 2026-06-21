export class Entity {
  constructor(id) {
    if (!id) throw new Error("Una entidad debe tener un ID válido.");
    this.id = id;
  }

  equals(other) {
    if (other == null || other === undefined) return false;
    if (this === other) return true;
    if (!(other instanceof Entity)) return false;
    return this.id === other.id;
  }
}
