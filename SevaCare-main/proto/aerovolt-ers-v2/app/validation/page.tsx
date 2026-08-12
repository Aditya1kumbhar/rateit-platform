import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ValidationPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#F8FAFC] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 hover:bg-[#16191E] rounded-full transition-colors border border-transparent hover:border-[#262B33]">
            <ArrowLeft className="w-5 h-5 text-[#94A3B8]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Model Validation</h1>
            <p className="text-[#94A3B8] text-sm">HMM Engine Performance Metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#16191E] border border-[#262B33] p-6 rounded-lg flex flex-col items-center justify-center">
            <div className="text-sm text-[#94A3B8] uppercase tracking-wider mb-2">Precision</div>
            <div className="text-4xl font-bold text-[#10B981]">0.92</div>
          </div>
          <div className="bg-[#16191E] border border-[#262B33] p-6 rounded-lg flex flex-col items-center justify-center">
            <div className="text-sm text-[#94A3B8] uppercase tracking-wider mb-2">Recall</div>
            <div className="text-4xl font-bold text-[#10B981]">0.88</div>
          </div>
          <div className="bg-[#16191E] border border-[#262B33] p-6 rounded-lg flex flex-col items-center justify-center">
            <div className="text-sm text-[#94A3B8] uppercase tracking-wider mb-2">F1 Score</div>
            <div className="text-4xl font-bold text-[#2563EB]">0.90</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#16191E] border border-[#262B33] p-6 rounded-lg">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Confusion Matrix (Trap vs Nominal)</h2>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="bg-[#0F1115] border border-[#10B981]/50 p-4 rounded">
                <div className="text-[#94A3B8] mb-1">True Positive</div>
                <div className="text-2xl text-[#10B981]">142</div>
              </div>
              <div className="bg-[#0F1115] border border-[#EF4444]/50 p-4 rounded">
                <div className="text-[#94A3B8] mb-1">False Positive</div>
                <div className="text-2xl text-[#EF4444]">12</div>
              </div>
              <div className="bg-[#0F1115] border border-[#EF4444]/50 p-4 rounded">
                <div className="text-[#94A3B8] mb-1">False Negative</div>
                <div className="text-2xl text-[#EF4444]">19</div>
              </div>
              <div className="bg-[#0F1115] border border-[#10B981]/50 p-4 rounded">
                <div className="text-[#94A3B8] mb-1">True Negative</div>
                <div className="text-2xl text-[#10B981]">854</div>
              </div>
            </div>
          </div>

          <div className="bg-[#16191E] border border-[#262B33] p-6 rounded-lg flex flex-col justify-between">
             <div>
                <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Model Info</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-[#262B33] pb-2">
                    <span className="text-[#64748B]">Version</span>
                    <span className="text-[#F8FAFC]">v2.4.1-hmm</span>
                  </div>
                  <div className="flex justify-between border-b border-[#262B33] pb-2">
                    <span className="text-[#64748B]">Brier Score</span>
                    <span className="text-[#F8FAFC]">0.114</span>
                  </div>
                  <div className="flex justify-between border-b border-[#262B33] pb-2">
                    <span className="text-[#64748B]">Scenario Seed</span>
                    <span className="text-[#F8FAFC] font-mono text-xs">0x4F9A2B</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-[#64748B]">Robustness (Noise)</span>
                    <span className="text-[#10B981]">PASS</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
