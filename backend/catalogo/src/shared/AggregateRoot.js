import { Entity } from "./Entity.js";
import { BusinessRuleValidationException } from "./BusinessRuleValidationException.js";

export class AggregateRoot extends Entity {
  constructor(id) {
    super(id);
  }

  static checkRule(rule) {
    if (!rule.isValid()) {
      throw new BusinessRuleValidationException(rule);
    }
  }
}
