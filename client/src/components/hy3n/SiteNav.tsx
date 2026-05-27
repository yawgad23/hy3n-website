import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { LogOut, User as UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export function SiteNav() {
  const { user, isAuthenticated } = useAuth();
  const [, setLoc] = useLocation();
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      setLoc("/");
    },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-md bg-background/70">
      <div className="container flex items-center justify-between h-16">
        <Link href="/"><Logo /></Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          <Link href="/#categories" className="hover:text-foreground transition-colors">Rides</Link>
          <Link href="/book" className="hover:text-foreground transition-colors">Book</Link>
          <Link href="/drive" className="hover:text-foreground transition-colors">Drive with HY3N</Link>
          <Link href="/safety" className="hover:text-foreground transition-colors">Safety</Link>
        </nav>

        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                    {(user?.name ?? user?.email ?? "U").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user?.name ?? user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setLoc("/book")}>
                  <UserIcon className="w-4 h-4 mr-2" /> Book a ride
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLoc("/driver")}>
                  <UserIcon className="w-4 h-4 mr-2" /> Driver dashboard
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => setLoc("/admin")}>
                    <UserIcon className="w-4 h-4 mr-2" /> Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout.mutate()} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <a href={getLoginUrl()}>
                <Button variant="ghost" size="sm">Sign in</Button>
              </a>
              <Link href="/book">
                <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  Book a ride
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
