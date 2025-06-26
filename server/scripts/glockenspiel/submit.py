#!/usr/bin/python3
"""
Glockenspiel: Submit
Neil Fraser
https://github.com/NeilFraser/glockenspiel

Saves music from the user to the server.
"""

import cgi_utils
import datetime

# Define the name of the file to be read
music_file = 'music.json'
time_file = 'music.time'

out = ""
# Determine if the glockenspiel is online.
# Read the timestamp in the time file.
try:
  with open(time_file, 'r') as f:
    last_fetch_timestamp = float(f.read().strip())
except FileNotFoundError:
  last_fetch_timestamp = 0.0
  out += "No time file found: %s.\n" % time_file
except ValueError:
  last_fetch_timestamp = 0.0
  out += "Invalid time file content.\n"
current_timestamp = datetime.datetime.now().timestamp()
delta = current_timestamp - last_fetch_timestamp
if delta < 60:
  out += "Your tune has been sent to the glockenspiel and will play shortly.\n"
else:
  out += "The glockenspiel appears to be offline at the moment.\n"

forms = cgi_utils.parse_post()
cgi_utils.force_exist(forms, "data")
data = forms["data"]
# Write the data to the music file.
try:
  with open(music_file, 'w') as f:
    f.write(data.strip())
except PermissionError:
  out += "Permission denied for: %s.\n" % music_file
except Exception as e:
  out += "An unexpected error occurred: %s\n" % e

print("Content-Type: text/plain")
print("Status: 200 OK\n")
print(out)
