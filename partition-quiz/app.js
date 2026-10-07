"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
  var __publicField = (obj, key2, value) => __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);

  // src/client/app.ts
  var C = { bg: "#F7F6F3", paper: "#FFFFFF", ink: "#242C2A", muted: "#717973", line: "#E5E6DF", blue: "#DFEEF5", blueInk: "#316B89", green: "#E8EFE1", greenInk: "#4D6E42", red: "#A24A40", redBg: "#F7E7E2" };
  var F = '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  var GameApp = class {
    constructor(platform2) {
      __publicField(this, "platform", platform2);
      __publicField(this, "snapshot", null);
      __publicField(this, "socket", null);
      __publicField(this, "buttons", []);
      __publicField(this, "connection", "connecting");
      __publicField(this, "status", "");
      __publicField(this, "statusUntil", 0);
      __publicField(this, "difficulty", "easy");
      __publicField(this, "draft", "");
      __publicField(this, "name");
      __publicField(this, "handoffPending", false);
      __publicField(this, "submitPending", false);
      __publicField(this, "requestSequence", 0);
      __publicField(this, "serverOffset", 0);
      __publicField(this, "connecting", false);
      __publicField(this, "reconnectTimer", null);
      __publicField(this, "paint", () => {
        this.platform.beginFrame();
        this.buttons = [];
        const ctx2 = this.platform.context;
        ctx2.fillStyle = C.bg;
        ctx2.fillRect(0, 0, 375, 812);
        this.top();
        const room = this.snapshot?.room;
        if (!room) this.home();
        else {
          this.roomHeader(room);
          if (room.phase === "lobby") this.lobby(room);
          else if (room.phase === "result" || room.phase === "complete") this.result(room);
          else if (room.phase === "exhausted") {
            this.text("\u8FD9\u4E00\u6863\uFF0C\u9898\u76EE\u7528\u5B8C\u4E86\u3002", 24, 170, 26, C.ink, 700);
            this.text(room.notice, 24, 242, 16, C.muted, 400, 327, 27);
            this.button("end-exhausted", "\u9000\u51FA\u623F\u95F4", 24, 410, 327, 56, () => this.action({ type: "leave" }));
          } else this.play(room);
          if (room.phase !== "complete") this.button("leave", room.hostId === this.snapshot?.playerId ? "\u7ED3\u675F\u623F\u95F4" : "\u9000\u51FA\u623F\u95F4", 24, 758, 327, 38, () => this.action({ type: "leave" }), "bare");
        }
        const info = this.connection !== "connected" ? this.connection === "connecting" ? "\u6B63\u5728\u8FDE\u63A5\u623F\u95F4\u670D\u52A1\u5668\u2026" : "\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u6B63\u5728\u91CD\u8FDE\u2026" : this.statusUntil > Date.now() ? this.status : "";
        if (info) {
          this.rect(16, 5, 343, 29, C.ink, void 0, 4);
          this.text(info, 25, 12, 11, C.paper, 500, 325, 15);
        }
        this.platform.syncButtons(this.buttons);
        this.platform.frame(this.paint);
      });
      this.name = platform2.get("name") || "";
      void this.connect();
      this.paint();
    }
    async connect() {
      if (this.connecting) return;
      this.connecting = true;
      this.connection = "connecting";
      try {
        const session = await this.platform.session(this.platform.get("token"), this.name);
        this.platform.set("token", session.token);
        this.socket = this.platform.connect(session.token, {
          open: () => {
            this.connecting = false;
            this.connection = "connected";
          },
          close: () => {
            this.connecting = false;
            this.connection = "offline";
            if (!this.reconnectTimer) this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              void this.connect();
            }, 1500);
          },
          message: (text) => {
            try {
              this.receive(JSON.parse(text));
            } catch {
              this.notify("\u6536\u5230\u7684\u6570\u636E\u683C\u5F0F\u5F02\u5E38\u3002");
            }
          }
        });
      } catch {
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
        if (message.room?.roundId !== this.snapshot?.room?.roundId) this.draft = "";
        this.snapshot = message;
        this.handoffPending = false;
        this.submitPending = false;
        const room = message.room;
        this.platform.describe?.(room ? [
          `\u623F\u95F4\u7801 ${room.code}\uFF0C${room.difficulty === "easy" ? "\u7B80\u5355" : "\u56F0\u96BE"}\uFF0C\u7B2C ${room.level} \u5173\uFF0C${room.length} \u5B57\u3002`,
          `\u72B6\u6001\uFF1A${room.phase}\u3002`,
          room.players.map((p) => `${p.seat === 0 ? "A" : "B"}\uFF1A${p.name}\uFF0C${!p.connected ? "\u65AD\u7EBF" : p.ready ? "\u5DF2\u51C6\u5907" : "\u672A\u51C6\u5907"}\uFF0C${p.submitted ? "\u5DF2\u63D0\u4EA4" : "\u672A\u63D0\u4EA4"}`).join("\uFF1B"),
          `\u4F60\u7684\u7247\u6BB5\uFF1A${room.myFragment || "\u5C1A\u672A\u63A5\u9898"}\u3002`,
          room.result ? `\u5B8C\u6574\u9898\u76EE\uFF1A${room.result.prompt} \u6807\u51C6\u7B54\u6848\uFF1A${room.result.answer}\u3002${room.result.success ? "\u4E24\u4EBA\u90FD\u7B54\u5BF9\u4E86\u3002" : "\u672C\u9898\u672A\u901A\u8FC7\u3002"}` : ""
        ].filter(Boolean).join("\n") : "\u4E24\u4EBA\u7B54\u9898\u63A5\u529B\u3002\u9009\u62E9\u96BE\u5EA6\u521B\u5EFA\u623F\u95F4\uFF0C\u6216\u7528\u516D\u4F4D\u623F\u95F4\u7801\u52A0\u5165\u3002");
      } else if (message.type === "reveal") {
        const room = this.snapshot?.room;
        if (!room || room.roundId !== message.roundId || this.handoffPending) return;
        if (message.index > room.myLastIndex) {
          room.myFragment += message.text;
          room.myLastIndex = message.index;
        }
        const me = room.players.find((p) => p.id === this.snapshot.playerId);
        room.canHandoff = me?.seat === 0 && room.phase === "reading";
        this.action({ type: "ack", roundId: message.roundId, index: message.index });
      } else if (message.type === "error") {
        this.handoffPending = false;
        this.submitPending = false;
        this.notify(message.message);
      } else if (message.type === "notice") this.notify(message.message);
    }
    notify(message) {
      this.status = message;
      this.statusUntil = Date.now() + 6500;
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
      this.name = name.trim();
      this.platform.set("name", this.name);
      try {
        await this.platform.session(this.platform.get("token"), this.name);
        this.socket?.close();
      } catch {
        this.notify("\u6635\u79F0\u4FDD\u5B58\u5931\u8D25\u3002");
      }
    }
    async join() {
      const code = await this.platform.prompt("\u8F93\u5165\u516D\u4F4D\u623F\u95F4\u7801", "", 6, true);
      if (code !== void 0) this.action({ type: "join", code: code.trim() });
    }
    async editAnswer() {
      const room = this.snapshot?.room;
      const roundId = room?.roundId;
      const value = await this.platform.prompt("\u586B\u5199\u4F60\u7684\u7B54\u6848", this.draft, 100);
      const current2 = this.snapshot?.room;
      if (current2 && value !== void 0 && roundId === current2.roundId && current2.myAnswer === null && (current2.canAnswer || current2.phase === "paused")) this.draft = value.trim();
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
    text(value, x, y, size = 14, color = C.ink, weight = 400, width = 327, lineHeight = size * 1.55) {
      const ctx2 = this.platform.context;
      ctx2.font = `${weight} ${size}px ${F}`;
      ctx2.fillStyle = color;
      ctx2.textBaseline = "top";
      let line = "";
      let row = 0;
      for (const char of Array.from(value)) {
        if (char === "\n" || ctx2.measureText(line + char).width > width) {
          ctx2.fillText(line, x, y + row++ * lineHeight);
          line = char === "\n" ? "" : char;
        } else line += char;
      }
      if (line) ctx2.fillText(line, x, y + row * lineHeight);
      return y + (row + 1) * lineHeight;
    }
    button(id, label, x, y, width, height, press, style = "primary", disabled = false) {
      const enabled = !disabled && this.connection === "connected";
      const bg = style === "primary" ? enabled ? C.ink : "#D6D9D2" : style === "secondary" ? C.paper : C.bg;
      this.rect(x, y, width, height, bg, style === "secondary" ? C.line : void 0, 6);
      const ctx2 = this.platform.context;
      ctx2.font = `600 15px ${F}`;
      const color = style === "primary" ? C.paper : enabled ? C.ink : C.muted;
      this.text(label, x + Math.max(12, (width - ctx2.measureText(label).width) / 2), y + (height - 18) / 2, 15, color, 600, width - 20, 18);
      this.buttons.push({ id, label, x, y, width, height, disabled: !enabled, press });
    }
    top() {
      this.text("PARTITION / QUIZ", 24, 40, 11, C.muted, 600);
      const energy = this.snapshot?.energy;
      this.text(`\u4F53\u529B ${energy?.current ?? 10}/10`, 270, 40, 11, C.muted, 400, 82);
      const ctx2 = this.platform.context;
      ctx2.strokeStyle = C.line;
      ctx2.beginPath();
      ctx2.moveTo(24, 68);
      ctx2.lineTo(351, 68);
      ctx2.stroke();
    }
    home() {
      this.text("\u5404\u770B\u4E00\u6BB5\uFF0C\n\u4E00\u8D77\u7B54\u5BF9\u3002", 24, 104, 40, C.ink, 700, 327, 55);
      this.text("\u4F60\u51B3\u5B9A\u5728\u54EA\u91CC\u505C\u3002\n\u628A\u5269\u4E0B\u7684\u7EBF\u7D22\u4EA4\u7ED9\u53E6\u4E00\u4F4D\u73A9\u5BB6\u3002", 26, 232, 15, C.muted, 400, 320, 25);
      this.rect(24, 305, 155, 92, C.blue);
      this.rect(195, 305, 156, 92, C.green);
      this.text("A", 40, 319, 25, C.blueInk, 700);
      this.text("\u5148\u63A5\u9898 \xB7 \u81EA\u7531\u4EA4\u63A5", 40, 361, 12, C.blueInk);
      this.text("B", 211, 319, 25, C.greenInk, 700);
      this.text("\u63A5\u7740\u8BFB \xB7 \u4E00\u8D77\u4F5C\u7B54", 211, 361, 12, C.greenInk);
      this.text("\u9009\u62E9\u96BE\u5EA6", 24, 427, 12, C.muted, 500);
      this.button("easy", this.difficulty === "easy" ? "\u7B80\u5355 \xB7 \u5DF2\u9009" : "\u7B80\u5355", 24, 452, 155, 52, () => {
        this.difficulty = "easy";
      }, this.difficulty === "easy" ? "primary" : "secondary");
      this.button("hard", this.difficulty === "hard" ? "\u56F0\u96BE \xB7 \u5DF2\u9009" : "\u56F0\u96BE", 195, 452, 156, 52, () => {
        this.difficulty = "hard";
      }, this.difficulty === "hard" ? "primary" : "secondary");
      this.button("create", "\u521B\u5EFA\u4E24\u4EBA\u623F\u95F4", 24, 528, 327, 56, () => this.action({ type: "create", difficulty: this.difficulty }));
      this.button("join", "\u7528\u623F\u95F4\u7801\u52A0\u5165", 24, 597, 327, 56, () => {
        void this.join();
      }, "secondary");
      this.button("nickname", this.name ? `\u6635\u79F0\uFF1A${this.name}` : "\u8BBE\u7F6E\u6635\u79F0\uFF08\u53EF\u9009\uFF09", 24, 668, 327, 44, () => {
        void this.editName();
      }, "bare");
      this.text("\u4E24\u4EBA\u5408\u4F5C / \u6BCF\u4E2A\u96BE\u5EA6\u4E03\u5173 / \u8BD5\u73A9\u4E0D\u9650\u4F53\u529B", 24, 743, 11, C.muted, 400, 327);
      this.text(this.snapshot?.contentMode === "approved" ? "\u5DF2\u5BA1\u6838\u9898\u5E93" : "\u5185\u90E8\u6D4B\u8BD5\u9898 \xB7 \u6B63\u5F0F\u9898\u5E93\u7B49\u5F85\u4F60\u7684\u6837\u9898", 24, 766, 11, C.muted);
    }
    roomHeader(room) {
      this.text(`${room.difficulty === "easy" ? "\u7B80\u5355" : "\u56F0\u96BE"} / \u7B2C ${room.level} \u5173`, 24, 94, 13, C.muted, 500);
      this.text(`${room.length} \u5B57`, 290, 94, 13, C.muted, 500);
      for (let i = 0; i < 7; i++) this.rect(24 + i * 47, 126, 39, 4, i < room.level ? C.ink : C.line, void 0, 0);
    }
    lobby(room) {
      this.text("\u53EB\u4E0A\u4F60\u7684\u642D\u6863", 24, 162, 29, C.ink, 700);
      this.text("\u623F\u95F4\u7801", 24, 221, 12, C.muted);
      this.text(room.code, 24, 248, 44, C.ink, 600);
      this.button("copy", "\u590D\u5236", 276, 243, 75, 52, () => {
        this.platform.copy(room.code);
        this.notify("\u623F\u95F4\u7801\u5DF2\u590D\u5236\u3002");
      }, "secondary");
      for (let seat = 0; seat < 2; seat++) {
        const p = room.players[seat];
        const y = 333 + seat * 83;
        this.rect(24, y, 327, 68, seat === 0 ? C.blue : C.green);
        this.text(seat === 0 ? "A" : "B", 40, y + 19, 23, seat === 0 ? C.blueInk : C.greenInk, 700);
        this.text(p ? this.short(p.name, 8) + (p.id === this.snapshot?.playerId ? "\uFF08\u4F60\uFF09" : "") : "\u7B49\u5F85\u642D\u6863\u52A0\u5165", 84, y + 15, 15, C.ink, 600, 180);
        this.text(p ? !p.connected ? "\u8FDE\u63A5\u4E2D\u65AD" : p.ready ? "\u5DF2\u51C6\u5907" : "\u672A\u51C6\u5907" : "\u5206\u4EAB\u516D\u4F4D\u623F\u95F4\u7801", 84, y + 41, 11, C.muted);
      }
      const me = room.players.find((p) => p.id === this.snapshot?.playerId);
      this.button("ready", me.ready ? "\u53D6\u6D88\u51C6\u5907" : "\u6211\u51C6\u5907\u597D\u4E86", 24, 523, 327, 56, () => this.action({ type: "ready", ready: !me.ready }), me.ready ? "secondary" : "primary");
      if (room.hostId === this.snapshot?.playerId) this.button("start", `\u5F00\u59CB\u7B2C ${room.level} \u5173`, 24, 593, 327, 56, () => this.action({ type: "start" }), "primary", room.players.length !== 2 || room.players.some((p) => !p.ready || !p.connected));
      else this.text("\u51C6\u5907\u540E\uFF0C\u7B49\u5F85\u623F\u4E3B\u5F00\u59CB\u3002", 24, 609, 14, C.muted);
      this.text("A \u53EF\u4EE5\u81EA\u7531\u53EB\u505C\uFF0CB \u63A5\u4F4F\u5269\u4F59\u6587\u5B57\u3002\n\u4E24\u4EBA\u63D0\u4EA4\u540E\u624D\u4F1A\u516C\u5F00\u7B54\u6848\u3002", 24, 681, 13, C.muted, 400, 327, 23);
      if (room.notice) this.text(room.notice, 24, 736, 12, C.red, 400, 327, 19);
    }
    play(room) {
      const me = room.players.find((p) => p.id === this.snapshot?.playerId);
      const paused = room.phase === "paused";
      const activeMe = room.activeSeat === me.seat && room.phase === "reading";
      const title = paused ? "\u7B49\u642D\u6863\u56DE\u6765" : activeMe ? me.seat === 0 ? "\u4F60\u6765\u51B3\u5B9A\u4F55\u65F6\u505C" : "\u63A5\u4F4F\u5269\u4E0B\u7684\u7EBF\u7D22" : room.phase === "answering" ? "\u73B0\u5728\uFF0C\u4E00\u8D77\u4F5C\u7B54" : me.seat === 0 ? "\u4EA4\u7ED9 B \u4E86" : "\u7B49\u5F85 A \u4EA4\u63A5";
      this.text(title, 24, 166, 27, C.ink, 700);
      this.text(`\u4F60\u662F ${me.seat === 0 ? "A" : "B"} \u68D2 / \u53EA\u663E\u793A\u4F60\u6536\u5230\u7684\u6587\u5B57`, 24, 215, 12, C.muted);
      this.rect(24, 254, 327, 191, me.seat === 0 ? C.blue : C.green);
      if (room.myFragment) this.text(room.myFragment, 43, 277, 25, me.seat === 0 ? C.blueInk : C.greenInk, 600, 290, 39);
      else this.text(activeMe ? "\u6587\u5B57\u6B63\u5728\u4F20\u6765\u2026" : "\u4F60\u7684\u7247\u6BB5\u8FD8\u6CA1\u5230", 43, 313, 20, C.muted, 500, 290);
      if (paused) this.text(`\u7B49\u5F85\u91CD\u8FDE \xB7 ${Math.max(0, Math.ceil(((room.resumeUntil ?? 0) - Date.now() - this.serverOffset) / 1e3))} \u79D2`, 24, 466, 14, C.red, 500);
      else if (room.deadline) this.text(`\u4F5C\u7B54\u5012\u8BA1\u65F6 ${Math.max(0, Math.ceil((room.deadline - Date.now() - this.serverOffset) / 1e3))} \u79D2`, 24, 466, 14, C.ink, 600);
      else this.text(room.phase === "reading" ? `${room.activeSeat === 0 ? "A" : "B"} \u6B63\u5728\u63A5\u9898` : "", 24, 466, 13, C.muted);
      if (me.seat === 0 && room.phase === "reading" && room.activeSeat === 0) {
        this.button("handoff", this.handoffPending ? "\u6B63\u5728\u4EA4\u63A5\u2026" : "\u505C\u5728\u8FD9\u91CC\uFF0C\u4EA4\u7ED9 B", 24, 513, 327, 56, () => {
          this.handoffPending = true;
          this.action({ type: "handoff", roundId: room.roundId, lastIndex: room.myLastIndex });
        }, "primary", !room.canHandoff || this.handoffPending);
        this.text("\u81F3\u5C11\u8BFB\u4E00\u4E2A\u5B57\uFF0C\u540E\u9762\u7ED9 B \u7559\u4E00\u4E2A\u5B57\u3002", 24, 587, 13, C.muted);
      } else if (room.canAnswer && !paused) {
        this.button("input-answer", this.draft ? `\u7B54\u6848\uFF1A${this.short(this.draft, 15)}` : "\u70B9\u51FB\u586B\u5199\u4F60\u7684\u7B54\u6848", 24, 513, 327, 56, () => {
          void this.editAnswer();
        }, "secondary", this.submitPending);
        this.button("submit", this.submitPending ? "\u6B63\u5728\u63D0\u4EA4\u2026" : "\u63D0\u4EA4\u5E76\u9501\u5B9A\u7B54\u6848", 24, 586, 327, 56, () => {
          this.submitPending = true;
          this.action({ type: "answer", roundId: room.roundId, answer: this.draft });
        }, "primary", !this.draft || this.submitPending);
        this.text("\u63D0\u4EA4\u540E\u4E0D\u80FD\u4FEE\u6539\uFF0C\u7B54\u6848\u5230\u7ED3\u7B97\u65F6\u624D\u516C\u5F00\u3002", 24, 667, 12, C.muted);
      } else if (room.myAnswer !== null) {
        this.text(`\u4F60\u7684\u7B54\u6848\uFF1A${this.short(room.myAnswer, 23)}`, 24, 530, 22, C.ink, 600, 327, 32);
        this.text("\u5DF2\u9501\u5B9A\u3002\u7B49\u5F85\u642D\u6863\u5B8C\u6210\u4F5C\u7B54\u3002", 24, 606, 14, C.muted);
      } else this.text(paused ? "\u91CD\u8FDE\u540E\u4F1A\u4ECE\u4E2D\u65AD\u4F4D\u7F6E\u7EE7\u7EED\u3002" : "\u8BFB\u5B8C\u81EA\u5DF1\u7684\u7247\u6BB5\u540E\uFF0C\u53EF\u4EE5\u586B\u5199\u7B54\u6848\u3002", 24, 540, 14, C.muted);
      this.text(room.players.map((p) => `${p.seat === 0 ? "A" : "B"}\uFF1A${p.submitted ? "\u5DF2\u63D0\u4EA4" : "\u672A\u63D0\u4EA4"}`).join("        "), 24, 718, 12, C.muted);
    }
    result(room) {
      const result = room.result;
      this.text(room.phase === "complete" ? "\u4E03\u5173\uFF0C\u4E00\u8D77\u901A\u8FC7\u3002" : result.success ? "\u4E24\u4E2A\u4EBA\uFF0C\u90FD\u7B54\u5BF9\u4E86\u3002" : "\u8FD9\u6B21\u8FD8\u5DEE\u4E00\u70B9\u3002", 24, 162, 26, C.ink, 700);
      this.text(result.timedOut ? "\u5012\u8BA1\u65F6\u7ED3\u675F\uFF0C\u672A\u4F5C\u7B54\u6309\u9519\u8BEF\u5904\u7406\u3002" : result.success ? "\u914D\u5408\u5F97\u5F53\uFF0C\u7EE7\u7EED\u628A\u7EBF\u7D22\u4F20\u4E0B\u53BB\u3002" : "\u4E0B\u4E00\u6B21\u6362\u4E00\u9053\u540C\u6863\u9898\uFF0C\u518D\u8BD5\u8BD5\u4EA4\u63A5\u4F4D\u7F6E\u3002", 24, 208, 12, C.muted);
      this.text("\u5B8C\u6574\u9898\u76EE", 24, 248, 11, C.muted);
      this.text(result.prompt, 24, 274, 21, C.ink, 600, 327, 30);
      this.text(`\u6807\u51C6\u7B54\u6848\uFF1A${result.answer}`, 24, 359, 15, C.ink, 600);
      result.players.forEach((p, i) => {
        const y = 401 + i * 113;
        this.rect(24, y, 327, 97, i === 0 ? C.blue : C.green);
        this.text(`${i === 0 ? "A" : "B"} / ${this.short(p.name, 10)}`, 39, y + 12, 12, C.ink, 600, 175);
        this.text(`${this.short(p.answer ?? "\u672A\u4F5C\u7B54", 6)} \xB7 ${p.correct ? "\u6B63\u786E" : "\u9519\u8BEF"}`, 210, y + 12, 12, p.correct ? C.greenInk : C.red, 600, 126);
        this.text(p.fragment || "\u672A\u63A5\u6536\u5230\u6587\u5B57", 39, y + 40, 15, C.ink, 400, 295, 22);
      });
      if (room.hostId === this.snapshot?.playerId && room.phase !== "complete") this.button("continue", result.success ? "\u8FDB\u5165\u4E0B\u4E00\u5173" : "\u6362\u4E00\u9053\u9898\uFF0C\u518D\u6311\u6218", 24, 655, 327, 56, () => this.action({ type: "continue" }));
      else if (room.phase === "complete") this.button("finish", "\u7ED3\u675F\u623F\u95F4\uFF0C\u91CD\u65B0\u5F00\u59CB", 24, 655, 327, 56, () => this.action({ type: "leave" }));
      else this.text("\u7B49\u5F85\u623F\u4E3B\u7EE7\u7EED\u6311\u6218\u3002", 24, 675, 14, C.muted);
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
  function promptInput(title, value, maxLength, numeric = false) {
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
      const done = (result) => {
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
    describe(text) {
      document.querySelector("#game-status").textContent = text;
    },
    beginFrame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    frame(callback) {
      requestAnimationFrame(callback);
    },
    syncButtons(buttons) {
      current = new Map(buttons.map((button) => [button.id, button]));
      const next = buttons.map((b) => `${b.id}:${b.label}:${b.disabled}`).join("|");
      if (next === signatures) return;
      signatures = next;
      controls.replaceChildren();
      for (const b of buttons) {
        const button = document.createElement("button");
        button.textContent = b.label;
        button.setAttribute("aria-label", b.label);
        button.disabled = !!b.disabled;
        button.style.left = `${b.x / 375 * 100}%`;
        button.style.top = `${b.y / 812 * 100}%`;
        button.style.width = `${b.width / 375 * 100}%`;
        button.style.height = `${b.height / 812 * 100}%`;
        button.addEventListener("click", () => {
          const latest = current.get(b.id);
          if (latest && !latest.disabled) latest.press();
        });
        controls.append(button);
      }
    },
    get(name) {
      return sessionStorage.getItem(key(name));
    },
    set(name, value) {
      sessionStorage.setItem(key(name), value);
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
      ws.addEventListener("close", handlers.close);
      return { send(text) {
        if (ws.readyState === WebSocket.OPEN) ws.send(text);
      }, close() {
        ws.close();
      } };
    },
    prompt: promptInput,
    copy(text) {
      void navigator.clipboard?.writeText(text);
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
