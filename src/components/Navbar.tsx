import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Container } from "./Layout";

const links = [
  { to: "/", label: "Home" },
  { to: "/tools", label: "Tools" },
  { to: "/projects", label: "Projects" },
  { to: "/games", label: "Games" },
  { to: "/links", label: "Links" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-base/95 backdrop-blur-none">
      <Container className="flex h-14 items-center justify-between">
        <NavLink to="/" className="font-mono text-sm font-semibold text-ink tracking-tight">
          xXRenq<span className="text-accent">.</span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 h-9 flex items-center text-sm rounded transition-colors duration-150",
                  isActive ? "text-ink bg-raised" : "text-ink-dim hover:text-ink hover:bg-raised"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded text-ink-dim hover:text-ink hover:bg-raised transition-colors duration-150"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {open && (
        <nav className="md:hidden border-t border-border bg-base">
          <Container className="flex flex-col py-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "h-11 flex items-center text-base rounded px-2 transition-colors duration-150",
                    isActive ? "text-ink bg-raised" : "text-ink-dim hover:text-ink"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
