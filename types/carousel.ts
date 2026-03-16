export interface CarouselSlide {
  id: string;
  imageUrl: string;
  pathname: string;
  sortOrder: number;
  createdAt: string;
}

export interface StorefrontCarouselSlide {
  id: string;
  imageUrl: string;
}

export interface CarouselAdminData {
  slides: CarouselSlide[];
  randomizeOrder: boolean;
}

export interface CarouselFormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors: Partial<{
    images: string;
    slideOrder: string;
  }>;
}

export const initialCarouselFormState: CarouselFormState = {
  status: "idle",
  fieldErrors: {},
};
