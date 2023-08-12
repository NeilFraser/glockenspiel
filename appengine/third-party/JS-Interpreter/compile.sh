# Script for generating the compiled acorn_interpreter_simple.js file.

# Download Closure Compiler if not already present.
if test -f "../../compiler.jar"; then
  echo "Found Closure Compiler."
else
  echo "Downloading Closure Compiler."
  wget -N https://unpkg.com/google-closure-compiler-java/compiler.jar
  if test -f "compiler.jar"; then
    echo "Downloaded Closure Compiler."
    mv compiler.jar ../../compiler.jar
  else
    echo "Unable to download Closure Compiler."
    exit 1
  fi
fi

echo "Compiling Acorn + JS-Interpreter..."
echo "Compiling using SIMPLE because Glockenspiel needs to mess with the stack."
java -jar ../../compiler.jar \
    --compilation_level SIMPLE \
    --language_in=ECMASCRIPT5 \
    --language_out=ECMASCRIPT5 \
    --warning_level VERBOSE \
    --js='acorn.js' \
    --js='interpreter.js' \
    --js_output_file acorn_interpreter_simple.js

echo "Done"
