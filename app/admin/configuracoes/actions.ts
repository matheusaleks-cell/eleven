"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTaxConfigs() {
  try {
    const configs = await prisma.taxConfig.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, configs };
  } catch (error) {
    console.error("Erro ao buscar configurações de impostos:", error);
    return { success: false, configs: [] };
  }
}

export async function createTaxConfig(data: any) {
  try {
    // Se for o primeiro "default", desmarca os outros
    if (data.isDefault) {
      await prisma.taxConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const config = await prisma.taxConfig.create({
      data: {
        name: data.name,
        description: data.description,
        ii: parseFloat(data.ii) || 0,
        ipi: parseFloat(data.ipi) || 0,
        pisPasep: parseFloat(data.pisPasep) || 0,
        cofins: parseFloat(data.cofins) || 0,
        icmsImport: parseFloat(data.icmsImport) || 0,
        icmsSale: parseFloat(data.icmsSale) || 0,
        simplesNacional: parseFloat(data.simplesNacional) || 0,
        siscomexFixed: parseFloat(data.siscomexFixed) || 0,
        isDefault: data.isDefault,
      }
    });
    
    revalidatePath("/admin/configuracoes/tributos");
    return { success: true, config };
  } catch (error) {
    console.error("Erro ao criar configuração:", error);
    return { success: false, error: "Falha ao gravar configuração tributária" };
  }
}

export async function updateTaxConfig(id: string, data: any) {
  try {
    if (data.isDefault) {
      await prisma.taxConfig.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false }
      });
    }

    const config = await prisma.taxConfig.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        ii: parseFloat(data.ii) || 0,
        ipi: parseFloat(data.ipi) || 0,
        pisPasep: parseFloat(data.pisPasep) || 0,
        cofins: parseFloat(data.cofins) || 0,
        icmsImport: parseFloat(data.icmsImport) || 0,
        icmsSale: parseFloat(data.icmsSale) || 0,
        simplesNacional: parseFloat(data.simplesNacional) || 0,
        siscomexFixed: parseFloat(data.siscomexFixed) || 0,
        isDefault: data.isDefault,
      }
    });

    revalidatePath("/admin/configuracoes/tributos");
    return { success: true, config };
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return { success: false, error: "Falha ao atualizar configuração tributária" };
  }
}
