logo.js
-------------------------------------------------------------------------------

logo.js is a small web application that allow to edit SVG imaged with various
widgets. You can try a live demo [here](http://draklaw.github.io/logo.js).
Samples files can be found in the samples directory.


How to use
-------------------------------------------------------------------------------

Right now, there is no GUI to add widgets, so they should be added directly to
the SVG. The first step is to add a `control` tag in the `defs` bloc. Then you
can add as many widgets as needed.

Widgets tag should have a unique `id` and a `target` attribute describing which
SVG parameters are controlled by the widget (see target syntax). There is also
an optional `value` attribute that specify the default value of the widget. If
not provided, the value is extracted from the first target.

Available widgets are:
* `real`: Allow to control a single real-valued parameter with a slider
  widget. It can be bound to an attribute or a transform (see target syntax).
  Additional parameters are `min` and `max` to control the range of the slider
  (default to 0 and 1 respectively) and `step` to control the step-size of the
  slider (default to 1/1000 of the total range).
* `color`: Used to set colors. There is no additional attributes.

## Target syntax

The `target` attribute of widgets tag describe the SVG parameters that are
controlled by the widget. To control attributes (like `x`, `y`, `r`, `fill`,
etc.) the syntax is `selector.attribute`. Selector starting with `#` select
elements by id and those starting with `.` select elements by class. Several
target ca be separated with a comma.

Transformations are a bit more complicated. First, the target element should
already have its `transform` attribute defined. The target syntax is
`selector.transform(index:type[:param])` where param is optional. Index is the
index of the transformation (0 for the first, 1 for the second, etc.) and type
is `translate`, `rotate` or `scale` (other transforms are not supported yet).
The type declared in the target and corresponding transformation in the SVG
should match. If the type is `translate`, param should be either `x` or `y`.
If the type is `scale`, param can be `x`, `y` or nothing for uniform scales.
Rotations does not take parameter yet.

## Example

```
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
		width="512px" height="256px" version="1.1" >
	<defs>
		<controls>

			<!-- Change the X position of the square -->
			<real id="squareX" targets="#square.x" min="0" max="512" />

			<!-- Change the Y position of the square -->
			<real id="squareY" targets="#square.y" min="0" max="256" />

			<!-- Change both the widht and the height of the square -->
			<real id="squareSide" targets="#square.width, #square.height"
					min="0" max="250" step="10" />

			<!-- Rotate the square. As you can not control the center, will
				 rotate from the top-left corner. A way to avoid this would be
				 to control the square size and position with transforms too -->
			<real id="squareRotate" targets="#square.transform(0:rotate)" min="-180" max="180" step="5" />

			<!-- Change the color of elements with the class 'color' -->
			<color id="color" targets=".color.fill" />
		</controls>
	</defs>

	<rect x="0" y="0" width="512" height="256" fill="#f0f0f0" />
	<circle class="color" cx="492" cy="236" r="20" fill="#d04040" />
	<rect id="square" class="color" transform="rotate(0)"
			x="20" y="10" width="50" height="50" fill="#d04040" />
</svg>
```
