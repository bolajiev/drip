# MOBILEFIX.md — Wallet Connect Reversal + Empty State Space

Read PLAN.md, DRIP.md, REFERENCE.md, LANDING.md, APP.md, DRIPBUG.md, and
STATES.md first. Two fixes from testing on an actual phone: one reverses an
earlier decision, one fixes wasted space in the State 0 skeleton.

## 1. Reversing DRIPBUG.md #3 — WalletConnect is no longer optional

DRIPBUG.md marked broader wallet support "skip for this hackathon" as a
nice-to-have. That call is reversed: on mobile, with no browser extension
installed, "Connect Wallet" currently has nothing to connect to — MetaMask
and Rabby only work as injected browser extensions, which mobile browsers
don't support. This isn't polish, it's a hard blocker on the actual device
most non-technical customers (and you, testing right now) will use.

**Fix**: add `wagmi` + `RainbowKit`.
- Get a free WalletConnect Cloud project ID.
- Wrap the app in `WagmiProvider` + `RainbowKitProvider`.
- Swap the current connect button for RainbowKit's `<ConnectButton />`.
- This is additive, not a rebuild — MetaMask/Rabby keep working exactly as
  they do now for desktop users. WalletConnect only adds the missing path:
  on mobile, RainbowKit shows wallet options that deep-link straight into
  an installed wallet app (MetaMask mobile, etc.) instead of expecting an
  extension that can't exist there.

**Priority**: do this before further polish. Nothing else matters if the
core action of the app doesn't work on a phone.

## 2. Empty-state dead space

**Wrong**: the not-connected skeleton (State 0, per STATES.md) forces a
tall/full-viewport container, then pins the footer to the bottom of that
forced height. Result: a small card near the top, a large empty gap, and
the footer stranded far below with nothing between them.

**Structural fix first**: stop forcing a tall minimum height on this state.
Let the page size to its actual content — skeleton rows + connect card —
and let the footer sit directly underneath in normal document flow. If
some vertical centering was intentional for large screens, cap it (e.g.
`min-height: 60vh` at most), don't let it stretch this far on mobile.

**Then, don't just shrink the gap — give any remaining space something
real to do**, instead of leaving it blank. Two additions, both reusing
copy that's already approved elsewhere rather than inventing anything new:

- **Label the skeleton rows instead of leaving them as bare gray bars.**
  A ghost row with a small caption under it ("your plans will appear
  here," "subscriber count," "withdrawable balance" for Merchant; "your
  subscriptions will appear here" for My Subscriptions) turns the skeleton
  from decoration into an actual preview of what the app does. This is
  still a structural preview, not fake data — consistent with the
  no-fake-content rule already set on the landing page.
- **A compact version of the trust block from LANDING.md**, directly under
  the connect card: "Streaming logic forked from Sablier's audited
  contracts. Non-custodial — funds sit in the contract, not with Drip.
  Cancel anytime, get back what hasn't streamed yet." Three lines, reused
  copy, not new writing. This answers "why should I trust this" right at
  the exact moment someone is deciding whether to connect a wallet, which
  is a better spot for it than only living on the landing page.

**What NOT to do**: don't fill the space with a "how it works" full section
restated from the landing page — that's a homepage doing a homepage's job
a second time. The compact trust block plus labeled skeleton is enough; if
there's still extra room after both, that's fine, a moderate gap is normal,
the goal was fixing the forced full-viewport stretch, not eliminating all
whitespace.

## What "done" looks like

Someone opens the app on a phone with no browser extension, taps Connect,
and a wallet-app option actually appears and works. The screen before that
tap looks like a preview of a real product, not a card floating in an
otherwise blank page.
