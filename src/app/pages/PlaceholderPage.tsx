// Temporary page shown until each screen is built from its Figma design.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="glass rounded-2xl p-8 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Screen coming next — built from the Figma design.</p>
    </div>
  );
}
