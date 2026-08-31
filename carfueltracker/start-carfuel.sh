#!/bin/sh
DIR=/mnt/carfueltracker
PORT=8001

cd "$DIR" || {
  echo "AstinaFuel folder not available: $DIR"
  echo "Mount or copy the PWA files into $DIR first."
  exit 1
}

echo ""
echo "  ASTINAFUEL — Mazda 3 Astina Black"
echo "  ---------------------------------"
echo "  Directory : $DIR"
echo "  Address   : http://127.0.0.1:$PORT"
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

exec python3 -m http.server "$PORT" --bind 127.0.0.1
