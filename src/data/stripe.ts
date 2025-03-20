import STRIPE from "stripe";

/**
 * Stripe Singleton
 */
class StripeSingleton {
  private static instance: STRIPE;
  public static getInstance(): STRIPE {
    if (!StripeSingleton.instance) {
      StripeSingleton.instance = new STRIPE(
        process.env.STRIPE_SECRET_KEY || ""
      );
    }
    return this.instance;
  }
}
export const stripe = StripeSingleton.getInstance();

/**
 * Create a new Stripe Financial Connection Session
 * @param {String} customerId - Stripe Customer ID
 * @return {Promise<Stripe.SetupIntent>}
 */
export async function createFinancialConnectionSession(
  customerId: string
): Promise<STRIPE.FinancialConnections.Session> {
  return await stripe.financialConnections.sessions.create({
    account_holder: {
      type: "customer",
      customer: customerId,
    },
    prefetch: ["balances", "transactions"],
    permissions: ["balances", "transactions"],
  });
}
