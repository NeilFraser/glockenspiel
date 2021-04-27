# Manually shutdown pins 2 & 3 which float high by default.
gpio -g mode 2 out
gpio -g mode 3 out

# Also suggest adding this line to /boot/config.txt:
# gpio=2-27=op,dl
