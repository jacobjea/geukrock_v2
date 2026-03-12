import Link from "next/link";

import { signInWithKakaoAction, signOutAction } from "@/lib/auth-actions";
import { getCurrentMember } from "@/lib/auth";
import { navigationItems } from "@/lib/mock-data";

function resolveNavigationHref(href: string) {
  return href.startsWith("#") ? `/${href}` : href;
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export async function Header() {
  const currentMember = await getCurrentMember();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            className="shrink-0 text-[1.02rem] font-semibold tracking-[0.38em] text-black transition-opacity duration-300 hover:opacity-70"
            href="/"
          >
            GEUKROCK
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                className="text-[11px] font-medium uppercase tracking-[0.28em] text-black/62 transition-colors duration-300 hover:text-black"
                href={resolveNavigationHref(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-5 text-[11px] font-medium uppercase tracking-[0.26em] text-black/48 lg:flex">
            <span>Seoul</span>
            <span className="h-3 w-px bg-black/10" />
            {currentMember ? <span>{currentMember.nickname}</span> : <span>Curated Daily</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <label className="group relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 transition-colors duration-300 group-focus-within:text-black/60" />
            <input
              aria-label="Search"
              className="h-12 w-full rounded-full border border-black/10 bg-white/72 pl-11 pr-4 text-[14px] text-black outline-none transition-colors duration-300 focus:border-black/18"
              placeholder="검색어를 입력하세요"
              type="search"
            />
          </label>

          <div className="hidden min-[560px]:flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.24em] text-black/55">
            <Link
              className="transition-colors duration-300 hover:text-black"
              href="/cart"
            >
              Cart
            </Link>
            {currentMember ? (
              <>
                <Link
                  className="transition-colors duration-300 hover:text-black"
                  href="/mypage"
                >
                  마이페이지
                </Link>
                <form action={signOutAction}>
                  <input type="hidden" name="returnTo" value="/" />
                  <button
                    type="submit"
                    className="transition-colors duration-300 hover:text-black"
                  >
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <form action={signInWithKakaoAction}>
                <input type="hidden" name="returnTo" value="/mypage" />
                <button
                  type="submit"
                  className="transition-colors duration-300 hover:text-black"
                >
                  카카오 로그인
                </button>
              </form>
            )}
            <Link
              className="transition-colors duration-300 hover:text-black"
              href="/#footer"
            >
              Support
            </Link>
          </div>
        </div>

        <nav className="flex items-center gap-5 overflow-x-auto whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.24em] text-black/58 md:hidden">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              className="transition-colors duration-300 hover:text-black"
              href={resolveNavigationHref(item.href)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="transition-colors duration-300 hover:text-black"
            href="/cart"
          >
            Cart
          </Link>
          {currentMember ? (
            <>
              <Link
                className="transition-colors duration-300 hover:text-black"
                href="/mypage"
              >
                마이페이지
              </Link>
              <form action={signOutAction}>
                <input type="hidden" name="returnTo" value="/" />
                <button
                  type="submit"
                  className="transition-colors duration-300 hover:text-black"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <form action={signInWithKakaoAction}>
              <input type="hidden" name="returnTo" value="/mypage" />
              <button
                type="submit"
                className="transition-colors duration-300 hover:text-black"
              >
                카카오 로그인
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
