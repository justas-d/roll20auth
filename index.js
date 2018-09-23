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
}

const getGNTKN = async (sessionKey, campaignId) => {
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

    const gntknMatch = "window.GNTKN = \"";
    const idx = body.indexOf(gntknMatch);

    if (idx === -1) {
        throw new Error(`couldn't find ${gntknMatch} in body`);
    }

    let gntkn = body.substring(idx);
    gntkn = gntkn.substring(gntknMatch.length, gntkn.indexOf("\";"));

    return gntkn;
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

        if(name === "__cfduid") {
            key.cfduid = val;
        }

        cookies += `${name}=${val}; `;
    }

    const createSeshResponse = await rp({
        url: 'https://app.roll20.net/sessions/create',
        method: 'POST',
        headers: {'Cookie': cookies},
        body: `email=${username}&password=${password}`,
        simple: false,
        resolveWithFullResponse: true
    });

    const verifyLoggedInBody = await rp({
        url: "https://app.roll20.net/account/",
        method: "GET",
        headers: {"Cookie": cookies},
    });

    if(verifyLoggedInBody.includes("Login")) {
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
    getGNTKN,
    Roll20SessionKey,
};