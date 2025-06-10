import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import Link from "next/link";
import { Video, Github } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">CaptureCast</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link
              href="https://github.com/netambhardwaj/capturecast"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
