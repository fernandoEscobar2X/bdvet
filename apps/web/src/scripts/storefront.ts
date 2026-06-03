import Swiper from "swiper";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import Lenis from "lenis";

import type { Product } from "@/domain/product";
import type { CartItem, CartSnapshot } from "@/domain/cart";
import { WhatsAppCheckoutAdapter } from "@/integrations/checkout/whatsapp-checkout";

type GsapTween = {
  pause: () => GsapTween;
  play: () => GsapTween;
  reverse: () => GsapTween;
  kill: () => void;
};

type GsapTimeline = GsapTween & {
  to: (targets: unknown, vars: Record<string, unknown>, position?: number | string) => GsapTimeline;
  from: (targets: unknown, vars: Record<string, unknown>, position?: number | string) => GsapTimeline;
  fromTo: (
    targets: unknown,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
    position?: number | string,
  ) => GsapTimeline;
  set: (targets: unknown, vars: Record<string, unknown>, position?: number | string) => GsapTimeline;
};

type GsapQuickTo = (value: number) => void;
type GsapQuickSetter = (value: number | string) => void;

type GsapLike = {
  set: (targets: unknown, vars: Record<string, unknown>) => void;
  to: (targets: unknown, vars: Record<string, unknown>) => GsapTween;
  from: (targets: unknown, vars: Record<string, unknown>) => GsapTween;
  fromTo: (
    targets: unknown,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ) => GsapTween;
  timeline: (vars?: Record<string, unknown>) => GsapTimeline;
  killTweensOf: (targets: unknown) => void;
  quickTo: (
    target: unknown,
    property: string,
    vars?: Record<string, unknown>,
  ) => GsapQuickTo;
  quickSetter: (target: unknown, property: string, unit?: string) => GsapQuickSetter;
  registerPlugin?: (...plugins: unknown[]) => void;
  ticker: {
    add: (fn: (time: number) => void) => void;
    remove: (fn: (time: number) => void) => void;
    lagSmoothing: (threshold: number, adjustedLag?: number) => void;
  };
  utils: {
    clamp: (min: number, max: number, value: number) => number;
    mapRange: (
      inMin: number,
      inMax: number,
      outMin: number,
      outMax: number,
      value: number,
    ) => number;
  };
};

type ScrollTriggerInstance = {
  refresh: (safe?: boolean) => void;
  update: () => void;
  kill: () => void;
};

type ScrollTriggerLike = {
  create: (vars: Record<string, unknown>) => ScrollTriggerInstance;
  batch: (targets: unknown, vars: Record<string, unknown>) => ScrollTriggerInstance[];
  refresh: (safe?: boolean) => void;
  update: () => void;
  getAll: () => ScrollTriggerInstance[];
};

type GsapStack = {
  gsap: GsapLike;
  ScrollTrigger: ScrollTriggerLike | null;
};

type StorefrontPayload = {
  products: Product[];
  site: {
    businessName: string;
    phoneRaw: string;
  };
};

declare global {
  interface Window {
    __BORDERVET__?: StorefrontPayload;
    __BORDERVET_LENIS__?: Lenis | null;
    gsap?: GsapLike;
    ScrollTrigger?: ScrollTriggerLike;
  }
}

const CART_STORAGE_KEY = "bordervet-cart-v1";
const PRODUCT_PLACEHOLDER = "/images/placeholders/product-placeholder.svg";
const GSAP_RUNTIME_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js";
const SCROLLTRIGGER_RUNTIME_URL =
  "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js";

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const payload = window.__BORDERVET__;
const products = payload?.products ?? [];
const productMap = new Map(products.map((product) => [product.id, product]));

let gsapPromise: Promise<GsapLike | null> | null = null;
let gsapStackPromise: Promise<GsapStack | null> | null = null;

const loadScript = (src: string, marker: string): Promise<boolean> =>
  new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[${marker}="true"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute(marker, "true");
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.append(script);
  });

const loadGsap = (): Promise<GsapLike | null> => {
  if (window.gsap) return Promise.resolve(window.gsap);
  if (gsapPromise) return gsapPromise;

  gsapPromise = loadScript(GSAP_RUNTIME_URL, "data-gsap-runtime").then((ok) =>
    ok ? (window.gsap ?? null) : null,
  );

  return gsapPromise;
};

const loadGsapStack = (): Promise<GsapStack | null> => {
  if (gsapStackPromise) return gsapStackPromise;

  gsapStackPromise = Promise.all([
    loadScript(GSAP_RUNTIME_URL, "data-gsap-runtime"),
    loadScript(SCROLLTRIGGER_RUNTIME_URL, "data-scrolltrigger-runtime"),
  ]).then(([gsapOk, stOk]) => {
    if (!gsapOk || !window.gsap) return null;
    const gsap = window.gsap;
    const ScrollTrigger = stOk ? window.ScrollTrigger ?? null : null;
    if (ScrollTrigger && gsap.registerPlugin) {
      try {
        gsap.registerPlugin(ScrollTrigger);
      } catch {
        /* noop */
      }
    }
    return { gsap, ScrollTrigger };
  });

  return gsapStackPromise;
};

const getCartItems = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]") as CartItem[];
  } catch {
    return [];
  }
};

const saveCartItems = (items: CartItem[]) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

const buildSnapshot = (items: CartItem[]): CartSnapshot => {
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const count = items.reduce((sum, item) => sum + item.cantidad, 0);
  return { items, total, count };
};

const state = {
  items: getCartItems(),
  isCartOpen: false,
  isNavOpen: false,
};

let cartDrawerGsap: GsapLike | null = null;
let cartCloseTimeline: GsapTimeline | null = null;
let cartOverlayTween: GsapTween | null = null;
let lenisInstance: Lenis | null = null;
let scrollTriggerRef: ScrollTriggerLike | null = null;

