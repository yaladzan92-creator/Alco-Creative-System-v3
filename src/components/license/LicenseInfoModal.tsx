import React, { useState } from 'react';
import { ShieldCheck, Monitor, KeyRound, Calendar, User, Zap, RefreshCw, Trash2, X, CheckCircle2 } from 'lucide-react';
import { LicenseEvaluationResult } from '@/types/license';
import { toast } from 'sonner';

interface LicenseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseState: LicenseEvaluationResult;
  onRefresh: () => void;
}

export default function LicenseInfoModal({ isOpen, onClose, licenseState, onRefresh }: LicenseInfoModalProps) {
  if (!isOpen) return null;

  const payload = licenseState.payload;

  const handleDeactivate = async () => {
    if (!window.alcoLicense) return;
    if (confirm('Apakah Anda yakin ingin menonaktifkan dan menghapus lisensi di perangkat ini?')) {
      await window.alcoLicense.removeLicense();
      toast.info('Lisensi telah dinonaktifkan.');
      onRefresh();
      onClose();
    }
  };

  const isLifetime = payload?.licenseType === 'lifetime';
  const expiresAtFormatted = payload?.expiresAt
    ? new Date(payload.expiresAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Lifetime (Tanpa Kadaluarsa)';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm text-foreground">
                Detail Lisensi Resmi
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">
                ALCO Creative System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* License Content */}
        {payload ? (
          <div className="space-y-3.5 text-xs">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                  Status Lisensi
                </span>
                <span className="font-heading font-black text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> TERVERIFIKASI RESMI
                </span>
              </div>
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                {payload.plan}
              </span>
            </div>

            <div className="space-y-2.5 bg-secondary/30 p-4 rounded-2xl border border-border/60">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <KeyRound className="w-3.5 h-3.5 text-primary" /> License ID:
                </span>
                <span className="font-mono font-bold text-foreground">{payload.licenseId}</span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-primary" /> Customer:
                </span>
                <span className="font-bold text-foreground">{payload.customerName || payload.customerId}</span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Tipe Lisensi:
                </span>
                <span className="font-bold uppercase text-foreground">{payload.licenseType}</span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Masa Berlaku:
                </span>
                <span className={`font-bold ${isLifetime ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                  {expiresAtFormatted}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
                <span className="flex items-center gap-1.5 font-medium">
                  <Monitor className="w-3.5 h-3.5 text-primary" /> Terikat Perangkat:
                </span>
                <span className="font-mono text-[10px] text-foreground bg-background px-2 py-0.5 rounded border border-border">
                  {payload.deviceId}
                </span>
              </div>
            </div>

            {payload.features && payload.features.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                  Fitur Diberikan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {payload.features.map((feat, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground">
            Data lisensi tidak ditemukan.
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
          <button
            onClick={handleDeactivate}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Lisensi</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
