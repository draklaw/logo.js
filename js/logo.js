String.prototype.paddingLeft = function(size, char) {
	var str = this;
	while(str.length < size) {
		str = char + str;
	}
	return str;
}

function ControlableSvg(svgElem, appendTo) {
	this.root = $("<div id='controlableSvgRoot' class='controlableSvg'></div>").appendTo(appendTo);
	this.svgFrame = $("<div class='svgFrame'></div>").appendTo(this.root);

	this.svg = $(svgElem).appendTo(this.svgFrame);
	this.svg.css("float", "left");

	this.settingCont = $("<div class='settings'></div>").appendTo(this.root);
	this.settingCont.css({
		width: 512,
		float: 'left',
		'margin-left': 8
	});

	this.controls = {};

	this.tmpColor = { r: 0, g: 0, b: 0 };

	var that = this;
	var controlsTag = $(this.svg).find("controls");
	controlsTag.children().each(function() {
		switch(this.localName.toLowerCase()) {
		case "real": that.addRealControl(this); break;
		case "color": that.addColorControl(this); break;
		default:
			console.log("Invalid tag in controls: '"+this.localName+"'");
		}
	});
}

ControlableSvg.prototype = {

	destroy: function() {
		this.root.remove();
	},

	stringToColor: function(colorStr) {
		if(colorStr.slice(0, 1) != '#' || colorStr.length !== 7) {
			this.tmpColor.r = 0;
			this.tmpColor.g = 0;
			this.tmpColor.b = 0;
			return this.tmpColor;
		}
		this.tmpColor.r = parseInt(colorStr.substr(1, 2), 16);
		this.tmpColor.g = parseInt(colorStr.substr(3, 2), 16);
		this.tmpColor.b = parseInt(colorStr.substr(5, 2), 16);
		return this.tmpColor;
	},

	colorToString: function(color) {
		return ('#' + color.r.toString(16).paddingLeft(2, '0')
					+ color.g.toString(16).paddingLeft(2, '0')
					+ color.b.toString(16).paddingLeft(2, '0'));
	},

	parseTargets: function(targetStr) {
		var split = targetStr.split(',');
		var targets = [];
		split.forEach(function(target) {
			var match = target.match(/^\s*(.+)\.(.+?)\s*$/);
			if(match) {
				var result = {
					target: match[1],
					attr: match[2]
				};
				var transMatch = result.attr.match(/^transform\((.*)\)$/);
				if(transMatch) {
					var params = transMatch[1].split(':');
					result.attr = 'transform';
					result.transIndex = params[0];
					result.transType = params[1];
					result.transParam = params[2];
				}
				targets.push(result);
			}
			else { console.log("Failed to recognize target '"+target+"'"); }
		});
		return targets;
	},

	addRealControl: function(elem) {
		var cid = $(elem).attr("id");
		var targets = this.parseTargets($(elem).attr("targets"));
		var min = parseFloat($(elem).attr("min"));
		var max = parseFloat($(elem).attr("max"));
		var step = parseFloat($(elem).attr("step")) || (max-min) / 1000;
		var value = parseFloat($(elem).attr("value")) || this.getTarget(targets[0]);

		var row = $("<div class='row'></div>").appendTo(this.settingCont);
		var label = $("<div class='label'>"+cid+"</div>").appendTo(row);

		var that = this;
		var slider = $("<div id='"+cid+"Slider'></div>").appendTo(row).slider({
			value: value, min: min, max: max, step: step, range: "min",
			slide: function(event, ui) {
				that.setReal(cid, ui.value);
			}
		});

		this.controls[cid] = {
			elem: elem,
			slider: slider,
			targets: targets,
		};
		this.setReal(cid, value);
	},

	addColorControl: function(elem) {
		var cid = $(elem).attr("id");
		var targets = this.parseTargets($(elem).attr("targets"));
		var value = $(elem).attr("value") || this.getTarget(targets[0]);
		var color = this.stringToColor(value);

		var row = $("<div class='row'></div>").appendTo(this.settingCont);
		var label = $("<div class='label'>"+cid+"</div>").appendTo(row);

		var sliderR = $("<div id='"+cid+"RSlider' class='sliderR'></div>").appendTo(row).slider({
			value: color.r, min: 0, max: 255, range: "min",
		});
		var sliderG = $("<div id='"+cid+"GSlider' class='sliderG'></div>").appendTo(row).slider({
			value: color.g, min: 0, max: 255, range: "min",
		});
		var sliderB = $("<div id='"+cid+"BSlider' class='sliderB'></div>").appendTo(row).slider({
			value: color.b, min: 0, max: 255, range: "min",
		});

		var that = this;
		var updateColor = function(event, ui) {
			that.setColor(cid, {
				r: this === sliderR.get(0)? ui.value: sliderR.slider('value'),
				g: this === sliderG.get(0)? ui.value: sliderG.slider('value'),
				b: this === sliderB.get(0)? ui.value: sliderB.slider('value') });
		};

		sliderR.on('slide', updateColor);
		sliderG.on('slide', updateColor);
		sliderB.on('slide', updateColor);

		this.controls[cid] = {
			elem: elem,
			sliderR: sliderR,
			sliderG: sliderG,
			sliderB: sliderB,
			targets: targets,
		};
		this.setColor(cid, value);
	},

	getTarget: function(target) {
		if(target.attr !== 'transform') {
			return $(target.target).attr(target.attr);
		}
		else {
			var elem = $(target.target).get(0);
			var trans = elem.transform.baseVal.getItem(target.transIndex);
			switch(trans.type) {
			case SVGTransform.SVG_TRANSFORM_TRANSLATE:
				if(target.transType !== 'translate') { return 0; }
				if(target.transParam === 'x') { return trans.matrix.e; }
				if(target.transParam === 'y') { return trans.matrix.f; }
				return 0;
			case SVGTransform.SVG_TRANSFORM_SCALE:
				if(target.transType !== 'scale') { return 0; }
				if(target.transParam === 'x') { return trans.matrix.a; }
				if(target.transParam === 'y') { return trans.matrix.d; }
				return trans.matrix.a;	// assume uniform scale
			case SVGTransform.SVG_TRANSFORM_ROTATE:
				if(target.transType !== 'rotate') { return 0; }
				return trans.angle;
			}
			return 0;
		}
	},

	setTarget: function(target, value) {
		if(target.attr !== 'transform') {
			$(target.target).attr(target.attr, value);
		}
		else {
			var elem = $(target.target).get(0);
			var trans = elem.transform.baseVal.getItem(target.transIndex);
			switch(trans.type) {
			case SVGTransform.SVG_TRANSFORM_TRANSLATE:
				if(target.transParam === 'x') {
					trans.setTranslate(value, trans.matrix.f);
				}
				else if(target.transParam === 'y') {
					trans.setTranslate(trans.matrix.e, value);
				}
				break;
			case SVGTransform.SVG_TRANSFORM_SCALE:
				if(target.transParam === 'x') {
					trans.setScale(value, trans.matrix.d);
				}
				else if(target.transParam === 'y') {
					trans.setScale(trans.matrix.a, value);
				}
				else {
					trans.setScale(value, value);
				}
				break;
			case SVGTransform.SVG_TRANSFORM_ROTATE:
				trans.setRotate(value, 0, 0);
				break;
			}
		}
	},

	setReal: function(cid, value) {
		var control = this.controls[cid]
		var targets = control.targets;
		var that = this;
		targets.forEach(function(target) {
			that.setTarget(target, value);
		});

		control.slider.value = value;
		$(control.elem).attr("value", value);
	},

	setColor: function(cid, value) {
		var isStr = typeof value === 'string';
		var colorStr = isStr? value: this.colorToString(value);
		var color = isStr? this.stringToColor(value): value;

		var control = this.controls[cid]
		var targets = control.targets;
		var that = this;
		targets.forEach(function(target) {
			that.setTarget(target, colorStr);
		});

		control.sliderR.value = value.r;
		control.sliderG.value = value.g;
		control.sliderB.value = value.b;
		$(control.elem).attr("value", colorStr);
	},

	save: function() {
		var blob = new Blob([this.svg.parent().html()], {type: "image/svg+xml;charset=utf-8"});
		saveAs(blob, "logo.svg");
	},
};

$(document).ready(function() {
	'use strict';

	var controlableSvg = null;

	var openSvg = function(file) {
		if(controlableSvg) {
			controlableSvg.destroy();
			controlableSvg = null;
		}

		var url = window.URL.createObjectURL(file);
		var obj = $("<object />").attr({ id: "loader", type: 'image/svg+xml', data: url }).css('visibility', 'hidden').appendTo(document.body).get(0);

		var load = function() {
			controlableSvg = new ControlableSvg(this.contentDocument.firstChild, document.body);
			window.URL.revokeObjectURL(url);
			$(obj).remove();
		};

		obj.addEventListener("load", load);

//		$.get(url, {}, function(resp) {
//			controlableSvg = new ControlableSvg(resp.firstChild, document.body);
//			window.URL.revokeObjectURL(url);
//		});
	};

	$("#fileInput").on("change", function() {
		openSvg(this.files[0]);
	});
	$("#loadButton").button().click(function() {
		$("#fileInput").get(0).click();
	});
	$("#saveButton").button().click(function() {
		controlableSvg.save();
	});
});
