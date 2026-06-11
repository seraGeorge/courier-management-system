import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold text-gray-900">
          Courier Collection
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/new-package"
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            New Package
          </Link>
          <Link
            href="/track-package"
            className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Track Package
          </Link>
        </nav>
      </div>
    </header>
  );
}
