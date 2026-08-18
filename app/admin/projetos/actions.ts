"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth-guard";
import { calcImportBreakdown, SimulatorInputs } from "@/lib/calculations";
import { getActiveFinancialRates, ratesFromCycleOrDefault, computeUnitFinancials } from "@/lib/financial-calc";

export async function getProjects() {
  const session = await requireSession("ADMIN");
  if (!session) return [];

  try {
    const projects = await prisma.investmentProject.findMany({
      include: {
        investor: true,
        cycles: true,
        importLots: {
          include: {
            weapons: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const financialDefaults = await getActiveFinancialRates();

    return projects.map(p => {
      let realizedRevenue = 0;
      let realizedInvestorProfit = 0;
      const splitPct = p.profitSplitPct || 0.50;

      p.importLots?.forEach((lot: any) => {
        const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
        const lotCycle = p.cycles?.find((c: any) => c.importLotId === lot.id);
        const rates = ratesFromCycleOrDefault(lotCycle, financialDefaults);

        lot.weapons?.forEach((w: any) => {
          if (w.currentStatus === "VENDIDA") {
            const uCost = w.unitCost || uCostAvg;
            const sValue = w.saleValue || 0;
            realizedRevenue += sValue;
            const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
            realizedInvestorProfit += fin.investorShare;
          }
        });
      });

      return {
        id: p.id,
        name: p.name,
        product_name: p.productName,
        investorName: p.investor?.name ?? "Investidor",
        investor_id: p.investorId,
        currentCycle: p.cycles.length,
        max_cycles: p.maxCycles,
        currentCapital: (p.initialCapital || 0) + realizedInvestorProfit,
        totalRevenue: realizedRevenue,
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
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

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


// Cria o projeto + produto + lote de importação direto a partir dos números já
// calculados no Simulador (câmbio real, impostos reais por alíquota) — em vez do
// wizard manual, que faz o admin "adivinhar" um custo unitário sem essa base.
// Recalcula o breakdown aqui (mesma calcImportBreakdown que a tela do Simulador usa)
// em vez de confiar em totais vindos do client.
export async function createProjectFromSimulation(data: {
  investorId: string;
  createdById: string;
  projectName: string;
  productName: string;
  manufacturer?: string;
  payoutRule: "REINVEST" | "WITHDRAW";
  taxProfile: "PF" | "PJ";
  simulatorInputs: SimulatorInputs;
}) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

  try {
    const inp = data.simulatorInputs;
    const qty = inp.initialQuantity;
    const breakdown = calcImportBreakdown(qty, inp);

    const grossRevenue = inp.salePricePerUnit * qty;
    const expectedMarginPct = grossRevenue > 0 ? (grossRevenue - breakdown.total) / grossRevenue : 0;

    // 1. Projeto
    const project = await prisma.investmentProject.create({
      data: {
        name: data.projectName,
        productName: data.productName,
        investorId: data.investorId,
        initialCapital: breakdown.total,
        maxCycles: inp.numBatches,
        profitSplitPct: inp.investorSplitPct,
        createdById: data.createdById,
        status: "ACTIVE",
        payoutRule: data.payoutRule,
        taxProfile: data.taxProfile,
        notes: "Projeto gerado a partir do Simulador de Investimento.",
      },
    });

    // 2. Produto (mesmo padrão de busca/criação de createProject)
    let product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.productName.toUpperCase() },
          { commercialName: { equals: data.productName } },
        ],
      },
    });

    if (!product) {
      const brand = data.manufacturer || "Desconhecido";
      const cleanedProduct = data.productName.toUpperCase().replace(/[^A-Z0-9]/g, "-");
      const sku = `SKU-${cleanedProduct}-${Math.floor(100 + Math.random() * 900)}`;

      product = await prisma.product.create({
        data: {
          sku,
          commercialName: data.productName,
          brand,
          model: data.productName,
          caliber: "9mm",
          species: "Pistola",
          actionType: "Semiautomática",
          capacity: 15,
          barrelLength: 4.0,
          finish: "Preto",
          originCountry: "Turquia",
          ncm: "9303.20.00",
          priceB2C: inp.salePricePerUnit,
          priceB2B: breakdown.total / qty,
          stockAvailable: qty,
          status: "ACTIVE",
        },
      });
    }

    // 3. Fornecedor (mesmo padrão de createProject)
    let supplier = await prisma.supplier.findFirst({ where: { status: "ACTIVE" } });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { name: data.manufacturer || "Fornecedor Turquia", country: "Turquia", status: "ACTIVE" },
      });
    }

    // 4. Lote de Importação com os valores reais simulados
    const batchCode = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await prisma.importLot.create({
      data: {
        batchCode,
        supplierId: supplier.id,
        countryOrigin: "Turquia",
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate: inp.exchangeRate,
        fobValue: inp.fobUnitUSD * qty,
        freight: inp.freightUnitUSD * qty,
        insurance: 0,
        customsTaxes: breakdown.ii + breakdown.ipi + breakdown.pis + breakdown.cofins + breakdown.icms,
        customsFees: breakdown.siscomex + breakdown.custoOp,
        totalCostNationalized: breakdown.total,
        quantityItems: qty,
        status: "PEDIDO_FEITO",
        expectedMarginPct,
        investmentProjectId: project.id,
        products: { connect: [{ id: product.id }] },
      },
    });

    revalidatePath("/admin/projetos");
    revalidatePath("/admin/importacao/lotes");
    revalidatePath(`/admin/investidores/${data.investorId}`);
    return { success: true, project };
  } catch (error) {
    console.error("Erro ao gerar projeto a partir do simulador:", error);
    return { success: false, error: "Falha ao gerar projeto a partir da simulação." };
  }
}

export async function getProjectById(id: string) {
  const session = await requireSession("ADMIN");
  if (!session) return null;

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

    const financialDefaults = await getActiveFinancialRates();
    let totalRealizedRevenue = 0;
    let totalRealizedInvestorShare = 0;
    const splitPct = project.profitSplitPct || 0.50;

    project.importLots?.forEach((lot: any) => {
      const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
      const lotCycle = project.cycles?.find((c: any) => c.importLotId === lot.id);
      const rates = ratesFromCycleOrDefault(lotCycle, financialDefaults);

      lot.weapons?.forEach((w: any) => {
        if (w.currentStatus === "VENDIDA") {
          const uCost = w.unitCost || uCostAvg;
          const sValue = w.saleValue || 0;
          totalRealizedRevenue += sValue;
          const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
          totalRealizedInvestorShare += fin.investorShare;
        }
      });
    });

    return {
      ...project,
      product_name: project.productName,
      max_cycles: project.maxCycles,
      investorName: project.investor?.name ?? "Investidor",
      currentCycle: project.cycles.length,
      totalRevenue: totalRealizedRevenue,
      totalInvestorShare: totalRealizedInvestorShare,
      currentCapital: (project.initialCapital || 0) + totalRealizedInvestorShare,
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do projeto:", error);
    return null;
  }
}

export async function createCycle(data: any) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

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

    // Abre automaticamente o próximo lote usando o capital de reinvestimento apurado —
    // antes esse processo era manual e desconectado em 2 passos (fechar o ciclo aqui,
    // depois ir em Importação criar um lote novo e vincular ao projeto à parte). Só
    // reinveste se o projeto for de fato configurado pra reinvestir (payoutRule),
    // ainda não atingiu o máximo de ciclos e sobrou capital de fato.
    const reinvestmentShare = data.reinvestmentShare || data.nextCycleCapital || 0;
    await tryAutoOpenNextLot(data.projectId, data.importLotId, reinvestmentShare);

    revalidatePath(`/admin/projetos/${data.projectId}`);
    return { success: true, cycle };
  } catch (error) {
    console.error("Erro ao criar ciclo:", error);
    return { success: false, error: "Falha ao registrar ciclo" };
  }
}

