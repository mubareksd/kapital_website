export type InstitutionBrand = {
  name: string;
  logo: string;
};

export const INSTITUTIONS: Record<string, InstitutionBrand> = {
  ABAYB: { name: "Abay Bank", logo: "/images/institutions/ABAYB.svg" },
  AWAB: { name: "Awash Bank", logo: "/images/institutions/AWAB.svg" },
  BOAX: { name: "Bank of Abyssinia", logo: "/images/institutions/BOAX.svg" },
  GDAB: { name: "Gadda Bank", logo: "/images/institutions/GDAB.png" },
  TELE: { name: "Ethiotelecom", logo: "/images/institutions/TELE.svg" },
  WGBX: { name: "Wegagen Bank", logo: "/images/institutions/WGBX.png" },
};

export function institutionFor(symbol: string): InstitutionBrand | null {
  const code = symbol.trim().toUpperCase();
  return INSTITUTIONS[code] ?? null;
}

export function institutionName(symbol: string, fallback?: string): string {
  return institutionFor(symbol)?.name ?? fallback ?? symbol.toUpperCase();
}

export function institutionLogoUrl(symbol: string): string | null {
  return institutionFor(symbol)?.logo ?? null;
}
