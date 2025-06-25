#!/usr/bin/python3
"""
Glockenspiel: Submit
Neil Fraser
https://github.com/NeilFraser/glockenspiel

Saves music from the user to the server.
"""

import cgi_utils
import os
import datetime

# Define the name of the file to be read
file_name = 'music.txt'

# Determine if the glockenspoel is online by checking the last access time of the music file.
last_access_timestamp = os.path.getatime(file_name)
current_timestamp = datetime.datetime.now().timestamp()
delta = current_timestamp - last_access_timestamp
if delta < 60:
  out = "Your tune has been sent to the glockenspiel and will play shortly."
else:
  out = "The glockenspiel appears to be offline at the moment."

