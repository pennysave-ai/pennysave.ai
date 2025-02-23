import "@testing-library/jest-dom";

// Mock the Request and Response globals
global.Request = class Request {
  constructor() {
    return {};
  }
} as any;

global.Response = class Response {
  constructor() {
    return {};
  }
} as any;
