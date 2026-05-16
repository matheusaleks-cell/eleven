"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLeads() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        logs: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(`[getLeads] Encontrados ${leads.length} leads.`);
    return leads;
  } catch (error) {
    console.error("Erro crítico ao buscar leads:", error);
    return [];
  }
}


export async function createLead(data: any) {
  try {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status || "NOVO",
        priority: data.priority || "medium",
        value: Number(data.value) || 0,
        source: data.source || "Direto",
        notes: data.notes,
        interests: Array.isArray(data.interests) ? data.interests.join(",") : data.interests || data.interest || "",
        taxId: data.taxId,
        state: data.state,
        city: data.city,
        customerType: data.customerType,
        documentStatus: data.documentStatus,
        category: data.category,
        crNumber: data.crNumber,
        crValidity: data.crValidity,
        logs: {
          create: {
            action: "Lead cadastrado via formulário de prospecção",
            user: data.assignedTo || "Admin Eleven"
          }
        }
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

export async function archiveLead(id: string, isArchived: boolean = true) {
  try {
    await prisma.lead.update({
      where: { id },
      data: { isArchived },
    });
    revalidatePath("/admin/crm/funil");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao arquivar lead:", error);
    return { success: false, error: error.message || "Falha ao arquivar lead" };
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
        city: data.city ?? undefined,
        state: data.state ?? "",
      },
      create: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpfCnpj: data.taxId || `TEMP-${leadId}`,
        city: data.city ?? undefined,
        state: data.state ?? "",
        type: "B2B",
      }
    });

    // 2. Criar o Pedido de Venda (SalesOrder)
    let sellerId = data.assignedSellerId;
    if (!sellerId || sellerId === "system-admin") {
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
      sellerId = admin?.id;
    }
    if (!sellerId) throw new Error("Nenhum usuário administrador encontrado.");

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        customerId: customer.id,
        sellerId,
        totalValue: Number(data.value) || 0,
        status: "PAGO", 
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
    revalidatePath("/admin"); 
    
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("Erro ao converter lead:", error);
    return { success: false, error: error.message };
  }
}

export async function convertToCustomer(leadId: string) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) throw new Error("Lead não encontrado");

    const customer = await prisma.customer.upsert({
      where: { cpfCnpj: lead.taxId || `TEMP-${leadId}` },
      update: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city ?? undefined,
        state: lead.state ?? "",
        source: lead.source ?? undefined,
      },
      create: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        cpfCnpj: lead.taxId || `TEMP-${leadId}`,
        city: lead.city ?? undefined,
        state: lead.state ?? "",
        type: lead.customerType === "PJ" ? "B2B" : "B2C",
        source: lead.source ?? undefined,
        notes: lead.notes ?? undefined,
        status: "ACTIVE"
      }
    });

    await prisma.lead.delete({
      where: { id: leadId }
    });

    revalidatePath("/admin/crm/funil");
    revalidatePath("/admin/crm/clientes");
    
    return { success: true, customerId: customer.id };
  } catch (error: any) {
    console.error("Erro ao converter para cliente:", error);
    return { success: false, error: error.message };
  }
}

export async function addLeadLog(leadId: string, action: string, user: string = "Admin Eleven") {
  try {
    await prisma.leadLog.create({
      data: {
        leadId,
        action,
        user
      }
    });
    revalidatePath("/admin/crm/funil");
    return { success: true };
  } catch (error) {
    console.error("Error adding lead log:", error);
    return { success: false };
  }
}
