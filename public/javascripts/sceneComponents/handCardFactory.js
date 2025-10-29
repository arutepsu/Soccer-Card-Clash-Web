import { createGameCardView } from './gameCardWeb.js';
import { createCardAnimations } from './cardAnimationsWeb.js';

const anim = createCardAnimations();

export function createHandCardFactory(registry) {
  function createSelectableHandCard({ card, index, flipped, selectedIndexAccessor, onSelected }) {
    const view = createGameCardView({
      registry,
      flipped,
      isSelectable: true,
      isLastCard: !flipped,
      card: card?.fileName ? { fileName: card.fileName } : null
    });

    view.el.classList.add('hand-card');
    view.el.dataset.index = String(index);
    view.el.setAttribute('role', 'button');
    view.el.setAttribute('tabindex', '0');
    view.el.setAttribute('aria-pressed', 'false');

    view.el.addEventListener('mouseenter', () =>
      anim.applyHoverEffect(view.el, selectedIndexAccessor(), index)
    );
    view.el.addEventListener('mouseleave', () =>
      anim.removeHoverEffect(view.el, selectedIndexAccessor(), index)
    );

    function toggleSelection(newIndex) {
      const isSelected = newIndex === index;
      view.setSelected(isSelected);
      view.el.classList.toggle('selected-card', isSelected);
      view.el.setAttribute('aria-pressed', String(isSelected));
    }

    view.el.addEventListener('click', () => {
      const cur = selectedIndexAccessor();
      const next = (cur === index) ? -1 : index;
      onSelected(next);
      toggleSelection(next);
    });

    view.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const cur = selectedIndexAccessor();
        const next = (cur === index) ? -1 : index;
        onSelected(next);
        toggleSelection(next);
      }
    });

    return view.el;
  }

  return { createSelectableHandCard };
}
