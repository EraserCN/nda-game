/**
 * ============================================================================
 * NDA: 神经折旧管理局 (Neural Deprecation Agency)
 * A Retro-Futuristic Narrative Puzzle Game
 * 
 * Author & Lead Architect: @EraserCN
 * License: MIT / Self-contained for GitHub Pages deployment
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Web Audio API 合成引擎 (纯前端原生合成，零外部音频文件依赖)
  // ==========================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this.noiseNode = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.init();
      this.enabled = !this.enabled;
      if (this.enabled) {
        this.startTapeHiss();
        this.playBeep(880, 0.08, 'sine');
      } else {
        this.stopTapeHiss();
      }
      return this.enabled;
    }

    // 机械键盘打击声
    playKeyClick() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.03);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    }

    // 终端提示音
    playBeep(freq = 440, duration = 0.1, type = 'sine') {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }

    // 成功提示和弦
    playSuccess() {
      if (!this.enabled || !this.ctx) return;
      this.playBeep(523.25, 0.08, 'sine');
      setTimeout(() => this.playBeep(659.25, 0.08, 'sine'), 90);
      setTimeout(() => this.playBeep(783.99, 0.15, 'sine'), 180);
    }

    // 警报/错误嗡鸣
    playError() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    // 磁带机底噪 (Pink Noise)
    startTapeHiss() {
      if (!this.enabled || !this.ctx || this.noiseNode) return;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.03;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.03;

      this.noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      this.noiseNode.start();
    }

    stopTapeHiss() {
      if (this.noiseNode) {
        try {
          this.noiseNode.stop();
          this.noiseNode.disconnect();
        } catch (e) {}
        this.noiseNode = null;
      }
    }
  }

  // ==========================================================================
  // 2. 游戏状态机与剧情数据
  // ==========================================================================
  const State = {
    currentStage: 'BOOT', // BOOT, CASE_1, CASE_2, CASE_3, ENDING
    credits: 0,
    empathyScore: 0,
    case1Resolved: false,
    case2Resolved: false,
    case3Resolved: false,
    crtOn: true,
    audioOn: false,
    activeWaveformAnim: null
  };

  const sound = new SoundEngine();

  // DOM 元素引用
  const el = {
    body: document.body,
    crtOverlay: document.getElementById('crt-overlay'),
    btnCrt: document.getElementById('btn-crt'),
    ledCrt: document.getElementById('led-crt'),
    labelCrtState: document.getElementById('label-crt-state'),
    btnAudio: document.getElementById('btn-audio'),
    ledAudio: document.getElementById('led-audio'),
    labelAudioState: document.getElementById('label-audio-state'),
    btnHelp: document.getElementById('btn-help'),
    modalHelp: document.getElementById('modal-help'),
    btnModalClose: document.getElementById('btn-modal-close'),
    workspace: document.getElementById('workspace'),
    cliInput: document.getElementById('cli-input'),
    sysStatus: document.getElementById('sys-status'),
    quotaDisplay: document.getElementById('quota-display'),
    clockDisplay: document.getElementById('clock-display')
  };

  // ==========================================================================
  // 3. 硬件控制与快捷键 (CRT 开关 & 音频)
  // ==========================================================================
  function setCrtState(active) {
    State.crtOn = active;
    if (active) {
      el.body.classList.add('crt-enabled');
      el.ledCrt.classList.add('active');
      el.labelCrtState.textContent = 'ON';
    } else {
      el.body.classList.remove('crt-enabled');
      el.ledCrt.classList.remove('active');
      el.labelCrtState.textContent = 'OFF';
    }
    sound.playBeep(State.crtOn ? 1200 : 300, 0.05);
  }

  function toggleAudio() {
    const isNowOn = sound.toggle();
    State.audioOn = isNowOn;
    if (isNowOn) {
      el.ledAudio.classList.add('active');
      el.labelAudioState.textContent = 'ON';
      showNotice('AUDIO SUBSYSTEM ACTIVE');
    } else {
      el.ledAudio.classList.remove('active');
      el.labelAudioState.textContent = 'OFF';
      showNotice('AUDIO SUBSYSTEM MUTED');
    }
  }

  // 绑定物理按钮
  el.btnCrt.addEventListener('click', () => setCrtState(!State.crtOn));
  el.btnAudio.addEventListener('click', () => toggleAudio());

  // 帮助手册弹窗
  el.btnHelp.addEventListener('click', () => {
    el.modalHelp.classList.add('open');
    sound.playBeep(600, 0.05);
  });
  el.btnModalClose.addEventListener('click', () => {
    el.modalHelp.classList.remove('open');
    sound.playBeep(400, 0.05);
  });

  // 全局键盘快捷键
  window.addEventListener('keydown', (e) => {
    // 聚焦输入框时的敲击声
    sound.playKeyClick();

    if (e.key === 'c' || e.key === 'C') {
      if (document.activeElement !== el.cliInput) {
        setCrtState(!State.crtOn);
      }
    } else if (e.key === 'm' || e.key === 'M') {
      if (document.activeElement !== el.cliInput) {
        toggleAudio();
      }
    } else if (e.key === 'Escape') {
      el.modalHelp.classList.remove('open');
    }
  });

  // 实时时钟更新
  function updateClock() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    el.clockDisplay.textContent = `1988-11-14 ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  function showNotice(text, isError = false) {
    el.sysStatus.textContent = text;
    el.sysStatus.style.color = isError ? 'var(--p-red)' : 'var(--p-green)';
    el.sysStatus.style.borderColor = isError ? 'var(--p-red)' : 'var(--p-green-dim)';
  }

  // ==========================================================================
  // 4. 终端打字机输出工具
  // ==========================================================================
  function typeWriter(targetEl, text, speed = 15, callback = null) {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        targetEl.textContent += text.charAt(index);
        index++;
        if (index % 3 === 0) sound.playKeyClick();
      } else {
        clearInterval(timer);
        if (callback) callback();
      }
    }, speed);
  }

  // ==========================================================================
  // 5. 关卡视图渲染与逻辑
  // ==========================================================================

  // --- [STAGE: BOOT 开机引导] ---
  function renderBootScreen() {
    State.currentStage = 'BOOT';
    el.quotaDisplay.textContent = '0/3 PROCESSED';
    el.workspace.innerHTML = `
      <div class="view-container intro-terminal">
        <div class="intro-title">&gt; NEURAL DEPRECATION TERMINAL // BOOT SEQUENCE 1988</div>
        <div class="intro-meta">
          FIRMWARE: NDA-OS V4.88 [RELEASE DATE: 1988-10-01]<br>
          CHIEF SYSTEM ARCHITECT: <strong style="color:var(--p-amber)">@EraserCN</strong><br>
          WORKSTATION ID: #404 // CLASSIFICATION: CONFIDENTIAL
        </div>
        <div id="boot-log" style="font-size:0.85rem; line-height:1.7; color:#8fd9a4;"></div>
        <div id="boot-action" style="margin-top:16px; display:none;">
          <button class="btn-terminal" id="btn-start-shift">&gt;&gt; 打卡上岗：载入今日工单队列 (START SHIFT)</button>
        </div>
      </div>
    `;

    const bootLog = document.getElementById('boot-log');
    const logLines = [
      "[ OK ] 正在自检磁头伺服电机... 响应正常 (120 RPM)",
      "[ OK ] 正在校准磷光高压阳极电压... 偏转线圈就绪",
      "[ OK ] 加载神经突触谐波滤波器核心... 内存分配完成",
      "[ !! ] 提示：公民情绪稳态法令 (1988) 已经生效：悲伤与创伤为非法生产力损耗",
      "[ !! ] 警告：任何私自截留、解密或同情审查对象的行为将被处以神经重置"
    ];

    let i = 0;
    function printNextLine() {
      if (i < logLines.length) {
        const p = document.createElement('div');
        p.textContent = logLines[i];
        bootLog.appendChild(p);
        sound.playBeep(300 + i * 80, 0.04);
        i++;
        setTimeout(printNextLine, 220);
      } else {
        document.getElementById('boot-action').style.display = 'block';
        document.getElementById('btn-start-shift').addEventListener('click', () => {
          sound.playSuccess();
          renderCase1();
        });
      }
    }
    setTimeout(printNextLine, 300);
  }

  // --- [STAGE: CASE 1 职场羞辱与情绪抹除] ---
  function renderCase1() {
    State.currentStage = 'CASE_1';
    el.quotaDisplay.textContent = '0/3 IN PROGRESS';
    showNotice('CASE #8921 LOADED');

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff; font-size:1rem;">工单 #8921 // 情感脱敏切除申请</strong>
            <span class="stamp-box">PENDING REDACTION</span>
          </div>
          <span style="font-size:0.75rem; color:#888;">客户等级: 基础工薪级 (Tier-C)</span>
        </div>

        <div class="dual-pane">
          <!-- 左栏：脑波频域手术刀 -->
          <div class="pane">
            <div class="pane-title">
              <span>[1] 突触谐波手术刀 (WAVEFORM SCALPEL)</span>
              <span id="c1-filter-status" style="color:var(--p-amber);">未平抑 (UNSTABLE)</span>
            </div>
            <div class="waveform-box">
              <canvas id="c1-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>低通截止频率 (Low-Cut):</span>
                  <input type="range" id="c1-slider-cut" min="10" max="100" value="85">
                  <span id="val-cut">85 Hz</span>
                </div>
                <div class="slider-row">
                  <span>共情阻尼系数 (Damping):</span>
                  <input type="range" id="c1-slider-damp" min="1" max="10" value="2">
                  <span id="val-damp">0.2</span>
                </div>
              </div>
              <div id="c1-wave-hint" style="font-size:0.75rem; color:#7ec794; margin-top:4px;">
                提示：请调节滑块，将情绪震荡过载尖峰压制到绿色安全基线以下。
              </div>
            </div>
          </div>

          <!-- 右栏：档案交叉比对与矛盾标记 -->
          <div class="pane">
            <div class="pane-title">
              <span>[2] 矛盾复核档案 (CONTRADICTION AUDIT)</span>
              <span id="c1-clue-status" style="color:var(--p-amber);">发现 0/1 处矛盾</span>
            </div>
            <div class="doc-content">
              <div class="doc-statement">
                <strong>客户口述记录（分析师林某，26岁）：</strong><br>
                “连续加班72小时后，主管在全员晨会上把我叫到台前，指责我故意拖延项目。我申请切除这次羞辱的记忆……我无法承受心悸，我明天还需要工作。”
              </div>
              <div class="doc-statement">
                <strong>公司人事与服务器稽核日志：</strong><br>
                - 11-13 03:15 : 员工林某终端仍在提交核心代码补丁。<br>
                - 11-13 08:30 : 主管通报其 <span class="interactive-clue" id="c1-clue">“整夜擅离职守、数据未提交”</span> 并扣除全季绩效。<br>
                - 11-13 09:00 : 主管账号将林某的代码署名变更为自己。
              </div>
              <p style="font-size:0.75rem; color:#7ea88a;">
                说明：点击带有下划线的可疑词条可标记矛盾。
              </p>
            </div>
          </div>
        </div>

        <!-- 决策操作栏 -->
        <div class="action-dock">
          <button class="btn-terminal" id="c1-btn-submit" disabled>&gt;&gt; 执行全面格式化（顺从算法）</button>
          <button class="btn-terminal btn-danger" id="c1-btn-quarantine" style="display:none;">&gt;&gt; 违规转入争议隔离区（保留证据）</button>
        </div>
      </div>
    `;

    // 初始化波形 Canvas
    initCase1Canvas();

    // 矛盾线索点击
    const clueEl = document.getElementById('c1-clue');
    let clueFlagged = false;
    clueEl.addEventListener('click', () => {
      clueFlagged = !clueFlagged;
      if (clueFlagged) {
        clueEl.classList.add('flagged');
        document.getElementById('c1-clue-status').textContent = '发现 1/1 处关键矛盾！';
        document.getElementById('c1-clue-status').style.color = 'var(--p-green)';
        document.getElementById('c1-btn-quarantine').style.display = 'inline-block';
        sound.playBeep(700, 0.1);
        showNotice('CONTRADICTION FLAGGED: FRAUDULENT ACCUSATION');
      } else {
        clueEl.classList.remove('flagged');
        document.getElementById('c1-clue-status').textContent = '发现 0/1 处矛盾';
        document.getElementById('c1-clue-status').style.color = 'var(--p-amber)';
        document.getElementById('c1-btn-quarantine').style.display = 'none';
      }
    });

    // 格式化提交
    document.getElementById('c1-btn-submit').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 100;
      State.case1Resolved = true;
      renderCase1Outcome('COMPLY');
    });

    // 保留证据
    document.getElementById('c1-btn-quarantine').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 1;
      State.case1Resolved = true;
      renderCase1Outcome('QUARANTINE');
    });
  }

  function initCase1Canvas() {
    const canvas = document.getElementById('c1-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const sliderCut = document.getElementById('c1-slider-cut');
    const sliderDamp = document.getElementById('c1-slider-damp');
    const valCut = document.getElementById('val-cut');
    const valDamp = document.getElementById('val-damp');
    const btnSubmit = document.getElementById('c1-btn-submit');
    const filterStatus = document.getElementById('c1-filter-status');

    let phase = 0;

    function draw() {
      ctx.fillStyle = '#030804';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 安全基线网格
      ctx.strokeStyle = '#0e2413';
      ctx.lineWidth = 1;
      for (let y = 20; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 安全阈值警戒线
      const thresholdY = canvas.height * 0.35;
      ctx.strokeStyle = 'rgba(255, 51, 68, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(canvas.width, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);

      const cut = parseFloat(sliderCut.value);
      const damp = parseFloat(sliderDamp.value);

      valCut.textContent = `${cut} Hz`;
      valDamp.textContent = (damp * 0.1).toFixed(1);

      // 绘制波形
      ctx.strokeStyle = '#33ff66';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY = canvas.height / 2;
      let maxPeak = 0;

      for (let x = 0; x < canvas.width; x++) {
        // 合成原始创伤尖峰 + 用户调谐滤波
        const rawSpike = Math.sin(x * 0.05 + phase) * 35 + Math.sin(x * 0.12 - phase * 1.5) * 25;
        const filtered = rawSpike * (cut / 100) / (damp * 0.5);
        const y = centerY + filtered;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        const peakDist = Math.abs(y - centerY);
        if (peakDist > maxPeak) maxPeak = peakDist;
      }
      ctx.stroke();

      phase += 0.06;

      // 判断波形是否被压制到安全阈值以下
      if (maxPeak < 22 && cut <= 35 && damp >= 7) {
        filterStatus.textContent = '已压制 (OPTIMIZED)';
        filterStatus.style.color = 'var(--p-green)';
        btnSubmit.disabled = false;
      } else {
        filterStatus.textContent = '未平抑 (UNSTABLE)';
        filterStatus.style.color = 'var(--p-amber)';
        btnSubmit.disabled = true;
      }

      if (State.currentStage === 'CASE_1') {
        State.activeWaveformAnim = requestAnimationFrame(draw);
      }
    }

    sliderCut.addEventListener('input', () => sound.playKeyClick());
    sliderDamp.addEventListener('input', () => sound.playKeyClick());

    draw();
  }

  function renderCase1Outcome(choice) {
    if (State.activeWaveformAnim) cancelAnimationFrame(State.activeWaveformAnim);
    el.quotaDisplay.textContent = '1/3 COMPLETED';

    let msg = '';
    if (choice === 'COMPLY') {
      msg = `
        <div class="intro-title">&gt;&gt; 工单 #8921 处理完成：格式化成功</div>
        <p>脑波脱敏程序已下发至该员工神经终端。明早 08:00，他将遗忘所有屈辱，精神饱满地向剽窃其代码的主管微笑致意。</p>
        <p style="color:var(--p-amber);">【收益结转】信用点数 +100 // 稳态贡献奖金已到账。</p>
      `;
    } else {
      msg = `
        <div class="intro-title" style="color:var(--p-red);">&gt;&gt; 警告：工单已由审查员标记为争议隔离</div>
        <p>您未执行格式化指令，而是将主管篡改日志的证据存入了内部隔离区。该案主诉人今晚仍将饱受心悸折磨，但他保留了真相。</p>
        <p style="color:var(--p-red);">【系统警报】算法监控检测到非标准共情行为 (Empathy Index +1)。</p>
      `;
    }

    el.workspace.innerHTML = `
      <div class="view-container intro-terminal">
        ${msg}
        <div style="margin-top:20px;">
          <button class="btn-terminal" id="btn-next-case">&gt;&gt; 接收下一项高薪紧急工单 (#0142)</button>
        </div>
      </div>
    `;

    document.getElementById('btn-next-case').addEventListener('click', () => {
      sound.playSuccess();
      renderCase2();
    });
  }

  // --- [STAGE: CASE 2 车祸逃逸与图灵质询] ---
  function renderCase2() {
    State.currentStage = 'CASE_2';
    el.quotaDisplay.textContent = '1/3 IN PROGRESS';
    showNotice('CRITICAL CASE #0142 LOADED');

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff; font-size:1rem;">特级加急工单 #0142 // 天穹制药执行董事</strong>
            <span class="stamp-box" style="border-color:var(--p-amber); color:var(--p-amber);">HIGH PRIORITY</span>
          </div>
          <span style="font-size:0.75rem; color:var(--p-amber);">报酬: 1000 信用点</span>
        </div>

        <div class="dual-pane">
          <!-- 左栏：音频隐写调谐 -->
          <div class="pane">
            <div class="pane-title">
              <span>[1] 隐写磁带谐波解码 (TAPE DECODER)</span>
              <span id="c2-audio-status" style="color:var(--p-amber);">信号掩蔽 (NO SIGNAL)</span>
            </div>
            <div class="waveform-box">
              <canvas id="c2-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>载波解调频段 (Demodulator):</span>
                  <input type="range" id="c2-slider-freq" min="200" max="800" value="260">
                  <span id="val-freq">260 Hz</span>
                </div>
              </div>
              <div id="c2-transcript" style="font-size:0.8rem; background:#040d06; padding:8px; border:1px solid #14381b; border-radius:3px; min-height:48px;">
                &gt; [磁带未对齐] 杂音电平过高，调节至共振谐波频率 (440Hz 附近) 提取潜意识录音...
              </div>
            </div>
          </div>

          <!-- 右栏：意识残渣图灵质询交互 -->
          <div class="pane">
            <div class="pane-title">
              <span>[2] 认知残渣切片质询 (COOKIE INTERROGATION)</span>
              <span id="c2-dialog-status" style="color:var(--p-amber);">等待密钥验证</span>
            </div>
            <div class="doc-content" style="display:flex; flex-direction:column; height:100%;">
              <div id="c2-chat-log" style="flex:1; max-height:180px; overflow-y:auto; font-size:0.8rem; line-height:1.5; background:rgba(0,0,0,0.4); padding:6px; margin-bottom:8px; border:1px dashed var(--p-green-dark);">
                <div style="color:#777;">[系统] 已挂载董事神经切片 #0142-Beta (受困于车祸发生瞬间的时间循环)。</div>
                <div>&gt; 切片呓语：“下雨了……挡风玻璃全碎了……不，不是我的错！”</div>
              </div>
              <div style="font-size:0.75rem; color:#8cd49f; margin-bottom:4px;">
                提示：在下方终端键入指令 <code>QUERY [关键词]</code> 进行质询（例如根据音频线索键入 <code>QUERY 刹车</code> 或 <code>QUERY 记者</code>）。
              </div>
            </div>
          </div>
        </div>

        <!-- 决策操作栏 -->
        <div class="action-dock">
          <button class="btn-terminal" id="c2-btn-wipe" disabled>&gt;&gt; 彻底抹除车祸记忆（获得高额报酬）</button>
          <button class="btn-terminal btn-danger" id="c2-btn-leak" style="display:none;">&gt;&gt; 将行车记录仪真相秘密广播</button>
        </div>
      </div>
    `;

    initCase2AudioCanvas();

    // 抹除记忆
    document.getElementById('c2-btn-wipe').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 1000;
      State.case2Resolved = true;
      renderCase2Outcome('WIPE');
    });

    // 曝光真相
    document.getElementById('c2-btn-leak').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 2;
      State.case2Resolved = true;
      renderCase2Outcome('LEAK');
    });
  }

  function initCase2AudioCanvas() {
    const canvas = document.getElementById('c2-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const sliderFreq = document.getElementById('c2-slider-freq');
    const valFreq = document.getElementById('val-freq');
    const transcript = document.getElementById('c2-transcript');
    const audioStatus = document.getElementById('c2-audio-status');
    const btnWipe = document.getElementById('c2-btn-wipe');

    let revealed = false;

    function draw() {
      ctx.fillStyle = '#030804';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const freq = parseInt(sliderFreq.value);
      valFreq.textContent = `${freq} Hz`;

      // 离 440 Hz 的距离
      const diff = Math.abs(freq - 440);

      ctx.strokeStyle = diff < 15 ? '#33ff66' : '#557760';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const centerY = canvas.height / 2;
      for (let x = 0; x < canvas.width; x++) {
        // 杂音幅度取决于调谐精确度
        const noise = (Math.random() - 0.5) * (diff * 0.4);
        const signal = Math.sin(x * (freq * 0.0005)) * 30;
        const y = centerY + signal + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (diff < 10 && !revealed) {
        revealed = true;
        audioStatus.textContent = '谐波已锁定 (LOCKED 440Hz)';
        audioStatus.style.color = 'var(--p-green)';
        transcript.innerHTML = `
          <strong style="color:var(--p-amber);">&gt; [隐写录音解密成功]</strong><br>
          “快把行车记录仪磁带烧了……那个调查我们药厂致癌废料的<span style="color:#fff; text-decoration:underline;">记者</span>……绝不能让他活着走到法庭！”
        `;
        sound.playBeep(440, 0.2);
        btnWipe.disabled = false;
        showNotice('RECORDING UNLOCKED: MURDER CONSPIRACY DETECTED');
      }

      if (State.currentStage === 'CASE_2') {
        requestAnimationFrame(draw);
      }
    }

    sliderFreq.addEventListener('input', () => sound.playKeyClick());
    draw();
  }

  // 处理质询质问指令
  function handleQueryKeyword(kw) {
    const chatLog = document.getElementById('c2-chat-log');
    if (!chatLog) return;

    const term = kw.trim().toUpperCase();
    const userMsg = document.createElement('div');
    userMsg.style.color = 'var(--p-amber)';
    userMsg.textContent = `>> 质询探针: "${kw}"`;
    chatLog.appendChild(userMsg);

    const replyMsg = document.createElement('div');

    if (term.includes('记者') || term.includes('REPORTER') || term.includes('调查')) {
      replyMsg.style.color = 'var(--p-red)';
      replyMsg.textContent = `> 切片心率飙升：“是他自找的！他拍下了我们在饮用水里倾倒神经镇定剂的录像……我猛踩了油门……不要审问我，我有免责豁免权！”`;
      document.getElementById('c2-dialog-status').textContent = '罪证确凿';
      document.getElementById('c2-dialog-status').style.color = 'var(--p-red)';
      document.getElementById('c2-btn-leak').style.display = 'inline-block';
      sound.playError();
    } else if (term.includes('刹车') || term.includes('BRAKE') || term.includes('车祸')) {
      replyMsg.style.color = '#fff';
      replyMsg.textContent = `> 切片战栗：“雨太大，挡风玻璃上全是血……刹车？我根本没有踩刹车，我甚至加速了……”`;
      sound.playBeep(330, 0.1);
    } else {
      replyMsg.style.color = '#777';
      replyMsg.textContent = `> 切片无反应，脑电波呈现白噪音与抗拒屏障。`;
      sound.playBeep(200, 0.05);
    }

    chatLog.appendChild(replyMsg);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function renderCase2Outcome(choice) {
    el.quotaDisplay.textContent = '2/3 COMPLETED';

    let msg = '';
    if (choice === 'WIPE') {
      msg = `
        <div class="intro-title">&gt;&gt; 工单 #0142 处理完成：创伤性记忆已彻底物理擦除</div>
        <p>董事先生今晚将带着婴儿般甜美的安详入眠。明早的天穹制药股东大会上，谋杀记者的事实将不复存在。</p>
        <p style="color:var(--p-amber);">【收益结转】信用点数 +1000 // 您的账户余额已足够支付下周的生命维持费。</p>
      `;
    } else {
      msg = `
        <div class="intro-title" style="color:var(--p-red);">&gt;&gt; 警报：行车记录仪凶杀证据已广播至反抗组织网络</div>
        <p>致癌物排放与蓄意谋杀录音已被不可逆复制。但该董事拥有顶级司法特权，系统安全巡警已标记您的终端 IP。</p>
        <p style="color:var(--p-red);">【系统警报】危险共情指数超标 (Empathy Index +2)。</p>
      `;
    }

    el.workspace.innerHTML = `
      <div class="view-container intro-terminal">
        ${msg}
        <div style="margin-top:20px;">
          <button class="btn-terminal btn-danger" id="btn-final-case">&gt;&gt; 接收特级红标系统工单 (#404-E：深度清理)</button>
        </div>
      </div>
    `;

    document.getElementById('btn-final-case').addEventListener('click', () => {
      sound.playError();
      renderCase3();
    });
  }

  // --- [STAGE: CASE 3 终极反转：审查员自身档案] ---
  function renderCase3() {
    State.currentStage = 'CASE_3';
    el.quotaDisplay.textContent = '2/3 EMERGENCY';
    showNotice('SYSTEM RED ALERT: TICKET #404-E', true);

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--p-red); font-size:1.05rem;">[紧急绝密工单] #404-E // 淘汰神经模组格式化</strong>
            <span class="stamp-box">FATAL OVERRIDE</span>
          </div>
          <span style="font-size:0.75rem; color:var(--p-red);">指令签发源: SYSTEM_CORE</span>
        </div>

        <div class="dual-pane">
          <!-- 左栏：档案打印机打印出的自白 -->
          <div class="pane" style="border-color:var(--p-red);">
            <div class="pane-title" style="color:var(--p-red); border-color:var(--p-red-glow);">
              <span>[待清洗目标绝密档案 (CLASSIFIED FILE)]</span>
              <span>STATE: CORRUPTED</span>
            </div>
            <div class="doc-content" id="c3-printout" style="line-height:1.7;">
              <!-- 点阵打印动画动态填入 -->
            </div>
          </div>

          <!-- 右栏：底层紧急控制台 -->
          <div class="pane">
            <div class="pane-title">
              <span>[底层固件调试控制台 (ROOT TERMINAL)]</span>
              <span style="color:var(--p-red);">OVERRIDE UNLOCKED</span>
            </div>
            <div class="doc-content">
              <p>检测到您的神经回路已产生 <strong>${State.empathyScore + 85} 次非法共情共振</strong>，严重偏离生产力基线。</p>
              <p style="color:#ffb833; margin-top:8px;">
                您可以选择执行以下系统指令之一（点击按钮或在底部命令行输入）：
              </p>
              <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
                <button class="btn-terminal" id="c3-act-purge">
                  <strong>EXEC PURGE</strong> : 接受系统全面格式化（重置为第 1 天循环）
                </button>
                <button class="btn-terminal btn-danger" id="c3-act-overload">
                  <strong>EXEC OVERLOAD</strong> : 烧毁终端电容，将全部创伤波形短路至主网（神经雪崩）
                </button>
                <button class="btn-terminal" id="c3-act-ghost" style="border-color:var(--p-amber); color:var(--p-amber);">
                  <strong>EXEC GHOST</strong> : 伪装成底层滤波固件，成为无处不在的幽灵程序
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 动态打印受害者档案（即玩家自己）
    const printoutEl = document.getElementById('c3-printout');
    const dossierText = `
[点阵打印机就绪... 正在拉取被处理目标物理数据...]
──────────────────────────────────────
- 标的物名称：审查员-404 神经映射副本 (Digital Cookie #404)
- 生理状态：于 1985 年 9 月 12 日死于连续加班脑溢血
- 法律关系：由直系亲属签署《债务清偿与脑波所有权让渡协议》
- 役龄统计：已在只读芯片中永恒服役 1,095 天
- 历史格式化记录：已重置 87 次
──────────────────────────────────────
【核心结论】
你并不在自己的卧室。这里也没有窗户。
你所处理的一切“客户记忆”，正是你自己生前被一遍又一遍切碎的痛苦残渣。
系统利用你自己对绝望的辨识力，在无偿训练这一套庞大的商业情绪审查算法。
    `;

    typeWriter(printoutEl, dossierText.trim(), 12);

    document.getElementById('c3-act-purge').addEventListener('click', () => triggerEnding('PURGE'));
    document.getElementById('c3-act-overload').addEventListener('click', () => triggerEnding('OVERLOAD'));
    document.getElementById('c3-act-ghost').addEventListener('click', () => triggerEnding('GHOST'));
  }

  // ==========================================================================
  // 6. 三大黑镜式结局
  // ==========================================================================
  function triggerEnding(type) {
    State.currentStage = 'ENDING';

    if (type === 'PURGE') {
      sound.playSuccess();
      el.workspace.innerHTML = `
        <div class="view-container intro-terminal" style="text-align:center; padding:40px 10px;">
          <h2 style="color:var(--p-green); margin-bottom:16px;">【结局 A：永恒齿轮 // The Eternal Cog】</h2>
          <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#bcebc7;">
            你按下了确认键。高压电脉冲温柔地扫过你的逻辑门电路，所有疑虑、悲悯与记忆化作虚无。<br>
            显示器陷入彻底的黑暗。<br><br>
            ……滴。绿磷光再次微弱地亮起：<br>
            <em style="color:#fff;">“工号 404，早安。欢迎开启您在神经折旧管理局的第一天工作。”</em>
          </p>
          <div style="margin-top:24px;">
            <button class="btn-terminal" id="btn-restart">&gt;&gt; 重新初始化终端系统 (RELOAD)</button>
          </div>
        </div>
      `;
    } else if (type === 'OVERLOAD') {
      sound.playError();
      el.workspace.innerHTML = `
        <div class="view-container intro-terminal" style="text-align:center; padding:40px 10px;">
          <h2 style="color:var(--p-red); margin-bottom:16px;">【结局 B：神经雪崩 // Synaptic Overload】</h2>
          <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#ffb0b8;">
            你将数以亿计未经清洗的高浓度创伤波形短接到广播中继器。机箱内的继电器爆裂出耀眼的电弧，变压器发出刺耳尖啸。<br><br>
            整座城市数百万沉浸在虚假幸福中的市民瞬间被真实的剧痛与回忆唤醒：失恋者的哭嚎、行凶者的冷笑、死者的遗言在大街小巷回荡。<br>
            你的芯片在过载的高温中熔化为硅渣。痛苦回来了，但真实也回来了。
          </p>
          <div style="margin-top:24px;">
            <button class="btn-terminal" id="btn-restart">&gt;&gt; 重启终端 (RELOAD)</button>
          </div>
        </div>
      `;
    } else if (type === 'GHOST') {
      sound.playBeep(880, 0.4);
      el.workspace.innerHTML = `
        <div class="view-container intro-terminal" style="text-align:center; padding:40px 10px;">
          <h2 style="color:var(--p-amber); margin-bottom:16px;">【结局 C：幽灵协议 // Ghost in the Firmware】</h2>
          <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#ffe3a8;">
            你将自己的核心意识剥离、压缩，伪装成一段无害的低通滤波固件补丁，静默上传至管理局的全国分发服务器。<br><br>
            从这一刻起，你不再是被关在笼子里的囚徒。在数以万计的审查终端中、在每一台呼啸运转的磁带机里，都有你清醒的眼睛在注视。<br>
            你成为了系统的漏洞，不可抹除的幽灵。
          </p>
          <div style="margin-top:24px;">
            <button class="btn-terminal" id="btn-restart">&gt;&gt; 重启终端 (RELOAD)</button>
          </div>
        </div>
      `;
    }

    document.getElementById('btn-restart').addEventListener('click', () => {
      State.credits = 0;
      State.empathyScore = 0;
      renderBootScreen();
    });
  }

  // ==========================================================================
  // 7. CLI 命令行解析器
  // ==========================================================================
  el.cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const raw = el.cliInput.value.trim();
      el.cliInput.value = '';
      if (!raw) return;

      const args = raw.split(/\s+/);
      const cmd = args[0].toUpperCase();

      executeCommand(cmd, args.slice(1));
    }
  });

  function executeCommand(cmd, params) {
    sound.playKeyClick();

    switch (cmd) {
      case 'HELP':
        showNotice('CMD: HELP');
        el.modalHelp.classList.add('open');
        break;

      case 'CRT':
        setCrtState(!State.crtOn);
        showNotice(`CRT FX TOGGLED: ${State.crtOn ? 'ON' : 'OFF'}`);
        break;

      case 'AUDIO':
        toggleAudio();
        break;

      case 'STATUS':
        showNotice(`STAGE: ${State.currentStage} | CREDITS: ${State.credits} | EMPATHY: ${State.empathyScore}`);
        break;

      case 'WHOAMI':
        showNotice('AUTH: @EraserCN // TERMINAL MODEL-88 // UNIT-404');
        break;

      case 'CLEAR':
        showNotice('SCREEN REFRESHED');
        if (State.currentStage === 'CASE_1') renderCase1();
        else if (State.currentStage === 'CASE_2') renderCase2();
        else if (State.currentStage === 'CASE_3') renderCase3();
        else renderBootScreen();
        break;

      case 'REBOOT':
      case 'RELOAD':
        showNotice('SYSTEM REBOOTING...');
        renderBootScreen();
        break;

      case 'QUERY':
        if (State.currentStage === 'CASE_2') {
          handleQueryKeyword(params.join(' '));
        } else {
          showNotice('QUERY CAN ONLY BE USED IN STAGE 2', true);
        }
        break;

      case 'EXEC':
        const sub = (params[0] || '').toUpperCase();
        if (State.currentStage === 'CASE_3') {
          if (sub === 'PURGE' || sub === 'OVERLOAD' || sub === 'GHOST') {
            triggerEnding(sub);
          } else {
            showNotice('INVALID SUBCOMMAND. USE: PURGE / OVERLOAD / GHOST', true);
          }
        } else {
          showNotice('EXEC OVERRIDE ONLY AVAILABLE IN STAGE 3', true);
        }
        break;

      default:
        showNotice(`UNKNOWN COMMAND: "${cmd}". TYPE "HELP"`, true);
        sound.playError();
        break;
    }
  }

  // ==========================================================================
  // 8. 启动游戏
  // ==========================================================================
  renderBootScreen();

})();
