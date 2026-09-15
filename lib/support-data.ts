export const orders = [
  { id: "NB-1042", status: "Out for delivery", eta: "Today by 8 PM", item: "Orbit ANC Headphones", eligible: false },
  { id: "NB-1038", status: "Delivered", eta: "Delivered 12 Sep 2026", item: "Arc Wireless Keyboard", eligible: true },
  { id: "NB-1031", status: "Processing", eta: "Expected 18 Sep 2026", item: "Halo Smart Lamp", eligible: true },
  { id: "NB-1027", status: "Refunded", eta: "Refund completed 10 Sep 2026", item: "Pulse Fitness Band", eligible: false },
  { id: "NB-1019", status: "Cancelled", eta: "Cancelled by customer", item: "Drift Travel Charger", eligible: false },
];

export const articles = [
  { id: "shipping", title: "Shipping Policy", section: "Delivery timelines", keywords: ["shipping", "delivery", "arrive", "how long", "late"], content: "Standard delivery takes 3–5 business days after dispatch. Express delivery takes 1–2 business days in eligible pin codes. Tracking updates can take up to 24 hours after dispatch." },
  { id: "tracking", title: "Shipping Policy", section: "Order tracking", keywords: ["track", "tracking", "where", "order", "status"], content: "Customers can track an order using its order ID. If tracking has not changed for 48 hours after dispatch, support should create a delivery investigation ticket." },
  { id: "returns", title: "Returns & Refunds", section: "Return eligibility", keywords: ["return", "used", "exchange", "opened"], content: "Most unused products can be returned within 14 calendar days of delivery with original packaging and accessories. Used products are accepted only when verified as defective. Hygiene-sensitive and personalized items are not returnable." },
  { id: "refunds", title: "Returns & Refunds", section: "Refund timeline", keywords: ["refund", "money", "reversal", "credited"], content: "Approved refunds are initiated within 2 business days. Banks and payment providers may take an additional 5–7 business days to reflect the amount. Support cannot promise an exact bank processing date." },
  { id: "cancel", title: "Order Policy", section: "Cancellation", keywords: ["cancel", "cancellation", "stop order"], content: "An order can be cancelled before it is packed. After packing, customers must wait for delivery and request a return if the product is eligible." },
  { id: "warranty", title: "Product Support", section: "Warranty", keywords: ["warranty", "defect", "broken", "not working"], content: "Northstar electronics include a 12-month limited warranty for manufacturing defects. Accidental or liquid damage is not covered. Support may request the order ID, serial number, and a photo or short video." },
  { id: "account", title: "Account Help", section: "Account access", keywords: ["login", "password", "account", "otp"], content: "Use the Forgot Password link to request a secure reset email. Support will never ask for a password, full card number, CVV, or one-time password." },
  { id: "payments", title: "Payment FAQ", section: "Failed or duplicate payments", keywords: ["payment", "charged", "duplicate", "card", "upi"], content: "A failed payment may remain pending temporarily and normally reverses automatically within 5–7 business days. Duplicate charges and payments still missing after 7 business days require a high-priority payment ticket." },
];

export function detectIntent(message: string) {
  const text = message.toLowerCase();
  if (/human|person|agent|representative|manager/.test(text)) return "human_escalation";
  if (/refund|money back|reversal/.test(text)) return "refund_request";
  if (/cancel/.test(text)) return "cancellation";
  if (/order|track|delivery|arrive|where/.test(text)) return "order_status";
  if (/return|exchange/.test(text)) return "return_request";
  if (/broken|not working|defect|warranty|technical/.test(text)) return "technical_support";
  if (/complaint|angry|terrible|fraud|legal|privacy|charged twice/.test(text)) return "complaint";
  return "product_information";
}

export function retrieve(message: string) {
  const words = new Set(message.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  return articles.map((article) => ({ article, score: article.keywords.reduce((sum, key) => sum + (message.toLowerCase().includes(key) || words.has(key) ? 1 : 0), 0) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);
}
