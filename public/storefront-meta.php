<?php
// PHP 7.4+ with cURL. Vite copies this file into dist alongside index.html.
// This serves the same React application, with metadata in its initial HTML.

function sf_object($value): array
{
    if (is_string($value)) $value = json_decode($value, true);
    return is_array($value) ? $value : [];
}

function sf_asset($value, string $api): string
{
    if (!is_string($value) || trim($value) === '') return '';
    $value = trim($value);
    $value = preg_replace('~^\[[^\]]*\]\((https?://[^)]+)\)$~i', '$1', $value);
    if (preg_match('~^https?://~i', $value)) return $value;
    if (preg_match('~^[a-z][a-z0-9+.-]*:~i', $value)) return '';
    if (substr($value, 0, 2) === '//') return 'https:' . $value;
    return 'https://' . parse_url($api, PHP_URL_HOST) . '/' . ltrim($value, '/');
}

function sf_route(string $uri, string $host): ?array
{
    $host = preg_replace('/:\d+$/', '', strtolower($host));
    $host = preg_replace('/^www\./', '', $host);
    $custom = ['latehuanita.mx' => 'la-tehuanita'];
    $path = parse_url($uri, PHP_URL_PATH);
    if (!is_string($path)) return null;
    $product = null;
    if (isset($custom[$host]) && preg_match('~^/(?:producto/([0-9]+))?/?$~', $path, $match)) {
        $slug = $custom[$host];
        $product = $match[1] ?? null;
        $base = '';
    } elseif ($host === 'mitiendaenlineamx.com.mx' && preg_match('~^/tienda/([a-zA-Z0-9_-]+)(?:/producto/([0-9]+))?/?$~', $path, $match)) {
        $slug = $match[1];
        $product = $match[2] ?? null;
        $base = '/tienda/' . rawurlencode($slug);
    } else {
        return null;
    }
    parse_str(parse_url($uri, PHP_URL_QUERY) ?? '', $query);
    $branch = $query['branch'] ?? '';
    if (!is_string($branch) || !preg_match('/^[a-zA-Z0-9_-]*$/', $branch)) $branch = '';
    return [
        'slug' => $slug, 'product' => $product, 'branch' => $branch,
        'url' => 'https://' . $host . $base . ($product !== null ? '/producto/' . $product : ($base === '' ? '/' : '')),
    ];
}

function sf_fetch(string $url, float $deadline): ?array
{
    if (!function_exists('curl_init')) return null;
    // Cache only public API responses, outside public_html, scoped to this install.
    $directory = sys_get_temp_dir() . '/mtelmx-meta-' . substr(hash('sha256', __DIR__), 0, 16);
    $cache = $directory . '/' . hash('sha256', $url) . '.json';
    if (is_file($cache) && filemtime($cache) > time() - 120) {
        $cached = json_decode((string) @file_get_contents($cache), true);
        if (is_array($cached)) return $cached;
    }
    $remaining = (int) (($deadline - microtime(true)) * 1000);
    if ($remaining <= 0) return null;
    $body = '';
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT_MS => min(1500, $remaining),
        CURLOPT_TIMEOUT_MS => $remaining,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_USERAGENT => 'MTELMX-Storefront-Metadata/1.0',
        CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > 12 * 1024 * 1024) return 0;
            $body .= $chunk;
            return strlen($chunk);
        },
    ]);
    $success = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if ($success === false || $status !== 200) return null;
    $data = json_decode($body, true);
    if (!is_array($data)) return null;
    if (is_dir($directory) || @mkdir($directory, 0700, true)) {
        @file_put_contents($cache, $body, LOCK_EX);
    }
    return $data;
}

function sf_metadata(array $route, string $api, callable $fetch): ?array
{
    $branches = $fetch($api . '/public/storefront/' . rawurlencode($route['slug']) . '/branches');
    if ($branches === null) return null;
    $branches = isset($branches['data']) ? sf_object($branches['data']) : $branches;
    $list = sf_object($branches['branches'] ?? []);
    $branch = $list[0]['slug'] ?? $route['slug'];
    $requestedFound = false;
    foreach ($list as $item) {
        if (($item['slug'] ?? '') === $route['branch']) {
            $branch = $item['slug'];
            $requestedFound = true;
            break;
        }
    }
    $response = $fetch($api . '/public/storefront/' . rawurlencode($branch));
    if ($response === null) return null;
    $payload = isset($response['sitio']) || isset($response['store']) ? $response : sf_object($response['data'] ?? $response);
    if (empty($payload['ok']) || !empty($payload['expired'])) return ['unavailable' => true];
    $site = sf_object($payload['sitio'] ?? $payload['site'] ?? []);
    $store = sf_object($payload['store'] ?? $branches['store'] ?? []);
    $branding = sf_object($site['branding'] ?? []);
    $identity = sf_object($site['identity'] ?? []);
    $hero = sf_object($site['hero'] ?? []);
    $name = ($store['name'] ?? '') ?: ($identity['title'] ?? '') ?: ($site['titulo_1'] ?? '') ?: 'Tienda';
    $logo = sf_asset(($branding['logo'] ?? '') ?: ($site['logo'] ?? '') ?: ($payload['logo'] ?? '') ?: ($store['logo'] ?? ''), $api);
    $product = null;
    if ($route['product'] !== null) {
        $products = $fetch($api . '/tienda/' . rawurlencode($route['slug']) . '/products');
        if ($products === null) return null;
        foreach (sf_object($products['data'] ?? $products) as $candidate) {
            if (is_array($candidate) && (string) ($candidate['id'] ?? '') === $route['product']) {
                $product = $candidate;
                break;
            }
        }
        if ($product === null) return ['unavailable' => true];
    }
    $title = $product !== null ? ($product['name'] ?? 'Producto') . ' | ' . $name : $name;
    $description = $product['shortDescription'] ?? '';
    if (!$description) $description = $product['fullDescription'] ?? '';
    if (!$description) $description = $identity['description'] ?? $site['descripcion'] ?? $hero['subtitle'] ?? '';
    if (!$description) $description = 'Explora los productos de ' . $name . '.';
    $description = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $description)));
    $description = function_exists('mb_substr') ? mb_substr($description, 0, 200) : $description;
    $images = $product['image'] ?? [];
    if (is_string($images)) $images = json_decode($images, true) ?? [$images];
    $image = sf_asset(is_array($images) ? ($images[0] ?? '') : $images, $api) ?: $logo;
    $url = $route['url'] . ($requestedFound ? '?branch=' . rawurlencode($route['branch']) : '');
    return compact('title', 'description', 'name', 'logo', 'image', 'url') + [
        'alt' => $product['name'] ?? ('Logo de ' . $name),
        'slug' => $route['slug'], 'branch' => $route['branch'],
    ];
}

