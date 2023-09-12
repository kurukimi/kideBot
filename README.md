# kideBot

### What?
Telegram bot that one can use to automatically reserve tickets for a future or current kide app event. \
One can message commands such as 
- `/reserve {url}` to create a job reserve a ticket
- `/token {bearer}` to add kide app bearer for bot to make reservations
- `/jobs` to see  current jobs

### status
In development (for who knows how long)

### Implementation
The app written in TypeScript uses [telegraf](https://github.com/telegraf/telegraf) a js/ts bot api for telegram ui implementation. \
Db contains table for allowed users.
Currently bearer token is stored in db along with users Jobs.\
Implementation is not ready by any means.
### Why ?
One might be busy at the time of ticket release. \
...Or because it has gotten to a point where reserving ticket from kide app is pure bot wars (see eg. https://www.kiderat.app/)

### To who?
For me (Saying that I develop for myself releases me from many obligations of general good project practices).\
The currently online (in heroku) implementation for myself, since it isn't ready for storing real user data (and maybe shouldn't in the first place). 

## Development

### Requirements
The whole app is written using TypeScript and runs with nodejs. Install node packages using `npm install`. \
Database uses postgresql. Database models are not currently exposed. 

further documentation when I have too much time again..\


