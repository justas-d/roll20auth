const assert = require('assert');
const roll20auth = require("../index");
require('dotenv').load();

const assertKeyIsGood = (key) => {
    it("key should have rackSession", () => assert.equal(typeof(key.rackSession), "string"));
    it("key should have tempAuth", () => assert.equal(typeof(key.tempAuth), "string"));
    it("key should have cfduid", () => assert.equal(typeof(key.cfduid), "string"));

    it("should have non empty rackSession", () => assert.equal(key.rackSession.length > 0, true));
    it("should have non empty tempAuth", () => assert.equal(key.tempAuth.length > 0, true));
    it("should have non empty cfduid", () => assert.equal(key.cfduid.length > 0, true));
};

describe('getSessionKey', () => {

    describe('login with valid credentials', () => {
        it("should succeed and give us a key", async () => {
            await roll20auth.getSessionKey(process.env.ROLL20_USERNAME, process.env.ROLL20_PASSWORD)
                .then(key => {
                    assertKeyIsGood(key);
                })
                .catch(err => {
                    assert.fail(err);
                });
        });
    });

    describe('login with invalid credentials', () => {
        it("should catch the error", async () => {
            await roll20auth.getSessionKey("i_dont_exist", "bad_password")
                .then(key => {
                    assert.fail(key);
                })
                .catch(err => {
                    assert.notEqual(err, false);
                })
        });
    });
});

describe("getGNTKN", () => {
    describe("geting GNTKN with a valid session key", () => {
        it("should succeed and log us in", async () => {
            await roll20auth.getSessionKey(process.env.ROLL20_USERNAME, process.env.ROLL20_PASSWORD)
                .then(async key => {
                    assertKeyIsGood(key);

                    await roll20auth.getGNTKN(key, process.env.ROLL20_CAMPAIGN_ID)
                        .then(gntkn => {
                            it("should be a string", assert.equal(typeof(gntkn), "string"));
                            it("should not be empty", assert.equal(gntkn.length > 0, true));
                        })
                        .catch(assert.fail)
                })
                .catch(err => {
                    assert.fail(err);
                });
        })
    });

    describe("geting GNTKN with a null session key", () => {
        it("should catch an error", async () => {
            await roll20auth.getGNTKN(null, process.env.ROLL20_CAMPAIGN_ID)
                .then(assert.fail)
                .catch(err => assert.notEqual(err, false));
        })
    });

    describe("geting GNTKN with a trash key", () => {
        it("should catch an error", async () => {
            await roll20auth.getGNTKN(new roll20auth.Roll20SessionKey("asdf", "asdf", "asdf"), process.env.ROLL20_CAMPAIGN_ID)
                .then(assert.fail)
                .catch(err => assert.notEqual(err, false));
        })
    });

    describe("geting GNTKN with an invalid campaign id", () => {
        it("should log us in", async () => {
            await roll20auth.getSessionKey(process.env.ROLL20_USERNAME, process.env.ROLL20_PASSWORD)
                .then(async key => {
                    assertKeyIsGood(key);

                    await roll20auth.getGNTKN(key, 1)
                        .then(assert.fail)
                        .catch(err => assert.notEqual(err, false));

                }).catch(assert.fail);
        })
    });
});