function sf_escape($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function sf_render(string $html, array $meta): string
{
    // Remove only metadata owned by this handler. Keep assets, scripts and viewport.
    $html = preg_replace('~<title\b[^>]*>.*?</title>~is', '', $html);
    $html = preg_replace('~<meta\b[^>]*(?:name|property)\s*=\s*["\'](?:description|robots|og:[^"\']+|twitter:[^"\']+)["\'][^>]*>~i', '', $html);
    $html = preg_replace('~<link\b[^>]*rel\s*=\s*["\']canonical["\'][^>]*>~i', '', $html);
    if (!empty($meta['unavailable'])) {
        $head = '<title>Tienda o producto no disponible</title><meta name="robots" content="noindex, nofollow">';
    } else {
        $head = '<title data-rh="true">' . sf_escape($meta['title']) . '</title>';
        $head .= '<link data-rh="true" rel="canonical" href="' . sf_escape($meta['url']) . '">';
        $tags = [
            'description' => $meta['description'], 'og:title' => $meta['title'],
            'og:description' => $meta['description'], 'og:type' => 'website',
            'og:url' => $meta['url'], 'og:site_name' => $meta['name'], 'og:locale' => 'es_MX',
            'twitter:card' => $meta['image'] ? 'summary_large_image' : 'summary',
            'twitter:title' => $meta['title'], 'twitter:description' => $meta['description'],
        ];
        if ($meta['image']) {
            $tags += ['og:image' => $meta['image'], 'og:image:alt' => $meta['alt'], 'twitter:image' => $meta['image'], 'twitter:image:alt' => $meta['alt']];
        }
        foreach ($tags as $key => $value) {
            $head .= '<meta data-rh="true" ' . (strpos($key, 'og:') === 0 ? 'property' : 'name') . '="' . $key . '" content="' . sf_escape($value) . '">';
        }
        if ($meta['logo']) {
            $html = preg_replace('~<link\b[^>]*rel\s*=\s*["\'](?:icon|shortcut icon|apple-touch-icon)["\'][^>]*>~i', '', $html);
            $head .= '<link rel="icon" href="' . sf_escape($meta['logo']) . '">';
        }
        // Non-executable data makes the logo available on the very first visit.
        $brand = array_intersect_key($meta, array_flip(['slug', 'branch', 'name', 'logo']));
        $head .= '<script id="storefront-brand" type="application/json">' . json_encode($brand, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . '</script>';
    }
    return preg_replace_callback('~</head>~i', static function () use ($head) { return $head . "\n</head>"; }, $html, 1);
}

function sf_serve(): void
{
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache');
    $html = @file_get_contents(__DIR__ . '/index.html');
    if ($html === false) { http_response_code(503); echo 'Publica el build completo para cargar la tienda.'; return; }
    $route = sf_route($_SERVER['REQUEST_URI'] ?? '/', $_SERVER['HTTP_HOST'] ?? '');
    if ($route === null) { http_response_code(404); echo $html; return; }
    $api = rtrim(getenv('STOREFRONT_API_URL') ?: 'https://mitiendaenlineamx.com.mx/api', '/');
    $deadline = microtime(true) + 6;
    try {
        $meta = sf_metadata($route, $api, static function ($url) use ($deadline) { return sf_fetch($url, $deadline); });
    } catch (Throwable $error) {
        error_log('Storefront metadata: ' . $error->getMessage());
        $meta = null;
    }
    if ($meta === null) {
        // Preserve the working React app when the public API is temporarily unavailable.
        header('X-Storefront-Metadata: fallback');
        echo $html;
        return;
    }
    if (!empty($meta['unavailable'])) http_response_code(404);
    header('X-Storefront-Metadata: ready');
    echo sf_render($html, $meta);
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) sf_serve();