const refreshScrollTrigger = () => {
  if (scrollTriggerRef) scrollTriggerRef.refresh();
};

const setupPremiumScroll = () => {
  if (prefersReducedMotion) return;
  if (typeof window === "undefined") return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const lenis = new Lenis({
    lerp: 0.1,
    duration: 1.2,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });

  lenisInstance = lenis;
  window.__BORDERVET_LENIS__ = lenis;
  document.documentElement.setAttribute("data-lenis-active", "true");

  let rafId = 0;
  const raf = (time: number) => {
    lenis.raf(time);
    rafId = window.requestAnimationFrame(raf);
  };
  rafId = window.requestAnimationFrame(raf);

  loadGsapStack().then((stack) => {
    if (!stack) return;
    const { gsap, ScrollTrigger } = stack;
    if (!ScrollTrigger) return;

    scrollTriggerRef = ScrollTrigger;
    window.ScrollTrigger = ScrollTrigger;

    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    window.cancelAnimationFrame(rafId);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    window.addEventListener(
      "load",
      () => {
        ScrollTrigger.refresh();
      },
      { once: true },
    );

    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        ".catalog-card__image, .featured-categories__media img, [data-hero-main-image], [data-hero-support-image]",
      ),
    );
    let imgRefreshTimer = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(imgRefreshTimer);
      imgRefreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    images.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", scheduleRefresh, { once: true });
      img.addEventListener("error", scheduleRefresh, { once: true });
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href === "#" || href.length < 2) return;
    const destination = document.querySelector<HTMLElement>(href);
    if (!destination) return;
    event.preventDefault();
    lenis.scrollTo(destination, { offset: -72, duration: 1.1 });
  });
};

const setLenisLock = (locked: boolean) => {
  if (!lenisInstance) return;
  if (locked) {
    lenisInstance.stop();
    document.documentElement.style.overflow = "hidden";
  } else {
    document.documentElement.style.overflow = "";
    lenisInstance.start();
  }
};

const selectors = {
  header: "[data-header]",
  mobileMenu: "[data-mobile-menu]",
  overlay: "[data-drawer-overlay]",
  cartDrawer: "[data-cart-drawer]",
  cartCount: "[data-cart-count]",
  cartContent: "[data-cart-content]",
  cartEmpty: "[data-cart-empty]",
  cartFooter: "[data-cart-footer]",
  cartSubtotal: "[data-cart-subtotal]",
  cartCheckout: "[data-cart-checkout]",
  toast: "[data-toast]",
  filterButton: "[data-filter-button]",
  productCard: "[data-product-card]",
  categoryCard: "[data-category-card]",
  emptyFilter: "[data-filter-empty]",
};

const getSnapshot = () => buildSnapshot(state.items);

const syncBodyState = () => {
  document.body.dataset.cartOpen = state.isCartOpen ? "true" : "false";
  document.body.dataset.navOpen = state.isNavOpen ? "true" : "false";
};

const toast = document.querySelector<HTMLElement>(selectors.toast);
let toastTimer = 0;

const showToast = (message: string) => {
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.visible = "true";
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.dataset.visible = "false";
  }, 2400);
};

const animateCartCount = () => {
  const cartCounts = document.querySelectorAll<HTMLElement>(selectors.cartCount);

  cartCounts.forEach((node) => {
    node.classList.remove("is-bumping");
    void node.offsetWidth;
    node.classList.add("is-bumping");
    window.setTimeout(() => {
      node.classList.remove("is-bumping");
    }, 360);
  });
};

const setElementOpenState = (selector: string, next: boolean) => {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return;

  element.setAttribute("data-open", String(next));

  if (next) {
    requestAnimationFrame(() => {
      element.setAttribute("data-ready", "true");
    });
    return;
  }

  element.setAttribute("data-ready", "false");
};

const EXPO_OUT = "expo.out";
const EXPO_IN = "expo.in";
const SINE_IN_OUT = "sine.inOut";

