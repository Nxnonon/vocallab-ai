"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  X,
  Crown,
  Check,
  QrCode,
  CreditCard,
  Building2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgradeSuccess: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onUpgradeSuccess,
}) => {
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<"promptpay" | "stripe" | "omise">("promptpay");
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

  const handleSimulateUpgrade = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      onUpgradeSuccess();
      try {
        import("canvas-confetti").then((m) => {
          m.default({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
          });
        });
      } catch {}
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-5 text-white overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>{t.proModal.badge}</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight pt-2">
            {t.proModal.title}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t.proModal.subtitle}
          </p>
        </div>

        {/* Price Tag */}
        <div className="flex items-baseline gap-2 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
          <span className="text-3xl font-black text-white">{t.proModal.priceMonth}</span>
          <span className="text-xs text-zinc-400 font-medium">{t.proModal.period}</span>
          <span className="text-xs text-zinc-500 ml-auto font-mono">{t.proModal.altPrice}</span>
        </div>

        {/* Feature List */}
        <div className="space-y-2 text-xs">
          {t.proModal.features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-zinc-300">
              <div className="p-0.5 rounded-full bg-violet-600/30 text-violet-400 mt-0.5 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="leading-tight">{feat}</span>
            </div>
          ))}
        </div>

        {/* Payment Options Mock */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-zinc-300">
            {t.proModal.paymentOptions}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedMethod("promptpay")}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                selectedMethod === "promptpay"
                  ? "border-amber-500/80 bg-amber-500/10 text-amber-300"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="text-[10px] font-bold">PromptPay</span>
            </button>

            <button
              onClick={() => setSelectedMethod("stripe")}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                selectedMethod === "stripe"
                  ? "border-violet-500 bg-violet-950/40 text-violet-300"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px] font-bold">Credit Card</span>
            </button>

            <button
              onClick={() => setSelectedMethod("omise")}
              className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                selectedMethod === "omise"
                  ? "border-cyan-500 bg-cyan-950/40 text-cyan-300"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-bold">Omise Pay</span>
            </button>
          </div>

          {/* Payment Method UI Details */}
          {selectedMethod === "promptpay" && (
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-300">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-black shrink-0 font-mono text-[9px] font-bold text-center leading-3">
                QR CODE
              </div>
              <div>
                <p className="font-bold text-white">พร้อมเพย์ (PromptPay QR)</p>
                <p className="text-[11px] text-zinc-400">
                  Scan with any Thai mobile banking app (SCB, KBank, KTB, BBL)
                </p>
              </div>
            </div>
          )}

          {selectedMethod === "stripe" && (
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Card: **** **** **** 4242</span>
                <span>08/28</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans">
                Secured via Stripe Payment Gateway
              </p>
            </div>
          )}

          {selectedMethod === "omise" && (
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400">
              <p className="font-semibold text-white">Omise Payment Gateway</p>
              <p className="text-[11px] text-zinc-400">
                Supports TrueMoney Wallet, ShopeePay, and Online Banking.
              </p>
            </div>
          )}
        </div>

        {/* Upgrade Action Button */}
        {isPro ? (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t.proModal.upgradeSuccess}</span>
          </div>
        ) : (
          <button
            onClick={handleSimulateUpgrade}
            disabled={isUpgrading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{isUpgrading ? "Processing..." : t.proModal.upgradeBtn}</span>
          </button>
        )}
      </div>
    </div>
  );
};
