"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        salesOrders: true,
        documents: true,
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
        cep: c.cep,
        addressNumber: c.addressNumber,
        addressComplement: c.addressComplement,
        neighborhood: c.neighborhood,
        storeEmail: c.storeEmail,
        crValidityDate: c.crValidityDate ? c.crValidityDate.toISOString() : null,
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
        })),
        documents: c.documents.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category,
          type: d.type,
          size: d.size,
          createdAt: d.createdAt.toISOString()
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
    console.log("[createCustomer] Iniciando criação com dados:", JSON.stringify(data, null, 2));

    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      } catch (e) {
        return null;
      }
    };

    // Validação básica de campos obrigatórios antes de tentar o Prisma
    if (!data.name || !data.document || !data.phone || !data.state) {
      return { success: false, error: "Campos obrigatórios ausentes (Nome, Documento, Telefone ou UF)." };
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        type: data.type || "B2C",
        cpfCnpj: data.document,
        email: data.email || null,
        phone: data.phone,
        state: data.state,
        city: data.city || null,
        address: data.address || null,
        crNumber: data.crNumber || null,
        category: data.category || "GERAL",
        rg: data.rg || null,
        birthDate: parseDate(data.birthDate),
        source: data.source || "DASHBOARD",
        notes: data.notes || null,
        fantasyName: data.fantasyName || null,
        stateRegistration: data.stateRegistration || null,
        responsibleName: data.responsibleName || null,
        storeEmail: data.storeEmail || null,
        cep: data.cep || null,
        addressNumber: data.addressNumber || null,
        addressComplement: data.addressComplement || null,
        neighborhood: data.neighborhood || null,
        crValidityDate: parseDate(data.crValidityDate),
      }
    });

    console.log("[createCustomer] Cliente criado com sucesso:", customer.id);
    revalidatePath("/admin/crm/clientes");
    return { success: true, customer };
  } catch (error: any) {
    console.error("[createCustomer] ERRO FATAL:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: "Este CPF/CNPJ já está cadastrado no sistema." };
      }
      return { success: false, error: `Erro de Banco de Dados: ${error.message}` };
    }
    
    return { success: false, error: error.message || "Erro desconhecido ao salvar o cliente." };
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
        storeEmail: data.storeEmail,
        cep: data.cep,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        neighborhood: data.neighborhood,
        crValidityDate: data.crValidityDate ? new Date(data.crValidityDate) : null,
      }
    });
    revalidatePath("/admin/crm/clientes");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: "O CPF/CNPJ informado já pertence a outro cliente." };
      }
      if (error.code === 'P2011') {
        return { success: false, error: "Existem campos obrigatórios em branco." };
      }
    }
    
    return { success: false, error: "Erro ao atualizar os dados do cliente no banco de dados." };
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

export async function uploadCustomerDocument(customerId: string, data: any) {
  try {
    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        size: data.size,
        base64Data: data.base64Data,
        customerId: customerId,
      }
    });

    revalidatePath("/admin/crm/clientes");
    return { success: true, document };
  } catch (error) {
    console.error("Erro ao fazer upload de documento:", error);
    return { success: false, error: "Falha ao salvar documento." };
  }
}

export async function getDocumentContent(documentId: string) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { base64Data: true, name: true }
    });
    return document;
  } catch (error) {
    console.error("Erro ao buscar conteúdo do documento:", error);
    return null;
  }
}
