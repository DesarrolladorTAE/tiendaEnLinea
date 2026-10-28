<?php
// Sólo desarrollo: php -S 127.0.0.1:4173 -t dist scripts/preview-seo.php
$root = realpath($_SERVER['DOCUMENT_ROOT']);
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (!is_string($path)) { http_response_code(400); return; }
require_once $root . '/public-seo.php';
if (preg_match('~^/(?:paquetes(?:/|$)|catalogo-(?:paquetes|companias)\.json$|sitemap\.xml$|og/paquete-[0-9]+\.png$)~', $path)) {
    tlr_serve();
    return;
}
$previewConfig = json_decode((string) @file_get_contents($root . '/seo-runtime-config.json'), true) ?: [];
if ($path === '/') { header('Content-Type: text/html; charset=UTF-8'); readfile($root . '/index.html'); return; }
$redirects = $previewConfig['redirects'] ?? [];
if (isset($redirects[rtrim($path, '/')])) { header('Location: ' . $redirects[rtrim($path, '/')], true, 301); return; }
if ($path === '/landing') { header('Location: /', true, 301); return; }
$publicPath = rtrim($path, '/');
if ($publicPath !== '' && in_array($publicPath, $previewConfig['publicPages'] ?? [], true)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($root . $publicPath . '/index.html');
    return;
}
$file = realpath($root . $path);
if ($file !== false && strpos($file, $root . DIRECTORY_SEPARATOR) === 0 && (is_file($file) || is_dir($file))) return false;
if (preg_match('~^/(?:api|assets|og|fonts)(?:/|$)~', $path)) { http_response_code(404); return; }
header('Content-Type: text/html; charset=UTF-8');
readfile($root . '/spa.html');
