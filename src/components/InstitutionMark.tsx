import Image from "next/image";
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

  return (
    <span className={`inst-mark inst-mark-${size}`}>
      {src ? (
        <Image
          className="inst-logo"
          src={src}
          alt=""
          width={size === "lg" ? 38 : size === "sm" ? 18 : 28}
          height={size === "lg" ? 38 : size === "sm" ? 18 : 28}
          unoptimized
        />
      ) : null}
      <span className="inst-text">
        <strong className="inst-symbol">{code}</strong>
        {showName ? <span className="inst-name">{label}</span> : null}
      </span>
    </span>
  );
}
