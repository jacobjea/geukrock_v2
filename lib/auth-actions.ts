"use server";

import { signIn, signOut } from "@/auth";
import { appendSearchParam, sanitizeReturnTo } from "@/lib/member-auth";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function signInWithKakaoAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(getStringValue(formData.get("returnTo")));

  await signIn("kakao", {
    redirectTo: appendSearchParam(returnTo, "login", "success"),
  });
}

export async function signOutAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(getStringValue(formData.get("returnTo")), "/");

  await signOut({
    redirectTo: returnTo,
  });
}
