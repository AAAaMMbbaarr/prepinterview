# 🚀 Interview Intelligence Pro (Commercial SaaS Edition)

> **The Monetized AI Career Intelligence & Mock Interview Platform with Hybrid Paywall, Stripe & Razorpay Checkout, and Rewarded Sponsor Ad Unlocks.**

---

## 💼 Business & Monetization Architecture

This edition of Interview Intelligence is engineered as a **commercial B2C SaaS product** with high-converting hybrid monetization:

```
                          Candidate visits app
                                   │
                                   ▼
          ┌──────────────────────────────────────────────────┐
          │  Free Tier: Fit Score + Questions 1 & 2 Unlocked │
          └────────────────────────┬─────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │  Gated Intelligence (Q3–10, Attack Mode, Full Voice) │
        └──────────────────────────┬───────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
    ┌─────────────────────────┐         ┌─────────────────────────┐
    │  ⚡ 10s Sponsor Ad /    │         │  👑 Pro Pass Instant    │
    │  Affiliate Partner      │         │  $4.99 USD / ₹199 INR   │
    │  (Unlocks per feature)  │         │  (Unlocks Everything)   │
    └─────────────────────────┘         └─────────────────────────┘
```

---

## 💳 Payment Gateway Integration

### 1. Stripe (Global Cards, Apple Pay, Google Pay)
1. In your [Stripe Dashboard](https://dashboard.stripe.com/payment-links), create a Payment Link for **$4.99** (one-time) or **$9.00/month**.
2. Under **After payment**, set the redirect URL to:
   ```
   https://your-domain.com/?session=paid
   ```
3. Set your environment variable:
   ```env
   STRIPE_PAYMENT_URL="https://buy.stripe.com/your_live_link"
   ```

### 2. Razorpay (India: UPI, GPay, PhonePe, Paytm, Cards)
1. In your [Razorpay Dashboard](https://dashboard.razorpay.com/#/access/paymentpages), create a Payment Page for **₹199**.
2. Set the redirect URL to:
   ```
   https://your-domain.com/?session=paid
   ```
3. Set your environment variable:
   ```env
   RAZORPAY_PAYMENT_URL="https://rzp.io/l/your_live_link"
   ```

### 3. URL Parameter Auto-Unlock
When customers return from checkout with `?session=paid` or `?pass=PRO2026`, the application instantly sets `is_pro = True` and removes all locks automatically.

---

## 📢 Rewarded Sponsor Ads / Affiliate Partners

When candidates choose to unlock free content, a high-converting 10-second sponsor card appears with a live progress bar.

You can plug in real affiliate partnerships (e.g. Resume.io, Coursera, LeetCode, AlgoExpert) where each signup earns **$15–$50 per referral**.

---

## 🌐 Custom Domain Setup

To run this commercial app under your own branded domain (e.g. `interviewintelligence.ai` or `prepcareer.com`):

1. Purchase a domain on [Cloudflare](https://cloudflare.com) or [Namecheap](https://namecheap.com) (~$9/year).
2. Deploy this repository to Streamlit Community Cloud (or Railway / Render / DigitalOcean).
3. In Streamlit Cloud, go to **Settings ➔ Custom Domain** and point your domain's CNAME record.

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root:

```env
# Required AI API Key
GOOGLE_API_KEY="your_gemini_api_key"

# Optional Custom Payment Links (defaults to test placeholders if omitted)
STRIPE_PAYMENT_URL="https://buy.stripe.com/your_stripe_link"
RAZORPAY_PAYMENT_URL="https://rzp.io/l/your_razorpay_link"
```

---

## 📄 License & Distribution

Commercial SaaS Template. Engineered by [AAAaMMbbaarr](https://github.com/AAAaMMbbaarr).
