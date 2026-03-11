"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { deleteProductImages, uploadProductImage } from "@/lib/admin/blob";
import {
  createProductRecord,
  deleteProductRecord,
  reorderProductsForPage,
  updateProductRecord,
} from "@/lib/admin/products";
import {
  initialProductFormState,
  type ProductFormState,
  type ProductSortActionResult,
} from "@/types/admin-product";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalStringValue(value: FormDataEntryValue | null) {
  const normalized = getStringValue(value);
  return normalized ? normalized : null;
}

function getSingleFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size <= 0) {
    return null;
  }

  return value;
}

function getFiles(values: FormDataEntryValue[]) {
  return values.filter(
    (value): value is File => value instanceof File && value.size > 0,
  );
}

function createErrorState(
  fieldErrors: ProductFormState["fieldErrors"],
  message = "입력값을 확인해 주세요.",
): ProductFormState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

function validateProductForm(formData: FormData) {
  const name = getStringValue(formData.get("name"));
  const description = getOptionalStringValue(formData.get("description"));
  const priceValue = getStringValue(formData.get("price"));
  const thumbnailFile = getSingleFile(formData.get("thumbnail"));
  const detailFiles = getFiles(formData.getAll("detailImages"));
  const detailImageOrder = formData
    .getAll("detailImageOrder")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const deletedImageIds = formData
    .getAll("deletedImageIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const removeThumbnail = formData.get("removeThumbnail") === "on";
  const fieldErrors: ProductFormState["fieldErrors"] = {};
  const price = Number(priceValue);

  if (!name) {
    fieldErrors.name = "상품명을 입력해 주세요.";
  } else if (name.length > 120) {
    fieldErrors.name = "상품명은 120자 이하로 입력해 주세요.";
  }

  if (!priceValue) {
    fieldErrors.price = "판매가를 입력해 주세요.";
  } else if (!Number.isInteger(price) || price < 0) {
    fieldErrors.price = "판매가는 0 이상의 정수만 입력할 수 있습니다.";
  }

  if (thumbnailFile && !thumbnailFile.type.startsWith("image/")) {
    fieldErrors.thumbnail = "썸네일은 이미지 파일만 업로드할 수 있습니다.";
  } else if (thumbnailFile && thumbnailFile.size > MAX_IMAGE_BYTES) {
    fieldErrors.thumbnail = "썸네일 이미지는 10MB 이하만 업로드할 수 있습니다.";
  }

  for (const file of detailFiles) {
    if (!file.type.startsWith("image/")) {
      fieldErrors.detailImages = "상세 이미지는 이미지 파일만 업로드할 수 있습니다.";
      break;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      fieldErrors.detailImages = "상세 이미지는 10MB 이하만 업로드할 수 있습니다.";
      break;
    }
  }

  if (Object.keys(fieldErrors).length) {
    return {
      state: createErrorState(fieldErrors),
      parsed: {
        name,
        description,
        price,
        thumbnailFile,
        detailFiles,
        detailImageOrder,
        deletedImageIds,
        removeThumbnail,
      },
    };
  }

  return {
    state: null,
    parsed: {
      name,
      description,
      price,
      thumbnailFile,
      detailFiles,
      detailImageOrder,
      deletedImageIds,
      removeThumbnail,
    },
  };
}

async function cleanupBlobAssets(pathnames: string[]) {
  try {
    await deleteProductImages(pathnames);
  } catch (error) {
    console.error("Failed to clean up blob assets", error);
  }
}

export async function createProductAction(
  _previousState: ProductFormState = initialProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  void _previousState;

  const validation = validateProductForm(formData);

  if (validation.state) {
    return validation.state;
  }

  const { name, description, price, thumbnailFile, detailFiles } = validation.parsed;
  const uploadedAssets: string[] = [];

  try {
    const [thumbnail, detailImages] = await Promise.all([
      thumbnailFile
        ? uploadProductImage(thumbnailFile, "thumbnails", name).then((image) => {
            uploadedAssets.push(image.pathname);
            return image;
          })
        : Promise.resolve(null),
      Promise.all(
        detailFiles.map((file) =>
          uploadProductImage(file, "details", name).then((image) => {
            uploadedAssets.push(image.pathname);
            return image;
          }),
        ),
      ),
    ]);

    await createProductRecord({
      name,
      description,
      price,
      thumbnail,
      detailImages,
    });

    revalidatePath("/admin");
    revalidatePath("/");
    redirect("/admin?status=created");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    await cleanupBlobAssets(uploadedAssets);

    return createErrorState(
      {},
      error instanceof Error ? error.message : "상품 등록에 실패했습니다.",
    );
  }
}

export async function updateProductAction(
  productId: string,
  _previousState: ProductFormState = initialProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  void _previousState;

  const validation = validateProductForm(formData);

  if (validation.state) {
    return validation.state;
  }

  const {
    name,
    description,
    price,
    thumbnailFile,
    detailFiles,
    detailImageOrder,
    deletedImageIds,
    removeThumbnail,
  } = validation.parsed;
  const uploadedAssets: string[] = [];

  try {
    const [thumbnail, detailImages] = await Promise.all([
      thumbnailFile
        ? uploadProductImage(thumbnailFile, "thumbnails", name).then((image) => {
            uploadedAssets.push(image.pathname);
            return image;
          })
        : Promise.resolve(null),
      Promise.all(
        detailFiles.map((file) =>
          uploadProductImage(file, "details", name).then((image) => {
            uploadedAssets.push(image.pathname);
            return image;
          }),
        ),
      ),
    ]);

    const result = await updateProductRecord({
      productId,
      name,
      description,
      price,
      thumbnail,
      detailImages,
      detailImageOrder,
      deletedImageIds,
      removeThumbnail,
    });

    if (!result) {
      await cleanupBlobAssets(uploadedAssets);
      return createErrorState({}, "수정할 상품을 찾을 수 없습니다.");
    }

    await cleanupBlobAssets(result.removedAssets);
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath(`/admin/products/${productId}/edit`);
    redirect("/admin?status=updated");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    await cleanupBlobAssets(uploadedAssets);

    return createErrorState(
      {},
      error instanceof Error ? error.message : "상품 수정에 실패했습니다.",
    );
  }
}

export async function deleteProductAction(productId: string) {
  const result = await deleteProductRecord(productId);

  if (result?.removedAssets.length) {
    await cleanupBlobAssets(result.removedAssets);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?status=deleted");
}

export async function reorderProductsAction(
  page: number,
  orderedProductIds: string[],
): Promise<ProductSortActionResult> {
  try {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

    if (!Array.isArray(orderedProductIds) || !orderedProductIds.length) {
      return {
        status: "error",
        message: "정렬할 상품 순서를 확인할 수 없습니다.",
      };
    }

    const result = await reorderProductsForPage(safePage, orderedProductIds);

    if (!result) {
      return {
        status: "error",
        message: "현재 페이지의 상품 순서를 저장하지 못했습니다.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      status: "success",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "상품 진열순서 저장에 실패했습니다.",
    };
  }
}
