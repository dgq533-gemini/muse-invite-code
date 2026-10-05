/* ============================================================
   Muse Invites — 核心逻辑
   ============================================================ */

(() => {
  'use strict';

  const STORAGE_KEY = 'muse_codes_v4';
  const FEATURED_KEY = 'muse_featured_v2';
  const VOTE_KEY = 'muse_votes_v2';

  // 预设邀请码（模拟目标站数据，总次数 30，48 小时有效）
  const SEED_CODES = [
    { code: 'VQREI1', working: 14, broken: 2, drawn: 17, copied: 15, lastConfirmed: Date.now() - 3600000, sharedAt: Date.now() - 36000000 },
    { code: 'HU24PQ', working: 12, broken: 1, drawn: 16, copied: 15, lastConfirmed: Date.now() - 14400000, sharedAt: Date.now() - 72000000 },
    { code: 'RCPT7C', working: 6, broken: 1, drawn: 13, copied: 24, lastConfirmed: Date.now() - 345600000, sharedAt: Date.now() - 360000000 },
    { code: 'JOUCNP', working: 7, broken: 3, drawn: 14, copied: 20, lastConfirmed: Date.now() - 7200000, sharedAt: Date.now() - 108000000 },
    { code: '1C7SYR', working: 13, broken: 1, drawn: 18, copied: 24, lastConfirmed: Date.now() - 32400000, sharedAt: Date.now() - 144000000 },
    { code: 'VVYGJ9', working: 9, broken: 2, drawn: 23, copied: 18, lastConfirmed: Date.now() - 10800000, sharedAt: Date.now() - 216000000 },
    { code: 'Z78ZT7', working: 12, broken: 0, drawn: 6, copied: 20, lastConfirmed: Date.now() - 21600000, sharedAt: Date.now() - 129600000 },
    { code: 'FILVZM', working: 14, broken: 2, drawn: 12, copied: 13, lastConfirmed: Date.now() - 3600000, sharedAt: Date.now() - 162000000 },
    { code: '5RP0IT', working: 14, broken: 2, drawn: 11, copied: 14, lastConfirmed: Date.now() - 345600000, sharedAt: Date.now() - 504000000 },
    { code: '24JCEG', working: 10, broken: 2, drawn: 24, copied: 10, lastConfirmed: Date.now() - 259200000, sharedAt: Date.now() - 432000000 },
    { code: 'L6PJN8', working: 13, broken: 1, drawn: 10, copied: 14, lastConfirmed: Date.now() - 259200000, sharedAt: Date.now() - 180000000 },
    { code: 'BJ4XO9', working: 9, broken: 2, drawn: 6, copied: 22, lastConfirmed: Date.now() - 259200000, sharedAt: Date.now() - 288000000 },
    { code: 'MUSE01', working: 14, broken: 1, drawn: 15, copied: 24, lastConfirmed: Date.now() - 7200000, sharedAt: Date.now() - 3600000 },
    { code: 'MUSE02', working: 11, broken: 1, drawn: 12, copied: 13, lastConfirmed: Date.now() - 10800000, sharedAt: Date.now() - 7200000 },
    { code: 'K4M2QP', working: 12, broken: 1, drawn: 8, copied: 16, lastConfirmed: Date.now() - 14400000, sharedAt: Date.now() - 1800000 },
  ];

  function loadCodes() {
    let codes;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) codes = JSON.parse(raw);
    } catch (e) {}
    if (!codes) {
      codes = [...SEED_CODES];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    }
    // 确保推荐码 Z78ZT7 失效次数为 0
    const z78 = codes.find(c => c.code === 'Z78ZT7');
    if (z78 && z78.broken !== 0) {
      z78.broken = 0;
      saveCodes(codes);
    }
    return codes;
  }
  function saveCodes(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
  function getFeatured() {
    // 暂固定推荐码为 Z78ZT7
    return ['Z78ZT7'];
  }
  function getVotes() {
    try { return JSON.parse(localStorage.getItem(VOTE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveVotes(v) { localStorage.setItem(VOTE_KEY, JSON.stringify(v)); }

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min} 分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 小时前`;
    const day = Math.floor(hr / 24);
    return `${day} 天前`;
  }

  // 计算工作率
  function calcRate(c) {
    const total = c.working + c.broken;
    if (total === 0) return 90;
    return Math.round((c.working / total) * 100);
  }
  // 计算剩余次数（估算）
  function calcRemaining(c) {
    const used = c.working + c.copied * 0.5;
    return Math.max(0, Math.round(30 - used));
  }
  // 判断是否过期（分享后超过 48 小时）
  const EXPIRE_MS = 48 * 3600 * 1000;
  function isExpired(c) {
    return (Date.now() - c.sharedAt) > EXPIRE_MS;
  }
  function rateClass(rate) {
    if (rate >= 85) return '';
    if (rate >= 70) return 'mid';
    return 'low';
  }

  let currentSort = 'likely';
  let currentDraw = null;

  // ---------- 渲染统计 ----------
  function renderStats(codes) {
    const totalVisitors = 8163 + codes.length * 3;
    const success = 3944 + codes.reduce((s, c) => s + c.working, 0);
    $('#visitorCount').textContent = totalVisitors.toLocaleString();
    $('#successCount').textContent = success.toLocaleString();
    const newest = codes.reduce((a, b) => a.sharedAt > b.sharedAt ? a : b);
    $('#lastShare').textContent = timeAgo(newest.sharedAt);
  }

  // ---------- 排序 ----------
  function sortCodes(codes, sort) {
    const featured = getFeatured();
    const featuredSet = new Set(featured);
    const arr = [...codes];
    if (sort === 'likely') {
      arr.sort((a, b) => {
        const af = featuredSet.has(a.code) ? 1 : 0;
        const bf = featuredSet.has(b.code) ? 1 : 0;
        if (af !== bf) return bf - af;
        // 过期码排后面
        const ae = isExpired(a) ? 1 : 0;
        const be = isExpired(b) ? 1 : 0;
        if (ae !== be) return ae - be;
        const ra = calcRate(a) * 1000 + calcRemaining(a) * 10 - (Date.now() - a.lastConfirmed) / 3600000;
        const rb = calcRate(b) * 1000 + calcRemaining(b) * 10 - (Date.now() - b.lastConfirmed) / 3600000;
        return rb - ra;
      });
    } else if (sort === 'newest') {
      arr.sort((a, b) => {
        const af = featuredSet.has(a.code) ? 1 : 0;
        const bf = featuredSet.has(b.code) ? 1 : 0;
        if (af !== bf) return bf - af;
        return b.sharedAt - a.sharedAt;
      });
    } else if (sort === 'expired') {
      arr.sort((a, b) => {
        const af = featuredSet.has(a.code) ? 1 : 0;
        const bf = featuredSet.has(b.code) ? 1 : 0;
        if (af !== bf) return bf - af;
        // 已过期排序：过期的在前
        const ae = isExpired(a) ? 1 : 0;
        const be = isExpired(b) ? 1 : 0;
        if (ae !== be) return be - ae;
        return calcRate(a) - calcRate(b);
      });
    }
    return arr;
  }

  // ---------- 渲染列表 ----------
  function renderList() {
    const codes = loadCodes();
    const votes = getVotes();
    const featured = getFeatured();
    const featuredSet = new Set(featured);
    const sorted = sortCodes(codes, currentSort);
    const list = $('#codeList');

    list.innerHTML = sorted.map(c => {
      const rate = calcRate(c);
      const remaining = calcRemaining(c);
      const vote = votes[c.code];
      const isFeat = featuredSet.has(c.code);
      const expired = isExpired(c);
      return `
        <div class="code-card ${isFeat ? 'featured' : ''} ${expired ? 'expired' : ''}" data-code="${c.code}">
          <div class="code-top">
            <span class="code-value" data-copy="${c.code}">${c.code}</span>
            <span class="code-rate ${expired ? 'expired' : rateClass(rate)}">${expired ? '已过期' : rate + '% 有效'}</span>
          </div>
          <div class="code-meta">
            <span>${expired ? '分享超过 48 小时' : '约 ' + remaining + ' 次剩余'}</span>
            <span>· 最后确认 ${timeAgo(c.lastConfirmed)}</span>
          </div>
          <div class="code-stats">抽取 ${c.drawn}× · 复制 ${c.copied}×</div>
          <div class="code-actions">
            <button class="btn btn-works ${vote === 'works' ? 'active' : ''}" data-vote="works" data-code="${c.code}" ${expired ? 'disabled' : ''}>
              有效 ${c.working}
            </button>
            <button class="btn btn-broken ${vote === 'broken' ? 'active' : ''}" data-vote="broken" data-code="${c.code}" ${expired ? 'disabled' : ''}>
              失效 ${c.broken}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 绑定事件
    list.querySelectorAll('[data-copy]').forEach(el => {
      el.addEventListener('click', () => copyCode(el.dataset.copy));
    });
    list.querySelectorAll('[data-vote]').forEach(btn => {
      btn.addEventListener('click', () => vote(btn.dataset.code, btn.dataset.vote));
    });
  }

  // ---------- 投票 ----------
  function vote(code, type) {
    const codes = loadCodes();
    const votes = getVotes();
    const item = codes.find(c => c.code === code);
    if (!item) return;
    const prev = votes[code];

    // 撤销之前的投票
    if (prev === 'works') item.working = Math.max(0, item.working - 1);
    if (prev === 'broken') item.broken = Math.max(0, item.broken - 1);

    if (prev === type) {
      delete votes[code];
      toast('已取消投票');
    } else {
      votes[code] = type;
      if (type === 'works') {
        item.working += 1;
        item.lastConfirmed = Date.now();
        toast('已标记为有效');
      } else {
        item.broken += 1;
        toast('已标记为失效');
      }
    }
    saveCodes(codes);
    saveVotes(votes);
    renderList();
    renderStats(codes);
  }

  // ---------- 复制 ----------
  async function copyCode(code) {
    // 增加复制计数
    const codes = loadCodes();
    const item = codes.find(c => c.code === code);
    if (item) {
      item.copied += 1;
      saveCodes(codes);
    }
    try {
      await navigator.clipboard.writeText(code);
      toast(`已复制 ${code}`);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast(`已复制 ${code}`);
    }
    renderList();
  }

  // ---------- 随机抽取 ----------
  function drawCode() {
    const codes = loadCodes();
    const featured = getFeatured();
    const featuredSet = new Set(featured);
    const available = codes.filter(c => calcRate(c) >= 50 && calcRemaining(c) > 0 && !isExpired(c));
    if (available.length === 0) {
      toast('暂无可抽取的邀请码');
      return;
    }
    // 推荐码优先
    const featuredAvail = available.filter(c => featuredSet.has(c.code));
    const pool = featuredAvail.length > 0 ? featuredAvail : available;
    // 加权随机：工作率高的概率大
    const totalWeight = pool.reduce((s, c) => s + calcRate(c), 0);
    let r = Math.random() * totalWeight;
    let picked = pool[0];
    for (const c of pool) {
      r -= calcRate(c);
      if (r <= 0) { picked = c; break; }
    }
    picked.drawn += 1;
    saveCodes(codes);
    currentDraw = picked.code;

    $('#drawCode').textContent = picked.code;
    $('#drawBox').classList.add('has-code');
    $('#drawMeta').innerHTML = `${calcRate(picked)}% 有效 · 约 ${calcRemaining(picked)} 次剩余 · 最后确认 ${timeAgo(picked.lastConfirmed)}`;
    $('#drawActions').classList.add('show');
    $('#drawBtn').style.display = 'none';

    renderList();
    renderStats(loadCodes());
  }

  // ---------- 分享到 X ----------
  function shareX() {
    const text = encodeURIComponent('我在 Muse 邀请码社区找到了可用的邀请码，快来看看！by @AiAlepha');
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  // ---------- 分享邀请码弹窗 ----------
  function openShareModal() {
    $('#shareModal').classList.add('show');
    $('#shareModal').setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#shareCodeInput').focus(), 100);
  }
  function closeShareModal() {
    $('#shareModal').classList.remove('show');
    $('#shareModal').setAttribute('aria-hidden', 'true');
    $('#shareForm').reset();
  }
  function submitShareCode(e) {
    e.preventDefault();
    const input = $('#shareCodeInput');
    const code = input.value.toUpperCase().trim();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) {
      toast('邀请码需为 4–12 位英文字母或数字');
      return;
    }
    const codes = loadCodes();
    if (codes.some(c => c.code === code)) {
      toast('这个邀请码已在码池中');
      return;
    }
    codes.unshift({
      code,
      working: 0,
      broken: 0,
      drawn: 0,
      copied: 0,
      lastConfirmed: Date.now(),
      sharedAt: Date.now()
    });
    saveCodes(codes);
    toast('邀请码已加入码池，感谢分享！');
    closeShareModal();
    renderStats(codes);
    renderList();
  }

  // ---------- 排序切换 ----------
  function bindTabs() {
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentSort = tab.dataset.sort;
        renderList();
      });
    });
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    $('#drawBtn').addEventListener('click', drawCode);
    $('#drawCopyBtn').addEventListener('click', () => {
      if (currentDraw) copyCode(currentDraw);
    });
    $('#drawAgainBtn').addEventListener('click', drawCode);
    $('#shareXBtn').addEventListener('click', shareX);

    // 分享邀请码弹窗
    $('#shareCodeBtn').addEventListener('click', openShareModal);
    $('#shareModal').addEventListener('click', (e) => {
      if (e.target.matches('[data-close]')) closeShareModal();
    });
    $('#shareForm').addEventListener('submit', submitShareCode);
    $('#shareCodeInput').addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeShareModal();
    });
  }

  function init() {
    bindTabs();
    bindEvents();
    renderStats(loadCodes());
    renderList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
