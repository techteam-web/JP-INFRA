import logo from "../assets/JP Infra Logo.png";

export default function Logo({ className = "h-10 w-auto" }) {
  return <img src={logo} alt="JP Infra" className={className} />;
}
