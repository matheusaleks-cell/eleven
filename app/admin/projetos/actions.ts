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

    return projects.map(p => {
      const totalInvestorShare = p.cycles
        .filter(c => c.status === "COMPLETED")
        .reduce((acc, c) => acc + (c.investorShare || 0), 0);
      return {
        id: p.id,
        name: p.name,
        product_name: p.productName,
        investorName: p.investor?.name ?? "Investidor",
        investor_id: p.investorId,
        currentCycle: p.cycles.length,
        max_cycles: p.maxCycles,
        currentCapital: (p.initialCapital || 0) + totalInvestorShare,
        totalRevenue: p.cycles.reduce((acc, c) => acc + (c.grossRevenue || 0), 0),
        status: p.status,
        created_at: p.createdAt.toISOString()
      };
    });
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

    // 3. Processar produto e lote de importação automaticamente
    try {
      const qty = parseInt(data.quantity) || 1;
      const costPriceBrl = parseFloat(String(data.costPrice || "0").replace(/\D/g, "")) / 100 || 0;
      const salePriceBrl = parseFloat(String(data.salePrice || "0").replace(/\D/g, "")) / 100 || 0;
      const exchangeRate = 5.25;

      let product = null;
      if (data.product) {
        product = await prisma.product.findFirst({
          where: {
            OR: [
              { sku: data.product.toUpperCase() },
              { commercialName: { equals: data.product } }
            ]
          }
        });

        if (!product) {
          const brand = data.manufacturer || "Desconhecido";
          const cleanedProduct = data.product.toUpperCase().replace(/[^A-Z0-9]/g, "-");
          const sku = `SKU-${cleanedProduct}-${Math.floor(100 + Math.random() * 900)}`;

          product = await prisma.product.create({
            data: {
              sku,
              commercialName: data.product,
              brand,
              model: data.product,
              caliber: "9mm",
              species: "Pistola",
              actionType: "Semiautomática",
              capacity: 15,
              barrelLength: 4.0,
              finish: "Preto",
              originCountry: "Turquia",
              ncm: "9303.20.00",
              priceB2C: salePriceBrl || costPriceBrl * 1.5,
              priceB2B: costPriceBrl,
              stockAvailable: qty,
              status: "ACTIVE"
            }
          });
        }
      }

      let supplier = await prisma.supplier.findFirst({
        where: { status: "ACTIVE" }
      });

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            name: data.manufacturer || "Fornecedor Turquia",
            country: "Turquia",
            status: "ACTIVE"
          }
        });
      }

      const unitFobUsd = costPriceBrl / exchangeRate;
      const fobTotal = unitFobUsd * qty;
      const batchCode = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await prisma.importLot.create({
        data: {
          batchCode,
          supplierId: supplier.id,
          countryOrigin: "Turquia",
          purchaseDate: new Date(),
          currency: "USD",
          exchangeRate: exchangeRate,
          fobValue: fobTotal,
          freight: 0,
          insurance: 0,
          customsTaxes: fobTotal * exchangeRate * 0.48,
          customsFees: 7884,
          totalCostNationalized: costPriceBrl * qty,
          quantityItems: qty,
          status: "PEDIDO_FEITO",
          expectedMarginPct: 0.35,
          investmentProjectId: project.id,
          products: product ? {
            connect: [{ id: product.id }]
          } : undefined
        }
      });
    } catch (err) {
      console.error("Erro ao gerar lote de importação automático para o projeto:", err);
    }

    revalidatePath("/admin/projetos");
    revalidatePath("/admin/importacao/lotes");
    if (data.investorId) {
      revalidatePath(`/admin/investidores/${data.investorId}`);
    }
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
        importLots: {
          include: {
            documents: true,
            products: true,
            weapons: {
              select: {
                id: true,
                currentStatus: true,
                saleValue: true,
                unitCost: true
              }
            }
          }
        }
      }
    });

    if (!project) return null;

    return {
      ...project,
      product_name: project.productName,
      max_cycles: project.maxCycles,
      investorName: project.investor?.name ?? "Investidor",
      currentCycle: project.cycles.length,
      totalRevenue: project.cycles.reduce((acc, c) => acc + Number(c.grossRevenue || 0), 0),
      totalInvestorShare: project.cycles.reduce((acc, c) => acc + Number(c.investorShare || 0), 0),
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
        importLotId: data.importLotId || null,
        quantity: data.quantity,
        salePricePerUnit: data.salePricePerUnit,
        exchangeRateUsd: data.exchangeRateUsd,
        fobValueUsd: data.fobValueUsd,
        freightUsd: data.freightUsd,
        insuranceUsd: data.insuranceUsd,
        customsValueBrl: data.customsValueBrl || data.customsValueBRL,
        iiTax: data.iiTax || data.ii,
        ipiTax: data.ipiTax || data.ipi,
        afrmmTax: data.afrmmTax || 0,
        capatazia: data.capatazia || 0,
        pisPasepTax: data.pisPasepTax || data.pisPasep,
        cofinsTax: data.cofinsTax || data.cofins,
        siscomexFee: data.siscomexFee || data.siscomex,
        icmsSt: data.icmsSt || 0,
        simplesTax: data.simplesTax || data.salesTax,
        operationalCost: data.operationalCost || data.opCost,
        calcBaseNormal: data.calcBaseNormal,
        icmsBaseAltered: data.icmsBaseAltered,
        icmsImportTax: data.icmsImportTax || data.icmsImport,
        totalInvestment: data.totalInvestment,
        grossRevenue: data.grossRevenue,
        salesTax: data.salesTax,
        salesOperationalCost: data.salesOperationalCost || data.salesOpCost,
        netRevenue: data.netRevenue || data.netBalance,
        grossProfit: data.grossProfit || data.profitToSplit,
        investorShare: data.investorShare,
        companyShare: data.companyShare,
        reserveShare: data.reserveShare || 0,
        reinvestmentShare: data.reinvestmentShare || data.nextCycleCapital
      }
    });

    if (data.importLotId) {
      await prisma.importLot.update({
        where: { id: data.importLotId },
        data: { status: "LIQUIDADO" }
      });
    }

    revalidatePath(`/admin/projetos/${data.projectId}`);
    return { success: true, cycle };
  } catch (error) {
    console.error("Erro ao criar ciclo:", error);
    return { success: false, error: "Falha ao registrar ciclo" };
  }
}

export async function deleteProject(id: string) {
  try {
    // Delete cycles and documents linked to this project
    await prisma.cycle.deleteMany({ where: { projectId: id } });
    await prisma.document.deleteMany({ where: { projectId: id } });
    // Disconnect import lots (keep lots/weapons intact, just remove project reference)
    await prisma.importLot.updateMany({
      where: { investmentProjectId: id },
      data: { investmentProjectId: null },
    });
    await prisma.investmentProject.delete({ where: { id } });
    revalidatePath("/admin/projetos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    return { success: false, error: "Falha ao excluir projeto." };
  }
}
