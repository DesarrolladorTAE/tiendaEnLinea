$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Escape-Xml([string]$value) { [System.Security.SecurityElement]::Escape($value) }
function Paragraph([string]$value, [string]$style = 'Normal') {
    $safe = Escape-Xml $value
    return "<w:p><w:pPr><w:pStyle w:val=`"$style`"/></w:pPr><w:r><w:t xml:space=`"preserve`">$safe</w:t></w:r></w:p>"
}
$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:lang w:val="es-MX"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="600" w:after="320"/></w:pPr><w:rPr><w:b/><w:color w:val="17365D"/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="17365D"/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:b/><w:color w:val="526477"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="List"><w:name w:val="List"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr></w:style>
</w:styles>
'@
$types = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>
'@
$rootRels = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
$docRels = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'
$footer = '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>Mi Tienda en Línea MX · Manual de usuario | Página </w:t></w:r><w:fldSimple w:instr="PAGE"/></w:p></w:ftr>'
foreach ($source in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.md' | Where-Object { $_.Name -match '^0[1-5]-' }) {
    $lines = [IO.File]::ReadAllLines($source.FullName, $utf8)
    $body = New-Object System.Text.StringBuilder
    $indexAdded = $false
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line.StartsWith('## ') -and -not $indexAdded) {
            [void]$body.Append((Paragraph 'Contenido' 'Heading1'))
            foreach ($heading in $lines | Where-Object { $_.StartsWith('## ') }) { [void]$body.Append((Paragraph $heading.Substring(3))) }
            [void]$body.Append('<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
            $indexAdded = $true
        }
        if ($line.StartsWith('# ')) { [void]$body.Append((Paragraph $line.Substring(2) 'Title')) }
        elseif ($line.StartsWith('### ')) { [void]$body.Append((Paragraph $line.Substring(4) 'Heading2')) }
        elseif ($line.StartsWith('## ')) { [void]$body.Append((Paragraph $line.Substring(3) 'Heading1')) }
        elseif ($line -match '^> CAPTURA ') {
            [void]$body.Append((Paragraph $line.Substring(2) 'Caption'))
            [void]$body.Append('<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders><w:top w:val="dashed" w:sz="8" w:color="AAB7C4"/><w:left w:val="dashed" w:sz="8" w:color="AAB7C4"/><w:bottom w:val="dashed" w:sz="8" w:color="AAB7C4"/><w:right w:val="dashed" w:sz="8" w:color="AAB7C4"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="2400" w:hRule="atLeast"/></w:trPr><w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:fill="F4F7FA"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="667788"/></w:rPr><w:t>Inserta aquí la captura de pantalla indicada.</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p/>')
        }
        elseif ($line.StartsWith('- ')) { [void]$body.Append((Paragraph ('• ' + $line.Substring(2)) 'List')) }
        elseif ($line -match '^\d+\. ') { [void]$body.Append((Paragraph $line 'List')) }
        else { [void]$body.Append((Paragraph $line)) }
    }
    $document = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + $body.ToString() + '<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1440" w:bottom="1080" w:left="1440" w:header="500" w:footer="500"/></w:sectPr></w:body></w:document>'
    $destination = [IO.Path]::ChangeExtension($source.FullName, '.docx')
    $stream = [IO.File]::Open($destination, [IO.FileMode]::Create)
    $zip = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        $parts = @{ '[Content_Types].xml' = $types; '_rels/.rels' = $rootRels; 'word/document.xml' = $document; 'word/styles.xml' = $styles; 'word/_rels/document.xml.rels' = $docRels; 'word/footer1.xml' = $footer }
        foreach ($part in $parts.GetEnumerator()) {
            [void]([xml]$part.Value)
            $entry = $zip.CreateEntry($part.Key)
            $writer = New-Object IO.StreamWriter($entry.Open(), $utf8)
            try { $writer.Write($part.Value) } finally { $writer.Dispose() }
        }
    } finally { $zip.Dispose(); $stream.Dispose() }
    $check = [IO.Compression.ZipFile]::OpenRead($destination)
    try {
        foreach ($entry in $check.Entries) {
            $reader = New-Object IO.StreamReader($entry.Open(), $utf8)
            try { [void]([xml]$reader.ReadToEnd()) } finally { $reader.Dispose() }
        }
        $reader = New-Object IO.StreamReader($check.GetEntry('word/document.xml').Open(), $utf8)
        try { [xml]$parsed = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $ns = New-Object Xml.XmlNamespaceManager($parsed.NameTable)
        $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        $expected = @($lines | Where-Object { $_ -match '^> CAPTURA ' }).Count
        $actual = $parsed.SelectNodes('//w:tbl', $ns).Count
        if ($expected -ne $actual) { throw "Faltan espacios de captura en $destination" }
        $allText = ($parsed.SelectNodes('//w:t', $ns) | ForEach-Object { $_.'#text' }) -join ''
        foreach ($line in $lines) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $plain = $line -replace '^#{1,3} ', '' -replace '^> ', '' -replace '^- ', '• '
            if (-not $allText.Contains($plain)) { throw "Texto ausente en $destination : $plain" }
        }
        Write-Output "$($source.BaseName): Word verificado, $actual espacios para capturas."
    } finally { $check.Dispose() }
}
