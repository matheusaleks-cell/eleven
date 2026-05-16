import { prisma } from "./lib/prisma.js";

async function test() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        salesOrders: true,
        documents: true,
      },
    });
    console.log("Total customers found:", customers.length);
    console.log("First customer:", JSON.stringify(customers[0], null, 2));
  } catch (error) {
    console.error("Error in query:", error);
  }
}

test();
