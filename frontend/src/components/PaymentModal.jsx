import { useState } from 'react';
import { X, CheckCircle2, CreditCard, Smartphone, Wallet, Receipt } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, dueAmount, billPaid, onPaySuccess, walletBalance, onRechargeSuccess }) {
  const [mode, setMode] = useState('BILL'); // BILL | RECHARGE
  const [method, setMethod] = useState('UPI');
  const [rechargeAmt, setRechargeAmt] = useState(500);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleAction = (e) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      if (mode === 'BILL') onPaySuccess();
      else onRechargeSuccess(Number(rechargeAmt));
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt size={20} className="text-sky-600" />
            <h3 className="text-base font-extrabold text-slate-900">Smart Billing & Recharge</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>

        {/* Toggle Bill Pay vs Prepaid Top-Up */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setMode('BILL')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              mode === 'BILL' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Pay Current Bill
          </button>
          <button
            type="button"
            onClick={() => setMode('RECHARGE')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              mode === 'RECHARGE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Prepaid Meter Top-Up
          </button>
        </div>

        {mode === 'BILL' ? (
          billPaid ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-emerald-900 text-sm">Current Cycle Bill Paid!</h4>
              <p className="text-xs text-emerald-700">
                Receipt #VS-2026-8841 • Rs {dueAmount} settled via {method}. Next due date: 28 Dec 2026.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAction} className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-sky-700">COMBINED DUE (ELEC + GAS)</p>
                  <p className="text-2xl font-black text-slate-900">Rs {dueAmount}</p>
                </div>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                  Due: 28 Nov 2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
                    method === 'UPI' ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Smartphone size={16} /> UPI (GPay / PhonePe)
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
                    method === 'CARD' ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCard size={16} /> Debit / Credit Card
                </button>
              </div>

              <button
                disabled={processing}
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm shadow-lg shadow-sky-600/20 transition"
              >
                {processing ? 'Processing Payment...' : `Pay Rs ${dueAmount} Now`}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleAction} className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-700">PREPAID SMART WALLET</p>
                <p className="text-2xl font-black text-slate-900">Rs {walletBalance}</p>
              </div>
              <Wallet size={24} className="text-emerald-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Quick Top-Up Amount (INR)</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[300, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmt(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      rechargeAmt === amt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    + Rs {amt}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={processing}
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition"
            >
              {processing ? 'Recharging Smart Meter...' : `Add Rs ${rechargeAmt} to Meter Wallet`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
