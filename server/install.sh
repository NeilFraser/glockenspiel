# Script for installing glockenspiel on Neil's server.
echo "Installing..."

cp -r html/hardware/glockenspiel/* ~/html/hardware/glockenspiel/
cp -r scripts/glockenspiel/ ~/scripts/
sudo chgrp www-data ~/html/hardware/glockenspiel/data
sudo chgrp www-data ~/scripts/glockenspiel/{music.json,music.time}
chmod +x ~/scripts/glockenspiel/{fetch.py,submit.py,storage.py,expiry.py}

echo "Done."
