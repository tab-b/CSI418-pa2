// Same required-field rules, regardless of frontend validation
export function missingFields(body, fields) {
  return !body || fields.some(field => typeof body[field] !== "string" || !body[field].trim());
}
