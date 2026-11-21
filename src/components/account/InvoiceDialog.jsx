import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate, formatINR } from "@/lib/format";
import StatusBadge from "@/components/account/StatusBadge";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default function InvoiceDialog({ open, onOpenChange, purchase }) {
  if (!purchase) return null;

  const print = () => {
    const rows = `
      <tr>
        <td style="padding:10px 0">${escapeHtml(purchase.blueprint_title)} — full blueprint access</td>
        <td style="padding:10px 0;text-align:right">${formatINR(purchase.amount)}</td>
      </tr>`;
    const html = `<!doctype html><html><head><title>Invoice ${escapeHtml(purchase.invoice_number)}</title>
      <style>body{font-family:Helvetica,Arial,sans-serif;color:#1b2a27;padding:48px;max-width:720px;margin:0 auto}
      h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}
      th{text-align:left;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b7a76;border-bottom:1px solid #dcd9d1;padding-bottom:8px}
      .total{border-top:1px solid #dcd9d1;font-weight:600}.muted{color:#6b7a76;font-size:13px}</style></head>
      <body>
        <h1>BizPath</h1>
        <p class="muted">Tax invoice</p>
        <p class="muted">Invoice ${escapeHtml(purchase.invoice_number)}<br/>Date ${escapeHtml(formatDate(purchase.purchased_at || purchase.created_date))}<br/>
        Billed to ${escapeHtml(purchase.created_by || "Customer")}</p>
        <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${rows}<tr class="total"><td style="padding:12px 0">Total</td><td style="padding:12px 0;text-align:right">${formatINR(purchase.amount)}</td></tr></tbody></table>
        <p class="muted" style="margin-top:24px">Payment status: ${escapeHtml(purchase.status)} · Method: ${escapeHtml(purchase.payment_method || "—")}</p>
        <p class="muted">This invoice covers digital access to one business blueprint. Figures inside the blueprint are the creator's documented experience, not a guarantee of returns.</p>
      </body></html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice {purchase.invoice_number}</DialogTitle>
          <DialogDescription>
            Issued {formatDate(purchase.purchased_at || purchase.created_date)}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{purchase.blueprint_title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Full blueprint access · {purchase.creator_name || "BizPath creator"}
              </p>
            </div>
            <p className="font-display text-lg">{formatINR(purchase.amount)}</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span>Payment method: {purchase.payment_method || "—"}</span>
            <StatusBadge status={purchase.status} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={print}>Print / save as PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}