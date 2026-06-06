import type {OrderDetailApiResponse} from '../services/api';
import {formatDateIST} from './dateUtils';

function fmt(n: number | undefined | null): string {
  if (n == null) return '0';
  return n.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function statusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'delivered': return 'background:#d1fae5;color:#065f46';
    case 'shipped':   return 'background:#ede9fe;color:#5b21b6';
    case 'cancelled': return 'background:#fee2e2;color:#991b1b';
    default:          return 'background:#dbeafe;color:#1e40af';
  }
}

export function generateInvoiceHtml(order: OrderDetailApiResponse): string {
  const vehicleName = [order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
    .filter(Boolean).join(' ') || order.vehicleName || '—';
  const plateNumber  = order.plateNumber  || '—';
  const placedDate   = formatDateIST(order.createdAt, '—');
  const deliveryDate = formatDateIST(order.estimatedDeliveryDate, 'Will be updated');

  const additionalCharges =
    (order.packingCharges    ?? 0) +
    (order.forwardingCharges ?? 0) +
    (order.shippingCharges   ?? 0);
  const grossTotal    = order.totalAmount;
  const discountAmt   = order.discountAmount ?? 0;
  const amountPayable = grossTotal - discountAmt;

  const itemRows = order.items.map((item, idx) => {
    const hasDiscount = item.mrp > 0 && item.mrp > item.unitPrice;
    const mrpCell = hasDiscount
      ? `<span style="text-decoration:line-through;color:#aaa">₹${fmt(item.mrp)}</span>`
      : `₹${fmt(item.mrp || item.unitPrice)}`;
    return `
      <tr>
        <td style="text-align:center;color:#888">${idx + 1}</td>
        <td>
          <div style="font-weight:600;color:#1a1a1a">${item.partName}</div>
          ${item.partNumber ? `<div style="font-size:10px;color:#888;margin-top:2px">${item.partNumber}</div>` : ''}
          ${item.description ? `<div style="font-size:10px;color:#aaa;margin-top:1px">${item.description}</div>` : ''}
        </td>
        <td>${item.brand || '—'}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${mrpCell}</td>
        <td style="text-align:right;font-weight:600">₹${fmt(item.unitPrice)}</td>
        <td style="text-align:right;font-weight:700;color:#1a1a1a">₹${fmt(item.totalPrice)}</td>
      </tr>`;
  }).join('');

  const chargeRows = [
    order.packingCharges    ? `<div class="sum-row"><span>Packing Charges</span><span>₹${fmt(order.packingCharges)}</span></div>`    : '',
    order.forwardingCharges ? `<div class="sum-row"><span>Forwarding Charges</span><span>₹${fmt(order.forwardingCharges)}</span></div>` : '',
    order.shippingCharges   ? `<div class="sum-row"><span>Shipping Charges</span><span>₹${fmt(order.shippingCharges)}</span></div>`   : '',
  ].join('');

  const couponRow = (order.couponCode && discountAmt > 0) ? `
    <div class="sum-row" style="color:#16a34a">
      <span>Coupon Discount <span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700">${order.couponCode}</span></span>
      <span>−₹${fmt(discountAmt)}</span>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:12px; color:#333; padding:28px 32px; }

  /* ── Header ── */
  .header { display:flex; justify-content:space-between; align-items:flex-start;
            border-bottom:2px solid #e5383b; padding-bottom:14px; margin-bottom:20px; }
  .brand-name { font-size:26px; font-weight:900; color:#e5383b; letter-spacing:-0.5px; }
  .brand-sub  { font-size:10px; color:#888; margin-top:3px; }
  .inv-label  { text-align:right; }
  .inv-label h2 { font-size:20px; font-weight:700; color:#222; }
  .inv-label p  { font-size:11px; color:#888; margin-top:2px; }
  .status-chip  { display:inline-block; padding:2px 10px; border-radius:20px;
                  font-size:10px; font-weight:700; text-transform:uppercase;
                  margin-top:6px; letter-spacing:0.5px; }

  /* ── Info grid ── */
  .info-grid { display:flex; gap:12px; margin-bottom:18px; }
  .info-box  { flex:1; background:#f8f8f8; border-radius:8px; padding:12px 14px; }
  .info-box h4 { font-size:9px; font-weight:700; text-transform:uppercase;
                 color:#aaa; letter-spacing:0.8px; margin-bottom:7px; }
  .info-box .main  { font-size:13px; font-weight:700; color:#1a1a1a; margin-bottom:3px; }
  .info-box .sub   { font-size:11px; color:#555; margin-bottom:2px; }
  .info-box .muted { font-size:10px; color:#999; }

  /* ── Items table ── */
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase;
                   color:#999; letter-spacing:0.8px; margin-bottom:8px; }
  table { width:100%; border-collapse:collapse; margin-bottom:18px; }
  thead tr { background:#e5383b; }
  thead th { padding:8px 10px; color:#fff; font-size:10px; font-weight:700;
             text-align:left; letter-spacing:0.3px; }
  thead th.r { text-align:right; }
  thead th.c { text-align:center; }
  tbody tr { border-bottom:1px solid #f0f0f0; }
  tbody tr:nth-child(even) { background:#fafafa; }
  tbody td { padding:8px 10px; font-size:11px; vertical-align:top; }

  /* ── Summary ── */
  .summary-wrap { display:flex; justify-content:flex-end; }
  .summary { width:260px; }
  .sum-row { display:flex; justify-content:space-between; padding:5px 0;
             font-size:12px; border-bottom:1px solid #f5f5f5; }
  .sum-row:last-child { border-bottom:none; }
  .sum-total { display:flex; justify-content:space-between; padding:10px 0 6px;
               border-top:2px solid #e5383b; margin-top:6px;
               font-size:15px; font-weight:900; color:#e5383b; }

  /* ── Footer ── */
  .footer { margin-top:28px; border-top:1px solid #ebebeb; padding-top:12px;
            text-align:center; font-size:10px; color:#bbb; line-height:1.6; }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-name">Parts Now</div>
      <div class="brand-sub">Auto Parts &amp; Services</div>
    </div>
    <div class="inv-label">
      <h2>INVOICE</h2>
      <p>${order.orderNumber}</p>
      <span class="status-chip" style="${statusColor(order.status)}">${order.status}</span>
    </div>
  </div>

  <!-- Info grid -->
  <div class="info-grid">
    <div class="info-box">
      <h4>Bill To</h4>
      <div class="main">${order.workshopName}</div>
      ${order.contactPersonName ? `<div class="sub">${order.contactPersonName}</div>` : ''}
      ${order.workshopPhone     ? `<div class="muted">${order.workshopPhone}</div>`   : ''}
    </div>
    <div class="info-box">
      <h4>Vehicle</h4>
      <div class="main">${vehicleName}</div>
      <div class="sub">${plateNumber}</div>
    </div>
    <div class="info-box">
      <h4>Order Info</h4>
      <div class="sub">Placed: ${placedDate}</div>
      <div class="sub">Delivery: ${deliveryDate}</div>
      ${order.lrNumber ? `<div class="muted">LR: ${order.lrNumber}</div>` : ''}
    </div>
  </div>

  <!-- Items -->
  <div class="section-title">Order Items</div>
  <table>
    <thead>
      <tr>
        <th class="c" style="width:28px">#</th>
        <th>Part Name</th>
        <th style="width:80px">Brand</th>
        <th class="c" style="width:36px">Qty</th>
        <th class="r" style="width:70px">MRP</th>
        <th class="r" style="width:80px">Unit Price</th>
        <th class="r" style="width:80px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Summary -->
  <div class="summary-wrap">
    <div class="summary">
      <div class="sum-row">
        <span style="color:#888">Parts Subtotal</span>
        <span>₹${fmt(grossTotal - additionalCharges)}</span>
      </div>
      ${chargeRows}
      ${couponRow}
      <div class="sum-total">
        <span>Amount Payable</span>
        <span>₹${fmt(amountPayable)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This is a computer-generated invoice and does not require a physical signature.</p>
    <p style="margin-top:6px;color:#e5383b">Parts Now — Auto Parts &amp; Services</p>
  </div>

</body>
</html>`;
}