const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const openCartDrawerWithGsap = () => {
  const drawer = document.querySelector<HTMLElement>(selectors.cartDrawer);
  const overlay = document.querySelector<HTMLElement>(selectors.overlay);

  if (!drawer || !overlay || !cartDrawerGsap) return false;
  if (isTouchDevice()) return false;

  const backdrop = drawer.querySelector<HTMLElement>("[data-drawer-backdrop]");
  const headerSegment = drawer.querySelector<HTMLElement>('[data-drawer-segment="header"]');
  const contentSegment = drawer.querySelector<HTMLElement>('[data-drawer-segment="content"]');
  const footerSegment = drawer.querySelector<HTMLElement>('[data-drawer-segment="footer"]');
  const contentItems = Array.from(
    drawer.querySelectorAll<HTMLElement>("[data-cart-content] .cart-item"),
  );
  const footerParts = footerSegment
    ? Array.from(footerSegment.children).filter(
        (node): node is HTMLElement => node instanceof HTMLElement,
      )
    : [];
  const segments = [headerSegment, contentSegment, footerSegment].filter(
    (segment): segment is HTMLElement => Boolean(segment),
  );

  cartCloseTimeline?.kill();
  cartCloseTimeline = null;
  cartOverlayTween?.kill();
  cartOverlayTween = null;

  cartDrawerGsap.killTweensOf([
    overlay,
    drawer,
    backdrop,
    ...segments,
    ...contentItems,
    ...footerParts,
  ]);

  drawer.dataset.drawerMotion = "gsap";
  drawer.dataset.open = "true";
  drawer.dataset.ready = "true";
  overlay.dataset.open = "true";

  cartDrawerGsap.set(drawer, { clearProps: "transform,opacity,scale,y,x,xPercent" });
  cartDrawerGsap.set(drawer, { xPercent: 100, scale: 0.985, transformOrigin: "100% 50%" });
  cartDrawerGsap.set(backdrop, { autoAlpha: 0, scale: 1.06 });
  cartDrawerGsap.set(headerSegment, { autoAlpha: 0, x: 24 });
  cartDrawerGsap.set(contentSegment, { autoAlpha: 0 });
  cartDrawerGsap.set(footerSegment, { autoAlpha: 0, y: 18 });
  cartDrawerGsap.set(contentItems, { autoAlpha: 0, y: 18 });
  cartDrawerGsap.set(footerParts, { autoAlpha: 0, y: 12 });

  cartDrawerGsap.to(overlay, {
    opacity: 1,
    duration: 0.44,
    ease: SINE_IN_OUT,
    onComplete: () => cartDrawerGsap?.set(overlay, { clearProps: "opacity" }),
  });

  const timeline = cartDrawerGsap.timeline({
    defaults: { ease: EXPO_OUT },
  });

  timeline
    .to(drawer, { xPercent: 0, scale: 1, duration: 0.72, ease: EXPO_OUT }, 0)
    .to(backdrop, { autoAlpha: 1, scale: 1, duration: 0.56, ease: SINE_IN_OUT }, 0.05);

  timeline
    .to(headerSegment, { autoAlpha: 1, x: 0, duration: 0.52 }, 0.28)
    .to(contentSegment, { autoAlpha: 1, duration: 0.34 }, 0.32);

  if (contentItems.length > 0) {
    timeline.to(
      contentItems,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.52,
        stagger: 0.06,
        ease: EXPO_OUT,
      },
      0.36,
    );
  }

  timeline.to(footerSegment, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.42);

  if (footerParts.length > 0) {
    timeline.to(
      footerParts,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.44,
        stagger: 0.05,
        ease: EXPO_OUT,
      },
      0.5,
    );
  }

  return true;
};

const closeCartDrawerWithGsap = () => {
  const drawer = document.querySelector<HTMLElement>(selectors.cartDrawer);
  const overlay = document.querySelector<HTMLElement>(selectors.overlay);

  if (!drawer || !overlay || !cartDrawerGsap) return false;
  if (isTouchDevice()) return false;

  const backdrop = drawer.querySelector<HTMLElement>("[data-drawer-backdrop]");
  const headerSegment = drawer.querySelector<HTMLElement>('[data-drawer-segment="header"]');
  const contentSegment = drawer.querySelector<HTMLElement>('[data-drawer-segment="content"]');
  const footerSegment = drawer.querySelector<HTMLElement>('[data-drawer-segment="footer"]');
  const orderedSegments = [footerSegment, contentSegment, headerSegment].filter(
    (segment): segment is HTMLElement => Boolean(segment),
  );

  cartCloseTimeline?.kill();
  cartOverlayTween?.kill();
  cartDrawerGsap.killTweensOf([overlay, drawer, backdrop, ...orderedSegments]);

  const timeline = cartDrawerGsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: () => {
      cartCloseTimeline = null;
      if (state.isCartOpen) return;
      drawer.dataset.open = "false";
      drawer.dataset.ready = "false";
      cartDrawerGsap?.set([drawer, backdrop, ...orderedSegments], {
        clearProps: "transform,opacity,scale,y,x,xPercent",
      });
    },
  });
  cartCloseTimeline = timeline;

  timeline
    .to(orderedSegments, { autoAlpha: 0, y: 14, duration: 0.22, stagger: 0.03 }, 0)
    .to(backdrop, { autoAlpha: 0, scale: 1.04, duration: 0.26 }, 0.02);

  timeline.to(
    drawer,
    { xPercent: 100, scale: 0.99, duration: 0.46, ease: EXPO_IN },
    0.06,
  );

  cartOverlayTween = cartDrawerGsap.to(overlay, {
    opacity: 0,
    duration: 0.28,
    ease: SINE_IN_OUT,
    onComplete: () => {
      cartOverlayTween = null;
      if (state.isCartOpen || state.isNavOpen) return;
      overlay.dataset.open = "false";
      cartDrawerGsap?.set(overlay, { clearProps: "opacity" });
    },
  });

  return true;
};

const setCartOpen = (next: boolean) => {
  if (!next) cancelCartAutoClose();
  state.isCartOpen = next;
  if (next) {
    state.isNavOpen = false;
  }

  const motionHandled = next ? openCartDrawerWithGsap() : closeCartDrawerWithGsap();

  if (next) {
    if (!motionHandled) {
      setElementOpenState(selectors.cartDrawer, true);
    }
  } else if (!motionHandled) {
    setElementOpenState(selectors.cartDrawer, false);
  }

  setElementOpenState(selectors.mobileMenu, state.isNavOpen);
  if (!motionHandled) {
    document
      .querySelector<HTMLElement>(selectors.overlay)
      ?.setAttribute("data-open", String(next || state.isNavOpen));
  }
  syncBodyState();
  setLenisLock(state.isCartOpen || state.isNavOpen);
};

const setNavOpen = (next: boolean) => {
  const cartWasOpen = state.isCartOpen;
  state.isNavOpen = next;
  if (next) {
    state.isCartOpen = false;
  }

  setElementOpenState(selectors.mobileMenu, next);
  if (cartWasOpen && !state.isCartOpen) {
    if (!closeCartDrawerWithGsap()) {
      setElementOpenState(selectors.cartDrawer, false);
    }
  } else if (!state.isCartOpen) {
    const drawer = document.querySelector<HTMLElement>(selectors.cartDrawer);
    drawer?.setAttribute("data-open", "false");
    drawer?.setAttribute("data-ready", "false");
  }
  document.querySelector<HTMLElement>(selectors.overlay)?.setAttribute("data-open", String(next || state.isCartOpen));
  syncBodyState();
  setLenisLock(state.isCartOpen || state.isNavOpen);
};

