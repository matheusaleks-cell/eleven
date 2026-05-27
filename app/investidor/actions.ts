"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getInvestorDashboardData(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      include: {
        investedProjects: {
          include: {
            cycles: {
              orderBy: { cycleNumber: 'asc' }
            },
            importLots: {
              include: {
                weapons: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!investor) throw new Error("Investidor não encontrado");

    let totalPatrimony = 0;
    let totalYield = 0;
    const activeProjectsCount = investor.investedProjects.filter(p => p.status === "ACTIVE").length;
    
    // Gráfico e vendas
    let chartData: any[] = [];
    const allSoldWeapons: any[] = [];

    const formattedProjects = investor.investedProjects.map(project => {
      let projectInvested = project.initialCapital || 0;
      
      // Nova contabilidade baseada estritamente em armas vendidas
      let activeCycleSoldWeapons = 0;
      let activeCycleTotalWeapons = 0;
      let activeCycleInventoryValue = 0;
      let activeCycleRealizedProfit = 0;
      let completedCyclesYield = 0;

      // Obter o ciclo ativo (IN_PROGRESS) e os concluídos
      const activeCycle = project.cycles.find(c => c.status === "IN_PROGRESS");
      const completedCycles = project.cycles.filter(c => c.status === "COMPLETED");

      // Somar o lucro dos ciclos concluídos
      completedCycles.forEach(c => {
        completedCyclesYield += c.investorShare || 0;
      });

      // Iterar em todos os lotes do projeto para calcular vendas em tempo real
      project.importLots.forEach(lot => {
        const lotCycle = project.cycles.find(c => c.importLotId === lot.id);
        let deductionRate = 0.23;
        let splitPct = project.profitSplitPct || 0.50;
        let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;

        if (lotCycle && lotCycle.grossRevenue && lotCycle.grossRevenue > 0) {
          deductionRate = ((lotCycle.salesTax || 0) + (lotCycle.salesOperationalCost || 0)) / lotCycle.grossRevenue;
        }

        if (lot.status !== "LIQUIDADO") {
          activeCycleTotalWeapons += lot.quantityItems || lot.weapons.length || 0;
        }

        lot.weapons.forEach(w => {
          const uCost = w.unitCost || uCostAvg;
          if (w.currentStatus === "VENDIDA") {
            if (lot.status !== "LIQUIDADO") {
              activeCycleSoldWeapons++;
            }
            const sValue = w.saleValue || 0;
            const weaponDeductions = sValue * deductionRate;
            const netProfit = sValue - uCost - weaponDeductions;
            const investorProfit = netProfit > 0 ? netProfit * splitPct : 0;

            if (lot.status !== "LIQUIDADO") {
              activeCycleRealizedProfit += investorProfit;
            }

            allSoldWeapons.push({
              id: w.id,
              productName: w.product?.commercialName || 'Produto Desconhecido',
              serialNumber: w.serialNumber,
              saleDate: w.saleDate,
              saleValue: sValue,
              investorProfit: investorProfit,
              projectName: project.name
            });
          } else if (w.currentStatus === "ESTOQUE" || w.currentStatus === "RESERVADA" || w.currentStatus === "IMPORTADA") {
            if (lot.status !== "LIQUIDADO") {
              activeCycleInventoryValue += uCost;
            }
          }
        });
      });

      // Capital em risco no ciclo atual:
      // - Se há ciclo IN_PROGRESS, usa o totalInvestment desse ciclo
      // - Se todos concluídos, usa o reinvestmentShare do último ciclo (capital acumulado reinvestido)
      // - Se não há ciclos, usa o initialCapital original
      const lastCompletedCycle = completedCycles.length > 0 ? completedCycles[completedCycles.length - 1] : null;
      const currentAporte = activeCycle
        ? activeCycle.totalInvestment
        : (lastCompletedCycle?.reinvestmentShare ?? projectInvested);
      
      // Patrimônio do investidor = Aporte do Ciclo Atual + Rendimentos em andamento do ciclo ativo
      let projectCurrent = currentAporte + activeCycleRealizedProfit;
      
      // O rendimento acumulado total = Lucros dos ciclos concluídos + Lucros do ciclo ativo
      const projectYield = completedCyclesYield + activeCycleRealizedProfit;

      totalYield += projectYield;
      totalPatrimony += projectCurrent;

      // 1. Gerar a projeção dinâmica do projeto com base nos ciclos reais do banco de dados (que mapeiam as abas da planilha)
      const projection = project.cycles.map((c, idx) => {
        const totalInv = c.totalInvestment || 0;
        const invShare = c.investorShare || 0;
        const investorROI = totalInv > 0 ? (invShare / totalInv) * 100 : 0;

        let cumulativeInvestorEarnings = 0;
        for (let i = 0; i <= idx; i++) {
          cumulativeInvestorEarnings += project.cycles[i].investorShare || 0;
        }

        return {
          batchNumber: c.cycleNumber,
          quantity: c.quantity || 0,
          grossRevenue: c.grossRevenue || 0,
          investorShare: invShare,
          cumulativeInvestorEarnings: parseFloat(cumulativeInvestorEarnings.toFixed(2)),
          investorROI: parseFloat(investorROI.toFixed(1)),
          totalImportCostBRL: totalInv
        };
      });

      // 2. Montar o chartData baseado no avanço dos ciclos concluídos e do atual
      const projectChartPoints = project.cycles.map((c) => {
        const nextCycle = project.cycles.find(nc => nc.cycleNumber === c.cycleNumber + 1);
        const totalInv = c.totalInvestment || 0;
        const invShare = c.investorShare || 0;
        const capital = nextCycle ? (nextCycle.totalInvestment || 0) : (totalInv + invShare);
        return {
          name: c.cycleName.split(" ")[0] || `Lote ${c.cycleNumber}`,
          capital: parseFloat(capital.toFixed(2)),
          growth: parseFloat(invShare.toFixed(2)),
          date: c.createdAt
        };
      });

      projectChartPoints.unshift({
        name: "Aporte",
        capital: project.initialCapital,
        growth: 0,
        date: project.startDate || project.createdAt
      });

      chartData = projectChartPoints;

      const yieldPercentage = projectInvested > 0 ? (projectYield / projectInvested) * 100 : 0;

      return {
        id: project.id,
        name: project.name,
        product_name: project.productName,
        invested: projectInvested,
        current: projectCurrent,
        yield: yieldPercentage.toFixed(1),
        cycle: project.cycles.length,
        activeCycleSoldWeapons,
        activeCycleTotalWeapons,
        activeCycleInventoryValue,
        activeCycleRealizedProfit,
        projection
      };
    });

    // Ordenar cronologicamente e remover duplicatas de mesmo label
    chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
    const uniqueChartData = chartData.filter((item, idx, arr) => 
      idx === 0 || item.name !== arr[idx - 1].name
    );

    // Ordenar vendas recentes de armas
    allSoldWeapons.sort((a, b) => {
      const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
      const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
      return dateB - dateA;
    });

    const recentSales = allSoldWeapons.slice(0, 5).map(s => ({
      ...s,
      saleDate: s.saleDate ? s.saleDate.toLocaleDateString("pt-BR") : "—"
    }));

    return {
      success: true,
      data: {
        totalPatrimony,
        totalYield,
        activeProjectsCount,
        chartData: uniqueChartData.length > 0 ? uniqueChartData : [{ name: "Aporte Inicial", capital: totalPatrimony, growth: 0 }],
        projects: formattedProjects,
        recentSales
      }
    };
  } catch (error) {
    console.error("Erro ao buscar dados do investidor:", error);
    return { success: false, error: "Falha ao buscar dados" };
  }
}

export async function getInvestorStatement(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      include: {
        investedProjects: {
          include: {
            cycles: true,
            importLots: {
              include: {
                weapons: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!investor) throw new Error("Investidor não encontrado");

    const statement: any[] = [];

    // Aportes Iniciais
    investor.investedProjects.forEach(project => {
      statement.push({
        id: `AP-${project.id.substring(0,6)}`,
        dataStr: project.startDate ? project.startDate.toLocaleDateString("pt-BR") : project.createdAt.toLocaleDateString("pt-BR"),
        dateObj: project.startDate || project.createdAt,
        descricao: `Aporte de Capital - ${project.name}`,
        tipo: "APORTE",
        valor: -(project.initialCapital || 0) // Aporte é débito/investimento
      });
    });



    // Rendimentos das Vendas Proporcionais (Todos os lotes que possuem armas, sejam ativos ou liquidados)
    investor.investedProjects.forEach(project => {
      project.importLots.forEach(lot => {
        if (lot.weapons && lot.weapons.length > 0) {
          const lotCycle = project.cycles.find(c => c.importLotId === lot.id);
          let deductionRate = 0.23;
          if (lotCycle && lotCycle.grossRevenue && lotCycle.grossRevenue > 0) {
            deductionRate = ((lotCycle.salesTax || 0) + (lotCycle.salesOperationalCost || 0)) / lotCycle.grossRevenue;
          }
          let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
          let splitPct = project.profitSplitPct || 0.50;
          
          lot.weapons.forEach(w => {
            if (w.currentStatus === "VENDIDA") {
              const uCost = w.unitCost || uCostAvg;
              const sValue = w.saleValue || 0;
              const netProfit = sValue - uCost - (sValue * deductionRate);
              const investorProfit = netProfit > 0 ? netProfit * splitPct : 0;

              if (investorProfit > 0) {
                const stmtDate = w.saleDate || w.updatedAt;
                if (!stmtDate) return;
                statement.push({
                  id: `VP-${w.id.substring(0,6)}`,
                  dataStr: w.saleDate ? w.saleDate.toLocaleDateString("pt-BR") : w.updatedAt!.toLocaleDateString("pt-BR"),
                  dateObj: stmtDate,
                  descricao: `Venda Proporcional - ${w.product?.commercialName || 'Produto'} (${w.serialNumber}) - ${project.name}`,
                  tipo: "RENDIMENTO",
                  valor: investorProfit
                });
              }
            }
          });
        }
      });
    });

    // Ordenar cronologicamente para calcular o saldo evolutivo
    statement.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let balance = 0;
    const finalStatement = statement.map(item => {
       // O saldo evolutivo reflete o patrimônio ativo (soma o valor absoluto, pois aportes já foram inseridos como negativos)
       balance += Math.abs(item.valor); 
       return {
         ...item,
         saldo: balance,
         valor: Math.abs(item.valor) // exibe valor absoluto no extrato
       };
     });

    return {
      success: true,
      statement: finalStatement.reverse()
    };
  } catch (error) {
    console.error("Erro ao buscar extrato do investidor:", error);
    return { success: false, statement: [] };
  }
}

export async function getInvestorProjects(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      include: {
        investedProjects: {
          include: {
            cycles: true,
            importLots: {
              include: {
                weapons: true
              }
            }
          }
        }
      }
    });

    if (!investor) return { success: false, projects: [] };

    const mapped = investor.investedProjects.map(p => {
      let totalReceived = 0;
      
      // Contabilizar de forma unificada baseada nas armas vendidas
      p.importLots.forEach(lot => {
        const lotCycle = p.cycles.find(c => c.importLotId === lot.id);
        let deductionRate = 0.23;
        let splitPct = p.profitSplitPct || 0.50;
        let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;

        if (lotCycle && lotCycle.grossRevenue && lotCycle.grossRevenue > 0) {
          deductionRate = ((lotCycle.salesTax || 0) + (lotCycle.salesOperationalCost || 0)) / lotCycle.grossRevenue;
        }

        if (lot.weapons && lot.weapons.length > 0) {
          lot.weapons.forEach(w => {
            if (w.currentStatus === "VENDIDA") {
              const uCost = w.unitCost || uCostAvg;
              const sValue = w.saleValue || 0;
              const netProfit = sValue - uCost - (sValue * deductionRate);
              const investorProfit = netProfit > 0 ? netProfit * splitPct : 0;
              totalReceived += investorProfit;
            }
          });
        }
      });

      return {
        id: p.id,
        name: p.name,
        product_name: p.productName,
        status: p.status,
        initial_capital: p.initialCapital,
        currentCapital: p.initialCapital + totalReceived,
        totalInvestorShare: totalReceived,
        currentCycle: p.cycles.length,
        max_cycles: p.maxCycles
      };
    });

    return { success: true, projects: mapped };
  } catch (error) {
    console.error(error);
    return { success: false, projects: [] };
  }
}

export async function getInvestorProjectDetails(id: string, email: string) {
  try {
    const project = await prisma.investmentProject.findFirst({
      where: { id, investor: { email } },
      include: {
        cycles: {
          orderBy: { cycleNumber: "desc" }
        },
        importLots: {
          include: {
            documents: true,
            products: true,
            weapons: {
              include: {
                product: true
              }
            }
          }
        },
        documents: true
      }
    });

    if (!project) return { success: false, project: null };

    let totalReceived = 0;
    
    // Contabilizar de forma unificada baseada nas armas vendidas
    project.importLots.forEach(lot => {
      const lotCycle = project.cycles.find(c => c.importLotId === lot.id);
      let deductionRate = 0.23;
      let splitPct = project.profitSplitPct || 0.50;
      let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;

      if (lotCycle && lotCycle.grossRevenue && lotCycle.grossRevenue > 0) {
        deductionRate = ((lotCycle.salesTax || 0) + (lotCycle.salesOperationalCost || 0)) / lotCycle.grossRevenue;
      }

      if (lot.weapons && lot.weapons.length > 0) {
        lot.weapons.forEach(w => {
          if (w.currentStatus === "VENDIDA") {
            const uCost = w.unitCost || uCostAvg;
            const sValue = w.saleValue || 0;
            const netProfit = sValue - uCost - (sValue * deductionRate);
            const investorProfit = netProfit > 0 ? netProfit * splitPct : 0;
            totalReceived += investorProfit;
          }
        });
      }
    });

    const mappedCycles = project.cycles.map(c => {
      let investorProfitShare = 0;
      let grossRevenue = 0;
      
      const lot = project.importLots.find(l => l.id === c.importLotId);
      if (lot && lot.weapons && lot.weapons.length > 0) {
        let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
        let deductionRate = 0.23;
        if (c.grossRevenue && c.grossRevenue > 0) {
          deductionRate = ((c.salesTax || 0) + (c.salesOperationalCost || 0)) / c.grossRevenue;
        }
        
        lot.weapons.forEach(w => {
          if (w.currentStatus === "VENDIDA") {
            const uCost = w.unitCost || uCostAvg;
            const sValue = w.saleValue || 0;
            const netProfit = sValue - uCost - (sValue * deductionRate);
            investorProfitShare += netProfit > 0 ? netProfit * project.profitSplitPct : 0;
            grossRevenue += sValue;
          }
        });
      }

      return {
        id: c.id,
        cycleName: c.cycleName,
        quantity: c.quantity,
        startDate: c.createdAt.toLocaleDateString("pt-BR"),
        investor_profit_share: investorProfitShare,
        total_investment: c.totalInvestment,
        gross_revenue: grossRevenue,
        next_cycle_capital: c.status === "COMPLETED" ? c.reinvestmentShare : 0,
        status: c.status
      };
    });

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        product_name: project.productName,
        status: project.status,
        initial_capital: project.initialCapital,
        currentCapital: project.initialCapital + totalReceived,
        totalInvestorShare: totalReceived,
        currentCycle: project.cycles.length,
        max_cycles: project.maxCycles,
        cycles: mappedCycles,
        importLots: project.importLots,
        documents: project.documents
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, project: null };
  }
}

