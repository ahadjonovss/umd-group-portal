interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export function Logo({ className = "", size = 32, color = "currentColor" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 600"
      width={size}
      height={size}
      fill={color}
      className={className}
      aria-label="UMD GROUP logo"
    >
      {/* U1 outermost */}
      <rect x="0"   y="0" width="42" height="600"/>
      <rect x="558" y="0" width="42" height="600"/>
      <rect x="0"   y="558" width="600" height="42"/>
      {/* U2 */}
      <rect x="72"  y="0" width="42" height="528"/>
      <rect x="486" y="0" width="42" height="528"/>
      <rect x="72"  y="486" width="456" height="42"/>
      {/* U3 */}
      <rect x="144" y="0" width="42" height="456"/>
      <rect x="414" y="0" width="42" height="456"/>
      <rect x="144" y="414" width="312" height="42"/>
      {/* U4 innermost */}
      <rect x="216" y="0" width="42" height="384"/>
      <rect x="342" y="0" width="42" height="384"/>
      <rect x="216" y="342" width="168" height="42"/>
    </svg>
  );
}
