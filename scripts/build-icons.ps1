$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$source = [System.Drawing.Image]::FromFile((Join-Path $root 'images/DigitalRCS.png'))
$output = Join-Path $root 'icons'
New-Item -ItemType Directory -Path $output -Force | Out-Null
try {
    foreach ($size in @(640)) {
        $height = if ($size -eq 640) { [int][Math]::Round($size * $source.Height / $source.Width) } else { $size }
        $bitmap = [System.Drawing.Bitmap]::new($size, $height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $scale = [Math]::Min($size / $source.Width, $height / $source.Height)
            $width = [int][Math]::Round($source.Width * $scale)
            $drawHeight = [int][Math]::Round($source.Height * $scale)
            $graphics.DrawImage($source, [int](($size - $width) / 2), [int](($height - $drawHeight) / 2), $width, $drawHeight)
            $name = if ($size -eq 640) { 'digitalrcs-logo.png' } else { "icon-$size.png" }
            $bitmap.Save((Join-Path $output $name), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $graphics.Dispose(); $bitmap.Dispose() }
    }
} finally { $source.Dispose() }

# A simple monogram retains its silhouette at toolbar size.
foreach ($size in @(16, 32, 48, 128)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $shape = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#F5A653'))
    $outline = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#292522'), 6)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.ScaleTransform(($size / 128.0), ($size / 128.0))
        $shape.StartFigure()
        $shape.AddLine(16, 12, 58, 12)
        $shape.AddBezier(58, 12, 94, 12, 114, 30, 114, 64)
        $shape.AddBezier(114, 64, 114, 98, 94, 116, 58, 116)
        $shape.AddLine(58, 116, 16, 116)
        $shape.CloseFigure()
        $shape.StartFigure()
        $shape.AddLine(44, 38, 44, 90)
        $shape.AddLine(44, 90, 58, 90)
        $shape.AddBezier(58, 90, 77, 90, 86, 81, 86, 64)
        $shape.AddBezier(86, 64, 86, 47, 77, 38, 58, 38)
        $shape.CloseFigure()
        $graphics.FillPath($brush, $shape)
        $graphics.DrawPath($outline, $shape)
        $bitmap.Save((Join-Path $output "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $outline.Dispose(); $brush.Dispose(); $shape.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
}
