import { useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import '../data.js';
import '../animations/demos.js';
import '../animations/motion-atlas.js';
import '../animations/demos.css';
import AnimatedContent from './components/AnimatedContent.jsx';
import OrbitImages from './components/OrbitImages.jsx';
import RotatingText from './components/RotatingText.jsx';
import AccordionGallery from './components/AccordionGallery.jsx';
import { galleryPages, previewFor } from './catalog.js';
import { initAtlas } from '../app.js';
import '../styles.css';

const entries = window.VISUAL_ATLAS;
const orbitEntries = ['daguerreotype', 'cyanotype', 'halftone', 'pinhole-photography', 'autochrome-lumiere', 'film-grain'].map(id => entries.find(item => item.id === id));
const orbitImages = orbitEntries.map(item => ({ src: item.media, alt: `浏览${item.zh}` }));

function useMedia(query) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const change = () => setMatches(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, [query]);
  return matches;
}

function Hero({ paused }) {
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  return <>
    <AnimatedContent distance={34} duration={1} stagger={0.1} trigger="mount" className="intro-copy-block">
      <p className="eyebrow">A collection for the way you see.</p>
      <h1 id="title" aria-label="San‘s visual library">
        <span className="title-owner">San‘s</span>
        <span className="title-line" aria-hidden="true">
          <RotatingText texts={['visual', 'motion']} effect="slide" highlight highlightColor="#383838" staggerDuration={0.025} rotationInterval={4200} pauseOnHover auto={!paused && !reduced} mainClassName="title-rotating" splitLevelClassName="title-mask" />
          <span className="title-library">library</span>
        </span>
      </h1>
      <p className="intro-copy">收藏一种画面，找到下一次创作的起点。</p>
      <a className="browse-link" href="#library">探索馆藏 <span aria-hidden="true">↓</span></a>
    </AnimatedContent>
    <div className="orbit-stage">
      <OrbitImages images={orbitImages} shape="ellipse" baseWidth={900} radiusX={315} radiusY={112} itemSize={150} rotation={-12} duration={44} height={350} depth={0.45} itemRadius={1} shadow={0.28} showPath pathColor="rgba(70,70,70,0.12)" pathWidth={1} paused={paused || reduced} onItemClick={index => document.dispatchEvent(new CustomEvent('atlas:pick', { detail: orbitEntries[index].id }))} centerContent={<span className="orbit-caption">A WAY<br />OF SEEING<span>视觉与动态的私人收藏</span></span>} />
      <p className="orbit-note">馆藏选页 <span>拖动探索 · 点击查看</span></p>
    </div>
  </>;
}

function EntryDetail({ item, renderCard, onReady }) {
  useLayoutEffect(() => { onReady(); }, [item.id, onReady]);
  return <div className="entry-detail" dangerouslySetInnerHTML={{ __html: renderCard(item) }} />;
}

function CategoryGallery({ category, items, index, renderCard, onPreviewChange, mobile }) {
  const pages = galleryPages(items);
  const [pageIndex, setPageIndex] = useState(0);
  const [active, setActive] = useState(0);
  const page = pages[pageIndex];
  const selected = page[active] || page[0];
  const changePage = delta => { setPageIndex(current => current + delta); setActive(0); };
  const galleryItems = page.map(item => ({ image: previewFor(item), label: item.zh, alt: `${item.zh}预览` }));
  const mobileHeight = Math.max(240, (page.length - 1) * 48 + 260);
  return <section className="group" aria-labelledby={`group-${index}`}>
    <AnimatedContent distance={20} duration={0.65} className="group-heading">
      <h2 id={`group-${index}`}>{category}</h2><span>{items.length} 条</span><i className="group-line" aria-hidden="true" />
    </AnimatedContent>
    <div className="gallery-frame" style={{ '--gallery-mobile-height': `${mobileHeight}px` }}>
      <AccordionGallery key={pageIndex} items={galleryItems} defaultIndex={0} onActiveChange={setActive} height={mobile ? mobileHeight / 1.6 : 310} orientation={mobile ? 'vertical' : 'horizontal'} expandRatio={mobile ? 260 / mobileHeight : 0.56} trigger="click" radius={1} gap={mobile ? 6 : 9} tilt={mobile ? 0 : 4} parallax={0.25} duration={0.6} overlayColor="#383838" accentColor="#ffffff" />
    </div>
    <div className="gallery-pagination">
      <span>预览 {pageIndex * 6 + 1}–{pageIndex * 6 + page.length} / {items.length}</span>
      <p>选中条目，阅读完整资料</p>
      {pages.length > 1 && <div className="page-actions"><button type="button" disabled={pageIndex === 0} onClick={() => changePage(-1)} aria-label={`${category}上一组`}>←</button><span>{pageIndex + 1} / {pages.length}</span><button type="button" disabled={pageIndex === pages.length - 1} onClick={() => changePage(1)} aria-label={`${category}下一组`}>→</button></div>}
    </div>
    <EntryDetail key={selected.id} item={selected} renderCard={renderCard} onReady={onPreviewChange} />
  </section>;
}

function Catalog({ groups, items, renderCard, onPreviewChange }) {
  const mobile = useMedia('(max-width: 600px)');
  return groups.map((category, index) => {
    const groupItems = items.filter(item => item.category === category);
    return <CategoryGallery key={`${category}:${groupItems.map(item => item.id).join(',')}`} category={category} items={groupItems} index={index} renderCard={renderCard} onPreviewChange={onPreviewChange} mobile={mobile} />;
  });
}

const heroRoot = createRoot(document.querySelector('#hero'));
const catalogRoot = createRoot(document.querySelector('#catalog'));
let motionPaused;
const updateMotion = paused => {
  if (motionPaused === paused) return;
  motionPaused = paused;
  heroRoot.render(<Hero paused={paused} />);
};
initAtlas({
  renderCatalog: props => flushSync(() => catalogRoot.render(<Catalog {...props} />)),
  updateMotion
});
