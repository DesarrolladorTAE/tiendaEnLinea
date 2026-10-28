<?php
// PHP 7.4+. Sólo datos públicos; no inicia sesión ni reenvía credenciales.
function tlr_escape($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function tlr_text($value): string
{
    $text = preg_replace('/<[^>]*>/u', ' ', (string) ($value ?? ''));
    return trim(preg_replace('/\s+([,.;:!?])/u', '$1', preg_replace('/\s+/u', ' ', $text)));
}

function tlr_money($value): string { return '$' . number_format((float) $value, 2, '.', ','); }
function tlr_logo($value): string
{
    if (!is_string($value)) return '';
    $url = trim((string) ($value ?? ''));
    if ($url === '') return '';
    if (substr($url, 0, 2) === '//') $url = 'https:' . $url;
    elseif (substr($url, 0, 1) === '/') $url = 'https://telorecargo.com' . $url;
    elseif (!preg_match('~^[a-z][a-z0-9+.-]*:~i', $url)) $url = 'https://telorecargo.com/' . $url;
    $parts = parse_url($url);
    return filter_var($url, FILTER_VALIDATE_URL) && ($parts['scheme'] ?? '') === 'https' && !isset($parts['user']) && !isset($parts['pass']) ? $url : '';
}
function tlr_carrier_label(array $product): string
{
    $logo = empty($product['logo']) ? '' : '<img data-carrier-logo class="carrier-logo" src="' . tlr_escape($product['logo']) . '" alt="Logo de ' . tlr_escape($product['carrier']) . '" width="96" height="56" loading="lazy" decoding="async" referrerpolicy="no-referrer">';
    return '<div class="carrier-identity">' . $logo . '<span class="carrier">' . tlr_escape($product['carrier']) . '</span></div>';
}

function tlr_slug(string $value): string
{
    // Mismas letras españolas y separadores que packagePath() en React.
    $value = strtr($value, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ü'=>'u','ñ'=>'n','Á'=>'A','É'=>'E','Í'=>'I','Ó'=>'O','Ú'=>'U','Ü'=>'U','Ñ'=>'N']);
    return trim(substr(preg_replace('/[^a-z0-9]+/', '-', strtolower($value)), 0, 90), '-');
}

function tlr_product(array $raw, array $carrier): array
{
    $id = (string) ($raw['proID'] ?? '');
    if (!preg_match('/^[0-9]+$/', $id) || !isset($raw['Monto']) || !is_numeric($raw['Monto'])) throw new RuntimeException('Invalid public product');
    $price = (float) $raw['Monto'];
    if (!is_finite($price) || $price < 0) throw new RuntimeException('Invalid public price');
    $kind = strtolower(tlr_text($carrier['Categoria'] ?? '')) === 'tiempo aire' ? 'recargas' : 'paquetes';
    $name = tlr_text($raw['Nombre'] ?? '');
    if ($name === '' || $name === 'EMPTY') $name = ($kind === 'recargas' ? 'Recarga ' : 'Paquete ') . tlr_money($price);
    // No serializar la respuesta original: excluye suscrip/comisiones/saldo/tokens.
    $product = ['id'=>$id, 'carrier'=>tlr_text($carrier['Nombre']), 'logo'=>tlr_logo($carrier['Logotipo'] ?? ''), 'kind'=>$kind, 'name'=>$name, 'price'=>$price,
        'validity'=>tlr_text($raw['Vigencia'] ?? ''), 'description'=>tlr_text($raw['Descripcion'] ?? '')];
    $product['path'] = '/paquetes/' . (tlr_slug($product['carrier'] . ' ' . $name) ?: 'paquete') . '-' . $id . '/';
    $product['image'] = '/og/paquete-' . $id . '.png?v=' . substr(hash('sha256', 'carrier-logo-v3' . json_encode($product, JSON_UNESCAPED_UNICODE)), 0, 12);
    return $product;
}
function tlr_public_carrier(array $raw): ?array
{
    $category = strtolower(tlr_text($raw['Categoria'] ?? ''));
    $kind = $category === 'paquetes' ? 'paquetes' : ($category === 'tiempo aire' ? 'recargas' : null);
    $name = tlr_text($raw['Nombre'] ?? '');
    $slug = tlr_slug($name);
    if (!$kind || !$slug) return null;
    return ['name'=>$name, 'slug'=>$slug, 'kind'=>$kind, 'logo'=>tlr_logo($raw['Logotipo'] ?? ''), 'path'=>'/paquetes/' . ($kind === 'paquetes' ? 'companias' : 'recargas') . '/' . $slug . '/'];
}
function tlr_carriers(callable $fetch): array
{
    $raw = $fetch('https://telorecargo.com/api/carriers');
    if ($raw === null) throw new RuntimeException('Public carriers unavailable');
    return array_values(array_filter(array_map(static function ($item) { return is_array($item) ? tlr_public_carrier($item) : null; }, $raw)));
}
function tlr_company_products(array $carrier, callable $fetch): array
{
    $raw = $fetch('https://telorecargo.com/api/producto?carrier=' . rawurlencode($carrier['name']));
    if ($raw === null) throw new RuntimeException('Public company unavailable');
    $normalized = ['Nombre'=>$carrier['name'], 'Logotipo'=>$carrier['logo'], 'Categoria'=>$carrier['kind'] === 'paquetes' ? 'Paquetes' : 'Tiempo Aire'];
    $products = [];
    foreach ($raw as $item) if (is_array($item) && ($item['Carrier'] ?? '') === $carrier['name']) $products[] = tlr_product($item, $normalized);
    usort($products, static function ($a, $b) { return $a['price'] <=> $b['price']; });
    return $products;
}

function tlr_fetch(string $url, float $deadline): ?array
{
    if (!function_exists('curl_init')) return null;
    $remaining = (int) (($deadline - microtime(true)) * 1000);
    if ($remaining <= 0) return null;
    $body = '';
    // Reutilizar la conexión HTTPS durante una consulta de catálogo en frío.
    static $curl = null;
    if ($curl === null) $curl = curl_init();
    else curl_reset($curl);
    curl_setopt_array($curl, [
        CURLOPT_URL=>$url, CURLOPT_FOLLOWLOCATION=>false, CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT_MS=>min(1500, $remaining), CURLOPT_TIMEOUT_MS=>min(4000, $remaining),
        CURLOPT_HTTPHEADER=>['Accept: application/json'], CURLOPT_USERAGENT=>'TeLoRecargo-PublicSEO/2.0',
        CURLOPT_WRITEFUNCTION=>static function ($handle, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > 4 * 1024 * 1024) return 0;
            $body .= $chunk;
            return strlen($chunk);
        },
    ]);
    $success = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if ($success === false || $status !== 200) return null;
    $data = json_decode($body, true);
    if (!is_array($data)) return null;
    $list = $data['data'] ?? $data;
    if (!is_array($list) || ($list !== [] && array_keys($list) !== range(0, count($list) - 1))) return null;
    return $list;
}

function tlr_catalog(callable $fetch): array
{
    // Origen fijo: ni Host, ni query params ni cookies eligen el servidor consultado.
    $api = 'https://telorecargo.com/api';
    $carriers = $fetch($api . '/carriers');
    if ($carriers === null) throw new RuntimeException('Public catalog unavailable');
    $products = [];
    $ids = [];
    foreach ($carriers as $carrier) {
        if (!is_array($carrier) || !in_array(strtolower(tlr_text($carrier['Categoria'] ?? '')), ['paquetes','tiempo aire'], true)) continue;
        $list = $fetch($api . '/producto?carrier=' . rawurlencode($carrier['Nombre']));
        if ($list === null) throw new RuntimeException('Public carrier unavailable');
        foreach ($list as $raw) {
            if (!is_array($raw) || ($raw['Carrier'] ?? '') !== $carrier['Nombre']) continue;
            $product = tlr_product($raw, $carrier);
            if (isset($ids[$product['id']])) throw new RuntimeException('Duplicate public product');
            $ids[$product['id']] = true;
            $products[] = $product;
        }
    }
    usort($products, static function ($a, $b) { return strcasecmp($a['carrier'], $b['carrier']) ?: ($a['price'] <=> $b['price']); });
    return $products;
}

function tlr_cached_catalog(callable $load, ?string $directory = null, ?int $now = null): array
{
    $now = $now ?? time();
    $directory = $directory ?? sys_get_temp_dir() . '/tlr-public-seo-' . substr(hash('sha256', __DIR__), 0, 16);
    $file = $directory . '/catalog-v5.json';
    $read = static function () use ($file, $now) {
        if (!is_file($file)) return null;
        $value = json_decode((string) @file_get_contents($file), true);
        return is_array($value) && isset($value['fetched_at'], $value['data']) && is_array($value['data']) && $value['fetched_at'] > $now - 120 && $value['fetched_at'] <= $now ? $value : null;
    };
    $cached = $read();
    if ($cached !== null) return $cached;
    // Si el hosting no permite escribir caché, sigue funcionando bajo petición.
    if (!is_dir($directory) && !@mkdir($directory, 0700, true)) return ['data'=>$load(), 'fetched_at'=>$now];
    $lock = @fopen($directory . '/catalog.lock', 'c');
    if (!$lock) return ['data'=>$load(), 'fetched_at'=>$now];
    if (!flock($lock, LOCK_EX | LOCK_NB)) { fclose($lock); throw new RuntimeException('Catalog refresh in progress'); }
    try {
        $cached = $read();
        if ($cached !== null) return $cached;
        $value = ['data'=>$load(), 'fetched_at'=>$now];
        $temporary = @tempnam($directory, 'catalog-');
        if ($temporary !== false) {
            if (@file_put_contents($temporary, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) !== false) {
                @chmod($temporary, 0600);
                // rename reemplaza de forma atómica el archivo en el hosting Linux.
                if (!@rename($temporary, $file)) @unlink($temporary);
            } else @unlink($temporary);
        }
        return $value;
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}

function tlr_route(string $uri): ?array
{
    $path = parse_url($uri, PHP_URL_PATH);
    if (!is_string($path)) return null;
    if ($path === '/paquetes' || $path === '/paquetes/') return ['type'=>'catalog', 'path'=>$path];
    if ($path === '/catalogo-paquetes.json') return ['type'=>'json', 'path'=>$path];
    if ($path === '/catalogo-companias.json') return ['type'=>'carriers-json', 'path'=>$path];
    if (preg_match('~^/paquetes/(companias|recargas)/([a-z0-9-]{1,90})/?$~D', $path, $match)) return ['type'=>'company', 'kind'=>$match[1] === 'companias' ? 'paquetes' : 'recargas', 'slug'=>$match[2], 'path'=>$path];
    if ($path === '/sitemap.xml') return ['type'=>'sitemap', 'path'=>$path];
    if (preg_match('~^/og/paquete-([0-9]{1,12})\.png$~D', $path, $match)) return ['type'=>'image', 'id'=>$match[1], 'path'=>$path];
    if (preg_match('~^/paquetes/[a-z0-9-]{1,100}-([0-9]{1,12})/?$~D', $path, $match)) return ['type'=>'detail', 'id'=>$match[1], 'path'=>$path];
    return null;
}

function tlr_description(array $product): string
{
    return $product['name'] . ' de ' . $product['carrier'] . '. ' . tlr_money($product['price']) . ' MXN.' . ($product['validity'] ? ' Vigencia: ' . $product['validity'] . '.' : '') . ' ' . $product['description'] . ' Pídelo con tu proveedor más cercano.';
}

function tlr_head(array $config, string $title, string $description, string $path, string $image, ?array $schema = null, bool $noindex = false): string
{
    $url = $config['origin'] . $path;
    $html = '<title>' . tlr_escape($title) . '</title><link rel="canonical" href="' . tlr_escape($url) . '">';
    $tags = ['description'=>$description, 'robots'=>$noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
        'og:title'=>$title, 'og:description'=>$description, 'og:type'=>'website', 'og:site_name'=>'TeLoRecargo', 'og:locale'=>'es_MX',
        'og:url'=>$url, 'og:image'=>$config['origin'] . $image, 'og:image:width'=>'1200', 'og:image:height'=>'630', 'og:image:type'=>'image/png', 'og:image:alt'=>$title,
        'twitter:card'=>'summary_large_image', 'twitter:title'=>$title, 'twitter:description'=>$description, 'twitter:image'=>$config['origin'] . $image];
    if (!empty($config['verification'])) $tags['google-site-verification'] = $config['verification'];
    foreach ($tags as $name=>$value) $html .= '<meta ' . (strpos($name, 'og:') === 0 ? 'property' : 'name') . '="' . $name . '" content="' . tlr_escape($value) . '">';
    if ($schema !== null) $html .= '<script type="application/ld+json">' . json_encode($schema, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) . '</script>';
    return $html;
}

function tlr_page(string $head, string $body, ?array $config = null): string
{
    $header = $config['publicHeader'] ?? '<header class="public-nav"><div class="shell nav-inner"><a class="brand" href="/">TeLoRecargo</a><nav class="nav-links"><a href="/paquetes/">Paquetes</a><a href="/contacto">Contacto</a><a href="/iniciar-sesion">Mi cuenta</a></nav></div></header>';
    $footer = $config['publicFooter'] ?? '<footer><div class="shell"><span>TeLoRecargo</span><a href="/terminos-condiciones">Términos y condiciones</a></div></footer>';
    return '<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' . $head . '<link rel="manifest" href="/manifest.json?v=tlr-20261027"><link rel="apple-touch-icon" href="/icons/tlr-192.png"><link rel="stylesheet" href="/app-loading.css"><script src="/pwa.js" defer></script><meta name="application-name" content="TeLoRecargo"><meta name="apple-mobile-web-app-title" content="TeLoRecargo"><meta name="theme-color" content="#073252"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/seo-catalog.css"><link rel="stylesheet" href="/marketing.css"><script type="module" src="/seo-catalog.js"></script><script type="module" src="/marketing.js"></script></head><body><div class="m-site m-packages" data-marketing id="arriba">' . $header . '<main id="contenido">' . $body . '</main>' . $footer . '</div></body></html>';
}

function tlr_share_links(array $product, ?string $origin = null): string
{
    static $config = null;
    if ($config === null) $config = json_decode(@file_get_contents(__DIR__ . '/seo-runtime-config.json'), true) ?: ['origin'=>'https://telorecargo.com'];
    $url = ($origin ?? $config['origin']) . $product['path'];
    return '<div class="package-share-links" aria-label="Compartir paquete"><a href="https://wa.me/?text=' . tlr_escape(rawurlencode($product['name'] . ' - ' . $url)) . '" target="_blank" rel="noopener noreferrer" class="share-whatsapp"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l1.8-5.4A8.4 8.4 0 1 1 21 11.5Z"/><path d="M8 7c0 4 3 7 7 7l1-2-3-1-1 1-2-2 1-1-1-2Z"/></svg><span>WhatsApp</span></a><a href="https://www.facebook.com/sharer/sharer.php?u=' . tlr_escape(rawurlencode($url)) . '" target="_blank" rel="noopener noreferrer" class="share-facebook"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 21v-8h3l.5-4H14V7c0-1 .5-1.5 1.5-1.5H18V2h-3c-3 0-5 2-5 5v2H7v4h3v8"/></svg><span>Facebook</span></a><button type="button" class="share-copy" aria-label="Copiar enlace del paquete" data-copy="' . tlr_escape($url) . '"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg><span>Copiar</span></button><span class="share-status" data-share-status role="status"></span></div>';
}

function tlr_card(array $product): string
{
    $isPackage = ($product['kind'] ?? 'paquetes') === 'paquetes';
    $action = !empty($product['path']) ? '<a class="btn package-card-action" href="' . tlr_escape($product['path']) . '">Consultar detalles <span aria-hidden="true">↗</span></a>' : '<p class="airtime-note">Solicita este monto en tu punto de recarga.</p>';
    return '<article class="package-card" data-package="' . tlr_escape($product['name'] . ' ' . $product['description']) . '"><div class="package-card-top"><span class="package-kind">' . ($isPackage ? 'PAQUETE' : 'RECARGA') . '</span><span class="package-card-dot" aria-hidden="true"></span></div>' . tlr_carrier_label($product) . '<h2>' . tlr_escape($product['name']) . '</h2><div class="price">' . tlr_money($product['price']) . '<span class="currency">MXN</span></div><div class="package-card-rule"></div><div class="validity"><span>Vigencia</span><strong>' . tlr_escape($product['validity'] ?: 'Consulta con tu proveedor') . '</strong></div><p class="summary">' . tlr_escape($product['description'] ?: 'Consulta los beneficios con tu proveedor.') . '</p><div class="card-actions">' . $action . '</div>' . tlr_share_links($product) . '</article>';
}
function tlr_browser_dialog(): string
{
    return '<dialog class="catalog-dialog" data-carrier-dialog aria-labelledby="carrier-dialog-title"><div class="catalog-dialog-head"><div><span class="eyebrow" data-dialog-kind>COMPAÑÍA</span><h2 id="carrier-dialog-title">Opciones de la compañía</h2></div><button type="button" class="catalog-dialog-close" data-dialog-close aria-label="Cerrar opciones">×</button></div><div class="catalog-dialog-body" data-carrier-dialog-content></div><div class="catalog-dialog-foot"><a href="/paquetes/" data-company-page>Ver compañía en una página completa ↗</a></div></dialog>';
}
function tlr_location_dialog(string $carrier): string
{
    $maps = tlr_escape('https://www.google.com/maps/search/?api=1&query=' . rawurlencode('recargas ' . $carrier . ' cerca de mí'));
    return '<dialog class="catalog-dialog location-dialog" data-location-dialog aria-labelledby="location-dialog-title"><div class="catalog-dialog-head"><h2 id="location-dialog-title">Encuentra un punto de recarga</h2><button class="catalog-dialog-close" type="button" data-dialog-close aria-label="Cerrar ubicación">×</button></div><div class="catalog-dialog-body"><p>Por ahora no contamos con un directorio público de negocios afiliados a TeLoRecargo.</p><p>La búsqueda de Maps muestra establecimientos de tu zona. Antes de visitarlos, confirma que ofrezcan este paquete y que trabajen con TeLoRecargo.</p><a class="btn" href="' . $maps . '" target="_blank" rel="noopener noreferrer">Buscar puntos de recarga en Maps ↗</a><a class="btn secondary" href="/contacto">Consultar con TeLoRecargo</a></div></dialog>';
}
function tlr_catalog_html(array $carriers, array $config): string
{
    $items = [];
    foreach ($carriers as $index=>$carrier) $items[] = ['@type'=>'ListItem','position'=>$index+1,'name'=>$carrier['name'],'url'=>$config['origin'] . $carrier['path']];
    $head = tlr_head($config, 'Compañías de recargas y paquetes | TeLoRecargo', 'Selecciona una compañía de recargas o paquetes. Consulta sus opciones y precios; abre la ficha completa de cada paquete para compartirla.', '/paquetes/', '/og/te-lo-recargo.png', ['@context'=>'https://schema.org','@type'=>'CollectionPage','name'=>'Compañías de recargas y paquetes','mainEntity'=>['@type'=>'ItemList','itemListElement'=>$items]]);
    $body = '<section class="hero directory-hero"><div class="shell"><span class="eyebrow">ELIGE TU COMPAÑÍA</span><h1>Tu conexión empieza aquí.</h1><p>Primero elige una compañía. Después consulta sus montos o paquetes y abre la ficha del paquete que quieras compartir.</p><label class="carrier-search-label">Buscar compañía<input class="search" type="search" data-carrier-search placeholder="Telcel, BAIT, Movistar…"></label><span class="directory-count" data-carrier-count role="status">' . count($carriers) . ' compañías disponibles</span></div></section><div class="shell carrier-directory">';
    foreach (['recargas'=>'Recargas de tiempo aire','paquetes'=>'Paquetes'] as $kind=>$title) {
        $body .= '<section class="carrier-section" aria-labelledby="heading-' . $kind . '"><div class="carrier-section-head"><div><span class="eyebrow">' . ($kind === 'paquetes' ? 'INTERNET Y MÁS' : 'SALDO PARA TU LÍNEA') . '</span><h2 id="heading-' . $kind . '">' . $title . '</h2></div><div class="carrier-controls"><button type="button" data-carousel-prev aria-label="Compañías anteriores" aria-controls="track-' . $kind . '">←</button><button type="button" data-carousel-next aria-label="Siguientes compañías" aria-controls="track-' . $kind . '">→</button></div></div><div class="carrier-track" data-carrier-track id="track-' . $kind . '">';
        foreach ($carriers as $carrier) if ($carrier['kind'] === $kind) {
            $image = $carrier['logo'] ? '<img data-carrier-logo src="' . tlr_escape($carrier['logo']) . '" alt="' . tlr_escape($carrier['name']) . '" width="160" height="96" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '';
            $body .= '<a class="carrier-tile" href="' . tlr_escape($carrier['path']) . '" data-carrier-open data-kind="' . $kind . '" data-slug="' . tlr_escape($carrier['slug']) . '" data-name="' . tlr_escape($carrier['name']) . '" aria-label="Ver ' . $kind . ' de ' . tlr_escape($carrier['name']) . '">' . $image . '<span class="carrier-fallback"' . ($image ? ' hidden' : '') . '>' . tlr_escape($carrier['name']) . '</span><span class="carrier-tile-arrow" aria-hidden="true">↗</span></a>';
        }
        $body .= '</div><p class="carrier-swipe-note">Desliza o selecciona un logo para ver las opciones de esa compañía.</p></section>';
    }
    $body .= '<p class="carrier-no-results" data-carrier-empty hidden>No encontramos esa compañía. Intenta con otro nombre.</p></div>' . tlr_browser_dialog();
    return tlr_page($head, $body, $config);
}
function tlr_company_html(array $carrier, array $products, array $config): string
{
    $isPackage = $carrier['kind'] === 'paquetes';
    $title = ($isPackage ? 'Paquetes' : 'Recargas') . ' de ' . $carrier['name'];
    $items = [];
    foreach ($products as $index=>$product) $items[] = ['@type'=>'ListItem','position'=>$index+1,'name'=>$product['name'],'url'=>$config['origin'] . ($product['path'] ?: $carrier['path'])];
    $head = tlr_head($config, $title . ' | TeLoRecargo', 'Consulta opciones y precios de ' . $carrier['name'] . '. ' . ($isPackage ? 'Abre cada paquete para conocer sus beneficios y compartir su ficha completa.' : 'Consulta los montos y solicita tu recarga en un punto de venta.'), $carrier['path'], '/og/te-lo-recargo.png', ['@context'=>'https://schema.org','@type'=>'CollectionPage','name'=>$title,'mainEntity'=>['@type'=>'ItemList','itemListElement'=>$items]]);
    $body = '<section class="hero company-hero"><div class="shell"><a class="catalog-back" href="/paquetes/">← Volver a compañías</a>' . tlr_carrier_label(['carrier'=>$carrier['name'],'logo'=>$carrier['logo']]) . '<h1>' . tlr_escape($title) . '</h1><p>' . ($isPackage ? 'Elige un paquete para ver todos sus beneficios y compartir la ficha completa.' : 'Revisa los montos y consulta su disponibilidad en tu punto de recarga.') . '</p></div></section><section class="shell company-options"><div class="toolbar"><span data-result-count role="status">' . count($products) . ' opciones disponibles</span><input class="search" type="search" data-package-search aria-label="Buscar una opción" placeholder="Busca un monto o beneficio…"></div><div class="grid">' . implode('',array_map('tlr_card',$products)) . '</div>' . (!$products ? '<p class="note">No hay opciones disponibles para esta compañía por el momento.</p>' : '') . '</section>';
    return tlr_page($head, $body, $config);
}
function tlr_detail_html(array $product, array $products, array $config, int $fetchedAt): string
{
    $url = $config['origin'] . $product['path'];
    $title = $product['name'] . ' · ' . $product['carrier'] . ' | TeLoRecargo';
    $schema = ['@context'=>'https://schema.org', '@graph'=>[
        ['@type'=>'Product', 'name'=>$product['name'], 'description'=>$product['description'] ?: tlr_description($product), 'image'=>$config['origin'] . $product['image'], 'url'=>$url, 'sku'=>$product['id'], 'brand'=>['@type'=>'Brand','name'=>$product['carrier']], 'offers'=>['@type'=>'Offer','price'=>number_format($product['price'], 2, '.', ''),'priceCurrency'=>'MXN','url'=>$url]],
        ['@type'=>'BreadcrumbList', 'itemListElement'=>[
            ['@type'=>'ListItem', 'position'=>1, 'name'=>'Inicio', 'item'=>$config['origin'] . '/'],
            ['@type'=>'ListItem', 'position'=>2, 'name'=>'Paquetes', 'item'=>$config['origin'] . '/paquetes/'],
            ['@type'=>'ListItem', 'position'=>3, 'name'=>$product['name'], 'item'=>$url],
        ]],
    ]];
    $head = tlr_head($config, $title, tlr_description($product), $product['path'], $product['image'], $schema);
    $name = tlr_escape($product['name']);
    $carrier = tlr_escape($product['carrier']);
    $carrierLabel = tlr_carrier_label($product);
    $description = tlr_escape($product['description'] ?: 'Consulta los beneficios de este paquete con tu proveedor.');
    $validity = tlr_escape($product['validity'] ?: 'Consulta con tu proveedor');
    $price = tlr_money($product['price']);
    $whatsapp = tlr_escape('https://wa.me/?text=' . rawurlencode($product['name'] . ' de ' . $product['carrier'] . '. Consulta sus beneficios y pídelo con tu proveedor más cercano: ' . $url));
    $share = tlr_escape($url);
    $date = (new DateTimeImmutable('@' . $fetchedAt))->setTimezone(new DateTimeZone('America/Mexico_City'))->format('d/m/Y H:i');
    $benefits = preg_split('~\s*(?://+|\r?\n)\s*~u', $product['description'] ?: 'Consulta los beneficios con tu proveedor.', -1, PREG_SPLIT_NO_EMPTY);
    $benefitHtml = '<ul class="offer-benefits">';
    foreach ($benefits as $benefit) $benefitHtml .= '<li><span aria-hidden="true">&#10003;</span>' . tlr_escape($benefit) . '</li>';
    $benefitHtml .= '</ul>';
    $social = tlr_share_links($product, $config['origin']);
    $body = <<<HTML
<section class="offer-stage shell"><nav class="crumbs" aria-label="Ruta de navegaci&#243;n"><a href="/paquetes/">Cat&#225;logo</a><span>/</span><span>{$carrier}</span></nav>
<article class="offer-ticket"><header class="offer-ticket-head">{$carrierLabel}<span class="offer-tag">RECARGAS Y PAQUETES</span><h1>{$name}</h1><div class="offer-amount">{$price}<span>MXN</span></div><div class="offer-validity">Vigencia <strong>{$validity}</strong></div></header>
<div class="offer-ticket-body"><span class="eyebrow">TU CONEXI&#211;N, A TU MEDIDA</span><h2>Esto es lo que incluye</h2>{$benefitHtml}<div class="offer-share"><strong>Comp&#225;rtelo con quien quieras</strong>{$social}<button type="button" class="offer-native-share" data-share="{$share}" data-title="{$name}">M&#225;s opciones para compartir &#8599;</button><p data-share-status class="share-status" role="status"></p></div><p class="note">Confirma precio, cobertura, disponibilidad y condiciones con tu proveedor. Cat&#225;logo consultado: {$date} (Ciudad de M&#233;xico).</p></div></article>
<div class="offer-next"><a href="/paquetes/"><span>ENCUENTRA TU SIGUIENTE OPCI&#211;N</span><strong>Explorar m&#225;s paquetes &#8599;</strong><p>Compara otras compa&#241;&#237;as, montos y beneficios.</p></a><a href="/iniciar-sesion?modo=registro"><span>DA EL SIGUIENTE PASO</span><strong>Crea tu cuenta &#8599;</strong><p>Empieza con TeLoRecargo y administra tus recargas.</p></a></div></section>
HTML;
    $related = array_values(array_filter($products, static function ($item) use ($product) { return $item['id'] !== $product['id']; }));
    usort($related, static function ($a, $b) use ($product) { return (($a['carrier'] !== $product['carrier']) <=> ($b['carrier'] !== $product['carrier'])) ?: (abs($a['price'] - $product['price']) <=> abs($b['price'] - $product['price'])); });
    $related = array_slice($related, 0, 3);
    if ($related) $body .= '<section class="shell related"><div class="offer-related-head"><div><span class="eyebrow">SIGUE EXPLORANDO</span><h2>Otras opciones para ti</h2></div><a href="/paquetes/">Ver todo el cat&#225;logo &#8599;</a></div><div class="grid">' . implode('', array_map('tlr_card', $related)) . '</div></section>';
    $body .= tlr_location_dialog($product['carrier']);
    return tlr_page($head, $body, $config);
}

function tlr_image_lines(string $text, string $font, int $size, int $width, int $count): array
{
    $measure = static function ($line) use ($font, $size) { $box = imagettfbbox($size, 0, $font, $line); return $box[2] - $box[0]; };
    $lines = [''];
    foreach (preg_split('/\s+/u', $text) as $word) {
        $index = count($lines) - 1;
        if ($lines[$index] !== '' && $measure($lines[$index] . ' ' . $word) > $width) $lines[] = $word;
        else $lines[$index] .= ($lines[$index] !== '' ? ' ' : '') . $word;
    }
    $overflow = count($lines) > $count;
    $lines = array_slice($lines, 0, $count);
    foreach ($lines as $index=>&$line) {
        $shorten = $measure($line) > $width || ($overflow && $index === $count - 1);
        if (!$shorten) continue;
        $characters = preg_split('//u', $line, -1, PREG_SPLIT_NO_EMPTY);
        while ($characters && $measure(implode('', $characters) . '…') > $width) array_pop($characters);
        $line = implode('', $characters) . '…';
    }
    unset($line);
    return $lines;
}

// Only public HTTPS image hosts from the carrier catalog; no redirects or credentials.
function tlr_carrier_logo_bytes(string $url): ?string
{
    if ($url === '' || !function_exists('curl_init')) return null;
    $parts = parse_url($url);
    if (!is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || isset($parts['user']) || isset($parts['pass']) || (isset($parts['port']) && $parts['port'] !== 443)) return null;
    $host = $parts['host'] ?? '';
    if (!preg_match('/^[a-z0-9.-]+$/iD', $host)) return null;
    $cache = sys_get_temp_dir() . '/tlr-carrier-logos-v1';
    $file = $cache . '/' . hash('sha256', $url) . '.bin';
    if (is_file($file) && filemtime($file) > time() - 86400) { $bytes = @file_get_contents($file); return $bytes ?: null; }
    $ips = @gethostbynamel($host) ?: [];
    $publicIp = null;
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return null;
        $publicIp = $ip;
    }
    if ($publicIp === null) return null;
    $bytes = '';
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION=>false, CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT_MS=>500, CURLOPT_TIMEOUT_MS=>1500, CURLOPT_RESOLVE=>[$host . ':443:' . $publicIp],
        CURLOPT_HTTPHEADER=>['Accept: image/png,image/jpeg,image/webp,image/gif'],
        CURLOPT_WRITEFUNCTION=>static function ($handle, string $chunk) use (&$bytes): int {
            if (strlen($bytes) + strlen($chunk) > 2 * 1024 * 1024) return 0;
            $bytes .= $chunk; return strlen($chunk);
        }]);
    if (PHP_OS_FAMILY === 'Windows' && defined('CURLSSLOPT_NATIVE_CA')) curl_setopt($curl, CURLOPT_SSL_OPTIONS, CURLSSLOPT_NATIVE_CA);
    $success = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_HTTP_CODE); curl_close($curl);
    if ($success === false || $status !== 200) return null;
    $size = @getimagesizefromstring($bytes);
    if (!$size || $size[0] < 1 || $size[1] < 1 || $size[0] * $size[1] > 4000000 || !in_array($size[2], [IMAGETYPE_PNG,IMAGETYPE_JPEG,IMAGETYPE_GIF,IMAGETYPE_WEBP], true)) return null;
    if (is_dir($cache) || @mkdir($cache,0700,true)) @file_put_contents($file,$bytes,LOCK_EX);
    return $bytes;
}

