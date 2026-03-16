"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { deleteProductImages, uploadProductImage } from "@/lib/admin/blob";
import { saveCarouselData } from "@/lib/admin/carousel";
import { requireCurrentAdmin } from "@/lib/auth";
import {
  initialCarouselFormState,
  type CarouselFormState,
} from "@/types/carousel";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function getFiles(values: FormDataEntryValue[]) {
  return values.filter(
    (value): value is File => value instanceof File && value.size > 0,
  );
}

function createErrorState(
  fieldErrors: CarouselFormState["fieldErrors"],
  message = "입력값을 확인해 주세요.",
): CarouselFormState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

async function cleanupBlobAssets(pathnames: string[]) {
  try {
    await deleteProductImages(pathnames);
  } catch (error) {
    console.error("Failed to clean up carousel blob assets", error);
  }
}

export async function saveCarouselAction(
  _previousState: CarouselFormState = initialCarouselFormState,
  formData: FormData,
): Promise<CarouselFormState> {
  void _previousState;
  await requireCurrentAdmin();

  const images = getFiles(formData.getAll("images"));
  const slideOrder = formData
    .getAll("slideOrder")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const deletedSlideIds = formData
    .getAll("deletedSlideIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const randomizeOrder = formData.get("randomizeOrder") === "on";
  const fieldErrors: CarouselFormState["fieldErrors"] = {};

  for (const file of images) {
    if (!file.type.startsWith("image/")) {
      fieldErrors.images = "캐러셀 이미지는 이미지 파일만 업로드할 수 있습니다.";
      break;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      fieldErrors.images = "캐러셀 이미지는 10MB 이하만 업로드할 수 있습니다.";
      break;
    }
  }

  if (Object.keys(fieldErrors).length) {
    return createErrorState(fieldErrors);
  }

  const uploadedAssets: string[] = [];

  try {
    const uploadedImages = await Promise.all(
      images.map((file) =>
        uploadProductImage(file, "carousel", "home-carousel").then((image) => {
          uploadedAssets.push(image.pathname);
          return image;
        }),
      ),
    );

    const result = await saveCarouselData({
      randomizeOrder,
      slideOrder,
      deletedSlideIds,
      images: uploadedImages,
    });

    await cleanupBlobAssets(result.removedAssets);
    revalidatePath("/");
    revalidatePath("/admin/carousel");
    redirect("/admin/carousel?status=saved");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    await cleanupBlobAssets(uploadedAssets);

    return createErrorState(
      {},
      error instanceof Error
        ? error.message
        : "캐러셀 저장에 실패했습니다.",
    );
  }
}
