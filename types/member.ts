export interface MemberUser {
  id: string;
  kakaoUserId: string;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lastSignedInAt: string;
}

export interface CurrentMember {
  id: string;
  nickname: string;
  email: string | null;
  profileImageUrl: string | null;
}