const renderCart = () => {
  const snapshot = getSnapshot();
  const cartCounts = document.querySelectorAll<HTMLElement>(selectors.cartCount);
  const cartContent = document.querySelector<HTMLElement>(selectors.cartContent);
  const cartEmpty = document.querySelector<HTMLElement>(selectors.cartEmpty);
  const cartFooter = document.querySelector<HTMLElement>(selectors.cartFooter);
  const cartSubtotal = document.querySelector<HTMLElement>(selectors.cartSubtotal);

  cartCounts.forEach((node) => {
    node.textContent = String(snapshot.count);
    node.hidden = snapshot.count === 0;
  });

  if (!cartContent || !cartEmpty || !cartFooter || !cartSubtotal) return;

  if (snapshot.items.length === 0) {
    cartContent.innerHTML = "";
    cartEmpty.hidden = false;
    cartFooter.hidden = true;
    cartSubtotal.textContent = "$0 MXN";
    return;
  }

  cartEmpty.hidden = true;
  cartFooter.hidden = false;
  cartSubtotal.textContent = `$${snapshot.total.toLocaleString("es-MX")} MXN`;

  cartContent.innerHTML = snapshot.items
    .map(
      (item) => `
        <article class="cart-item">
          <div class="cart-item__thumb">
            <img src="${item.imagen}" alt="${item.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${PRODUCT_PLACEHOLDER}'" />
          </div>
          <div>
            <div class="cart-item__title">${item.nombre}</div>
            <div class="cart-item__price">$${(item.precio * item.cantidad).toLocaleString("es-MX")} MXN</div>
            <div class="qty-actions">
              <button class="qty-button" type="button" data-qty-update="${item.id}" data-qty-delta="-1">−</button>
              <strong>${item.cantidad}</strong>
              <button class="qty-button" type="button" data-qty-update="${item.id}" data-qty-delta="1">+</button>
            </div>
          </div>
          <button class="icon-button" type="button" aria-label="Eliminar producto" data-remove-item="${item.id}">
            ×
          </button>
        </article>
      `,
    )
    .join("");
};

const commitCart = () => {
  saveCartItems(state.items);
  renderCart();
};

const pulseProductCardPrice = (card: HTMLElement | null) => {
  if (!card) return;
  const price = card.querySelector<HTMLElement>(".catalog-card__price");
  if (!price) return;

  if (cartDrawerGsap) {
    cartDrawerGsap.killTweensOf(price);
    cartDrawerGsap.fromTo(
      price,
      { scale: 1, color: "var(--color-accent-2)" },
      {
        scale: 1.08,
        color: "var(--color-accent-2)",
        duration: 0.24,
        ease: EXPO_OUT,
        yoyo: true,
        repeat: 1,
        clearProps: "scale,color",
      },
    );
  } else {
    card.classList.add("is-pulsing");
    window.setTimeout(() => card.classList.remove("is-pulsing"), 520);
  }
};

const flashCartItem = (productId: string) => {
  const drawer = document.querySelector<HTMLElement>(selectors.cartDrawer);
  if (!drawer) return;
  const items = Array.from(drawer.querySelectorAll<HTMLElement>(".cart-item"));
  const match = items.find((item) => {
    const qtyButton = item.querySelector<HTMLElement>("[data-qty-update]");
    return qtyButton?.dataset.qtyUpdate === productId;
  });
  if (!match || !cartDrawerGsap) return;

  cartDrawerGsap.fromTo(
    match,
    {
      backgroundColor: "rgba(243, 230, 216, 0.65)",
      y: -6,
    },
    {
      backgroundColor: "rgba(243, 230, 216, 0)",
      y: 0,
      duration: 0.72,
      ease: EXPO_OUT,
      clearProps: "backgroundColor,y",
    },
  );
};

let cartAutoCloseTimer: number | null = null;

const cancelCartAutoClose = () => {
  if (cartAutoCloseTimer !== null) {
    window.clearTimeout(cartAutoCloseTimer);
    cartAutoCloseTimer = null;
  }
};

const scheduleCartAutoClose = (delay?: number) => {
  cancelCartAutoClose();
  const isTouch =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const resolved = delay ?? (isTouch ? 1400 : 2400);
  cartAutoCloseTimer = window.setTimeout(() => {
    cartAutoCloseTimer = null;
    if (state.isCartOpen) setCartOpen(false);
  }, resolved);
};

const addToCart = (productId: string, originCard?: HTMLElement | null) => {
  const product = productMap.get(productId);
  if (!product) return;

  const existing = state.items.find((item) => item.id === product.id);
  if (existing) {
    existing.cantidad += 1;
  } else {
    state.items = [
      ...state.items,
      {
        id: product.id,
        slug: product.slug,
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen,
        cantidad: 1,
      },
    ];
  }

  commitCart();
  animateCartCount();
  pulseProductCardPrice(originCard ?? null);
  setCartOpen(true);
  scheduleCartAutoClose();
  requestAnimationFrame(() => flashCartItem(productId));
  showToast(`${product.nombre} agregado al carrito`);
};

const updateQuantity = (productId: string, delta: number) => {
  state.items = state.items
    .map((item) =>
      item.id === productId ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item,
    )
    .filter((item) => item.cantidad > 0);

  commitCart();
};

const removeFromCart = (productId: string) => {
  state.items = state.items.filter((item) => item.id !== productId);
  commitCart();
};

