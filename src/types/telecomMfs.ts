export type TelecomOperator =
  | 'Grameenphone'
  | 'Robi'
  | 'Banglalink'
  | 'Teletalk'
  | 'Airtel'
  | 'Skitto'
  | 'Other';

export interface TelecomRecharge {
  id: string;
  ownerId: string;
  shopId: string;
  operator: TelecomOperator | string;
  customerPhone: string;
  amount: number;
  reference?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRechargeInput {
  operator: TelecomOperator | string;
  customerPhone: string;
  amount: number;
  reference?: string;
  note?: string;
}

export type MfsProvider = 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY' | 'OTHER';

export type MfsTransactionType = 'CASH_IN' | 'CASH_OUT' | 'SEND_MONEY' | 'RECEIVE_MONEY' | 'PAYMENT';

export interface MfsTransaction {
  id: string;
  ownerId: string;
  shopId: string;
  provider: MfsProvider;
  type: MfsTransactionType;
  amount: number;
  customerPhone: string;
  reference?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMfsTransactionInput {
  provider: MfsProvider;
  type: MfsTransactionType;
  amount: number;
  customerPhone: string;
  reference?: string;
  note?: string;
}
