/*
 * Widget adapter: a bare /widgets/signal-field link is auto-blocked into the `widget`
 * block, which loads this file. It reuses the widget-signal-field block code.
 */
import decorateSignalField from '../blocks/widget-signal-field/widget-signal-field.js';

export default function decorate(widget) {
  widget.classList.add('widget-signal-field');
  decorateSignalField(widget);
}
