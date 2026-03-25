import Link from "next/link";

import { signInWithKakaoAction, signOutAction } from "@/lib/auth-actions";
import { getCurrentMember } from "@/lib/auth";
import { navigationItems } from "@/lib/mock-data";
import type { CurrentMember } from "@/types/member";

function resolveNavigationHref(href: string) {
  return href.startsWith("#") ? `/${href}` : href;
}

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 20a7 7 0 0 0-14 0m11-11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BagIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.5 8.5h13l-1 11h-11l-1-11Zm3-1V7a3.5 3.5 0 1 1 7 0v.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AdminIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m12 3.75 1.15 1.02a1 1 0 0 0 1 .2l1.47-.58 1.05 1.82-1.18 1.01a1 1 0 0 0-.32.97l.22 1.52 1.38.63v2.1l-1.38.63a1 1 0 0 0-.22 1.52l1.18 1.01-1.05 1.82-1.47-.58a1 1 0 0 0-1 .2L12 20.25l-1.15-1.02a1 1 0 0 0-1-.2l-1.47.58-1.05-1.82 1.18-1.01a1 1 0 0 0 .22-1.52l-1.38-.63v-2.1l1.38-.63a1 1 0 0 0 .22-1.52L7.28 6.21l1.05-1.82 1.47.58a1 1 0 0 0 1-.2L12 3.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SignInKeyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="8.5"
        cy="12"
        r="3.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12.25 12H19.25M16.25 12v2.5M18.5 12v1.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="8.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function SignOutPowerIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4.25v7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M16.42 6.58a6.25 6.25 0 1 1-8.84 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

interface HeaderProps {
  currentMember?: CurrentMember | null;
}

export async function Header({ currentMember }: HeaderProps = {}) {
  const resolvedCurrentMember =
    currentMember === undefined ? await getCurrentMember() : currentMember;
  const actionItemClass =
    "inline-flex items-center gap-2 whitespace-nowrap text-[15px] font-medium text-black/84 transition-colors duration-200 hover:text-black";
  const mobileIconButtonClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-full text-black/84 transition-colors duration-200 hover:bg-black/[0.05] hover:text-black";

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-md min-[860px]:bg-background/95">
      <div className="mx-auto max-w-[1440px] px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-5 lg:gap-8">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              className="shrink-0 text-[1.08rem] font-semibold tracking-[0.34em] text-black transition-opacity duration-300 hover:opacity-70"
              href="/"
              prefetch={false}
            >
              GEUKROCK
            </Link>

            <div className="hidden items-center gap-4 text-[12px] font-medium uppercase tracking-[0.22em] text-black/62 xl:flex">
              <span className="h-3 w-px bg-black/10" />
              {resolvedCurrentMember ? (
                <span>{resolvedCurrentMember.nickname}</span>
              ) : (
                <span>Curated Daily</span>
              )}
            </div>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                className="text-[12px] font-medium uppercase tracking-[0.22em] text-black/84 transition-colors duration-300 hover:text-black"
                href={resolveNavigationHref(item.href)}
                prefetch={false}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 min-[860px]:hidden">
            {resolvedCurrentMember?.isAdmin ? (
              <Link
                aria-label="관리자 페이지"
                className={mobileIconButtonClass}
                href="/admin"
                prefetch={false}
              >
                <AdminIcon className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              aria-label="마이페이지"
              className={mobileIconButtonClass}
              href="/mypage"
              prefetch={false}
            >
              <UserIcon className="h-4 w-4" />
            </Link>
            <Link
              aria-label="장바구니"
              className={mobileIconButtonClass}
              href="/cart"
              prefetch={false}
            >
              <BagIcon className="h-4 w-4" />
            </Link>
            {resolvedCurrentMember ? (
              <form action={signOutAction}>
                <input type="hidden" name="returnTo" value="/" />
                <button
                  aria-label="로그아웃"
                  type="submit"
                  className={mobileIconButtonClass}
                >
                  <SignOutPowerIcon className="h-[18px] w-[18px]" />
                </button>
              </form>
            ) : (
              <form action={signInWithKakaoAction}>
                <input type="hidden" name="returnTo" value="/" />
                <button
                  aria-label="로그인"
                  type="submit"
                  className={mobileIconButtonClass}
                >
                  <SignInKeyIcon className="h-[18px] w-[18px]" />
                </button>
              </form>
            )}
          </div>

          <div className="hidden min-[860px]:flex items-center gap-3 rounded-[20px] border border-black/12 bg-white px-4 py-3 text-black shadow-[0_14px_34px_rgba(15,17,22,0.06)]">
            {resolvedCurrentMember?.isAdmin ? (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-xl border border-black/12 bg-white px-4 text-[15px] font-medium text-black/84 transition-colors duration-200 hover:bg-black/[0.03] hover:text-black"
                href="/admin"
                prefetch={false}
              >
                ADMIN
              </Link>
            ) : null}
            <Link className={actionItemClass} href="/mypage" prefetch={false}>
              <UserIcon className="h-4 w-4" />
              마이
            </Link>
            <Link className={actionItemClass} href="/cart" prefetch={false}>
              <BagIcon className="h-4 w-4" />
              장바구니
            </Link>
            {resolvedCurrentMember ? (
              <form action={signOutAction}>
                <input type="hidden" name="returnTo" value="/" />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-black/12 bg-white px-4 text-[15px] font-medium text-black/84 transition-colors duration-200 hover:bg-black/[0.03] hover:text-black"
                >
                  로그아웃
                </button>
              </form>
            ) : (
              <form action={signInWithKakaoAction}>
                <input type="hidden" name="returnTo" value="/" />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-black/12 bg-white px-4 text-[15px] font-medium text-black/84 transition-colors duration-200 hover:bg-black/[0.03] hover:text-black"
                >
                  로그인
                </button>
              </form>
            )}
          </div>
        </div>

        <nav className="mt-2 flex items-center gap-5 overflow-x-auto whitespace-nowrap pt-2 text-[12px] font-medium uppercase tracking-[0.18em] text-black/72 lg:hidden">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              className="transition-colors duration-300 hover:text-black"
              href={resolveNavigationHref(item.href)}
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
