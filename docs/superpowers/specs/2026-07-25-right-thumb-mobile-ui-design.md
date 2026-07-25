# Right-Thumb Mobile UI

Date: 2026-07-25  
Status: Approved for implementation.

## Outcome

Make the existing guild RPG playable on a large portrait phone with the right hand alone.
The player must be able to prepare, fight, resolve loot, and replay without reaching outside the
lower-right thumb zone for required actions.

This batch changes presentation and interaction only. Battle outcomes, equipment effects, rewards,
save data, and content remain unchanged.

## Interaction Principle

- The upper screen communicates; the lower-right command deck operates.
- The command deck uses a staggered fan layout inside the reachable triangle.
- Hit targets remain rectangular and at least 56 by 56 CSS pixels.
- The primary action always occupies the easiest bottom-right position.
- No more than five actionable targets appear in the deck at once.
- Required actions never depend on swiping, dragging, or tapping a distant battlefield card.
- Existing card taps may remain as optional shortcuts.

## Command Deck

`ThumbCommandDeck` owns layout, page tabs, selected state, disabled state, and accessible labels.
It receives screen-specific labels and callbacks; it does not know battle or progression rules.

Stable positions:

1. bottom-right: primary or confirm action;
2. lower-left: secondary action;
3. middle: current selection choices;
4. right rail: page selection;
5. upper edge: low-frequency or destructive action.

The deck header always repeats the current page, selection, and readiness. Action feedback appears
above the deck so it is not hidden by the thumb.

## Guild Screen

The mobile guild removes the oversized introduction. Its first viewport contains resources, one
focused content card, and the command deck.

Pages:

- Quest: focus one unlocked or locked quest; previous, next, and start actions live in the deck.
- Party: focus one adventurer; previous, next, and set-leader actions live in the deck.
- Inventory: show up to three items per page; item selection, page movement, adventurer selection,
  and equip live in the deck.

The complete desktop grids remain available above 800 pixels. Mobile content can scroll for reading,
but scrolling is never required to reach the primary action.

## Battle Screen

The battlefield remains enemy-above, party-below. Unit cards become compact status displays with HP,
gauge, role, and selected-target state.

Pages:

- Skill: show the leader's available skills. The default skill occupies the primary position.
- Target: show living enemy choices. Selecting one returns to Skill and confirms the target above
  the deck.
- Tactics: Auto and 1x or 2x controls.

When the leader becomes ready, the deck returns to Skill. When a selected ally-target skill needs a
recipient, living party members replace the normal skill choices inside the same deck. After the
action resolves, button positions remain stable and become visibly disabled while the gauge fills.

Normal attack takes one tap. Target change plus attack takes at most two taps. Tactics take at most
two taps.

## Reward Screen

One loot item is focused at a time. Previous and next item movement plus equip, keep, and sell live
in the deck. Sell uses a second confirmation state. Once every item is resolved, the primary action
becomes Return to Guild.

Experience, gold, time, comparison, and party progression remain visible above the deck.

## Responsive Layout

- Mobile contract: 360 to 430 pixels wide in portrait using `100dvh`.
- The deck is inset 12 to 16 pixels from the right edge to avoid Android back gestures.
- Bottom offset includes `env(safe-area-inset-bottom)`.
- Page content reserves the measured maximum deck height and is never covered.
- Short landscape and desktop layouts keep the current non-overlay controls.
- Reduced-motion preferences remove pulse and movement without hiding state.

## State and Boundaries

- Screen-specific deck state is local UI state under `apps/web/src/guild-rpg`.
- Battle selection still dispatches existing reducer actions.
- No command-deck type crosses package boundaries.
- A small feature-local state model defines valid pages, index clamping, and context resets.
- The shared deck renders supplied actions and does not create a generic application framework.

## Verification

- Test the deck state model before implementation.
- Render-test the guild, battle, and reward command contracts.
- Run existing reducer and simulation tests unchanged.
- Browser-check 375 by 812 and 390 by 844 portrait sizes.
- Verify no horizontal overflow, no covered focused content, and no required action outside the deck.
- Verify keyboard focus, disabled semantics, selected state, safe-area spacing, and reduced motion.

## Acceptance

- A fresh player starts the first quest with no required tap outside the lower-right deck.
- Manual battle, target changes, Auto, and speed work using only the deck.
- Every reward decision and return action works using only the deck.
- Primary action position remains stable across pages.
- Existing saves load without migration.
- Desktop remains functional.
- Production completes the full loop without console errors or dead controls.
