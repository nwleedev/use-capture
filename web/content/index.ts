function isMessage<Type extends string>(
  message: unknown,
  type: Type
): message is { type: Type } {
  return (
    message instanceof Object && "type" in message && message.type === type
  );
}

type AnyRecord = Record<string, "string" | "number" | "boolean" | "bigint">;
type TypeRecord<R extends AnyRecord> = {
  [key in keyof R]: R[key] extends "string"
    ? string
    : R[key] extends "number"
    ? number
    : R[key] extends "boolean"
    ? boolean
    : R[key] extends "bigint"
    ? bigint
    : never;
};

function hasMessage<Args extends AnyRecord>(
  message: unknown,
  args: Args
): message is TypeRecord<Args> {
  const keys = Object.keys(args);
  const len = keys.length;
  let ok = true;
  for (let i = 0; i < len; i++) {
    const key = keys[i];
    if (
      message instanceof Object &&
      key in message &&
      typeof Reflect.get(message, key) === args[key]
    ) {
      continue;
    } else {
      ok = false;
      break;
    }
  }
  return ok;
}

async function captureAsync(
  current: number,
  step: number,
  count: number,
  duration: number,
  senderResponse: (resp?: unknown) => void
) {
  const video = document.querySelector("video");
  const canvas = document.createElement("canvas");
  if (!video) {
    return;
  }
  video.pause();
  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;

  const a = document.createElement("a");
  const blobs = [] as string[];
  let second = current;
  let times = 0;
  while (times <= duration && times < count) {
    const src = await new Promise<string>((resolve) => {
      video.onseeked = function () {
        const context = canvas.getContext("2d");
        context?.drawImage(video, 0, 0, width, height);
        const uri = canvas.toDataURL("image/png");
        resolve(uri);
      };
      video.currentTime = second;
    });
    blobs.push(src);
    second += step;
    times += 1;
  }
  a.remove();
  canvas.remove();

  senderResponse({ blobs });
  return true;
}

function onMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  senderResponse: (data?: unknown) => void
) {
  if (isMessage(message, "INFO") && document !== undefined) {
    const title = document.title;
    const video = document.querySelector("video");

    if (video !== null) {
      const duration = video.duration;
      const current = video.currentTime;
      senderResponse({ title, duration, current });
    } else {
      senderResponse({});
    }
    return true;
  }
  if (
    isMessage(message, "CAPTURE") &&
    hasMessage(message, {
      current: "number",
      step: "number",
      count: "number",
      duration: "number",
    })
  ) {
    const { current, step, count, duration } = message;
    captureAsync(current, step, count, duration, senderResponse);

    return true;
  }

  if (isMessage(message, "CHANGE") && hasMessage(message, { time: "number" })) {
    const video = document.querySelector("video");
    const { time } = message;
    if (video) {
      video.pause();
      video.currentTime = time;
    }
  }

  senderResponse({});
  return true;
}

const observer = new MutationObserver(function (mutations) {
  for (let i = 0; i < mutations.length; i++) {
    if (chrome.runtime.onMessage.hasListener(onMessage)) {
      chrome.runtime.onMessage.removeListener(onMessage);
    }

    if (window.location.href.includes("youtube")) {
      chrome.runtime.onMessage.addListener(onMessage);
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
