/* ============================================================
   Muse Invites · 管理后台
   ============================================================ */

(() => {
  'use strict';

  // 管理密码的 SHA-256 哈希（明文不存储在前端，避免源码泄露密码）
  // 修改密码请用 Node 生成新哈希并替换:
  // node -e "console.log(require('crypto').createHash('sha256').update('你的新密码').digest('hex'))"
  const ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
  const SESSION_KEY = 'muse_admin_session';
  const STORAGE_KEY = 'muse_codes_v4';
  const FEATURED_KEY = 'muse_featured_v2';

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

  const $ = (s) => document.querySelector(s);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function loadCodes() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveCodes(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
  function getFeatured() {
    // 暂固定推荐码为 Z78ZT7
    return ['Z78ZT7'];
  }
  function saveFeatured(f) { localStorage.setItem(FEATURED_KEY, JSON.stringify(f)); }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min} 分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 小时前`;
    return `${Math.floor(hr / 24)} 天前`;
  }

  function isLoggedIn() { return sessionStorage.getItem(SESSION_KEY) === '1'; }
  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function login(pwd) {
    const hash = await sha256(pwd);
    if (hash === ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      return true;
    }
    return false;
  }
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  }

  function showLogin() {
    $('#loginView').style.display = 'block';
    $('#adminView').style.display = 'none';
  }
  function showAdmin() {
    $('#loginView').style.display = 'none';
    $('#adminView').style.display = 'block';
    renderAll();
  }

  function renderAll() {
    renderStats();
    renderFeatured();
    renderTable();
  }

  function renderStats() {
    const codes = loadCodes();
    const featured = getFeatured();
    $('#statTotal').textContent = codes.length;
    $('#statFeatured').textContent = featured.length;
    $('#statWorks').textContent = codes.reduce((s, c) => s + c.working, 0);
  }

  function renderFeatured() {
    const featured = getFeatured();
    const list = $('#featuredList');
    if (featured.length === 0) {
      list.innerHTML = '<span class="empty-hint">暂无推荐码</span>';
      return;
    }
    list.innerHTML = featured.map(code => `
      <span class="featured-chip">
        ${code}
        <button data-remove="${code}" aria-label="移除">✕</button>
      </span>
    `).join('');
    list.querySelectorAll('button[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => removeFeatured(btn.dataset.remove));
    });
  }

  function renderTable() {
    const codes = loadCodes();
    const tbody = $('#codeTableBody');
    if (codes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-tertiary);padding:32px;">码池为空</td></tr>';
      return;
    }
    tbody.innerHTML = codes.map((c, i) => `
      <tr>
        <td class="code-val">${c.code}</td>
        <td>${c.working}</td>
        <td>${c.broken}</td>
        <td>${c.drawn}×</td>
        <td>${timeAgo(c.sharedAt)}</td>
        <td><button data-del="${i}" class="btn-del">删除</button></td>
      </tr>
    `).join('');
    tbody.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', () => deleteCode(parseInt(btn.dataset.del)));
    });
  }

  function addFeatured() {
    const input = $('#featuredInput');
    const code = input.value.toUpperCase().trim();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) {
      toast('邀请码需为 4–12 位英文字母或数字');
      return;
    }
    const featured = getFeatured();
    if (featured.includes(code)) { toast('该码已在推荐列表中'); return; }
    featured.push(code);
    saveFeatured(featured);
    input.value = '';
    toast('已添加到推荐');
    renderAll();
  }

  function removeFeatured(code) {
    let featured = getFeatured();
    featured = featured.filter(c => c !== code);
    saveFeatured(featured);
    toast('已移除推荐');
    renderAll();
  }

  function deleteCode(index) {
    const codes = loadCodes();
    const removed = codes.splice(index, 1)[0];
    saveCodes(codes);
    let featured = getFeatured();
    featured = featured.filter(c => c !== removed.code);
    saveFeatured(featured);
    toast(`已删除 ${removed.code}`);
    renderAll();
  }

  function resetData() {
    if (!confirm('确定要重置为初始数据吗？')) return;
    saveCodes(SEED_CODES);
    saveFeatured([]);
    toast('已重置');
    renderAll();
  }

  function clearData() {
    if (!confirm('确定要清空所有邀请码吗？')) return;
    saveCodes([]);
    saveFeatured([]);
    toast('已清空码池');
    renderAll();
  }

  function bindEvents() {
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = $('#loginPwd').value;
      const ok = await login(pwd);
      if (ok) showAdmin();
      else { toast('密码错误'); $('#loginPwd').value = ''; }
    });
    $('#addFeaturedBtn').addEventListener('click', addFeatured);
    $('#featuredInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addFeatured();
    });
    $('#featuredInput').addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
    $('#resetBtn').addEventListener('click', resetData);
    $('#clearBtn').addEventListener('click', clearData);
    $('#logoutBtn').addEventListener('click', logout);
  }

  function init() {
    document.documentElement.setAttribute('data-theme', 'dark');
    bindEvents();
    if (isLoggedIn()) showAdmin();
    else showLogin();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
