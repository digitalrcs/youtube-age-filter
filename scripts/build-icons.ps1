$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$source = [System.Drawing.Image]::FromFile((Join-Path $root 'images/DigitalRCS.png'))
$output = Join-Path $root 'icons'
New-Item -ItemType Directory -Path $output -Force | Out-Null
try {
    foreach ($size in @(16, 32, 48, 128, 640)) {
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
