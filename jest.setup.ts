import "@testing-library/jest-dom";

// Next's server runtime wants these at import time. Node has provided both
// natively since 18, and a route that returns a real streaming `Response` can
// only be read back in a test if the native one survives — so stub only when
// the global is genuinely missing.
if (typeof global.Request === "undefined") {
  global.Request = class Request {
    constructor() {
      return {};
    }
  } as any;
}

if (typeof global.Response === "undefined") {
  global.Response = class Response {
    constructor() {
      return {};
    }
  } as any;
}
