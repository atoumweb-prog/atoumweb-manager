# Fabrique un document Word (docx + pdf) a partir d'un modele JSON, avec le Word installe sur le poste.
#   powershell -File build-word.ps1 -Model modele.json -Out document.docx -Pdf document.pdf
# Blocs reconnus : cover, toc, h1, h2, h3, p, lead, small, bullets, cards, table, pagebreak, landscape, portrait.
# Ce fichier ne contient que de l'ASCII : tous les textes viennent du modele JSON (UTF-8).
param([Parameter(Mandatory = $true)][string]$Model, [Parameter(Mandatory = $true)][string]$Out, [string]$Pdf = '', [string]$Log = '')
$ErrorActionPreference = 'Stop'
function Log([string]$msg) { if ($Log) { Add-Content -Path $Log -Value ((Get-Date -Format 'HH:mm:ss') + ' ' + $msg) } }
if ($Log) { Set-Content -Path $Log -Value 'debut' }
function RGBc([int]$r, [int]$g, [int]$b) { return [int]($r + 256 * $g + 65536 * $b) }
$NAVY = RGBc 23 48 76; $YELLOW = RGBc 255 218 0; $PALE = RGBc 238 242 246; $GREY = RGBc 93 101 111; $WHITE = RGBc 255 255 255; $ZEBRA = RGBc 247 249 251; $LINE = RGBc 208 215 222
$MM = 2.835
$m = Get-Content -Raw -Encoding UTF8 -Path $Model | ConvertFrom-Json
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
try {
  Log "app"; $doc = $word.Documents.Add(); Log "doc"
  $sel = $word.Selection
  $STY = @{ 'Normal' = -1; 'Heading 1' = -2; 'Heading 2' = -3; 'Heading 3' = -4; 'AW Lead' = -75; 'AW Small' = -35; 'AW Cell' = -67; 'AW CellSmall' = -81; 'AW Bullet' = -49 }
  function Sty($name) { if ($STY.ContainsKey($name)) { return $doc.Styles.Item([int]$STY[$name]) } else { return $doc.Styles.Item([string]$name) } }
  Log "styles0"; $ps = $doc.PageSetup
  Log "avant-papier"; $ps.PageWidth = 210 * $MM; $ps.PageHeight = 297 * $MM; Log "papier"
  $ps.TopMargin = 56.7; Log "m1"; $ps.BottomMargin = 56.7; Log "m2"; $ps.LeftMargin = 56.7; $ps.RightMargin = 56.7; Log "m3"
  $ps.HeaderDistance = 28.35; $ps.FooterDistance = 28.35; Log "dist"

  # ---------- styles
  function Set-Style($name, $size, $bold, $color, $before, $after) {
    Log ("st " + $name); $s = (Sty $name); Log "got"
    if (-not $name.StartsWith('AW ')) { $s.Font.Name = 'Calibri' }; Log 'a'; $s.Font.Size = [single]$size; Log 'b'; $s.Font.Bold = $bold; Log 'c'; $s.Font.Color = $color; Log 'd'
    $s.ParagraphFormat.SpaceBefore = $before; $s.ParagraphFormat.SpaceAfter = $after
    return $s
  }
  $null = Set-Style 'Normal' 10 0 (RGBc 33 37 41) 0 5
  (Sty 'Normal').ParagraphFormat.LineSpacingRule = 5
  (Sty 'Normal').ParagraphFormat.LineSpacing = 12.5
  $h1 = Set-Style 'Heading 1' 22 1 $NAVY 16 10; $h1.ParagraphFormat.KeepWithNext = -1
  $h2 = Set-Style 'Heading 2' 14 1 $NAVY 14 6; $h2.ParagraphFormat.KeepWithNext = -1
  $h3 = Set-Style 'Heading 3' 11 1 $NAVY 8 3; $h3.ParagraphFormat.KeepWithNext = -1
  foreach ($name in 'AW Lead', 'AW Small', 'AW Cell', 'AW CellSmall', 'AW Bullet') {
    Log ('skip ' + $name)
  }
  $s = Set-Style 'AW Lead' 11.5 0 $GREY 0 8; $s.Font.Spacing = 0; $s.Font.Italic = 0
  $s = Set-Style 'AW Small' 8.5 0 $GREY 2 4; $s.ParagraphFormat.KeepWithNext = -1
  $s = Set-Style 'AW Cell' 8.5 0 (RGBc 33 37 41) 0 0; $s.ParagraphFormat.LineSpacingRule = 0
  $s = Set-Style 'AW CellSmall' 7.5 0 $GREY 0 0; $s.ParagraphFormat.LineSpacingRule = 0
  $s = Set-Style 'AW Bullet' 10 0 (RGBc 33 37 41) 0 3; $s.ParagraphFormat.LeftIndent = 14; $s.ParagraphFormat.FirstLineIndent = -10

  Log "styles"
  function End-Doc { $null = $sel.EndKey(6) }
  function Text-Width { $p = $doc.Sections.Item($doc.Sections.Count).PageSetup; return ($p.PageWidth - $p.LeftMargin - $p.RightMargin) }
  function Add-Par([string]$text, [string]$style) {
    End-Doc; $sel.Style = (Sty $style); $sel.TypeText($text); $sel.TypeParagraph()
  }
  function After-Table { End-Doc; $sel.Style = (Sty 'Normal') }
  function No-Borders($t) { $t.Borders.Enable = 0 }

  function Add-Cover($b) {
    End-Doc; $sel.Style = (Sty 'Normal')
    $t = $doc.Tables.Add($sel.Range, 1, 1); No-Borders $t
    $t.Rows.Item(1).HeightRule = 1; $t.Rows.Item(1).Height = 175
    $c = $t.Cell(1, 1); $c.Shading.BackgroundPatternColor = $NAVY; $c.VerticalAlignment = 1
    $t.LeftPadding = 26; $t.TopPadding = 12
    $c.Range.Text = "AtoumWeb`r" + $b.tagline
    $p1 = $c.Range.Paragraphs.Item(1); $p1.Range.Font.Size = 46; $p1.Range.Font.Bold = 1; $p1.Range.Font.Color = $WHITE; $p1.SpaceAfter = 4
    $p2 = $c.Range.Paragraphs.Item(2); $p2.Range.Font.Size = 13; $p2.Range.Font.Bold = 0; $p2.Range.Font.Color = $YELLOW
    After-Table
    $sel.ParagraphFormat.Borders.Item(-3).LineStyle = 1; $sel.ParagraphFormat.Borders.Item(-3).LineWidth = 48; $sel.ParagraphFormat.Borders.Item(-3).Color = $YELLOW
    $sel.TypeParagraph(); $sel.ParagraphFormat.Borders.Enable = 0
    $sel.Style = (Sty 'Normal'); $sel.ParagraphFormat.SpaceBefore = 40
    $sel.Font.Size = 30; $sel.Font.Bold = 1; $sel.Font.Color = $NAVY; $sel.TypeText($b.title); $sel.TypeParagraph()
    $sel.Style = (Sty 'Normal'); $sel.Font.Size = 14; $sel.Font.Color = $GREY; $sel.TypeText($b.subtitle); $sel.TypeParagraph()
    $sel.Style = (Sty 'Normal'); $sel.ParagraphFormat.SpaceAfter = 30; $sel.Font.Size = 10; $sel.Font.Color = $GREY; $sel.TypeText($b.date); $sel.TypeParagraph()
    $stats = @($b.stats)
    $t = $doc.Tables.Add($sel.Range, 1, $stats.Count); No-Borders $t
    for ($i = 0; $i -lt $stats.Count; $i++) {
      $c = $t.Cell(1, $i + 1); $c.Range.Text = [string]$stats[$i].n + "`r" + $stats[$i].label
      $c.Range.Paragraphs.Item(1).Range.Font.Size = 30; $c.Range.Paragraphs.Item(1).Range.Font.Bold = 1; $c.Range.Paragraphs.Item(1).Range.Font.Color = $NAVY
      $c.Range.Paragraphs.Item(2).Range.Font.Size = 10; $c.Range.Paragraphs.Item(2).Range.Font.Color = $GREY
      $c.Borders.Item(-2).LineStyle = 1; $c.Borders.Item(-2).LineWidth = 24; $c.Borders.Item(-2).Color = $YELLOW; $c.LeftPadding = 8
    }
    After-Table
    $sel.ParagraphFormat.SpaceBefore = 36; $sel.Font.Size = 10; $sel.Font.Color = $GREY; $sel.TypeText($b.note); $sel.TypeParagraph()
    End-Doc; $sel.InsertBreak(7)
  }

  function Add-Cards($items) {
    foreach ($it in @($items)) {
      End-Doc; $sel.Style = (Sty 'Normal')
      $t = $doc.Tables.Add($sel.Range, 1, 1); No-Borders $t
      $t.AllowAutoFit = $false; $t.PreferredWidthType = 3; $t.PreferredWidth = (Text-Width)
      $c = $t.Cell(1, 1); $c.Shading.BackgroundPatternColor = $PALE; $c.LeftPadding = 10; $c.RightPadding = 10; $c.TopPadding = 5; $c.BottomPadding = 5
      $c.Range.Text = $it.title + "`r" + $it.text
      $c.Range.Font.Size = 9.5; $c.Range.ParagraphFormat.SpaceAfter = 0
      $c.Range.Paragraphs.Item(1).Range.Font.Bold = 1; $c.Range.Paragraphs.Item(1).Range.Font.Color = $NAVY; $c.Range.Paragraphs.Item(1).Range.Font.Size = 10.5; $c.Range.Paragraphs.Item(1).SpaceAfter = 2
      $c.Borders.Item(-2).LineStyle = 1; $c.Borders.Item(-2).LineWidth = 36; $c.Borders.Item(-2).Color = $YELLOW
      $t.Rows.Item(1).AllowBreakAcrossPages = 0
      After-Table
      $sel.ParagraphFormat.SpaceAfter = 0; $sel.Font.Size = 4; $sel.TypeParagraph(); $sel.Font.Size = 10
    }
  }

  function Add-Table($b) {
    $cols = @($b.cols); $rows = @($b.rows)
    End-Doc; $sel.Style = (Sty 'Normal')
    $t = $doc.Tables.Add($sel.Range, $rows.Count + 1, $cols.Count)
    $t.AllowAutoFit = $false; $t.Borders.Enable = 1
    $t.Borders.InsideLineStyle = 1; $t.Borders.OutsideLineStyle = 1
    $t.Borders.InsideColor = $LINE; $t.Borders.OutsideColor = $LINE
    $t.TopPadding = 3; $t.BottomPadding = 3; $t.LeftPadding = 4; $t.RightPadding = 4
    $total = 0; foreach ($c in $cols) { $total += [double]$c.w }
    $avail = Text-Width
    for ($i = 0; $i -lt $cols.Count; $i++) { $t.Columns.Item($i + 1).Width = $avail * ([double]$cols[$i].w / $total) }
    $t.Range.Style = (Sty 'AW Cell')
    for ($i = 0; $i -lt $cols.Count; $i++) {
      $c = $t.Cell(1, $i + 1); $c.Range.Text = [string]$cols[$i].h
      $c.Shading.BackgroundPatternColor = $NAVY; $c.Range.Font.Color = $WHITE; $c.Range.Font.Bold = 1; $c.Range.Font.Size = 8.5
      if ($cols[$i].align -eq 'right') { $c.Range.ParagraphFormat.Alignment = 2 }
    }
    $t.Rows.Item(1).HeadingFormat = -1
    for ($r = 0; $r -lt $rows.Count; $r++) {
      $row = @($rows[$r])
      for ($i = 0; $i -lt $cols.Count; $i++) {
        $cell = $t.Cell($r + 2, $i + 1)
        $text = [string]$row[$i]
        $cell.Range.Text = $text
        if ($cols[$i].align -eq 'right') { $cell.Range.ParagraphFormat.Alignment = 2 }
        if ($i -eq 0) {
          $cell.Range.Paragraphs.Item(1).Range.Font.Bold = 1
          if ($cell.Range.Paragraphs.Count -gt 1) { $cell.Range.Paragraphs.Item(2).Style = (Sty 'AW CellSmall') }
        }
        if ($cols[$i].bold -eq $true) { $cell.Range.Font.Bold = 1 }
        if ($r % 2 -eq 1) { $cell.Shading.BackgroundPatternColor = $ZEBRA }
      }
      $t.Rows.Item($r + 2).AllowBreakAcrossPages = 0
    }
    After-Table
    $sel.TypeParagraph()
  }

  # Fiche : en-tete (nom a gauche, prix et temps a droite) puis lignes [libelle, texte]. Les retours a la ligne du texte font des paragraphes.
  function Add-Sheet($b) {
    $rows = @($b.rows)
    End-Doc; $sel.Style = (Sty 'Normal')
    $t = $doc.Tables.Add($sel.Range, $rows.Count + 1, 2)
    $t.AllowAutoFit = $false; $t.Borders.Enable = 1
    $t.Borders.InsideLineStyle = 1; $t.Borders.OutsideLineStyle = 1
    $t.Borders.InsideColor = $LINE; $t.Borders.OutsideColor = $LINE
    $t.TopPadding = 3; $t.BottomPadding = 3; $t.LeftPadding = 5; $t.RightPadding = 5
    $avail = Text-Width
    $t.Columns.Item(1).Width = $avail * 0.2; $t.Columns.Item(2).Width = $avail * 0.8
    $t.Range.Style = (Sty 'AW Cell')
    $c = $t.Cell(1, 1); $c.Range.Text = [string]$b.name
    $c.Shading.BackgroundPatternColor = $NAVY; $c.Range.Font.Color = $WHITE; $c.Range.Font.Bold = 1; $c.Range.Font.Size = 10.5
    $c = $t.Cell(1, 2); $c.Range.Text = [string]$b.right
    $c.Shading.BackgroundPatternColor = $NAVY; $c.Range.Font.Color = $YELLOW; $c.Range.Font.Bold = 1; $c.Range.Font.Size = 9; $c.Range.ParagraphFormat.Alignment = 2
    $t.Cell(1, 1).Width = $avail * 0.56; $t.Cell(1, 2).Width = $avail * 0.44
    for ($r = 0; $r -lt $rows.Count; $r++) {
      $row = @($rows[$r])
      $lab = $t.Cell($r + 2, 1); $lab.Range.Text = [string]$row[0]
      $lab.Range.Font.Bold = 1; $lab.Range.Font.Color = $NAVY; $lab.Shading.BackgroundPatternColor = $PALE
      $cell = $t.Cell($r + 2, 2); $cell.Range.Text = [string]$row[1]
      if ($b.big -eq $true) { $cell.Range.Font.Size = 9.5; $lab.Range.Font.Size = 9 }
      if ($row.Count -gt 2 -and $row[2] -eq 'note') { $cell.Range.Font.Italic = 1; $cell.Range.Font.Color = $GREY }
    }
    $t.Rows.AllowBreakAcrossPages = 0
    if ($b.keep -eq $true) {
      $t.Range.ParagraphFormat.KeepWithNext = -1
      $t.Rows.Item($rows.Count + 1).Range.ParagraphFormat.KeepWithNext = 0
    }
    After-Table
    $sel.ParagraphFormat.SpaceAfter = 0; $sel.Font.Size = 5; $sel.TypeParagraph(); $sel.Font.Size = 10
  }

  function Set-HeaderFooter($sec, [bool]$first) {
    $w = $sec.PageSetup.PageWidth - $sec.PageSetup.LeftMargin - $sec.PageSetup.RightMargin
    $sec.PageSetup.DifferentFirstPageHeaderFooter = [int]$first * -1
    $h = $sec.Headers.Item(1); $f = $sec.Footers.Item(1)
    if ($sec.Index -gt 1) { $h.LinkToPrevious = $false; $f.LinkToPrevious = $false }
    $h.Range.Text = $m.header + "`tINTERNE"
    $h.Range.Font.Size = 8; $h.Range.Font.Color = $NAVY
    $h.Range.ParagraphFormat.TabStops.ClearAll(); $null = $h.Range.ParagraphFormat.TabStops.Add($w, 2)
    $h.Range.ParagraphFormat.Borders.Item(-3).LineStyle = 1; $h.Range.ParagraphFormat.Borders.Item(-3).Color = $YELLOW; $h.Range.ParagraphFormat.Borders.Item(-3).LineWidth = 12
    $f.Range.Text = $m.footer + "`tPage "
    $f.Range.Font.Size = 8; $f.Range.Font.Color = $GREY
    $f.Range.ParagraphFormat.TabStops.ClearAll(); $null = $f.Range.ParagraphFormat.TabStops.Add($w, 2)
    $r = $f.Range; $r.Collapse(0); $null = $f.Range.Fields.Add($r, 33)
  }

  # ---------- contenu
  $first = $true
  foreach ($b in @($m.blocks)) {
    Log ('bloc ' + $b.t + ' ' + $b.text)
    switch ($b.t) {
      'cover' { Add-Cover $b }
      'toc' {
        End-Doc; $sel.Style = (Sty 'Normal'); $sel.Font.Size = [single]22; $sel.Font.Bold = 1; $sel.Font.Color = $NAVY; $sel.TypeText($b.title); $sel.TypeParagraph(); $sel.Font.Reset()
        $sel.Style = (Sty 'Normal'); $null = $doc.TablesOfContents.Add($sel.Range, $true, 1, 2); End-Doc; $sel.InsertBreak(7)
      }
      'h1' { Add-Par $b.text 'Heading 1' }
      'h2' { Add-Par $b.text 'Heading 2' }
      'h3' { Add-Par $b.text 'Heading 3' }
      'p' { Add-Par $b.text 'Normal' }
      'lead' { Add-Par $b.text 'AW Lead' }
      'small' { Add-Par $b.text 'AW Small' }
      'bullets' { foreach ($x in @($b.items)) { Add-Par ([string]$x) 'AW Bullet' } }
      'cards' { Add-Cards $b.items }
      'table' { Add-Table $b }
      'sheet' { Add-Sheet $b }
      'pagebreak' { End-Doc; $sel.InsertBreak(7) }
      'landscape' { End-Doc; $sel.InsertBreak(2); $sec = $doc.Sections.Item($doc.Sections.Count); $sec.PageSetup.Orientation = 1; foreach ($n in 'TopMargin', 'BottomMargin', 'LeftMargin', 'RightMargin') { $sec.PageSetup.$n = 18 * $MM } }
      'portrait' { End-Doc; $sel.InsertBreak(2); $sec = $doc.Sections.Item($doc.Sections.Count); $sec.PageSetup.Orientation = 0; foreach ($n in 'TopMargin', 'BottomMargin', 'LeftMargin', 'RightMargin') { $sec.PageSetup.$n = 20 * $MM } }
    }
  }
  Log 'en-tetes'
  foreach ($sec in $doc.Sections) { Set-HeaderFooter $sec ($sec.Index -eq 1) }
  Log 'sommaire'
  if ($doc.TablesOfContents.Count -gt 0) { $doc.TablesOfContents.Item(1).Update() }
  $null = $doc.Repaginate(); $null = $doc.Fields.Update(); $doc.TablesOfContents.Item(1).UpdatePageNumbers()
  Log 'pagination'
  $pages = $doc.ComputeStatistics(2)
  Log 'enregistrement'
  $doc.SaveAs2($Out, 16)
  if ($Pdf) { $doc.ExportAsFixedFormat($Pdf, 17) }
  Write-Output ("OK pages=" + $pages)
  $doc.Close(0)
} finally {
  $word.Quit()
}
