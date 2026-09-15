import logo from "../assets/Firefly Logo - No BG.png";

interface FireflyLogoProps {
  className?: string;
}

export default function FireflyLogo({
  className = "w-20 h-20",
}: FireflyLogoProps) {
  return (
    <img
      src={logo}
      alt="Firefly Logo"
      className={`object-contain ${className}`}
    />
  );
}
