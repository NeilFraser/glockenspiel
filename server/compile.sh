# Script for generating the compiled glockenspiel_compressed.js file.

# Download Closure Compiler if not already present.
if test -f "compiler.jar"; then
  echo "Found Closure Compiler."
else
  echo "Downloading Closure Compiler."
  wget -N https://unpkg.com/google-closure-compiler-java/compiler.jar
  if test -f "compiler.jar"; then
    echo "Downloaded Closure Compiler."
  else
    echo "Unable to download Closure Compiler."
    exit 1
  fi
fi

echo "Compiling Glockenspiel..."
java -jar ./compiler.jar \
    --compilation_level SIMPLE \
    --warning_level VERBOSE \
    --externs externs/interpreter-externs.js \
    --externs externs/soundJS-externs.js \
    --externs externs/slider-externs.js \
    --externs externs/externs.js \
    --js='html/hardware/glockenspiel/editor/field_pitch.js' \
    --js='html/hardware/glockenspiel/editor/blocks.js' \
    --js='html/hardware/glockenspiel/editor/dialogs.js' \
    --js='html/hardware/glockenspiel/editor/storage.js' \
    --js='html/hardware/glockenspiel/editor/script.js' \
    --js='html/hardware/glockenspiel/editor/midi.js' \
    --js_output_file html/hardware/glockenspiel/editor/glockenspiel_compressed.js

echo "Done"
