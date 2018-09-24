const assert = require('assert');
const roll20auth = require("../index");
require('dotenv').load();

const assertValidString = (str, name) => {
    it(`key should have ${name}`, () => assert.equal(typeof(str), "string"));
    it(`should have non empty ${name}`, () => assert.equal(str.length > 0, true));
};

const assertGetter = (fx, val, name) => {
    it(`getter return should match value of ${name}`, () => assert.equal(fx(), val));
}

const assertKeyIsGood = (key) => {
    assertValidString(key.rackSession, "rackSession");
    assertValidString(key.tempAuth, "tempAuth");
    assertValidString(key.cfduid, "cfduid");

    assertGetter(key.getSessionKey, key.rackSession, "rackSession");
    assertGetter(key.getTempAuth, key.tempAuth, "tempAuth");
    assertGetter(key.getCfduid, key.cfduid, "cfduid");
};

const assertCampaignDataIsGood = (data) => {
    assertValidString(data.gntkn, "gntkn");
    assertValidString(data.campaign, "campaign");
    assertValidString(data.playerId, "playerId");
    assertValidString(data.accId, "accId");

    assertGetter(data.getGNTKN, data.gntkn, "gntkn");
    assertGetter(data.getCampaignStoragePath, data.campaign, "campaign");
    assertGetter(data.getPlayerId, data.playerId, "playerId");
    assertGetter(data.getPlayerAccountId, data.accId, "accId");
};

const asyncThrows = async (fx) => {
    let caught = false;
    try {
        await fx();
    } catch(err) {
        caught = true;
    }

    if(!caught) {
        assert.fail("didn't catch");
    }
};

describe('getSessionKey', () => {

    describe('login with valid credentials', () => {
        it("should succeed and give us a key", async () => {

            const key = await roll20auth.getSessionKey(
                process.env.ROLL20_USERNAME,
                process.env.ROLL20_PASSWORD);

            assertKeyIsGood(key);

        });
    });

    describe('login with invalid credentials', () => {
        it("should catch the error", async () => {
            await asyncThrows(async () => {
                await roll20auth.getSessionKey("i_dont_exist", "bad_password");
            });
        });
    });

    describe('login with credentials that have unescaped characters', () => {
        it("should succeed", async () => {
            const key = await roll20auth.getSessionKey(
                process.env.ROLL20_USERNAME_UNESCAPED,
                process.env.ROLL20_PASSWORD_UNESCAPED
            );

            assertKeyIsGood(key);
        });
    });
});

describe("getGNTKN", () => {
    describe("geting GNTKN with a valid session key", () => {
        it("should succeed and log us in", async () => {
            const key = await roll20auth.getSessionKey(process.env.ROLL20_USERNAME, process.env.ROLL20_PASSWORD)
            assertKeyIsGood(key);

            const data = await roll20auth.getCampaignData(key, process.env.ROLL20_CAMPAIGN_ID);
            assertCampaignDataIsGood(data);

            assert.equal(data.getCampaignStoragePath(), process.env.EXPECTED_CAMPAIGN_STORAGE_PATH);
            assert.equal(data.getPlayerId(), process.env.EXPECTED_PLAYER_ID);
            assert.equal(data.getPlayerAccountId(), process.env.EXPECTED_PLAYER_ACC_ID);
        })
    });

    describe("geting GNTKN with a null session key", () => {
        it("should catch an error", async () => {
            await asyncThrows(async () =>{
                await roll20auth.getCampaignData(null, process.env.ROLL20_CAMPAIGN_ID)
            });
        })
    });

    describe("geting GNTKN with a trash key", () => {
        it("should catch an error", async () => {
            await asyncThrows(async () => {
                await roll20auth.getCampaignData(new roll20auth.Roll20SessionKey("asdf", "asdf", "asdf"), process.env.ROLL20_CAMPAIGN_ID)
            });
        })
    });

    describe("geting GNTKN with an invalid campaign id", () => {
        it("should log us in", async () => {
            const key = await roll20auth.getSessionKey(
                process.env.ROLL20_USERNAME,
                process.env.ROLL20_PASSWORD);

            assertKeyIsGood(key);

            await asyncThrows(async () => {
                await roll20auth.getCampaignData(key, 1);
            });
        })
    });
});
