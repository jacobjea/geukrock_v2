import "server-only";

import { auth } from "@/auth";
import { getMemberById } from "@/lib/member-auth";
import type { CurrentMember } from "@/types/member";

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const session = await auth();
  const memberId = session?.user?.id;

  if (!memberId) {
    return null;
  }

  const member = await getMemberById(memberId);

  if (member) {
    return member;
  }

  return {
    id: memberId,
    nickname: session.user.name ?? "Member",
    email: session.user.email ?? null,
    profileImageUrl: session.user.image ?? null,
  };
}
