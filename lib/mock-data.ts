import type {
  EditorPick,
  FooterLink,
  HeroContent,
  NavigationItem,
  Product,
  PromoBanner,
} from "@/types/product";

export const navigationItems: NavigationItem[] = [
  { label: "New In", href: "#new-in" },
  { label: "Editorial", href: "#promo" },
  { label: "Editor Picks", href: "#editor-picks" },
];

export const footerLinks: FooterLink[] = [
  { label: "About", href: "#" },
  { label: "Guide", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
];

export const heroContent: HeroContent = {
  eyebrow: "SPRING CURATION / 2026",
  title: ["BLACK", "MOVES", "FIRST"],
  description:
    "도시적인 실루엣과 단정한 텍스처만 남긴 시즌 셀렉션. 과한 장식 대신 균형 잡힌 비율과 넓은 여백으로 패션 플랫폼 특유의 무드를 정리했습니다.",
  primaryCta: "신상품 보기",
  secondaryCta: "에디토리얼 읽기",
  stats: [
    { label: "CURATED LABELS", value: "48" },
    { label: "DROP THIS WEEK", value: "112" },
    { label: "CITY STANDARD", value: "SEOUL / TOKYO" },
  ],
};

export const featuredProducts: Product[] = [
  {
    id: "prod-01",
    brand: "NOIR STANDARD",
    name: "코튼 블렌드 맥 코트",
    price: 189000,
    discountRate: 18,
    tone: "obsidian",
    badge: "Limited",
  },
  {
    id: "prod-02",
    brand: "ATELIER 02",
    name: "하프 집업 니트 스웨트",
    price: 92000,
    discountRate: 12,
    tone: "ash",
    badge: "Restock",
  },
  {
    id: "prod-03",
    brand: "CITY MINOR",
    name: "와이드 턱 트라우저",
    price: 79000,
    discountRate: 22,
    tone: "graphite",
    badge: "Core",
  },
  {
    id: "prod-04",
    brand: "FORM LAB",
    name: "스퀘어 토 레더 로퍼",
    price: 129000,
    discountRate: 15,
    tone: "mist",
    badge: "Studio",
  },
  {
    id: "prod-05",
    brand: "MUTE OBJECT",
    name: "박시 핏 워시드 셔츠",
    price: 68000,
    discountRate: 20,
    tone: "concrete",
    badge: "New",
  },
  {
    id: "prod-06",
    brand: "ORDINARY FORM",
    name: "테이퍼드 데님 팬츠",
    price: 87000,
    discountRate: 14,
    tone: "steel",
    badge: "Denim",
  },
  {
    id: "prod-07",
    brand: "HIDDEN TEXTURE",
    name: "라이트 패딩 블루종",
    price: 154000,
    discountRate: 24,
    tone: "smoke",
    badge: "Archive",
  },
  {
    id: "prod-08",
    brand: "ESSAY LINE",
    name: "미니멀 레더 숄더백",
    price: 115000,
    discountRate: 10,
    tone: "chalk",
    badge: "Daily",
  },
];

export const promoBanners: PromoBanner[] = [
  {
    id: "promo-01",
    eyebrow: "EDITORIAL DROP",
    title: "TEXTURE / IN / MONO",
    description:
      "차분한 질감과 단단한 재단이 만나는 순간을 한 장의 배너처럼 구성했습니다. 제품보다 분위기가 먼저 전달되는 구성을 의도했습니다.",
    cta: "캠페인 보기",
    secondaryCta: "스타일 노트",
    accent: "CURATED DAILY",
    tone: "night",
  },
  {
    id: "promo-02",
    eyebrow: "WEEKEND UPDATE",
    title: "LIGHT GRAY OUTER",
    description:
      "밝은 회색 톤, 소프트한 표면감, 넉넉한 볼륨을 가진 아우터를 중심으로 구성한 에디토리얼형 프로모션 배너입니다.",
    cta: "셀렉션 보기",
    secondaryCta: "룩북 보기",
    accent: "SOFT TAILORING",
    tone: "paper",
  },
];

export const editorPicks: EditorPick[] = [
  {
    id: "pick-01",
    category: "EDITOR PICK",
    title: "차분한 블랙 셋업은 가장 빠르게 분위기를 만든다.",
    description:
      "정교한 여백과 대비만으로도 충분히 세련된 홈 화면을 만들 수 있다는 전제에서 출발한 카드입니다.",
    meta: "LOOK 01 / BLACK SETUP",
    tone: "obsidian",
  },
  {
    id: "pick-02",
    category: "NEW ARRIVAL",
    title: "밀도 높은 회색 톤으로 맞춘 하루의 균형",
    description:
      "과장 없는 볼륨과 구조적인 라인이 돋보이는 신상품 셀렉션입니다.",
    meta: "DROP 12 / GRAY SCALE",
    tone: "mist",
  },
  {
    id: "pick-03",
    category: "CURATION",
    title: "부드러운 표면감과 직선적인 레이아웃",
    description:
      "패션 에디토리얼에서 가져온 장면 전환을 카드 단위에 담았습니다.",
    meta: "NOTE / LIGHT TEXTURE",
    tone: "concrete",
  },
  {
    id: "pick-04",
    category: "ISSUE",
    title: "도시적인 레이어링을 위한 시즌 베이스",
    description:
      "강한 헤드라인과 절제된 본문, 작은 상호작용만으로 무드를 유지합니다.",
    meta: "CITY BASE / 2026",
    tone: "steel",
  },
];
