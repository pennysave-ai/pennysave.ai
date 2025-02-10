import { Client as QStashClient } from "@upstash/qstash";

class QStashSingleton {
  private static instance: QStashClient;
  public static getInstance(): QStashClient {
    if (!QStashSingleton.instance) {
      QStashSingleton.instance = new QStashClient({
        baseUrl: process.env.QSTASH_URL!,
        token: process.env.QSTASH_TOKEN!,
      });
    }
    return QStashSingleton.instance;
  }
}
const qstash = QStashSingleton.getInstance();
export { qstash };
