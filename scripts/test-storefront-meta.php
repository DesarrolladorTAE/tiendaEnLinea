<?php
require __DIR__ . '/../public/storefront-meta.php';

function check($actual, $expected, string $message): void
{
    if ($actual !== $expected) throw new RuntimeException($message . ': ' . var_export($actual, true));
}

$api = 'https://api.example.com/api';
$payload = [
    'ok' => true, 'store' => ['name' => 'Flores & regalos'],
    'sitio' => ['branding' => '{"logo":"/storage/logo.png"}', 'descripcion' => '<b>Flores</b> para todos'],
];
$calls = [];
$fetch = static function ($url) use ($api, $payload, &$calls) {
    $calls[] = $url;
    if (substr($url, -9) === '/branches') return ['branches' => [['slug' => 'centro'], ['slug' => 'norte']]];
    if (substr($url, -9) === '/products') return ['data' => [['id' => 12, 'name' => 'Ramo "Especial" </script>', 'image' => '["/storage/ramo.jpg"]']]];
    return $payload;
};
$route = sf_route('/tienda/flores?branch=norte&utm_source=test', 'www.mitiendaenlineamx.com.mx');
$meta = sf_metadata($route, $api, $fetch);
check($meta['url'], 'https://mitiendaenlineamx.com.mx/tienda/flores?branch=norte', 'Canonical and branch');
check($calls[1], $api . '/public/storefront/norte', 'Selected branch');
check($meta['image'], 'https://api.example.com/storage/logo.png', 'Store preview uses logo');
check($meta['description'], 'Flores para todos', 'Plain description');
check(count($calls), 2, 'Store does not fetch products');

$productRoute = sf_route('/tienda/flores/producto/12?branch=norte', 'mitiendaenlineamx.com.mx');
$product = sf_metadata($productRoute, $api, $fetch);
check($product['image'], 'https://api.example.com/storage/ramo.jpg', 'Product preview uses product image');
check($product['logo'], 'https://api.example.com/storage/logo.png', 'Product favicon uses store logo');
$html = '<html><head><title>Old</title><meta name="description" content="Old"><meta property="og:image" content="old.png"><link rel="icon" href="/favicon.ico"><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>';
$output = sf_render($html, $product);
check(substr_count($output, 'property="og:image"'), 1, 'One OG image');
check(substr_count($output, '<title'), 1, 'One title');
check(strpos($output, 'content="old.png"'), false, 'Remove old metadata');
check(strpos($output, '&lt;/script&gt;') !== false, true, 'Escape metadata');
check(strpos($output, '/assets/app.js') !== false, true, 'Keep React bundle');
preg_match('~<script id="storefront-brand" type="application/json">(.*?)</script>~s', $output, $match);
check(json_decode($match[1], true)['logo'], $product['logo'], 'Initial loading logo');
check(json_decode($match[1], true)['branch'], 'norte', 'Initial branding scoped to branch');

check(sf_route('/api/products', 'mitiendaenlineamx.com.mx'), null, 'No API interception');
check(sf_route('/blogs/article', 'mitiendaenlineamx.com.mx'), null, 'No blog interception');
check(sf_route('/tienda/flores', 'untrusted.example'), null, 'Reject unknown host');
check(sf_route('/tienda/../../api', 'mitiendaenlineamx.com.mx'), null, 'Reject path traversal');
check(sf_route('/tienda/flores?branch[]=norte', 'mitiendaenlineamx.com.mx')['branch'], '', 'Reject array branch');
check(sf_route('/producto/12', 'latehuanita.mx')['slug'], 'la-tehuanita', 'Custom domain product');
check(sf_route('/', 'latehuanita.mx')['url'], 'https://latehuanita.mx/', 'Custom domain root');
check(sf_asset('javascript:alert(1)', $api), '', 'Reject unsafe image protocol');
check(sf_metadata($route, $api, static function () { return null; }), null, 'API outage fallback');
check(sf_metadata($route, $api, static function ($url) { return ['ok' => true, 'expired' => true]; }), ['unavailable' => true], 'Expired store');
$missing = $productRoute;
$missing['product'] = '999';
check(sf_metadata($missing, $api, $fetch), ['unavailable' => true], 'Missing product');
$invalidBranch = $route;
$invalidBranch['branch'] = 'unknown';
check(sf_metadata($invalidBranch, $api, $fetch)['url'], 'https://mitiendaenlineamx.com.mx/tienda/flores', 'Invalid branch falls back');
check(strpos(sf_render($html, ['unavailable' => true]), 'noindex, nofollow') !== false, true, 'Unavailable not indexed');
echo "PASS: storefront/product metadata, branch and custom-domain routes, HTML escaping, initial logo, failures.\n";
