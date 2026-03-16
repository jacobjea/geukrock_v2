import { CarouselManager } from "@/components/admin/CarouselManager";
import { listAdminCarouselData } from "@/lib/admin/carousel";

export const dynamic = "force-dynamic";

function getStatusMessage(status?: string) {
  switch (status) {
    case "saved":
      return "캐러셀 구성이 저장되었습니다.";
    default:
      return null;
  }
}

interface AdminCarouselPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminCarouselPage({
  searchParams,
}: AdminCarouselPageProps) {
  const params = await searchParams;
  const [carouselData] = await Promise.all([listAdminCarouselData()]);
  const statusMessage = getStatusMessage(params.status);

  return (
    <div className="space-y-6">
      <section className="border border-[#d9dde3] bg-white">
        <div className="border-b border-[#e5e7eb] px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold sm:text-xl">홈 캐러셀 관리</h2>
          <p className="mt-1 text-sm leading-6 text-[#6b7280]">
            기존 히어로 영역 대신 홈 상단에 노출할 캐러셀 이미지를 관리합니다.
          </p>
        </div>

        <div className="grid gap-2 px-4 py-4 text-sm text-[#4b5563] sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:px-5">
          <span>등록 이미지 수: {carouselData.slides.length}장</span>
          <span>
            노출 순서: {carouselData.randomizeOrder ? "랜덤 노출" : "고정 순서"}
          </span>
        </div>
      </section>

      {statusMessage ? (
        <div className="border border-[#b7d4ff] bg-[#eef5ff] px-4 py-3 text-sm text-[#1d4f91]">
          {statusMessage}
        </div>
      ) : null}

      <CarouselManager
        slides={carouselData.slides}
        randomizeOrder={carouselData.randomizeOrder}
      />
    </div>
  );
}
