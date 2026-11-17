(() => {
  const data = window.VISUAL_ATLAS || [];
  const $ = selector => document.querySelector(selector);
  const catalog = $('#catalog');
  const state = { tab: 'all', query: '', category: 'all', videos: false, paused: matchMedia('(prefers-reduced-motion: reduce)').matches };
  const visible = new Set();
  let observer;
  let toastTimer;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dynamic = item => ['video', 'animation'].includes(item.mediaType);
  const categoryOrder = ['摄影与印相','镜头与光学','色彩与调色','印刷与绘画','复古媒介','图形与界面','三维与空间','合成与特效','AI生成与编辑','运镜与剪辑','文字与图形动画','逐帧与角色动画','时间与运动','故障与扭曲','边缘与特征','遮罩与控制','色彩与色阶简化','印刷与抖色','视频与故障','空间与光学','滤镜与运动','AI处理流程','图片出场','图片排布','图片切换'];
  const tabs = [...document.querySelectorAll('[role="tab"]')];

  function stats() {
    $('#stats').innerHTML = [[data.length, '个视觉条目'], [data.filter(x => x.kind === 'style').length, '画面风格'], [data.filter(x => x.kind === 'motion').length, '动效手法'], [data.filter(dynamic).length, '视频 / 动画']].map(([n, label]) => `<div class="stat"><strong>${n.toString().padStart(2, '0')}</strong><span>${label}</span></div>`).join('');
    tabs.forEach(tab => { tab.querySelector('span').textContent = tab.dataset.tab === 'all' ? data.length : data.filter(x => x.kind === tab.dataset.tab).length; });
  }

  function categories() {
    const items = data.filter(x => state.tab === 'all' || x.kind === state.tab);
    $('#category').innerHTML = '<option value="all">全部分类</option>' + [...new Set(items.map(x => x.category))].sort((a,b) => categoryOrder.indexOf(a)-categoryOrder.indexOf(b)).map(x => `<option value="${escape(x)}">${escape(x)}</option>`).join('');
    $('#category').value = state.category;
  }

  function media(item) {
    if (item.mediaType === 'image') return `<img src="${escape(item.media)}" alt="${escape(item.zh)}示例：${escape(item.details.find(x => ['看哪里', '这张图'].includes(x[0]))?.[1] || item.description)}" loading="lazy">`;
    if (item.mediaType === 'video') return `<video data-src="${escape(item.media)}" poster="${escape(item.poster)}" autoplay muted loop playsinline preload="none" aria-label="${escape(item.zh)}原理演示"></video>`;
    if (item.mediaType === 'animation' && item.demoSpec) return `<div class="canvas-demo"><canvas data-motion-id="${escape(item.id)}" role="img" aria-label="${escape(item.description)}"></canvas></div>`;
    if (item.mediaType === 'animation' && window.VisualDemos[item.demo]) return `<div class="demo" role="img" aria-label="${escape(item.description)}">${window.VisualDemos[item.demo]()}</div>`;
    return '<p class="media-missing">暂无样品</p>';
  }

  function card(item) {
    return `<article class="card" data-id="${escape(item.id)}">
      <div class="media ${escape(item.mediaType)}-${escape(item.id)}" data-motion="${dynamic(item)}">${media(item)}<span class="media-badge">${escape(item.mediaLabel)}</span>${dynamic(item) ? '<span class="media-state">已暂停</span>' : ''}</div>
      <div class="card-body"><p class="meta">${escape(item.category)} / ${escape(item.era)} / ${escape(item.number)}</p><h3>${escape(item.zh)}</h3><p class="english">${escape(item.en)}${item.originalNameNote ? ' · 整理译名' : ''}</p>
      <p class="description">${escape(item.description)}</p><div class="prompt-box"><p class="prompt-label">${escape(item.promptLabel)}</p><p class="prompt-text" lang="${item.source.startsWith('LetzAI') ? 'en' : 'zh-CN'}" tabindex="0">${escape(item.prompt)}</p></div>
      <div class="actions"><button class="copy-prompt" type="button" data-copy="prompt" aria-label="复制${escape(item.zh)}的提示词">复制提示词</button><button class="copy-name" type="button" data-copy="standardName" aria-label="复制${escape(item.zh)}的标准名称">复制名称</button></div>
      ${item.example ? `<div class="example"><strong>示例说法 · 整理补充</strong>${escape(item.example)}<br><button class="copy-example" type="button" data-copy="example" aria-label="复制${escape(item.zh)}的示例说法">复制这句</button></div>` : ''}
      <details><summary class="card-bottom"><span class="source-label">${escape(item.source)}</span><span class="details-toggle">更多</span></summary><div class="more"><dl>${item.details.map(([name, text]) => `<dt>${escape(name)}</dt><dd>${/^https:\/\//.test(text) ? `<a href="${escape(text)}" target="_blank" rel="noopener">查看原素材出处 ↗</a>` : escape(text)}</dd>`).join('')}</dl>${item.referenceImage ? `<p>原站主图 · 对照</p><img class="reference-image" src="${escape(item.referenceImage)}" alt="${escape(item.zh)}原站主图" loading="lazy">` : ''}${item.referenceVideo ? `<p>原视频片段 · ${escape(item.referenceTime)}</p><video class="reference-video" controls muted playsinline preload="none" poster="${escape(item.referenceVideo.replace('.mp4', '.jpg'))}" src="${escape(item.referenceVideo)}" aria-label="${escape(item.zh)}原视频片段"></video>` : ''}<p class="credit">${escape(item.credit)}</p></div></details>
      <div class="source-row"><a class="source-link" href="${escape(item.sourceUrl)}" target="_blank" rel="noopener">${item.source.startsWith('LetzAI') ? '查看原始出处' : '查看本地原视频片段'} ↗</a></div>
      </div></article>`;
  }

  function updatePlayback() {
    const shouldPlay = !state.paused && !document.hidden;
    catalog.querySelectorAll('[data-motion="true"]').forEach(el => {
      const active = shouldPlay && visible.has(el);
      el.querySelector('.demo')?.classList.toggle('running', active);
      const video = el.querySelector('video');
      const canvas = el.querySelector('canvas');
      if (canvas) window.MotionAtlas.activate(canvas, active);
      const label = el.querySelector('.media-state');
      if (video) {
        if (active && !video.getAttribute('src')) video.src = video.dataset.src;
        video.playbackRate = .75;
        if (active) video.play().then(() => { if (shouldPlay && visible.has(el)) label.textContent = '循环慢放 · 0.75×'; }).catch(() => { label.textContent = '点击播放'; });
        else video.pause();
      }
      label.textContent = active ? (video ? '循环慢放 · 0.75×' : '循环演示') : '已暂停';
    });
    if (!shouldPlay) catalog.querySelectorAll('.reference-video').forEach(video => video.pause());
    $('#play-toggle').innerHTML = state.paused ? '<span aria-hidden="true">▷</span> 播放全部' : '<span aria-hidden="true">Ⅱ</span> 暂停全部';
    $('#play-toggle').setAttribute('aria-pressed', String(state.paused));
  }

  function observeMedia() {
    observer?.disconnect();
    visible.clear();
    observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) visible.add(target); else { visible.delete(target); if (target.matches('.reference-video')) target.pause(); }
      });
      updatePlayback();
    }, { threshold: .12 });
    catalog.querySelectorAll('[data-motion="true"], .reference-video').forEach(el => observer.observe(el));
    updatePlayback();
  }

  function render() {
    catalog.querySelectorAll('video').forEach(video => video.pause());
    window.MotionAtlas.clear();
    const words = state.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const items = data.filter(item => (state.tab === 'all' || item.kind === state.tab) && (state.category === 'all' || item.category === state.category) && (!state.videos || item.mediaType === 'video') && words.every(word => [item.zh, item.en, item.description, item.prompt, item.example, item.category].join(' ').toLocaleLowerCase().includes(word)));
    const groups = [...new Set(items.map(x => x.category))].sort((a,b) => categoryOrder.indexOf(a)-categoryOrder.indexOf(b));
    catalog.innerHTML = groups.map((category, index) => {
      const group = items.filter(x => x.category === category);
      return `<section class="group" aria-labelledby="group-${index}"><div class="group-heading"><h2 id="group-${index}">${escape(category)}</h2><span>${group.length} 条</span><i class="group-line" aria-hidden="true"></i></div><div class="cards">${group.map(card).join('')}</div></section>`;
    }).join('');
    $('#empty').hidden = items.length > 0;
    $('#result-count').textContent = `显示 ${items.length} / ${data.length} 个条目`;
    catalog.setAttribute('aria-labelledby', `tab-${state.tab}`);
    window.MotionAtlas.mount(catalog, items);
    observeMedia();
  }

  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 1900);
  }

  async function copy(text, button) {
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch {
      const selection = document.createElement('textarea');
      selection.value = text;
      selection.style.cssText = 'position:fixed;left:-10000px;top:0';
      document.body.append(selection);
      selection.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      selection.remove();
      button.focus({ preventScroll: true });
    }
    if (!copied) {
      const dialog = $('#copy-fallback');
      dialog.querySelector('textarea').value = text;
      dialog.showModal();
      dialog.querySelector('textarea').select();
      return;
    }
    const label = button.textContent;
    button.textContent = '已复制';
    button.disabled = true;
    toast('已复制到剪贴板');
    setTimeout(() => { button.textContent = label; button.disabled = false; }, 1500);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      state.tab = tab.dataset.tab;
      state.category = 'all';
      tabs.forEach(el => { const selected = el === tab; el.setAttribute('aria-selected', String(selected)); el.tabIndex = selected ? 0 : -1; });
      categories(); render();
    });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus(); tabs[next].click();
    });
  });
  let searchTimer;
  $('#search').addEventListener('input', event => { state.query = event.target.value; clearTimeout(searchTimer); searchTimer = setTimeout(render, 120); });
  $('#category').addEventListener('change', event => { state.category = event.target.value; render(); });
  $('#only-video').addEventListener('change', event => { state.videos = event.target.checked; render(); });
  $('#play-toggle').addEventListener('click', () => { state.paused = !state.paused; updatePlayback(); });
  document.addEventListener('visibilitychange', updatePlayback);
  $('#reset').addEventListener('click', () => { state.query = ''; state.category = 'all'; state.videos = false; $('#search').value = ''; $('#only-video').checked = false; categories(); render(); });
  catalog.addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (button) { const item = data.find(x => x.id === button.closest('.card').dataset.id); copy(item[button.dataset.copy], button); }
    const preview = event.target.closest('[data-motion="true"]');
    if (preview?.querySelector('video')) { state.paused = false; updatePlayback(); }
  });
  catalog.addEventListener('toggle', event => {
    if (!event.target.matches('details')) return;
    const video = event.target.querySelector('video');
    if (video && !event.target.open) video.pause();
    if (video && event.target.open && video.preload === 'none') { video.preload = 'metadata'; video.load(); }
  }, true);
  catalog.addEventListener('play', event => {
    if (event.target.matches('.reference-video') && state.paused) { state.paused = false; updatePlayback(); }
  }, true);
  stats(); categories(); render();
})();
