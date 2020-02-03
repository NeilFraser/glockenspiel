"""
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import cgi
from google.cloud import ndb


# Datastore model.
class Tune(ndb.Model):
  data = ndb.TextProperty()


# Route to requested handler.
def app(environ, start_response):
  if environ["PATH_INFO"] == "/":
    return redirect(environ, start_response)
  if environ["PATH_INFO"] == "/submit":
    return submit(environ, start_response)
  if environ["PATH_INFO"] == "/fetch":
    return fetch(environ, start_response)
  start_response("404 Not Found", [])
  return [b"Page not found."]


# Redirect for root directory.
def redirect(environ, start_response):
  headers = [
    ("Location", "/editor/index.html")
  ]
  start_response("302 Found", headers)
  return []


# Store the latest tune in Datastore using App Engine.
def submit(environ, start_response):
  forms = cgi.FieldStorage(fp=environ['wsgi.input'], environ=environ)
  data = forms["data"].value

  client = ndb.Client()
  with client.context():
    row = Tune(id="PLAY", data=data)
    row.put()

  out = "Your tune has been sent to the glockenspiel and will play shortly."

  headers = [
    ("Content-Type", "text/plain")
  ]
  start_response("200 OK", headers)
  return [out.encode("utf-8")]


# Fetch the latest tune from Datastore using App Engine.
def fetch(environ, start_response):
  out = ""
  client = ndb.Client()
  with client.context():
    result = Tune.get_by_id("PLAY")
    if result:
      out = result.data
      result.key.delete()

  headers = [
    ("Content-Type", "text/plain")
  ]
  start_response("200 OK", headers)
  return [out.encode("utf-8")]
