import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222222]">
      <header className="border-b border-[#d9dde3] bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">GEUKROCK 관리자</h1>
            <span className="hidden text-sm text-[#6b7280] sm:block">
              상품 관리
            </span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/admin"
              className="rounded border border-[#d9dde3] bg-white px-3 py-2 hover:bg-[#f7f8fa]"
            >
              상품 목록
            </Link>
            <Link
              href="/admin/products/new"
              className="rounded border border-[#d9dde3] bg-white px-3 py-2 hover:bg-[#f7f8fa]"
            >
              상품 등록
            </Link>
            <Link
              href="/"
              className="rounded border border-[#d9dde3] bg-white px-3 py-2 hover:bg-[#f7f8fa]"
            >
              쇼핑몰 이동
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6">{children}</main>
    </div>
  );
}
