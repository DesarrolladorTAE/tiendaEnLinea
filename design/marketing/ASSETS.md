# Recursos de la nueva web pública

La identidad visual usa el logo original, sin modificar, de `public/assets/img/logo3.png` y una paleta azul. El logo se reutiliza en cabecera, pie y tarjetas Open Graph. Los logos de compañías se obtienen del campo público `Logotipo` del catálogo, igual que en la vista de venta de paquetes.

La portada utiliza una fotografía ilustrativa creada con la herramienta integrada de **ImageGen**, sin usar CLI ni una clave de API del proyecto. Representa a una comerciante ficticia; no se presenta como cliente real ni testimonio.

- Original conservado: `design/marketing/negocio-original.png`.
- Web: `public/marketing/negocio-1200.webp` (aproximadamente 89 KB).
- Móvil: `public/marketing/negocio-720.webp` (aproximadamente 47 KB).
- La página usa `srcset`, dimensiones explícitas y prioridad alta en la portada. En Nosotros se carga de forma diferida.
- Tipografía local: `public/fonts/Manrope-Variable.ttf`, con licencia en `public/fonts/Manrope-OFL.txt`.
- Iconos de interfaz: SVG en el código; no imágenes pesadas para controles o navegación.

## Prompt final usado en ImageGen

```text
Use case: ads-marketing. Create a premium editorial photograph for TeLoRecargo, a Mexican digital mobile top-up platform for small businesses. Landscape 3:2 image, no text, no typography, no logos, no watermark. Subject: a young adult Mexican woman running a contemporary neighborhood convenience shop, warm genuine confidence, photographed from waist up behind a clean counter, holding a modern smartphone in one hand while attending her business, not posing for an ad. Natural Mexican features and realistic hands, casual dark navy overshirt over ivory shirt. Art direction: sophisticated contemporary fintech brand campaign, understated, credible, beautiful rather than corporate stock, cinematic natural afternoon light and realistic texture. Color accents of deep midnight navy, muted fresh lime, warm cream, with a softly blurred modern shop environment behind her, orderly product shelves without readable brands. Composition subject slightly right of center with breathing space around head, phone fully inside frame, excellent crop for a large rounded website hero photo and mobile. No floating UI, no fake screens, no oversized money, no bank cards, no graphic overlays. Soft film grain, impeccable photographic quality, authentic Mexican small-business setting.
```

El original se optimizó a WebP para entregar tamaños adecuados a la web; no se modificó el contenido de la escena.
