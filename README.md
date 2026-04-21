# BorderVet

Storefront premium de farmacia veterinaria en Tijuana — alimentos, antiparasitarios, accesorios y atencion especializada para perros y gatos. Pedidos confirmados por WhatsApp.

## Stack

- [Astro 5](https://astro.build/) — sitio estatico con islands selectivas
- [Tailwind CSS 4](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- [Swiper 11](https://swiperjs.com/) — hero slider y carruseles
- [Lenis](https://lenis.darkroom.engineering/) — scroll suave
- [GSAP 3 + ScrollTrigger](https://gsap.com/) — animaciones premium (carga via CDN bajo demanda con fallback CSS)
- TypeScript

## Scripts

```bash
npm install        # instalar dependencias
npm run dev        # servidor local en http://localhost:4321
npm run build      # build de produccion en dist/
npm run preview    # servir el build local
npm run check      # type-check con astro check
```

## Estructura

```
src/
  components/      # UI por dominio: shell, sections, catalog, cart, ui
  content/         # contenido editorial (heroSlides, copy)
  domain/          # tipos y modelos de dominio
  integrations/    # adaptadores externos (WhatsApp, etc.)
  layouts/         # layouts de pagina
  lib/             # helpers compartidos
  pages/           # rutas (Astro file-based routing)
  scripts/         # logica cliente (storefront.ts)
  styles/          # tokens, motion, sections, catalog, global
public/
  images/          # assets estaticos
```

## Deploy

Configurado para [Netlify](https://www.netlify.com/) via `netlify.toml`. El build estatico se publica desde `dist/`.

## Licencia

Privado — © BorderVet.
