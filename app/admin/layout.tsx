import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222222]">
      <header className="border-b border-[#d9dde3] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-keep text-base font-bold leading-tight sm:text-lg">
              GEUKROCK 관리자
            </h1>
            <span className="mt-1 block text-xs text-[#6b7280] sm:text-sm">
              상품 / 주문 관리
            </span>
          </div>
          <nav className="grid w-full grid-cols-2 gap-2 text-sm sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded border border-[#d9dde3] bg-white px-3 py-2 text-center hover:bg-[#f7f8fa]"
            >
              상품 관리
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center rounded border border-[#d9dde3] bg-white px-3 py-2 text-center hover:bg-[#f7f8fa]"
            >
              주문 관리
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded border border-[#d9dde3] bg-white px-3 py-2 text-center hover:bg-[#f7f8fa]"
            >
              쇼핑몰 이동
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-4 sm:py-6">{children}</main>
    </div>
  );
}
