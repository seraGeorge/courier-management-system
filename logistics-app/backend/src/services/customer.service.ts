import { CustomerStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  generateApiKey,
  generateSecretKey,
} from "@/utils/customer-credentials";
import { getNextRetryTime } from "@/utils/retry";

interface CreateCustomerRequest {
  name: string;
  email: string;
  webhookUrl: string;
}

export const createCustomer = async (data: CreateCustomerRequest) => {
  const existing = await prisma.customer.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existing) {
    throw new Error("CUSTOMER_ALREADY_EXISTS");
  }
  return prisma.customer.create({
    data: {
      ...data,
      apiKey: generateApiKey(),
      secretKey: generateSecretKey(),
    },
  });
};

export const getCustomerByApiKey = async (apiKey: string) => {
  const customer = await prisma.customer.findUnique({
    where: { apiKey },
  });

  if (!customer) throw new Error("INVALID_API_KEY");

  return customer;
};

export const getActiveCustomers = async () => {
  return prisma.customer.findMany({
    where: {
      status: CustomerStatus.ACTIVE,
      OR: [
        {
          // ✅ Customers that have never failed (nextRetryAt = null)
          nextRetryAt: null,
        },
        {
          // ✅ Customers whose retry time has arrived
          nextRetryAt: {
            lte: new Date(),
          },
        },
      ],
    },
  });
};

export const incrementFailureCount = async (customerId: string) => {
  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  });

  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }
  const nextRetryCount = customer.retryCount + 1;

  return prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      failureCount: {
        increment: 1,
      },
      retryCount: nextRetryCount,
      nextRetryAt: getNextRetryTime(nextRetryCount),
      lastFailureAt: new Date(),
    },
  });
};

export const resetFailureCount = async (customerId: string) => {
  return prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      failureCount: 0,
      lastSuccessAt: new Date(),
    },
  });
};

export const disableCustomer = async (customerId: string) => {
  return prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      status: CustomerStatus.DISABLED,
    },
  });
};
