import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPercentage } from "@/lib/utils/format";
import type { ProposalWithCalculations } from "@shared/schema";
import { Chart } from "chart.js/auto";

interface ChartPanelProps {
  proposals: ProposalWithCalculations[];
}

export default function ChartPanel({ proposals }: ChartPanelProps) {
  const paymentChartRef = useRef<HTMLCanvasElement>(null);
  const commissionChartRef = useRef<HTMLCanvasElement>(null);
  const paymentChartInstance = useRef<Chart | null>(null);
  const commissionChartInstance = useRef<Chart | null>(null);
  
  // Calculate total values
  const totalValue = proposals.reduce((sum, proposal) => sum + Number(proposal.valorTotal), 0);
  const totalPaid = proposals.reduce((sum, proposal) => sum + Number(proposal.valorPago), 0);
  const totalCommission = proposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoTotal), 0);
  const totalCommissionPaid = proposals.reduce((sum, proposal) => sum + Number(proposal.valorComissaoPaga), 0);
  
  // Calculate percentages
  const paymentPercentage = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
  const commissionPercentage = totalCommission > 0 ? (totalCommissionPaid / totalCommission) * 100 : 0;
  
  // Setup and update charts
  useEffect(() => {
    if (paymentChartRef.current && commissionChartRef.current) {
      // Destroy existing charts
      if (paymentChartInstance.current) {
        paymentChartInstance.current.destroy();
      }
      if (commissionChartInstance.current) {
        commissionChartInstance.current.destroy();
      }
      
      // Create payment chart
      paymentChartInstance.current = new Chart(paymentChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Recebido', 'A Receber'],
          datasets: [{
            data: [totalPaid, totalValue - totalPaid],
            backgroundColor: ['#36B37E', '#E2E8F0'], // Green for received, grey for pending
            borderWidth: 0,
            cutout: '75%'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  const percentage = (value / totalValue * 100).toFixed(1);
                  return `${context.label}: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true
          }
        }
      });
      
      // Create commission chart
      commissionChartInstance.current = new Chart(commissionChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Paga', 'A Pagar'],
          datasets: [{
            data: [totalCommissionPaid, totalCommission - totalCommissionPaid],
            backgroundColor: ['#0052CC', '#E2E8F0'], // Blue for paid, grey for pending
            borderWidth: 0,
            cutout: '75%'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  const percentage = (value / totalCommission * 100).toFixed(1);
                  return `${context.label}: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true
          }
        }
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (paymentChartInstance.current) {
        paymentChartInstance.current.destroy();
      }
      if (commissionChartInstance.current) {
        commissionChartInstance.current.destroy();
      }
    };
  }, [proposals, totalValue, totalPaid, totalCommission, totalCommissionPaid]);
  
  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          {/* Payment Chart */}
          <div className="flex flex-col items-center flex-1">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Recebido vs Total</h3>
            <div className="relative w-36 h-36">
              <canvas ref={paymentChartRef} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold text-neutral-800">
                    {formatPercentage(paymentPercentage)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-4 justify-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#36B37E] mr-2"></div>
                <span className="text-sm text-neutral-600">Recebido</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-neutral-300 mr-2"></div>
                <span className="text-sm text-neutral-600">A Receber</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block h-40">
            <Separator orientation="vertical" />
          </div>
          <div className="md:hidden w-full">
            <Separator orientation="horizontal" />
          </div>
          
          {/* Commission Chart */}
          <div className="flex flex-col items-center flex-1">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">Comissão Paga vs Total</h3>
            <div className="relative w-36 h-36">
              <canvas ref={commissionChartRef} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold text-neutral-800">
                    {formatPercentage(commissionPercentage)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-4 justify-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#0052CC] mr-2"></div>
                <span className="text-sm text-neutral-600">Paga</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-neutral-300 mr-2"></div>
                <span className="text-sm text-neutral-600">A Pagar</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
