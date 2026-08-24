import {
  institutionLogoUrl,
  institutionName,
} from "@/lib/institutions";

type InstitutionMarkProps = {
  symbol: string;
  name?: string | null;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
};

export function InstitutionMark({
  symbol,
  name,
  logoUrl,
  size = "md",
  showName = false,
}: InstitutionMarkProps) {
  const code = symbol.toUpperCase();
  const src = logoUrl ?? institutionLogoUrl(code);
  const label = name || institutionName(code);
  const px = size === "lg" ? 38 : size === "sm" ? 18 : 28;

  return (
    <span className={`inst-mark inst-mark-${size}`}>
      {src ? (
        // Local SVG/PNG marks are tiny; next/image SVG support needs extra config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="inst-logo"
          src={src}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className="inst-text">
        <strong className="inst-symbol">{code}</strong>
        {showName ? <span className="inst-name">{label}</span> : null}
      </span>
    </span>
  );
}
