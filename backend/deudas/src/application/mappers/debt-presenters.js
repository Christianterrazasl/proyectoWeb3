function mapProvider(provider) {
  return {
    id: String(provider.id),
    name: provider.name,
    description: provider.description,
    image: provider.image_url,
    idProveedor: provider.tenant_id,
    tenantId: provider.tenant_id,
    active: provider.active,
  };
}

function mapPublicDebt(debt) {
  return {
    id: String(debt.id),
    serviceId: debt.service_id,
    period: debt.period,
    amount: debt.amount,
    dueDate: debt.due_date instanceof Date ? debt.due_date.toISOString() : debt.due_date,
    status: debt.status,
  };
}

function mapAdminDebt(debt) {
  return {
    id: String(debt.id),
    tenantId: debt.tenant_id,
    customerRef: debt.customer_ref,
    serviceId: debt.service_id,
    period: debt.period,
    amount: debt.amount,
    dueDate: debt.due_date instanceof Date ? debt.due_date.toISOString() : debt.due_date,
    status: debt.status,
  };
}

module.exports = {
  mapAdminDebt,
  mapProvider,
  mapPublicDebt,
};
