# Script to deploy on GAE.

APP=./app.yaml
if ! [ -f $APP ] ; then
   echo $APP not found 1>&2
   exit 1
fi

PROJECT=glockenspiel
VERSION=3

echo 'Beginning deployment...'
gcloud app deploy --project $PROJECT --version $VERSION --no-promote
echo 'Deployment finished.'