const setupHeroSwiper = () => {
  const heroRoot = document.querySelector<HTMLElement>(".js-hero-swiper");
  if (!heroRoot) return;

  let gsap: GsapLike | null = null;
  let heroReady = false;

  const stopAmbientTweens = (slide?: HTMLElement | null) => {
    if (!gsap || !slide) return;

    const targets = [
      slide.querySelector("[data-hero-main-image]"),
      slide.querySelector("[data-hero-support-image]"),
      ...slide.querySelectorAll(".hero-premium__orb"),
    ].filter(Boolean);

    if (targets.length > 0) {
      gsap.killTweensOf(targets);
    }
  };

  const animateHeroSlide = (slide?: HTMLElement | null) => {
    if (!gsap || !slide) return;

    heroRoot.dataset.heroMode = "gsap";

    const previousSlides = Array.from(heroRoot.querySelectorAll<HTMLElement>("[data-hero-slide]"));
    previousSlides.forEach((node) => {
      if (node === slide) return;
      stopAmbientTweens(node);
    });

    const eyebrow = slide.querySelector<HTMLElement>("[data-hero-eyebrow]");
    const title = slide.querySelector<HTMLElement>("[data-hero-title]");
    const description = slide.querySelector<HTMLElement>("[data-hero-description]");
    const actions = slide.querySelector<HTMLElement>("[data-hero-actions]");
    const actionButtons = Array.from(actions?.querySelectorAll<HTMLElement>(".btn") ?? []);
    const mainVisual = slide.querySelector<HTMLElement>("[data-hero-main-visual]");
    const supportVisual = slide.querySelector<HTMLElement>("[data-hero-support-visual]");
    const mainImage = slide.querySelector<HTMLElement>("[data-hero-main-image]");
    const supportImage = slide.querySelector<HTMLElement>("[data-hero-support-image]");
    const badges = Array.from(slide.querySelectorAll<HTMLElement>(".hero-premium__badge"));
    const orbs = Array.from(slide.querySelectorAll<HTMLElement>(".hero-premium__orb"));
    const textTargets = [eyebrow, title, description].filter(
      (target): target is HTMLElement => Boolean(target),
    );
    const visualTargets = [mainVisual, supportVisual].filter(
      (target): target is HTMLElement => Boolean(target),
    );

    const allTargets = [
      ...textTargets,
      actions,
      ...visualTargets,
      ...actionButtons,
      ...badges,
    ].filter(Boolean);

    if (allTargets.length > 0) {
      gsap.killTweensOf(allTargets);
    }

    stopAmbientTweens(slide);

    gsap.set(textTargets, { autoAlpha: 0, y: 28 });
    if (actions) {
      gsap.set(actions, { autoAlpha: 0, y: 22 });
    }
    gsap.set(actionButtons, { autoAlpha: 0, y: 16, scale: 0.98 });
    if (mainVisual) {
      gsap.set(mainVisual, {
        autoAlpha: 0,
        x: -34,
        y: 36,
        rotate: -2,
        scale: 0.94,
        transformOrigin: "50% 70%",
      });
    }
    if (supportVisual) {
      gsap.set(supportVisual, {
        autoAlpha: 0,
        x: 28,
        y: 24,
        rotate: 2,
        scale: 0.95,
        transformOrigin: "50% 70%",
      });
    }
    gsap.set(badges, { autoAlpha: 0, y: 14, scale: 0.96 });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    if (mainVisual) {
      tl.to(mainVisual, { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1, duration: 1.02 }, 0);
    }
    if (supportVisual) {
      tl.to(supportVisual, { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1, duration: 0.88 }, 0.16);
    }
    if (textTargets.length > 0) {
      tl.to(textTargets, { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.1 }, 0.14);
    }
    if (actions) {
      tl.to(actions, { autoAlpha: 1, y: 0, duration: 0.52 }, 0.38);
    }
    if (actionButtons.length > 0) {
      tl.to(actionButtons, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06 }, 0.42);
    }
    if (badges.length > 0) {
      tl.to(badges, { autoAlpha: 1, y: 0, scale: 1, duration: 0.48, stagger: 0.05 }, 0.52);
    }

    if (mainImage) {
      gsap.to(mainImage, {
        scale: 1.08,
        yPercent: -2.6,
        rotate: 0.45,
        duration: 7.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    if (supportImage) {
      gsap.to(supportImage, {
        scale: 1.045,
        yPercent: -3.2,
        rotate: -0.4,
        duration: 6.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    if (orbs.length > 0) {
      const gsapRuntime = gsap;
      orbs.forEach((orb, index) => {
        gsapRuntime.to(orb, {
          xPercent: index === 1 ? 4 : -3,
          yPercent: index === 2 ? -5 : 3,
          duration: 8.5 + index,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    }
  };

  const isTouch =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  const swiper = new Swiper(heroRoot, {
    modules: [Pagination, Autoplay, EffectFade],
    effect: "fade",
    fadeEffect: { crossFade: true },
    speed: 1650,
    loop: true,
    autoHeight: isTouch,
    autoplay: isTouch
      ? false
      : {
          delay: 6400,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
    pagination: {
      el: ".swiper-pagination-shell",
      clickable: true,
    },
    on: {
      init(swiper) {
        if (heroReady) {
          animateHeroSlide(swiper.slides[swiper.activeIndex] as HTMLElement);
        }
      },
      slideChangeTransitionStart(swiper) {
        if (heroReady) {
          animateHeroSlide(swiper.slides[swiper.activeIndex] as HTMLElement);
        }
      },
    },
  });

  loadGsap().then((loadedGsap) => {
    if (!loadedGsap) return;

    gsap = loadedGsap;
    heroReady = true;
    animateHeroSlide(swiper.slides[swiper.activeIndex] as HTMLElement);

    if (prefersReducedMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const mouseTarget =
      document.querySelector<HTMLElement>("[data-hero-mouse-target]") ?? heroRoot;

    type OrbSetters = { x: GsapQuickTo; y: GsapQuickTo; weight: number };
    const orbSettersByOrb = new WeakMap<HTMLElement, OrbSetters>();
    const getOrbSetters = (orb: HTMLElement, weight: number): OrbSetters => {
      const cached = orbSettersByOrb.get(orb);
      if (cached) return cached;
      const setters: OrbSetters = {
        x: loadedGsap.quickTo(orb, "x", { duration: 0.8, ease: "power3.out" }),
        y: loadedGsap.quickTo(orb, "y", { duration: 0.8, ease: "power3.out" }),
        weight,
      };
      orbSettersByOrb.set(orb, setters);
      return setters;
    };

    let pendingPointer = false;
    let lastEvent: PointerEvent | null = null;
    const applyParallax = () => {
      pendingPointer = false;
      if (!lastEvent) return;
      const rect = mouseTarget.getBoundingClientRect();
      const relativeX = (lastEvent.clientX - rect.left) / rect.width - 0.5;
      const relativeY = (lastEvent.clientY - rect.top) / rect.height - 0.5;

      const activeSlide = swiper.slides[swiper.activeIndex] as HTMLElement;
      if (!activeSlide) return;
      const orbs = Array.from(activeSlide.querySelectorAll<HTMLElement>(".hero-premium__orb"));
      orbs.forEach((orb, index) => {
        const weight = (index + 1) * 14;
        const setters = getOrbSetters(orb, weight);
        setters.x(relativeX * weight);
        setters.y(relativeY * weight);
      });
    };

    mouseTarget.addEventListener("pointermove", (event) => {
      lastEvent = event;
      if (pendingPointer) return;
      pendingPointer = true;
      requestAnimationFrame(applyParallax);
    });
  });
};

const setupTestimonialSwiper = () => {
  const root = document.querySelector<HTMLElement>(".js-testimonial-swiper");
  if (!root) return;

  new Swiper(root, {
    modules: [Navigation, Pagination, Autoplay],
    speed: 700,
    loop: true,
    spaceBetween: 20,
    autoplay: {
      delay: 4200,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".js-testimonial-pagination",
      clickable: true,
    },
    breakpoints: {
      0: { slidesPerView: 1.08 },
      768: { slidesPerView: 2 },
      1080: { slidesPerView: 3 },
    },
  });
};

const setupBrandMarquee = () => {
  const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-brand-marquee]"));
  if (roots.length === 0) return;

  loadGsap().then((gsap) => {
    if (!gsap) return;

    roots.forEach((root) => {
      const track = root.querySelector<HTMLElement>("[data-brand-track]");
      const firstSet = root.querySelector<HTMLElement>("[data-brand-set]");
      if (!track || !firstSet) return;

      let tween: GsapTween | null = null;
      let paused = false;

      const createLoop = () => {
        const firstSetWidth = firstSet.getBoundingClientRect().width;
        if (!firstSetWidth) return;

        const speed = window.innerWidth <= 820 ? 74 : 96;
        const duration = firstSetWidth / speed;

        tween?.kill();
        gsap.set(track, { x: 0 });

        tween = gsap.to(track, {
          x: -firstSetWidth,
          duration,
          ease: "none",
          repeat: -1,
        });

        if (paused) {
          tween.pause();
        }
      };

      createLoop();

      root.addEventListener("mouseenter", () => {
        paused = true;
        tween?.pause();
      });

      root.addEventListener("mouseleave", () => {
        paused = false;
        tween?.play();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          tween?.pause();
          return;
        }

        if (!paused) {
          tween?.play();
        }
      });

      let resizeTimer = 0;
      window.addEventListener("resize", () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(createLoop, 120);
      });
    });
  });
};

const setupInteractiveCards = () => {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  type SurfaceConfig = {
    selector: string;
    xVar: string;
    yVar: string;
    glowXVar: string;
    glowYVar: string;
    maxX: number;
    maxY: number;
  };

  const grids: Array<{ root: HTMLElement; config: SurfaceConfig }> = [];

  const productGrids = Array.from(document.querySelectorAll<HTMLElement>(".catalog-grid"));
  productGrids.forEach((root) =>
    grids.push({
      root,
      config: {
        selector: "[data-product-card]",
        xVar: "--card-shift-x",
        yVar: "--card-shift-y",
        glowXVar: "--card-glow-x",
        glowYVar: "--card-glow-y",
        maxX: 12,
        maxY: 10,
      },
    }),
  );

  const categoryGrids = Array.from(document.querySelectorAll<HTMLElement>(".featured-categories__grid"));
  categoryGrids.forEach((root) =>
    grids.push({
      root,
      config: {
        selector: "[data-category-card]",
        xVar: "--category-shift-x",
        yVar: "--category-shift-y",
        glowXVar: "--category-glow-x",
        glowYVar: "--category-glow-y",
        maxX: 16,
        maxY: 12,
      },
    }),
  );

  const writeVar = (element: HTMLElement, prop: string, value: string) => {
    element.style.setProperty(prop, value);
  };

  grids.forEach(({ root, config }) => {
    let activeCard: HTMLElement | null = null;
    let pending = false;
    let lastEvent: PointerEvent | null = null;

    const apply = () => {
      pending = false;
      if (!lastEvent) return;
      const target = (lastEvent.target as HTMLElement | null)?.closest<HTMLElement>(config.selector);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const relativeX = (lastEvent.clientX - rect.left) / rect.width;
      const relativeY = (lastEvent.clientY - rect.top) / rect.height;
      if (Number.isNaN(relativeX) || Number.isNaN(relativeY)) return;

      const shiftX = (relativeX - 0.5) * config.maxX;
      const shiftY = (relativeY - 0.5) * config.maxY;

      if (activeCard && activeCard !== target) {
        writeVar(activeCard, config.xVar, "0px");
        writeVar(activeCard, config.yVar, "0px");
        writeVar(activeCard, config.glowXVar, "50%");
        writeVar(activeCard, config.glowYVar, "14%");
      }

      activeCard = target;
      writeVar(target, config.xVar, `${shiftX.toFixed(2)}px`);
      writeVar(target, config.yVar, `${shiftY.toFixed(2)}px`);
      writeVar(target, config.glowXVar, `${(relativeX * 100).toFixed(2)}%`);
      writeVar(target, config.glowYVar, `${(relativeY * 100).toFixed(2)}%`);
    };

    root.addEventListener("pointermove", (event) => {
      lastEvent = event;
      if (pending) return;
      pending = true;
      requestAnimationFrame(apply);
    });

    root.addEventListener("pointerleave", () => {
      if (!activeCard) return;
      writeVar(activeCard, config.xVar, "0px");
      writeVar(activeCard, config.yVar, "0px");
      writeVar(activeCard, config.glowXVar, "50%");
      writeVar(activeCard, config.glowYVar, "14%");
      activeCard = null;
    });
  });
};

const setupGridReveals = () => {
  const items = Array.from(
    document.querySelectorAll<HTMLElement>(".catalog-grid__item[data-reveal-st]"),
  );
  if (items.length === 0) return;

  const reveal = () => {
    items.forEach((item) => item.classList.add("is-visible"));
  };

  if (isTouchDevice()) {
    reveal();
    return;
  }

  if (prefersReducedMotion) {
    reveal();
    return;
  }

  let stClaimed = false;
  const fallbackTimer = window.setTimeout(reveal, 1200);

  loadGsapStack().then((stack) => {
    if (!stack || !stack.ScrollTrigger) {
      reveal();
      return;
    }
    stClaimed = true;
    window.clearTimeout(fallbackTimer);

    const { gsap, ScrollTrigger } = stack;
    const pending = items.filter((item) => !item.classList.contains("is-visible"));
    if (pending.length === 0) return;

    pending.forEach((item) => item.removeAttribute("data-reveal"));
    gsap.set(pending, { autoAlpha: 0, y: 28, scale: 0.985 });

    ScrollTrigger.batch(pending, {
      start: "top 88%",
      onEnter: (batch: HTMLElement[]) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.06,
          ease: "expo.out",
          overwrite: "auto",
        });
      },
    });
  }).catch(() => {
    if (!stClaimed) reveal();
  });
};

const setupFeaturedCategories = () => {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(".featured-categories__card[data-reveal-st]"),
  );
  if (cards.length === 0) return;

  const reveal = () => {
    cards.forEach((card) => card.classList.add("is-visible"));
  };

  if (isTouchDevice()) {
    reveal();
    return;
  }

  if (prefersReducedMotion) {
    reveal();
    return;
  }

  let stClaimed = false;
  const fallbackTimer = window.setTimeout(reveal, 1200);

  loadGsapStack().then((stack) => {
    if (!stack || !stack.ScrollTrigger) {
      reveal();
      return;
    }
    stClaimed = true;
    window.clearTimeout(fallbackTimer);

    const { gsap, ScrollTrigger } = stack;
    const pending = cards.filter((card) => !card.classList.contains("is-visible"));
    if (pending.length === 0) return;

    pending.forEach((card) => card.removeAttribute("data-reveal"));
    gsap.set(pending, { autoAlpha: 0, y: 32 });

    ScrollTrigger.batch(pending, {
      start: "top 85%",
      onEnter: (batch: HTMLElement[]) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.78,
          stagger: 0.09,
          ease: "expo.out",
          overwrite: "auto",
        });
      },
    });
  }).catch(() => {
    if (!stClaimed) reveal();
  });
};

const setupCartDrawerMotion = () => {
  const drawer = document.querySelector<HTMLElement>(selectors.cartDrawer);
  if (drawer) {
    const cancelOnInteract = () => cancelCartAutoClose();
    drawer.addEventListener("pointerenter", cancelOnInteract);
    drawer.addEventListener("pointerdown", cancelOnInteract);
    drawer.addEventListener("wheel", cancelOnInteract, { passive: true });
    drawer.addEventListener("touchstart", cancelOnInteract, { passive: true });
  }

  loadGsap().then((gsap) => {
    if (!gsap) return;

    cartDrawerGsap = gsap;
    if (!drawer) return;

    drawer.dataset.drawerMotion = "gsap";
  });
};

const setupHeader = () => {
  const header = document.querySelector<HTMLElement>(selectors.header);
  if (!header) return;

  let progressSetter: GsapQuickSetter | null = null;
  let currentProgress = 0;
  let targetProgress = 0;
  let boostTween: GsapTween | null = null;

  const writeProgress = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    currentProgress = clamped;
    if (progressSetter) {
      progressSetter(clamped.toFixed(3));
    } else {
      header.style.setProperty("--header-progress", clamped.toFixed(3));
    }
    header.dataset.scrolled = String(clamped > 0.08);
  };

  const computeProgress = (scrollY: number) => Math.min(scrollY / 160, 1);

  const handleScroll = (scrollY: number, velocity: number) => {
    const base = computeProgress(scrollY);
    targetProgress = base;

    if (velocity < -0.4 && scrollY > 160) {
      targetProgress = Math.min(base + 0.08, 1);
    }

    if (cartDrawerGsap && progressSetter) {
      boostTween?.kill();
      boostTween = cartDrawerGsap.to(
        { value: currentProgress },
        {
          value: targetProgress,
          duration: 0.32,
          ease: "power2.out",
          onUpdate: function (this: { targets: () => Array<{ value: number }> }) {
            const proxy = this.targets()[0];
            writeProgress(proxy.value);
          },
        },
      );
    } else {
      writeProgress(targetProgress);
    }
  };

  const initialScroll = lenisInstance?.scroll ?? window.scrollY;
  writeProgress(computeProgress(initialScroll));

  if (lenisInstance) {
    lenisInstance.on("scroll", ({ scroll, velocity }) => {
      handleScroll(scroll, velocity);
    });
  } else {
    let lastY = window.scrollY;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const velocity = y - lastY;
        lastY = y;
        handleScroll(y, velocity);
        pending = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  loadGsap().then((gsap) => {
    if (!gsap) return;
    progressSetter = gsap.quickSetter(header, "--header-progress");
    progressSetter(currentProgress.toFixed(3));
  });
};

const setupReveals = () => {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-st])"),
  );
  if (elements.length === 0) return;

  const getRevealProfile = (element: HTMLElement) => {
    if (element.closest(".catalog-grid, .brand-marquee__shell, .trust-strip__shell")) {
      return { className: "reveal-soft", stagger: "58ms" };
    }

    if (element.closest(".featured-categories__grid, .home-products-showcase__grid")) {
      return { className: "reveal-soft", stagger: "64ms" };
    }

    return { className: "reveal-strong", stagger: "82ms" };
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length === 0) return;

      const groups = new Map<Element, IntersectionObserverEntry[]>();

      visibleEntries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        const section =
          target.closest(".section-block, .hero, .catalog-hero, .page-hero, .footer") ??
          document.body;
        const current = groups.get(section) ?? [];
        current.push(entry);
        groups.set(section, current);
      });

      groups.forEach((group) => {
        group
          .sort((a, b) => {
            const aBox = (a.target as HTMLElement).getBoundingClientRect();
            const bBox = (b.target as HTMLElement).getBoundingClientRect();
            if (Math.abs(aBox.top - bBox.top) < 12) {
              return aBox.left - bBox.left;
            }
            return aBox.top - bBox.top;
          })
          .forEach((entry, index) => {
            const target = entry.target as HTMLElement;
            target.style.setProperty("--stagger-index", String(index));
            requestAnimationFrame(() => {
              target.classList.add("is-visible");
            });
            observer.unobserve(target);
          });
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  elements.forEach((element) => {
    const profile = getRevealProfile(element);
    element.classList.add(profile.className);
    element.style.setProperty("--motion-stagger-local", profile.stagger);
    element.setAttribute("data-stagger", "");
    observer.observe(element);
  });
};

const setupFilters = () => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(selectors.filterButton));
  const cards = Array.from(document.querySelectorAll<HTMLElement>(selectors.productCard));
  const emptyState = document.querySelector<HTMLElement>(selectors.emptyFilter);

  if (buttons.length === 0 || cards.length === 0) return;

  const applyFilter = (next: string) => {
    let visibleCount = 0;

    buttons.forEach((button) => {
      button.dataset.active = String(button.dataset.filter === next);
    });

    cards.forEach((card) => {
      const category = card.dataset.category ?? "todos";
      const visible = next === "todos" || category === next;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }

    requestAnimationFrame(refreshScrollTrigger);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filter ?? "todos");
    });
  });

  const initial = new URL(window.location.href).searchParams.get("categoria") ?? "todos";
  applyFilter(initial);
};

