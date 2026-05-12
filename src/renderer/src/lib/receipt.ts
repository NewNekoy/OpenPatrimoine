import type { AppSettings, RentPayment, Tenant, Property } from '../types/entities'

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(s?: string): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function period(dueDate: string): string {
  const d = new Date(dueDate)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function buildReceiptHtml(
  owner: AppSettings,
  tenant: Tenant,
  property: Property,
  rent: RentPayment
): string {
  const loyer = tenant.monthlyRent
  const charges = tenant.charges ?? 0
  const total = rent.amount

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: white; padding: 40px; }
  h1 { font-size: 22px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: #666; margin-bottom: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
  .card { background: #f8f8f8; border-radius: 8px; padding: 16px 20px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .line { color: #555; line-height: 1.7; }
  .divider { border: none; border-top: 1px solid #e8e8e8; margin: 28px 0; }
  .amounts { margin-bottom: 28px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-child { border-bottom: none; }
  .label { color: #555; }
  .value { font-weight: 500; }
  .total-row { display: flex; justify-content: space-between; background: #1a1a1a; color: white; padding: 14px 20px; border-radius: 8px; margin-top: 8px; }
  .total-label { font-weight: 600; font-size: 14px; }
  .total-value { font-weight: 700; font-size: 16px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 36px; }
  .meta-item .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 4px; }
  .meta-item .val { font-weight: 500; }
  .signature-block { display: flex; justify-content: flex-end; }
  .signature-box { width: 240px; }
  .signature-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
  .signature-area { border: 1px solid #ddd; border-radius: 6px; height: 72px; }
  .mention { font-size: 10px; color: #aaa; line-height: 1.6; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e8e8e8; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Quittance de loyer</h1>
      <div class="subtitle">Période : ${period(rent.dueDate)}</div>
    </div>
    <div style="text-align:right; color:#999; font-size:12px;">
      Émise le ${fmtDate(rent.paidDate ?? new Date().toISOString().slice(0, 10))}
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="section-title">Bailleur</div>
      <div class="card">
        <div class="name">${owner.ownerName || '—'}</div>
        <div class="line">${owner.ownerAddress || ''}</div>
        <div class="line">${[owner.ownerPostalCode, owner.ownerCity].filter(Boolean).join(' ')}</div>
        ${owner.ownerPhone ? `<div class="line" style="margin-top:6px;">${owner.ownerPhone}</div>` : ''}
        ${owner.ownerEmail ? `<div class="line">${owner.ownerEmail}</div>` : ''}
      </div>
    </div>
    <div>
      <div class="section-title">Locataire</div>
      <div class="card">
        <div class="name">${tenant.firstName} ${tenant.lastName}</div>
        <div class="line" style="margin-top:6px; font-weight:500; color:#333;">${property.name}</div>
        <div class="line">${property.address}</div>
        <div class="line">${property.city}</div>
      </div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item">
      <div class="label">Période couverte</div>
      <div class="val">${period(rent.dueDate)}</div>
    </div>
    <div class="meta-item">
      <div class="label">Date d'échéance</div>
      <div class="val">${fmtDate(rent.dueDate)}</div>
    </div>
    <div class="meta-item">
      <div class="label">Date de paiement</div>
      <div class="val">${fmtDate(rent.paidDate)}</div>
    </div>
  </div>

  <div class="amounts">
    <div class="section-title">Détail du règlement</div>
    <div style="border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden; margin-top: 8px;">
      <div style="padding: 0 16px;">
        <div class="row"><span class="label">Loyer hors charges</span><span class="value">${fmt(loyer)}</span></div>
        ${charges > 0 ? `<div class="row"><span class="label">Charges locatives</span><span class="value">${fmt(charges)}</span></div>` : ''}
      </div>
    </div>
    <div class="total-row">
      <span class="total-label">Total reçu</span>
      <span class="total-value">${fmt(total)}</span>
    </div>
  </div>

  <div class="signature-block">
    <div class="signature-box">
      <div class="signature-title">Signature du bailleur</div>
      <div class="signature-area"></div>
    </div>
  </div>

  <div class="mention">
    Cette quittance annule tous les reçus qui auraient pu être établis précédemment pour la même période.
    La présente quittance est délivrée pour valoir ce que de droit.
  </div>
</body>
</html>`
}
