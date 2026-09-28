import { BrandIcon } from "./BrandIcon";
import type { SocialLink } from "../data/site";

export function SocialIcon({ icon, size = 18 }: { icon: SocialLink["icon"]; size?: number }) {
  return <BrandIcon name={icon} size={size} />;
}
