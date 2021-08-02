# Fetch a new copy of all Raspberry Pi software from GitHub.
# Despite no-cache, githubusercontent caches for 5 minutes.
wget --no-cache -O /home/pi/player.py https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/crontab.txt
wget --no-cache -O /home/pi/player.py https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/player.py
wget --no-cache -O /home/pi/player.py https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/westminster.py
wget --no-cache -O /home/pi/player.py https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/update.sh
