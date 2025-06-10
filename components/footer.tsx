export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CaptureCast. All rights reserved.</p>
      </div>
    </footer>
  )
}
