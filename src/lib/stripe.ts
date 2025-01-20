export const STRIPE_PLANS = [
  {
    link: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_LINK,
    priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    price: 4.99,
    duration: "/month",
  },
  {
    link: process.env.NEXT_PUBLIC_STRIPE_YEARLY_LINK,
    priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID,
    price: 49.99,
    duration: "/year",
  },
];