// Best-effort: nunca derruba o fechamento do ciclo em si por causa de uma falha aqui.
async function tryAutoOpenNextLot(projectId: string, closedLotId: string | null | undefined, reinvestmentShare: number) {
  if (!closedLotId || reinvestmentShare <= 0) return;

  try {
    const project = await prisma.investmentProject.findUnique({
      where: { id: projectId },
      include: { cycles: true },
    });
    if (!project) return;
    if (project.payoutRule && project.payoutRule !== "REINVEST") return; // investidor optou por saque, não reinveste
    if (project.cycles.length >= project.maxCycles) return; // já atingiu o máximo de ciclos do projeto

    const closedLot = await prisma.importLot.findUnique({
      where: { id: closedLotId },
      include: { products: { select: { id: true } } },
    });
    if (!closedLot) return;

    // Estimativa de FOB a partir do capital de reinvestimento (48% de carga tributária/
    // custos de nacionalização, mesma referência usada no resumo "EST." da tela de novo
    // lote) — é só o ponto de partida; o admin ajusta com os valores reais ao negociar
    // a compra efetiva deste novo lote, do mesmo jeito que já faz pra qualquer lote novo.
    const estimatedFobUsd = (reinvestmentShare / 1.48) / (closedLot.exchangeRate || 5.25);

    await prisma.importLot.create({
      data: {
        batchCode: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: closedLot.supplierId,
        countryOrigin: closedLot.countryOrigin,
        purchaseDate: new Date(),
        currency: "USD",
        exchangeRate: closedLot.exchangeRate,
        fobValue: estimatedFobUsd,
        freight: 0,
        insurance: 0,
        customsTaxes: reinvestmentShare * 0.40,
        customsFees: 7884,
        totalCostNationalized: reinvestmentShare,
        quantityItems: closedLot.quantityItems,
        status: "PEDIDO_FEITO",
        expectedMarginPct: closedLot.expectedMarginPct,
        investmentProjectId: projectId,
        products: closedLot.products.length > 0 ? { connect: closedLot.products.map(p => ({ id: p.id })) } : undefined,
      },
    });

    revalidatePath("/admin/importacao/lotes");
    revalidatePath(`/admin/projetos/${projectId}`);
    revalidatePath(`/investidor/projetos/${projectId}`);
  } catch (error) {
    console.error("Erro ao abrir automaticamente o próximo lote:", error);
  }
}

export async function deleteProject(id: string) {
  const session = await requireSession("ADMIN");
  if (!session) return { success: false, error: "Não autorizado." };

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
