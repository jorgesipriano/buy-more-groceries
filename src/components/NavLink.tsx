import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export const NavLink = ({ to, children, className }: NavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "transition-colors",
        isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
};