function tlr_png(array $product, string $font, ?string $carrierLogoBytes = null): ?string
{
    if (!function_exists('imagecreatetruecolor') || !function_exists('imagettftext') || !is_file($font)) return null;
    $image = imagecreatetruecolor(1200, 630);
    $background = imagecolorallocate($image, 8, 28, 56);
    $accent = imagecolorallocate($image, 23, 105, 220);
    $white = imagecolorallocate($image, 255, 255, 255);
    $blue = imagecolorallocate($image, 134, 198, 255);
    $muted = imagecolorallocate($image, 200, 217, 238);
    $green = imagecolorallocate($image, 137, 215, 185);
    imagefill($image, 0, 0, $background);
    imagefilledrectangle($image, 0, 542, 1199, 629, $accent);
    imageline($image, 64, 108, 1136, 108, imagecolorallocate($image, 53, 85, 114));
    $brandPath = __DIR__ . '/assets/img/logo3.png';
    if (is_file($brandPath)) {
        $brand = imagecreatefrompng($brandPath);
        imagecopyresampled($image, $brand, 64, 0, 0, (int) (imagesy($brand) * .2), 190, 114, imagesx($brand), (int) (imagesy($brand) * .6));
        imagedestroy($brand);
    } else imagettftext($image, 24, 0, 64, 78, $white, $font, 'TeLoRecargo');
    $draw = static function ($value, $size, $x, $y, $width, $count, $spacing, $color) use ($font, $image) {
        foreach (tlr_image_lines($value, $font, $size, $width, $count) as $index=>$line) imagettftext($image, $size, 0, $x, $y + $index * $spacing, $color, $font, $line);
    };
    // White logo plate keeps all carrier colors legible, without stretching the image.
    imagefilledrectangle($image, 850, 18, 1136, 96, $white);
    $logoBytes = $carrierLogoBytes ?? tlr_carrier_logo_bytes($product['logo'] ?? '');
    $carrierImage = $logoBytes ? @imagecreatefromstring($logoBytes) : false;
    if ($carrierImage) {
        $scale = min(254 / imagesx($carrierImage), 54 / imagesy($carrierImage));
        $logoWidth = max(1, (int) round(imagesx($carrierImage) * $scale));
        $logoHeight = max(1, (int) round(imagesy($carrierImage) * $scale));
        imagecopyresampled($image, $carrierImage, 866 + (int) ((254 - $logoWidth) / 2), 30 + (int) ((54 - $logoHeight) / 2), 0, 0, $logoWidth, $logoHeight, imagesx($carrierImage), imagesy($carrierImage));
        imagedestroy($carrierImage);
    } else $draw($product['carrier'], 15, 866, 53, 254, 2, 23, $background);
    $draw($product['carrier'], 16, 64, 160, 1072, 1, 28, $blue);
    $draw($product['name'], 32, 64, 225, 780, 2, 53, $white);
    $draw($product['description'] ?: 'Consulta los beneficios con tu proveedor.', 19, 64, 350, 1072, 3, 36, $muted);
    $draw('Vigencia: ' . ($product['validity'] ?: 'Consulta con tu proveedor'), 17, 64, 492, 1072, 1, 24, $green);
    imagefilledrectangle($image, 895, 178, 1136, 284, $white);
    $draw(tlr_money($product['price']), 25, 915, 225, 205, 1, 30, $accent);
    imagettftext($image, 13, 0, 915, 260, $background, $font, 'MXN · Precio catálogo');
    imagettftext($image, 23, 0, 64, 597, $white, $font, 'Pídelo con tu proveedor más cercano');
    ob_start();
    imagepng($image);
    $bytes = ob_get_clean();
    imagedestroy($image);
    return $bytes === false ? null : $bytes;
}

