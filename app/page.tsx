import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HomeCarousel } from "@/components/sections/HomeCarousel";
import { ProductSection } from "@/components/sections/ProductSection";
import {
  getCachedStorefrontCarouselSlides,
  getCachedStorefrontProducts,
} from "@/lib/storefront-cache";

export const revalidate = 60;

export default async function Home() {
  const [products, carouselSlides] = await Promise.all([
    getCachedStorefrontProducts(),
    getCachedStorefrontCarouselSlides(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentMember={null} />
      <main className="pb-24">
        <HomeCarousel slides={carouselSlides} />
        <ProductSection products={products} />
      </main>
      <Footer />
    </div>
  );
}
