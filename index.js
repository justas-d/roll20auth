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

const getGNTKN = (sessionKey, campaignId) => {
    return new Promise((ok, err) => {
            const cookies = sessionKey.makeCookies();
            console.log(cookies);

            const headers = {
                'Cookie': cookies
            };

            rp({
                url: `https://app.roll20.net/editor/setcampaign/${campaignId}`,
                headers,
                resolveWithFullResponse: true,
            }).then(() => {
                rp({
                    url: `https://app.roll20.net/editor/startjs/?timestamp=${Math.floor(new Date() / 1000)}&disablewebgl=false&forcelongpolling=false&offsite=false&fbdebug=false&forcetouch=false`,
                    headers
                }).then(body => {
                    const gntknMatch = "window.GNTKN = \"";
                    const idx = body.indexOf(gntknMatch);

                    if (idx === -1) {
                        err({
                            error: `couldn't find ${gntknMatch} in body`,
                            body
                        });

                        return;
                    }

                    let gntkn = body.substring(idx);
                    gntkn = gntkn.substring(gntknMatch.length, gntkn.indexOf("\";"));

                    ok(gntkn);
                }).catch(err);
            }).catch(err);
        }
    );
};

const getSessionKey = (username, password, tempAuth = "42") => new Promise((ok, err) => {
    const tempAuthCookie = `roll20tempauth=${tempAuth}; `;

    rp({
        url: `https://app.roll20.net/sessions/topbar/${tempAuth}`,
        headers: {"Cookie": tempAuthCookie},
        resolveWithFullResponse: true
    }).then(response => {

        const getCookieValue = (cookie) => cookie.substring(cookie.indexOf("=") + 1, cookie.indexOf(";"));

        let cookies = tempAuthCookie;
        for (const cook of response.headers["set-cookie"]) {
            cookies += `${cook}=${getCookieValue(cook)}; `;
        }

        rp({
            url: 'https://app.roll20.net/sessions/create',
            method: 'POST',
            headers: {'Cookie': cookies},
            body: `email=${username}&password=${password}`,
            simple: false,
            resolveWithFullResponse: true

        }).then(() => {
            const key = new Roll20SessionKey(null, tempAuth.toString(), null);

            for (const cook of response.headers["set-cookie"]) {
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

            ok(key);


        }).catch(err);
    }).catch(err);
});

module.exports = {
    getSessionKey,
    getGNTKN,
    Roll20SessionKey,
};