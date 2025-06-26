#!/usr/bin/python3
"""
Glockenspiel: Fetch
Neil Fraser
https://github.com/NeilFraser/glockenspiel

Fetch previously stored music from disk.
The glockenspiel requests this file periodically to play the music.
"""

import time


# Define the name of the file to be read
music_file = 'music.json'
time_file = 'music.time'

# Print the mandatory HTTP header for plain text content.
print("Content-type: text/plain\n")

try:
  # Open the file in read mode
  with open(music_file, 'r') as f:
    # Read and send the file content.
    json = f.read().strip()
    print(json)
    if json:
      # Empty the file after reading.
      open(music_file, 'w').close()
except PermissionError:
  print(f"Error: Permission denied for '{music_file}'.")
except FileNotFoundError:
  print(f"Error: The file '{music_file}' was not found.")
except Exception as e:
  print(f"An unexpected error occurred: {e}")

# Update the time file to indicate the glockenspiel is active.
try:
  with open(time_file, 'w') as f:
    # Write the current timestamp to the time file.
    f.write(str(int(time.time())))
except PermissionError:
  print(f"Error: Permission denied when trying to write '{time_file}'.")
except Exception as e:
  print(f"An unexpected error occurred: {e}")
