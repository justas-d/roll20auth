# roll20auth
[NPM](https://www.npmjs.com/package/roll20auth)
[GitHub](https://github.com/SSStormy/roll20auth)

## Installation

```
npm install --save roll20auth
```

## Usage


async/await

```javascript
const roll20auth = require("roll20auth");

try {
const key = await roll20auth.getSessionKey(username, password);
const gntkn = await roll20auth.getGNTKN(key, campaignId);
} catch(err) {
    /* ... */
}
```

Promises
```javascript
const roll20auth = require("roll20auth");
roll20auth.getSessionKey(username, password)
    .then(key => {
        roll20auth.getGNTKN(key, campaignId)
            .then(gntkn => {
                /* ... */
            }).catch(console.log)
    }).catch(console.log);
```

### License

MIT