const setupEvents = () => {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const cartToggle = target.closest<HTMLElement>("[data-cart-toggle]");
    const navToggle = target.closest<HTMLElement>("[data-nav-toggle]");
    const navClose = target.closest<HTMLElement>("[data-nav-close]");
    const overlay = target.closest<HTMLElement>(selectors.overlay);
    const addButton = target.closest<HTMLElement>("[data-add-to-cart]");
    const qtyUpdate = target.closest<HTMLElement>("[data-qty-update]");
    const removeItem = target.closest<HTMLElement>("[data-remove-item]");
    const cartClose = target.closest<HTMLElement>("[data-cart-close]");
    const clearCart = target.closest<HTMLElement>("[data-clear-cart]");
    const checkout = target.closest<HTMLElement>(selectors.cartCheckout);

    if (cartToggle) {
      setCartOpen(!state.isCartOpen);
      return;
    }

    if (navToggle) {
      setNavOpen(!state.isNavOpen);
      return;
    }

    if (navClose) {
      setNavOpen(false);
      return;
    }

    if (overlay) {
      setCartOpen(false);
      setNavOpen(false);
      return;
    }

    if (addButton) {
      const productId = addButton.dataset.addToCart;
      if (productId) {
        const originCard = addButton.closest<HTMLElement>("[data-product-card]");
        addToCart(productId, originCard);
      }
      return;
    }

    if (qtyUpdate) {
      const productId = qtyUpdate.dataset.qtyUpdate;
      const delta = Number(qtyUpdate.dataset.qtyDelta ?? "0");
      if (productId) updateQuantity(productId, delta);
      return;
    }

    if (removeItem) {
      const productId = removeItem.dataset.removeItem;
      if (productId) removeFromCart(productId);
      return;
    }

    if (cartClose) {
      setCartOpen(false);
      return;
    }

    if (clearCart) {
      state.items = [];
      commitCart();
      return;
    }

    if (checkout && payload) {
      const adapter = new WhatsAppCheckoutAdapter(payload.site.phoneRaw, payload.site.businessName);
      const url = adapter.buildCheckoutUrl(getSnapshot());
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });
};

const init = () => {
  setupPremiumScroll();
  setupHeader();
  setupCartDrawerMotion();
  setupHeroSwiper();
  setupBrandMarquee();
  setupTestimonialSwiper();
  setupReveals();
  setupGridReveals();
  setupFeaturedCategories();
  setupFilters();
  setupInteractiveCards();
  setupEvents();
  renderCart();
  syncBodyState();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
