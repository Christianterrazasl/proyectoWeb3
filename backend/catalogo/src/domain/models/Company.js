import { AggregateRoot } from "../../shared/core/AggregateRoot.js";
import { StringNotNullOrEmptyRule } from "../../shared/rules/StringNotNullOrEmptyRule.js";

export class Company extends AggregateRoot {
  constructor(id, name, status) {
    super(id);
    this.name = name;
    this.status = status;
  }

  static create(id, name) {
    AggregateRoot.checkRule(new StringNotNullOrEmptyRule(id, "Company ID"));
    AggregateRoot.checkRule(new StringNotNullOrEmptyRule(name, "Company Name"));

    return new Company(id, name, "ACTIVE");
  }
  changeName(newName) {
    AggregateRoot.checkRule(
      new StringNotNullOrEmptyRule(newName, "New Company Name"),
    );
    this.name = newName;
  }

  deactivate() {
    this.status = "INACTIVE";
  }

  activate() {
    this.status = "ACTIVE";
  }
}
