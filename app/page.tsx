import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { EditorPickSection } from "@/components/sections/EditorPickSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProductSection } from "@/components/sections/ProductSection";
import { PromoSection } from "@/components/sections/PromoSection";
import { listStorefrontProducts } from "@/lib/admin/products";
import {
  editorPicks,
  heroContent,
  promoBanners,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listStorefrontProducts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-24">
        <HeroSection content={heroContent} />
        <ProductSection products={products} />
        <PromoSection banners={promoBanners} />
        <EditorPickSection picks={editorPicks} />
      </main>
      <Footer />
    </div>
  );
}
