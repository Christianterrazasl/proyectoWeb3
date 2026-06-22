class Entity:
    def __init__(self, entity_id):
        if not entity_id:
            raise ValueError("Una entidad debe tener un ID válido.")
        self._id = entity_id

    @property
    def id(self):
        return self._id

    def __eq__(self, other):
        if not isinstance(other, type(self)):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)