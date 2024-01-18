// deno-lint-ignore-file no-explicit-any

const TOKEN_BASE_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE_URL = "https://oauth.reddit.com";

interface RedditClassOption {
  username: string;
  password: string;
  appId: string;
  appSecret: string;
  userAgent: string;
}

type HttpMethod = "GET" | "POST";

export default class Reddit {
  username: string;
  password: string;
  appId: string;
  appSecret: string;
  userAgent: string;
  token: string | null;
  tokenExpireDate: number;

  constructor(opts: RedditClassOption) {
    this.username = opts.username;
    this.password = opts.password;
    this.appId = opts.appId;
    this.appSecret = opts.appSecret;
    // this.userAgent = opts.userAgent || 'reddit <your username>'
    this.userAgent = opts.userAgent || ("reddit u/" + opts.username);

    this.token = null;
    this.tokenExpireDate = 0;
  }

  get(url: string, data = {}) {
    return this._sendRequest("GET", API_BASE_URL + url, data);
  }

  post(url: string, data = {}) {
    return this._sendRequest("POST", API_BASE_URL + url, data);
  }

  async _sendRequest(method: HttpMethod, url: string, data: any = {}) {
    const token = await this._getToken();
    const body = await this._makeRequest(method, url, data, token);
    return body;
  }

  async _getToken(): Promise<string> {
    if (Date.now() / 1000 <= this.tokenExpireDate) {
      return this.token!;
    }

    const form = new FormData();
    form.append("grant_type", "password");
    form.append("username", this.username);
    form.append("password", this.password);

    const res = await fetch(TOKEN_BASE_URL, {
      method: "POST",
      body: form,
      headers: {
        authorization: `Basic ${btoa(`${this.appId}:${this.appSecret}`)}`,
        "user-agent": this.userAgent,
      },
    });

    const statusType = Math.floor(res.status / 100);
    const body = await res.json();

    if (statusType === 2) {
      const {
        access_token: accessToken,
        expires_in: expiresIn,
        token_type: tokenType,
      } = body;

      if (tokenType == null || accessToken == null) {
        throw new Error(
          `Cannot obtain token for username ${this.username}. ${body.error}. ${body.error_description}.`,
        );
      }

      this.token = `${tokenType} ${accessToken}`;
      // Shorten token expiration time by half to avoid race condition where
      // token is valid at request time, but server will reject it
      this.tokenExpireDate = ((Date.now() / 1000) + expiresIn) / 2;

      return this.token;
    } else if (statusType === 4) {
      throw new Error(
        `Cannot obtain token for username ${this.username}. Did you give ${this.username} access in your Reddit App Preferences? ${body.error}. ${body.error_description}. Status code: ${res.status}`,
      );
    } else {
      throw new Error(
        `Cannot obtain token for username ${this.username}. ${body.error}. ${body.error_description}. Status code: ${res.status}`,
      );
    }
  }

  async _makeRequest(
    method: HttpMethod,
    url: string,
    data: any = {},
    token: string,
  ): Promise<Response> {
    const opts: RequestInit = {
      method,
      headers: {
        // @ts-ignore-line
        "authorization": token,
        "user-agent": this.userAgent,
      },
    };

    // Request JSON API response type
    data.api_type = "json";

    if (method === "GET") {
      // @ts-ignore-line
      url += "?" + new URLSearchParams(data);
    } else if (method === "POST") {
      const form = new FormData();
      for (const key in data) {
        form.append(key, data[key]);
      }
      opts.body = form;
    }

    const res = await fetch(url, opts);
    const statusType = Math.floor(res.status / 100);

    if (statusType === 2) {
      return res;
    } else {
      throw new Error(`API error: Status code: ${res.status}`);
    }
  }
  async jsonPostRequest(
    url: string,
    data: any = {},
  ): Promise<Response> {
    const token = await this._getToken();

    // Request JSON API response type
    data.api_type = "json";
    const res = await fetch(API_BASE_URL + url, {
      method: "POST",
      headers: {
        // @ts-ignore-line
        "authorization": token,
        "user-agent": this.userAgent,
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const statusType = Math.floor(res.status / 100);

    if (statusType === 2) {
      return res;
    } else {
      throw new Error(`API error: Status code: ${res.status}`);
    }
  }
}
