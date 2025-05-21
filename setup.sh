#!/bin/bash
# Setup script for the JavaScript version of the Ant Simulation
set -e

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but not installed. Please install Node.js and rerun." >&2
  exit 1
fi

JS_DIR="js"

if [ ! -d "$JS_DIR" ]; then
  mkdir "$JS_DIR"
  cat > "$JS_DIR/index.html" <<'EOT'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ant Simulation JS</title>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
EOT

  cat > "$JS_DIR/main.js" <<'EOT'
// Entry point for the JavaScript ant simulation
console.log('Ant simulation placeholder');
EOT

  cat > "$JS_DIR/README.md" <<'EOT'
# JavaScript Ant Simulation

This directory will contain the JavaScript port of the ant simulation. The included files are placeholders.
EOT
fi

echo "Setup complete. Files created in $JS_DIR/"
