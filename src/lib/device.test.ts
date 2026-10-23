import { describe, expect, it } from "vitest";
import { describeDevice } from "@/lib/device";

const agents = {
  chromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
};

describe("describeDevice", () => {
  it("names the browser and the system", () => {
    expect(describeDevice(agents.chromeWindows)).toBe("Chrome · Windows");
    expect(describeDevice(agents.firefoxLinux)).toBe("Firefox · Linux");
    expect(describeDevice(agents.safariMac)).toBe("Safari · macOS");
  });

  it("tells Edge apart from Chrome, which it also says it is", () => {
    expect(describeDevice(agents.edgeWindows)).toBe("Edge · Windows");
  });

  it("recognizes phones, where Android is not mistaken for Linux and iPhone not for macOS", () => {
    expect(describeDevice(agents.chromeAndroid)).toBe("Chrome · Android");
    expect(describeDevice(agents.safariIphone)).toBe("Safari · iOS");
  });

  it("is empty when it cannot tell, and keeps what it can", () => {
    expect(describeDevice(null)).toBe("");
    expect(describeDevice("")).toBe("");
    expect(describeDevice("curl/8.5.0")).toBe("");
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0)")).toBe("Windows");
  });
});
