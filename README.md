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
    /*
        key.makeCookies();
        key.getRackSession();
        key.getTempAuth();
        key.getCfduid();
    */

    const campaignData = await roll20auth.getCampaignData(key, campaignId);

    /*
        campaignData.getGNTKN();
        campaignData.getCampaignStoragePath();
        campaignData.getPlayerId();
        campaignData.getPlayerAccountId();
    */
} catch(err) {
    /* ... */
}
```

Promises
```javascript
const roll20auth = require("roll20auth");
roll20auth.getSessionKey(username, password)
    .then(key => {
        /*
            key.makeCookies();
            key.getRackSession();
            key.getTempAuth();
            key.getCfduid();
        */

        roll20auth.getCampaignData(key, campaignId)
            .then(campaignData => {
                /*
                    campaignData.getGNTKN();
                    campaignData.getCampaignStoragePath();
                    campaignData.getPlayerId();
                    campaignData.getPlayerAccountId();
                 */
            }).catch(console.log)
    }).catch(console.log);
```

### Testing

Make sure you have a `.env` file in the project root folder with the following data:
```
ROLL20_USERNAME=""
ROLL20_PASSWORD=""

ROLL20_USERNAME_UNESCAPED=""
ROLL20_PASSWORD_UNESCAPED=""

ROLL20_CAMPAIGN_ID=""
```

Run the tests
```
npm run test
```

### License

MIT