function tlr_error(array $config, int $status): string
{
    $title = $status === 404 ? 'Este paquete no está disponible.' : 'No pudimos consultar el catálogo en este momento.';
    $head = tlr_head($config, $title . ' | TeLoRecargo', 'Consulta el catálogo de paquetes de TeLoRecargo.', '/paquetes/', '/og/te-lo-recargo.png', null, true);
    return tlr_page($head, '<section class="shell hero"><h1>' . $title . '</h1><p>' . ($status === 404 ? 'Consulta los paquetes disponibles.' : 'Espera un momento y vuelve a intentarlo.') . '</p><a class="btn" href="/paquetes/">Volver al catálogo</a></section>', $config);
}

function tlr_serve(?array $config = null, ?callable $loader = null, ?string $cacheDirectory = null, ?callable $carrierLoader = null, ?callable $companyLoader = null): void
{
    $config = $config ?? json_decode((string) @file_get_contents(__DIR__ . '/seo-runtime-config.json'), true);
    $config = is_array($config) ? $config : ['origin'=>'https://telorecargo.com', 'verification'=>''];
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache');
    if ($method !== 'GET' && $method !== 'HEAD') { http_response_code(405); header('Allow: GET, HEAD'); return; }
    $route = tlr_route($_SERVER['REQUEST_URI'] ?? '/');
    if ($route === null) { http_response_code(404); if ($method !== 'HEAD') echo tlr_error($config, 404); return; }
    $deadline = microtime(true) + 8;
    $fetch = static function ($url) use ($deadline) { return tlr_fetch($url, $deadline); };
    $carrierLoader = $carrierLoader ?? static function () use ($fetch) { return tlr_carriers($fetch); };
    $companyLoader = $companyLoader ?? static function ($carrier) use ($fetch) { return tlr_company_products($carrier, $fetch); };
    $cacheBase = $cacheDirectory ?? sys_get_temp_dir() . '/tlr-public-seo-' . substr(hash('sha256', __DIR__), 0, 16);
    if (in_array($route['type'], ['catalog','carriers-json','company'], true)) {
        try {
            $directory = tlr_cached_catalog($carrierLoader, $cacheBase . '/directory');
            $carriers = $directory['data'];
            $query = [];
            parse_str(parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY) ?? '', $query);
            $slug = $route['slug'] ?? ($query['compania'] ?? null);
            $kind = $route['kind'] ?? ($query['tipo'] ?? null);
            if ($route['type'] === 'catalog') {
                if ($route['path'] !== '/paquetes/') { header('Location: ' . $config['origin'] . '/paquetes/', true, 301); return; }
                if ($method !== 'HEAD') echo tlr_catalog_html($carriers, $config);
                return;
            }
            if ($route['type'] === 'carriers-json' && $slug === null) {
                header('Content-Type: application/json; charset=UTF-8'); header('X-Robots-Tag: noindex');
                if ($method !== 'HEAD') echo json_encode(['data'=>$carriers], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                return;
            }
            $carrier = null;
            foreach ($carriers as $candidate) if ($candidate['slug'] === $slug && $candidate['kind'] === $kind) { $carrier = $candidate; break; }
            if ($carrier === null) {
                http_response_code(404);
                if ($route['type'] === 'carriers-json') { header('Content-Type: application/json'); if ($method !== 'HEAD') echo '{"message":"Compañía no disponible"}'; }
                elseif ($method !== 'HEAD') echo tlr_error($config, 404);
                return;
            }
            $company = tlr_cached_catalog(static function () use ($companyLoader, $carrier) { return $companyLoader($carrier); }, $cacheBase . '/companies/' . $carrier['kind'] . '-' . $carrier['slug']);
            if ($route['type'] === 'carriers-json') {
                header('Content-Type: application/json; charset=UTF-8'); header('X-Robots-Tag: noindex');
                if ($method !== 'HEAD') echo json_encode(['data'=>$company['data'],'carrier'=>$carrier], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } elseif ($route['path'] !== $carrier['path']) header('Location: ' . $config['origin'] . $carrier['path'], true, 301);
            elseif ($method !== 'HEAD') echo tlr_company_html($carrier, $company['data'], $config);
        } catch (Throwable $error) {
            http_response_code(503); header('Retry-After: 60');
            if ($method !== 'HEAD') echo tlr_error($config, 503);
        }
        return;
    }
    try {
        $load = $loader ?? static function () use ($deadline) { return tlr_catalog(static function ($url) use ($deadline) { return tlr_fetch($url, $deadline); }); };
        $catalog = tlr_cached_catalog($load, $cacheDirectory);
        $products = $catalog['data'];
    } catch (Throwable $error) {
        http_response_code(503);
        header('Retry-After: 60');
        if ($method !== 'HEAD') echo tlr_error($config, 503);
        return;
    }
    if ($route['type'] === 'json') {
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Robots-Tag: noindex');
        if ($method !== 'HEAD') echo json_encode(['data'=>$products], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return;
    }
    if ($route['type'] === 'sitemap') {
        try { $directory = tlr_cached_catalog($carrierLoader, $cacheBase . '/directory'); }
        catch (Throwable $error) { http_response_code(503); header('Retry-After: 60'); if ($method !== 'HEAD') echo tlr_error($config,503); return; }
        header('Content-Type: application/xml; charset=UTF-8');
        if ($method === 'HEAD') return;
        echo '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach (array_unique(array_merge($config['publicPages'] ?? ['/'], ['/paquetes/'], array_column($directory['data'], 'path'), array_column($products, 'path'))) as $path) echo '<url><loc>' . tlr_escape($config['origin'] . $path) . '</loc></url>';
        echo '</urlset>';
        return;
    }
    if ($route['type'] === 'catalog') {
        if ($route['path'] !== '/paquetes/') { header('Location: ' . $config['origin'] . '/paquetes/', true, 301); return; }
        if ($method !== 'HEAD') echo tlr_catalog_html($products, $config);
        return;
    }
    $product = null;
    foreach ($products as $candidate) if ($candidate['id'] === $route['id']) { $product = $candidate; break; }
    if ($product === null) { http_response_code(404); if ($method !== 'HEAD') echo tlr_error($config, 404); return; }
    if ($route['type'] === 'detail') {
        // El ID mantiene funcionando enlaces antiguos si el nombre cambia.
        if ($route['path'] !== $product['path']) { header('Location: ' . $config['origin'] . $product['path'], true, 301); return; }
        if ($method !== 'HEAD') echo tlr_detail_html($product, $products, $config, $catalog['fetched_at']);
        return;
    }
    header('Content-Type: image/png');
    header('Cache-Control: public, max-age=120');
    $font = __DIR__ . '/fonts/Lato-Regular.ttf';
    $fallback = __DIR__ . '/og/te-lo-recargo.png';
    $canRender = function_exists('imagecreatetruecolor') && function_exists('imagettftext') && is_file($font);
    $renderer = $canRender ? 'gd-v3-carrier-logo' : 'fallback-' . (is_file($fallback) ? hash_file('sha256', $fallback) : 'missing');
    $etag = '"' . hash('sha256', $renderer . json_encode($product)) . '"';
    header('ETag: ' . $etag);
    if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); return; }
    if ($method === 'HEAD') return;
    $png = tlr_png($product, $font);
    if ($png !== null) echo $png;
    elseif (is_file($fallback)) { header('X-TLR-Image: fallback'); readfile($fallback); }
    else { http_response_code(503); header('Content-Type: text/plain; charset=UTF-8'); header('Cache-Control: no-store'); echo 'Imagen no disponible'; }
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) tlr_serve();
