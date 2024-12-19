"use server";

import { headers } from "next/headers";

export async function getCurrentRoute() {
  const headersList = headers();
  const pathname = headersList.get("x-current-path") || "";
  return { pathname };
}
