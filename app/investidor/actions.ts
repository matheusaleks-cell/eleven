"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireSession } from "@/lib/auth-guard";
import { FinancialRates, getActiveFinancialRates, ratesFromCycleOrDefault, computeUnitFinancials } from "@/lib/financial-calc";

// Fonte única de verdade para "quanto o investidor já recebeu" de um projeto: ciclos COMPLETED
// usam o valor oficial já gravado (Cycle.investorShare, fechado pelo admin), o lote ainda não
// liquidado é recalculado ao vivo a partir das armas vendidas. Mesma regra usada em
// getInvestorDashboardData — mantém Dashboard, Extrato, Projetos e detalhe do Projeto consistentes
// entre si (antes cada função recalculava do zero, inclusive lotes já liquidados, e podia divergir
// do valor oficial do ciclo fechado).
function computeProjectYield(project: any, financialDefaults: FinancialRates) {
  const completedCyclesYield = (project.cycles || [])
    .filter((c: any) => c.status === "COMPLETED")
    .reduce((acc: number, c: any) => acc + (c.investorShare || 0), 0);

  const splitPct = project.profitSplitPct || 0.50;
  let activeRealizedProfit = 0;

  (project.importLots || []).forEach((lot: any) => {
    if (lot.status === "LIQUIDADO") return; // já contabilizado acima via Cycle.investorShare

    const lotCycle = (project.cycles || []).find((c: any) => c.importLotId === lot.id);
    const rates = ratesFromCycleOrDefault(lotCycle, financialDefaults);
    const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;

    (lot.weapons || []).forEach((w: any) => {
      if (w.currentStatus !== "VENDIDA") return;
      const uCost = w.unitCost || uCostAvg;
      const sValue = w.saleValue || 0;
      const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
      activeRealizedProfit += fin.investorShare;
    });
  });

  return {
    completedCyclesYield,
    activeRealizedProfit,
    totalReceived: completedCyclesYield + activeRealizedProfit,
  };
}

export async function getInvestorDashboardData() {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.email) return { success: false, error: "Não autorizado." };
    const email = session.user.email;

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

    const financialDefaults = await getActiveFinancialRates();
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
        const rates = ratesFromCycleOrDefault(lotCycle, financialDefaults);
        const splitPct = project.profitSplitPct || 0.50;
        const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;

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
            const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
            const investorProfit = fin.investorShare;

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

export async function getInvestorStatement() {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.email) return { success: false, statement: [] };
    const email = session.user.email;

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

    const financialDefaults = await getActiveFinancialRates();
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



    // Rendimentos: ciclos já fechados usam o valor oficial gravado (mesma fonte da Dashboard),
    // um lançamento por ciclo. O lote ainda ativo (não liquidado) é lançado venda a venda, em
    // tempo real — evita recalcular (e possivelmente divergir de) ciclos já encerrados.
    investor.investedProjects.forEach(project => {
      project.cycles
        .filter(c => c.status === "COMPLETED")
        .forEach(c => {
          if ((c.investorShare || 0) > 0) {
            statement.push({
              id: `CI-${c.id.substring(0,6)}`,
              dataStr: c.createdAt.toLocaleDateString("pt-BR"),
              dateObj: c.createdAt,
              descricao: `Distribuição de Lucro - ${c.cycleName} - ${project.name}`,
              tipo: "RENDIMENTO",
              valor: c.investorShare || 0
            });
          }
        });

      project.importLots.forEach(lot => {
        if (lot.status === "LIQUIDADO") return; // já contabilizado acima via ciclo fechado
        if (lot.weapons && lot.weapons.length > 0) {
          const lotCycle = project.cycles.find(c => c.importLotId === lot.id);
          const rates = ratesFromCycleOrDefault(lotCycle, financialDefaults);
          const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
          const splitPct = project.profitSplitPct || 0.50;

          lot.weapons.forEach(w => {
            if (w.currentStatus === "VENDIDA") {
              const uCost = w.unitCost || uCostAvg;
              const sValue = w.saleValue || 0;
              const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
              const investorProfit = fin.investorShare;

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

export async function getInvestorProjects() {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.email) return { success: false, projects: [] };
    const email = session.user.email;

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

    const financialDefaults = await getActiveFinancialRates();
    const mapped = investor.investedProjects.map(p => {
      const { totalReceived } = computeProjectYield(p, financialDefaults);

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

export async function getInvestorProjectDetails(id: string) {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.email) return { success: false, project: null };
    const email = session.user.email;

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

    const financialDefaults = await getActiveFinancialRates();
    const { totalReceived } = computeProjectYield(project, financialDefaults);

    const mappedCycles = project.cycles.map(c => {
      // Ciclo fechado: usa o valor oficial gravado pelo admin (mesma fonte da Dashboard).
      if (c.status === "COMPLETED") {
        return {
          id: c.id,
          cycleName: c.cycleName,
          quantity: c.quantity,
          startDate: c.createdAt.toLocaleDateString("pt-BR"),
          investor_profit_share: c.investorShare || 0,
          total_investment: c.totalInvestment,
          gross_revenue: c.grossRevenue || 0,
          next_cycle_capital: c.reinvestmentShare,
          status: c.status
        };
      }

      // Ciclo ainda ativo: recalcula ao vivo a partir das armas do lote vinculado.
      let investorProfitShare = 0;
      let grossRevenue = 0;

      const lot = project.importLots.find(l => l.id === c.importLotId);
      if (lot && lot.weapons && lot.weapons.length > 0) {
        const uCostAvg = lot.quantityItems > 0 ? (lot.totalCostNationalized / lot.quantityItems) : 0;
        const rates = ratesFromCycleOrDefault(c, financialDefaults);

        lot.weapons.forEach(w => {
          if (w.currentStatus === "VENDIDA") {
            const uCost = w.unitCost || uCostAvg;
            const sValue = w.saleValue || 0;
            const fin = computeUnitFinancials(sValue, uCost, project.profitSplitPct, rates);
            investorProfitShare += fin.investorShare;
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
        next_cycle_capital: 0,
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

export async function getCycleSales(cycleId: string) {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.email) return { success: false, sales: [] };
    const email = session.user.email;

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

    const financialDefaults = await getActiveFinancialRates();
    const splitPct = cycle.project?.profitSplitPct || 0.50;
    const rates = ratesFromCycleOrDefault(cycle, financialDefaults);

    const sales = importLot.weapons.map((w: any) => {
      const uCost = w.unitCost || (cycle.totalInvestment / (cycle.quantity || 1));
      const sValue = w.saleValue || 0;

      // Retorno do investidor = custo unitário amortizado + fatia do lucro
      const fin = computeUnitFinancials(sValue, uCost, splitPct, rates);
      const investorProfitShare = fin.investorShare;
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

export async function getInvestorProfile() {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.email) return { success: false, error: "Não autorizado." };
    const email = session.user.email;

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

export async function updateMyPassword(currentPassword: string, newPassword: string) {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.email) return { success: false, error: "Não autorizado." };
    const email = session.user.email;

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const validCurrent = await bcrypt.compare(currentPassword || "", user.password);
    if (!validCurrent) return { success: false, error: "Senha atual incorreta." };

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

export async function getMyDocuments() {
  try {
    const session = await requireSession("INVESTOR");
    if (!session?.user?.id) return { success: false, documents: [] };

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, documents };
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return { success: false, documents: [] };
  }
}


