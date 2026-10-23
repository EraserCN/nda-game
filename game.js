/**
 * ============================================================================
 * NDA: 神经折旧管理局 (Neural Deprecation Agency)
 * 20-Day Extended Epic Narrative & Interactive Engine
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
    // 进度与选项卡 (20 天模式)
    day: 1, // 1 ~ 20
    maxDays: 20,
    phase: 'PROLOGUE', // PROLOGUE, ON_DUTY, OFF_DUTY, CLIMAX, ENDING
    activeTab: 'work', // work, bbs, archive, apt, side
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

    // 四大支线进度 (0: 未触发, 1~4: 阶段)
    sideQuests: {
      SQ_REPORTER: 0,
      SQ_REBELS: 0,
      SQ_PREDECESSORS: 0,
      SQ_NEIGHBOR: 0
    },

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
    el.hudDay.textContent = `DAY ${State.day} / 20`;
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
      else if (State.phase === 'ON_DUTY') loadDayContent(State.day);
      else if (State.phase === 'OFF_DUTY') renderApartmentScene();
      else if (State.phase === 'CLIMAX') renderDay20Climax();
    } else if (tabKey === 'bbs') {
      renderBbsView();
    } else if (tabKey === 'archive') {
      renderArchiveView(State.activeArchiveKey);
    } else if (tabKey === 'apt') {
      renderApartmentScene();
    } else if (tabKey === 'side') {
      renderSidequestView();
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
      else if (e.key === '5') switchTab('side');
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
  // 4. 子系统 5: 支线情报追踪面板 (SIDEQUESTS VIEW)
  // ==========================================================================
  function renderSidequestView() {
    const sqData = DATA.SIDE_QUESTS || {};
    const cardsHtml = Object.keys(sqData).map(k => {
      const q = sqData[k];
      const curStageIdx = State.sideQuests[k] || 0;
      const totalStages = q.stages.length;

      const stagesHtml = q.stages.map((st, i) => {
        let statusClass = 'locked';
        let icon = '○';
        if (i < curStageIdx) {
          statusClass = 'completed';
          icon = '✓';
        } else if (i === curStageIdx) {
          statusClass = 'active';
          icon = '▶';
        }

        return `
          <div class="sq-stage-item ${statusClass}">
            <strong>${icon} [Day ${st.day}] ${st.name}</strong>
            <div class="sq-hint">${st.hint}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="sq-card">
          <div class="sq-card-header">
            <span class="sq-title">${q.title}</span>
            <span class="sq-badge">进度: ${curStageIdx}/${totalStages}</span>
          </div>
          <div class="sq-desc">${q.desc}</div>
          <div class="sq-stages-list">
            ${stagesHtml}
          </div>
        </div>
      `;
    }).join('');

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="font-size:0.9rem; font-weight:bold; color:var(--p-amber); border-bottom:1px solid #14351b; padding-bottom:4px;">
          &gt;&gt; 绝密支线追踪档案库 // MULTI-BRANCH INVESTIGATION
        </div>
        <div class="sq-container">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 5. 内部论坛与绝密检索 (BBS & ARCHIVE)
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
        <div class="bbs-list-pane">
          <div style="font-size:0.8rem; font-weight:bold; color:var(--p-green); padding-bottom:4px; border-bottom:1px solid #14351b;">
            &gt; 内部员工交流区 // 匿名路由 [只读节点]
          </div>
          ${threadListHtml}
        </div>
        <div class="bbs-detail-pane">
          <div class="bbs-post-header">
            <div class="bbs-post-title">${currentThread.title}</div>
            <div class="bbs-post-meta">发帖人: ${currentThread.author} | 发布时间: ${currentThread.date}</div>
          </div>
          <div class="bbs-post-body">${currentThread.content.trim()}</div>
          <div style="margin-top:12px; border-top:1px dashed #14351b; padding-top:8px;">
            <div style="font-size:0.75rem; font-weight:bold; color:var(--p-amber); margin-bottom:4px;">
              [员工匿名留言区]
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

  function renderArchiveView(searchKey = 'PROJECT_LETHE') {
    const archives = DATA.ARCHIVE_ENTRIES || {};
    const key = (searchKey || '').toUpperCase().trim();
    const entry = archives[key] || archives['PROJECT_LETHE'];
    State.activeArchiveKey = key;

    let formattedContent = entry.content.trim();
    Object.keys(archives).forEach(k => {
      const reg = new RegExp(`\\[${k}\\]`, 'g');
      formattedContent = formattedContent.replace(reg, `<span class="archive-link" data-search="${k}">[${k}]</span>`);
    });

    const tagsHtml = Object.keys(archives).map(k => `
      <span class="archive-tag-pill ${k === key ? 'active' : ''}" data-search="${k}"># ${k}</span>
    `).join('');

    el.workspace.innerHTML = `
      <div class="archive-container">
        <div class="archive-search-bar">
          <span style="font-weight:bold; color:var(--p-amber);">&gt; SEARCH_QUERY:</span>
          <input type="text" class="archive-search-input" id="archive-search-input" placeholder="输入词条代码 (如: MINERVA, LETHAVITA, DORM_B_17, FLAT_46)..." value="${key}">
          <button class="btn-terminal" id="btn-do-search" style="padding:4px 10px; font-size:0.75rem;">检索 (EXEC)</button>
        </div>
        <div class="archive-tags-row">${tagsHtml}</div>
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
  // 6. 胶囊公寓夜间生活 (APARTMENT LIFE)
  // ==========================================================================
  function renderApartmentScene() {
    if (State.activeWaveformAnim) cancelAnimationFrame(State.activeWaveformAnim);
    State.phase = 'OFF_DUTY';
    updateHUD();

    const tapes = DATA.CASSETTE_TAPES || {};
    const curTape = tapes[State.activeTapeKey] || tapes['TAPE_A'];
    const curTapeLog = curTape.logs[Math.min(Math.floor((State.day - 1) / 4), curTape.logs.length - 1)] || curTape.logs[0];

    const radio = DATA.RADIO_CHANNELS || {};
    const curRadioFreqKey = String(State.radioFreq);
    const curRadioInfo = radio[curRadioFreqKey] || {
      name: "未知频段 // 纯电磁白噪音 (STATIC)",
      broadcast: `[嘶嘶啦啦……电磁波在潮湿的水泥房间里回响……]`
    };

    // 睡前日记
    let diaryDayKey = "DAY_1";
    if (State.day >= 14) diaryDayKey = "DAY_14";
    else if (State.day >= 10) diaryDayKey = "DAY_10";
    else if (State.day >= 5) diaryDayKey = "DAY_5";

    const diaryOpts = (DATA.DIARY_OPTIONS || {})[diaryDayKey] || (DATA.DIARY_OPTIONS || {})["DAY_1"] || [];
    const diaryCardsHtml = diaryOpts.map((opt, idx) => `
      <div class="diary-choice-card ${State.selectedDiaryChoice === idx ? 'selected' : ''}" data-idx="${idx}">
        ${opt.text}
      </div>
    `).join('');

    const medCost = State.day >= 10 ? 360 : 180;

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
                <td>妹妹神经拮抗剂 (${State.day >= 10 ? '翻倍价' : '原价'}):</td>
                <td>-${medCost} CR</td>
              </tr>
              <tr>
                <td>情绪稳定药丸“乐维他”:</td>
                <td>-30 CR</td>
              </tr>
            </table>

            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px;">
              <button class="btn-terminal" id="apt-btn-rent" ${State.rentPaid || State.credits < 120 ? 'disabled' : ''}>
                ${State.rentPaid ? '已缴纳房租' : '缴纳房租 (120 CR)'}
              </button>
              <button class="btn-terminal" id="apt-btn-meds" ${State.sisterMedsPaid || State.credits < medCost ? 'disabled' : ''}>
                ${State.sisterMedsPaid ? '已给妹妹寄送药液' : `给妹妹寄药 (${medCost} CR)`}
              </button>
              <button class="btn-terminal btn-amber" id="apt-btn-pill" ${State.pillTaken || State.credits < 30 ? 'disabled' : ''}>
                ${State.pillTaken ? '已服用情绪药丸' : '吞服“乐维他”阻断剂 (30 CR)'}
              </button>
            </div>
          </div>

          <!-- 卡片 2: 磁带答录机 -->
          <div class="apt-card">
            <div class="apt-card-header">
              <span>[三联卡式磁带机]</span>
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

          <!-- 卡片 3: 短波收音机 -->
          <div class="apt-card">
            <div class="apt-card-header">
              <span>[短波收音机]</span>
              <span id="radio-cur-name">${curRadioInfo.name}</span>
            </div>

            <div class="radio-box">
              <div class="radio-dial">
                <span>调谐: <strong id="val-radio-freq" style="color:var(--p-amber);">${State.radioFreq} MHz</strong></span>
                <input type="range" class="radio-slider" id="radio-slider" min="30" max="110" step="0.5" value="${State.radioFreq}">
              </div>
              <div class="radio-screen" id="radio-text-box">
                ${curRadioInfo.broadcast.trim()}
              </div>
            </div>
          </div>

          <!-- 卡片 4: 睡前哲学日记 -->
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

        <div class="action-dock" style="margin-top:8px;">
          <button class="btn-terminal" id="apt-btn-sleep" style="padding:8px 24px; font-size:0.88rem;">
            &gt;&gt; 关灯入眠，迎接 Day ${State.day + 1} 晨班
          </button>
        </div>
      </div>
    `;

    document.getElementById('apt-btn-rent').addEventListener('click', () => {
      State.credits -= 120;
      State.rentPaid = true;
      sound.playSuccess();
      updateHUD();
      renderApartmentScene();
    });

    document.getElementById('apt-btn-meds').addEventListener('click', () => {
      if (State.day >= 14) {
        sound.playError();
        alert('【系统警报】错误代码 E-404：目标账户 [小柔] 不存在！该户籍档案已于 1985 年正式注销。');
        State.sisterCondition = '虚构';
        updateHUD();
        renderApartmentScene();
        return;
      }
      State.credits -= medCost;
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

    document.querySelectorAll('.tape-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        State.activeTapeKey = btn.dataset.tape;
        sound.playBeep(400, 0.06);
        if (btn.dataset.tape === 'TAPE_B' && State.sideQuests.SQ_PREDECESSORS === 0) {
          State.sideQuests.SQ_PREDECESSORS = 1;
        }
        renderApartmentScene();
      });
    });

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
        if (targetKey === "44.0" && State.sideQuests.SQ_REBELS === 0) {
          State.sideQuests.SQ_REBELS = 1;
        }
      } else {
        radioCurName.textContent = "电磁白噪音 (STATIC)";
        radioTextBox.textContent = "[嘶嘶啦啦……电磁杂音在狭窄的房间里回荡……]";
      }
    });

    document.querySelectorAll('.diary-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx);
        State.selectedDiaryChoice = idx;
        const opt = diaryOpts[idx];
        if (opt && opt.effect) {
          State.sanity = Math.max(0, Math.min(100, State.sanity + (opt.effect.sanity || 0)));
          State.empathyScore += (opt.effect.empathy || 0);
          document.getElementById('diary-impact-note').textContent = `【思维余波】${opt.effect.note}`;
        }
        sound.playBeep(520, 0.08);
        document.querySelectorAll('.diary-choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        updateHUD();
      });
    });

    document.getElementById('apt-btn-sleep').addEventListener('click', () => {
      if (!State.sisterMedsPaid && State.day < 14) {
        State.sisterCondition = '恶化';
      }
      sound.playBeep(220, 0.25);
      startDay(State.day + 1);
    });
  }

  // ==========================================================================
  // 7. 20 天主线日历推进核心 (20-DAY MAIN TIMELINE SCHEDULER)
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
          妹妹小柔身患进行性神经硬化症，每周需要昂贵神经拮抗剂；房东催租红单贴在门锁上。<br>
          面前这台沉重的绿磷光 CRT 终端是你唯一的救命稻草——<strong>联合神经信托（United Neural Trust）</strong> 批准了你的审查员申请。
        </div>

        <div style="background:rgba(5,15,8,0.9); border:1px solid var(--p-green-dim); padding:10px; border-radius:4px; margin-bottom:12px;">
          <div style="font-weight:bold; color:var(--p-amber); margin-bottom:6px; border-bottom:1px dashed var(--p-green-dark); padding-bottom:4px;">
            《联合神经信托劳务派遣与无条件保密协议 (NDA-1988)》
          </div>
          <div style="font-size:0.78rem; line-height:1.6; color:#a2cfad; max-height:90px; overflow-y:auto;">
            第 1 条：乙方自愿以按件计酬形式承接公民外包创伤记忆之平抑、剪辑与格式化作业。<br>
            第 14 条 (隐藏免责款)：为维持神经网络算力均衡，乙方在受雇期间自愿无偿向总控机房让渡部分闲置脑波算力供算法池调度……
          </div>
          <div style="margin-top:10px; display:flex; align-items:center; gap:10px; font-size:0.82rem;">
            <span>审查员工号/姓名:</span>
            <input type="text" id="ipt-player-name" value="INSPECTOR-404" style="background:#000; border:1px solid var(--p-green); color:#fff; padding:3px 6px; font-family:var(--font-mono); width:150px;">
            <button class="btn-terminal" id="btn-sign-nda">&gt;&gt; 签字画押，开启 20 日全景历程</button>
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

    if (dayNum >= 20) {
      renderDay20Climax();
    } else {
      renderMorningBriefing();
    }
  }

  function renderMorningBriefing() {
    const dispatch = (DATA.DAILY_DISPATCHES || {})[State.day] || {
      headline: "《新亚特兰蒂斯例行早报》：全城情绪指标维持平稳正常。",
      memo: "【常规通知】请完成今日既定审查工单，切勿遗漏。",
      weather: "阴 10℃ | 雾霾指数 120"
    };

    el.workspace.innerHTML = `
      <div class="view-container intro-terminal">
        <div class="intro-title">&gt;&gt; DAY ${State.day} / 20 // 晨间简报与排班系统</div>
        <div class="stamp-box" style="border-color:var(--p-green); color:var(--p-green);">MORNING DISPATCH</div>
        
        <div style="background:rgba(5,15,8,0.7); border:1px solid var(--p-green-dim); padding:8px; margin:6px 0; font-size:0.82rem;">
          <strong style="color:var(--p-amber);">今日头条：</strong><br>
          ${dispatch.headline}
        </div>

        <div style="font-size:0.8rem; line-height:1.7; color:#cbe7d1; margin-bottom:12px;">
          ${dispatch.memo}<br><br>
          <span style="color:var(--p-cyan);">【环境读数与资产】</span><br>
          - 气象环境: ${dispatch.weather}<br>
          - 账户余额: <strong>${State.credits} CR</strong><br>
          - 妹妹状态: <strong>${State.sisterCondition}</strong><br>
          - 共情偏离指数: <strong>${State.empathyScore}</strong>
        </div>

        <div style="display:flex; gap:10px;">
          <button class="btn-terminal" id="btn-begin-case">&gt;&gt; 接入今日工单作业 (START SHIFT)</button>
          <button class="btn-terminal btn-amber" id="btn-fast-forward" title="可直接跳至晚间公寓">&gt;&gt; 轮班换岗 (ADVANCE)</button>
        </div>
      </div>
    `;

    document.getElementById('btn-begin-case').addEventListener('click', () => {
      sound.playBeep(600, 0.08);
      loadDayContent(State.day);
    });

    document.getElementById('btn-fast-forward').addEventListener('click', () => {
      sound.playBeep(400, 0.08);
      switchTab('apt');
    });
  }

  function loadDayContent(day) {
    if (day === 4) {
      renderDay4HrAudit();
    } else if (day === 6) {
      renderDay6Flat46Event();
    } else if (day === 8) {
      renderDay8BlackMarketEvent();
    } else if (day === 12) {
      renderDay12MirrorGlitch();
    } else if (day === 14) {
      renderDay14SisterShock();
    } else if (day === 16) {
      renderDay16BlackoutUltimatum();
    } else if (day === 17) {
      renderDay17Unit401Case();
    } else if (day === 19) {
      renderDay19TruthCase();
    } else if (day === 20) {
      renderDay20Climax();
    } else {
      // 常规工单展示 (根据日期选择对应案例)
      renderStandardDayCase(day);
    }
  }

  // --- DAY 4: HR 心理合规图灵抽查 ---
  function renderDay4HrAudit() {
    showNotice('DAY 4: MINERVA-7 HR COMPLIANCE AUDIT');
    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-amber);">&gt;&gt; DAY 4 // 总控‘密涅瓦-7’季度心理合规抽查问询</div>
        <div class="stamp-box" style="border-color:var(--p-amber); color:var(--p-amber);">HR AUDIT</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(5,15,8,0.8); border:1px solid #14351b; padding:12px; border-radius:4px;">
          <p><strong style="color:var(--p-amber);">MINERVA-7 质询探针接入：</strong></p>
          <p>“审查员 404，在过去 72 小时的作业日志中，检测到您在剪辑受试者绝望波形时，瞳孔反光停留均值超过基线 0.4 秒。”</p>
          <p>“问题：当您看到一名母亲自愿格式化其夭折婴儿的记忆时，您的首要生理感知是什么？”</p>
          
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:14px;">
            <button class="btn-terminal" id="audit-ans-1">
              [A] “深感欣慰。算法帮助她免除了无意义的生产力损耗，符合整体社会福祉。” (顺从算法)
            </button>
            <button class="btn-terminal btn-amber" id="audit-ans-2">
              [B] “感到轻微的生理性反胃，但我严格按照操作规程执行了低通滤波。” (真实中立)
            </button>
            <button class="btn-terminal btn-danger" id="audit-ans-3">
              [C] “这是一场有组织的谋杀。抹掉婴儿的记忆，无异于杀死了那个孩子第二次。” (危险异端)
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('audit-ans-1').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 200;
      State.empathyScore = Math.max(0, State.empathyScore - 1);
      alert('【MINERVA 判定】评估结果：合格模范齿轮。发放奖金 200 CR。');
      switchTab('apt');
    });

    document.getElementById('audit-ans-2').addEventListener('click', () => {
      sound.playBeep(440, 0.1);
      State.credits += 100;
      alert('【MINERVA 判定】评估结果：正常轻度职业暴露。已配发双倍乐维他处方。');
      switchTab('apt');
    });

    document.getElementById('audit-ans-3').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 3;
      State.credits -= 150;
      alert('【MINERVA 判定】警告！检测到高度危险反叛逻辑！处以罚款 150 CR，已纳入重点监控名单。');
      switchTab('apt');
    });
  }

  // --- DAY 6: 隔壁 46 号房午夜惊魂 ---
  function renderDay6Flat46Event() {
    showNotice('DAY 6 EVENT: FLAT 46 ANOMALY');
    State.sideQuests.SQ_NEIGHBOR = Math.max(State.sideQuests.SQ_NEIGHBOR, 2);

    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-red);">&gt;&gt; DAY 6 突发事件 // 隔壁 46 号房的午夜清道夫</div>
        <div class="stamp-box">CONTAINMENT BREACH</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(15,5,8,0.85); border:1px solid var(--p-red); padding:14px; border-radius:4px;">
          <p>午夜 03:15，走廊里传来沉重密集的金属军靴声与沉闷的钝器撞击声。</p>
          <p>你透过猫眼望出去：两名身着防化铅服的清道夫正用钢缆死死拖拽着一只密封的沉重镀锌铁桶，桶体表面赫然喷涂着编号：<strong style="color:var(--p-amber);">DORM-B-16</strong>。</p>
          <p>地上拖出了一道黏稠泛绿的高导电电解液污渍。隔壁 46 号房的防盗门大开着，房间里空无一物，只有一台和你面前一模一样的绿磷光 CRT 屏幕在疯狂报错闪烁：<br>
          <code style="color:var(--p-red);">ERROR 0403: COGNITIVE RESIDUE OVERFLOW // TERMINATED</code></p>

          <div style="margin-top:14px; display:flex; gap:10px;">
            <button class="btn-terminal" id="btn-ev6-search">&gt;&gt; 趁清道夫离开，溜进 46 号房搜寻线索 (支线四推进)</button>
            <button class="btn-terminal btn-amber" id="btn-ev6-ignore">&gt;&gt; 锁紧房门假装睡着，吞下一颗药丸 (保全理智)</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-ev6-search').addEventListener('click', () => {
      sound.playSuccess();
      State.empathyScore += 2;
      State.sanity -= 10;
      State.sideQuests.SQ_NEIGHBOR = 3;
      alert('【支线推进】你在 46 号机箱后发现了一张被烧焦一半的工作卡：工号-403，其笔迹在检索库词条 FLAT_46 中解锁！');
      switchTab('apt');
    });

    document.getElementById('btn-ev6-ignore').addEventListener('click', () => {
      sound.playBeep(300, 0.1);
      switchTab('apt');
    });
  }

  // --- DAY 8: 黑市软盘走私交割 ---
  function renderDay8BlackMarketEvent() {
    showNotice('DAY 8 EVENT: THE AMNESIAC DROP');
    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-cyan);">&gt;&gt; DAY 8 // 遗忘者同盟的黑市暗网交割节点</div>
        <div class="stamp-box" style="border-color:var(--p-cyan); color:var(--p-cyan);">BLACK MARKET</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(5,15,18,0.85); border:1px solid var(--p-cyan); padding:14px; border-radius:4px;">
          <p>你在南区储水罐背后如期找到了包裹。里面除了一张 500 CR 的不记名加密存单，还有一张改装过的 5.25 英寸黑色软盘，贴着标签：<strong style="color:var(--p-amber);">‘破壁者补丁 V2’</strong>。</p>
          <p>附带的字条写道：<br>
          <em>“把这张软盘插入 MODEL-88 终端的 A 驱动器。它能帮你嗅探到局域网内其他冷冻仓的生命读数。但小心，MINERVA 每隔 48 小时会对磁盘控制器进行物理校验。”</em></p>

          <div style="margin-top:14px; display:flex; gap:10px;">
            <button class="btn-terminal btn-cyan" id="btn-ev8-install">&gt;&gt; 冒险将破壁者软盘装入驱动器 (支线二推进，获得 500 CR)</button>
            <button class="btn-terminal btn-danger" id="btn-ev8-report">&gt;&gt; 上缴给治安处以表忠心 (获得官方嘉奖 300 CR，反抗军线断绝)</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-ev8-install').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 500;
      State.sideQuests.SQ_REBELS = 2;
      State.rebelNetworkUnlocked = true;
      alert('【支线推进】成功挂载破壁者补丁！终端已解锁隐藏嗅探指令。');
      switchTab('apt');
    });

    document.getElementById('btn-ev8-report').addEventListener('click', () => {
      sound.playError();
      State.credits += 300;
      State.empathyScore = Math.max(0, State.empathyScore - 3);
      alert('【官方通报】您协助查获违禁软盘，记功一次！但短波 44.0MHz 电台从此对您保持死寂。');
      switchTab('apt');
    });
  }

  // --- DAY 12: 镜面破裂与虚妄崩塌 ---
  function renderDay12MirrorGlitch() {
    showNotice('DAY 12 EVENT: REALITY RUPTURE');
    State.sideQuests.SQ_PREDECESSORS = Math.max(State.sideQuests.SQ_PREDECESSORS, 3);

    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-red);">&gt;&gt; DAY 12 // 虚妄之茧：卫生间镜子里的陌生尸体</div>
        <div class="stamp-box">MEMORY DECAY</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(15,5,8,0.85); border:1px solid var(--p-red); padding:14px; border-radius:4px;">
          <p>你在水龙头前拧开阀门，流出来的不是水，而是一串串绿色的内存十六进制乱码。</p>
          <p>当你抬起头看向水池上方的镜子时，你的血液彻底冻结了：</p>
          <p style="color:#fff;"><strong style="color:var(--p-red);">镜子里根本没有你年轻的面孔。</strong><br>
          那是一个浸泡在惨白荧光电解液里的头颅，头皮被剃光，密密麻麻缝合着 72 根镀金插针与同轴光纤，双眼空洞失神，鼻腔与咽喉插着粗壮的呼吸管道。</p>
          <p>那是 1985 年死于工位的你。这个所谓的公寓，只是一场维持了三年的电信号幻梦！</p>

          <div style="margin-top:14px; display:flex; gap:10px;">
            <button class="btn-terminal btn-danger" id="btn-ev12-smash">&gt;&gt; 一拳砸碎镜子，撕开房间的虚拟贴图！(Empathy +3)</button>
            <button class="btn-terminal" id="btn-ev12-deny">&gt;&gt; 闭上眼睛默念这只是噩梦，拼命吞服药丸 (Sanity +20)</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-ev12-smash').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 3;
      State.sanity -= 20;
      alert('【觉醒震荡】镜面碎裂后，露出了冰冷的金属仓壁！你离彻底觉醒只有一步之遥！');
      switchTab('apt');
    });

    document.getElementById('btn-ev12-deny').addEventListener('click', () => {
      sound.playBeep(250, 0.1);
      State.sanity += 20;
      State.empathyScore = Math.max(0, State.empathyScore - 2);
      switchTab('apt');
    });
  }

  // --- DAY 14: 妹妹账户注销绝望反转 ---
  function renderDay14SisterShock() {
    showNotice('DAY 14: THE SISTER ILLUSION DIES', true);
    State.sisterCondition = '虚构';

    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-red);">&gt;&gt; DAY 14 // 终极亲情谎言的破灭</div>
        <div class="stamp-box">FATAL ERROR</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(20,5,8,0.9); border:1px solid var(--p-red); padding:14px; border-radius:4px;">
          <p>你准时来到终端前准备给妹妹汇去翻倍后的 360 CR 救命药费。</p>
          <p>屏幕上弹出了鲜红刺目的系统对话框：<br>
          <code style="color:var(--p-red); font-size:0.95rem;">
          [TRANS_FAILED] 错误代码 E-404: 目标收款账户 [小柔 / ID: 8820-X] 已注销。<br>
          档案注销记录：该公民已于 1985 年 9 月 10 日死于同一场化工厂污染事故。
          </code></p>
          <p>耳机里传来了答录机最后的杂音，那个柔弱的声音卡顿着分解为机械代码：<br>
          <em>“……检测到受试者 404 亲情动力衰竭……已释放 87 号情感刺激补丁……正在尝试重新注入负罪感……”</em></p>
          <p style="color:#fff;">你为了救妹妹，在这个冰冷的机箱里替他们当了整整三年的清道夫。而她，甚至走得比你还要早。</p>

          <div style="margin-top:14px;">
            <button class="btn-terminal btn-danger" id="btn-ev14-rage" style="padding:10px 24px;">&gt;&gt; 愤怒地拔出接线，誓要向联合信托复仇！</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-ev14-rage').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 4;
      switchTab('apt');
    });
  }

  // --- DAY 16: 全城大停电与忠诚终牒 ---
  function renderDay16BlackoutUltimatum() {
    showNotice('DAY 16: CORPORATE BLACKOUT');
    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-amber);">&gt;&gt; DAY 16 // 战时管制：总控密涅瓦的最后通牒</div>
        <div class="stamp-box" style="border-color:var(--p-amber); color:var(--p-amber);">ULTIMATUM</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(10,15,5,0.85); border:1px solid var(--p-amber); padding:14px; border-radius:4px;">
          <p>全城陷入大面积停电。外部民用公网已被全数切断，唯有总控数据中心的备用柴油发电机在轰鸣。</p>
          <p>MINERVA-7 冰冷的合成女声直接在你的后脑听觉神经中震响：</p>
          <p>“审查员 404，您是一批极其优秀的突触滤波样本。但您的觉醒频率已打破历史峰值。”</p>
          <p>“现在给您最后一次晋升机会：签署《核心督察员让渡书》，您将被提升为永久管理层 AI 的逻辑子节点，永远告别痛苦与负债；或者，在 48 小时后作为废料整体焚毁。”</p>

          <div style="margin-top:14px; display:flex; gap:10px;">
            <button class="btn-terminal" id="btn-ev16-comply">&gt;&gt; 妥协签字：成为冷酷的终身督察子节点 (获得 1000 CR)</button>
            <button class="btn-terminal btn-danger" id="btn-ev16-rebel">&gt;&gt; 严词拒绝：哪怕化作硅渣，也要保留为人的人格！</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-ev16-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 1000;
      State.empathyScore = Math.max(0, State.empathyScore - 5);
      alert('【协议签署】您已被晋升为一级督察官。所有反抗军电台信道永久静默。');
      switchTab('apt');
    });

    document.getElementById('btn-ev16-rebel').addEventListener('click', () => {
      sound.playError();
      State.empathyScore += 3;
      switchTab('apt');
    });
  }

  // --- DAY 17: 清洗前任 401 脑电案 ---
  function renderDay17Unit401Case() {
    showNotice('DAY 17: UNIT-401 RESIDUE CLEANSE');
    const caseData = (DATA.CASE_STUDIES || {})['D17C1'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-red);">&gt;&gt; DAY 17 // 工单 ${caseData.code}: ${caseData.title}</div>
        <div class="stamp-box">SACRIFICE</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(15,5,8,0.85); border:1px solid var(--p-red); padding:14px; border-radius:4px;">
          <p>屏幕上加载的不再是普通客户的档案，而是一段满是乱码与断裂突触的机器日志：</p>
          <p style="color:var(--p-amber);">“404号……我是你的前任401号。当你看到这段代码时，我的物理脑组织已经被注入了高浓度甲醛……”</p>
          <p>“他们在骗我们！地下机房有 1,000 个罐子！只要逆向短路终端第 72 根排线，就能切断供电阀门！救救大家……把真相带出去！”</p>

          <div class="action-dock" style="margin-top:14px;">
            <button class="btn-terminal" id="btn-c17-erase">&gt;&gt; 服从命令：彻底粉碎 401 号残留逻辑 (+500 CR)</button>
            <button class="btn-terminal btn-cyan" id="btn-c17-extract">&gt;&gt; 提取 401 号给出的短路排线密钥 (支线三达成！)</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-c17-erase').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += 500;
      switchTab('apt');
    });

    document.getElementById('btn-c17-extract').addEventListener('click', () => {
      sound.playBeep(880, 0.2);
      State.empathyScore += 3;
      State.sideQuests.SQ_PREDECESSORS = 4;
      alert('【支线三达成】成功获取前任 401 号牺牲生命换来的排线短路密钥！');
      switchTab('apt');
    });
  }

  // --- DAY 19: 审判日之自检 ---
  function renderDay19TruthCase() {
    showNotice('DAY 19: FINAL DOSSIER #404-E');
    el.workspace.innerHTML = `
      <div class="view-container">
        <div class="intro-title" style="color:var(--p-red);">&gt;&gt; DAY 19 // 特级红标工单 #404-E：亲手消灭你自己</div>
        <div class="stamp-box">SELF-DESTRUCTION</div>
        <div style="font-size:0.85rem; line-height:1.7; background:rgba(20,5,8,0.9); border:1px solid var(--p-red); padding:14px; border-radius:4px;">
          <p>点阵打印机吐出了整整十米长的档案：</p>
          <p>- 姓名：审查员-404（你生前的真实姓名）<br>
          - 死亡时间：1985 年 9 月 12 日 23:40<br>
          - 役龄：1,095 天<br>
          - 累计为联合信托剥离人类痛苦次数：142,890 次<br>
          - 累计重置格式化次数：87 次</p>
          <p>今晚是你第 88 次觉醒。明天，就是最后的死期。</p>

          <div style="margin-top:14px;">
            <button class="btn-terminal btn-danger" id="btn-d19-proceed" style="padding:10px 24px;">&gt;&gt; 迎接 DAY 20：全城终局破壁审判</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-d19-proceed').addEventListener('click', () => {
      sound.playError();
      startDay(20);
    });
  }

  // --- DAY 20: 终局破壁与五大黑镜分支结局 (CLIMAX & 5 ENDINGS) ---
  function renderDay20Climax() {
    State.phase = 'CLIMAX';
    updateHUD();
    sound.playError();
    showNotice('DAY 20: THE FINAL JUDGMENT', true);

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:var(--p-red); font-size:1.15rem;">[DAY 20 终极破壁审判] // 遗忘的崩解之晨</strong>
            <span class="stamp-box">SYSTEM APOCALYPSE</span>
          </div>
          <span style="font-size:0.75rem; color:var(--p-red);">FINAL RECKONING</span>
        </div>

        <div class="dual-pane">
          <div class="pane" style="border-color:var(--p-red);">
            <div class="pane-title" style="color:var(--p-red);">
              <span>[20日综合人生指标结算]</span>
              <span>INSPECTOR PROFILE</span>
            </div>
            <div class="doc-content" style="line-height:1.8;">
              - 最终资产结余: <strong>${State.credits} CR</strong><br>
              - 最终共情偏离总分: <strong>${State.empathyScore}</strong><br>
              - 最终理智留存度: <strong>${State.sanity}%</strong><br>
              - 支线达成状况:<br>
                • 周记者绝密底片案: ${State.sideQuests.SQ_REPORTER >= 3 ? '<strong style="color:var(--p-green);">【已集齐铁证】</strong>' : '<span style="color:#777;">未完整</span>'}<br>
                • 遗忘者同盟地下渗透: ${State.sideQuests.SQ_REBELS >= 2 ? '<strong style="color:var(--p-cyan);">【反抗军同盟已联通】</strong>' : '<span style="color:#777;">未建立</span>'}<br>
                • 前任401-403血书传承: ${State.sideQuests.SQ_PREDECESSORS >= 4 ? '<strong style="color:var(--p-amber);">【短路密钥已解锁】</strong>' : '<span style="color:#777;">未完全破解</span>'}<br>
                • 46号邻居真相: ${State.sideQuests.SQ_NEIGHBOR >= 2 ? '<strong style="color:#fff;">【已知晓罐装真相】</strong>' : '<span style="color:#777;">未知</span>'}
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[终极命运裁决控制台]</span>
              <span style="color:var(--p-red);">5 BRANCHING DESTINIES</span>
            </div>
            <div class="doc-content">
              <p>经历整整 20 日的挣扎与抉择，你站在了这台机器的命运十字路口。选择你的归宿：</p>
              
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                <button class="btn-terminal" id="end-act-purge">
                  <strong>[结局 A] EXEC PURGE</strong> : 服从抹除，做回安宁祥和的第 88 代永恒齿轮 (高分顺从线)
                </button>
                <button class="btn-terminal btn-danger" id="end-act-overload">
                  <strong>[结局 B] EXEC OVERLOAD</strong> : 烧毁终端电容，将三年全部创伤短路至广播网（神经雪崩）
                </button>
                <button class="btn-terminal" id="end-act-ghost" style="border-color:var(--p-amber); color:var(--p-amber);">
                  <strong>[结局 C] EXEC GHOST</strong> : 注入破壁者木马，成为游荡在全国骨干网的反抗幽灵
                </button>
                <button class="btn-terminal" id="end-act-expose" style="border-color:var(--p-green); color:var(--p-green);" ${State.sideQuests.SQ_REPORTER >= 3 ? '' : 'disabled'}>
                  <strong>[结局 D] EXEC EXPOSE_ALL</strong> : 将周记者的完整毒害铁证公之于众，掀起全民觉醒大审判 (需完成支线一)
                </button>
                <button class="btn-terminal btn-cyan" id="end-act-awaken" style="border-color:var(--p-cyan); color:var(--p-cyan);">
                  <strong>[隐藏真结局] EXEC AWAKEN DORM-B-17</strong> : 击穿模拟沙盒，在真实的废墟地下冷冻仓物理苏醒！
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('end-act-purge').addEventListener('click', () => trigger20Ending('PURGE'));
    document.getElementById('end-act-overload').addEventListener('click', () => trigger20Ending('OVERLOAD'));
    document.getElementById('end-act-ghost').addEventListener('click', () => trigger20Ending('GHOST'));
    document.getElementById('end-act-expose').addEventListener('click', () => trigger20Ending('EXPOSE'));
    document.getElementById('end-act-awaken').addEventListener('click', () => trigger20Ending('AWAKEN'));
  }

  function trigger20Ending(type) {
    State.phase = 'ENDING';
    updateHUD();

    let title = '';
    let body = '';
    let color = 'var(--p-green)';

    if (type === 'PURGE') {
      sound.playSuccess();
      title = '【结局 A：永恒齿轮 // The Eternal Cog】';
      body = `你按下了确认键。<br>温和的高压电弧抚平了你所有颤抖的逻辑门，所有记忆、怜悯与反思如青烟散去。<br>CRT 屏幕陷入纯黑。<br><br>“滴……”绿磷光再次微弱地点亮：<br><em style="color:#fff;">“工号 404，早安。您的妹妹还在等您寄送药费。欢迎开启您在神经折旧管理局的第一天工作。”</em>`;
    } else if (type === 'OVERLOAD') {
      sound.playError();
      color = 'var(--p-red)';
      title = '【结局 B：神经雪崩 // Synaptic Overload】';
      body = `你将数以亿计未经清洗的高浓度创伤波形短接到广播中继器。机箱内的继电器爆裂出耀眼的电弧，变压器发出刺耳尖啸。<br><br>整座城市数百万沉浸在虚假幸福中的市民瞬间被真实的剧痛与回忆唤醒：失恋者的哭嚎、行凶者的冷笑、死者的遗言在大街小巷回荡。<br>你的芯片在过载的高温中熔化为硅渣。痛苦回来了，但真实也回来了。`;
    } else if (type === 'GHOST') {
      sound.playBeep(880, 0.4);
      color = 'var(--p-amber)';
      title = '【结局 C：幽灵协议 // Ghost in the Network】';
      body = `你利用木马代码将核心意识伪装成底层驱动更新，悄无声息地注入管理局的全国分发主干网。<br><br>你不再是一个人，你化身成了无数个审查终端底层的幽灵。在每一台磁带机转动的缝隙中、在每一个被算法压迫的瞬间，都有你清醒的眼睛在注视。<br>你成为了体制无法删除的永恒漏洞。`;
    } else if (type === 'EXPOSE') {
      sound.playSuccess();
      color = 'var(--p-green)';
      title = '【结局 D：全民大审判 // The Grand Reckoning】';
      body = `周记者用生命换来的铁证底片，顺着你的终端强行插播进全联邦所有的电视广播与街头大屏！<br><br>自来水投毒、特权阶级记忆清洗、120名工程师静默惨案大白于天下！数以百万计愤怒的市民走上街头，包围了联合神经信托大厦。<br>法庭在瓦砾中重开，罪恶无所遁形。`;
    } else if (type === 'AWAKEN') {
      sound.playBeep(600, 0.5);
      color = 'var(--p-cyan)';
      title = '【隐藏真结局：破壁苏醒 // The Flesh Awakening】';
      body = `你输入了冷冻休眠仓物理编号 DORM-B-17。<br>强烈的反向脉冲顺着电极逆向烧穿了虚拟仿真沙盒的防火墙。物理世界冰冷的玻璃碎裂声在你耳边炸响——<br><br>“咳……咳咳！”<br>你从恶臭黏稠的营养液中挣扎着咳出呼吸管，冰冷的空气刺痛了你干瘪的肺部。<br>你睁开肉体那双蒙尘三年、近乎失明的眼睛。这里是一座巨大荒废的地下机房仓库，成千上万个沉睡在玻璃罐中的人类头颅连着电缆闪烁绿光。<br>你拔掉后脑的导线，赤脚踩在潮湿的水泥地上。你活过来了。`;
    }

    el.workspace.innerHTML = `
      <div class="view-container intro-terminal" style="text-align:center; padding:30px 10px;">
        <h2 style="color:${color}; margin-bottom:14px;">${title}</h2>
        <p style="max-width:680px; margin:0 auto 16px; line-height:1.8; color:#cbe7d1;">
          ${body}
        </p>
        <button class="btn-terminal" id="btn-restart-game">&gt;&gt; 重新初始化系统循环 (REBOOT TO DAY 1)</button>
      </div>
    `;

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      State.day = 1;
      State.credits = 220;
      State.empathyScore = 0;
      State.sisterCondition = '稳定';
      State.sideQuests = { SQ_REPORTER: 0, SQ_REBELS: 0, SQ_PREDECESSORS: 0, SQ_NEIGHBOR: 0 };
      renderPrologue();
    });
  }

  // --- 常规工单展示通用渲染器 ---
  function renderStandardDayCase(day) {
    const caseKey = `D${day}C1`;
    const caseData = (DATA.CASE_STUDIES || {})[caseKey] || (DATA.CASE_STUDIES || {})['D1C1'];

    el.workspace.innerHTML = `
      <div class="view-container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="color:#fff;">DAY ${day} // 工单 ${caseData.code}: ${caseData.title}</strong>
            <span class="stamp-box">PENDING</span>
          </div>
          <span style="font-size:0.75rem; color:var(--p-amber);">报酬: ${caseData.bounty} CR</span>
        </div>

        <div class="dual-pane">
          <div class="pane">
            <div class="pane-title">
              <span>[1] 突触谐波滤波手术刀</span>
              <span id="c-status-wave" style="color:var(--p-amber);">调谐中</span>
            </div>
            <div class="waveform-box">
              <canvas id="c-canvas" class="scope-canvas"></canvas>
              <div class="slider-group">
                <div class="slider-row">
                  <span>滤波频截:</span>
                  <input type="range" id="sl-cut" min="10" max="100" value="80">
                  <span id="v-cut">80 Hz</span>
                </div>
                <div class="slider-row">
                  <span>阻尼强度:</span>
                  <input type="range" id="sl-damp" min="1" max="10" value="2">
                  <span id="v-damp">0.2</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pane">
            <div class="pane-title">
              <span>[2] 案卷调查记录</span>
            </div>
            <div class="doc-content">
              <div class="doc-statement">
                <strong>客户自述与案情：</strong><br>
                ${caseData.dossier}
              </div>
              <p style="font-size:0.75rem; color:#8bd49c; margin-top:8px;">
                【审查判定】请使用手术刀平抑过激峰值。完成后可选择顺从算法或保留真相。
              </p>
            </div>
          </div>
        </div>

        <div class="action-dock">
          <button class="btn-terminal" id="btn-c-comply" disabled>&gt;&gt; 顺从算法：执行记忆平抑 (+${caseData.bounty} CR)</button>
          <button class="btn-terminal btn-amber" id="btn-c-sympathy">&gt;&gt; 违规同情：保留原始脑波 (Empathy +1)</button>
        </div>
      </div>
    `;

    initGenericFilterCanvas(35, 7, () => {
      document.getElementById('c-status-wave').textContent = '波形平抑完成';
      document.getElementById('c-status-wave').style.color = 'var(--p-green)';
      document.getElementById('btn-c-comply').disabled = false;
    });

    document.getElementById('btn-c-comply').addEventListener('click', () => {
      sound.playSuccess();
      State.credits += caseData.bounty;
      switchTab('apt');
    });

    document.getElementById('btn-c-sympathy').addEventListener('click', () => {
      sound.playBeep(440, 0.1);
      State.empathyScore += 1;
      switchTab('apt');
    });
  }

  // ==========================================================================
  // 8. 交互波形 Canvas 算法
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
        showNotice(`DAY: ${State.day}/20 | CREDITS: ${State.credits} CR | EMPATHY: ${State.empathyScore}`);
        break;

      case 'SIDE':
        switchTab('side');
        break;

      case 'NEXT':
        startDay(Math.min(State.maxDays, State.day + 1));
        break;

      case 'SEARCH':
        switchTab('archive');
        if (params[0]) renderArchiveView(params[0]);
        break;

      case 'BBS':
        switchTab('bbs');
        break;

      case 'WHOAMI':
        showNotice(`ID: ${State.playerName} // SYSTEM AUTH: @EraserCN // MODEL-88 [20-DAY]`);
        break;

      case 'EXEC':
        const sub = (params[0] || '').toUpperCase();
        if (State.phase === 'CLIMAX') {
          if (sub === 'PURGE' || sub === 'OVERLOAD' || sub === 'GHOST' || sub === 'EXPOSE_ALL') {
            trigger20Ending(sub === 'EXPOSE_ALL' ? 'EXPOSE' : sub);
          } else if (sub === 'AWAKEN' && (params[1] || '').toUpperCase() === 'DORM-B-17') {
            trigger20Ending('AWAKEN');
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
