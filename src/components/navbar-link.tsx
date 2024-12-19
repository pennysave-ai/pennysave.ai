import { Link } from "@nextui-org/link";
import { NavbarMenuItem } from "@nextui-org/navbar";

interface NavbarLinkProps {
  href: string;
  name: string;
  isActive: boolean;
}

export default function NavbarLink({ href, name, isActive }: NavbarLinkProps) {
  return (
    <NavbarMenuItem>
      <Link
        className="w-full"
        href={href}
        color="primary"
        underline={isActive ? "always" : "hover"}
      >
        {name}
      </Link>
    </NavbarMenuItem>
  );
}
