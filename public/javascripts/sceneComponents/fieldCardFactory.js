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

    const $el = $(view.el);
    $el.addClass('field-card');

    if (cardOpt?.isBoosted) anim.applyBoostEffect($el[0]);

    return $el[0];
  }

  function createSelectableFieldCard({ cardOpt, index, selectedIndexAccessor, isGoalkeeper = false, onSelected }) {
    const view = createGameCardView({
      registry,
      flipped: false,
      isSelectable: true,
      card: cardOpt?.fileName ? { fileName: cardOpt.fileName } : null
    });

    const $el = $(view.el)
      .addClass('field-card')
      .attr('data-index', String(index));

    if (isGoalkeeper) $el.addClass('is-goalkeeper');
    if (cardOpt?.isBoosted) anim.applyBoostEffect($el[0]);

    // Event-Handling mit jQuery
    $el
      .on('mouseenter', () => anim.applyHoverEffect($el[0], selectedIndexAccessor(), index))
      .on('mouseleave', () => anim.removeHoverEffect($el[0], selectedIndexAccessor(), index))
      .on('click', () => {
        const current = selectedIndexAccessor();
        if (current === index) {
          view.setSelected(false);
          onSelected(-1);
        } else {
          onSelected(index);
          view.setSelected(true);
        }
      });

    return $el[0];
  }

  function createStaticImageCard(imageUrl, index) {
    const $wrap = $('<div></div>')
      .addClass('static-card')
      .attr('data-index', String(index));

    const $img = $('<img>')
      .attr({
        src: imageUrl,
        alt: 'Defeated'
      })
      .css({
        width: '160px',
        height: '150px',
        objectFit: 'contain'
      });

    $wrap.append($img);
    return $wrap[0];
  }

  return {
    createDefaultFieldCard,
    createSelectableFieldCard,
    createStaticImageCard
  };
}
