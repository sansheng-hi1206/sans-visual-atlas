window.VisualDemos = {
  skeleton() {
    return `<div class="skeleton-scene"><div class="skeleton-window"><div class="window-top"><i></i><i></i><i></i><span></span></div><div class="skeleton-layout"><div class="skeleton-block block-title"><b>项目进展</b><span>本周概览</span></div><div class="skeleton-block block-number"><b>68<span>%</span></b><small>已完成</small></div><div class="skeleton-block block-chart"><div class="chart-bars"><i></i><i></i><i></i><i></i><i></i></div></div><div class="skeleton-block block-note"><i></i><i></i><i></i></div></div></div><span class="scene-caption">先搭结构，再填内容</span></div>`;
  },
  ring() {
    return `<div class="ring-scene"><div class="ring-floor"></div><div class="ring-camera"><div class="ring-orbit">${[0,1].map(row=>Array.from({length:8},(_,i)=>`<div class="orbit-card" style="--angle:${i*45+row*15}deg;--row:${row};--shade:${i%3}"><span>${String(i+1+row*8).padStart(2,'0')}</span><i></i><b></b></div>`).join('')).join('')}</div></div><span class="scene-caption">绕成圆筒，分层旋转</span></div>`;
  },
  slices() {
    return `<div class="slices-scene"><div class="slices-art">${Array.from({length:5},(_,i)=>`<div class="slice" style="--i:${i}"><div class="slice-front"></div></div>`).join('')}<div class="slice-counter"><span>01</span><b>02</b></div></div><span class="scene-caption">五条切片，错开铺满</span></div>`;
  }
};
