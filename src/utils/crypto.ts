import crypto from "crypto";

const algorithm = "aes-256-cbc";

const key = Buffer.from(process.env.ENCRYPTION_KEY || "", "base64");
const iv = Buffer.from(process.env.ENCRYPTION_IV || "", "base64");

export const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

export const decrypt = (encryptedText: string) => {
  const [ivHex, encrypted] = encryptedText.split(":");
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(ivHex, "hex")
  );
  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
};
