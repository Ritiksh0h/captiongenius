import { Resend } from "resend";

const resend    = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || "ritikshah6633@gmail.com";
const BASE_URL    = process.env.NEXTAUTH_URL || "http://localhost:3000";

export type MetricAlert = {
  type:      "users" | "storage_mb" | "groq_daily" | "neon_rows";
  value:     number;
  threshold: number;
  status:    "warning" | "exceeded";
};

const METRIC_LABELS: Record<MetricAlert["type"], string> = {
  users:       "Total Users",
  storage_mb:  "R2 Storage (MB)",
  groq_daily:  "Groq API Calls Today",
  neon_rows:   "Neon DB Row Count",
};

function pct(value: number, threshold: number) {
  return Math.round((value / threshold) * 100);
}

function statusColor(status: "warning" | "exceeded") {
  return status === "exceeded" ? "#FF5A3C" : "#f59e0b";
}

function metricRow(alert: MetricAlert): string {
  const label  = METRIC_LABELS[alert.type];
  const color  = statusColor(alert.status);
  const pctVal = pct(alert.value, alert.threshold);
  return `
    <tr>
      <td style="padding:8px 0;color:#a3a3a3;font-size:13px;">${label}</td>
      <td style="padding:8px 0;font-size:13px;font-weight:600;color:${color};">
        ${alert.value.toLocaleString()} / ${alert.threshold.toLocaleString()}
        <span style="font-weight:400;color:#525252;"> (${pctVal}%)</span>
      </td>
      <td style="padding:8px 0;">
        <span style="background:${color}20;color:${color};padding:2px 8px;
          border-radius:99px;font-size:11px;font-weight:600;text-transform:uppercase;">
          ${alert.status}
        </span>
      </td>
    </tr>`;
}

export async function sendCostAlert(alerts: MetricAlert[]): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email-alerts] RESEND_API_KEY not set — skipping alert email");
    return;
  }

  const hasExceeded = alerts.some((a) => a.status === "exceeded");
  const subject     = hasExceeded
    ? "🚨 CaptionGenius — Usage limit EXCEEDED — action required"
    : "⚠️ CaptionGenius — Usage approaching limits";

  const approveUrl = `${BASE_URL}/api/admin/kill-switch/approve?secret=${process.env.KILL_SWITCH_SECRET}&action=approve`;
  const denyUrl    = `${BASE_URL}/api/admin/kill-switch/approve?secret=${process.env.KILL_SWITCH_SECRET}&action=deny`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;
      background:#0A0A0A;color:#F7F6F1;padding:32px;border-radius:12px;">

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="background:#C7F035;color:#0A0A0A;width:28px;height:28px;
          border-radius:6px;display:flex;align-items:center;justify-content:center;
          font-weight:900;font-size:14px;">C</div>
        <span style="font-weight:700;font-size:16px;">CaptionGenius</span>
      </div>

      <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;">
        ${hasExceeded ? "🚨 Usage limit exceeded" : "⚠️ Usage approaching limits"}
      </h1>
      <p style="color:#a3a3a3;font-size:13px;margin:0 0 24px;">
        ${new Date().toUTCString()}
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 0;color:#525252;font-size:11px;
              text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Metric</th>
            <th style="text-align:left;padding:8px 0;color:#525252;font-size:11px;
              text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Value / Limit</th>
            <th style="text-align:left;padding:8px 0;color:#525252;font-size:11px;
              text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Status</th>
          </tr>
        </thead>
        <tbody>${alerts.map(metricRow).join("")}</tbody>
      </table>

      ${hasExceeded ? `
        <div style="background:#FF5A3C15;border:1px solid #FF5A3C40;
          border-radius:8px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#FF5A3C;">
            Operations are now paused
          </p>
          <p style="margin:0;font-size:13px;color:#a3a3a3;">
            Caption generation and image uploads have been suspended.
            Click <strong style="color:#F7F6F1;">Resume Operations</strong> to re-enable the app.
          </p>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:24px;">
          <a href="${approveUrl}"
            style="flex:1;display:block;background:#C7F035;color:#0A0A0A;
              padding:12px;border-radius:8px;text-decoration:none;
              font-weight:700;font-size:14px;text-align:center;">
            ✓ Resume Operations
          </a>
          <a href="${denyUrl}"
            style="flex:1;display:block;background:#1a1a1a;color:#F7F6F1;
              padding:12px;border-radius:8px;text-decoration:none;
              font-weight:600;font-size:14px;text-align:center;
              border:1px solid #2a2a2a;">
            ✗ Keep Paused
          </a>
        </div>
      ` : `
        <p style="color:#a3a3a3;font-size:13px;margin-bottom:20px;">
          No action required yet — operations are running normally.
        </p>
      `}

      <a href="${BASE_URL}/admin/health"
        style="display:inline-block;color:#C7F035;font-size:13px;
          text-decoration:none;border-bottom:1px solid #C7F03540;">
        View health dashboard →
      </a>

      <p style="color:#2a2a2a;font-size:11px;margin-top:32px;">
        CaptionGenius admin alert · sent to ${ADMIN_EMAIL}
      </p>
    </div>`;

  await resend.emails.send({
    from:    "CaptionGenius Alerts <onboarding@resend.dev>",
    to:      ADMIN_EMAIL,
    subject,
    html,
  });

  console.log(`[email-alerts] Sent ${hasExceeded ? "EXCEEDED" : "warning"} alert to ${ADMIN_EMAIL}`);
}
