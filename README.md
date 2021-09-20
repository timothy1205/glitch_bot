# Glitch Bot
[![CI](https://github.com/timothy1205/glitch_bot/actions/workflows/ci.yml/badge.svg)](https://github.com/timothy1205/glitch_bot/actions/workflows/ci.yml)
[![CodeQL](https://github.com/timothy1205/glitch_bot/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/timothy1205/glitch_bot/actions/workflows/codeql-analysis.yml)

Chat bot designed for a certain [twitch streamer](https://twitch.tv/imglitchh). Intended to work
mostly with twitch but easily extensible for other chat-related platforms.

## Setup

* Install docker and docker-compose

### Arch Based ###
```bash
$ pacman -S docker docker-compose
```

* Setup `bot/.env`` based on the template file.
* (Optional) Setup the docker-compose-prod.yml file
* Run the bot

Development config
```bash
$ docker-compose up
```

Production config
```bash
$ docker-compose -f docker-compose-prod.yml up -d
```


