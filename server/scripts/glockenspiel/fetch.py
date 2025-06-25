#!/usr/bin/python3
"""
Glockenspiel: Fetch
Neil Fraser
https://github.com/NeilFraser/glockenspiel

Fetch previously stored music from disk.
The glockenspiel requests this file periodically to play the music.
"""


# Define the name of the file to be read
music_file = 'music.txt'

# Print the mandatory HTTP header for plain text content.
print("Content-type: text/plain\n")

try:
  # Open the file in read mode
  with open(music_file, 'r') as f:
    # Read and send the file content.
    print(f.read())
  # Empty the file after reading.
  open(music_file, 'w').close()
except PermissionError:
  print(f"Error: Permission denied when trying to read '{music_file}'.")
except FileNotFoundError:
  print(f"Error: The file '{music_file}' was not found.")
except Exception as e:
  print(f"An unexpected error occurred: {e}")

# touch the time file to update its last access time.
try:
  with open(time_file, 'w') as f:

    f.write("Last access time updated.")
