const isDevenv = process.env.NODE_ENV === "development";

export const STRIPE_PLANS = [
  {
    link: isDevenv ? "https://buy.stripe.com/test_fZecQhgR5aku50s8ww" : "",
    priceId: isDevenv ? "price_1Qhq2hJCYgF8OA27bpFj7VsN" : "",
    price: 4.99,
    duration: "/month",
  },
  {
    link: isDevenv ? "https://buy.stripe.com/test_14k17z30fdwG78A6oq" : "",
    priceId: isDevenv ? "price_1QhqAQJCYgF8OA27NvesMcwz" : "",
    price: 49.99,
    duration: "/year",
  },
];
