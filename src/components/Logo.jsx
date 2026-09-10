import logo from "../assets/JP Infra Logo.jpg";

export default function Logo({ className = "h-10 w-auto" }) {
  return <img src={logo} alt="JP Infra" decoding="async" className={className} />;
}
