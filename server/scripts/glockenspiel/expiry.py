#!/usr/bin/python3
"""
Glockenspiel: Expiry
Neil Fraser
https://github.com/NeilFraser/glockenspiel

Delete any stored music not accessed in a year.
"""

import os
import time
from datetime import datetime

# Absolute path to the data directory.
# Must end with a slash.
DATA_PATH = "/home/neil/html/hardware/glockenspiel/data/"

# Maximum age (in days).
TIMEOUT_DAYS = 365

# Any file last accessed before this time should be deleted.
threshold = time.time() - (TIMEOUT_DAYS * 24 * 60 * 60)

# Print the mandatory HTTP header for plain text content.
print("Content-type: text/plain\n")

print("Scanning %s for files not accesed in %d days." % (DATA_PATH, TIMEOUT_DAYS))
# Iterate over each item in the directory
file_count = 0
delete_count = 0
for filename in os.listdir(DATA_PATH):
  # Check if the file has the target extension
  if filename.endswith(".glockenspiel"):
    file_count += 1
    file_path = os.path.join(DATA_PATH, filename)

    # Ensure that we are dealing with a file, not a subdirectory
    if os.path.isfile(file_path):
      try:
        # Get the last access time of the file (in seconds)
        last_access_seconds = os.path.getatime(file_path)

        # Check if the time elapsed since last access is over the threshold
        if last_access_seconds < threshold:
          last_access_date = datetime.fromtimestamp(last_access_seconds).strftime('%Y-%m-%d %H:%M:%S')
          print(f"Deleting old file: {file_path} (Last accessed: {last_access_date})")
          os.remove(file_path)
          delete_count += 1
      except Exception as e:
        print(f"An error occurred while processing '{file_path}': {e}")

print("\nScan complete.  Scanned %d files, deleted %d files." % (file_count, delete_count))
