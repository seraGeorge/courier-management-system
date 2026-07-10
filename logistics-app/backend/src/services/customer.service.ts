import { CustomerStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  generateApiKey,
  generateSecretKey,
} from "@/utils/customer-credentials";

interface CreateCustomerRequest {
  name: string;
  email: string;
  webhookUrl: string;
}

export const createCustomer = async (data: CreateCustomerRequest) => {
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
    },
  });
};

export const incrementFailureCount = async (customerId: string) => {
  return prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      failureCount: {
        increment: 1,
      },
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

