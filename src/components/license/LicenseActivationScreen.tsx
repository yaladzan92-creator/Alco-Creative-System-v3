import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Copy, Check, Lock, RefreshCw, AlertCircle, FileText, Monitor, CheckCircle2, Trash2 } from 'lucide-react';
import { LicenseEvaluationResult, LicenseStatusCode } from '@/types/license';
import { toast } from 'sonner';
import { safeCopyToClipboard } from '@/lib/utils';

interface LicenseActivationScreenProps {
  licenseState: LicenseEvaluationResult;
  onRefresh: () => void;
}

const ERROR_LABELS: Record<LicenseStatusCode, { title: string; desc: string; badgeColor: string }> = {
  LICENSE_VALID: {
    title: 'Lisensi Aktif',
    desc: 'Lisensi resmi ALCO Creative System terverifikasi.',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  NO_LICENSE: {
    title: 'Belum Teraktivasi',
    desc: 'Silakan masukkan kunci lisensi ALCO yang valid untuk menggunakan aplikasi.',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  INVALID_SIGNATURE: {
    title: 'Signature Tidak Valid',
    desc: 'Tanda tangan digital lisensi tidak cocok atau data telah diubah.',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  WRONG_DEVICE: {
    title: 'Perangkat Tidak Cocok',
    desc: 'Lisensi ini diterbitkan untuk perangkat lain (Device ID berbeda).',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  WRONG_APP: {
    title: 'App ID Tidak Cocok',
    desc: 'Lisensi ini diperuntukkan untuk produk ALCO lain, bukan Creative System.',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  EXPIRED_LICENSE: {
    title: 'Lisensi Kadaluarsa',
    desc: 'Masa berlangganan lisensi telah berakhir. Silakan perbarui lisensi Anda.',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  MALFORMED_LICENSE: {
    title: 'Format Lisensi Rusak',
    desc: 'Kunci lisensi yang dimasukkan tidak memenuhi format standar ALCO-LIC-v1.',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  UNSUPPORTED_LICENSE_VERSION: {
    title: 'Versi Lisensi Tidak Didukung',
    desc: 'Versi lisensi tidak kompatibel dengan versi verifier aplikasi ini.',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  CONFIGURATION_ERROR: {
    title: 'Konfigurasi Belum Lengkap',
    desc: 'Public key verifikasi belum dikonfigurasi (ALCO_LICENSE_PUBLIC_KEY missing). Hubungi Aladzan Corpora.',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
};

export default function LicenseActivationScreen({ licenseState, onRefresh }: LicenseActivationScreenProps) {
  const [licenseInput, setLicenseInput] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [requestCode, setRequestCode] = useState(licenseState.requestCode || '');
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [copiedDevId, setCopiedDevId] = useState(false);
  const [copiedReqCode, setCopiedReqCode] = useState(false);

  const errorInfo = ERROR_LABELS[licenseState.status] || ERROR_LABELS.NO_LICENSE;

  const handleCopyDevId = async () => {
    if (licenseState.deviceId) {
      await safeCopyToClipboard(licenseState.deviceId);
      setCopiedDevId(true);
      toast.success('Device ID berhasil disalin!');
      setTimeout(() => setCopiedDevId(false), 2000);
    }
  };

  const handleCopyReqCode = async () => {
    if (requestCode) {
      await safeCopyToClipboard(requestCode);
      setCopiedReqCode(true);
      toast.success('Request Code berhasil disalin!');
      setTimeout(() => setCopiedReqCode(false), 2000);
    }
  };

  const handleGenerateReqCode = async () => {
    if (!customerId.trim()) {
      toast.error('Isi Customer ID terlebih dahulu');
      return;
    }
    if (!window.alcoLicense) {
      toast.error('Request Code memerlukan ALCO Desktop App.');
      return;
    }
    setRequestLoading(true);
    try {
      const code = await window.alcoLicense.getRequestCode({
        cust: customerId.trim(),
        name: customerName.trim(),
      });
      setRequestCode(code);
      toast.success('Request Code resmi berhasil dibuat.');
    } catch (err: any) {
      setRequestCode('');
      toast.error(err?.message || 'Gagal membuat Request Code.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) {
      toast.error('Masukkan Kunci Lisensi terlebih dahulu');
      return;
    }

    if (!window.alcoLicense) {
      toast.error('Aktivasi lisensi memerlukan ALCO Desktop App.');
      return;
    }

    setLoading(true);
    try {
      const res = await window.alcoLicense.activate(licenseInput.trim());
      if (res.status === 'LICENSE_VALID') {
        toast.success('Lisensi ALCO Creative System Berhasil Diaktivasi!');
        onRefresh();
      } else {
        const msg = res.error || ERROR_LABELS[res.status]?.desc || 'Aktivasi gagal.';
        toast.error(`Aktivasi Gagal: ${msg}`);
        onRefresh();
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal memproses aktivasi lisensi.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLicense = async () => {
    if (!window.alcoLicense) return;
    if (confirm('Hapus lisensi tersimpan di perangkat ini?')) {
      await window.alcoLicense.removeLicense();
      setLicenseInput('');
      toast.info('Lisensi lokal dihapus.');
      onRefresh();
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Ambient background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl shrink-0">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading">
                  ALCO Creative System
                </h1>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  DESKTOP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Aladzan Corpora Ecosystem • App ID: <code className="text-indigo-400 font-mono">alco-creative-system</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl border ${errorInfo.badgeColor} flex items-center gap-1.5`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {errorInfo.title}
            </span>
          </div>
        </div>

        {/* Error Alert Box if present */}
        {licenseState.status !== 'NO_LICENSE' && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-rose-300 uppercase tracking-wide">
                Detail Status: {licenseState.status}
              </div>
              <div className="text-rose-200/80 leading-relaxed">
                {licenseState.error || errorInfo.desc}
              </div>
            </div>
          </div>
        )}

        {/* Hardware Identification Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Device ID Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" /> Device ID Perangkat
              </span>
              <button
                type="button"
                onClick={handleCopyDevId}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
              >
                {copiedDevId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDevId ? 'Tersalin' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-slate-200 font-bold bg-slate-900 px-3 py-2 rounded-xl border border-slate-800/80 break-all select-all">
              {licenseState.deviceId || 'Memuat Device ID...'}
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Terikat secara aman pada konfigurasi hardware perangkat Anda.
            </p>
          </div>

          {/* Request Code Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Request Code
              </span>
              <button
                type="button"
                onClick={handleCopyReqCode}
                disabled={!requestCode}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:bg-slate-800/40 px-2 py-1 rounded-lg border border-indigo-500/20 disabled:border-slate-800 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {copiedReqCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedReqCode ? 'Tersalin' : 'Copy'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <input
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setRequestCode('');
                }}
                placeholder="Customer ID dari owner"
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setRequestCode('');
                }}
                placeholder="Nama customer (opsional)"
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={handleGenerateReqCode}
                disabled={requestLoading || !customerId.trim()}
                className="w-full px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {requestLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>Buat Request Code</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-300 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800/80 truncate select-all">
              {requestCode || 'Isi Customer ID lalu buat Request Code'}
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Berikan Request Code ini kepada owner untuk membuat License Key resmi.
            </p>
          </div>
        </div>

        {/* License Key Input Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-400" /> Kunci Lisensi Resmi (ALCO-LIC-v1)
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Format: <code className="text-indigo-400 font-mono">ALCO-LIC-v1.&lt;payload&gt;.&lt;signature&gt;</code>
              </span>
            </label>
            <textarea
              rows={4}
              value={licenseInput}
              onChange={(e) => setLicenseInput(e.target.value)}
              placeholder="Tempel Kunci Lisensi resmi di sini (contoh: ALCO-LIC-v1.eyJhbGci...)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {licenseState.rawLicenseKey ? (
              <button
                type="button"
                onClick={handleRemoveLicense}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Lisensi Tersimpan</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Verifikasi aman Ed25519 & Device-Bound</span>
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onRefresh}
                title="Muat Ulang Status"
                className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={loading || !licenseInput.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktivasi Lisensi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-medium">
          <div>ALCO License Engine v1.0 • Fail-Closed Client Verification</div>
          <div>Aladzan Corpora © 2026</div>
        </div>

      </div>
    </div>
  );
}
