"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
  var __publicField = (obj, key2, value) => __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);

  // src/shared/protocol.ts
  var DEFAULT_RULES = { totalRounds: 7, firstCharIntervalMs: 1e3, secondCharIntervalMs: 500, resultDelayMs: 5e3 };

  // src/shared/text.ts
  var ignored = /[\p{P}\s]/u;
  function displayUnits(prompt) {
    const units = [];
    let prefix = "";
    for (const char of Array.from(prompt.normalize("NFC"))) {
      if (ignored.test(char)) {
        if (units.length) units[units.length - 1] += char;
        else prefix += char;
      } else {
        units.push(prefix + char);
        prefix = "";
      }
    }
    return units;
  }
  function normalizeAnswer(answer) {
    return answer.normalize("NFKC").trim().toLowerCase();
  }
  function answerMatches(answer, canonical, aliases) {
    const value = normalizeAnswer(answer);
    return !!value && [canonical, ...aliases].some((item) => normalizeAnswer(item) === value);
  }

  // src/client/tutorial.ts
  var TUTORIAL_PROMPT = "\u88AB\u79F0\u4E3A\u6C99\u6F20\u4E4B\u821F\uFF0C\u80CC\u4E0A\u6709\u9A7C\u5CF0\u7684\u52A8\u7269\u662F\u4EC0\u4E48\uFF1F";
  var Tutorial = class {
    constructor(now, completed) {
      __publicField(this, "completed", completed);
      __publicField(this, "units", displayUnits(TUTORIAL_PROMPT));
      __publicField(this, "id", `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      __publicField(this, "phase", "first");
      __publicField(this, "count", 0);
      __publicField(this, "draft", "");
      __publicField(this, "answer", null);
      __publicField(this, "success", false);
      __publicField(this, "notice", "\u4F60\u662F\u7B2C\u4E00\u68D2\uFF0C\u6587\u5B57\u4F1A\u9010\u5B57\u51FA\u73B0\u3002");
      __publicField(this, "deadline");
      __publicField(this, "next");
      __publicField(this, "cut", 7);
      __publicField(this, "reported", false);
      this.next = now + 1e3;
      this.deadline = now + 45e3;
    }
    get fragment() {
      return this.units.slice(0, Math.min(this.count, this.cut)).join("");
    }
    get partnerFragment() {
      return this.phase === "result" ? this.units.slice(this.cut).join("") : "";
    }
    tick(now) {
      if (this.phase === "result") return;
      if (now >= this.deadline) {
        if (this.phase === "answer" && this.draft.trim()) {
          this.submit(now);
          this.notice = "\u65F6\u95F4\u5230\u4E86\uFF0C\u5DF2\u81EA\u52A8\u9501\u5B9A\u586B\u5199\u7684\u7B54\u6848\u3002\u7B2C\u4E8C\u68D2\u63A5\u68D2\u540E\u5C31\u80FD\u4F5C\u7B54\u3002";
        } else {
          this.phase = "result";
          this.notice = "\u65F6\u95F4\u5230\u4E86\uFF0C\u6162\u6162\u6765\u3002\u91CD\u8BD5\u4E00\u6B21\u5C31\u597D\u3002";
        }
        return;
      }
      if (now < this.next) return;
      if (this.phase === "first" && this.count < 7) {
        this.count++;
        this.next = now + 1e3;
        if (this.count === 7) this.notice = "\u4F60\u5DF2\u770B\u5230\u6709\u6548\u7EBF\u7D22\uFF0C\u70B9\u51FB\u4EA4\u68D2\uFF0C\u7ED9\u642D\u6863\u7559\u4E0B\u53E6\u4E00\u6BB5\u3002";
      } else if (this.phase === "partner") {
        if (this.count < this.units.length) {
          this.count++;
          this.next = now + 500;
        } else {
          this.phase = "result";
          this.success = answerMatches(this.answer ?? "", "\u9A86\u9A7C", []);
          this.notice = this.success ? "\u4F60\u548C\u6A21\u62DF\u642D\u6863\u90FD\u7B54\u5BF9\u4E86\uFF01\u53EA\u6709\u540C\u65F6\u7B54\u5BF9\u624D\u7B97\u5171\u540C\u6210\u529F\u3002" : "\u8FD9\u6B21\u6CA1\u6709\u540C\u65F6\u7B54\u5BF9\u3002\u63D0\u793A\uFF1A\u6C99\u6F20\u4E4B\u821F\u5C31\u662F\u9A86\u9A7C\uFF0C\u91CD\u8BD5\u4E00\u6B21\u3002";
          if (this.success && !this.reported) {
            this.reported = true;
            this.completed();
          }
        }
      }
    }
    handoff(now) {
      if (this.phase !== "first") return;
      if (this.count < 7) {
        this.phase = "result";
        this.notice = "\u4EA4\u68D2\u6709\u70B9\u65E9\uFF0C\u8FD8\u6CA1\u770B\u5230\u5B8C\u6574\u7EBF\u7D22\u3002\u91CD\u8BD5\uFF0C\u5148\u8BFB\u5230\u201C\u6C99\u6F20\u4E4B\u821F\u201D\u3002";
        return;
      }
      this.cut = this.count;
      this.phase = "answer";
      this.deadline = now + 3e4;
      this.notice = "\u7B2C\u4E00\u68D2\u4EA4\u68D2\u540E\u5C31\u80FD\u4F5C\u7B54\u3002\u63D0\u4EA4\u540E\u9501\u5B9A\uFF1B\u5230\u65F6\u81EA\u52A8\u63D0\u4EA4\u5DF2\u586B\u5199\u7684\u7B54\u6848\u3002";
    }
    submit(now) {
      if (this.phase !== "answer" || !this.draft.trim()) return;
      this.answer = this.draft.trim();
      this.phase = "partner";
      this.next = now + 500;
      this.deadline = now + 3e4;
      this.notice = "\u4F60\u7684\u7B54\u6848\u5DF2\u9501\u5B9A\u3002\u7B2C\u4E8C\u68D2\u63A5\u68D2\u540E\u5C31\u80FD\u4F5C\u7B54\uFF0C\u6A21\u62DF\u642D\u6863\u7EE7\u7EED\u9010\u5B57\u8BFB\u9898\u3002";
    }
  };

  // src/client/question-grid.ts
  function questionGrid(room) {
    const columns = 8, size = 34, gap = 4;
    const rows = Math.ceil((room.length + 1) / columns);
    const rowGap = rows > 3 ? 14 : 20;
    const top = rows > 3 ? 254 : 280;
    const units = displayUnits(room.myFragment);
    const start = room.myLastIndex + 1 - units.length;
    const cursor = Math.max(0, Math.min(room.length, room.revealedCount));
    const cells = Array.from({ length: room.length + 1 }, (_, index) => ({
      index,
      x: 37 + index % columns * (size + gap),
      y: top + Math.floor(index / columns) * (size + rowGap),
      size,
      unit: index >= start && index <= room.myLastIndex ? units[index - start] ?? "" : "",
      revealed: index < cursor,
      questionMark: index === room.length
    }));
    const bottom = Math.max(445, top + rows * size + (rows - 1) * rowGap + 18);
    return { cells, pointer: cells[cursor], panelTop: rows > 3 ? 238 : 254, bottom, controlsOffset: bottom - 445 };
  }

  // src/client/theme.ts
  var light = {
    bg: "#F7F6F3",
    paper: "#FFFFFF",
    ink: "#242C2A",
    muted: "#717973",
    line: "#E5E6DF",
    blue: "#DFEEF5",
    blueInk: "#316B89",
    green: "#E8EFE1",
    greenInk: "#4D6E42",
    red: "#A24A40",
    redBg: "#F7E7E2",
    disabled: "#D6D9D2",
    onPrimary: "#FFFFFF",
    onDisabled: "#FFFFFF",
    toast: "#242C2A",
    onToast: "#FFFFFF",
    gridRead: "#F0F1EC",
    gridBorder: "#BEC7BC",
    gridGuide: "#D5DCD1",
    gridPanel: "#ECEFE7",
    stopShell: "#F6E3DF",
    stopBase: "#913039",
    stopDisabledBase: "#CAA19E",
    stopFace: "#D64A53",
    stopPressed: "#AD303D",
    stopDisabledFace: "#DBAAA6"
  };
  var THEMES = {
    light,
    dark: {
      bg: "#141C19",
      paper: "#1F2924",
      ink: "#EDF3EF",
      muted: "#A0B0A7",
      line: "#344139",
      blue: "#1D3542",
      blueInk: "#9BD2ED",
      green: "#263928",
      greenInk: "#B4D5A0",
      red: "#F3A39A",
      redBg: "#432A29",
      disabled: "#344139",
      onPrimary: "#141C19",
      onDisabled: "#98A99F",
      toast: "#294337",
      onToast: "#E7F2E8",
      gridRead: "#1B2520",
      gridBorder: "#566B5B",
      gridGuide: "#35483B",
      gridPanel: "#18271D",
      stopShell: "#422B30",
      stopBase: "#843039",
      stopDisabledBase: "#574147",
      stopFace: "#D64A53",
      stopPressed: "#AD303D",
      stopDisabledFace: "#785059"
    }
  };

  // src/client/audio.ts
  var MUSIC_PATH = "audio/jazz-brunch.mp3";
  var SOUND_PATHS = {
    click: "audio/click.wav",
    stop: "audio/stop.wav",
    lock: "audio/lock.wav",
    start: "audio/start.wav",
    success: "audio/success.wav",
    failure: "audio/failure.wav"
  };
  var MUSIC_CREDIT = '"Jazz Brunch" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttps://creativecommons.org/licenses/by/4.0/\n\u6E38\u620F\u526F\u672C\u91CD\u65B0\u7F16\u7801\u4E3A 64 kbps\uFF1B\u66F2\u76EE\u5B8C\u6574\uFF0C\u672A\u526A\u8F91\u3002';
  function audioPreferences(saved) {
    try {
      const value = JSON.parse(saved ?? "null");
      if (value && typeof value === "object") return {
        music: "music" in value && typeof value.music === "boolean" ? value.music : true,
        effects: "effects" in value && typeof value.effects === "boolean" ? value.effects : true
      };
    } catch {
    }
    return { music: true, effects: true };
  }
  var GameAudio = class {
    constructor(backend, saved, save, notify) {
      __publicField(this, "backend", backend);
      __publicField(this, "save", save);
      __publicField(this, "notify", notify);
      __publicField(this, "preferences");
      __publicField(this, "unlocked", false);
      __publicField(this, "visible", true);
      __publicField(this, "interrupted", false);
      this.preferences = audioPreferences(saved);
      backend?.onError?.(() => this.notify("\u58F0\u97F3\u6682\u65F6\u65E0\u6CD5\u64AD\u653E\uFF0C\u8BF7\u5C1D\u8BD5\u5173\u95ED\u540E\u91CD\u65B0\u5F00\u542F\u3002"));
    }
    unlock() {
      this.unlocked = true;
      this.syncMusic();
    }
    setMusic(enabled) {
      this.preferences.music = enabled;
      this.syncMusic();
      this.persist();
    }
    setEffects(enabled) {
      this.preferences.effects = enabled;
      if (!enabled) this.backend?.stopEffects();
      this.persist();
    }
    setVisible(visible) {
      this.visible = visible;
      this.syncMusic();
      if (!visible) this.backend?.stopEffects();
    }
    setInterrupted(interrupted) {
      this.interrupted = interrupted;
      this.syncMusic();
      if (interrupted) this.backend?.stopEffects();
    }
    effect(sound) {
      if (this.unlocked && this.visible && !this.interrupted && this.preferences.effects) this.backend?.playEffect(sound);
    }
    syncMusic() {
      if (this.unlocked && this.visible && !this.interrupted && this.preferences.music) this.backend?.resumeMusic();
      else this.backend?.pauseMusic();
    }
    persist() {
      try {
        this.save(JSON.stringify(this.preferences));
      } catch {
        this.notify("\u58F0\u97F3\u5DF2\u5207\u6362\uFF0C\u6682\u65F6\u65E0\u6CD5\u4FDD\u5B58\u504F\u597D\u3002");
      }
    }
  };

  // src/client/app.ts
  var F = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  var GameApp = class {
    constructor(platform2) {
      __publicField(this, "platform", platform2);
      __publicField(this, "audio");
      __publicField(this, "audioSettingsOpen", false);
      __publicField(this, "wordbankSelection", null);
      __publicField(this, "soundedResults", /* @__PURE__ */ new Set());
      __publicField(this, "colorMode", "dark");
      __publicField(this, "colors", THEMES.dark);
      __publicField(this, "snapshot", null);
      __publicField(this, "socket", null);
      __publicField(this, "buttons", []);
      __publicField(this, "connection", "connecting");
      __publicField(this, "status", "");
      __publicField(this, "statusUntil", 0);
      __publicField(this, "tutorial", null);
      __publicField(this, "historyPage", 0);
      __publicField(this, "invitationId", "");
      __publicField(this, "pendingEvents", []);
      __publicField(this, "eventTimer", null);
      __publicField(this, "invitedRoom");
      __publicField(this, "leavingForInvite", false);
      __publicField(this, "draft", "");
      __publicField(this, "draftRevision", 0);
      __publicField(this, "answerPromptRoundId", null);
      __publicField(this, "tutorialPrompt", null);
      __publicField(this, "name");
      __publicField(this, "handoffPending", false);
      __publicField(this, "stopPressed", false);
      __publicField(this, "submitPending", false);
      __publicField(this, "requestSequence", 0);
      __publicField(this, "serverOffset", 0);
      __publicField(this, "connecting", false);
      __publicField(this, "connectionGeneration", 0);
      __publicField(this, "takenOver", false);
      __publicField(this, "visible", true);
      __publicField(this, "reconnectTimer", null);
      __publicField(this, "paint", () => {
        if (this.tutorialPrompt && (this.tutorial !== this.tutorialPrompt || this.tutorialPrompt.phase !== "answer")) {
          this.platform.cancelPrompt?.();
          this.tutorialPrompt = null;
        }
        this.platform.beginFrame();
        this.buttons = [];
        const ctx2 = this.platform.context;
        ctx2.fillStyle = this.colors.bg;
        ctx2.fillRect(0, 0, 375, 812);
        const room = this.snapshot?.room;
        if (room?.phase === "result") this.describe();
        if (room || this.snapshot?.returnRoom) this.top();
        if (this.tutorial && !room && !this.snapshot?.returnRoom) {
          this.drawTutorial();
        } else if (!room) {
          const pending = this.snapshot?.returnRoom;
          if (pending) this.returning(pending.code, pending.until);
          else this.home();
        } else {
          if (room.phase !== "lobby") this.roomHeader(room);
          if (room.phase === "lobby") this.lobby(room);
          else if (room.phase === "result" || room.phase === "complete") this.result(room);
          else if (room.phase === "exhausted") {
            this.text("\u672C\u623F\u95F4\u7684\u9898\u76EE\u7528\u5B8C\u4E86\u3002", 24, 170, 26, this.colors.ink, 700);
            this.text(room.notice, 24, 242, 16, this.colors.muted, 400, 327, 27);
            this.button("leave", "\u9000\u51FA\u623F\u95F4", 24, 748, 327, 44, () => this.action({ type: "leave" }), "bare");
          } else this.play(room);
          if (room.phase === "result") this.button("leave", "\u9000\u51FA\u623F\u95F4", 24, 758, 327, 38, () => this.action({ type: "leave" }), "bare");
        }
        const info = this.statusUntil > Date.now() ? this.status : this.takenOver ? "\u6E38\u620F\u5DF2\u5728\u53E6\u4E00\u9875\u9762\u6253\u5F00\uFF0C\u8BF7\u5173\u95ED\u5F53\u524D\u9875\u9762\u3002" : this.connection !== "connected" ? this.connection === "connecting" ? "\u6B63\u5728\u8FDE\u63A5\u623F\u95F4\u670D\u52A1\u5668\u2026" : "\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u6B63\u5728\u91CD\u8FDE\u2026" : "";
        this.themeToggle();
        if (room && this.wordbankSelection) this.drawWordbanks(room);
        this.audioSettings();
        if (info) {
          this.rect(16, 5, 343, 29, this.colors.toast, void 0, 4);
          this.text(info, 25, 12, 11, this.colors.onToast, 500, 325, 15);
        }
        this.platform.syncButtons(this.buttons);
        this.platform.frame(this.paint);
      });
      let savedAudio = null;
      try {
        savedAudio = platform2.get("audio");
      } catch {
      }
      this.audio = new GameAudio(platform2.audio, savedAudio, (value) => platform2.set("audio", value), (message) => this.notify(message));
      platform2.onAudioVisibility?.((visible) => this.audio.setVisible(visible));
      platform2.onAudioInterruption?.((interrupted) => this.audio.setInterrupted(interrupted));
      this.colorMode = platform2.get("theme") === "light" ? "light" : "dark";
      this.colors = THEMES[this.colorMode];
      platform2.applyTheme?.(this.colorMode);
      this.name = platform2.get("name") || "";
      this.invitedRoom = platform2.inviteCode;
      this.invitationId = platform2.inviteId ?? this.newId();
      try {
        const saved = JSON.parse(platform2.get("events") ?? "[]");
        this.pendingEvents = Array.isArray(saved) ? saved.filter((e) => e?.type === "event" && typeof e.eventId === "string").slice(-100) : [];
      } catch {
        this.pendingEvents = [];
      }
      platform2.onInvite?.((code, id) => {
        if (this.tutorial) {
          this.telemetry("tutorial_skip", this.tutorial.id);
          this.tutorial = null;
        }
        this.invitedRoom = code;
        this.invitationId = id;
        this.leavingForInvite = false;
        if (this.snapshot && this.connection === "connected") this.followInvitation(this.snapshot);
      });
      platform2.onVisibility?.((visible) => {
        this.visible = visible;
        if (!visible) {
          this.socket?.close();
        } else if (this.connection !== "connected") {
          void this.connect();
        }
      });
      void this.connect();
      this.paint();
    }
    async connect() {
      if (this.connecting || !this.visible || this.connection === "connected" || this.takenOver) return;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      const generation = ++this.connectionGeneration;
      this.connecting = true;
      this.connection = "connecting";
      try {
        const session = await this.platform.session(this.platform.get("token"), this.name);
        if (!this.visible || generation !== this.connectionGeneration) {
          this.connecting = false;
          return;
        }
        this.platform.set("token", session.token);
        this.name = session.name;
        this.platform.set("name", this.name);
        this.socket = this.platform.connect(session.token, {
          open: () => {
            if (generation !== this.connectionGeneration) return;
            this.connecting = false;
            this.connection = "connected";
            this.submitPending = false;
            this.flushEvents();
          },
          close: (code) => {
            if (generation !== this.connectionGeneration) return;
            this.connecting = false;
            this.connection = "offline";
            if (code === 4001) {
              this.takenOver = true;
              this.notify("\u6E38\u620F\u5DF2\u5728\u53E6\u4E00\u9875\u9762\u6253\u5F00\uFF0C\u8BF7\u5173\u95ED\u5F53\u524D\u9875\u9762\u3002");
              return;
            }
            if (!this.reconnectTimer) this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              void this.connect();
            }, 1500);
          },
          message: (text) => {
            if (generation !== this.connectionGeneration) return;
            try {
              this.receive(JSON.parse(text));
            } catch {
              this.notify("\u6536\u5230\u7684\u6570\u636E\u683C\u5F0F\u5F02\u5E38\u3002");
            }
          }
        });
      } catch (error) {
        if (error instanceof Error) this.notify(error.message);
        this.connecting = false;
        this.connection = "offline";
        if (!this.reconnectTimer) this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          void this.connect();
        }, 2e3);
      }
    }
    receive(message) {
      if ("serverNow" in message) this.serverOffset = message.serverNow - Date.now();
      if (message.type === "snapshot") {
        const previous = this.snapshot?.room;
        const current2 = message.room;
        if (this.wordbankSelection && (current2?.roomId !== this.wordbankSelection.roomId || !["lobby", "complete"].includes(current2.phase))) this.wordbankSelection = null;
        if (this.wordbankSelection && current2?.hostId !== message.playerId) this.wordbankSelection.ids = [...current2?.wordbankIds ?? []];
        if (current2?.result && ["result", "complete"].includes(current2.phase)) {
          const id = current2.result.roundId;
          if (!this.soundedResults.has(id)) {
            this.rememberResult(id);
            if (previous?.roundId === id && ["reading", "answering", "paused"].includes(previous.phase)) this.audio.effect(current2.result.success ? "success" : "failure");
          }
        }
        if (current2?.phase === "reading" && current2.roundId !== previous?.roundId && previous && ["lobby", "result", "complete"].includes(previous.phase)) this.audio.effect("start");
        const changedRound = message.room?.roundId !== this.snapshot?.room?.roundId;
        const revision = message.room?.myDraftRevision ?? 0;
        if (changedRound || revision >= this.draftRevision) {
          this.draft = message.room?.myDraft ?? "";
          this.draftRevision = revision;
        }
        this.snapshot = message;
        this.handoffPending = false;
        if (changedRound || message.room?.myAnswer !== null) this.submitPending = false;
        if (this.answerPromptRoundId && (this.answerPromptRoundId !== message.room?.roundId || message.room?.myAnswer !== null || !["reading", "answering", "paused"].includes(message.room.phase))) {
          this.platform.cancelPrompt?.();
          this.answerPromptRoundId = null;
        }
        if (message.room?.canAnswer && revision < this.draftRevision) this.action({ type: "draft", roundId: message.room.roundId, answer: this.draft, revision: this.draftRevision });
        if (this.tutorial && (message.room || message.returnRoom)) {
          this.telemetry("tutorial_skip", this.tutorial.id);
          this.tutorial = null;
        }
        this.platform.configureShare?.(message.room?.phase === "lobby" ? message.room.code : void 0, () => this.telemetry("invite_trigger"));
        const me = message.room?.players.find((p) => p.id === message.playerId);
        if (me && me.name !== this.name) {
          this.name = me.name;
          this.platform.set("name", this.name);
        }
        this.followInvitation(message);
      } else if (message.type === "reveal") {
        const room = this.snapshot?.room;
        if (!room || room.phase !== "reading" || room.roundId !== message.roundId || this.handoffPending) return;
        if (message.index > room.myLastIndex) {
          room.myFragment += message.text;
          room.myLastIndex = message.index;
        }
        room.revealedCount = Math.max(room.revealedCount, message.index + 1);
        const me = room.players.find((p) => p.id === this.snapshot.playerId);
        room.canHandoff = me?.readingOrder === 1 && room.activeSeat === me.seat && room.phase === "reading";
        this.action({ type: "ack", roundId: message.roundId, index: message.index });
      } else if (message.type === "progress") {
        const room = this.snapshot?.room;
        if (!room || room.roundId !== message.roundId) return;
        room.revealedCount = Math.max(room.revealedCount, Math.min(room.length, message.revealedCount));
      } else if (message.type === "error") {
        this.handoffPending = false;
        this.submitPending = false;
        this.notify(message.message);
      } else if (message.type === "event_ack") {
        this.pendingEvents = this.pendingEvents.filter((e) => e.eventId !== message.eventId);
        this.platform.set("events", JSON.stringify(this.pendingEvents));
      } else if (message.type === "notice") this.notify(message.message);
      this.describe();
    }
    describe() {
      const snapshot = this.snapshot;
      if (!snapshot) return;
      if (this.tutorial) {
        this.describeTutorial();
        return;
      }
      const room = snapshot.room;
      this.platform.describe?.(room ? [
        `\u623F\u95F4\u7801 ${room.code}\uFF0C${this.modeLabel(room)}\uFF0C\u7B2C ${room.roundNumber}/${room.totalRounds} \u9898\uFF0C${room.length ? room.length + " \u5B57" : "\u5B57\u6570\u968F\u9898\u76EE\u53D8\u5316"}\u3002\u5DF2\u7ED3\u7B97 ${room.completedRounds} \u9898\uFF0C\u4E24\u4EBA\u4E00\u8D77\u7B54\u5BF9 ${room.successRounds} \u9898\u3002`,
        `\u72B6\u6001\uFF1A${room.phase}\u3002`,
        room.wordbankIds ? `\u6240\u9009\u9898\u5E93\uFF1A${this.bankNames(room.wordbankIds)}\u3002\u5269\u4F59\u53EF\u7528\u65B0\u9898\u6982\u5FF5\uFF1A${room.availableConceptCount}\u3002` : "",
        room.players.map((p) => `${p.seat === 0 ? "A" : "B"}\uFF1A${p.name}\uFF0C\u672C\u9898\u7B2C ${p.readingOrder} \u68D2\uFF0C${p.left ? "\u5DF2\u9000\u51FA\u623F\u95F4" : !p.connected ? "\u65AD\u7EBF" : p.ready ? "\u5DF2\u51C6\u5907" : "\u672A\u51C6\u5907"}\uFF0C${p.submitted ? "\u5DF2\u63D0\u4EA4" : "\u672A\u63D0\u4EA4"}`).join("\uFF1B"),
        room.returnUntil ? "\u642D\u6863\u5DF2\u9000\u51FA\uFF0C\u7B49\u5F85\u8FD4\u56DE\u623F\u95F4\u3002" : "",
        room.phase === "result" ? room.nextRoundAt ? `${this.secondsUntil(room.nextRoundAt)} \u79D2\u540E\u81EA\u52A8\u8FDB\u5165\u4E0B\u4E00\u9898\u3002` : "\u7B49\u5F85\u642D\u6863\u5728\u7EBF\u5E76\u8FD4\u56DE\uFF0C\u518D\u5F00\u59CB\u4E0B\u4E00\u9898\u5012\u8BA1\u65F6\u3002" : "",
        room.roundId && room.myAnswer === null ? `\u4F60\u7684\u8349\u7A3F\uFF1A${this.draft || "\u5C1A\u672A\u586B\u5199"}\u3002` : "",
        room.roundId ? `\u7C73\u5B57\u683C ${room.length} \u4E2A\uFF0C\u672B\u5C3E\u95EE\u53F7\u3002\u5DF2\u8BFB ${room.revealedCount}/${room.length} \u5B57\uFF0C\u6307\u9488\uFF1A${room.revealedCount >= room.length ? "\u672B\u5C3E\u95EE\u53F7" : `\u7B2C ${room.revealedCount + 1} \u683C`}\u3002` : "",
        `\u4F60\u7684\u7247\u6BB5\uFF1A${room.myFragment || "\u5C1A\u672A\u63A5\u9898"}\u3002`,
        room.sharedContext ? `\u53CC\u65B9\u5171\u540C\u80CC\u666F\uFF1A${room.sharedContext}\u3002` : "",
        room.phase === "complete" ? `\u4E03\u9898\u6210\u7EE9\uFF1A${room.history.map((r) => `${r.roundNumber}\u9898${r.success ? "\u5171\u540C\u7B54\u5BF9" : "\u672A\u5171\u540C\u7B54\u5BF9"}`).join("\uFF1B")}\u3002` : "",
        room.result ? `\u5B8C\u6574\u9898\u76EE\uFF1A${room.result.sharedContext ? room.result.sharedContext + "\uFF1A" : ""}${room.result.prompt} \u6807\u51C6\u7B54\u6848\uFF1A${room.result.answer}\u3002${room.result.success ? "\u4E24\u4EBA\u90FD\u7B54\u5BF9\u4E86\u3002" : "\u672C\u9898\u672A\u901A\u8FC7\u3002"}` : ""
      ].filter(Boolean).join("\n") : snapshot.returnRoom ? `\u5DF2\u9000\u51FA\u623F\u95F4 ${snapshot.returnRoom.code}\uFF0C\u53EF\u5728\u5012\u8BA1\u65F6\u7ED3\u675F\u524D\u8FD4\u56DE\u623F\u95F4\u3002` : `\u4E24\u4EBA\u7B54\u9898\u63A5\u529B\u3002\u6BCF\u573A\u56FA\u5B9A ${snapshot.rules.totalRounds} \u9898\uFF0C\u6BCF\u9898\u8F6E\u6362\u68D2\u6B21\u3002\u521B\u5EFA\u623F\u95F4\uFF0C\u6216\u7528\u516D\u4F4D\u623F\u95F4\u7801\u52A0\u5165\u3002`);
    }
    notify(message) {
      this.status = message;
      this.statusUntil = Date.now() + 6500;
    }
    followInvitation(snapshot) {
      const code = this.invitedRoom;
      if (!code) return;
      if (snapshot.room && snapshot.room.code !== code && ["lobby", "complete", "exhausted"].includes(snapshot.room.phase)) {
        if (!this.leavingForInvite) {
          this.leavingForInvite = true;
          this.action({ type: "leave" });
        }
        return;
      }
      this.invitedRoom = void 0;
      this.platform.clearInvite?.();
      if (snapshot.room?.code === code) return;
      this.leavingForInvite = false;
      this.action({ type: "join", code, source: this.platform.source === "wechat" ? "wechat_invite" : "browser_invite", inviteId: this.invitationId });
    }
    action(action) {
      if (this.connection !== "connected") {
        this.notify("\u6B63\u5728\u6062\u590D\u8FDE\u63A5\uFF0C\u8BF7\u7A0D\u5019\u3002");
        return;
      }
      this.socket?.send(JSON.stringify({ ...action, requestId: `${Date.now()}-${++this.requestSequence}` }));
    }
    async editName() {
      const name = await this.platform.prompt("\u4F60\u7684\u6635\u79F0", this.name, 12);
      if (name === void 0) return;
      this.action({ type: "rename", name: name.trim() });
    }
    async shareInvitation(code) {
      if (this.platform.invite) {
        try {
          const request = this.platform.invite(code);
          this.telemetry("invite_trigger");
          const result = await request;
          if (result === "cancelled") return;
          this.notify(result === "wechat-requested" ? "\u672A\u5F39\u51FA\u9009\u62E9\u754C\u9762\uFF0C\u53EF\u4ECE\u53F3\u4E0A\u89D2\u201C\u2026\u201D\u8F6C\u53D1\u3002" : result === "guidance" ? "\u6309\u6307\u5F15\u53D1\u9001\u94FE\u63A5\uFF0C\u597D\u53CB\u5373\u53EF\u52A0\u5165\u623F\u95F4\u3002" : "\u5728\u5206\u4EAB\u9762\u677F\u4E2D\u9009\u62E9\u5FAE\u4FE1\u6216\u5176\u4ED6\u5E94\u7528\u3002");
        } catch {
          this.notify("\u5206\u4EAB\u4E0D\u53EF\u7528\uFF0C\u53EF\u8BF7\u597D\u53CB\u8F93\u5165\u623F\u95F4\u7801\u3002");
        }
        return;
      }
    }
    async copyInvitation(code) {
      this.telemetry("invite_trigger");
      try {
        if (await this.platform.copy(this.platform.roomLink(code))) this.notify("\u623F\u95F4\u94FE\u63A5\u5DF2\u590D\u5236\uFF0C\u53D1\u9001\u7ED9\u597D\u53CB\u5373\u53EF\u52A0\u5165\u3002");
      } catch {
        this.notify("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u5206\u4EAB\u623F\u95F4\u7801\u3002");
      }
    }
    async join() {
      const code = await this.platform.prompt("\u8F93\u5165\u516D\u4F4D\u623F\u95F4\u7801", "", 6, true);
      if (code !== void 0) this.action({ type: "join", code: code.trim() });
    }
    async editAnswer() {
      const room = this.snapshot?.room;
      const roundId = room?.roundId;
      if (!roundId || !room.canAnswer) return;
      this.answerPromptRoundId = roundId;
      const value = await this.platform.prompt("\u586B\u5199\u4F60\u7684\u7B54\u6848\uFF08\u5230\u65F6\u81EA\u52A8\u63D0\u4EA4\uFF09", this.draft, 100, false, (value2) => this.updateDraft(roundId, value2));
      if (this.answerPromptRoundId === roundId) this.answerPromptRoundId = null;
      if (value !== void 0) this.updateDraft(roundId, value);
    }
    updateDraft(roundId, value) {
      const current2 = this.snapshot?.room;
      if (!current2 || roundId !== current2.roundId || current2.myAnswer !== null || !current2.canAnswer && current2.phase !== "paused") return;
      const answer = value.slice(0, 100).trim();
      if (answer === this.draft) return;
      this.draft = answer;
      this.draftRevision++;
      if (this.connection === "connected") this.action({ type: "draft", roundId, answer, revision: this.draftRevision });
      this.describe();
    }
    rect(x, y, width, height, color, border, radius = 8) {
      const ctx2 = this.platform.context;
      ctx2.beginPath();
      ctx2.moveTo(x + radius, y);
      ctx2.lineTo(x + width - radius, y);
      ctx2.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx2.lineTo(x + width, y + height - radius);
      ctx2.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx2.lineTo(x + radius, y + height);
      ctx2.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx2.lineTo(x, y + radius);
      ctx2.quadraticCurveTo(x, y, x + radius, y);
      ctx2.closePath();
      ctx2.fillStyle = color;
      ctx2.fill();
      if (border) {
        ctx2.strokeStyle = border;
        ctx2.lineWidth = 1;
        ctx2.stroke();
      }
    }
    text(value, x, y, size = 14, color = this.colors.ink, weight = 400, width = 327, lineHeight = size * 1.55) {
      const ctx2 = this.platform.context;
      ctx2.font = `${weight} ${size}px ${F}`;
      ctx2.fillStyle = color;
      ctx2.textBaseline = "top";
      const lines = this.wrap(value, width);
      lines.forEach((line, row) => ctx2.fillText(line, x, y + row * lineHeight));
      return y + lines.length * lineHeight;
    }
    wrap(value, width) {
      const ctx2 = this.platform.context;
      let line = "";
      const lines = [];
      for (const char of Array.from(value)) {
        if (char === "\n" || ctx2.measureText(line + char).width > width) {
          lines.push(line);
          line = char === "\n" ? "" : char;
        } else line += char;
      }
      lines.push(line);
      return lines;
    }
    button(id, label, x, y, width, height, press, style = "primary", disabled = false) {
      const enabled = !disabled && (this.connection === "connected" || !!this.tutorial || id === "tutorial" || id.startsWith("audio-"));
      const bg = style === "primary" ? enabled ? this.colors.ink : this.colors.disabled : style === "secondary" ? this.colors.paper : this.colors.bg;
      this.rect(x, y, width, height, bg, style === "secondary" ? this.colors.line : void 0, 6);
      const ctx2 = this.platform.context;
      ctx2.font = `600 15px ${F}`;
      const color = style === "primary" ? enabled ? this.colors.onPrimary : this.colors.onDisabled : enabled ? this.colors.ink : this.colors.muted;
      this.text(label, x + Math.max(12, (width - ctx2.measureText(label).width) / 2), y + (height - 18) / 2, 15, color, 600, width - 20, 18);
      const sound = id === "submit" || id === "tutorial-submit" ? "lock" : id === "tutorial-handoff" ? "stop" : "click";
      this.buttons.push({ id, label, x, y, width, height, disabled: !enabled, press: this.audible(press, sound) });
    }
    audible(press, sound = "click") {
      return () => {
        this.audio.unlock();
        this.audio.effect(sound);
        press();
      };
    }
    rememberResult(id) {
      this.soundedResults.add(id);
      if (this.soundedResults.size > 64) this.soundedResults.delete(this.soundedResults.values().next().value);
    }
    top() {
      this.text("\u63A5\u8C1C", 144, 48, 12, this.colors.muted, 600);
      const ctx2 = this.platform.context;
      ctx2.strokeStyle = this.colors.line;
      ctx2.beginPath();
      ctx2.moveTo(144, 68);
      ctx2.lineTo(351, 68);
      ctx2.stroke();
    }
    themeToggle() {
      const ctx2 = this.platform.context, x = 46, y = 58;
      ctx2.save();
      ctx2.beginPath();
      ctx2.arc(x, y, 22, 0, Math.PI * 2);
      ctx2.fillStyle = this.colors.paper;
      ctx2.fill();
      ctx2.strokeStyle = this.colors.line;
      ctx2.lineWidth = 1;
      ctx2.stroke();
      ctx2.strokeStyle = this.colors.ink;
      ctx2.fillStyle = this.colors.ink;
      ctx2.lineWidth = 1.8;
      if (this.colorMode === "dark") {
        ctx2.beginPath();
        ctx2.arc(x, y, 5, 0, Math.PI * 2);
        ctx2.stroke();
        ctx2.beginPath();
        for (let ray = 0; ray < 8; ray++) {
          const angle = ray * Math.PI / 4;
          ctx2.moveTo(x + Math.cos(angle) * 9, y + Math.sin(angle) * 9);
          ctx2.lineTo(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12);
        }
        ctx2.stroke();
      } else {
        ctx2.beginPath();
        ctx2.arc(x, y, 10, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = this.colors.paper;
        ctx2.beginPath();
        ctx2.arc(x + 5, y - 4, 9, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.restore();
      this.buttons.push({ id: "theme", label: this.colorMode === "dark" ? "\u5207\u6362\u4E3A\u6D45\u8272\u6A21\u5F0F" : "\u5207\u6362\u4E3A\u6DF1\u8272\u6A21\u5F0F", x: 24, y: 36, width: 44, height: 44, shape: "circle", press: this.audible(() => {
        this.colorMode = this.colorMode === "dark" ? "light" : "dark";
        this.colors = THEMES[this.colorMode];
        this.platform.applyTheme?.(this.colorMode);
        try {
          this.platform.set("theme", this.colorMode);
        } catch {
          this.notify("\u989C\u8272\u5DF2\u5207\u6362\uFF0C\u6682\u65F6\u65E0\u6CD5\u4FDD\u5B58\u504F\u597D\u3002");
        }
      }) });
    }
    audioSettings() {
      this.button("audio-open", "\u97F3", 84, 36, 44, 44, () => {
        this.audioSettingsOpen = true;
      }, "secondary");
      this.buttons[this.buttons.length - 1].label = "\u58F0\u97F3\u8BBE\u7F6E";
      if (!this.audioSettingsOpen) return;
      this.buttons = [];
      this.rect(0, 0, 375, 812, this.colors.bg);
      this.top();
      this.text("\u58F0\u97F3\u8BBE\u7F6E", 24, 120, 30, this.colors.ink, 700);
      this.text("\u53EA\u5F71\u54CD\u4F60\u7684\u8BBE\u5907\uFF0C\u97F3\u4E50\u4E0E\u97F3\u6548\u5206\u522B\u63A7\u5236\u3002", 24, 168, 13, this.colors.muted);
      const { music, effects } = this.audio.preferences;
      this.button("audio-music", `\u80CC\u666F\u97F3\u4E50 \xB7 ${music ? "\u5F00\u542F" : "\u5173\u95ED"}`, 24, 215, 327, 56, () => this.audio.setMusic(!this.audio.preferences.music), music ? "primary" : "secondary");
      this.buttons[this.buttons.length - 1].toggled = music;
      this.button("audio-effects", `\u64CD\u4F5C\u97F3\u6548 \xB7 ${effects ? "\u5F00\u542F" : "\u5173\u95ED"}`, 24, 293, 327, 56, () => {
        this.audio.setEffects(!this.audio.preferences.effects);
        if (this.audio.preferences.effects) this.audio.effect("click");
      }, effects ? "primary" : "secondary");
      this.buttons[this.buttons.length - 1].toggled = effects;
      this.text("\u6BD4\u8D5B\u4E0E\u6559\u5B66\u8BA1\u65F6\u4F1A\u7EE7\u7EED\u3002\n\u5207\u5230\u540E\u53F0\u65F6\u6682\u505C\u58F0\u97F3\u3002", 24, 370, 13, this.colors.muted, 400, 327, 22);
      this.text("\u97F3\u4E50\u7F72\u540D", 24, 447, 14, this.colors.ink, 600);
      this.text("\u201CJazz Brunch\u201D \u2014 Kevin MacLeod\nincompetech.com\nCreative Commons: By Attribution 4.0\nhttps://creativecommons.org/licenses/by/4.0/\n\u6E38\u620F\u526F\u672C\u538B\u7F29\u4E3A 64 kbps\uFF0C\u5B8C\u6574\u66F2\u76EE\u672A\u526A\u8F91\u3002", 24, 478, 12, this.colors.muted, 400, 327, 21);
      this.button("audio-credit", "\u590D\u5236\u97F3\u4E50\u7F72\u540D\u4E0E\u8BB8\u53EF\u94FE\u63A5", 24, 610, 327, 44, () => {
        void this.platform.copy(MUSIC_CREDIT).then((copied) => {
          if (copied) this.notify("\u97F3\u4E50\u7F72\u540D\u5DF2\u590D\u5236\u3002");
        }).catch(() => this.notify("\u6682\u65F6\u65E0\u6CD5\u590D\u5236\uFF0C\u8BF7\u67E5\u770B\u4E0A\u65B9\u7F72\u540D\u3002"));
      }, "secondary");
      this.button("audio-close", "\u8FD4\u56DE\u6E38\u620F", 24, 694, 327, 56, () => {
        this.audioSettingsOpen = false;
      });
      this.platform.describe?.(`\u58F0\u97F3\u8BBE\u7F6E\u3002\u80CC\u666F\u97F3\u4E50${music ? "\u5F00\u542F" : "\u5173\u95ED"}\uFF0C\u64CD\u4F5C\u97F3\u6548${effects ? "\u5F00\u542F" : "\u5173\u95ED"}\u3002\u6BD4\u8D5B\u4E0E\u6559\u5B66\u8BA1\u65F6\u7EE7\u7EED\u3002${MUSIC_CREDIT}`);
    }
    home() {
      this.text("\u63A5\u8C1C", 24, 220, 52, this.colors.ink, 700, 327, 66);
      this.text("\u5404\u770B\u4E00\u6BB5\uFF0C\u4E00\u8D77\u7B54\u5BF9\u3002", 26, 306, 18, this.colors.muted);
      this.button("create", "\u521B\u5EFA\u4E24\u4EBA\u623F\u95F4", 24, 446, 327, 56, () => this.action({ type: "create", difficulty: "easy" }));
      this.button("join", "\u7528\u623F\u95F4\u7801\u52A0\u5165", 24, 520, 327, 56, () => {
        void this.join();
      }, "secondary");
      this.button("tutorial", this.platform.get("tutorial.completed") === "true" ? "\u518D\u6B21\u5B66\u4E60\u73A9\u6CD5" : "\u5355\u4EBA\u5B66\u4E60\u73A9\u6CD5", 24, 592, 327, 44, () => this.startTutorial(), "bare");
      this.text(`\u4E24\u4EBA \xB7 ${this.snapshot?.rules.totalRounds ?? DEFAULT_RULES.totalRounds} \u9898 \xB7 \u6BCF\u9898\u6362\u68D2`, 26, 624, 12, this.colors.muted);
    }
    modeLabel(room) {
      return this.snapshot?.contentMode === "sample" ? "" : room.difficulty === "easy" ? "\u7B80\u5355" : "\u56F0\u96BE";
    }
    roomHeader(room) {
      const mode = this.modeLabel(room);
      this.text(`${mode ? mode + " / " : ""}\u7B2C ${room.roundNumber}/${room.totalRounds} \u9898`, 24, 94, 13, this.colors.muted, 500);
      this.text(room.length ? `${room.length} \u5B57` : "\u968F\u673A\u9898\u957F", 285, 94, 13, this.colors.muted, 500);
      const gap = room.totalRounds <= 20 ? 6 : 1;
      const width = (327 - (room.totalRounds - 1) * gap) / room.totalRounds;
      for (let i = 0; i < room.totalRounds; i++) this.rect(24 + i * (width + gap), 126, width, 4, i < room.completedRounds ? this.colors.ink : this.colors.line, void 0, 0);
    }
    lobby(room) {
      this.text(`\u623F\u95F4 ${room.code}`, 24, 102, 30, this.colors.ink, 600);
      this.text("\u53EB\u4E0A\u642D\u6863\uFF0C\u51C6\u5907\u5C31\u5F00\u573A\u3002", 24, 151, 14, this.colors.muted);
      if (this.platform.invite) this.button("share", this.platform.source === "wechat" ? "\u5FAE\u4FE1\u9080\u8BF7\u597D\u53CB" : "\u5FAE\u4FE1\u5206\u4EAB", 24, 192, 156, 48, () => {
        void this.shareInvitation(room.code);
      }, "secondary");
      this.button("copy", "\u590D\u5236\u623F\u95F4\u94FE\u63A5", this.platform.invite ? 195 : 24, 192, this.platform.invite ? 156 : 327, 48, () => {
        void this.copyInvitation(room.code);
      }, "secondary");
      for (let seat = 0; seat < 2; seat++) {
        const p = room.players[seat];
        const y = 270 + seat * 80;
        this.rect(24, y, 327, 68, seat === 0 ? this.colors.blue : this.colors.green);
        this.text(seat === 0 ? "A" : "B", 40, y + 19, 23, seat === 0 ? this.colors.blueInk : this.colors.greenInk, 700);
        const mine = p?.id === this.snapshot?.playerId;
        this.text(p ? this.short(p.name, 7) + (mine ? "\uFF08\u4F60\uFF09" : "") : "\u7B49\u5F85\u642D\u6863\u52A0\u5165", 84, y + 15, 15, this.colors.ink, 600, mine ? 160 : 240);
        this.text(p ? `\u672C\u9898\u7B2C ${p.readingOrder} \u68D2 \xB7 ${!p.connected ? "\u8FDE\u63A5\u4E2D\u65AD" : p.ready ? "\u5DF2\u51C6\u5907" : "\u672A\u51C6\u5907"}` : "\u70B9\u5F00\u9080\u8BF7\u94FE\u63A5\u5373\u53EF\u52A0\u5165", 84, y + 41, 11, this.colors.muted);
        if (mine) this.button("nickname", "\u6539\u6635\u79F0", 268, y + 8, 75, 44, () => {
          void this.editName();
        }, "secondary");
      }
      const me = room.players.find((p) => p.id === this.snapshot?.playerId);
      const host = room.hostId === this.snapshot?.playerId;
      const settings = host && room.completedRounds === 0 && !room.matchId;
      const difficulty = settings && this.snapshot?.contentMode !== "sample";
      if (settings) {
        this.text("\u5F00\u573A\u6211\u73A9", 24, 439, 12, this.colors.muted);
        for (const order of [1, 2]) this.button(
          `order-${order}`,
          `\u7B2C ${order} \u68D2${me.readingOrder === order ? " \xB7 \u5DF2\u9009" : ""}`,
          order === 1 ? 24 : 195,
          463,
          order === 1 ? 155 : 156,
          43,
          () => this.action({ type: "configure", firstReadingOrder: order }),
          me.readingOrder === order ? "primary" : "secondary"
        );
        if (difficulty) for (const level of ["easy", "hard"]) this.button(
          level,
          `${level === "easy" ? "\u7B80\u5355" : "\u56F0\u96BE"}${room.difficulty === level ? " \xB7 \u5DF2\u9009" : ""}`,
          level === "easy" ? 24 : 195,
          520,
          level === "easy" ? 155 : 156,
          40,
          () => this.action({ type: "configure", difficulty: level }),
          room.difficulty === level ? "primary" : "secondary"
        );
      } else this.text(room.completedRounds ? "\u6BCF\u9898\u8F6E\u6362\u68D2\u6B21\uFF0C\u51C6\u5907\u540E\u7EE7\u7EED\u3002" : "\u623F\u4E3B\u8BBE\u7F6E\u5F00\u573A\u68D2\u6B21\uFF0C\u4E4B\u540E\u6BCF\u9898\u8F6E\u6362\u3002", 24, 461, 13, this.colors.muted);
      const hasBanks = !!room.wordbankIds?.length;
      if (hasBanks) this.bankSummary(room, 521);
      const readyY = difficulty ? 579 : hasBanks ? 580 : 545;
      this.button("ready", me.ready ? "\u53D6\u6D88\u51C6\u5907" : "\u6211\u51C6\u5907\u597D\u4E86", 24, readyY, 327, 56, () => this.action({ type: "ready", ready: !me.ready }), me.ready ? "secondary" : "primary");
      if (host) this.button("start", `\u5F00\u59CB\u7B2C ${room.roundNumber} \u9898`, 24, readyY + 70, 327, 56, () => this.action({ type: "start" }), "primary", room.players.length !== 2 || room.players.some((p) => !p.ready || !p.connected));
      else this.text("\u51C6\u5907\u540E\uFF0C\u7B49\u5F85\u623F\u4E3B\u5F00\u59CB\u3002", 24, readyY + 86, 14, this.colors.muted);
      if (room.notice) this.text(room.notice, 24, 715, 12, this.colors.red, 400, 327, 18);
      this.button("leave", "\u9000\u51FA\u623F\u95F4", 24, 748, 327, 44, () => this.action({ type: "leave" }), "bare");
    }
    bankNames(ids) {
      return (this.snapshot?.wordbanks ?? []).filter((bank) => ids.includes(bank.id)).map((bank) => bank.name).join("\u3001");
    }
    canSelectBanks(room) {
      return room.hostId === this.snapshot?.playerId && (room.phase === "lobby" && !room.matchId || room.phase === "complete" && room.players.every((p) => !p.left));
    }
    bankSummary(room, y) {
      const editable = this.canSelectBanks(room);
      this.button("wordbanks-open", `${editable ? "\u52FE\u9009\u9898\u5E93" : "\u67E5\u770B\u9898\u5E93"} \xB7 ${room.wordbankIds?.length ?? 0}\u7C7B`, 24, y, 327, 44, () => {
        this.wordbankSelection = { roomId: room.roomId, ids: [...room.wordbankIds] };
      }, "secondary");
    }
    drawWordbanks(room) {
      const selection = this.wordbankSelection;
      const banks = this.snapshot?.wordbanks ?? [];
      const editable = this.canSelectBanks(room);
      this.buttons = [];
      this.rect(0, 84, 375, 728, this.colors.bg);
      this.text(editable ? "\u52FE\u9009\u9898\u5E93" : "\u672C\u573A\u9898\u5E93", 24, 110, 30, this.colors.ink, 700);
      this.text(editable ? "\u53EF\u591A\u9009\uFF0C\u9898\u76EE\u4ECE\u6240\u9009\u9898\u5E93\u6DF7\u5408\u62BD\u53D6\u3002" : "\u7531\u623F\u4E3B\u9009\u62E9\uFF0C\u5F00\u573A\u540E\u672C\u573A\u56FA\u5B9A\u3002", 24, 163, 14, this.colors.muted);
      for (let i = 0; i < banks.length; i++) {
        const bank = banks[i], checked = selection.ids.includes(bank.id);
        const x = 24 + i % 2 * 171, y = 210 + Math.floor(i / 2) * 72;
        this.button(`wordbank-${bank.id}`, `${checked ? "\u2713" : "\u25A1"} ${bank.name}`, x, y, 156, 52, () => {
          if (checked) selection.ids = selection.ids.filter((id) => id !== bank.id);
          else selection.ids.push(bank.id);
        }, checked ? "primary" : "secondary", !editable);
        const button = this.buttons.at(-1);
        button.role = "checkbox";
        button.toggled = checked;
      }
      if (editable) this.button("wordbanks-all", selection.ids.length === banks.length ? "\u53D6\u6D88\u5168\u9009" : "\u5168\u90E8\u52FE\u9009", 24, 514, 327, 40, () => {
        selection.ids = selection.ids.length === banks.length ? [] : banks.map((bank) => bank.id);
      }, "secondary");
      this.text(selection.ids.length ? `\u5DF2\u9009 ${selection.ids.length} \u7C7B\uFF1A${this.bankNames(selection.ids)}` : "\u8BF7\u81F3\u5C11\u52FE\u9009\u4E00\u4E2A\u9898\u5E93\u3002", 24, 584, 14, selection.ids.length ? this.colors.muted : this.colors.red, 400, 327, 24);
      this.text(editable ? "\u4FDD\u5B58\u66F4\u6539\u540E\uFF0C\u53CC\u65B9\u9700\u8981\u91CD\u65B0\u51C6\u5907\u3002" : "\u642D\u6863\u4E0E\u623F\u4E3B\u4F7F\u7528\u540C\u4E00\u7EC4\u9898\u5E93\u3002", 24, 642, 13, this.colors.muted);
      if (editable) this.button("wordbanks-save", "\u4FDD\u5B58\u9898\u5E93\u9009\u62E9", 24, 680, 327, 52, () => {
        this.action({ type: "configure", wordbankIds: banks.filter((bank) => selection.ids.includes(bank.id)).map((bank) => bank.id) });
        this.wordbankSelection = null;
      }, "primary", !selection.ids.length);
      this.button("wordbanks-close", editable ? "\u53D6\u6D88" : "\u8FD4\u56DE", 24, 748, 327, 44, () => {
        this.wordbankSelection = null;
      }, "bare");
    }
    drawQuestion(room, seat) {
      const ctx2 = this.platform.context;
      const { cells, pointer } = questionGrid(room);
      const color = seat === 0 ? this.colors.blueInk : this.colors.greenInk;
      for (const cell of cells) {
        const { x, y, size } = cell;
        if (cell.questionMark) {
          this.text("\uFF1F", x + 2, y + 1, 30, room.revealedCount >= room.length ? this.colors.ink : this.colors.muted, 600, size, size);
          continue;
        }
        ctx2.fillStyle = cell.unit ? seat === 0 ? this.colors.blue : this.colors.green : cell.revealed ? this.colors.gridRead : this.colors.paper;
        ctx2.fillRect(x, y, size, size);
        ctx2.strokeStyle = this.colors.gridBorder;
        ctx2.lineWidth = 1;
        ctx2.strokeRect(x, y, size, size);
        ctx2.save();
        ctx2.strokeStyle = this.colors.gridGuide;
        ctx2.setLineDash([2, 3]);
        ctx2.beginPath();
        ctx2.moveTo(x, y);
        ctx2.lineTo(x + size, y + size);
        ctx2.moveTo(x + size, y);
        ctx2.lineTo(x, y + size);
        ctx2.moveTo(x + size / 2, y);
        ctx2.lineTo(x + size / 2, y + size);
        ctx2.moveTo(x, y + size / 2);
        ctx2.lineTo(x + size, y + size / 2);
        ctx2.stroke();
        ctx2.restore();
        if (cell.unit) {
          const chars = Array.from(cell.unit);
          const core = chars.findIndex((char) => !/[\p{P}\s]/u.test(char));
          const before = chars.slice(0, core).join("").trim();
          const suffix = chars.slice(core + 1).join("").trim();
          const after = cell.index === room.length - 1 ? suffix.replace(/[？?]+$/u, "") : suffix;
          this.text(chars[core], x + 6, y + 4, 22, color, 600, size, 26);
          if (before) this.text(before, x + 1, y + 3, 8, color, 400, 12, 9);
          if (after) {
            ctx2.font = `400 8px ${F}`;
            ctx2.fillStyle = color;
            ctx2.textBaseline = "top";
            ctx2.fillText(after, x + size - 10, y + size - 12, 12);
          }
        }
      }
      const center = pointer.x + pointer.size / 2;
      ctx2.beginPath();
      ctx2.moveTo(center - 5, pointer.y - 12);
      ctx2.lineTo(center + 5, pointer.y - 12);
      ctx2.lineTo(center, pointer.y - 4);
      ctx2.closePath();
      ctx2.fillStyle = room.phase === "paused" ? this.colors.muted : room.activeSeat === 1 ? this.colors.greenInk : this.colors.blueInk;
      ctx2.fill();
    }
    play(room) {
      const me = room.players.find((p) => p.id === this.snapshot?.playerId);
      const paused = room.phase === "paused";
      const grid = questionGrid(room);
      const offset = grid.controlsOffset;
      const activeMe = room.activeSeat === me.seat && room.phase === "reading";
      const title = paused ? "\u7B49\u642D\u6863\u56DE\u6765" : activeMe ? me.readingOrder === 1 ? "\u4F60\u6765\u51B3\u5B9A\u4F55\u65F6\u505C" : "\u63A5\u4F4F\u5269\u4E0B\u7684\u7EBF\u7D22" : room.phase === "answering" ? "\u73B0\u5728\uFF0C\u4E00\u8D77\u4F5C\u7B54" : me.readingOrder === 1 ? "\u5DF2\u4EA4\u7ED9\u642D\u6863" : "\u7B49\u5F85\u7B2C\u4E00\u68D2\u4EA4\u63A5";
      this.text(title, 24, 166, 27, this.colors.ink, 700);
      this.text(`\u4F60\u672C\u9898\u7B2C ${me.readingOrder} \u68D2${room.sharedContext ? ` \xB7 ${room.sharedContext}` : ""}`, 24, 215, 12, this.colors.muted, 500, 327, 18);
      this.rect(24, grid.panelTop, 327, grid.bottom - grid.panelTop, this.colors.gridPanel);
      this.drawQuestion(room, me.seat);
      if (paused) this.text(`\u7B49\u5F85\u91CD\u8FDE \xB7 ${Math.max(0, Math.ceil(((room.resumeUntil ?? 0) - Date.now() - this.serverOffset) / 1e3))} \u79D2`, 24, 466 + offset, 14, this.colors.red, 500);
      else if (room.deadline) this.text(`\u4F5C\u7B54\u5012\u8BA1\u65F6 ${Math.max(0, Math.ceil((room.deadline - Date.now() - this.serverOffset) / 1e3))} \u79D2`, 24, 466 + offset, 14, this.colors.ink, 600);
      else this.text(room.phase === "reading" ? `\u5DF2\u8BFB ${room.revealedCount}/${room.length} \u5B57 \xB7 ${this.short(room.players.find((p) => p.seat === room.activeSeat)?.name ?? "", 8)} \u6B63\u5728\u63A5\u9898` : "", 24, 466 + offset, 13, this.colors.muted);
      if (me.readingOrder === 1 && activeMe) {
        this.stopButton(room, offset);
        this.text("\u81F3\u5C11\u8BFB\u4E00\u4E2A\u5B57\uFF0C\u7ED9\u7B2C\u4E8C\u68D2\u7559\u4E00\u4E2A\u5B57\u3002", 24, 645 + offset, 13, this.colors.muted);
      } else if (room.canAnswer && !paused) {
        this.button("input-answer", this.draft ? `\u7B54\u6848\uFF1A${this.short(this.draft, 15)}` : "\u70B9\u51FB\u586B\u5199\u4F60\u7684\u7B54\u6848", 24, 513 + offset, 327, 56, () => {
          void this.editAnswer();
        }, "secondary", this.submitPending);
        this.button("submit", this.submitPending ? "\u6B63\u5728\u63D0\u4EA4\u2026" : "\u63D0\u4EA4\u5E76\u9501\u5B9A\u7B54\u6848", 24, 586 + offset, 327, 56, () => {
          this.submitPending = true;
          this.action({ type: "answer", roundId: room.roundId, answer: this.draft });
        }, "primary", !this.draft || this.submitPending);
        this.text("\u63A5\u68D2\u540E\u5373\u53EF\u4F5C\u7B54\uFF1B\u5230\u65F6\u81EA\u52A8\u63D0\u4EA4\u5DF2\u586B\u5199\u7B54\u6848\u3002\n\u9501\u5B9A\u540E\u4E0D\u80FD\u4FEE\u6539\uFF0C\u7B54\u6848\u5230\u7ED3\u7B97\u65F6\u624D\u516C\u5F00\u3002", 24, 659 + offset, 12, this.colors.muted, 400, 327, 20);
      } else if (room.myAnswer !== null) {
        this.text(`\u4F60\u7684\u7B54\u6848\uFF1A${this.short(room.myAnswer, 23)}`, 24, 530 + offset, 22, this.colors.ink, 600, 327, 32);
        this.text("\u5DF2\u9501\u5B9A\u3002\u7B49\u5F85\u642D\u6863\u5B8C\u6210\u4F5C\u7B54\u3002", 24, 606 + offset, 14, this.colors.muted);
      } else this.text(paused ? "\u91CD\u8FDE\u540E\u4F1A\u4ECE\u4E2D\u65AD\u4F4D\u7F6E\u7EE7\u7EED\u3002" : "\u7B2C\u4E00\u68D2\u4EA4\u68D2\u540E\u3001\u7B2C\u4E8C\u68D2\u63A5\u68D2\u540E\u5373\u53EF\u4F5C\u7B54\u3002", 24, 540 + offset, 14, this.colors.muted);
      this.text(room.players.map((p) => `${p.seat === 0 ? "A" : "B"}\uFF1A${p.submitted ? "\u5DF2\u63D0\u4EA4" : "\u672A\u63D0\u4EA4"}`).join("        "), 24, 718 + offset, 12, this.colors.muted);
    }
    stopButton(room, offset) {
      const ctx2 = this.platform.context;
      const enabled = room.canHandoff && !this.handoffPending && this.connection === "connected";
      const pressed = enabled && this.stopPressed;
      const circle = (y, radius, color) => {
        ctx2.beginPath();
        ctx2.arc(187.5, y + offset, radius, 0, Math.PI * 2);
        ctx2.fillStyle = color;
        ctx2.fill();
      };
      circle(566, 61, this.colors.stopShell);
      circle(572, 52, enabled ? this.colors.stopBase : this.colors.stopDisabledBase);
      circle(pressed ? 571 : 566, pressed ? 48 : 52, enabled ? pressed ? this.colors.stopPressed : this.colors.stopFace : this.colors.stopDisabledFace);
      ctx2.font = `700 32px ${F}`;
      this.text("\u505C", 187.5 - ctx2.measureText("\u505C").width / 2, (pressed ? 551 : 546) + offset, 32, "#FFFFFF", 700, 70, 40);
      this.buttons.push({
        id: "handoff",
        label: "\u505C",
        x: 135.5,
        y: 514 + offset,
        width: 104,
        height: 104,
        shape: "circle",
        disabled: !enabled,
        setPressed: (value) => {
          this.stopPressed = value;
        },
        press: this.audible(() => {
          this.stopPressed = false;
          this.platform.feedback?.();
          this.handoffPending = true;
          this.action({ type: "handoff", roundId: room.roundId, lastIndex: room.myLastIndex });
        }, "stop")
      });
    }
    returning(code, until) {
      this.text("\u5DF2\u9000\u51FA\u623F\u95F4", 24, 173, 30, this.colors.ink, 700);
      this.text(`\u623F\u95F4 ${code}`, 24, 240, 18, this.colors.muted);
      this.text(`\u8FD8\u53EF\u8FD4\u56DE ${this.secondsUntil(until)} \u79D2`, 24, 301, 24, this.colors.red, 600);
      this.text("\u4F60\u7684\u642D\u6863\u6B63\u5728\u7B49\u5F85\u3002\n\u8FD4\u56DE\u540E\u53EF\u4EE5\u4ECE\u672C\u9898\u7ED3\u7B97\u7EE7\u7EED\u3002", 24, 363, 15, this.colors.muted, 400, 327, 25);
      this.button("return", "\u8FD4\u56DE\u623F\u95F4", 24, 466, 327, 56, () => this.action({ type: "return" }), "primary", this.secondsUntil(until) === 0);
      this.text("\u5012\u8BA1\u65F6\u7ED3\u675F\u6216\u4E24\u4EBA\u5747\u9000\u51FA\uFF0C\u6E38\u620F\u505C\u6B62\u3002", 24, 553, 13, this.colors.muted);
    }
    secondsUntil(until) {
      return Math.max(0, Math.ceil((until - Date.now() - this.serverOffset) / 1e3));
    }
    result(room) {
      if (room.phase === "complete") {
        this.complete(room);
        return;
      }
      const result = room.result;
      this.text(result.success ? "\u4E24\u4E2A\u4EBA\uFF0C\u90FD\u7B54\u5BF9\u4E86\u3002" : "\u8FD9\u6B21\u8FD8\u5DEE\u4E00\u70B9\u3002", 24, 162, 26, this.colors.ink, 700);
      this.text(`\u5DF2\u7ED3\u7B97 ${room.completedRounds}/${room.totalRounds} \u9898 \xB7 \u4E00\u8D77\u7B54\u5BF9 ${room.successRounds} \u9898${result.timedOut ? " \xB7 \u672C\u9898\u8D85\u65F6" : ""}`, 24, 208, 12, this.colors.muted);
      this.text("\u5B8C\u6574\u9898\u76EE", 24, 248, 11, this.colors.muted);
      const promptEnd = this.text(`${result.sharedContext ? result.sharedContext + "\uFF1A" : ""}${result.prompt}`, 24, 274, 21, this.colors.ink, 600, 327, 30);
      const answerY = Math.max(359, promptEnd + 14);
      this.text(`\u6807\u51C6\u7B54\u6848\uFF1A${result.answer}`, 24, answerY, 15, this.colors.ink, 600);
      let nextY = answerY + 42;
      result.players.forEach((p, i) => {
        this.platform.context.font = `400 15px ${F}`;
        const height = Math.max(97, 54 + this.wrap(p.fragment || "\u672A\u63A5\u6536\u5230\u6587\u5B57", 295).length * 22);
        const y = nextY;
        nextY += height + 16;
        this.rect(24, y, 327, height, i === 0 ? this.colors.blue : this.colors.green);
        this.text(`\u7B2C ${p.readingOrder} \u68D2 / ${this.short(p.name, 8)}`, 39, y + 12, 12, this.colors.ink, 600, 175);
        this.text(`${this.short(p.answer ?? "\u672A\u4F5C\u7B54", p.autoSubmitted ? 4 : 6)} \xB7 ${p.correct ? "\u6B63\u786E" : "\u9519\u8BEF"}${p.autoSubmitted ? "\xB7\u81EA\u52A8" : ""}`, 210, y + 12, 12, p.correct ? this.colors.greenInk : this.colors.red, 600, 126);
        this.text(p.fragment || "\u672A\u63A5\u6536\u5230\u6587\u5B57", 39, y + 40, 15, this.colors.ink, 400, 295, 22);
      });
      const controlsY = Math.max(655, nextY + 28);
      if (room.returnUntil) this.text(`\u7B49\u5F85\u642D\u6863\u8FD4\u56DE \xB7 ${this.secondsUntil(room.returnUntil)} \u79D2`, 24, controlsY - 26, 13, this.colors.red, 600);
      this.text(room.nextRoundAt ? `${this.secondsUntil(room.nextRoundAt)} \u79D2\u540E\u81EA\u52A8\u8FDB\u5165\u7B2C ${room.completedRounds + 1} \u9898` : "\u7B49\u5F85\u642D\u6863\u5728\u7EBF\u5E76\u8FD4\u56DE\uFF0C\u5012\u8BA1\u65F6\u6682\u505C\u3002", 24, controlsY + 5, 17, this.colors.ink, 600);
      this.text("\u4E0B\u4E00\u9898\u8F6E\u6362\u68D2\u6B21\u3002", 24, controlsY + 35, 12, this.colors.muted);
    }
    newId() {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    flushEvents() {
      if (this.eventTimer || this.connection !== "connected" || !this.pendingEvents.length) return;
      this.action(this.pendingEvents[0]);
      this.eventTimer = setTimeout(() => {
        this.eventTimer = null;
        this.flushEvents();
      }, 150);
    }
    telemetry(event, runId) {
      const value = { type: "event", event, eventId: (runId ?? this.newId()) + "-" + event, source: this.platform.source ?? "browser", ...event === "invite_trigger" ? { roomCode: this.snapshot?.room?.code } : {} };
      this.pendingEvents.push(value);
      this.pendingEvents = this.pendingEvents.slice(-100);
      this.platform.set("events", JSON.stringify(this.pendingEvents));
      this.flushEvents();
    }
    startTutorial() {
      if (this.invitedRoom || this.snapshot?.room || this.snapshot?.returnRoom) return;
      this.tutorial = new Tutorial(Date.now(), () => {
        this.platform.set("tutorial.completed", "true");
        if (this.tutorial) this.telemetry("tutorial_complete", this.tutorial.id);
      });
      this.telemetry("tutorial_start", this.tutorial.id);
    }
    describeTutorial() {
      const t = this.tutorial;
      this.platform.describe?.(`\u6559\u5B66\u72B6\u6001\uFF1A${t.phase}\u3002\u4F60\uFF1A\u7B2C\u4E00\u68D2\uFF1B\u6A21\u62DF\u642D\u6863\uFF1A\u7B2C\u4E8C\u68D2\u3002\u5DF2\u8BFB ${t.count}/${t.units.length} \u5B57\u3002\u4F60\u7684\u7247\u6BB5\uFF1A${t.fragment}\u3002${t.notice}\u3002${t.answer !== null ? "\u4F60\u7684\u7B54\u6848\u5DF2\u9501\u5B9A\u3002" : ""}${t.phase === "result" ? `\u5B8C\u6574\u9898\u76EE\uFF1A${TUTORIAL_PROMPT} \u6807\u51C6\u7B54\u6848\uFF1A\u9A86\u9A7C\u3002\u642D\u6863\u7247\u6BB5\uFF1A${t.partnerFragment}\u3002\u6A21\u62DF\u642D\u6863\u7B54\u6848\uFF1A\u9A86\u9A7C\u3002` : "\u7ED3\u7B97\u524D\u770B\u4E0D\u5230\u5BF9\u65B9\u7247\u6BB5\u548C\u7B54\u6848\u3002"}`);
    }
    drawTutorial() {
      const t = this.tutorial, previous = t.phase;
      t.tick(Date.now());
      this.describeTutorial();
      if (previous === "answer" && t.phase === "partner") this.audio.effect("lock");
      if (t.phase === "result" && !this.soundedResults.has(t.id)) {
        this.rememberResult(t.id);
        this.audio.effect(t.success ? "success" : "failure");
      }
      this.top();
      this.text("\u5355\u4EBA\u4EA4\u4E92\u6559\u5B66", 24, 100, 30, this.colors.ink, 700);
      this.text("\u4F60 / \u7B2C\u4E00\u68D2     \u6A21\u62DF\u642D\u6863 / \u7B2C\u4E8C\u68D2", 24, 151, 14, this.colors.muted);
      this.text(t.notice, 24, 198, 18, this.colors.ink, 600, 327, 29);
      this.rect(24, 306, 327, 125, this.colors.blue);
      this.text(t.fragment || "\u7B49\u5F85\u7B2C\u4E00\u4E2A\u5B57\u2026", 40, 332, 26, this.colors.blueInk, 600, 295, 36);
      this.text(`\u9010\u5B57\u8BFB\u9898 ${t.count}/${t.units.length} \xB7 ${t.phase === "result" ? "\u63ED\u6653" : Math.max(0, Math.ceil((t.deadline - Date.now()) / 1e3)) + " \u79D2"}`, 24, 449, 13, this.colors.muted);
      if (t.phase === "first") this.button("tutorial-handoff", "\u4EA4\u68D2\u7ED9\u6A21\u62DF\u642D\u6863", 24, 490, 327, 56, () => t.handoff(Date.now()));
      else if (t.phase === "answer") {
        this.button("tutorial-input", t.draft ? `\u7B54\u6848\uFF1A${this.short(t.draft, 15)}` : "\u586B\u5199\u6559\u5B66\u7B54\u6848", 24, 490, 327, 56, () => {
          this.tutorialPrompt = t;
          const changed = (v) => {
            if (this.tutorial === t && t.phase === "answer") t.draft = v.slice(0, 100).trim();
          };
          void this.platform.prompt("\u586B\u5199\u6559\u5B66\u7B54\u6848\uFF08\u5230\u65F6\u81EA\u52A8\u63D0\u4EA4\uFF09", t.draft, 100, false, changed).then((v) => {
            if (v !== void 0) changed(v);
            if (this.tutorialPrompt === t) this.tutorialPrompt = null;
          });
        }, "secondary");
        this.button("tutorial-submit", "\u63D0\u4EA4\u5E76\u9501\u5B9A\u6559\u5B66\u7B54\u6848", 24, 560, 327, 56, () => t.submit(Date.now()), "primary", !t.draft);
      } else if (t.phase === "partner") {
        this.text(`\u4F60\u7684\u7B54\u6848\uFF1A${this.short(t.answer ?? "", 15)} \xB7 \u5DF2\u9501\u5B9A`, 24, 493, 20, this.colors.ink, 600);
        this.text("\u7B2C\u4E8C\u68D2\u63A5\u68D2\u540E\u5C31\u80FD\u4F5C\u7B54\uFF0C\u65E0\u9700\u7B49\u8BFB\u5B8C\u3002\n\u7ED3\u7B97\u524D\uFF0C\u770B\u4E0D\u5230\u5BF9\u65B9\u7247\u6BB5\u548C\u7B54\u6848\u3002", 24, 542, 15, this.colors.muted, 400, 327, 27);
        this.text(`\u6A21\u62DF\u642D\u6863\u5DF2\u8BFB ${Math.max(0, t.count - 7)}/${t.units.length - 7} \u5B57`, 24, 612, 14, this.colors.greenInk, 600);
      } else {
        this.text(`\u5B8C\u6574\u9898\u76EE\uFF1A${TUTORIAL_PROMPT}
\u6807\u51C6\u7B54\u6848\uFF1A\u9A86\u9A7C \xB7 \u6A21\u62DF\u642D\u6863\u7B54\u6848\uFF1A\u9A86\u9A7C`, 24, 480, 15, this.colors.ink, 400, 327, 25);
        this.button("tutorial-retry", "\u91CD\u8BD5\u6559\u5B66", 24, 600, 155, 48, () => this.startTutorial(), "secondary");
        this.button("tutorial-done", "\u8FD4\u56DE\u9996\u9875", 195, 600, 156, 48, () => {
          if (!t.success) this.telemetry("tutorial_skip", t.id);
          this.tutorial = null;
        }, "primary");
      }
      if (!t.success) this.button("tutorial-skip", "\u8DF3\u8FC7\u6559\u5B66", 24, 698, 155, 44, () => {
        this.telemetry("tutorial_skip", t.id);
        this.tutorial = null;
      }, "bare");
      this.button("tutorial-exit", "\u9000\u51FA\u6559\u5B66", 195, 698, 156, 44, () => {
        if (!t.success) this.telemetry("tutorial_skip", t.id);
        this.tutorial = null;
      }, "bare");
    }
    complete(room) {
      this.text(`\u4E00\u8D77\u7B54\u5BF9 ${room.successRounds}/${room.totalRounds} \u9898\u3002`, 24, 164, 28, this.colors.ink, 700);
      const results = room.history;
      this.historyPage = Math.min(this.historyPage, Math.max(0, results.length - 1));
      const r = results[this.historyPage] ?? room.result;
      this.text(results.map((x) => `${x.roundNumber}${x.success ? "\u2713" : "\xD7"}`).join("   "), 24, 212, 18, this.colors.muted);
      this.text(`\u7B2C ${r.roundNumber} \u9898\u5B8C\u6574\u6210\u7EE9`, 24, 262, 14, this.colors.muted);
      this.text(`${r.sharedContext ? r.sharedContext + "\uFF1A" : ""}${r.prompt}`, 24, 297, 20, this.colors.ink, 600, 327, 29);
      this.text(`\u6807\u51C6\u7B54\u6848\uFF1A${r.answer}`, 24, 402, 15, this.colors.ink, 600);
      this.text(r.players.map((p) => `${this.short(p.name, 7)} / \u7B2C${p.readingOrder}\u68D2\uFF1A${this.short(p.answer ?? "\u672A\u7B54", 12)} \xB7 ${p.correct ? "\u6B63\u786E" : "\u9519\u8BEF"}${p.autoSubmitted ? " \xB7 \u81EA\u52A8\u63D0\u4EA4" : ""}
\u7247\u6BB5\uFF1A${p.fragment}`).join("\n"), 24, 438, 13, this.colors.muted, 400, 327, 20);
      const hasBanks = !!room.wordbankIds?.length;
      this.button("history-prev", "\u4E0A\u4E00\u9898\u6210\u7EE9", 24, 565, hasBanks ? 105 : 155, 38, () => {
        this.historyPage--;
      }, "secondary", this.historyPage === 0);
      this.button("history-next", "\u4E0B\u4E00\u9898\u6210\u7EE9", hasBanks ? 135 : 195, 565, hasBanks ? 105 : 156, 38, () => {
        this.historyPage++;
      }, "secondary", this.historyPage >= results.length - 1);
      if (hasBanks) this.button("wordbanks-open", this.canSelectBanks(room) ? "\u52FE\u9009\u9898\u5E93" : "\u67E5\u770B\u9898\u5E93", 246, 565, 105, 38, () => {
        this.wordbankSelection = { roomId: room.roomId, ids: [...room.wordbankIds] };
      }, "secondary");
      const me = room.players.find((p) => p.id === this.snapshot?.playerId);
      this.text(room.notice || room.players.map((p) => `${this.short(p.name, 6)}\uFF1A${p.left ? "\u5DF2\u9000\u51FA" : !p.connected ? "\u65AD\u7EBF" : p.ready ? "\u5DF2\u51C6\u5907" : "\u672A\u51C6\u5907"}`).join(" / "), 24, 616, 12, room.notice ? this.colors.red : this.colors.muted, 400, 327, 18);
      this.button("rematch", me.ready ? "\u53D6\u6D88\u51C6\u5907" : "\u51C6\u5907\u518D\u6765\u4E00\u573A", 24, 669, 327, 52, () => this.action({ type: "rematch", ready: !me.ready, matchId: room.matchId }), me.ready ? "secondary" : "primary", room.players.some((p) => p.left));
      this.button("finish", "\u9000\u51FA\u623F\u95F4", 24, 741, 327, 44, () => this.action({ type: "leave" }), "bare");
    }
    short(value, limit) {
      const chars = Array.from(value);
      return chars.length > limit ? chars.slice(0, limit).join("") + "\u2026" : value;
    }
  };

  // src/client/endpoint.ts
  function serverOrigin(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim());
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) return null;
      if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
      return url.origin;
    } catch {
      return null;
    }
  }

  // src/client/invitation.ts
  function invitationCode(search) {
    const code = new URLSearchParams(search).get("room");
    return code && /^\d{6}$/.test(code) ? code : void 0;
  }
  function roomInvitation(pageUrl, code) {
    const url = new URL(pageUrl);
    url.search = "";
    url.hash = "";
    url.searchParams.set("room", code);
    return url.href;
  }

  // src/client/browser-share.ts
  function shareRoomLink(host, url, code) {
    const guidance = () => host.guide(url).then(() => "guidance");
    if (!host.share) return guidance();
    try {
      return host.share({ title: "\u63A5\u8C1C\uFF5C\u5404\u770B\u4E00\u6BB5\uFF0C\u4E00\u8D77\u7B54\u5BF9", text: `\u6765\u505A\u6211\u7684\u642D\u6863\uFF01\u623F\u95F4 ${code}\uFF0C\u70B9\u5F00\u94FE\u63A5\u5373\u53EF\u52A0\u5165\u3002`, url }).then(
        () => "system-requested",
        (error) => error && typeof error === "object" && "name" in error && error.name === "AbortError" ? "cancelled" : guidance()
      );
    } catch {
      return guidance();
    }
  }

  // src/client/browser-audio.ts
  function browserAudio() {
    let music, effect;
    let report;
    const failed = /* @__PURE__ */ new Set();
    const error = (source) => {
      if (failed.has(source)) return;
      failed.add(source);
      console.warn("[\u63A5\u8C1C\u58F0\u97F3] playback-unavailable");
      report?.();
    };
    const voice = (source, loop, volume) => {
      const audio = new Audio(new URL("./" + source, location.href).href);
      audio.loop = loop;
      audio.volume = volume;
      audio.preload = "auto";
      audio.addEventListener("error", () => error(source));
      return audio;
    };
    const play = (audio) => {
      void audio.play().catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        error(audio.src);
      });
    };
    return {
      onError(callback) {
        report = callback;
      },
      resumeMusic() {
        music ?? (music = voice(MUSIC_PATH, true, 0.22));
        if (music.paused) play(music);
      },
      pauseMusic() {
        music?.pause();
      },
      playEffect(sound) {
        effect ?? (effect = voice(SOUND_PATHS[sound], false, 0.65));
        effect.pause();
        const source = new URL("./" + SOUND_PATHS[sound], location.href).href;
        if (effect.src !== source) effect.src = source;
        else effect.currentTime = 0;
        play(effect);
      },
      stopEffects() {
        effect?.pause();
      }
    };
  }

  // src/client/browser.ts
  var canvas = document.querySelector("#game");
  var controls = document.querySelector("#controls");
  var ctx = canvas.getContext("2d");
  var identity = new URLSearchParams(location.search).get("player") || "default";
  var key = (name) => `partition-quiz.${identity}.${name}`;
  var panel = document.querySelector("#connection-panel");
  var connectionMessage = document.querySelector("#connection-message");
  var endpointKey = "partition-quiz.server-origin";
  var base = "";
  var endpoint = (async () => {
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
    base = serverOrigin(localStorage.getItem(endpointKey)) || "";
    if (!base) {
      try {
        const response = await fetch(new URL("./server-config.json", location.href), { cache: "no-store" });
        if (response.ok) {
          const config = await response.json();
          base = serverOrigin(config.serverUrl) || (config.sameOrigin === true ? location.origin : "");
        }
      } catch {
      }
    }
    if (!base && local) base = location.origin;
    if (!base) showConnection("\u8054\u673A\u670D\u52A1\u5668\u5C1A\u672A\u5F00\u901A\u3002\u7F51\u9875\u5DF2\u53D1\u5E03\uFF0C\u670D\u52A1\u5668\u4E0A\u7EBF\u540E\u5373\u53EF\u521B\u5EFA\u623F\u95F4\u3002");
    return base;
  })();
  function showConnection(message) {
    connectionMessage.textContent = message;
    panel.hidden = false;
  }
  var dpr = Math.min(devicePixelRatio || 1, 3);
  canvas.width = 375 * dpr;
  canvas.height = 812 * dpr;
  var signatures = "";
  var current = /* @__PURE__ */ new Map();
  var sharing = false;
  function shareGuidance(link) {
    const dialog = document.querySelector("#share-dialog");
    const input = document.querySelector("#share-link");
    const help = document.querySelector("#share-help");
    const feedback = document.querySelector("#share-feedback");
    const copy = document.querySelector("#share-copy");
    const close = document.querySelector("#share-close");
    const inWechat = /MicroMessenger/i.test(navigator.userAgent);
    help.textContent = inWechat ? "\u70B9\u51FB\u5FAE\u4FE1\u53F3\u4E0A\u89D2\u201C\u2026\u201D \u2192 \u53D1\u9001\u7ED9\u670B\u53CB\u3002\u8F6C\u53D1\u5F53\u524D\u9875\u9762\u5373\u53EF\u9080\u8BF7\u597D\u53CB\u8FDB\u623F\u3002" : "\u5728\u624B\u673A\u5FAE\u4FE1\u4E2D\u6253\u5F00\u6B64\u94FE\u63A5\uFF0C\u518D\u70B9\u53F3\u4E0A\u89D2\u201C\u2026\u201D\u53D1\u9001\u7ED9\u670B\u53CB\uFF1B\u4E5F\u53EF\u4EE5\u590D\u5236\u94FE\u63A5\u53D1\u5230\u5FAE\u4FE1\u3002";
    input.value = link;
    feedback.textContent = "";
    const original = location.href;
    history.replaceState(null, "", link);
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        copy.removeEventListener("click", copyLink);
        close.removeEventListener("click", dismiss);
        dialog.removeEventListener("close", done);
        if (location.href === link) history.replaceState(null, "", original);
      };
      const done = () => {
        cleanup();
        resolve();
      };
      const dismiss = () => dialog.close();
      const copyLink = async () => {
        try {
          await navigator.clipboard.writeText(link);
          feedback.textContent = "\u94FE\u63A5\u5DF2\u590D\u5236\uFF0C\u53D1\u7ED9\u597D\u53CB\u5373\u53EF\u52A0\u5165\u3002";
        } catch {
          input.focus();
          input.select();
          feedback.textContent = "\u8BF7\u957F\u6309\u94FE\u63A5\u6216\u6309 Ctrl+C \u590D\u5236\u3002";
        }
      };
      copy.addEventListener("click", copyLink);
      close.addEventListener("click", dismiss);
      dialog.addEventListener("close", done, { once: true });
      try {
        dialog.showModal();
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }
  var cancelPrompt;
  function promptInput(title, value, maxLength, numeric = false, onChange) {
    cancelPrompt?.();
    return new Promise((resolve) => {
      const dialog = document.querySelector("#input-dialog");
      const label = document.querySelector("#input-label");
      const input = document.querySelector("#input-value");
      const form = dialog.querySelector("form");
      const cancel = document.querySelector("#input-cancel");
      label.textContent = title;
      input.value = value;
      input.maxLength = maxLength;
      input.inputMode = numeric ? "numeric" : "text";
      input.setAttribute("aria-label", title);
      let finished = false;
      const changed = () => onChange?.(input.value);
      const done = (result) => {
        if (finished) return;
        finished = true;
        cancelPrompt = void 0;
        input.removeEventListener("input", changed);
        form.removeEventListener("submit", submit);
        cancel.removeEventListener("click", dismiss);
        dialog.removeEventListener("cancel", dismiss);
        dialog.close();
        resolve(result);
      };
      const submit = (event) => {
        event.preventDefault();
        done(input.value);
      };
      const dismiss = (event) => {
        event.preventDefault();
        done(void 0);
      };
      cancelPrompt = () => done(void 0);
      input.addEventListener("input", changed);
      form.addEventListener("submit", submit);
      cancel.addEventListener("click", dismiss);
      dialog.addEventListener("cancel", dismiss);
      dialog.showModal();
      input.focus();
      input.select();
    });
  }
  var platform = {
    context: ctx,
    source: "browser",
    audio: browserAudio(),
    onAudioVisibility(callback) {
      callback(!document.hidden);
      document.addEventListener("visibilitychange", () => callback(!document.hidden));
    },
    describe(text) {
      document.querySelector("#game-status").textContent = text;
    },
    beginFrame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    applyTheme(mode) {
      document.documentElement.dataset.theme = mode;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mode === "dark" ? "#141C19" : "#F7F6F3");
    },
    frame(callback) {
      requestAnimationFrame(callback);
    },
    syncButtons(buttons) {
      current = new Map(buttons.map((button) => [button.id, button]));
      const next = buttons.map((b) => `${b.id}:${b.label}:${b.disabled}:${b.toggled}:${b.shape ?? ""}`).join("|");
      if (next === signatures) return;
      signatures = next;
      controls.replaceChildren();
      for (const b of buttons) {
        const button = document.createElement("button");
        button.textContent = b.label;
        button.setAttribute("aria-label", b.label);
        button.disabled = !!b.disabled;
        if (b.toggled !== void 0) button.setAttribute("aria-pressed", String(b.toggled));
        if (b.role === "checkbox") {
          button.setAttribute("role", "checkbox");
          button.setAttribute("aria-checked", String(b.toggled));
        }
        button.style.left = `${b.x / 375 * 100}%`;
        button.style.top = `${b.y / 812 * 100}%`;
        button.style.width = `${b.width / 375 * 100}%`;
        button.style.height = `${b.height / 812 * 100}%`;
        if (b.shape === "circle") {
          button.style.borderRadius = "50%";
          button.style.clipPath = "circle(50%)";
          button.style.touchAction = "none";
          const pressed = (value) => current.get(b.id)?.setPressed?.(value);
          button.addEventListener("pointerdown", () => {
            if (!button.disabled) pressed(true);
          });
          for (const event of ["pointerup", "pointercancel", "pointerleave", "blur"]) button.addEventListener(event, () => pressed(false));
          button.addEventListener("keydown", (event) => {
            if (event.key === " " || event.key === "Enter") pressed(true);
          });
          button.addEventListener("keyup", () => pressed(false));
        }
        button.addEventListener("click", () => {
          const latest = current.get(b.id);
          if (latest && !latest.disabled) latest.press();
        });
        controls.append(button);
      }
    },
    get(name) {
      const value = localStorage.getItem(key(name)) ?? sessionStorage.getItem(key(name));
      if (value !== null) localStorage.setItem(key(name), value);
      return value;
    },
    set(name, value) {
      localStorage.setItem(key(name), value);
    },
    async session(token, name) {
      const origin = await endpoint;
      if (!origin) throw new Error("\u8054\u673A\u670D\u52A1\u5668\u5C1A\u672A\u914D\u7F6E");
      try {
        const response = await fetch(origin + "/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", body: JSON.stringify({ token, name }) });
        if (!response.ok) throw new Error("\u8FDE\u63A5\u5931\u8D25");
        const result = await response.json();
        panel.hidden = true;
        return result;
      } catch (error) {
        showConnection("\u6682\u65F6\u65E0\u6CD5\u8FDE\u63A5\u8054\u673A\u670D\u52A1\u5668\u3002\u514D\u8D39\u8BD5\u73A9\u670D\u52A1\u5668\u9996\u6B21\u5524\u9192\u53EF\u80FD\u9700\u8981\u7EA6\u4E00\u5206\u949F\uFF0C\u8BF7\u7A0D\u5019\u3002");
        throw error;
      }
    },
    connect(token, handlers) {
      const ws = new WebSocket(`${base.replace(/^http/, "ws")}/socket?token=${encodeURIComponent(token)}`);
      ws.addEventListener("open", handlers.open);
      ws.addEventListener("message", (event) => handlers.message(String(event.data)));
      ws.addEventListener("close", (event) => handlers.close(event.code));
      return { send(text) {
        if (ws.readyState === WebSocket.OPEN) ws.send(text);
      }, close() {
        ws.close();
      } };
    },
    prompt: promptInput,
    cancelPrompt() {
      cancelPrompt?.();
    },
    invite(code) {
      if (sharing) return Promise.resolve("cancelled");
      sharing = true;
      try {
        return shareRoomLink({ share: navigator.share ? (data) => navigator.share(data) : void 0, guide: shareGuidance }, roomInvitation(location.href, code), code).finally(() => {
          sharing = false;
        });
      } catch (error) {
        sharing = false;
        throw error;
      }
    },
    async copy(text) {
      try {
        if (!navigator.clipboard) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        await promptInput("\u590D\u5236\u9080\u8BF7\u94FE\u63A5\uFF08\u957F\u6309\u6216 Ctrl+C\uFF09", text, 2048);
        return false;
      }
    },
    roomLink(code) {
      return roomInvitation(location.href, code);
    },
    inviteCode: invitationCode(location.search),
    clearInvite() {
      const url = new URL(location.href);
      url.searchParams.delete("room");
      history.replaceState(null, "", url);
    },
    feedback() {
      try {
        navigator.vibrate?.(15);
      } catch {
      }
    }
  };
  document.querySelector("#configure-server").addEventListener("click", async () => {
    const value = await promptInput("\u8054\u673A\u670D\u52A1\u5668 HTTPS \u5730\u5740", base, 200);
    if (value === void 0) return;
    if (!value.trim()) {
      localStorage.removeItem(endpointKey);
      location.reload();
      return;
    }
    const origin = serverOrigin(value);
    if (!origin || location.protocol === "https:" && !origin.startsWith("https:")) {
      showConnection("\u8BF7\u8F93\u5165 HTTPS \u670D\u52A1\u5668\u6839\u5730\u5740\uFF0C\u4F8B\u5982 https://example.onrender.com");
      return;
    }
    localStorage.setItem(endpointKey, origin);
    location.reload();
  });
  new GameApp(platform);
})();
