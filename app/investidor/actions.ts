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
    
    // Gráfico: sempre começa com o aporte inicial de cada projeto
    const chartData: any[] = [];
    const allSoldWeapons: any[] = [];

    const formattedProjects = investor.investedProjects.map(project => {
      let projectInvested = project.initialCapital || 0;
      
      // Nova contabilidade baseada estritamente em armas vendidas (com fallback de ciclos sem armas)
      let totalProjectInvestorYield = 0;
      let activeCycleSoldWeapons = 0;
      let activeCycleTotalWeapons = 0;
      let activeCycleInventoryValue = 0;
      let activeCycleRealizedProfit = 0;

      // Iterar em todos os lotes do projeto
      project.importLots.forEach(lot => {
        const lotCycle = project.cycles.find(c => c.importLotId === lot.id);
        let deductionRate = 0.23;
        let splitPct = project.profitSplitPct || 0.50;
        let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;

        if (lotCycle && lotCycle.grossRevenue && lotCycle.grossRevenue > 0) {
          deductionRate = ((lotCycle.salesTax || 0) + (lotCycle.salesOperationalCost || 0)) / lotCycle.grossRevenue;
        }

        // Se tem armas, calcula estritamente com base nelas
        if (lot.weapons && lot.weapons.length > 0) {
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

              totalProjectInvestorYield += investorProfit;
              if (lot.status !== "LIQUIDADO") {
                activeCycleRealizedProfit += investorProfit;
              }

              allSoldWeapons.push({
                id: w.id,
                productName: w.product.commercialName,
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
        } else {
          // Fallback para lotes legados sem armas cadastradas
          if (lotCycle && lotCycle.status === "COMPLETED") {
            totalProjectInvestorYield += lotCycle.investorShare || 0;
          }
        }
      });

      // Ciclos legados adicionais sem lote correspondente associado a armas
      project.cycles.forEach(c => {
        if (c.status === "COMPLETED") {
          const hasLotWithWeapons = project.importLots.some(l => l.id === c.importLotId && l.weapons && l.weapons.length > 0);
          if (!hasLotWithWeapons) {
            totalProjectInvestorYield += c.investorShare || 0;
          }
        }
      });

      let projectCurrent = projectInvested + totalProjectInvestorYield;
      totalYield += totalProjectInvestorYield;
      totalPatrimony += projectCurrent;

      // Ponto de partida: data de início do projeto (aporte)
      const startLabel = (project.startDate || project.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      chartData.push({
        name: startLabel,
        capital: projectInvested,
        growth: 0,
        date: project.startDate || project.createdAt
      });
      
      // Evolução do capital pelos ciclos concluídos legados
      let runningCapital = projectInvested;
      project.cycles.forEach(cycle => {
        if (cycle.status === "COMPLETED") {
          const hasLotWithWeapons = project.importLots.some(l => l.id === cycle.importLotId && l.weapons && l.weapons.length > 0);
          if (!hasLotWithWeapons) {
            runningCapital += cycle.investorShare || 0;
            const monthLabel = cycle.updatedAt.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            chartData.push({
              name: monthLabel,
              capital: runningCapital,
              growth: cycle.investorShare || 0,
              date: cycle.updatedAt
            });
          }
        }
      });

      // Evolução do capital pelas armas vendidas reais
      let accumYieldFromWeapons = 0;
      // Agrupar vendas reais por mês para gerar pontos no gráfico
      const salesByMonth: { [key: string]: { value: number; date: Date } } = {};
      
      project.importLots.forEach(lot => {
        if (lot.weapons && lot.weapons.length > 0) {
          const lotCycle = project.cycles.find(c => c.importLotId === lot.id);
          let deductionRate = 0.23;
          let uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
          let splitPct = project.profitSplitPct || 0.50;

          if (lotCycle && lotCycle.grossRevenue && lotCycle.grossRevenue > 0) {
            deductionRate = ((lotCycle.salesTax || 0) + (lotCycle.salesOperationalCost || 0)) / lotCycle.grossRevenue;
          }

          lot.weapons.forEach(w => {
            if (w.currentStatus === "VENDIDA") {
              const uCost = w.unitCost || uCostAvg;
              const sValue = w.saleValue || 0;
              const netProfit = sValue - uCost - (sValue * deductionRate);
              const investorProfit = netProfit > 0 ? netProfit * splitPct : 0;

              if (investorProfit > 0) {
                const wDate = w.saleDate || w.updatedAt;
                const monthLabel = wDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                if (!salesByMonth[monthLabel] || salesByMonth[monthLabel].date < wDate) {
                  salesByMonth[monthLabel] = {
                    value: (salesByMonth[monthLabel]?.value || 0) + investorProfit,
                    date: wDate
                  };
                } else {
                  salesByMonth[monthLabel].value += investorProfit;
                }
              }
            }
          });
        }
      });

      const sortedMonthPoints = Object.keys(salesByMonth).map(monthStr => ({
        name: monthStr,
        growth: salesByMonth[monthStr].value,
        date: salesByMonth[monthStr].date
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      sortedMonthPoints.forEach(point => {
        runningCapital += point.growth;
        chartData.push({
          name: point.name,
          capital: runningCapital,
          growth: point.growth,
          date: point.date
        });
      });

      const yieldPercentage = projectInvested > 0 ? ((projectCurrent - projectInvested) / projectInvested) * 100 : 0;

      return {
        id: project.id,
        name: project.name,
        invested: projectInvested,
        current: projectCurrent,
        yield: yieldPercentage.toFixed(1),
        cycle: project.cycles.length,
        activeCycleSoldWeapons,
        activeCycleTotalWeapons,
        activeCycleInventoryValue,
        activeCycleRealizedProfit
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

    // Rendimentos dos Ciclos Concluídos Legados (que não possuem armas no lote correspondente) e Reinvestimentos
    investor.investedProjects.forEach(project => {
      project.cycles.forEach(cycle => {
        if (cycle.status === "COMPLETED") {
          const hasLotWithWeapons = project.importLots.some(l => l.id === cycle.importLotId && l.weapons && l.weapons.length > 0);
          if (!hasLotWithWeapons) {
            if (cycle.investorShare > 0) {
              statement.push({
                id: `YC-${cycle.id.substring(0,6)}`,
                dataStr: cycle.updatedAt.toLocaleDateString("pt-BR"),
                dateObj: cycle.updatedAt,
                descricao: `Distribuição de Lucro - ${project.name} (${cycle.cycleName})`,
                tipo: "RENDIMENTO",
                valor: cycle.investorShare
              });
            }
            if (cycle.reinvestmentShare > 0) {
               statement.push({
                id: `RV-${cycle.id.substring(0,6)}`,
                dataStr: cycle.updatedAt.toLocaleDateString("pt-BR"),
                dateObj: cycle.updatedAt,
                descricao: `Reinvestimento Automático - ${project.name}`,
                tipo: "REINVEST",
                valor: cycle.reinvestmentShare
              });
            }
          }
        }
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
                statement.push({
                  id: `VP-${w.id.substring(0,6)}`,
                  dataStr: w.saleDate ? w.saleDate.toLocaleDateString("pt-BR") : w.updatedAt.toLocaleDateString("pt-BR"),
                  dateObj: w.saleDate || w.updatedAt,
                  descricao: `Venda Proporcional - ${w.product.commercialName} (${w.serialNumber}) - ${project.name}`,
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
        } else {
          if (lotCycle && lotCycle.status === "COMPLETED") {
            totalReceived += lotCycle.investorShare || 0;
          }
        }
      });

      // Ciclos adicionais legados sem lote de armas
      p.cycles.forEach(c => {
        if (c.status === "COMPLETED") {
          const hasLotWithWeapons = p.importLots.some(l => l.id === c.importLotId && l.weapons && l.weapons.length > 0);
          if (!hasLotWithWeapons) {
            totalReceived += c.investorShare || 0;
          }
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
      } else {
        if (lotCycle && lotCycle.status === "COMPLETED") {
          totalReceived += lotCycle.investorShare || 0;
        }
      }
    });

    // Ciclos legados adicionais sem lote de armas
    project.cycles.forEach(c => {
      if (c.status === "COMPLETED") {
        const hasLotWithWeapons = project.importLots.some(l => l.id === c.importLotId && l.weapons && l.weapons.length > 0);
        if (!hasLotWithWeapons) {
          totalReceived += c.investorShare || 0;
        }
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
      } else {
        // Fallback para ciclos sem lote de armas cadastrado
        if (c.status === "COMPLETED") {
          investorProfitShare = c.investorShare;
          grossRevenue = c.grossRevenue;
        }
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
        productName: w.product.commercialName,
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


