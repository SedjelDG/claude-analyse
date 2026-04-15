export interface RegisterShift {
  id: string;
  registerId: string;
  openedByUserId: string;
  openedByUserName: string;
  openedAt: string;
  status: "open" | "closed";
  openingFloat: number;
  closingBalance?: number;
  notes?: string;
}
