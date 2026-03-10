import { footerLinks } from "@/lib/mock-data";

export function Footer() {
  return (
    <footer
      className="border-t border-black/10 bg-[#e9e6df] text-black/72"
      id="footer"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-[0.98rem] font-semibold tracking-[0.34em] text-black">
              GEUKROCK
            </p>
            <p className="max-w-md text-[13px] leading-6 text-black/58">
              패션 플랫폼의 정제된 무드를 참고해 재해석한 메인 홈 화면 콘셉트입니다.
              기능보다 타이포그래피, 여백, 레이아웃 감도를 우선했습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((item) => (
              <a
                key={item.label}
                className="text-[11px] font-medium uppercase tracking-[0.26em] text-black/56 transition-colors duration-300 hover:text-black"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/10 pt-5 text-[11px] uppercase tracking-[0.24em] text-black/42 sm:flex-row sm:items-center sm:justify-between">
          <p>2026 GEUKROCK. Mood-first commerce concept.</p>
          <p>Seoul based / App Router / Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
