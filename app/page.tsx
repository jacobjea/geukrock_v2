import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HomeCarousel } from "@/components/sections/HomeCarousel";
import { ProductSection } from "@/components/sections/ProductSection";
import { listStorefrontCarouselSlides } from "@/lib/admin/carousel";
import { listStorefrontProducts } from "@/lib/admin/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, carouselSlides] = await Promise.all([
    listStorefrontProducts(),
    listStorefrontCarouselSlides(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24">
        <HomeCarousel slides={carouselSlides} />
        <ProductSection products={products} />
      </main>
      <Footer />
    </div>
  );
}
