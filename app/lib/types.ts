export type BusinessType = {
  id?: string;
  title: string;
  price: string;
  type: "BUSINESS" | "INDIVIDUAL";
  benefit: string;
};

export type Wallet = {
  id: string;
  memberId: string;
  adminId: string;
  balance: number;
  accountNo: string;
  accountName: string;
  currency: string;
  bank: {
    id: string;
    name: string;
  };
  identification?: "NIN" | "BVN" | "RC" | "TIN";
  createdAt: string;
  updatedAt: string;
  status: boolean;
  verify: boolean;
  paystackCustomerCode: string;
  paystackCustomerId: string;
};

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

export type User = {
  uid?: string;
  fullname?: string;
  email?: string;
  phone?: string;
  password?: string;
  location?: string;
  avatar?: string;
  id?: string;
  gender?: string;
  status?: string;
  center?: string;
  batchNo?: string;
  paystackCustomerId?: string;
  paystackCustomerCode?: string;
  secureToken?: string;
  role?: "AGENT";
  createdAt?: string;
  updatedAt?: string;
};

export type Notification = {
  title: string;
  description: string;
  date: string;
  type:
    | "UPDATE"
    | "SUCCESS"
    | "FAILED"
    | "PENDING"
    | "REQUEST"
    | "REMINDER"
    | "WELCOME";
};

export type Payment = {
  reference: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  frequency: Frequency;
  date: string;
  amount: number;
  payment: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  due: Date | null;
  isVerified: boolean;
};

export type Member = {
  id?: string;
  uid?: string;
  fullname: string;
  businessName?: string;
  center: string;
  email: string;
  phone: string;
  type: "BUSINESS" | "INDIVIDUAL";
  category: "SMALL" | "MEDIUM" | "LARGE"
  billingFrequency?: Frequency;
  password?: string;
  location?: Record<string, any> | null;
  status?: boolean;
  avatar?: string;
  paystackCustomerId?: string;
  paystackCustomerCode?: string;
  secureToken?: string;
  pricing: string[];
  role?: "USER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
  agent?: string;
};

export type AuthContextValue = {
  currentUser: User | null;
  loading: boolean;
  register: (user: Omit<Member, "uid" | "role" | "createdAt">) => Promise<{
    message: string;
    ok: boolean;
  }>;
  login: (
    uid: string,
    password: string,
  ) => Promise<{
    ok: boolean;
    message?: string;
    error?: string;
    token?: string;
  }>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<User>,
    token?: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  forgot: (
    uid: string,
    password: string,
    confirm: string,
    old: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  notifications: () => Promise<Notification[]>;
  receipt: (reference: string) => Promise<Payment | any>;
  payments: () => Promise<Payment[]>;
  members: () => Promise<Member[]>;
  agentList: () => Promise<any[]>;
  getBusiness: () => Promise<BusinessType[]>;
  verifyPayment: (reference: string) => Promise<{
    fullname: string;
    memberName: string;
    businessName: string;
    userId: string;
    ok: boolean;
    payment?: any;
    message?: string;
  }>;
  wallet: Wallet | null;
  token?: string;
  createCode: (
    secureToken: string,
    confirmSecureToken: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  changeCode: (
    oldSecureToken: string,
    newSecureToken: string,
    confirmSecureToken: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  verifyCode: (
    secureToken: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
};

enum PricingType {
  INDIVIDUAL,
  BUSINESS,
}

export type Pricing = {
  status: boolean;
  id: string;
  title: string;
  price: string;
  type: PricingType;
  benefit: string | null;
  center: string | null;
  createdAt: string;
  updatedAt: string;
};

enum TransactionStatus {
  PENDING,
  SUCCESS,
  FAILED,
  REFUNDED,
  CANCELLED,
}

export type Transaction = {
  id: string;
  reference: string;
  event: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  channel: string | null;
  gatewayResponse: string | null;
  customerEmail: string | null;
  paymentReference: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  rawPayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  
  payment: Payment[];
} 