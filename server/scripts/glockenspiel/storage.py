#!/usr/bin/python3
"""
Glockenspiel: Storage
Neil Fraser
https://github.com/NeilFraser/glockenspiel

Store programs (XML and JS) to disk.
"""

import hashlib
import os
import random
import re
import cgi_utils


POISON = "{[(< UNTRUSTED CONTENT >)]}\n"

def keyGen(seed_string):
  random.seed(seed_string)
  # Generate a random string of length KEY_LEN.
  KEY_LEN = 6
  CHARS = "abcdefghijkmnopqrstuvwxyz23456789"  # Exclude l, 0, 1.
  max_index = len(CHARS) - 1
  return "".join([CHARS[random.randint(0, max_index)] for x in range(KEY_LEN)])


def check(data):
  method = ""
  if "REQUEST_METHOD" in os.environ:
    method = os.environ["REQUEST_METHOD"]

  if method != "POST":
    # GET could be a link.
    print("Status: 405 Method Not Allowed\n")
    print("Use POST, not '%s'." % method)
    return False
  if data == None:
    # No data param.
    print("Status: 406 Not Acceptable\n")
    print("No data.")
    return False
  if not os.path.exists(cgi_utils.DATA_PATH):
    # Don't try saving to a new directory.
    print("Status: 406 Not Acceptable\n")
    print("Glockenspiel data directory doesn't exist.")
    return False
  if len(data) >= 1000000:
    # One megabyte is too much.
    print("Status: 413 Payload Too Large\n")
    print("Your program is too large.")
    return False
  return True


def store(data):
  # Add a poison line to prevent raw content from being served.
  data = POISON + data

  # Hash the content and generate a key.
  binary_data = data.encode("UTF-8")
  hash = hashlib.sha256(binary_data).hexdigest()
  key = keyGen(hash)

  # Save the data to a file.
  file_name = cgi_utils.DATA_PATH + key + ".glockenspiel"
  with open(file_name, "w") as f:
    f.write(data)
  return key


if __name__ == "__main__":
  forms = cgi_utils.parse_post()
  cgi_utils.force_exist(forms, "data")
  data = forms["data"]

  print("Content-Type: text/plain")
  if check(data):
    key = store(data)
    print("Status: 200 OK\n")
    print(key)
