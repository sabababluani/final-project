export interface ILineItem {
  name: string;
  amount: number;
  currency: string;
  image?: string;
  quantity: number;
  vinylId: number;
}

export interface CheckoutSessionInterface {
  items: ILineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}
