# Fetch a new copy of all Raspberry Pi software from GitHub.
# Despite no-cache, githubusercontent caches for 5 minutes.
wget --no-cache -r -O /home/pi/crontab.txt https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/crontab.txt
wget --no-cache -r -O /home/pi/player.py https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/player.py
wget --no-cache -r -O /home/pi/westminster.py https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/westminster.py
wget --no-cache -r -O /home/pi/update.sh https://raw.githubusercontent.com/NeilFraser/glockenspiel/master/raspberry/update.sh
chmod +x player.py westminster.py update.sh
