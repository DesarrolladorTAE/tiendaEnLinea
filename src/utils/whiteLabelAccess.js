export const WHITE_LABEL_DEMO_PLAN = 1;
export const WHITE_LABEL_ADVANCED_PLAN = 4;
const PREMIUM_CATALOG_COMPLEMENT = 3;

export function hasPremiumCatalog(complements) {
  return Array.isArray(complements) && complements.some(item =>
    Number(item?.complemento_id || item?.id || item?.complemento?.id || item?.complemento?.complemento_id || 0) === PREMIUM_CATALOG_COMPLEMENT,
  );
}
