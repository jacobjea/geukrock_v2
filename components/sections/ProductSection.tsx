import type { Product, VisualTone } from "@/types/product";

interface ProductSectionProps {
  products: Product[];
}

interface ToneStyle {
  panel: string;
  text: string;
  meta: string;
  pill: string;
  frame: string;
}

const toneStyles: Record<VisualTone, ToneStyle> = {
  obsidian: {
    panel:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_32%),linear-gradient(145deg,#2a2a2a_0%,#111111_72%,#070707_100%)]",
    text: "text-white/12",
    meta: "text-white/48",
    pill: "bg-white/10 text-white/82",
    frame: "border-white/10 bg-white/5",
  },
  graphite: {
    panel:
      "bg-[radial-gradient(circle_at_76%_16%,rgba(255,255,255,0.14),transparent_28%),linear-gradient(145deg,#3b3b3b_0%,#1f1f1f_72%,#101010_100%)]",
    text: "text-white/12",
    meta: "text-white/46",
    pill: "bg-white/10 text-white/82",
    frame: "border-white/10 bg-white/5",
  },
  steel: {
    panel:
      "bg-[radial-gradient(circle_at_24%_24%,rgba(255,255,255,0.2),transparent_28%),linear-gradient(145deg,#757575_0%,#565656_62%,#2f2f2f_100%)]",
    text: "text-white/14",
    meta: "text-white/50",
    pill: "bg-white/12 text-white/86",
    frame: "border-white/10 bg-white/7",
  },
  ash: {
    panel:
      "bg-[radial-gradient(circle_at_76%_14%,rgba(255,255,255,0.42),transparent_30%),linear-gradient(145deg,#dbd8d1_0%,#c2beb6_64%,#aaa69c_100%)]",
    text: "text-black/10",
    meta: "text-black/42",
    pill: "bg-black/7 text-black/70",
    frame: "border-black/8 bg-white/24",
  },
  mist: {
    panel:
      "bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.38),transparent_34%),linear-gradient(145deg,#f0eee8_0%,#ddd9d1_68%,#c2beb4_100%)]",
    text: "text-black/10",
    meta: "text-black/38",
    pill: "bg-black/6 text-black/66",
    frame: "border-black/8 bg-white/30",
  },
  concrete: {
    panel:
      "bg-[radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.28),transparent_30%),linear-gradient(145deg,#d0cdc6_0%,#b4b0a8_68%,#8f8b84_100%)]",
    text: "text-black/10",
    meta: "text-black/40",
    pill: "bg-black/6 text-black/68",
    frame: "border-black/8 bg-white/24",
  },
  smoke: {
    panel:
      "bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.16),transparent_30%),linear-gradient(145deg,#595959_0%,#353535_68%,#171717_100%)]",
    text: "text-white/12",
    meta: "text-white/46",
    pill: "bg-white/10 text-white/82",
    frame: "border-white/10 bg-white/6",
  },
  chalk: {
    panel:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.46),transparent_34%),linear-gradient(145deg,#eeebe5_0%,#dcd7cf_64%,#c8c2b8_100%)]",
    text: "text-black/10",
    meta: "text-black/40",
    pill: "bg-black/6 text-black/68",
    frame: "border-black/8 bg-white/30",
  },
};

const priceFormatter = new Intl.NumberFormat("ko-KR");

function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const tone = toneStyles[product.tone];

  return (
    <article className="group flex flex-col gap-4">
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-[18px] border border-black/10 ${tone.panel} transition-transform duration-300 group-hover:-translate-y-1`}
      >
        <div
          className={`absolute -left-1 top-5 text-[4.5rem] font-semibold leading-none tracking-[-0.1em] ${tone.text}`}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        <div
          className={`absolute left-4 top-4 text-[10px] font-medium uppercase tracking-[0.3em] ${tone.meta}`}
        >
          curated line
        </div>
        <div
          className={`absolute right-4 top-4 h-20 w-16 rounded-[16px] border ${tone.frame}`}
        />
        <div
          className={`absolute bottom-5 right-4 h-16 w-[42%] rounded-[16px] border ${tone.frame}`}
        />
        <div
          className={`absolute bottom-4 left-4 inline-flex h-8 items-center rounded-full px-3 text-[10px] font-medium uppercase tracking-[0.24em] ${tone.pill}`}
        >
          {product.badge ?? "Studio"}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/46">
          {product.brand}
        </p>
        <h3 className="text-[15px] leading-6 text-black/88">{product.name}</h3>
        <div className="flex items-center gap-2 text-[15px]">
          <span className="font-semibold text-black">
            {priceFormatter.format(product.price)}원
          </span>
          <span className="font-semibold text-[#8c1117]">
            {product.discountRate}%
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductSection({ products }: ProductSectionProps) {
  return (
    <section className="px-5 pt-20 sm:px-8 sm:pt-24 lg:px-12" id="new-in">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-black/46">
              Recommended Products
            </p>
            <h2 className="text-[2rem] font-semibold leading-[1.02] tracking-[-0.07em] text-black sm:text-[2.7rem]">
              도시적인 균형으로 선별한 추천 상품
            </h2>
          </div>
          <p className="max-w-lg text-[14px] leading-6 text-black/58">
            상품 카드는 절제된 정보 구조와 정렬감을 유지하고, 이미지는 그레이스케일
            그래픽으로 처리해 패션 플랫폼 특유의 차분한 무드를 우선했습니다.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-12">
          {products.map((product, index) => (
            <ProductCard key={product.id} index={index} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
