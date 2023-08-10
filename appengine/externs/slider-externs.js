/**
 * @fileoverview Externs for Slider.
 * @externs
 */

const Slider = class {
  /**
   * Object representing a horizontal slider widget.
   * @param {number} x The horizontal offset of the slider.
   * @param {number} y The vertical offset of the slider.
   * @param {number} width The total width of the slider.
   * @param {!Element} svgParent The SVG element to append the slider to.
   * @param {Function=} opt_changeFunc Optional callback function that will be
   *     called when the slider is moved.  The current value is passed.
   */
  constructor(x, y, width, svgParent, opt_changeFunc) {}

  /**
   * Returns the slider's value (0.0 - 1.0).
   * @returns {number} Current value.
   */
  getValue() {}

  /**
   * Sets the slider's value (0.0 - 1.0).
   * @param {number} value New value.
   */
  setValue(value) {}
};
