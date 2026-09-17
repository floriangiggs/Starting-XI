<#
  PostToolUse-Hook fuer startelf_check.html.
  Prueft PITCH_LAYOUTS / LINEUP_CHALLENGES auf strukturelle Konsistenz.

  Da auf diesem System weder Node.js noch Python verfuegbar sind, wird hier
  ohne echten JS-Parser gearbeitet: ein Zeichen-Scanner ueberspringt Strings
  und Kommentare und findet so zusammengehoerige Klammern. Das deckt die in
  CLAUDE.md geforderten Pruefungen ab, ersetzt aber keinen vollstaendigen
  JS-Parser (z. B. ein fehlendes Komma zwischen zwei Objekten wird nicht
  in jedem Fall erkannt, weil die Klammerbalance dabei erhalten bleibt).

  Die Klammer-Balance-Pruefung laeuft bewusst NUR innerhalb von PITCH_LAYOUTS
  und LINEUP_CHALLENGES (genau der Bereich, den CLAUDE.md zum Bearbeiten
  vorsieht) statt ueber die ganze <script>-Datei: Der restliche App-Code
  enthaelt Regex-Literale (z. B. /['`]/g), die sich ohne echten Tokenizer
  nicht zuverlaessig von Division unterscheiden lassen und die Klammer-
  Zaehlung sonst verfaelschen wuerden.
#>

param(
  [string]$FilePath
)

function Read-StdinJson {
  if (-not [Console]::IsInputRedirected) { return $null }
  $raw = [Console]::In.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
  try { return $raw | ConvertFrom-Json } catch { return $null }
}

function Skip-SimpleString {
  # $Text[$I] ist ' oder ". Gibt den Index nach dem schliessenden Quote zurueck.
  param([string]$Text, [int]$I)
  $quote = $Text[$I]
  $j = $I + 1
  while ($j -lt $Text.Length) {
    if ($Text[$j] -eq '\') { $j += 2; continue }
    if ($Text[$j] -eq $quote) { return $j + 1 }
    $j += 1
  }
  return $Text.Length
}

function Skip-Substitution {
  # $Text[$I] ist '{' (Start von ${...} in einem Template-Literal).
  # Gibt den Index NACH der passenden schliessenden '}' zurueck.
  param([string]$Text, [int]$I)
  $depth = 1
  $j = $I + 1
  while ($j -lt $Text.Length -and $depth -gt 0) {
    $c = $Text[$j]
    if ($c -eq '"' -or $c -eq "'") { $j = Skip-SimpleString $Text $j; continue }
    if ($c -eq '`') { $j = Skip-TemplateLiteral $Text $j; continue }
    if ($c -eq '/' -and ($j + 1) -lt $Text.Length -and $Text[$j + 1] -eq '/') {
      $nl = $Text.IndexOf("`n", $j)
      if ($nl -lt 0) { return $Text.Length }
      $j = $nl + 1; continue
    }
    if ($c -eq '/' -and ($j + 1) -lt $Text.Length -and $Text[$j + 1] -eq '*') {
      $end = $Text.IndexOf('*/', $j + 2)
      if ($end -lt 0) { return $Text.Length }
      $j = $end + 2; continue
    }
    if ($c -eq '{') { $depth++ }
    elseif ($c -eq '}') { $depth-- }
    $j += 1
  }
  return $j
}

function Skip-TemplateLiteral {
  # $Text[$I] ist '`'. Gibt den Index NACH dem schliessenden Backtick zurueck.
  # Versteht ${...}-Substitutionen inkl. darin verschachtelter Template-Literale.
  param([string]$Text, [int]$I)
  $j = $I + 1
  while ($j -lt $Text.Length) {
    $c = $Text[$j]
    if ($c -eq '\') { $j += 2; continue }
    if ($c -eq '`') { return $j + 1 }
    if ($c -eq '$' -and ($j + 1) -lt $Text.Length -and $Text[$j + 1] -eq '{') {
      $j = Skip-Substitution $Text ($j + 1)
      continue
    }
    $j += 1
  }
  return $Text.Length
}

function Skip-NonCode {
  # Ueberspringt Strings/Kommentare. Bewusst OHNE Regex-Literal-Erkennung:
  # Regex vs. Division laesst sich ohne echten Tokenizer nicht zuverlaessig
  # unterscheiden. Deshalb wird diese Funktion nur innerhalb der reinen
  # Datenbloecke (PITCH_LAYOUTS/LINEUP_CHALLENGES) fuer die Klammerbalance
  # verwendet, wo keine Regex-Literale vorkommen.
  param([string]$Text, [int]$I)
  $c = $Text[$I]
  if ($c -eq '"' -or $c -eq "'") { return Skip-SimpleString $Text $I }
  if ($c -eq '`') { return Skip-TemplateLiteral $Text $I }
  if ($c -eq '/' -and ($I + 1) -lt $Text.Length -and $Text[$I + 1] -eq '/') {
    $j = $Text.IndexOf("`n", $I)
    if ($j -lt 0) { return $Text.Length }
    return $j + 1
  }
  if ($c -eq '/' -and ($I + 1) -lt $Text.Length -and $Text[$I + 1] -eq '*') {
    $j = $Text.IndexOf('*/', $I + 2)
    if ($j -lt 0) { return $Text.Length }
    return $j + 2
  }
  return $I
}

function Get-NextLiteralChar {
  param([string]$Text, [int]$FromIndex, [char]$Char)
  $i = $FromIndex
  while ($i -lt $Text.Length) {
    $ni = Skip-NonCode $Text $i
    if ($ni -ne $i) { $i = $ni; continue }
    if ($Text[$i] -eq $Char) { return $i }
    $i++
  }
  return -1
}

function Get-MatchingBracket {
  param([string]$Text, [int]$OpenIndex, [char]$OpenChar, [char]$CloseChar)
  $depth = 1
  $i = $OpenIndex + 1
  while ($i -lt $Text.Length) {
    $ni = Skip-NonCode $Text $i
    if ($ni -ne $i) { $i = $ni; continue }
    $c = $Text[$i]
    if ($c -eq $OpenChar) { $depth++ }
    elseif ($c -eq $CloseChar) {
      $depth--
      if ($depth -eq 0) { return $i }
    }
    $i++
  }
  return -1
}

function Get-TopLevelObjectBlocks {
  # Findet alle {..}-Bloecke auf oberster Ebene innerhalb von $Text.
  param([string]$Text)
  $blocks = @()
  $i = 0
  while ($true) {
    $open = Get-NextLiteralChar $Text $i '{'
    if ($open -lt 0) { break }
    $close = Get-MatchingBracket $Text $open '{' '}'
    if ($close -lt 0) { break }
    $blocks += $Text.Substring($open, $close - $open + 1)
    $i = $close + 1
  }
  return $blocks
}

function Test-BracketBalance {
  param([string]$Text)
  $stack = New-Object System.Collections.Generic.Stack[string]
  $pairs = @{ '}' = '{'; ')' = '('; ']' = '[' }
  $opens = @('{', '(', '[')
  $i = 0
  while ($i -lt $Text.Length) {
    $ni = Skip-NonCode $Text $i
    if ($ni -ne $i) { $i = $ni; continue }
    $c = [string]$Text[$i]
    if ($opens -contains $c) {
      $stack.Push($c) | Out-Null
    } elseif ($pairs.ContainsKey($c)) {
      if ($stack.Count -eq 0) {
        return "Unerwartete schliessende Klammer '$c' (Position $i) ohne passende oeffnende Klammer."
      }
      $top = $stack.Pop()
      if ($top -ne $pairs[$c]) {
        return "Klammer-Fehlanpassung: '$top' wurde mit '$c' geschlossen (Position $i)."
      }
    }
    $i++
  }
  if ($stack.Count -gt 0) {
    return "Nicht geschlossene Klammer(n) am Dateiende: $($stack.ToArray() -join ', ')"
  }
  return $null
}

# --- Zieldatei bestimmen -----------------------------------------------

$targetName = 'startelf_check.html'
$hookInput = $null

if (-not $FilePath) {
  $hookInput = Read-StdinJson
  if ($hookInput -and $hookInput.tool_input -and $hookInput.tool_input.file_path) {
    $FilePath = [string]$hookInput.tool_input.file_path
  }
}

if (-not $FilePath) {
  $projectDir = $env:CLAUDE_PROJECT_DIR
  if (-not $projectDir) { $projectDir = (Get-Location).Path }
  $FilePath = Join-Path $projectDir $targetName
}

if ([System.IO.Path]::GetFileName($FilePath) -ne $targetName) {
  exit 0
}

if (-not (Test-Path -LiteralPath $FilePath)) {
  [Console]::Error.WriteLine("check-lineups: Datei nicht gefunden: $FilePath")
  exit 2
}

$content = Get-Content -Raw -LiteralPath $FilePath -Encoding UTF8

# --- <script>-Block mit den Daten finden --------------------------------

$scriptMatches = [regex]::Matches($content, '<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>', 'IgnoreCase')
$scriptText = $null
foreach ($m in $scriptMatches) {
  if ($m.Groups[1].Value -match 'PITCH_LAYOUTS') { $scriptText = $m.Groups[1].Value; break }
}

$errors = New-Object System.Collections.Generic.List[string]

if (-not $scriptText) {
  [Console]::Error.WriteLine("check-lineups: Kein <script>-Block mit PITCH_LAYOUTS gefunden in $FilePath")
  exit 2
}

# --- PITCH_LAYOUTS parsen -----------------------------------------------

$formations = @{}   # Name -> Liste der abbr
$idxPL = $scriptText.IndexOf('const PITCH_LAYOUTS')
if ($idxPL -lt 0) {
  $errors.Add("[Struktur] 'const PITCH_LAYOUTS' wurde nicht gefunden.")
} else {
  $openPL = $scriptText.IndexOf('{', $idxPL)
  $closePL = Get-MatchingBracket $scriptText $openPL '{' '}'
  if ($openPL -lt 0 -or $closePL -lt 0) {
    $errors.Add("[Struktur] PITCH_LAYOUTS-Objekt konnte nicht geparst werden (Klammern nicht gefunden).")
  } else {
    $plText = $scriptText.Substring($openPL + 1, $closePL - $openPL - 1)
    $plBalanceError = Test-BracketBalance $plText
    if ($plBalanceError) {
      $errors.Add("[Syntax] Klammern in PITCH_LAYOUTS sind nicht balanciert: $plBalanceError")
    }
    $formationHeader = [regex]::Matches($plText, '"([^"]+)"\s*:\s*\[')
    foreach ($fm in $formationHeader) {
      $formationName = $fm.Groups[1].Value
      $arrOpen = $fm.Index + $fm.Length - 1
      $arrClose = Get-MatchingBracket $plText $arrOpen '[' ']'
      if ($arrClose -lt 0) {
        $errors.Add("[PITCH_LAYOUTS] Formation '$formationName': schliessende ']' nicht gefunden.")
        continue
      }
      $arrText = $plText.Substring($arrOpen + 1, $arrClose - $arrOpen - 1)
      $posBlocks = Get-TopLevelObjectBlocks $arrText
      $abbrs = New-Object System.Collections.Generic.List[string]
      foreach ($pb in $posBlocks) {
        $am = [regex]::Match($pb, 'abbr\s*:\s*"([^"]*)"')
        if ($am.Success) { $abbrs.Add($am.Groups[1].Value) }
        else { $errors.Add("[PITCH_LAYOUTS] Formation '$formationName': Positions-Objekt ohne 'abbr' gefunden ($pb).") }
      }

      $dupes = $abbrs | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { $_.Name }
      if ($dupes) {
        $errors.Add("[PITCH_LAYOUTS] Formation '$formationName': doppelte Kuerzel gefunden: $($dupes -join ', ').")
      }

      if ($formations.ContainsKey($formationName)) {
        $errors.Add("[PITCH_LAYOUTS] Formation '$formationName' ist mehrfach definiert.")
      }
      $formations[$formationName] = $abbrs
    }
  }
}

# --- LINEUP_CHALLENGES parsen -------------------------------------------

$idxLC = $scriptText.IndexOf('const LINEUP_CHALLENGES')
$allIds = New-Object System.Collections.Generic.List[string]

if ($idxLC -lt 0) {
  $errors.Add("[Struktur] 'const LINEUP_CHALLENGES' wurde nicht gefunden.")
} else {
  $openLC = $scriptText.IndexOf('[', $idxLC)
  $closeLC = Get-MatchingBracket $scriptText $openLC '[' ']'
  if ($openLC -lt 0 -or $closeLC -lt 0) {
    $errors.Add("[Struktur] LINEUP_CHALLENGES-Array konnte nicht geparst werden (Klammern nicht gefunden).")
  } else {
    $lcText = $scriptText.Substring($openLC + 1, $closeLC - $openLC - 1)
    $lcBalanceError = Test-BracketBalance $lcText
    if ($lcBalanceError) {
      $errors.Add("[Syntax] Klammern in LINEUP_CHALLENGES sind nicht balanciert: $lcBalanceError")
    }
    $entryBlocks = Get-TopLevelObjectBlocks $lcText

    foreach ($entry in $entryBlocks) {
      $idMatch = [regex]::Match($entry, '\bid\s*:\s*"([^"]*)"')
      $entryId = if ($idMatch.Success) { $idMatch.Groups[1].Value } else { '(ohne id)' }

      if (-not $idMatch.Success) {
        $errors.Add("[LINEUP_CHALLENGES] Eintrag ohne 'id'-Feld gefunden.")
      } else {
        $allIds.Add($entryId)
      }

      $formationMatch = [regex]::Match($entry, '\bformation\s*:\s*"([^"]*)"')
      $difficultyMatch = [regex]::Match($entry, '\bdifficulty\s*:\s*(-?[0-9]+(?:\.[0-9]+)?)')

      if (-not $formationMatch.Success) {
        $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': kein 'formation'-Feld gefunden.")
      }
      if (-not $difficultyMatch.Success) {
        $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': kein 'difficulty'-Feld gefunden.")
      } else {
        $diffVal = [double]$difficultyMatch.Groups[1].Value
        if ($diffVal -lt 1 -or $diffVal -gt 5) {
          $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': difficulty=$diffVal liegt nicht im Bereich 1-5.")
        }
      }

      $playersKeyMatch = [regex]::Match($entry, '\bplayers\s*:\s*\{')
      if (-not $playersKeyMatch.Success) {
        $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': kein 'players'-Objekt gefunden.")
      } else {
        $pOpen = $playersKeyMatch.Index + $playersKeyMatch.Length - 1
        $pClose = Get-MatchingBracket $entry $pOpen '{' '}'
        if ($pClose -lt 0) {
          $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': 'players'-Objekt hat keine schliessende Klammer.")
        } else {
          $playersText = $entry.Substring($pOpen + 1, $pClose - $pOpen - 1)
          $keyMatches = [regex]::Matches($playersText, '([A-Za-z0-9_]+)\s*:\s*"')
          $playerKeys = New-Object System.Collections.Generic.List[string]
          foreach ($km in $keyMatches) { $playerKeys.Add($km.Groups[1].Value) }

          $dupeKeys = $playerKeys | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { $_.Name }
          if ($dupeKeys) {
            $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': doppelte Positions-Kuerzel in 'players': $($dupeKeys -join ', ').")
          }

          if ($formationMatch.Success) {
            $fName = $formationMatch.Groups[1].Value
            if (-not $formations.ContainsKey($fName)) {
              $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': formation '$fName' existiert nicht in PITCH_LAYOUTS.")
            } else {
              $expected = $formations[$fName]
              $expectedSet = [System.Collections.Generic.HashSet[string]]::new([string[]]$expected)
              $actualSet = [System.Collections.Generic.HashSet[string]]::new([string[]]$playerKeys)

              $missing = $expected | Where-Object { -not $actualSet.Contains($_) } | Select-Object -Unique
              $extra = $playerKeys | Where-Object { -not $expectedSet.Contains($_) } | Select-Object -Unique

              if ($missing -or $extra) {
                $parts = @()
                if ($missing) { $parts += "fehlend: $($missing -join ', ')" }
                if ($extra) { $parts += "ueberzaehlig: $($extra -join ', ')" }
                $errors.Add("[LINEUP_CHALLENGES] Eintrag '$entryId': Positions-Kuerzel in 'players' passen nicht zu Formation '$fName' (" + ($parts -join '; ') + ").")
              }
            }
          }
        }
      }
    }
  }
}

# --- Doppelte IDs pruefen -------------------------------------------------

$dupeIds = $allIds | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { $_.Name }
foreach ($d in $dupeIds) {
  $errors.Add("[LINEUP_CHALLENGES] Doppelte id '$d' kommt $((($allIds | Where-Object { $_ -eq $d }).Count))x vor.")
}

# --- Ergebnis ausgeben ----------------------------------------------------

if ($errors.Count -eq 0) {
  Write-Output "check-lineups: OK - $($formations.Count) Formationen, $($allIds.Count) Aufstellungen, keine Inkonsistenzen gefunden."
  exit 0
} else {
  [Console]::Error.WriteLine("check-lineups: $($errors.Count) Problem(e) in $FilePath gefunden:")
  foreach ($e in $errors) { [Console]::Error.WriteLine(" - $e") }
  exit 2
}
