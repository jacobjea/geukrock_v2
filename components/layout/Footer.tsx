import { footerLinks } from "@/lib/mock-data";

export function Footer() {
  return (
    <footer
      className="border-t border-black/10 bg-[#e9e6df] text-black/84"
      id="footer"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-[1.02rem] font-semibold tracking-[0.3em] text-black">
              GEUKROCK
            </p>
            <div className="rounded-[18px] border border-black/10 bg-white/45 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/58">
                Contact
              </p>
              <p className="mt-2 text-[14px] leading-6 text-black/74">
                각종 문의 사항은 인스타그램 극락 인스타그램 연락주세요.
              </p>
              <a
                href="https://www.instagram.com/geukrock_crew/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center text-[14px] font-medium text-black transition-opacity duration-300 hover:opacity-70"
              >
                @geukrock_crew
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((item) => (
              <a
                key={item.label}
                className="text-[12px] font-medium uppercase tracking-[0.2em] text-black/74 transition-colors duration-300 hover:text-black"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/10 pt-5 text-[12px] uppercase tracking-[0.16em] text-black/64 sm:flex-row sm:items-center sm:justify-between">
          <p>2024 - 2026 GEUKROCK.</p>
          <p>Insta / Somoim / Kakao</p>
        </div>
      </div>
    </footer>
  );
}
