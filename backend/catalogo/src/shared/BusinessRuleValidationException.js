export class BusinessRuleValidationException extends Error {
  constructor(rule) {
    super(rule.message());
    this.name = "BusinessRuleValidationException";
    this.rule = rule;
  }
}