export async function getCycleSales(cycleId: string, email: string) {
  try {
    const cycle = await prisma.cycle.findFirst({
      where: { id: cycleId, project: { investor: { email } } },
      include: {
        project: {
          include: {
            importLots: {
              orderBy: { createdAt: "asc" }
            }
          }
        },
        importLot: {
          include: {
            weapons: {
              where: { currentStatus: "VENDIDA" },
              include: {
                product: true,
                customer: true,
                salesOrder: true
              }
            }
          }
        }
      } as any
    }) as any;

    let importLot = cycle?.importLot;
    if (cycle && !importLot && cycle.project?.importLots) {
      const sortedLots = cycle.project.importLots;
      const lotIndex = cycle.cycleNumber - 1;
      if (lotIndex >= 0 && lotIndex < sortedLots.length) {
        const fallbackLot = sortedLots[lotIndex];
        importLot = await prisma.importLot.findUnique({
          where: { id: fallbackLot.id },
          include: {
            weapons: {
              where: { currentStatus: "VENDIDA" },
              include: {
                product: true,
                customer: true,
                salesOrder: true
              }
            }
          }
        });
      }
    }

    if (!cycle || !importLot) return { success: false, sales: [] };

    const splitPct = cycle.project?.profitSplitPct || 0.50;
    const grossRev = cycle.grossRevenue || 1;
    const totalDeductions = (cycle.salesTax || 0) + (cycle.salesOperationalCost || 0);
    const deductionRate = totalDeductions / grossRev;

    const sales = importLot.weapons.map((w: any) => {
      const uCost = w.unitCost || (cycle.totalInvestment / (cycle.quantity || 1));
      const sValue = w.saleValue || 0;
      
      // Deduções proporcionais de impostos e operacional de venda para esta peça
      const weaponDeductions = sValue * deductionRate;
      // Lucro líquido unitário apurado
      const netProfit = sValue - uCost - weaponDeductions;
      // Retorno do investidor = custo unitário amortizado + fatia do lucro
      const investorProfitShare = netProfit > 0 ? netProfit * splitPct : 0;
      const investorReturn = uCost + investorProfitShare;

      return {
        id: w.id,
        productName: w.product?.commercialName || 'Produto Desconhecido',
        serialNumber: w.serialNumber,
        saleDate: w.saleDate?.toLocaleDateString("pt-BR"),
        saleValue: sValue,
        customerName: w.customer?.name || "Cliente Final",
        unitCost: uCost,
        investorReturn: investorReturn
      };
    });

    const totalSoldValue = sales.reduce((acc: number, s: any) => acc + s.saleValue, 0);

    return { success: true, sales, totalSoldValue };
  } catch (error) {
    console.error(error);
    return { success: false, sales: [] };
  }
}

export async function getInvestorProfile(email: string) {
  try {
    const investor = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpfCnpj: true,
        rg: true,
        profession: true,
        address: true,
        bankDetails: true,
        bankReferences: true,
        commercialRefs: true,
        createdAt: true,
      }
    });

    if (!investor) throw new Error("Investidor não encontrado");

    return { success: true, data: investor };
  } catch (error) {
    console.error("Erro ao buscar perfil do investidor:", error);
    return { success: false, error: "Falha ao buscar dados" };
  }
}

export async function updateMyPassword(email: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar própria senha:", error);
    return { success: false, error: "Falha ao atualizar senha." };
  }
}


