## Installation

```
npm install --save roll20auth
```

## Usage

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