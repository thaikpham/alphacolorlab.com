export interface Preset {
  id: string;
  name: string;
  group: string;
  description_vi: string;
  description_en: string;
  wb: {
    mode: "awb" | "ctemp";
    kelvin: number;
    ab: number;
    gm: number;
    priority: string;
  };
  pp: Record<string, any>;
  /** Lý do codec từ chối công thức; có thì không tạo được file Memory Recall, chỉ cài tay. */
  blocked?: string;
}

import presetsJson from "./presets.json" with { type: "json" };

const presets: Preset[] = presetsJson as any;
export default presets;
