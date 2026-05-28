#!/usr/bin/env zsh
set -euo pipefail

browser="chrome"
out="data/raw/yuque-current-tab.json"
sheet=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --browser)
      browser="$2"
      shift 2
      ;;
    --browser=*)
      browser="${1#--browser=}"
      shift
      ;;
    --out)
      out="$2"
      shift 2
      ;;
    --out=*)
      out="${1#--out=}"
      shift
      ;;
    --sheet)
      sheet="$2"
      shift 2
      ;;
    --sheet=*)
      sheet="${1#--sheet=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

case "$browser" in
  chrome) app="Google Chrome" ;;
  brave) app="Brave Browser" ;;
  *) echo "Unsupported browser: $browser" >&2; exit 2 ;;
esac

if [[ -n "$sheet" ]]; then
  echo "Sheet hint recorded only; switch the active Yuque tab to \"$sheet\" before running." >&2
fi

jsfile="/private/tmp/bdfz-calendar-yuque-extract.js"
errfile="/private/tmp/bdfz-calendar-yuque-extract.err"

cat > "$jsfile" <<'JS'
(function(){return JSON.stringify({extractedAt:new Date().toISOString(),title:document.title,url:location.href,sheetTabs:[],text:document.body.innerText,cells:[]});})()
JS

if ! result=$(/usr/bin/osascript \
  -e "set jsSource to read (POSIX file \"$jsfile\")" \
  -e "tell application \"$app\" to execute active tab of front window javascript jsSource" 2>"$errfile"); then
  err="$(cat "$errfile")"
  if [[ "$err" == *"Executing JavaScript through AppleScript is turned off"* ]]; then
    echo "Enable JavaScript from Apple Events in $app: View -> Developer -> Allow JavaScript from Apple Events" >&2
  else
    echo "$err" >&2
  fi
  exit 1
fi

mkdir -p "${out:h}"
printf '%s\n' "$result" > "$out"
echo "Wrote $out"
