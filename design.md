# design.md

## Before designing

Work like a designer who's seen a thousand generic SaaS landing pages and
refuses to ship the thousand-and-first. Generic is the default failure
mode — plain hero, centered headline, three feature cards, gradient blob,
"Get Started" button. If what you're about to build could be reskinned
for any other product with a find-and-replace, it's slop. Stop and
rethink before you write a line of markup.

### 1. Identify the product type first
Before touching the landing page, work out what kind of product this is —
dev tool, consumer app, fintech, creative tool, B2B SaaS, marketplace,
game, agent/AI product — and research what good design looks like *for
that category specifically*, not design in general. A dev tool and a
consumer social app should not look, move, or feel the same. Pull 3-5
real reference sites in the same category (see Sources) before deciding
on direction, and name them in your plan so I know what you're anchoring to.

### 2. Landing page is the anchor
Start there. It sets the type scale, spacing rhythm, color system, motion
language, and component style that the rest of the product inherits.
Don't design screens in isolation — decide the system on the landing
page, then carry it through. If the landing page is generic, everything
downstream will be too.

### 3. Have an actual point of view
Pick a specific direction and commit: a distinct type pairing (not
Inter+Inter), a real color story (not default violet-to-blue gradient on
dark), an intentional layout (not centered-column-everything), and a
motion language that's consistent, not sprinkled-on. State the direction
in one line before building — "editorial/serif, high-contrast, sharp
edges" or "playful, rounded, high-saturation" — and hold to it.

### 4. Real images: never fake it
Don't invent a fake photo, don't use a broken/placeholder image URL, and
don't describe an image with a gray box and "[image here]." When the
design calls for a real photo or illustration you can't generate or
source yourself:
  - **Ask.** Tell me exactly what's needed ("a hero photo of X, mood Y")
    and give me 2-3 concrete options — stock sites to pull from, an
    AI-image prompt for me to run, or "send me your own" — and let me
    choose.
  - **Or build it instead of faking it.** If the moment calls for
    visual richness and a real photo isn't essential to the concept, use
    Three.js/WebGL, SVG, gradients, or generative/procedural visuals in
    its place. A well-made 3D scene or abstract generative background
    beats a stretched stock photo every time.
Never ship a visually empty placeholder as if it were finished.

### 5. Don't hand-roll what a good library already solved
Use component libraries and primitives for structure and accessibility
(menus, dialogs, tooltips, form controls), then restyle them to match
your direction. Don't reinvent a dropdown from scratch, and don't ship a
library's default theme unmodified either — untouched defaults are the
other flavor of slop.

### 6. Motion is a design decision, not a garnish
If you add animation, it should support hierarchy (draw attention to
what matters, in order) not decorate everything equally. Prefer a few
well-placed, physically-plausible motions (spring easing, real
parallax, scroll-linked reveals) over animating every element the same
way. Respect `prefers-reduced-motion`.

### 7. Proportionality
A single component or a small tweak doesn't need a full direction
statement — just build it to match the existing system. A new landing
page, a new product surface, or "give this a redesign" gets the full
treatment: identify product type, pull references, state direction,
then build.

### 8. Before I approve a big design
State: product type, 2-3 reference sites you're anchoring to, one-line
direction (type/color/motion), and where any real images are needed —
then wait if the surface is large (full landing page, new product area).
Small components/pages: just build and show the result.

---

## Sources

**Component libraries / primitives** (style these, don't ship them bare)
- shadcn/ui — https://ui.shadcn.com
- Radix Primitives — https://www.radix-ui.com
- Origin UI — https://originui.com
- HyperUI — https://www.hyperui.dev
- Headless UI — https://headlessui.com

**Pre-styled / animated component inspiration** (good for motion + flair,
still restyle to your direction, don't paste unmodified)
- Aceternity UI — https://ui.aceternity.com
- Magic UI — https://magicui.design
- 21st.dev — https://21st.dev
- Motion Primitives — https://motion-primitives.com
- Tailwind UI — https://tailwindui.com

**Landing page / full-site reference** (for direction-finding per product
category, not for copying)
- Land-book — https://land-book.com
- Godly — https://godly.website
- Mobbin — https://mobbin.com
- Awwwards — https://www.awwwards.com
- SaaS Landing Page (curated SaaS specifically) — https://saaslandingpage.com

**Three.js / WebGL** (for real-visual substitutes and 3D/interactive
moments)
- Three.js docs + examples — https://threejs.org/examples
- React Three Fiber — https://docs.pmnd.rs/react-three-fiber
- Drei (R3F helpers) — https://github.com/pmndrs/drei
- Three.js Journey (technique reference) — https://threejs-journey.com
- Codrops (WebGL/GSAP experiments) — https://tympanus.net/codrops
- Spline (design-tool-to-web 3D, no-code option) — https://spline.design

**Real images / illustration**
- Unsplash — https://unsplash.com
- Pexels — https://www.pexels.com
- unDraw (illustrations, styleable) — https://undraw.co
- Humaaans (illustrated people) — https://www.humaaans.com
- Ask the user directly for brand/product-specific photos when stock
  won't do — never substitute a generic stock photo for something that
  needs to look like *this* product.

**Icons**
- Lucide — https://lucide.dev
- Phosphor Icons — https://phosphoricons.com
- Radix Icons — https://www.radix-ui.com/icons

**Fonts**
- Fontshare (free, well-curated, less overused than Google Fonts
  defaults) — https://www.fontshare.com
- Google Fonts — https://fonts.google.com (fine, but avoid Inter-for-
  everything; pick something with more character when the direction
  calls for it)
