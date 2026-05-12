"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLeads() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Converter interesses de string para array se necessário para o frontend
    return leads.map(l => ({
      ...l,
      interests: l.interests ? l.interests.split(",") : []
    }));
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return [];
  }
}

export async function createLead(data: any) {
  try {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || "(00) 00000-0000",
        company: data.company,
        status: data.status || "NOVO",
        priority: data.priority || "medium",
        value: Number(data.value) || 0,
        source: data.source || "Direto",
        notes: data.notes,
        interests: Array.isArray(data.interests) ? data.interests.join(",") : data.interests || data.interest || "",
      },
    });
    revalidatePath("/admin/crm/funil");
    return lead;
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    throw new Error("Falha ao criar lead");
  }
}

export async function updateLead(id: string, data: any) {
  try {
    // Se vier interests como array, converter para string
    const updateData = { ...data };
    if (Array.isArray(updateData.interests)) {
      updateData.interests = updateData.interests.join(",");
    }
    if (updateData.value !== undefined) {
      updateData.value = Number(updateData.value);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/admin/crm/funil");
    return lead;
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    throw new Error("Falha ao atualizar lead");
  }
}

export async function deleteLead(id: string) {
  try {
    await prisma.lead.delete({
      where: { id },
    });
    revalidatePath("/admin/crm/funil");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    return { success: false, error: "Falha ao excluir lead" };
  }
}

export async function convertToOrder(leadId: string, data: any) {
  try {
    // 1. Criar ou encontrar o cliente (Customer)
    const customer = await prisma.customer.upsert({
      where: { cpfCnpj: data.taxId || `TEMP-${leadId}` },
      update: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
      },
      create: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpfCnpj: data.taxId || `TEMP-${leadId}`,
        city: data.city,
        state: data.state,
        type: data.customerType || "B2C",
      }
    });

    // 2. Criar o Pedido de Venda (SalesOrder)
    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        customerId: customer.id,
        sellerId: data.assignedSellerId || "system-admin", // Idealmente pegar da sessão
        totalValue: Number(data.value) || 0,
        status: "PAGO", // Conversão direta para pago para teste
        products: JSON.stringify(data.items || []),
        notes: `Convertido de Lead: ${leadId}. Notas: ${data.notes || ""}`,
        proposedDate: new Date(),
      }
    });

    // 3. Deletar o Lead (já que virou cliente/pedido)
    await prisma.lead.delete({
      where: { id: leadId }
    });

    revalidatePath("/admin/crm/funil");
    revalidatePath("/admin"); // Revalidar dashboard principal também
    
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Erro ao converter lead:", error);
    return { success: false, error: "Falha na conversão" };
  }
}
