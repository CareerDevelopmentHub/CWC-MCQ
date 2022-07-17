const { find } = require("lodash");
const { auth } = require("./firebase");
const contributors = require("../files/contributors.json");

class base {
    constructor(event) {
        ({
            url: this.url,
            path: this.path,
            method: this.method,
            headers: this.headers,
            query: this.query,
            body: this.body,
        } = this.parseEvent(event));
    }

    parseEvent(event) {
        const url = new URL(event.rawUrl);
        const query = Object.fromEntries(new URLSearchParams(event.rawQuery));

        return {
            query: query,
            url: url.origin,
            path: event.path,
            method: event.httpMethod,
            headers: event.headers,
            body: event.body,
        };
    }

    async authenticate() {
        switch (this.headers.auth_mode) {
            case "api":
                this.auth = this.headers.token === process.env.api_key;
                this.auth === true &&
                    (this.user = {
                        name: "CDH Bot",
                        telegram: 2070558552,
                        email: "cdhiter@gmail.com",
                        code: "CDH",
                    });
                break;
            default:
                await new Promise((resolve, _reject) =>
                    auth.verifyIdToken(this.headers.token).then((payload) => {
                        this.user = find(contributors, {
                            email: payload.email,
                        });
                        this.user.email && (this.auth = true);
                        resolve();
                    })
                ).catch((_error) => (this.auth = false));
        }
    }

    get_mention() {
        return `<a href="tg://user?id=${this.user.telegram}">${this.user.name}</a>`;
    }

    resp_200(body) {
        return {
            statusCode: 200,
            headers: {
                "content-type": `application/json`,
            },
            body: JSON.stringify({ ...body, OK: true }),
            isBase64Encoded: false,
        };
    }

    resp_404() {
        return {
            statusCode: 404,
            headers: {
                "content-type": `application/json`,
            },
            body: JSON.stringify({ message: "Not found", OK: false }),
            isBase64Encoded: false,
        };
    }

    resp_500(body) {
        return {
            statusCode: 500,
            headers: {
                "content-type": `application/json`,
            },
            body: JSON.stringify({ ...body, OK: false }),
            isBase64Encoded: false,
        };
    }
}

module.exports = base;
