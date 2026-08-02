# DRIPBUG.md — Fixes & Updates from UI Review

Read PLAN.md, DRIP.md, REFERENCE.md, LANDING.md, and APP.md first. This file
is the punch list from reviewing the live build — what's wrong, what to do
about it, and why. Scoped for a hackathon deadline: fix what's listed here,
don't expand beyond it without checking in first.

## 1. Merchant and Customer pre-connect screens are identical

**Wrong**: both tabs show the exact same copy — "Connect a wallet on
Coston2 to begin," same MetaMask/Rabby/chain-id text — regardless of which
tab is selected.

**Fix, minimum bar for this hackathon**: give each tab its own copy.
- Merchant: "Connect a wallet to create and manage your plans."
- Customer: "Connect a wallet to view your subscriptions."

**Fix, the real one, already speced in APP.md**: a customer's actual entry
point is never this generic tab — it's a specific merchant's link
(`/pay/[planId]`), showing that plan's price/period/merchant name before
any wallet action. Build that page if time allows; it matters more than the
copy fix above. If it ships, rename the current generic "Customer" nav tab
to **"My Subscriptions"** — it becomes a returning customer's dashboard of
what they've already paid for, not a stranger's first entry point.

**Priority**: do the copy fix regardless of time. Do the real fix if there's
room — it's the difference between a demo that looks unfinished and one
that tells the actual product story.

## 2. Footer contract addresses are truncated with no way to copy them

**Wrong**: addresses show as `0x79fa…f3d9` with no copy action and no link
— worse than not showing them at all, since it looks like something's
being hidden instead of proven.

**Fix**: make each address a link straight to its Coston2 explorer page
(`coston2-explorer.flare.network/address/0x...`) instead of adding a copy
button. This serves the actual purpose better — someone checking an
address wants to see it's real and look at its activity, not paste it
somewhere.

**Also**: the full deployment list already lives on `/docs` (already built,
looks good, don't touch it). Trim the footer to one line — "Contracts &
deployment →" linking to the docs deployment section — instead of
duplicating four raw addresses on every page.

## 3. Wallet connect screen exposes raw developer details to everyone

**Wrong**: "MetaMask / Rabby · chain id 114 · RPC
https://coston2-api.flare.network/ext/C/rpc" is shown to every visitor.
This is debug text, not onboarding copy — most people don't know what a
chain ID is, and this directly undercuts the "easy, trustless" pitch on the
landing page.

**Fix**: use `wallet_addEthereumChain` (EIP-3085) so connecting is one tap
that silently configures Coston2 — no RPC URL or chain ID shown to the
user. Move that raw detail behind an "advanced" disclosure or onto the docs
page, where it already belongs.

**Also add**: one line explaining *why* a wallet is needed, tied to the
trust story already on the landing page — e.g. "This wallet is how you
cancel and get refunds — only you control it." Right now it just says
"connect to begin," which reads as a gate, not a benefit.

**Skip for this hackathon**: broadening wallet support beyond MetaMask/
Rabby (e.g. WalletConnect for mobile wallets). Real improvement, bigger
lift than the deadline allows — note it, don't build it now.

## 4. Merchant page has no onboarding structure

**Wrong**: nothing guides a merchant from "just connected" to "has a live
plan and a shareable link."

**Fix**: a three-step checklist, visible until complete, then collapses
into a thin "Setup complete ✓" strip:

1. **Connect Wallet** — "This is where subscriber payments land, and how
   you'll withdraw them. One tap." Done state: checkmark + truncated
   address, address links to the explorer (see #2).
2. **Set your price** — "Name, price in FXRP, how often it bills. You can
   add more plans later." Billing period shows as **Monthly, locked**,
   with a small note like "more periods coming soon" — be upfront about
   the MVP limit, don't hide it.
3. **Share your link** — "Anyone who opens it can subscribe with XRP they
   already hold. No wallet setup required on their side to start — just to
   pay." Shows the generated link + QR + copy button, large and central —
   this is the actual artifact a merchant walks away with.

## 5. Zero-subscriber state is a dead end

**Wrong**: nothing to check here yet, but don't let the post-setup
dashboard go blank if there are no subscribers.

**Fix**: if the subscriber list is empty, show a message that restates the
benefit and the next action — "No subscribers yet — share your link
above" — not an empty table with nothing else on the screen.

## Explicitly not in scope for this hackathon

- **Sample/demo data on the dashboard** (a labeled fake subscriber row to
  preview what an active subscription looks like). Real pattern, real
  value, but skip it — not worth the build time against this deadline.
- **WalletConnect / broader wallet support** — see #3.
- Anything not listed above. If something new comes up during the build,
  flag it before expanding scope, don't just add it.

## What's already good — leave alone

- The `/docs` page (architecture, contracts, deployment addresses, repo
  link, test coverage). Structurally solid, don't touch it beyond linking
  the footer to it per #2.
- The XRP payment side (Xaman deep link flow from APP.md) — already
  low-friction for non-technical XRP holders. The wallet-connect step is
  the one piece of friction left, because it's the newer ask.
