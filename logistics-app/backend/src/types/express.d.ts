import type { Customer } from "@/generated/prisma";

declare global {
  namespace Express {
    interface Request {
      customer: Customer;
    }
  }
}

export {};
