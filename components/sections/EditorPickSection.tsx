import type { EditorPick, VisualTone } from "@/types/product";

interface EditorPickSectionProps {
  picks: EditorPick[];
}

const toneStyles: Record<
  VisualTone,
  { panel: string; meta: string; frame: string; number: string }
> = {
  obsidian: {
    panel:
      "bg-[radial-gradient(circle_at_24%_24%,rgba(255,255,255,0.14),transparent_32%),linear-gradient(145deg,#252525_0%,#111111_72%,#060606_100%)]",
    meta: "text-white/68",
    frame: "border-white/10 bg-white/6",
    number: "text-white/12",
  },
  graphite: {
    panel:
      "bg-[radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.14),transparent_30%),linear-gradient(145deg,#424242_0%,#222222_70%,#0e0e0e_100%)]",
    meta: "text-white/66",
    frame: "border-white/10 bg-white/6",
    number: "text-white/12",
  },
  steel: {
    panel:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(145deg,#777777_0%,#555555_70%,#2c2c2c_100%)]",
    meta: "text-white/68",
    frame: "border-white/10 bg-white/8",
    number: "text-white/14",
  },
  ash: {
    panel:
      "bg-[radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.34),transparent_30%),linear-gradient(145deg,#dbd7d0_0%,#c3beb5_66%,#a7a196_100%)]",
    meta: "text-black/62",
    frame: "border-black/8 bg-white/26",
    number: "text-black/10",
  },
  mist: {
    panel:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.44),transparent_32%),linear-gradient(145deg,#f1eee8_0%,#ddd8cf_66%,#c1baaf_100%)]",
    meta: "text-black/62",
    frame: "border-black/8 bg-white/30",
    number: "text-black/10",
  },
  concrete: {
    panel:
      "bg-[radial-gradient(circle_at_76%_20%,rgba(255,255,255,0.32),transparent_30%),linear-gradient(145deg,#d0ccc4_0%,#b3aea6_68%,#8c867f_100%)]",
    meta: "text-black/62",
    frame: "border-black/8 bg-white/26",
    number: "text-black/10",
  },
  smoke: {
    panel:
      "bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.14),transparent_30%),linear-gradient(145deg,#595959_0%,#343434_68%,#171717_100%)]",
    meta: "text-white/64",
    frame: "border-white/10 bg-white/6",
    number: "text-white/12",
  },
  chalk: {
    panel:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.48),transparent_34%),linear-gradient(145deg,#f0ece5_0%,#dbd5cc_66%,#c5bfb4_100%)]",
    meta: "text-black/60",
    frame: "border-black/8 bg-white/30",
    number: "text-black/10",
  },
};

function PickVisual({
  tone,
  index,
}: {
  tone: VisualTone;
  index: number;
}) {
  const style = toneStyles[tone];

  return (
    <div
      className={`relative min-h-[240px] overflow-hidden rounded-[22px] border border-black/10 ${style.panel}`}
    >
      <div
        className={`absolute left-4 top-4 text-[11px] font-medium uppercase tracking-[0.24em] ${style.meta}`}
      >
        Visual note
      </div>
      <div
        className={`absolute -left-1 bottom-2 text-[4.8rem] font-semibold leading-none tracking-[-0.1em] ${style.number}`}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className={`absolute right-4 top-4 h-20 w-16 rounded-[16px] border ${style.frame}`} />
      <div
        className={`absolute bottom-4 right-4 h-14 w-[40%] rounded-[16px] border ${style.frame}`}
      />
    </div>
  );
}

export function EditorPickSection({ picks }: EditorPickSectionProps) {
  return (
    <section
      className="px-5 pt-20 sm:px-8 sm:pt-24 lg:px-12"
      id="editor-picks"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-black/62">
              Editor Picks
            </p>
            <h2 className="text-[2.15rem] font-semibold leading-[1.02] tracking-[-0.07em] text-black sm:text-[2.9rem]">
              복잡하지 않게 정리한 에디터 픽과 신상품 노트
            </h2>
          </div>
          <p className="max-w-lg text-[15px] leading-7 text-black/72">
            카드 간 정보량을 고르게 유지하면서 첫 카드는 조금 더 크게 잡아 시선의
            흐름만 조절했습니다. 과한 인터랙션 없이 약한 이동감만 남겼습니다.
          </p>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {picks.map((pick, index) => (
            <article
              key={pick.id}
              className={`group rounded-[28px] border border-black/10 bg-white/72 p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-5 ${
                index === 0 ? "lg:col-span-2" : ""
              }`}
            >
              <div
                className={`grid gap-5 ${
                  index === 0 ? "lg:grid-cols-[1.05fr_0.95fr] lg:items-end" : ""
                }`}
              >
                <div className="space-y-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-black/62">
                    {pick.category}
                  </p>
                  <h3
                    className={`font-semibold leading-[1.04] tracking-[-0.07em] text-black ${
                      index === 0 ? "text-[2rem] sm:text-[2.45rem]" : "text-[1.5rem]"
                    }`}
                  >
                    {pick.title}
                  </h3>
                  <p className="max-w-[34rem] text-[15px] leading-7 text-black/74">
                    {pick.description}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-black/56">
                    {pick.meta}
                  </p>
                </div>

                <PickVisual index={index} tone={pick.tone} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
