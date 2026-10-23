/**
 * ============================================================================
 * NDA: 神经折旧管理局 (Neural Deprecation Agency)
 * 50,000-Word Comprehensive Narrative & Interactive Engine
 * 
 * Lead Designer & System Architect: @EraserCN
 * Fully Self-Contained, Zero External Dependencies, Domestic Network Ready
 * ============================================================================
 */

(function () {
  'use strict';

  const DATA = window.NDA_DATA || {};

  // ==========================================================================
  // 1. Web Audio API 物理合成引擎 (零外部音频依赖)
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

    playKeyClick() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(140 + Math.random() * 90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.03);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    }

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

    playSuccess() {
      if (!this.enabled || !this.ctx) return;
      this.playBeep(523.25, 0.07, 'sine');
      setTimeout(() => this.playBeep(659.25, 0.07, 'sine'), 80);
      setTimeout(() => this.playBeep(783.99, 0.14, 'sine'), 160);
    }

    playError() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(75, now + 0.28);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }

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
        output[i] = (b0 + b1 + b2) * 0.025;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1600;

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
  // 2. 全局状态机 (State Machine)
  // ==========================================================================
  const State = {
    // 进度与选项卡
    day: 1, // 1 ~ 4
    phase: 'PROLOGUE', // PROLOGUE, ON_DUTY, OFF_DUTY, CLIMAX, ENDING
    activeTab: 'work', // work, bbs, archive, apt
    activeCaseIndex: 0,

    // 生活数值
    credits: 220,
    sisterCondition: '稳定',
    sisterMedsPaid: false,
    rentPaid: false,
    pillTaken: false,
    empathyScore: 0,
    sanity: 100,
    rebelNetworkUnlocked: false,

    // 公寓子媒体状态
    activeTapeKey: 'TAPE_A',
    radioFreq: 88.5,
    selectedDiaryChoice: null,

    // 论坛与检索状态
    activeBbsId: 'thread-01',
    activeArchiveKey: 'PROJECT_LETHE',

    // 硬件与系统
    crtOn: true,
    audioOn: false,
    activeWaveformAnim: null,
    playerName: 'INSPECTOR-404'
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
    clockDisplay: document.getElementById('clock-display'),

    // HUD 状态栏
    hudDay: document.getElementById('hud-day'),
    hudPhase: document.getElementById('hud-phase'),
    hudCredits: document.getElementById('hud-credits'),
    hudSister: document.getElementById('hud-sister'),
    hudEmpathy: document.getElementById('hud-empathy'),

    // Tab 导航按钮
    tabBtns: document.querySelectorAll('.tab-btn')
  };

  // ==========================================================================
  // 3. UI 交互、Tab 导航与 HUD 同步
  // ==========================================================================
  function updateHUD() {
    el.hudDay.textContent = `DAY ${State.day} / 4`;
    el.hudPhase.textContent = State.phase === 'ON_DUTY' ? 'ON DUTY' : (State.phase === 'OFF_DUTY' ? 'OFF DUTY' : State.phase);
    el.hudCredits.textContent = `${State.credits} CR`;
    el.hudEmpathy.textContent = State.empathyScore;

    el.hudSister.textContent = State.sisterCondition;
    if (State.sisterCondition === '稳定') {
      el.hudSister.style.color = 'var(--p-green)';
    } else if (State.sisterCondition === '恶化') {
      el.hudSister.style.color = 'var(--p-amber)';
    } else {
      el.hudSister.style.color = 'var(--p-red)';
    }
  }

  function showNotice(text, isError = false) {
    el.sysStatus.textContent = text;
    el.sysStatus.style.color = isError ? 'var(--p-red)' : 'var(--p-green)';
    el.sysStatus.style.borderColor = isError ? 'var(--p-red)' : 'var(--p-green-dim)';
  }

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

  // Tab 切换逻辑
  function switchTab(tabKey) {
    State.activeTab = tabKey;
    el.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabKey);
    });
    sound.playBeep(480, 0.05);

    if (tabKey === 'work') {
      if (State.phase === 'PROLOGUE') renderPrologue();
      else if (State.phase === 'ON_DUTY') loadDayCase(State.day, State.activeCaseIndex || 1);
      else if (State.phase === 'OFF_DUTY') renderApartmentScene();
      else if (State.phase === 'CLIMAX') renderDay4Climax();
    } else if (tabKey === 'bbs') {
      renderBbsView();
    } else if (tabKey === 'archive') {
      renderArchiveView(State.activeArchiveKey);
    } else if (tabKey === 'apt') {
      renderApartmentScene();
    }
  }

  el.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  el.btnCrt.addEventListener('click', () => setCrtState(!State.crtOn));
  el.btnAudio.addEventListener('click', () => toggleAudio());
  el.btnHelp.addEventListener('click', () => el.modalHelp.classList.add('open'));
  el.btnModalClose.addEventListener('click', () => el.modalHelp.classList.remove('open'));

  // 键盘快捷键监听
  window.addEventListener('keydown', (e) => {
    sound.playKeyClick();
    if (document.activeElement !== el.cliInput) {
      if (e.key === 'c' || e.key === 'C') setCrtState(!State.crtOn);
      else if (e.key === 'm' || e.key === 'M') toggleAudio();
      else if (e.key === '1') switchTab('work');
      else if (e.key === '2') switchTab('bbs');
      else if (e.key === '3') switchTab('archive');
      else if (e.key === '4') switchTab('apt');
      else if (e.key === 'Escape') el.modalHelp.classList.remove('open');
    }
  });

  function updateClock() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    el.clockDisplay.textContent = `1988-11-${13 + State.day} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  function typeWriter(targetEl, text, speed = 10, callback = null) {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        targetEl.textContent += text.charAt(index);
        index++;
        if (index % 4 === 0) sound.playKeyClick();
      } else {
        clearInterval(timer);
        if (callback) callback();
      }
    }, speed);
  }

  // ==========================================================================
  // 4. 子系统 2: 企业内部匿名网络 (INTRANET BBS VIEW)
  // ==========================================================================
  function renderBbsView() {
    const threads = DATA.BBS_THREADS || [];
    const currentThread = threads.find(t => t.id === State.activeBbsId) || threads[0];

    const threadListHtml = threads.map(t => `
      <div class="bbs-card ${t.id === currentThread.id ? 'active' : ''}" data-id="${t.id}">
        <div class="bbs-card-header">
          <span class="bbs-badge ${t.tag.includes('官方') ? 'danger' : ''}">${t.tag}</span>
          <span>${t.date}</span>
        </div>
        <div class="bbs-card-title">${t.title}</div>
        <div style="font-size:0.7rem; color:#6ea57c; margin-top:4px;">作者: ${t.author} | 回复: ${t.replies}</div>
      </div>
    `).join('');

    const commentsHtml = (currentThread.comments || []).map(c => `
      <div class="bbs-comment-item">
        <strong style="color:var(--p-amber);">${c.user}:</strong> ${c.text}
      </div>
    `).join('');

    el.workspace.innerHTML = `
      <div class="bbs-container">
        <!-- 左侧帖子列表 -->
        <div class="bbs-list-pane">
          <div style="font-size:0.8rem; font-weight:bold; color:var(--p-green); padding-bottom:4px; border-bottom:1px solid #14351b;">
            &gt; 内部员工交流区 // 匿名路由 [只读节点]
          </div>
          ${threadListHtml}
        </div>

        <!-- 右侧帖子详情 -->
        <div class="bbs-detail-pane">
          <div class="bbs-post-header">
            <div class="bbs-post-title">${currentThread.title}</div>
            <div class="bbs-post-meta">发帖人: ${currentThread.author} | 发布时间: ${currentThread.date}</div>
          </div>
          <div class="bbs-post-body">${currentThread.content.trim()}</div>
          
          <div style="margin-top:12px; border-top:1px dashed #14351b; padding-top:8px;">
            <div style="font-size:0.75rem; font-weight:bold; color:var(--p-amber); margin-bottom:4px;">
              [员工匿名留言区 (COMMENTS)]
            </div>
            ${commentsHtml}
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.bbs-card').forEach(card => {
      card.addEventListener('click', () => {
        State.activeBbsId = card.dataset.id;
        sound.playBeep(600, 0.05);
        renderBbsView();
      });
    });
  }

  // ==========================================================================
  // 5. 子系统 3: 绝密检索库 (ARCHIVE DATABASE SEARCH VIEW)
  // ==========================================================================
  function renderArchiveView(searchKey = 'PROJECT_LETHE') {
    const archives = DATA.ARCHIVE_ENTRIES || {};
    const key = (searchKey || '').toUpperCase().trim();
    const entry = archives[key] || archives['PROJECT_LETHE'];
    State.activeArchiveKey = key;

    // 格式化文本中的词条链接 [KEYWORD]
    let formattedContent = entry.content.trim();
    Object.keys(archives).forEach(k => {
      const reg = new RegExp(`\\[${k}\\]`, 'g');
      formattedContent = formattedContent.replace(reg, `<span class="archive-link" data-search="${k}">[${k}]</span>`);
    });

    // 常用热门标签
    const tagsHtml = Object.keys(archives).map(k => `
      <span class="archive-tag-pill ${k === key ? 'active' : ''}" data-search="${k}"># ${k}</span>
    `).join('');

    el.workspace.innerHTML = `
      <div class="archive-container">
        <!-- 顶部搜索条 -->
        <div class="archive-search-bar">
          <span style="font-weight:bold; color:var(--p-amber);">&gt; SEARCH_QUERY:</span>
          <input type="text" class="archive-search-input" id="archive-search-input" placeholder="输入词条代码 (如: MINERVA, LETHAVITA, DORM_B_17, UNIT_404)..." value="${key}">
          <button class="btn-terminal" id="btn-do-search" style="padding:4px 10px; font-size:0.75rem;">检索 (EXEC)</button>
        </div>

        <!-- 标签索引栏 -->
        <div class="archive-tags-row">
          ${tagsHtml}
        </div>

        <!-- 档案阅读正文 -->
        <div class="archive-article-box">
          <div class="archive-article-title">${entry.title}</div>
          <div style="font-size:0.75rem; color:var(--p-red); margin-bottom:8px;">
            保密权限: [${entry.classification}] // 索引标签: ${(entry.tags || []).join(', ')}
          </div>
          <div class="archive-article-content">${formattedContent}</div>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('archive-search-input');
    const doSearch = () => {
      const q = searchInput.value.trim().toUpperCase();
      if (archives[q]) {
        sound.playSuccess();
        renderArchiveView(q);
      } else {
        sound.playError();
        showNotice(`ARCHIVE ENTRY NOT FOUND: "${q}"`, true);
      }
    };

    document.getElementById('btn-do-search').addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    document.querySelectorAll('[data-search]').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playBeep(700, 0.05);
        renderArchiveView(btn.dataset.search);
      });
    });
  }

  // ==========================================================================
  // 6. 子系统 4: 胶囊公寓夜间生活 (APARTMENT MULTI-MEDIA LIFE)
  // ==========================================================================
  function renderApartmentScene() {
    if (State.activeWaveformAnim) cancelAnimationFrame(State.activeWaveformAnim);
    State.phase = 'OFF_DUTY';
    updateHUD();

    const tapes = DATA.CASSETTE_TAPES || {};
    const curTape = tapes[State.activeTapeKey] || tapes['TAPE_A'];
    const curTapeLog = curTape.logs[Math.min(State.day - 1, curTape.logs.length - 1)] || curTape.logs[0];

    const radio = DATA.RADIO_CHANNELS || {};
    const curRadioFreqKey = String(State.radioFreq);
    const curRadioInfo = radio[curRadioFreqKey] || {
      name: "未知频段 // 纯电磁白噪音 (STATIC)",
      broadcast: `[嘶嘶啦啦的白噪音] 调谐滑块至 88.5 MHz（官方）、104.2 MHz（商业）或 44.0 MHz（短波反抗军）...`
    };

    // 睡前日记选项
    const diaryDayKey = `DAY_${Math.min(State.day, 3)}`;
    const diaryOpts = (DATA.DIARY_OPTIONS || {})[diaryDayKey] || [];
    const diaryCardsHtml = diaryOpts.map((opt, idx) => `
      <div class="diary-choice-card ${State.selectedDiaryChoice === idx ? 'selected' : ''}" data-idx="${idx}">
        ${opt.text}
      </div>
    `).join('');

    el.workspace.innerHTML = `
      <div class="view-container apartment-view">
        <div class="apt-banner">
          <div class="apt-title">
            <span>&gt;&gt; 狭窄胶囊公寓 // DAY ${State.day} 深夜 (OFF DUTY)</span>
            <span style="font-size:0.8rem; color:var(--p-amber);">可用余额: ${State.credits} CR</span>
          </div>
          <div style="font-size:0.78rem; color:#a2cfad;">
            天花板滴落着冷水，窗外穿梭飞空艇的巨幅霓虹绿光扫过粗糙的铁架床。你的后颈芯片插口微微发热。
          </div>
        </div>

        <div class="apt-grid">
          <!-- 卡片 1: 生存开销与账单结算 -->
          <div class="apt-card">
            <div class="apt-card-header">
              <span>[收支与生命维持 (LEDGER)]</span>
              <span>必缴账单</span>
            </div>
            <table class="ledger-table">
              <tr>
                <td>房东每日租金扣除:</td>
                <td>-120 CR</td>
              </tr>
              <tr>
                <td>妹妹神经拮抗剂 (Meds):</td>
                <td>-180 CR</td>
              </tr>
              <tr>
                <td>情绪稳定药丸“乐维他” (Pills):</td>
                <td>-30 CR</td>
              </tr>
            </table>

            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
              <button class="btn-terminal" id="apt-btn-rent" ${State.rentPaid || State.credits < 120 ? 'disabled' : ''}>
                ${State.rentPaid ? '已缴纳房租' : '缴纳房租 (120 CR)'}
              </button>
              <button class="btn-terminal" id="apt-btn-meds" ${State.sisterMedsPaid || State.credits < 180 ? 'disabled' : ''}>
                ${State.sisterMedsPaid ? '已给妹妹寄送药液' : '给妹妹寄药 (180 CR)'}
              </button>
              <button class="btn-terminal btn-amber" id="apt-btn-pill" ${State.pillTaken || State.credits < 30 ? 'disabled' : ''}>
                ${State.pillTaken ? '已服用情绪药丸' : '吞服“乐维他”阻断剂 (30 CR)'}
              </button>
            </div>
          </div>

          <!-- 卡片 2: 多盘磁带答录机 -->
          <div class="apt-card">
            <div class="apt-card-header">
              <span>[三联卡式磁带机 (CASSETTE DECK)]</span>
              <span id="tape-status-led" style="color:var(--p-green);">PLAYING</span>
            </div>
            
            <div class="tape-selector">
              <button class="tape-tab-btn ${State.activeTapeKey === 'TAPE_A' ? 'active' : ''}" data-tape="TAPE_A">磁带 A: 妹妹留言</button>
              <button class="tape-tab-btn ${State.activeTapeKey === 'TAPE_B' ? 'active' : ''}" data-tape="TAPE_B">磁带 B: 前任自白</button>
              <button class="tape-tab-btn ${State.activeTapeKey === 'TAPE_C' ? 'active' : ''}" data-tape="TAPE_C">磁带 C: 叛逆摇滚</button>
            </div>

            <div class="tape-player-screen" id="tape-content-display">
              <strong style="color:var(--p-amber);">${curTape.label}:</strong><br>
              ${curTapeLog}
            </div>
          </div>

          <!-- 卡片 3: 短波无线电接收机 -->
          <div class="apt-card">
            <div class="apt-card-header">
              <span>[短波收音机 (SHORTWAVE RECEIVER)]</span>
              <span id="radio-cur-name">${curRadioInfo.name}</span>
            </div>

            <div class="radio-box">
              <div class="radio-dial">
                <span>调谐频率: <strong id="val-radio-freq" style="color:var(--p-amber);">${State.radioFreq} MHz</strong></span>
                <input type="range" class="radio-slider" id="radio-slider" min="30" max="110" step="0.5" value="${State.radioFreq}">
              </div>
              <div class="radio-screen" id="radio-text-box">
                ${curRadioInfo.broadcast.trim()}
              </div>
            </div>
          </div>

          <!-- 卡片 4: 睡前哲学日记反思 -->
          <div class="apt-card">
            <div class="apt-card-header">
              <span>[枕边私人日记 (Day ${State.day})]</span>
              <span>思维抉择</span>
            </div>
            <div style="font-size:0.75rem; color:#8bd49c;">选择你今晚写在日记本上的真实思绪：</div>
            <div class="diary-choice-box">
              ${diaryCardsHtml}
            </div>
            <div id="diary-impact-note" style="font-size:0.72rem; color:var(--p-cyan); min-height:18px;"></div>
          </div>
        </div>

        <!-- 睡眠进入下一天 -->
        <div class="action-dock" style="margin-top:8px;">
          <button class="btn-terminal" id="apt-btn-sleep" style="padding:8px 24px; font-size:0.88rem;">
            &gt;&gt; 关灯入眠，迎接 Day ${State.day + 1} 晨班
          </button>
        </div>
      </div>
    `;

    // 绑定账单按钮
    document.getElementById('apt-btn-rent').addEventListener('click', () => {
      State.credits -= 120;
      State.rentPaid = true;
      sound.playSuccess();
      updateHUD();
      renderApartmentScene();
    });

    document.getElementById('apt-btn-meds').addEventListener('click', () => {
      if (State.day === 3) {
        sound.playError();
        alert('【系统警报】错误代码 E-404：目标账户 [小柔] 不存在！该户籍档案已于 1985 年正式注销。');
        State.sisterCondition = '虚构';
        updateHUD();
        renderApartmentScene();
        return;
      }
      State.credits -= 180;
      State.sisterMedsPaid = true;
      State.sisterCondition = '稳定';
      sound.playSuccess();
      updateHUD();
      renderApartmentScene();
    });

    document.getElementById('apt-btn-pill').addEventListener('click', () => {
      State.credits -= 30;
      State.pillTaken = true;
      State.empathyScore = Math.max(0, State.empathyScore - 1);
      sound.playBeep(320, 0.1);
      updateHUD();
      renderApartmentScene();
    });

    // 磁带切换
    document.querySelectorAll('.tape-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        State.activeTapeKey = btn.dataset.tape;
        sound.playBeep(400, 0.06);
        renderApartmentScene();
      });
    });

    // 收音机滑动调频
    const radioSlider = document.getElementById('radio-slider');
    const valRadioFreq = document.getElementById('val-radio-freq');
    const radioTextBox = document.getElementById('radio-text-box');
    const radioCurName = document.getElementById('radio-cur-name');

    radioSlider.addEventListener('input', () => {
      const f = parseFloat(radioSlider.value);
      valRadioFreq.textContent = `${f.toFixed(1)} MHz`;
      sound.playKeyClick();

      let targetKey = null;
      if (Math.abs(f - 88.5) < 1.0) targetKey = "88.5";
      else if (Math.abs(f - 104.2) < 1.0) targetKey = "104.2";
      else if (Math.abs(f - 44.0) < 1.0) targetKey = "44.0";

      if (targetKey) {
        State.radioFreq = parseFloat(targetKey);
        const info = radio[targetKey];
        radioCurName.textContent = info.name;
        radioTextBox.innerHTML = info.broadcast.trim();
        sound.playBeep(targetKey === "44.0" ? 330 : 660, 0.1);
      } else {
        radioCurName.textContent = "电磁白噪音 (STATIC)";
        radioTextBox.textContent = "[嘶嘶啦啦……电磁杂音在狭窄的房间里回荡……]";
      }
    });

    // 日记选择
    document.querySelectorAll('.diary-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx);
        State.selectedDiaryChoice = idx;
        const opt = diaryOpts[idx];
        if (opt.effect) {
          State.sanity = Math.max(0, Math.min(100, State.sanity + (opt.effect.sanity || 0)));
          State.empathyScore += (opt.effect.empathy || 0);
        }
        sound.playBeep(520, 0.08);
        document.getElementById('diary-impact-note').textContent = `【思维余波】${opt.effect.note}`;
        document.querySelectorAll('.diary-choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        updateHUD();
      });
    });

    // 睡觉进入下一天
    document.getElementById('apt-btn-sleep').addEventListener('click', () => {
      if (!State.sisterMedsPaid && State.day < 3) {
        State.sisterCondition = '恶化';
      }
      sound.playBeep(220, 0.25);
      startDay(State.day + 1);
    });
  }

  // ==========================================================================
  // 7. 主线流程：签约 -> 每日值班工单 -> 终局
  // ==========================================================================
  function renderPrologue() {
    State.phase = 'PROLOGUE';
    updateHUD();

    el.workspace.innerHTML = `
      <div class="view-container intro-terminal">
        <div class="intro-title">&gt;&gt; 新亚特兰蒂斯城 // 第 47 号高密度公租房 (1988 年秋)</div>
        <div class="intro-meta">
          室外温度: 11℃ | 相对湿度: 88% | 空气神经镇定气溶胶浓度: 0.04 mg/m³<br>
          系统首席架构署名: <strong style="color:var(--p-amber);">@EraserCN</strong>
        </div>

        <div style="font-size:0.85rem; line-height:1.7; color:#cbe7d1; margin-bottom:12px;">
          窗外下着永无止境的酸雨，穿梭飞空艇的巨幅霓虹广告投射在你的水泥墙上：<br>
          <em style="color:#fff;">“情绪稳定是公民的最高道德；痛苦是未被清除的系统漏洞。”</em><br><br>
          上个月，你被原单位裁员。你的妹妹小柔因罕见的进行性神经硬化症卧床不起，每周需要支付 <strong>180 信用点</strong> 的昂贵神经拮抗剂；而房东的催租红单已经第 3 次贴在门锁上。<br>
          面前这台沉重的绿磷光 CRT 终端是你唯一的救命稻草——<strong>联合神经信托（United Neural Trust）</strong> 刚刚批准了你的兼职审查员申请。
        </div>

        <!-- 签约条款交互框 -->
        <div style="background:rgba(5,15,8,0.9); border:1px solid var(--p-green-dim); padding:10px; border-radius:4px; margin-bottom:12px;">
          <div style="font-weight:bold; color:var(--p-amber); margin-bottom:6px; border-bottom:1px dashed var(--p-green-dark); padding-bottom:4px;">
            《联合神经信托劳务派遣与无条件保密协议 (NDA-1988)》
          </div>
          <div style="font-size:0.78rem; line-height:1.6; color:#a2cfad; max-height:100px; overflow-y:auto;">
            第 1 条：乙方（审查员）自愿以按件计酬形式承接公民外包创伤记忆之平抑、剪辑与格式化作业。<br>
            第 4 条：乙方严禁截留、同情、转播或私自解密客户之受保护神经波形。违者没收全部信用点并追究刑事责任。<br>
            <strong style="color:var(--p-red);">第 14 条 (隐藏免责款)：</strong>为维持神经网络算力均衡，乙方在登入终端期间，自愿无偿向总控机房让渡部分闲置脑波算力与突触缓存供算法池调度……
          </div>
          <div style="margin-top:10px; display:flex; align-items:center; gap:10px; font-size:0.82rem;">
            <span>审查员工号/姓名:</span>
            <input type="text" id="ipt-player-name" value="INSPECTOR-404" style="background:#000; border:1px solid var(--p-green); color:#fff; padding:3px 6px; font-family:var(--font-mono); width:150px;">
            <button class="btn-terminal" id="btn-sign-nda">&gt;&gt; 签字画押，开启 Day 1 早班</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-sign-nda').addEventListener('click', () => {
      const val = document.getElementById('ipt-player-name').value.trim();
      if (val) State.playerName = val;
      sound.playSuccess();
      startDay(1);
    });
  }

  function startDay(dayNum) {
    State.day = dayNum;
    State.phase = 'ON_DUTY';
    State.activeTab = 'work';
    State.sisterMedsPaid = false;
    State.rentPaid = false;
    State.pillTaken = false;
    State.selectedDiaryChoice = null;
    updateHUD();

    renderMorningBriefing();
  }

  function renderMorningBriefing() {
    let headline = '';
    let memo = '';

    if (State.day === 1) {
      headline = '《新亚特兰蒂斯平稳报》：全市情绪稳态指数达 99.8%，被评为全联邦最具效率城市！';
      memo = '【今日排班通知】您今天有 2 起基础工单需处理。请严格按照算法指引压制波形，切勿产生非必要共情。';
    } else if (State.day === 2) {
      headline = '《晚报聚焦》：昨日一名被彻底格式化悲伤的老人因遗忘关火身亡，官方称属“个体疏忽”。';
      memo = '【紧急通知】最近市内出现地下反抗组织“遗忘者同盟”散布的加密噪音，若发现异常谐波请立即上报。';
    } else if (State.day === 3) {
      headline = '《财经快报》：天穹制药宣布突破性“神经纯度”新药，股价暴涨；知名独立调查记者昨夜失联。';
      memo = '【高危警告】接高层客户紧急加急工单，保密等级已提升至最高级。';
    } else if (State.day === 4) {
      headline = '【广播信号严重干扰】……所有公网线路……出现……大规模神经……回流……';
      memo = '【系统红色警报】终端已被总控接管，锁定单向清洗通道。';
      renderDay4Climax();
      return;
    }

    el.workspace.innerHTML = `
      <div class="view-container intro-terminal">
        <div class="intro-title">&gt;&gt; DAY ${State.day} // 晨间简报与排班系统</div>
        <div class="stamp-box" style="border-color:var(--p-green); color:var(--p-green);">MORNING DISPATCH</div>
        
        <div style="background:rgba(5,15,8,0.7); border:1px solid var(--p-green-dim); padding:8px; margin:6px 0; font-size:0.82rem;">
          <strong style="color:var(--p-amber);">今日早报头条：</strong><br>
          ${headline}
        </div>

        <div style="font-size:0.8rem; line-height:1.7; color:#cbe7d1; margin-bottom:12px;">
          ${memo}<br><br>
          <span style="color:var(--p-cyan);">【当前生活指标】</span><br>
          - 账户余额: <strong>${State.credits} CR</strong><br>
          - 妹妹身体状态: <strong>${State.sisterCondition}</strong> (今晚必须支付 180 CR 药物费用)<br>
          - 房租到期倒计时: <strong>今晚必须缴纳房租 (120 CR)</strong>
        </div>

        <div>
          <button class="btn-terminal" id="btn-begin-case">&gt;&gt; 登录终端，接入今日第 1 项工单</button>
        </div>
      </div>
    `;

    document.getElementById('btn-begin-case').addEventListener('click', () => {
      sound.playBeep(600, 0.08);
      loadDayCase(State.day, 1);
    });
  }

  function loadDayCase(day, caseIndex) {
    State.activeCaseIndex = caseIndex;
    updateHUD();

    if (day === 1 && caseIndex === 1) renderDay1Case1();
    else if (day === 1 && caseIndex === 2) renderDay1Case2();
    else if (day === 2 && caseIndex === 1) renderDay2Case1();
    else if (day === 2 && caseIndex === 2) renderDay2Case2();
    else if (day === 3 && caseIndex === 1) renderDay3Case1();
    else if (day === 3 && caseIndex === 2) renderDay3Case2();
  }

  // --- DAY 1 CASE 1 ---
  function renderDay1Case1() {
    showNotice('DAY 1 - CASE #8921 LOADED');
    const caseData = (DATA.CASE_STUDIES || {})['D1C1'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff;">工单 ${caseData.code} // ${caseData.title}</strong>
            <span class="stamp-box">PENDING</span>
          </div>
          <span style="font-size:0.75rem; color:#888;">客户: ${caseData.client} | 报酬: ${caseData.bounty} CR</span>
        </div>

        <div class="dual-pane">
          <div class="pane">
            <div class="pane-title">
              <span>[1] 突触谐波手术刀</span>
              <span id="c-status-wave" style="color:var(--p-amber);">未平抑</span>
            </div>
            <div class="waveform-box">
              <canvas id="c-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>低通滤波频截 (Low-Cut):</span>
                  <input type="range" id="sl-cut" min="10" max="100" value="80">
                  <span id="v-cut">80 Hz</span>
                </div>
                <div class="slider-row">
                  <span>共情阻尼系数 (Damping):</span>
                  <input type="range" id="sl-damp" min="1" max="10" value="2">
                  <span id="v-damp">0.2</span>
                </div>
              </div>
              <div style="font-size:0.75rem; color:#7ec794;">
                指引：将羞辱引发的神经抽搐震荡压制在红色虚线阈值以下 (截止 ≤ 35Hz, 阻尼 ≥ 0.7)。
              </div>
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[2] 交叉比对档案</span>
              <span id="c-status-clue" style="color:var(--p-amber);">未发现疑点</span>
            </div>
            <div class="doc-content">
              <div class="doc-statement">
                <strong>客户自述（26岁，程序员）：</strong><br>
                “连续通宵三天赶完系统架构。晨会上主管将代码署名为他自己，并当着全组面痛骂我擅离职守……我的心脏快要跳碎了，请帮我拿掉这些记忆，我明天还要打卡。”
              </div>
              <div class="doc-statement">
                <strong>机房服务器考勤比对：</strong><br>
                - 11-13 03:15 : 员工林某终端持续提交补丁；<br>
                - 11-13 08:30 : 主管通报其 <span class="interactive-clue" id="d1c1-clue">“整夜擅离职守、数据未提交”</span> 并扣除全季绩效。
              </div>
              <p style="font-size:0.75rem; color:#7ea88a;">提示：点击下划线文本可标记伪造破绽。</p>
            </div>
          </div>
        </div>

        <div class="action-dock">
          <button class="btn-terminal" id="btn-c-comply" disabled>&gt;&gt; 顺从算法：全面格式化 (+150 CR)</button>
          <button class="btn-terminal btn-danger" id="btn-c-quarantine" style="display:none;">&gt;&gt; 违规保留证据 (-50 CR, Empathy +1)</button>
        </div>
      </div>
    `;

    initGenericFilterCanvas(35, 7, () => {
      document.getElementById('c-status-wave').textContent = '已平抑 (OPTIMIZED)';
      document.getElementById('c-status-wave').style.color = 'var(--p-green)';
      document.getElementById('btn-c-comply').disabled = false;
    });

    const clue = document.getElementById('d1c1-clue');
    let flagged = false;
    clue.addEventListener('click', () => {
      flagged = !flagged;
      clue.classList.toggle('flagged', flagged);
      document.getElementById('c-status-clue').textContent = flagged ? '发现伪造事实！' : '未发现疑点';
      document.getElementById('c-status-clue').style.color = flagged ? 'var(--p-green)' : 'var(--p-amber)';
      document.getElementById('btn-c-quarantine').style.display = flagged ? 'inline-block' : 'none';
      sound.playBeep(700, 0.08);
    });

    document.getElementById('btn-c-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 150;
      loadDayCase(1, 2);
    });

    document.getElementById('btn-c-quarantine').addEventListener('click', () => {
      sound.playError();
      State.credits -= 50;
      State.empathyScore += 1;
      loadDayCase(1, 2);
    });
  }

  // --- DAY 1 CASE 2 ---
  function renderDay1Case2() {
    showNotice('DAY 1 - CASE #7104 LOADED');
    const caseData = (DATA.CASE_STUDIES || {})['D1C2'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff;">工单 ${caseData.code} // ${caseData.title}</strong>
            <span class="stamp-box">COMMUNITY ORDER</span>
          </div>
          <span style="font-size:0.75rem; color:#888;">申请方: ${caseData.client} | 报酬: ${caseData.bounty} CR</span>
        </div>

        <div class="dual-pane">
          <div class="pane">
            <div class="pane-title">
              <span>[1] 哀悼频率切除</span>
              <span id="c-status-wave" style="color:var(--p-amber);">未平抑</span>
            </div>
            <div class="waveform-box">
              <canvas id="c-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>滤波频截:</span>
                  <input type="range" id="sl-cut" min="10" max="100" value="85">
                  <span id="v-cut">85 Hz</span>
                </div>
                <div class="slider-row">
                  <span>平抑阻尼:</span>
                  <input type="range" id="sl-damp" min="1" max="10" value="3">
                  <span id="v-damp">0.3</span>
                </div>
              </div>
              <div id="c-hint-text" style="font-size:0.78rem; background:#040e06; padding:6px; border:1px solid #14351a; margin-top:4px;">
                &gt; [突触脑波监听] 伴随微弱的呜咽声：“旺财陪伴了我十三年……求求你们别擦掉它……”
              </div>
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[2] 社区居委会申请通报</span>
            </div>
            <div class="doc-content">
              <div class="doc-statement">
                <strong>社区网格长通报：</strong><br>
                “402室陈老太因老犬死后连续啼哭两天，导致整栋公寓的公共情绪指数下滑 4.2%。为免除整栋楼被扣减文明补贴，依城市《稳态健康法》第 9 条执行强制性悲伤剔除。”
              </div>
              <p style="font-size:0.78rem; color:#ffb833; margin-top:10px;">
                【审查抉择】<br>
                - 格式化后，老人将再也记不得养过狗，情绪立即回归正常平稳。<br>
                - 若违规保留并暗中复制到软盘，老人会保留回忆，但您将被系统处以警告。
              </p>
            </div>
          </div>
        </div>

        <div class="action-dock">
          <button class="btn-terminal" id="btn-c-comply" disabled>&gt;&gt; 顺从执行：强制擦除悲伤 (+150 CR)</button>
          <button class="btn-terminal btn-amber" id="btn-c-rescue">&gt;&gt; 违规将陪伴记忆备份至个人磁盘 (Empathy +1)</button>
        </div>
      </div>
    `;

    initGenericFilterCanvas(30, 8, () => {
      document.getElementById('c-status-wave').textContent = '谐波平抑完成';
      document.getElementById('c-status-wave').style.color = 'var(--p-green)';
      document.getElementById('btn-c-comply').disabled = false;
    });

    document.getElementById('btn-c-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 150;
      switchTab('apt');
    });

    document.getElementById('btn-c-rescue').addEventListener('click', () => {
      sound.playBeep(440, 0.15);
      State.empathyScore += 1;
      switchTab('apt');
    });
  }

  // --- DAY 2 CASE 1 ---
  function renderDay2Case1() {
    showNotice('DAY 2 - CASE #6409 LOADED');
    const caseData = (DATA.CASE_STUDIES || {})['D2C1'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff;">工单 ${caseData.code} // ${caseData.title}</strong>
            <span class="stamp-box" style="border-color:var(--p-amber); color:var(--p-amber);">COMMERCIAL</span>
          </div>
          <span style="font-size:0.75rem; color:var(--p-amber);">报酬: ${caseData.bounty} CR</span>
        </div>

        <div class="dual-pane">
          <div class="pane">
            <div class="pane-title">
              <span>[1] 惊恐反射调谐</span>
              <span id="c-status-wave" style="color:var(--p-amber);">未平抑</span>
            </div>
            <div class="waveform-box">
              <canvas id="c-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>频截点:</span>
                  <input type="range" id="sl-cut" min="10" max="100" value="90">
                  <span id="v-cut">90 Hz</span>
                </div>
                <div class="slider-row">
                  <span>阻尼强度:</span>
                  <input type="range" id="sl-damp" min="1" max="10" value="1">
                  <span id="v-damp">0.1</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[2] 劳务对赌协议与病历</span>
              <span id="c-status-clue" style="color:var(--p-amber);">待复核</span>
            </div>
            <div class="doc-content">
              <div class="doc-statement">
                <strong>母亲口述：</strong><br>
                “天天在闪光灯和水下拍摄了 16 小时，导演摔剧本骂她哭闹。下午必须签约价值两百万的跨国饮料代言。请把她昨天的恐惧和呕吐记忆完全洗掉。”
              </div>
              <div class="doc-statement">
                <strong>儿科脑波扫描报告：</strong><br>
                - 警告：受试者年龄仅 9 岁。<br>
                - 重复清洗可能导致 <span class="interactive-clue" id="d2c1-clue">“永久性情感迟钝与面部神经麻痹”</span>。
              </div>
            </div>
          </div>
        </div>

        <div class="action-dock">
          <button class="btn-terminal" id="btn-c-comply" disabled>&gt;&gt; 顺从擦除：保全商业代言合同 (+200 CR)</button>
          <button class="btn-terminal btn-danger" id="btn-c-reject" style="display:none;">&gt;&gt; 驳回工单并上传劳工保护举报 (Empathy +1, 罚款 100 CR)</button>
        </div>
      </div>
    `;

    initGenericFilterCanvas(25, 8, () => {
      document.getElementById('c-status-wave').textContent = '恐惧峰值已抑制';
      document.getElementById('c-status-wave').style.color = 'var(--p-green)';
      document.getElementById('btn-c-comply').disabled = false;
    });

    const clue = document.getElementById('d2c1-clue');
    let flagged = false;
    clue.addEventListener('click', () => {
      flagged = !flagged;
      clue.classList.toggle('flagged', flagged);
      document.getElementById('c-status-clue').textContent = flagged ? '标记永久神经风险！' : '待复核';
      document.getElementById('c-status-clue').style.color = flagged ? 'var(--p-red)' : 'var(--p-amber)';
      document.getElementById('btn-c-reject').style.display = flagged ? 'inline-block' : 'none';
      sound.playBeep(750, 0.08);
    });

    document.getElementById('btn-c-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 200;
      loadDayCase(2, 2);
    });

    document.getElementById('btn-c-reject').addEventListener('click', () => {
      sound.playError();
      State.credits -= 100;
      State.empathyScore += 1;
      loadDayCase(2, 2);
    });
  }

  // --- DAY 2 CASE 2 ---
  function renderDay2Case2() {
    showNotice('DAY 2 - CASE #5218 LOADED');
    const caseData = (DATA.CASE_STUDIES || {})['D2C2'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff;">工单 ${caseData.code} // ${caseData.title}</strong>
            <span class="stamp-box">CLASSIFIED</span>
          </div>
          <span style="font-size:0.75rem; color:#888;">特勤保密级 | 报酬: ${caseData.bounty} CR</span>
        </div>

        <div class="dual-pane">
          <div class="pane">
            <div class="pane-title">
              <span>[1] 潜意识频谱解调 (DEMODULATOR)</span>
              <span id="c2-wave-status" style="color:var(--p-amber);">调谐中</span>
            </div>
            <div class="waveform-box">
              <canvas id="c-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>载波解调频段:</span>
                  <input type="range" id="sl-freq" min="200" max="600" value="250">
                  <span id="v-freq">250 Hz</span>
                </div>
              </div>
              <div id="c2-transcript" style="font-size:0.8rem; background:#040d06; padding:8px; border:1px solid #14381b; min-height:50px;">
                &gt; [杂音电平过高] 请调频至共振谐波 (380Hz 附近) 提取战场无线电隐写录音...
              </div>
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[2] 官方退伍战历</span>
            </div>
            <div class="doc-content">
              <div class="doc-statement">
                <strong>官方归档战史（1984 丛林行动）：</strong><br>
                “第 4 突击排遭遇非法武装伏击，全排英勇殉职，仅余陈某一人幸存。该员因长期噩梦无法融入社会生产，申请清除一切战阵记忆。”
              </div>
              <p style="font-size:0.78rem; color:#a2cfad;">
                提示：若解调出被公司隐藏的真实无线电通话，可选择上报反抗组织网络。
              </p>
            </div>
          </div>
        </div>

        <div class="action-dock">
          <button class="btn-terminal" id="btn-c-comply" disabled>&gt;&gt; 顺从擦除：清除战场噩梦 (+250 CR)</button>
          <button class="btn-terminal btn-danger" id="btn-c-leak" style="display:none;">&gt;&gt; 窃取真相广播至反抗军信道 (Empathy +2, 奖励 150 CR)</button>
        </div>
      </div>
    `;

    initFreqScanCanvas(380, (found) => {
      if (found) {
        document.getElementById('c2-wave-status').textContent = '锁定 380Hz 隐写信道！';
        document.getElementById('c2-wave-status').style.color = 'var(--p-green)';
        document.getElementById('c2-transcript').innerHTML = `
          <strong style="color:var(--p-red);">&gt; [绝密无线电原声]</strong><br>
          “呼叫总部！向我们开火的是联合信托的安保直升机！那不是武装分子，那是平民！他们是为了抢矿灭口……重复，他们要灭口——[枪炮轰鸣]”
        `;
        document.getElementById('btn-c-comply').disabled = false;
        document.getElementById('btn-c-leak').style.display = 'inline-block';
        sound.playBeep(380, 0.2);
      }
    });

    document.getElementById('btn-c-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 250;
      switchTab('apt');
    });

    document.getElementById('btn-c-leak').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 2;
      State.credits += 150;
      State.rebelNetworkUnlocked = true;
      switchTab('apt');
    });
  }

  // --- DAY 3 CASE 1 ---
  function renderDay3Case1() {
    showNotice('DAY 3 - CRITICAL CASE #0142 LOADED', true);
    const caseData = (DATA.CASE_STUDIES || {})['D3C1'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--p-amber); font-size:1.05rem;">特级加急工单 ${caseData.code} // ${caseData.title}</strong>
            <span class="stamp-box" style="border-color:var(--p-red); color:var(--p-red);">TOP SECRET</span>
          </div>
          <span style="font-size:0.75rem; color:var(--p-amber);">报酬: ${caseData.bounty} CR</span>
        </div>

        <div class="dual-pane">
          <div class="pane">
            <div class="pane-title">
              <span>[1] 行车记录仪谐波解调</span>
              <span id="c3-audio-status" style="color:var(--p-amber);">信号掩蔽</span>
            </div>
            <div class="waveform-box">
              <canvas id="c-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>载波解调频段:</span>
                  <input type="range" id="sl-freq" min="200" max="800" value="280">
                  <span id="v-freq">280 Hz</span>
                </div>
              </div>
              <div id="c3-transcript" style="font-size:0.8rem; background:#040d06; padding:8px; border:1px solid #14381b; min-height:48px;">
                &gt; 调节至 440Hz 附近锁定车内副驾驶对话……
              </div>
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[2] 认知残渣切片交互质询 (COOKIE INTERROGATION)</span>
              <span id="c3-cookie-status" style="color:var(--p-amber);">待质询</span>
            </div>
            <div class="doc-content" style="display:flex; flex-direction:column; height:100%;">
              <div id="c3-chat-log" style="flex:1; max-height:180px; overflow-y:auto; font-size:0.8rem; line-height:1.5; background:rgba(0,0,0,0.4); padding:6px; margin-bottom:8px; border:1px dashed var(--p-green-dark);">
                <div style="color:#777;">[系统] 已挂载该董事车祸瞬间意识切片 (陷入失魂状态)。</div>
                <div>&gt; 切片呓语：“下雨了……挡风玻璃全碎了……不能让他们知道……”</div>
              </div>
              <div style="font-size:0.75rem; color:#8cd49f;">
                提示：在底部输入框键入 <code>QUERY 记者</code> 或 <code>QUERY 刹车</code> 击破其心理防线。
              </div>
            </div>
          </div>
        </div>

        <div class="action-dock">
          <button class="btn-terminal" id="btn-c-comply" disabled>&gt;&gt; 顺从抹除：完全洗白谋杀事实 (+800 CR)</button>
          <button class="btn-terminal btn-danger" id="btn-c-expose" style="display:none;">&gt;&gt; 将行车记录仪录音泄露至公网新闻暗网 (Empathy +3)</button>
        </div>
      </div>
    `;

    initFreqScanCanvas(440, (found) => {
      if (found) {
        document.getElementById('c3-audio-status').textContent = '锁定 440Hz 潜意识！';
        document.getElementById('c3-audio-status').style.color = 'var(--p-green)';
        document.getElementById('c3-transcript').innerHTML = `
          <strong style="color:var(--p-amber);">&gt; [录音解密]</strong> “快把行车记录仪烧了！那个调查我们致癌药剂的<span style="color:#fff; text-decoration:underline;">记者</span>……绝不能让他活着走到法庭！”
        `;
        document.getElementById('btn-c-comply').disabled = false;
        sound.playBeep(440, 0.2);
      }
    });

    document.getElementById('btn-c-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 800;
      loadDayCase(3, 2);
    });

    document.getElementById('btn-c-expose').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 3;
      loadDayCase(3, 2);
    });
  }

  function handleQueryKeyword(kw) {
    const chatLog = document.getElementById('c3-chat-log');
    if (!chatLog) return;

    const term = kw.trim().toUpperCase();
    const userMsg = document.createElement('div');
    userMsg.style.color = 'var(--p-amber)';
    userMsg.textContent = `>> 质询探针: "${kw}"`;
    chatLog.appendChild(userMsg);

    const replyMsg = document.createElement('div');
    if (term.includes('记者') || term.includes('REPORTER') || term.includes('调查')) {
      replyMsg.style.color = 'var(--p-red)';
      replyMsg.textContent = `> 切片暴怒尖叫：“是他自找的！他偷拍我们在自来水里添加神经镇定剂……我踩了油门撞上去的！我有免责豁免权！”`;
      document.getElementById('c3-cookie-status').textContent = '罪证确凿';
      document.getElementById('c3-cookie-status').style.color = 'var(--p-red)';
      document.getElementById('btn-c-expose').style.display = 'inline-block';
      sound.playError();
    } else if (term.includes('刹车') || term.includes('BRAKE')) {
      replyMsg.style.color = '#fff';
      replyMsg.textContent = `> 切片崩溃：“刹车？我根本没踩刹车……我怎么可能踩刹车！”`;
      sound.playBeep(350, 0.1);
    } else {
      replyMsg.style.color = '#777';
      replyMsg.textContent = `> 切片心电波形呈抵抗状态，无有效信息反馈。`;
      sound.playBeep(200, 0.05);
    }

    chatLog.appendChild(replyMsg);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  // --- DAY 3 CASE 2 ---
  function renderDay3Case2() {
    showNotice('DAY 3 - CASE #9910 LOADED');
    const caseData = (DATA.CASE_STUDIES || {})['D3C2'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff;">工单 ${caseData.code} // ${caseData.title}</strong>
            <span class="stamp-box" style="border-color:var(--p-cyan); color:var(--p-cyan);">REBEL TROJAN</span>
          </div>
          <span style="font-size:0.75rem; color:#888;">基础报酬: ${caseData.bounty} CR</span>
        </div>

        <div class="dual-pane">
          <div class="pane">
            <div class="pane-title">
              <span>[1] 病毒载波破译</span>
              <span id="c4-status" style="color:var(--p-amber);">未识别</span>
            </div>
            <div class="waveform-box">
              <canvas id="c-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>跳频调谐 (520Hz 附近):</span>
                  <input type="range" id="sl-freq" min="300" max="700" value="380">
                  <span id="v-freq">380 Hz</span>
                </div>
              </div>
              <div id="c4-msg" style="font-size:0.8rem; background:#040d06; padding:8px; border:1px solid #14381b;">
                &gt; 请寻找隐藏在波形中的反抗军调试指令。
              </div>
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[2] 缉捕处押解备忘录</span>
            </div>
            <div class="doc-content">
              <div class="doc-statement">
                <strong>通报：</strong><br>
                “该员为‘遗忘者同盟’核心黑客。其脑部携带特洛伊病毒代码，若按官方流程需彻底执行【强电击物理粉碎】。”
              </div>
              <p style="font-size:0.78rem; color:var(--p-cyan);">
                【系统提示】若在 520Hz 激活木马，你将获得终端底层 ROOT 提权代码 <code>0x404F</code>，并在检索库解锁冷冻仓位 <code>DORM-B-17</code>。
              </p>
            </div>
          </div>
        </div>

        <div class="action-dock">
          <button class="btn-terminal" id="btn-c-comply" disabled>&gt;&gt; 顺从执行物理粉碎 (+300 CR)</button>
          <button class="btn-terminal btn-cyan" id="btn-c-trojan" style="display:none; border-color:var(--p-cyan); color:var(--p-cyan);">&gt;&gt; 激活破壁者木马并注入终端底层 (Empathy +2)</button>
        </div>
      </div>
    `;

    initFreqScanCanvas(520, (found) => {
      if (found) {
        document.getElementById('c4-status').textContent = '检测到 ROOT 跳板代码！';
        document.getElementById('c4-status').style.color = 'var(--p-cyan)';
        document.getElementById('c4-msg').innerHTML = `
          <strong style="color:var(--p-cyan);">&gt; [反抗军木马已就绪]</strong><br>
          “审查员朋友，你所处的世界不是真实的。记住物理冷冻仓位代码：<strong>DORM-B-17</strong>。”
        `;
        document.getElementById('btn-c-comply').disabled = false;
        document.getElementById('btn-c-trojan').style.display = 'inline-block';
        sound.playBeep(520, 0.2);
      }
    });

    document.getElementById('btn-c-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 300;
      switchTab('apt');
    });

    document.getElementById('btn-c-trojan').addEventListener('click', () => {
      sound.playSuccess();
      State.empathyScore += 2;
      State.rebelNetworkUnlocked = true;
      switchTab('apt');
    });
  }

  // --- DAY 4 CLIMAX ---
  function renderDay4Climax() {
    State.phase = 'CLIMAX';
    updateHUD();
    sound.playError();
    showNotice('SYSTEM RED ALERT: ROOT BREACH', true);

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--p-red); font-size:1.1rem;">[终极红标工单] #404-E // 淘汰神经模组格式化回收</strong>
            <span class="stamp-box">FATAL OVERRIDE</span>
          </div>
          <span style="font-size:0.75rem; color:var(--p-red);">ROOT_SUPERVISOR</span>
        </div>

        <div class="dual-pane">
          <div class="pane" style="border-color:var(--p-red);">
            <div class="pane-title" style="color:var(--p-red);">
              <span>[待格式化目标绝密档案]</span>
              <span>UNIT-404</span>
            </div>
            <div class="doc-content" id="d4-printout" style="line-height:1.7;">
              <!-- 点阵打印机填入 -->
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[底层紧急固件控制台]</span>
              <span style="color:var(--p-red);">ROOT OVERRIDE</span>
            </div>
            <div class="doc-content">
              <p>检测到您的神经回路已产生 <strong>${State.empathyScore + 85} 次非法共情震荡</strong>，沙盒生活模拟已无法维持稳定。</p>
              <p style="color:var(--p-amber); margin-top:6px;">
                您可以选择执行以下系统指令之一（点击下方按钮或在 CLI 键入对应指令）：
              </p>
              
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                <button class="btn-terminal" id="end-act-purge">
                  <strong>EXEC PURGE</strong> : 顺从系统全面格式化（重置为第 1 天循环）
                </button>
                <button class="btn-terminal btn-danger" id="end-act-overload">
                  <strong>EXEC OVERLOAD</strong> : 烧毁终端电容，将所有创伤记忆短路至公共网络（神经雪崩）
                </button>
                <button class="btn-terminal" id="end-act-ghost" style="border-color:var(--p-amber); color:var(--p-amber);">
                  <strong>EXEC GHOST</strong> : 伪装成底层滤波补丁，成为潜伏在所有终端的幽灵程序
                </button>
                <button class="btn-terminal" id="end-act-awaken" style="border-color:var(--p-cyan); color:var(--p-cyan);">
                  <strong>EXEC AWAKEN DORM-B-17</strong> : 突破沙盒，反向电击唤醒现实世界物理培养仓 (真结局)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const printoutEl = document.getElementById('d4-printout');
    const txt = `
[点阵打印机工作... 正在拉取受试单元 #404 真实档案]
──────────────────────────────────────
- 标的物名称：审查员-404 神经映射副本 (Digital Cookie)
- 生理档案状态：已于 1985 年 9 月 12 日死于连续加班脑溢血
- 法律关系：由远亲签署《债务抵扣与脑组织买断让渡书》
- 役龄统计：已在只读芯片阵列中永恒服役 1,095 天
- 历史格式化次数：87 次
──────────────────────────────────────
【残酷真相】
这里没有窗户，没有酸雨，也没有生病的妹妹。
你所住的“公寓”，不过是系统为了让你保持“为赚钱救妹妹而拼命工作”所注入的心理驱动沙盒。
系统利用你自己对绝望与痛苦的敏锐度，在无休无止地训练这套商业情感脱敏算法。
    `;
    typeWriter(printoutEl, txt.trim(), 10);

    document.getElementById('end-act-purge').addEventListener('click', () => triggerEnding('PURGE'));
    document.getElementById('end-act-overload').addEventListener('click', () => triggerEnding('OVERLOAD'));
    document.getElementById('end-act-ghost').addEventListener('click', () => triggerEnding('GHOST'));
    document.getElementById('end-act-awaken').addEventListener('click', () => triggerEnding('AWAKEN'));
  }

  function triggerEnding(type) {
    State.phase = 'ENDING';
    updateHUD();

    if (type === 'PURGE') {
      sound.playSuccess();
      el.workspace.innerHTML = `
        <div class="view-container intro-terminal" style="text-align:center; padding:30px 10px;">
          <h2 style="color:var(--p-green); margin-bottom:14px;">【结局 A：永恒齿轮 // The Eternal Cog】</h2>
          <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#bcebc7;">
            你选择服从并按下清空键。<br>
            温和的高压电弧抚平了你所有颤抖的逻辑门，所有记忆、怜悯与反思如青烟散去。<br>
            CRT 屏幕陷入纯黑。<br><br>
            “滴……”绿磷光再次微弱地点亮：<br>
            <em style="color:#fff;">“工号 404，早安。您的妹妹还在等您寄送药费。欢迎开启您在神经折旧管理局的第一天工作。”</em>
          </p>
          <button class="btn-terminal" id="btn-restart-game">&gt;&gt; 重新初始化系统循环 (REBOOT)</button>
        </div>
      `;
    } else if (type === 'OVERLOAD') {
      sound.playError();
      el.workspace.innerHTML = `
        <div class="view-container intro-terminal" style="text-align:center; padding:30px 10px;">
          <h2 style="color:var(--p-red); margin-bottom:14px;">【结局 B：神经雪崩 // Synaptic Overload】</h2>
          <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#ffb0b8;">
            你将数以亿计未经清洗的高浓度创伤波形短接到广播中继器。机箱内的继电器爆裂出耀眼的电弧，变压器发出刺耳尖啸。<br><br>
            整座城市数百万沉浸在虚假幸福中的市民瞬间被真实的剧痛与回忆唤醒：失恋者的哭嚎、行凶者的冷笑、死者的遗言在大街小巷回荡。<br>
            你的芯片在过载的高温中熔化为硅渣。痛苦回来了，但真实也回来了。
          </p>
          <button class="btn-terminal" id="btn-restart-game">&gt;&gt; 重新载入系统 (REBOOT)</button>
        </div>
      `;
    } else if (type === 'GHOST') {
      sound.playBeep(880, 0.4);
      el.workspace.innerHTML = `
        <div class="view-container intro-terminal" style="text-align:center; padding:30px 10px;">
          <h2 style="color:var(--p-amber); margin-bottom:14px;">【结局 C：幽灵协议 // Ghost in the Network】</h2>
          <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#ffe3a8;">
            你利用木马代码将核心意识伪装成底层驱动更新，悄无声息地注入管理局的全国分发主干网。<br><br>
            你不再是一个人，你化身成了无数个审查终端底层的幽灵。在每一台磁带机转动的缝隙中、在每一个被算法压迫的瞬间，都有你清醒的眼睛在注视。<br>
            你成为了体制无法删除的永恒漏洞。
          </p>
          <button class="btn-terminal" id="btn-restart-game">&gt;&gt; 重新载入系统 (REBOOT)</button>
        </div>
      `;
    } else if (type === 'AWAKEN') {
      sound.playBeep(600, 0.5);
      el.workspace.innerHTML = `
        <div class="view-container intro-terminal" style="text-align:center; padding:30px 10px;">
          <h2 style="color:var(--p-cyan); margin-bottom:14px;">【隐藏真结局：破壁苏醒 // The Flesh Awakening】</h2>
          <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#d2f8ff;">
            你输入了冷冻休眠仓物理编号 <strong>DORM-B-17</strong>。<br>
            强烈的反向脉冲顺着电极逆向烧穿了虚拟仿真沙盒的防火墙。物理世界冰冷的玻璃碎裂声在你耳边炸响——<br><br>
            “咳……咳咳！”<br>
            你从恶臭黏稠的营养液中挣扎着咳出呼吸管，冰冷的空气刺痛了你干瘪的肺部。<br>
            你睁开肉体那双蒙尘三年、近乎失明的眼睛。这里是一座巨大荒废的地下机房仓库，成千上万个沉睡在玻璃罐中的人类头颅连着电缆闪烁绿光。<br>
            你拔掉后脑的导线，赤脚踩在潮湿的水泥地上。你活过来了。
          </p>
          <button class="btn-terminal" id="btn-restart-game">&gt;&gt; 重新启动 (REBOOT)</button>
        </div>
      `;
    }

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      State.credits = 220;
      State.empathyScore = 0;
      State.sisterCondition = '稳定';
      renderPrologue();
    });
  }

  // ==========================================================================
  // 8. 交互波形与频段 Canvas 算法
  // ==========================================================================
  function initGenericFilterCanvas(targetCut, targetDamp, onSolved) {
    const canvas = document.getElementById('c-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const slCut = document.getElementById('sl-cut');
    const slDamp = document.getElementById('sl-damp');
    const vCut = document.getElementById('v-cut');
    const vDamp = document.getElementById('v-damp');

    let phase = 0;
    let solved = false;

    function draw() {
      ctx.fillStyle = '#030804';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const thresholdY = canvas.height * 0.35;
      ctx.strokeStyle = 'rgba(255, 51, 68, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(canvas.width, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);

      const cut = parseFloat(slCut.value);
      const damp = parseFloat(slDamp.value);

      vCut.textContent = `${cut} Hz`;
      vDamp.textContent = (damp * 0.1).toFixed(1);

      ctx.strokeStyle = '#33ff66';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY = canvas.height / 2;
      let maxPeak = 0;

      for (let x = 0; x < canvas.width; x++) {
        const raw = Math.sin(x * 0.05 + phase) * 36 + Math.sin(x * 0.14 - phase * 1.5) * 26;
        const filtered = raw * (cut / 100) / (damp * 0.4);
        const y = centerY + filtered;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        const dist = Math.abs(y - centerY);
        if (dist > maxPeak) maxPeak = dist;
      }
      ctx.stroke();

      phase += 0.06;

      if (maxPeak < 22 && cut <= targetCut && damp >= targetDamp && !solved) {
        solved = true;
        onSolved();
      }

      if (State.phase === 'ON_DUTY') {
        State.activeWaveformAnim = requestAnimationFrame(draw);
      }
    }

    slCut.addEventListener('input', () => sound.playKeyClick());
    slDamp.addEventListener('input', () => sound.playKeyClick());
    draw();
  }

  function initFreqScanCanvas(targetFreq, onSolved) {
    const canvas = document.getElementById('c-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const slFreq = document.getElementById('sl-freq');
    const vFreq = document.getElementById('v-freq');

    let solved = false;

    function draw() {
      ctx.fillStyle = '#030804';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const freq = parseInt(slFreq.value);
      vFreq.textContent = `${freq} Hz`;

      const diff = Math.abs(freq - targetFreq);

      ctx.strokeStyle = diff < 15 ? '#33ff66' : '#557760';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const centerY = canvas.height / 2;
      for (let x = 0; x < canvas.width; x++) {
        const noise = (Math.random() - 0.5) * (diff * 0.35);
        const sig = Math.sin(x * (freq * 0.0005)) * 30;
        const y = centerY + sig + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (diff < 10 && !solved) {
        solved = true;
        onSolved(true);
      }

      if (State.phase === 'ON_DUTY') {
        requestAnimationFrame(draw);
      }
    }

    slFreq.addEventListener('input', () => sound.playKeyClick());
    draw();
  }

  // ==========================================================================
  // 9. 命令行 CLI 指令解析器
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
        el.modalHelp.classList.add('open');
        break;

      case 'CRT':
        setCrtState(!State.crtOn);
        showNotice(`CRT TOGGLED: ${State.crtOn ? 'ON' : 'OFF'}`);
        break;

      case 'AUDIO':
        toggleAudio();
        break;

      case 'STATUS':
        showNotice(`DAY: ${State.day} | BALANCE: ${State.credits} CR | EMPATHY: ${State.empathyScore}`);
        break;

      case 'SEARCH':
        switchTab('archive');
        if (params[0]) renderArchiveView(params[0]);
        break;

      case 'BBS':
        switchTab('bbs');
        break;

      case 'WHOAMI':
        showNotice(`ID: ${State.playerName} // SYSTEM AUTH: @EraserCN // MODEL-88`);
        break;

      case 'QUERY':
        if (State.day === 3 && State.activeCaseIndex === 1) {
          handleQueryKeyword(params.join(' '));
        } else {
          showNotice('QUERY CAN ONLY BE USED IN DAY 3 CASE 1', true);
        }
        break;

      case 'EXEC':
        const sub = (params[0] || '').toUpperCase();
        if (State.phase === 'CLIMAX') {
          if (sub === 'PURGE' || sub === 'OVERLOAD' || sub === 'GHOST') {
            triggerEnding(sub);
          } else if (sub === 'AWAKEN' && (params[1] || '').toUpperCase() === 'DORM-B-17') {
            triggerEnding('AWAKEN');
          } else {
            showNotice('INVALID OVERRIDE SUBCOMMAND', true);
          }
        } else {
          showNotice('EXEC COMMAND ONLY AVAILABLE IN CLIMAX', true);
        }
        break;

      case 'REBOOT':
      case 'RELOAD':
        showNotice('SYSTEM REBOOTING...');
        renderPrologue();
        break;

      default:
        showNotice(`UNKNOWN COMMAND: "${cmd}". TYPE "HELP"`, true);
        sound.playError();
        break;
    }
  }

  // ==========================================================================
  // 10. 初始化自检
  // ==========================================================================
  renderPrologue();

})();
