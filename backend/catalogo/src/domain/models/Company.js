import { AggregateRoot } from "../../shared/AggregateRoot.js";
import { StringNotNullOrEmptyRule } from "../../shared/rules/StringNotNullOrEmptyRule.js";

export class Company extends AggregateRoot {
  constructor(id, name, nitOrStatus, status, active = true, createdAt, updatedAt, logoUrl) {
    super(id);

    const legacySignature = arguments.length <= 3;

    this.name = name;
    this.nit = legacySignature ? undefined : nitOrStatus;
    this.status = legacySignature ? nitOrStatus : status;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.logoUrl = logoUrl;
  }

  static create(id, name) {
    AggregateRoot.checkRule(new StringNotNullOrEmptyRule(id, "Company ID"));
    AggregateRoot.checkRule(new StringNotNullOrEmptyRule(name, "Company Name"));

    return new Company(id, name, undefined, "ACTIVE", true);
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
    this.active = true;
  }

  isActive() {
    return this.status === "APPROVED" && this.active === true;
  }

  syncLifecycle(status, active) {
    this.status = status;
    this.active = active;
    this.updatedAt = new Date();
  }
}
