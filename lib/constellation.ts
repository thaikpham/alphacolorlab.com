// Đồ thị "chòm sao" của 4 app: kiểu dữ liệu chung giữa phần dựng dữ liệu (lib/appGraphs.ts, chạy trên server)
// và phần vẽ (app/components/Constellation.tsx, chạy trên trình duyệt).

/** App sở hữu đồ thị; quyết định màu nút chính (token --color-app-*). */
export type AppId = "console" | "colors" | "wiki" | "blog";

export interface CNode {
  /** Duy nhất trong một đồ thị; dùng trong URL (?n=id). */
  id: string;
  /** Tên hiện trên đồ thị, ngắn. */
  label: string;
  /** Nhóm nội dung, để đọc cho trình đọc màn hình và lọc: "chapter", "step", "recipe", "camera"… */
  kind: string;
  /** Nút chính: to hơn, mang màu app, luôn hiện nhãn ở toàn cảnh. */
  hub?: boolean;
  /** Trang của nút. Không có thì nút chỉ để điều hướng trong đồ thị. */
  href?: string;
  /** App gốc của nút trong đồ thị tổng hợp (landing): quyết định màu nút chính. Đồ thị một app thì bỏ trống. */
  app?: AppId;
  /** Vị trí 3D đã tính sẵn (layout3d), đơn vị thế giới, tâm 0. */
  x: number;
  y: number;
  z: number;
}

/** Cạnh vô hướng giữa hai id. */
export type CEdge = [string, string];

export interface CGraph {
  /** "all": đồ thị tổng hợp ở landing, mỗi nút mang màu app của nó (CNode.app) */
  app: AppId | "all";
  nodes: CNode[];
  edges: CEdge[];
}
