const rp = require('request-promise-native');

class Roll20SessionKey {
    constructor(rackSession, tempAuth, cfduid) {
        this.rackSession = rackSession;
        this.tempAuth = tempAuth;
        this.cfduid = cfduid;
    }

    makeCookies() {
        return `__cfduid=${this.cfduid}; roll20tempauth=${this.tempAuth}; rack.session=${this.rackSession}`;
    }

    getRackSession() {
        return this.rackSession;
    }

    getTempAuth() {
        return this.tempAuth;
    }

    getCfduid() {
        return this.cfduid;
    }
}

class Roll20CampaignInfo {
    constructor(gntkn, campaign, playerId, accId) {
        this.gntkn = gntkn;
        this.campaign = campaign;
        this.playerId = playerId;
        this.accId = accId;
    }

    getGNTKN() {
        return this.gntkn;

    }

    getCampaignStoragePath() {
        return this.campaign;
    }

    getPlayerId() {
        return this.playerId;
    }

    getPlayerAccountId() {
        return this.accId;
    }
}

const getCampaignData = async (sessionKey, campaignId) => {
    const cookies = sessionKey.makeCookies();

    const headers = {
        'Cookie': cookies
    };

    await rp({
        url: `https://app.roll20.net/editor/setcampaign/${campaignId}`,
        method: "GET",
        headers,
        resolveWithFullResponse: true,
    });

    const body = await rp({
        url: `https://app.roll20.net/editor/startjs/?timestamp=${Math.floor(new Date() / 1000)}&disablewebgl=false&forcelongpolling=false&offsite=false&fbdebug=false&forcetouch=false`,
        method: "GET",
        headers
    });

    const extractVar = (match, lookingFor) => {
        const idx = body.indexOf(match);

        if (idx === -1) {
            throw new Error(`couldn't find ${gntknMatch} in body while looking for ${lookingFor}`);
        }

        // do parsing
        let retval = body.substring(idx);
        return retval.substring(match.length, retval.indexOf("\";"));
    };

    const gntkn = extractVar("window.GNTKN = \"", "GNTKN");
    const camp = extractVar("window.campaign_storage_path = \"", "campaign storage path");
    const playerId =extractVar("window.d20_player_id = \"");
    const accId = extractVar("window.d20_account_id = \"", "player account id");
    const shardingUrl = extractVar("window.FIREBASE_ROOT = \"", "firebase root");

    const campaignPath = shardingUrl + camp;

    return new Roll20CampaignInfo(gntkn, campaignPath, playerId, accId);
};

const getSessionKey = async (username, password, tempAuth = "42") => {
    const tempAuthCookie = `roll20tempauth=${tempAuth}; `;

    const topbarResponse = await rp({
        url: `https://app.roll20.net/sessions/topbar/${tempAuth}`,
        method: "GET",
        headers: {"Cookie": tempAuthCookie},
        resolveWithFullResponse: true
    });

    const getCookieValue = (cookie) => cookie.substring(cookie.indexOf("=") + 1, cookie.indexOf(";"));
    const getCookieName = (cookie) => cookie.substring(0, cookie.indexOf("="));

    const key = new Roll20SessionKey(null, tempAuth.toString(), null);

    let cookies = tempAuthCookie;
    for (const cook of topbarResponse.headers["set-cookie"]) {
        const name = getCookieName(cook);
        const val = getCookieValue(cook);

        if (name === "__cfduid") {
            key.cfduid = val;
        }

        cookies += `${name}=${val}; `;
    }

    const createSeshResponse = await rp({
        url: 'https://app.roll20.net/sessions/create',
        method: 'POST',
        headers: {'Cookie': cookies},
        body: `email=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        simple: false,
        resolveWithFullResponse: true
    });

    const verifyLoggedInBody = await rp({
        url: "https://app.roll20.net/account/",
        method: "GET",
        headers: {"Cookie": cookies},
    });

    if (verifyLoggedInBody.includes("Login")) {
        throw new Error("Failed to log in.");
    }

    for (const cook of createSeshResponse.headers["set-cookie"]) {

        let target = null;
        if (cook.startsWith("__cfduid")) {
            target = "cfduid";
        } else if (cook.startsWith("rack.session")) {
            target = "rackSession";
        } else if (cook.startsWith("roll20tempauth")) {
            target = "tempAuth"
        }

        if (target !== null) {
            key[target] = getCookieValue(cook);
        }
    }

    return key;
};

module.exports = {
    getSessionKey,
    getCampaignData,
    Roll20SessionKey,
};