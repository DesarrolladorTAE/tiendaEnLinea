<?php
require $argv[1] . '/public-seo.php';
function check($condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
$fixture = json_decode(file_get_contents($argv[2]), true);
$urls = [];
$fetch = static function ($url) use ($fixture, &$urls) {
    $urls[] = $url;
    if (substr($url, -9) === '/carriers') return $fixture['carriers'];
    parse_str(parse_url($url, PHP_URL_QUERY), $query);
    return $fixture['products'][$query['carrier']] ?? null;
};
$products = tlr_catalog($fetch);
usort($products, static function ($a,$b) {return (int)$a['id'] <=> (int)$b['id'];});
check(count($products) === 2, 'public filtering');
check($products[0]['logo'] === $fixture['carriers'][0]['Logotipo'], 'carrier logo preserved');
check(tlr_logo('javascript:alert(1)') === '', 'unsafe image URL rejected');
check(tlr_catalog(static function () { return []; }) === [], 'empty catalog is a valid response');
check($products[0]['path'] === '/paquetes/paquetes-de-prueba-conexion-movil-55/', 'canonical slug matches JavaScript');
check(strpos(json_encode($products), 'never-public') === false, 'private fields excluded');
check(!isset($products[0]['suscrip'], $products[0]['saldo']), 'no commissions or balance');
foreach ($urls as $url) check(strpos($url, 'https://telorecargo.com/api/') === 0, 'fixed public origin');
check(tlr_route('/paquetes/old-name-55/?api=https://evil.example')['id'] === '55', 'id route');
check(tlr_route('/paquetes/../../secret') === null, 'path traversal rejected');
check(tlr_route('/paquetes/<script>-55/') === null, 'invalid path rejected');
check(tlr_route('/og/paquete-55.png')['type'] === 'image', 'PNG route');
$calls = 0;
$load = static function () use (&$calls, $products) { $calls++; return $products; };
$directory = $argv[3];
tlr_cached_catalog($load, $directory, 1000);
tlr_cached_catalog($load, $directory, 1119);
check($calls === 1, 'cached within 120 seconds');
tlr_cached_catalog($load, $directory, 1121);
check($calls === 2, 'refresh after 120 seconds');
$failed = false;
try { tlr_cached_catalog(static function () { throw new RuntimeException('offline'); }, $directory, 1300); }
catch (RuntimeException $error) { $failed = true; }
check($failed, 'expired cache is not silently presented as current data');
$markup = tlr_detail_html($products[0], $products, ['origin'=>'https://example.com','verification'=>'verify-test'], 1000);
check(strpos($markup, 'property="og:title"') !== false, 'metadata in initial HTML');
check(strpos($markup, '<script>alert') === false, 'escaped public content');
check(strpos($markup, 'verify-test') !== false, 'verification preserved');
check(strpos($markup, 'never-public') === false, 'HTML has no credentials');
check(tlr_carrier_logo_bytes('https://127.0.0.1/private.png') === null, 'loopback logo rejected');
check(tlr_carrier_logo_bytes('https://169.254.169.254/private.png') === null, 'private metadata logo rejected');
check(tlr_carrier_logo_bytes('http://example.com/logo.png') === null, 'HTTPS required for logos');
if (function_exists('imagecreatetruecolor') && function_exists('imagettftext')) {
    foreach ([[320,80],[80,320],[120,120]] as $dimensions) {
        $logo = imagecreatetruecolor($dimensions[0],$dimensions[1]);
        $red = imagecolorallocate($logo,240,47,70);imagefill($logo,0,0,$red);
        ob_start();imagepng($logo);$bytes = ob_get_clean();imagedestroy($logo);
        $preview = imagecreatefromstring(tlr_png($products[0], $argv[1] . '/fonts/Lato-Regular.ttf', $bytes));
        check((imagecolorat($preview,993,57) & 0xffffff) === 0xf02f46, 'carrier logo rendered in OG preview');
        check((imagecolorat($preview,854,22) & 0xffffff) === 0xffffff, 'white margin around carrier logo');
        $minX=1200;$maxX=0;$minY=630;$maxY=0;
        for($y=18;$y<=96;$y++)for($x=850;$x<=1136;$x++)if((imagecolorat($preview,$x,$y) & 0xffffff) === 0xf02f46){$minX=min($minX,$x);$maxX=max($maxX,$x);$minY=min($minY,$y);$maxY=max($maxY,$y);}
        $scale=min(254/$dimensions[0],54/$dimensions[1]);
        check($maxX-$minX+1 === (int)round($dimensions[0]*$scale), 'logo width preserves aspect ratio');
        check($maxY-$minY+1 === (int)round($dimensions[1]*$scale), 'logo height preserves aspect ratio');
        imagedestroy($preview);
    }
}
echo "PASS PHP: rutas, datos públicos, HTML seguro, origen fijo y caché de 120 segundos.\n";
