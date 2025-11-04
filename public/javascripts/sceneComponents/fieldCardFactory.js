// /assets/javascripts/fieldCardFactoryWeb.js
import { createGameCardView } from './card/gameCard.js';
import { createCardAnimations } from '../utils/cardAnimations.js';

const anim = createCardAnimations();

export function createFieldCardFactory(registry) {
  function createDefaultFieldCard(cardOpt) {
    const cardFile = cardOpt?.fileName;
    const view = createGameCardView({
      registry,
      flipped: false,
      isSelectable: false,
      card: cardFile ? { fileName: cardFile } : null
    });
    view.el.classList.add('field-card');
    // boosted?
    if (cardOpt?.isBoosted) anim.applyBoostEffect(view.el);
    return view.el;
  }

  function createSelectableFieldCard({ cardOpt, index, selectedIndexAccessor, isGoalkeeper = false, onSelected }) {
    const view = createGameCardView({
      registry,
      flipped: false,
      isSelectable: true,
      card: cardOpt?.fileName ? { fileName: cardOpt.fileName } : null
    });
    view.el.classList.add('field-card');
    view.el.dataset.index = String(index);
    if (isGoalkeeper) view.el.classList.add('is-goalkeeper');
    if (cardOpt?.isBoosted) anim.applyBoostEffect(view.el);

    view.el.addEventListener('mouseenter', () => anim.applyHoverEffect(view.el, selectedIndexAccessor(), index));
    view.el.addEventListener('mouseleave', () => anim.removeHoverEffect(view.el, selectedIndexAccessor(), index));
    view.el.addEventListener('click', () => {
      const currentlySelected = selectedIndexAccessor();
      if (currentlySelected === index) {
        view.setSelected(false);
        onSelected(-1);
      } else {
        onSelected(index);
        view.setSelected(true);
      }
    });

    return view.el;
  }

  function createStaticImageCard(imageUrl, index) {
    const wrap = document.createElement('div');
    wrap.className = 'static-card';
    wrap.dataset.index = String(index);

    const im = document.createElement('img');
    im.src = imageUrl;
    im.alt = 'Defeated';
    im.style.width = '160px';
    im.style.height = '150px';
    im.style.objectFit = 'contain';

    wrap.appendChild(im);
    return wrap;
  }

  return {
    createDefaultFieldCard,
    createSelectableFieldCard,
    createStaticImageCard,
  };
}
