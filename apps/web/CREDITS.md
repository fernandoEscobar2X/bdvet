# Créditos de assets — v2 prototype

Inventario de imágenes y logos usados en el storefront, con su fuente y condición de licencia. Este documento se actualiza en cada lote de assets que se agregue al proyecto.

## Logos de marca — `public/images/brands/`

Los logos se usan en el marquee de marcas con finalidad identificativa: BorderVet comercializa estas marcas como farmacia veterinaria autorizada. Nominative fair use / uso de marca comercial para identificación del producto distribuido.

| Archivo | Marca | Fuente | Licencia |
| --- | --- | --- | --- |
| `royal-canin.svg` | Royal Canin | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Royal_Canin_logo.svg) | Trademark — use for identification |
| `purina-pro-plan.svg` | Purina Pro Plan | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Purina_Pro_Plan_logo.svg) | Trademark — use for identification |
| `frontline.svg` | Frontline | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Frontline_by_Boehringer_Ingelheim_Vetmedica.svg) | Trademark — use for identification |
| `hills.png` | Hill's Pet Nutrition | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hills-Pet-Nutrition-logo.png) | Trademark — use for identification |
| `seresto.svg` | Seresto | Wordmark interno (placeholder) | Pendiente sustituir por logo oficial en v3 |
| `catsan.svg` | Catsan | Wordmark interno (placeholder) | Pendiente sustituir por logo oficial en v3 |
| `nupec.svg` | Nupec | Wordmark interno (placeholder) | Pendiente sustituir por logo oficial en v3 |
| `bravecto.svg` | Bravecto | Wordmark interno (placeholder) | Pendiente sustituir por logo oficial en v3 |

## Hero — `public/images/hero/`

Licencia Unsplash: uso libre comercial y no-comercial, atribución no obligatoria pero recomendada.

| Archivo | Contexto | Fuente |
| --- | --- | --- |
| `hero-main-storefront.jpg` | Slide 1 — "Todo para el cuidado" | [Unsplash · qO-PIF84Vxg](https://unsplash.com/photos/qO-PIF84Vxg) |
| `hero-main-consultation.jpg` | Slide 2 — "Asesoría virtual" | [Unsplash · tDlo2ZPlQlU](https://unsplash.com/photos/tDlo2ZPlQlU) |
| `hero-main-selection.jpg` | Slide 3 — "Selección destacada" | [Unsplash · c7bUIRBqapA](https://unsplash.com/photos/c7bUIRBqapA) |

SVGs secundarios (`about-visual.svg`, `hero-products.svg`, `hero-consultation.svg`) se mantienen como acentos visuales hasta tener fotografía específica.

## Categorías — `public/images/categories/`

Fotografía de tarjetas de categoría. Licencias: Unsplash (uso libre) y Pexels (uso libre comercial, atribución recomendada).

| Archivo | Categoría | Fuente |
| --- | --- | --- |
| `cat-perros.jpg` | Perros | [Unsplash · EkzMdwI_YE4](https://unsplash.com/photos/EkzMdwI_YE4) |
| `cat-gatos.jpg` | Gatos | [Pexels · 27505770](https://www.pexels.com/photo/27505770/) |
| `cat-higiene.jpg` | Higiene y cuidado | [Pexels · 6816848](https://www.pexels.com/photo/6816848/) |
| `cat-alimento-premium.jpg` | Alimento premium | [Pexels · 12928244](https://www.pexels.com/photo/12928244/) |

Las tarjetas se migraron de packshot a cover full-bleed (`object-fit: cover`) para aprovechar fotografía editorial.

## Productos — `public/images/products/`

Fotografía para las 6 tarjetas del catálogo destacado. Fotos lifestyle/contextuales de Unsplash y Pexels mientras no haya packshot propio del cliente (ver deuda v3). Los SVG placeholder originales se mantienen junto al JPG por si se requieren como fallback.

| Archivo | Producto | Fuente |
| --- | --- | --- |
| `royal-canin-medium.jpg` | Royal Canin Medium Adult | [Unsplash · CRN2fR9NRE8](https://unsplash.com/photos/CRN2fR9NRE8) |
| `purina-gato.jpg` | Purina Pro Plan Gato Adulto | [Unsplash · w2DsS-ZAP4U](https://unsplash.com/photos/w2DsS-ZAP4U) |
| `frontline-plus.jpg` | Frontline Plus Perro 10–20 kg | [Pexels · 5539877](https://www.pexels.com/photo/5539877/) |
| `hills-kitten.jpg` | Hill's Science Diet Kitten | [Pexels · 17514361](https://www.pexels.com/photo/17514361/) |
| `seresto-collar.jpg` | Collar Seresto Perro | [Pexels · 13925396](https://www.pexels.com/photo/13925396/) |
| `catsan-arena.jpg` | Catsan Arena Sanitaria 10L | [Pexels · 10672058](https://www.pexels.com/photo/10672058/) |

Las product cards también migraron a cover full-bleed (`object-fit: cover`, sin padding) y se ajustó la capa de sombra inferior del media para que no lave el fondo blanco de la foto.

## Deuda para v3 (input real del cliente)

- Logos oficiales de Seresto, Catsan, Nupec y Bravecto (solicitar pack de marca al distribuidor).
- Fotografía original de BorderVet: fachada del local, equipo veterinario y consultorio de asesoría.
- Fotografía producto por producto para reemplazar stock fotográfico por packshots propios.
