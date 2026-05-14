"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  try {
    const projects = await prisma.investmentProject.findMany({
      include: {
        investor: true,
        cycles: true,
        importLots: true
      },
      orderBy: { createdAt: "desc" }
    });

    return projects.map(p => ({
      id: p.id,
      name: p.name,
      product_name: p.productName,
      investorName: p.investor.name,
      investor_id: p.investorId,
      currentCycle: p.cycles.length,
      max_cycles: p.maxCycles,
      currentCapital: p.initialCapital, // Simplificação inicial
      totalRevenue: p.cycles.reduce((acc, c) => acc + c.grossRevenue, 0),
      status: p.status,
      created_at: p.createdAt.toISOString()
    }));
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    return [];
  }
}

export async function createProject(data: any) {
  try {
    // 1. Atualizar os dados do investidor
    if (data.investorId) {
      await prisma.user.update({
        where: { id: data.investorId },
        data: {
          cpfCnpj: data.cpfCnpj,
          rg: data.rg,
          address: data.address,
          phone: data.phone,
          bankDetails: data.bankDetails,
          bankReferences: data.bankReferences,
          commercialRefs: data.commercialRefs,
          profession: data.profession,
        }
      }).catch(err => console.error("Erro ao atualizar dados do investidor:", err));
    }

    // 2. Criar o Projeto
    const project = await prisma.investmentProject.create({
      data: {
        name: data.name,
        productName: data.productName,
        investorId: data.investorId,
        initialCapital: parseFloat(data.initialCapital),
        maxCycles: parseInt(data.maxCycles),
        profitSplitPct: parseFloat(data.profitSplitPct) / 100,
        createdById: data.createdById,
        status: "ACTIVE",
        contractNumber: data.contractNumber,
        startDate: data.startDate ? new Date(data.startDate) : null,
        bankAccount: data.bankAccount,
        pixKey: data.pixKey,
        payoutRule: data.payoutRule,
        taxProfile: data.taxProfile,
        notes: data.notes
      }
    });

    revalidatePath("/admin/projetos");
    return { success: true, project };
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    return { success: false, error: "Falha ao criar projeto" };
  }
}


export async function getProjectById(id: string) {
  try {
    const project = await prisma.investmentProject.findUnique({
      where: { id },
      include: {
        investor: true,
        cycles: {
          orderBy: { cycleNumber: "asc" }
        },
        importLots: true
      }
    });

    if (!project) return null;

    return {
      ...project,
      product_name: project.productName,
      investorName: project.investor.name,
      currentCycle: project.cycles.length,
      totalRevenue: project.cycles.reduce((acc, c) => acc + c.grossRevenue, 0),
      totalInvestorShare: project.cycles.reduce((acc, c) => acc + c.investorShare, 0)
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do projeto:", error);
    return null;
  }
}

export async function createCycle(data: any) {
  try {
    const cycle = await prisma.cycle.create({
      data: {
        projectId: data.projectId,
        cycleNumber: data.cycleNumber,
        cycleName: data.cycleName,
        status: "COMPLETED",
        quantity: data.quantity,
        salePricePerUnit: data.salePricePerUnit,
        exchangeRateUsd: data.exchangeRateUsd,
        fobValueUsd: data.fobValueUsd,
        freightUsd: data.freightUsd,
        insuranceUsd: data.insuranceUsd,
        customsValueBrl: data.customsValueBrl,
        iiTax: data.iiTax,
        ipiTax: data.ipiTax,
        afrmmTax: data.afrmmTax,
        capatazia: data.capatazia,
        pisPasepTax: data.pisPasepTax,
        cofinsTax: data.cofinsTax,
        siscomexFee: data.siscomexFee,
        icmsSt: data.icmsSt,
        simplesTax: data.simplesTax,
        operationalCost: data.operationalCost,
        calcBaseNormal: data.calcBaseNormal,
        icmsBaseAltered: data.icmsBaseAltered,
        icmsImportTax: data.icmsImportTax,
        totalInvestment: data.totalInvestment,
        grossRevenue: data.grossRevenue,
        salesTax: data.salesTax,
        salesOperationalCost: data.salesOperationalCost,
        netRevenue: data.netRevenue,
        grossProfit: data.grossProfit,
        investorShare: data.investorShare,
        companyShare: data.companyShare,
        reserveShare: data.reserveShare,
        reinvestmentShare: data.reinvestmentShare
      }
    });

    revalidatePath(`/admin/projetos/${data.projectId}`);
    return { success: true, cycle };
  } catch (error) {
    console.error("Erro ao criar ciclo:", error);
    return { success: false, error: "Falha ao registrar ciclo" };
  }
}

export async function deleteProject(id: string) {
  try {
    await prisma.investmentProject.delete({
      where: { id }
    });
    revalidatePath("/admin/projetos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    return { success: false, error: "Este projeto possui ciclos ou lotes atrelados e não pode ser excluído." };
  }
}
