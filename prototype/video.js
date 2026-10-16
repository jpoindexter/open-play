// Local video decoding, Canvas compositing and MediaRecorder output, independently implemented.
export function createVideoMixer({ state, engine, notify }) {
  const slots = [null, null];
  let canvas = null,
    image = null,
    recorder = null,
    chunks = [],
    result = null;
  async function load(index, file) {
    const previous = slots[index];
    if (previous) {
      previous.video.pause();
      URL.revokeObjectURL(previous.url);
    }
    const video = document.createElement("video"),
      url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve;
      video.onerror = () =>
        reject(new Error("This browser could not decode this video."));
    });
    slots[index] = { video, url, name: file.name };
    return video.duration;
  }
  function bind(target) {
    canvas = target;
  }
  async function play(index) {
    const item = slots[index];
    if (!item) return notify("Choose a local video for this side first.");
    if (item.video.paused) await item.video.play();
    else item.video.pause();
  }
  function setImage(url) {
    image = null;
    if (url) {
      const img = new Image();
      img.onload = () => (image = img);
      img.src = url;
    }
  }
  function drawSource(context, index, x = 0, y = 0, w = 640, h = 360) {
    const item = slots[index];
    if (item?.video.readyState >= 2) context.drawImage(item.video, x, y, w, h);
    else {
      context.fillStyle = index ? "#332127" : "#17323b";
      context.fillRect(x, y, w, h);
      context.fillStyle = "#bbb";
      context.font = "18px sans-serif";
      context.fillText(
        index ? "Load right video" : "Load left video",
        x + 16,
        y + 32,
      );
    }
  }
  function tick() {
    if (!canvas?.isConnected) return;
    const v = state.video,
      ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height;
    slots.forEach((item, i) => {
      if (!item) return;
      const d = state.decks[i];
      if (v.linked && d.track) {
        const position = engine.position(d) % item.video.duration;
        if (Math.abs(item.video.currentTime - position) > 0.25)
          item.video.currentTime = position;
        item.video.playbackRate = Math.max(0.0625, Math.min(16, d.rate));
        if (d.playing && item.video.paused)
          void item.video.play().catch((e) => notify(e.message));
        if (!d.playing && !item.video.paused) item.video.pause();
      }
    });
    const cross = v.linked
        ? engine.cross
        : v.auto
          ? Math.sin(performance.now() / 2500)
          : v.cross,
      amount = (cross + 1) / 2;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    drawSource(ctx, 0, 0, 0, w, h);
    ctx.save();
    if (v.transition.startsWith("Wipe")) {
      ctx.beginPath();
      ctx.rect(0, 0, w * amount, h);
      ctx.clip();
    } else ctx.globalAlpha = amount;
    if (v.transition.startsWith("Zoom")) {
      const scale = 0.2 + 0.8 * amount;
      ctx.translate((w * (1 - scale)) / 2, (h * (1 - scale)) / 2);
      ctx.scale(scale, scale);
    }
    drawSource(ctx, 1, 0, 0, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (image) {
      const scale = Math.min(w / image.width, h / image.height) * 0.5;
      ctx.drawImage(
        image,
        (w - image.width * scale) / 2,
        (h - image.height * scale) / 2,
        image.width * scale,
        image.height * scale,
      );
    }
    ctx.save();
    ctx.fillStyle = v.color;
    ctx.textAlign = (v.align || "Center").toLowerCase();
    ctx.textBaseline = "middle";
    ctx.font = "bold 30px sans-serif";
    const time = performance.now() / 1000,
      speed = { Slow: 0.5, Medium: 1, Fast: 2 }[v.speed || "Medium"];
    let x =
      ctx.textAlign === "left"
        ? 20
        : ctx.textAlign === "right"
          ? w - 20
          : w / 2;
    let zoom = 1;
    if (!state.settings["Reduced Motion"]) {
      if (v.animation === "Scroll") x += Math.sin(time * speed) * w * 0.2;
      if (v.animation === "BPM Zoom")
        zoom =
          1 +
          0.12 *
            Math.sin(
              ((time * (state.decks[0].track?.bpm || 120)) / 60) *
                Math.PI *
                2 *
                speed,
            );
      if (v.animation === "Bass Zoom") zoom = 1 + Math.min(0.3, engine.meter());
    }
    ctx.translate(x, h / 2);
    ctx.scale(zoom, zoom);
    ctx.fillText(v.text || "", 0, 0);
    ctx.restore();
    for (let i = 0; i < 2; i++) {
      const preview = document.querySelector(`#video-preview-${i}`);
      if (preview)
        drawSource(
          preview.getContext("2d"),
          i,
          0,
          0,
          preview.width,
          preview.height,
        );
      const status = document.querySelector(`#video-status-${i}`);
      if (status)
        status.textContent = slots[i]
          ? `${slots[i].name} · ${slots[i].video.currentTime.toFixed(1)} / ${Number.isFinite(slots[i].video.duration) ? slots[i].video.duration.toFixed(1) + "s" : "duration pending"} · ${slots[i].video.paused ? "Paused" : "Playing"}`
          : "No media loaded";
    }
    const stateEl = document.querySelector("#video-record-state");
    if (stateEl)
      stateEl.textContent =
        recorder?.state === "recording"
          ? "Recording actual canvas and browser master"
          : result
            ? `Capture ready: ${result.size} bytes`
            : "Not recording";
  }
  async function record() {
    if (!canvas || !canvas.captureStream || !window.MediaRecorder)
      throw new Error("Canvas recording is unsupported by this browser.");
    await engine.resume();
    chunks = [];
    const stream = canvas.captureStream(30);
    for (const audio of engine.destination.stream.getAudioTracks())
      stream.addTrack(audio);
    const mime = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t));
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.start(250);
  }
  function stop() {
    return new Promise((resolve) => {
      if (!recorder || recorder.state !== "recording") return resolve(result);
      recorder.onstop = () => {
        result = new Blob(chunks, { type: recorder.mimeType });
        for (const track of recorder.stream.getVideoTracks()) track.stop();
        resolve(result);
      };
      recorder.stop();
    });
  }
  return {
    load,
    bind,
    play,
    setImage,
    tick,
    record,
    stop,
    get recording() {
      return recorder?.state === "recording";
    },
    get result() {
      return result;
    },
  };
}
