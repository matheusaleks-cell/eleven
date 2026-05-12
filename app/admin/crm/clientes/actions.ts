"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        salesOrders: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return customers.map(c => {
      const totalSpent = c.salesOrders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
      const lastOrderDate = c.salesOrders.length > 0 
        ? c.salesOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : null;

      // Cálculo de Badge de Engajamento
      let badge = "STANDARD";
      if (totalSpent > 100000) badge = "VIP";
      else if (totalSpent > 30000) badge = "PLATINUM";

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        document: c.cpfCnpj,
        email: c.email,
        phone: c.phone,
        state: c.state,
        city: c.city,
        address: c.address,
        totalSpent,
        lastOrder: lastOrderDate ? lastOrderDate.toLocaleDateString('pt-BR') : "-",
        ordersCount: c.salesOrders.length,
        badge,
        salesOrders: c.salesOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalValue: o.totalValue,
          status: o.status,
          createdAt: o.createdAt.toISOString()
        }))
      };
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
}

export async function getCustomerStats() {
  try {
    const customers = await prisma.customer.count();
    const orders = await prisma.salesOrder.findMany();
    
    const totalSales = orders.reduce((acc, o) => acc + (o.totalValue || 0), 0);
    
    // Simulação simples de retenção baseada em clientes com mais de 1 pedido
    const repeatCustomers = await prisma.customer.count({
      where: {
        salesOrders: {
          some: {}
        }
      }
    });
    const retentionRate = customers > 0 ? (repeatCustomers / customers) * 100 : 0;

    return {
      totalCustomers: customers,
      totalSales,
      retentionRate,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de clientes:", error);
    return { totalCustomers: 0, totalSales: 0, retentionRate: 0 };
  }
}

export async function createCustomer(data: any) {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        type: data.type,
        cpfCnpj: data.document,
        email: data.email,
        phone: data.phone,
        state: data.state,
        city: data.city,
        address: data.address,
        crNumber: data.crNumber,
        category: data.category,
        rg: data.rg,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        source: data.source,
        notes: data.notes,
        fantasyName: data.fantasyName,
        stateRegistration: data.stateRegistration,
        responsibleName: data.responsibleName,
      }
    });
    revalidatePath("/admin/crm/clientes");
    return { success: true, customer };
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return { success: false, error: "Documento (CPF/CNPJ) já cadastrado ou erro interno." };
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        cpfCnpj: data.document,
        email: data.email,
        phone: data.phone,
        state: data.state,
        city: data.city,
        address: data.address,
        crNumber: data.crNumber,
        category: data.category,
        rg: data.rg,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        source: data.source,
        notes: data.notes,
        fantasyName: data.fantasyName,
        stateRegistration: data.stateRegistration,
        responsibleName: data.responsibleName,
      }
    });
    revalidatePath("/admin/crm/clientes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return { success: false, error: "Erro ao atualizar os dados do cliente." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id }
    });
    revalidatePath("/admin/crm/clientes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return { success: false, error: "Este cliente possui pedidos vinculados e não pode ser excluído." };
  }
}
