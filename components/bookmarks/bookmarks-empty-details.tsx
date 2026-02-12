"use client";

export function DetailsHeaderRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground">
      <span className="w-6 shrink-0" />
      <span className="flex-1">Name</span>
      <span className="hidden sm:block w-36 text-right">URL</span>
      <span className="hidden lg:block w-32 text-right">Folder</span>
      <span className="hidden md:block w-28 text-right">Date Added</span>
      <span className="w-6 shrink-0" />
    </div>
  );
}
