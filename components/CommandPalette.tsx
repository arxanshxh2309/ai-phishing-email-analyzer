"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ClipboardPaste, FileUp, Moon, Sun, TestTube2 } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { SAMPLE_EMAILS } from "@/lib/samples";

export function CommandPalette({
  onSwitchTab,
  onLoadSample,
}: {
  onSwitchTab: (tab: "paste" | "upload") => void;
  onLoadSample: (raw: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Quick actions">
      <Command>
        <CommandInput placeholder="Type a command…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => run(() => onSwitchTab("paste"))}>
              <ClipboardPaste />
              Paste an email
            </CommandItem>
            <CommandItem onSelect={() => run(() => onSwitchTab("upload"))}>
              <FileUp />
              Upload a .eml file
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Try a sample">
            {SAMPLE_EMAILS.map((sample) => (
              <CommandItem key={sample.id} onSelect={() => run(() => onLoadSample(sample.raw))}>
                <TestTube2 />
                {sample.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Preferences">
            <CommandItem onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              Toggle theme
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
