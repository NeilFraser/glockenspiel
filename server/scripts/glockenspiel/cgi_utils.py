"""
Glockenspiel: CGI Utilities
Neil Fraser
https://github.com/NeilFraser/glockenspiel

Parse GET and POST data.
"""


from os import environ
from urllib.parse import unquote
from sys import stdin


# Parse POST data (e.g. a=1&b=2) into a dictionary (e.g. {"a": 1, "b": 2}).
# Very minimal parser.  Does not combine repeated names (a=1&a=2), ignores
# valueless names (a&b), does not support isindex or multipart/form-data.
def parse_post():
  return _parse(stdin.read())


# Parse a query string (e.g. a=1&b=2) into a dictionary (e.g. {"a": 1, "b": 2}).
# Very minimal parser.  Does not combine repeated names (a=1&a=2), ignores
# valueless names (a&b), does not support isindex.
def parse_query():
  return _parse(environ["QUERY_STRING"])


def _parse(data):
  parts = data.split("&")
  dict = {}
  for part in parts:
    tuple = part.split("=", 1)
    if len(tuple) == 2:
      dict[tuple[0]] = unquote(tuple[1])
  return dict


# Ensure that the provided arguments exist in the dict.
def force_exist(dict, *argv):
  for arg in argv:
    if arg not in dict:
      dict[arg] = None
