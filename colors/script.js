window.onload = init;

// START
// https://www.pepto.de/projects/colorvic/
// START

var levels = { mc: [ 0 ], fr: [ 0 ] };            // Black (luma switched off)

with ( levels )
{
    // most common

    mc[ 0x6 ] = mc[ 0x9 ] =  8;                   // Blue,    Brown
    mc[ 0xb ] = mc[ 0x2 ] = 10;                   // Dk.Grey, Red
    mc[ 0x4 ] = mc[ 0x8 ] = 12;                   // Purple,  Orange
    mc[ 0xc ] = mc[ 0xe ] = 15;                   // Md.Grey, Lt.Blue
    mc[ 0x5 ] = mc[ 0xa ] = 16;                   // Green,   Lt.Red
    mc[ 0xf ] = mc[ 0x3 ] = 20;                   // Lt.Grey, Cyan
    mc[ 0x7 ] = mc[ 0xd ] = 24;                   // Yellow,  Lt.Green
    mc[ 0x1 ]             = 32;                   // White

    // first revision

    fr[ 0x2 ] = fr[ 0x6 ] = fr[ 0x9 ] = fr[ 0xb ]                         = 8 * 1;
    fr[ 0x4 ] = fr[ 0x5 ] = fr[ 0x8 ] = fr[ 0xa ] = fr[ 0xc ] = fr[ 0xe ] = 8 * 2;
    fr[ 0x3 ] = fr[ 0x7 ] = fr[ 0xd ] = fr[ 0xf ]                         = 8 * 3;
    fr[ 0x1 ]                                                             = 8 * 4;
}


var angles = [];

angles[ 0x4 ]                 = 2;                // Purple
angles[ 0x2 ] = angles[ 0xa ] = 4;                // Red
angles[ 0x8 ]                 = 5;                // Orange
angles[ 0x9 ]                 = 6;                // Brown
angles[ 0x7 ]                 = 7;                // Yellow
angles[ 0x5 ] = angles[ 0xd ] = 2 + 8;            // Green
angles[ 0x3 ]                 = 4 + 8;            // Cyan
angles[ 0x6 ] = angles[ 0xe ] = 7 + 8;            // Blue

function compose( index, revision, brightness, contrast, saturation )
{
    // constants

    var sector = 360/16;
    var origin = sector/2;
    var radian = Math.PI/180;
    var screen = 1/5;

    // normalize

    brightness -=  50;
    contrast   /= 100;
    saturation *=   1 - screen;

    // construct

    var components = { u: 0, v: 0 };            // monochrome (chroma switched off)

    if ( angles[ index ] )
    {
        var angle = ( origin + angles[ index ] * sector ) * radian;

        components.u = Math.cos( angle ) * saturation;
        components.v = Math.sin( angle ) * saturation;
    }

    components.y = 8 * levels[ revision ][ index ] + brightness;

    for ( var i in components )
    {
        components[ i ] *= contrast + screen;
    }

    return components;
}

function convert( components, source )
{
    // matrix transformation

    var color = {};

    color.r = components.y                        + 1.140 * components.v;
    color.g = components.y - 0.396 * components.u - 0.581 * components.v;
    color.b = components.y + 2.029 * components.u;

    // gamma correction

    var target = 2.2;                            // sRGB

    for ( var i in color )
    {
        color[ i ] = Math.max( Math.min( color[ i ], 255 ), 0 );

        color[ i ] = Math.pow( 255, 1 -   source ) * Math.pow( color[ i ],   source );
        color[ i ] = Math.pow( 255, 1 - 1/target ) * Math.pow( color[ i ], 1/target );

        color[ i ] = Math.round( color[ i ] );
    }

    color.y = components.y;
    color.u = components.u;
    color.v = components.v;

    return color;
}

// END
// https://www.pepto.de/projects/colorvic/
// END


// https://stackoverflow.com/questions/5623838
function hexFromComponent(c) {
	var hex = (c | 0).toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}
function hexFromRGB(r, g, b) {
	return "#" + hexFromComponent(r) + hexFromComponent(g) + hexFromComponent(b);
}

function yFromRGB(r, g, b) {
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
}

// https://wisotop.de/rgb-nach-hsv.php
function HSVfromRGB(r, g, b) {
	var h, s, v;
	var min, max, delta;
	min = Math.min(r, g, b);
	max = Math.max(r, g, b);
	v = max;
	delta = max - min;
	if (max != 0 ) {
		s = delta / max;
	} else {
		s = 0;
		h = -1;
		return { h: h, s: s, v: v };
	}
	if (max == min) {
		h = 0;
		s = 0;
		return { h: h, s: s, v: v };
	}
	if (r == max) {
		h = (g - b) / delta;
	} else if (g == max) {
		h = 2 + ( b - r ) / delta;
	} else {
		h = 4 + ( r - g ) / delta;
	}
	h *= 60;
	if (h < 0) {
		h += 360;
	}
	return { h: h, s: s, v: v };
}
function RGBfromHSV(h, s, v) {
   var i;
   var f, p, q, t;
   if (s == 0 ) {
	return { r: v, g: v, b: v};
   }
   h /= 60;
   i = Math.floor( h );
   f = h - i;
   p = v * ( 1 - s );
   q = v * ( 1 - s * f );
   t = v * ( 1 - s * ( 1 - f ) );
   switch( i ) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      default:  // case 5:
         r = v; g = p; b = q; break;
   }
   return { r: r, g: g, b: b};
}

// https://css-tricks.com/converting-color-spaces-in-javascript/
function RGBfromHSL(h,s,l) {
  // Must be fractions of 1
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0,
      g = 0,
      b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r: r, g: g, b: b };
}
function HSLfromRGB(r,g,b) {
  r /= 255;
  g /= 255;
  b /= 255;

  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;
  if (delta == 0)
    h = 0;
  else if (cmax == r)
    h = ((g - b) / delta) % 6;
  else if (cmax == g)
    h = (b - r) / delta + 2;
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0)
      h += 360;

  l = (cmax + cmin) / 2;

  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h: h, s: s, l: l };
}

// https://github.com/antimatter15/rgb-lab
// MIT-licensed
function LabFromRGB(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  var x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return {l: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z)};
}
// calculate the perceptual distance between colors in CIELAB
// https://github.com/antimatter15/rgb-lab
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs
function deltaE(labA, labB){
  var deltaL = labA.l - labB.l;
  var deltaA = labA.a - labB.a;
  var deltaB = labA.b - labB.b;
  var c1 = Math.sqrt(labA.a * labA.a + labA.b * labA.b);
  var c2 = Math.sqrt(labB.a * labB.a + labB.b * labB.b);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / (1.0);
  var deltaCkcsc = deltaC / (sc);
  var deltaHkhsh = deltaH / (sh);
  var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function colorspaceHTML(mapped_colors, mixingstyle) {
	html = '';
	var yres = 64;
	var zres = 5;
	var scale = 1;
	for (var z = 0; z < zres; z++) {
		var paths = '';
		for (var y = 0; y < yres; y++) {
			var xres = z ? yres : 8;
			var prevcolor = null;
			var count = 0;
			for (var x = 0; x < xres; x++) {
				h = x * 360 / xres;
				s = z * 100 / zres;
				l = y * 100 / yres;
				rgb = RGBfromHSL(h, s, l);
				var r = rgb.r;
				var g = rgb.g;
				var b = rgb.b;
				if (mapped_colors) {
					var cr = null;
					var mindist = 999;
					for (var i = 0; i < colors.length; i++) {
						c = colors[i];
						var lab1 = LabFromRGB(c.r, c.g, c.b);
						var lab2 = LabFromRGB(r, g, b);
						var dist = deltaE(lab1, lab2);
						if (dist < mindist) {
							mindist = dist;
							cr = c;
						}
					}
					if (cr.component1) {
						c1 = cr.fixedComponent1;
						c2 = cr.fixedComponent2;
						if (mixingstyle == 0) {
							condition = y & 1;
						} else if (mixingstyle == 1) {
							condition = x & 1;
						} else if (mixingstyle == 2) {
							condition = (x & 1) ^ (y & 1);
						} else if (mixingstyle == 3) {
							condition = ((x >> 1) & 1) ^ (y & 1);
						}
						if (condition) {
							var fgcolor = hexFromRGB(c1.r, c1.g, c1.b);
						} else {
							var fgcolor = hexFromRGB(c2.r, c2.g, c2.b);
						}
					} else {
						var fgcolor = hexFromRGB(cr.r, cr.g, cr.b);
					}
				} else {
					var fgcolor = hexFromRGB(r, g, b);
				}
				if (!prevcolor || fgcolor == prevcolor) {
					count++;
				} else {
					paths += '<path stroke="' + prevcolor + '" d="M' + (x - count) + ' ' + y + 'h' + count + '"/>'
					count = 1;
				}
				prevcolor = fgcolor;
			}
			paths += '<path stroke="' + prevcolor + '" d="M' + (x - count) + ' ' + y + 'h' + count + '"/>'
		}
		html += '<svg xmlns="http://www.w3.org/2000/svg" style="border: 1px solid black;" width="' + xres * scale + '" height="' + yres * scale + '" shape-rendering="auto" viewBox="0 -.5 ' + xres + ' ' + yres + '">' + paths + '</svg>&nbsp;';
	}
	return html;
}

function colorspaceScreen() {
	bytes = [];
	var yres = 25;
	var scale = 1;
	var paths = '';
	for (var y = 0; y < yres; y++) {
		var xres = 40;
		for (var x = 0; x < xres; x++) {
			h = x * 360 / xres;
			s = x ? 100 : 0;
			l = y * 100 / yres;
			rgb = RGBfromHSL(h, s, l);
			var r = rgb.r;
			var g = rgb.g;
			var b = rgb.b;

			var cr;
			var mindist = 999;
			for (var i = 0; i < colors.length; i++) {
				c = colors[i];
				var lab1 = LabFromRGB(c.r, c.g, c.b);
				var lab2 = LabFromRGB(r, g, b);
				var dist = deltaE(lab1, lab2);
				if (dist < mindist) {
					mindist = dist;
					cr = c;
				}
			}
			if (cr.component1) {
				if (fc1.y > fc2.y) {
					var i1 = cr.component1.index;
					var i2 = cr.component2.index;
				} else {
					var i1 = cr.component2.index;
					var i2 = cr.component1.index;
				}
			} else {
				var i1 = cr.index;
				var i2 = cr.index;
			}
			bytes.push(i1 << 4 | i2);
		}
	}
	return bytes;
}

function combineColors(c1, c2, gamma) {
	// create two colors with the average UV, but kepping their respective Y
	u = (c1.u + c2.u) / 2;
	v = (c1.v + c2.v) / 2;
	fc1 = convert({ y: c1.y, u: u, v: v }, 2.8);
	fc2 = convert({ y: c2.y, u: u, v: v }, 2.8);
	if (fc1.y > fc2.y) {
		return { c1: fc1, c2: fc2 };
	} else {
		return { c1: fc2, c2: fc1 };
	}
}

function svgForColors(c1, c2, mixingstyle) {
	var hexcolor1 = hexFromRGB(c1.r, c1.g, c1.b);
	var hexcolor2 = hexFromRGB(c2.r, c2.g, c2.b);
	if (mixingstyle == 0) { // alternating lines
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="2" shape-rendering="auto" viewBox="0 -.5 1 2">'
		svg += '<path stroke="' + hexcolor1 + '" d="M0 0h1"></path>'
		svg += '<path stroke="' + hexcolor2 + '" d="M0 1h1"></path>'
		svg += '</svg>'
	} else if (mixingstyle == 1) { // alternating columns
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="1" shape-rendering="auto" viewBox="0 -.5 2 1">'
		svg += '<path stroke="' + hexcolor1 + '" d="M0 0h1"></path>'
		svg += '<path stroke="' + hexcolor2 + '" d="M1 0h1"></path>'
		svg += '</svg>'
	} else if (mixingstyle == 2) { // checkered
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2" shape-rendering="auto" viewBox="0 -.5 2 2">'
		svg += '<path stroke="' + hexcolor1 + '" d="M0 0h1"></path>'
		svg += '<path stroke="' + hexcolor2 + '" d="M1 0h1"></path>'
		svg += '<path stroke="' + hexcolor2 + '" d="M0 1h1"></path>'
		svg += '<path stroke="' + hexcolor1 + '" d="M1 1h1"></path>'
		svg += '</svg>'
	} else if (mixingstyle == 3) { // checkered h2x
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="2" shape-rendering="auto" viewBox="0 -.5 4 2">'
		svg += '<path stroke="' + hexcolor1 + '" d="M0 0h2"></path>'
		svg += '<path stroke="' + hexcolor2 + '" d="M2 0h2"></path>'
		svg += '<path stroke="' + hexcolor2 + '" d="M0 1h2"></path>'
		svg += '<path stroke="' + hexcolor1 + '" d="M2 1h2"></path>'
		svg += '</svg>'
	}
	return svg;
}

var gSheet;
var colors;

function init() {
	gSheet = document.createElement('style')
	document.head.appendChild(gSheet);

	document.getElementById("colorspace_rgb").innerHTML = colorspaceHTML(false, 0);
	document.getElementById("colorspace_rgb").style = 'display: none;';
	reset();
	refresh();
}

function refresh() {
	lumalevels = document.getElementById("lumalevels").selectedIndex ? 'mc': 'fr';
	mixedcols = document.getElementById("mixedcols").checked;
	maxlumadiff = document.getElementById("maxlumadiff").value;
	brightness = document.getElementById("brightness").value;
	contrast = document.getElementById("contrast").value;
	saturation = document.getElementById("saturation").value;
	gamma = document.getElementById("gamma").value / 10;

	sortby = document.getElementById("sortby").selectedIndex;
	mixingstyle = document.getElementById("mixingstyle").selectedIndex;
	boxsize = document.getElementById("boxsize").value;
	showcomponents = document.getElementById("showcomponents").checked;
	showeffcol = document.getElementById("showeffcol").checked;
	showmixedcol = document.getElementById("showmixedcol").checked;
	showluma = document.getElementById("showluma").checked;

	//
	// copy slider values to text fields
	//
	document.getElementById("maxlumadiff_val").innerHTML = maxlumadiff;
	document.getElementById("brightness_val").innerHTML = brightness;
	document.getElementById("contrast_val").innerHTML = contrast;
	document.getElementById("saturation_val").innerHTML = saturation;
	document.getElementById("gamma_val").innerHTML = gamma;

	//
	// enable disable luma threshold slider
	//
	maxlumadiff_div = document.getElementById("maxlumadiff_div");
	if (!mixedcols) {
		maxlumadiff_div.style.pointerEvents = 'none';
		maxlumadiff_div.style.opacity = '0.5';
		document.getElementById("maxlumadiff").value = 0;
	} else {
		maxlumadiff_div.style.pointerEvents = null;
		maxlumadiff_div.style.opacity = null;
	}

	//
	// create Colodore palette
	//
	colors = []
	for (var i = 0; i < 16; i++) {
		var c = convert(compose(i, lumalevels, brightness, contrast, saturation), gamma);
		c.index = i;
		c.description = i;
		c.h = HSVfromRGB(c.r, c.g, c.b).h;
		colors.push(c);
	}

	//
	// create mixed colors
	//
	if (mixedcols) {

		var lumas = [];
		for (var i = 0; i < colors.length; i++) {
			y = colors[i].y;
			if (!lumas.includes(y)) {
				lumas.push(y);
			}
		}
		function compare(a, b) {
			return a - b;
		}
		lumas.sort(compare);

		var l = colors.length;
		for (var lthreshold = 0; lthreshold <= maxlumadiff; lthreshold += 10) {
			l2 = colors.length;
			for (var i = 0; i < l; i++) {
				var c1 = colors[i];
				for (var j = i+1; j < l; j++) {
					var c2 = colors[j];
					var lumadiff = Math.abs(c1.y - c2.y);
					if (lumadiff <= lthreshold) {
						var exists = false;
						for (var k = l; k < l2; k++) {
							if (colors[k].component1.index == i && colors[k].component2.index == j) {
								exists = true;
								break;
							}
						}
						if (exists) {
							continue;
						}
						var cm = {}
						cm.r = ((c1.r + c2.r) / 2) | 0;
						cm.g = ((c1.g + c2.g) / 2) | 0;
						cm.b = ((c1.b + c2.b) / 2) | 0;
						cm.y = ((c1.y + c2.y) / 2) | 0;
						hsl = HSLfromRGB(cm.r, cm.g, cm.b);
						cm.h = hsl.h;
						cm.s = hsl.s;
						cm.index = colors.length;
						cm.description = '' + c1.index + '/' + c2.index;
						cm.component1 = c1;
						cm.component2 = c2;
						fixedColors = combineColors(c1, c2, gamma);
						cm.fixedComponent1 = fixedColors.c1;
						cm.fixedComponent2 = fixedColors.c2;
						colors.push(cm);
					}
				}
			}
		}
	}

	//
	// sort
	//
	function compare_y(a, b) {
		return a.y - b.y;
	}
	function compare_h(a, b) {
		if (a.h <= 0 && b.h <= 0) {
			// both gray? then sort by Y
			return a.y - b.y;
		}
		if (a.h <= 0) {
			return -1;
		}
		if (b.h <= 0) {
			return 1;
		}
		return a.h - b.h;
	}
	function compare_index(a, b) {
		return a.index - b.index;
	}
	if (sortby == 0) {
		colors.sort(compare_h);
	} else if (sortby == 1) {
		colors.sort(compare_y);
	} else {
		colors.sort(compare_index);
	}

	//
	// create css
	//
	css = '';
	css += '.colbox {';
	css += '  border: none;';
	css += '  border-collapse: collapse;';
	css += '  padding: 0px;';
	css += '  margin: 0px;';
	css += '  width: ' + boxsize + ';';
	css += '  height: ' + boxsize + ';';
	css += '}';
	gSheet.innerHTML = css;

	//
	// create cells
	//
	row0 = document.getElementById("row0");
	row0.innerHTML = '';
	row1 = document.getElementById("row1");
	row1.innerHTML = '';
	row2 = document.getElementById("row2");
	row2.innerHTML = '';
	row3 = document.getElementById("row3");
	row3.innerHTML = '';
	for (var i = 0; i < colors.length; i++) {
		if (showcomponents) {
			if (i ==0) row0.innerHTML = '<td>C</td>';
			var td = document.createElement("td");
			td.className='colbox'
			td.id='ccol' + i;
			row0.appendChild(td);
		}
		if (showeffcol) {
			if (i ==0) row1.innerHTML = '<td>E</td>';
			var td = document.createElement("td");
			td.className='colbox'
			td.id='col' + i;
			row1.appendChild(td);
		}
		if (showmixedcol) {
			if (i ==0) row2.innerHTML = '<td>M</td>';
			td = document.createElement("td");
			td.className='colbox'
			td.id='mcol' + i;
			row2.appendChild(td);
		}
		if (showluma) {
			if (i ==0) row3.innerHTML = '<td>L</td>';
			td = document.createElement("td");
			td.className='colbox'
			td.id='ycol' + i;
			row3.appendChild(td);
		}
	}

	//
	// fill cells with colors
	//
	text_hexcolors = '';
	text_basic = '';
	basic_lineno = 100;
	basic_line = '';
	for (var i = 0; i < colors.length; i++) {
		c = colors[i];
		hexcolor = hexFromRGB(c.r, c.g, c.b);
		if (showcomponents) {
			component1 = c.component1;
			component2 = c.component2;
			if (!component1) {
				component1 = c;
				component2 = c;
			}
			var hexcolor1 = hexFromRGB(component1.r, component1.g, component1.b);
			var hexcolor2 = hexFromRGB(component2.r, component2.g, component2.b);

			var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="1" shape-rendering="auto" viewBox="0 -.5 16 1" style="background-color: ' + hexcolor1 + ';">'
			svg += '<path stroke="' + hexcolor2 + '" d="M0 0h8"></path>'
			svg += '</svg>'
			svg = svg.replace(/#/g, '%23');
			image = "url('data:image/svg+xml;utf8," + svg + "')";
			document.getElementById("ccol"+i).style.backgroundImage = image;
			document.getElementById("ccol"+i).style.backgroundSize = '100%';
		}
		if (showeffcol) {
			document.getElementById("col"+i).style = 'background-color: ' + hexcolor;
		}
		if (showmixedcol) {
			component1 = c.fixedComponent1;
			component2 = c.fixedComponent2;
			if (!component1) {
				component1 = c;
				component2 = c;
			}
			svg = svgForColors(component1, component2, mixingstyle);
			svg = svg.replace(/#/g, '%23');
			image = "url('data:image/svg+xml;utf8," + svg + "')";
			document.getElementById("mcol"+i).style.backgroundImage = image;
		}
		if (showluma) {
			y = (Math.max(c.y, 0) / 307.2 * 255) | 0;
			yhexcolor = hexFromRGB(y, y, y);
			document.getElementById("ycol"+i).style = 'background-color: ' + yhexcolor;
		}

		// hex colors
		text_hexcolors += hexcolor + '\n';

		// BASIC
		if (basic_line.length) {
			basic_line += ',';
		}
		var i1 = null, i2 = null;
		if (c.component1) {
			if (c.component1.y > c.component2.y) {
				i1 = c.component1.index;
				i2 = c.component2.index;
			} else {
				i1 = c.component2.index;
				i2 = c.component1.index;
			}
		} else {
			i1 = c.index;
			i2 = c.index;
		}
		basic_line += '' + (i1 << 4 | i2);
		if (basic_line.length > 65) {
			text_basic += '' + basic_lineno + ' data' + basic_line + '\n';
			basic_lineno += 10;
			basic_line = '';
		}
	}
	text_basic += '' + basic_lineno + ' data' + basic_line + '\n';

	text_basic += '200 v=53248:g=8192:s0=1024:s1=s0+200:s2=s0+2*200:s3=s0+3*200' + '\n';
	text_basic += '210 fori=0to999:pokes0+i,0:next' + '\n';
	text_basic += '220 p=0:q=255:fori=gtog+1087step2:pokei,p:pokei+1,q:next' + '\n';
	text_basic += '230 p=170:q=p:fori=g+1600tog+1600+1087step2:pokei,p:pokei+1,q:next' + '\n';
	text_basic += '240 p=170:q=85:fori=g+2*1600tog+2*1600+1087step2:pokei,p:pokei+1,q:next' + '\n';
	text_basic += '250 p=51:q=204:fori=g+3*1600tog+3*1600+1087step2:pokei,p:pokei+1,q:next' + '\n';
	text_basic += '260 pokev+32,0' + '\n';
	text_basic += '270 pokev+17,peek(v+17)or(11*16)' + '\n';
	text_basic += '280 pokev+22,peek(v+22)and(255-16)' + '\n';
	text_basic += '290 pokev+24,peek(v+24)or8' + '\n';
	text_basic += '300 fori=0to' + (colors.length - 1) + ':reada:pokes0+i,a:pokes1+i,a:pokes2+i,a:pokes3+i,a:next' + '\n';
	text_basic += '310 goto310' + '\n';
	text_basic += 'run' + '\n';
	text_basic += '\n';

	//
	// fill BASIC text field 1
	//
	document.getElementById("text_basic1_lower").innerHTML = text_basic;
	document.getElementById("text_basic1_upper").innerHTML = text_basic.toUpperCase();

	//
	// fill BASIC text field 2
	//
	bytes = colorspaceScreen();
	text_basic = ''
	basic_line = ''
	basic_lineno = 0;
	for (var i = 0; i < bytes.length; i++) {
		if (basic_line.length) {
			basic_line += ',';
		}
		basic_line += '' + bytes[i];
		if (basic_line.length > 65) {
			text_basic += '' + basic_lineno + ' data' + basic_line + '\n';
			basic_lineno += 1;
			basic_line = '';
		}
	}
	text_basic += '' + basic_lineno + ' data' + basic_line + '\n';
	text_basic += '200 v=53248:g=8192:s=1024' + '\n';
	text_basic += '210 fori=0to999:reada:pokes+i,a:next' + '\n';
	text_basic += '300 pokev+32,0' + '\n';
	text_basic += '310 pokev+17,peek(v+17)or(11*16)' + '\n';
	text_basic += '320 pokev+22,peek(v+22)and(255-16)' + '\n';
	text_basic += '330 pokev+24,peek(v+24)or8' + '\n';
	text_basic += '400 p=170:q=85:fori=gtog+7999step2:pokei,p:pokei+1,q:next' + '\n';
	text_basic += '500 goto500' + '\n';
	text_basic += 'run' + '\n';
	document.getElementById("text_basic2_lower").innerHTML = text_basic;
	document.getElementById("text_basic2_upper").innerHTML = text_basic.toUpperCase();

	//
	// fill hex text field
	//
	document.getElementById("hexcolors").innerHTML = text_hexcolors;

	//
	// number of colors
	//
	document.getElementById("numcol").innerHTML = colors.length;

	//
	// colorspace diagram
	//
	document.getElementById("colorspace_mapped").innerHTML = colorspaceHTML(true, mixingstyle);
}

function reset() {
	document.getElementById("brightness").value = 50;
	document.getElementById("contrast").value = 100;
	document.getElementById("saturation").value = 50;
	document.getElementById("gamma").value = 28; // PAL: 2.8
	refresh();
}

function hideColorspace(hide) {
	if (hide) {
		document.getElementById("colorspace_mapped").style.display = 'none';
		document.getElementById("colorspace_rgb").style.display = '';
	} else {
		document.getElementById("colorspace_mapped").style.display = '';
		document.getElementById("colorspace_rgb").style.display = 'none';
	}
}

function preset(numcol) {
	var maxlumadiff;
	switch (numcol) {
		case 16:
			maxlumadiff = -1;
			break;
		case 23:
			maxlumadiff = 0;
			break;
		case 39:
			maxlumadiff = 35;
			break;
		case 55:
			maxlumadiff = 48;
			break;
		case 71:
			maxlumadiff = 70;
			break;
		case 136:
			maxlumadiff = 310;
			break;
	}
	if (maxlumadiff >= 0) {
		document.getElementById("mixedcols").checked = true;
		document.getElementById("maxlumadiff").value = maxlumadiff;
	} else {
		document.getElementById("mixedcols").checked = false;
	}
	document.getElementById("lumalevels").selectedIndex = 1;
	refresh();
}

function toggleCase(id1, id2) {
	if (document.getElementById(id1).style.display == '') {
		document.getElementById(id1).style.display = 'none';
		document.getElementById(id2).style.display = '';
	} else {
		document.getElementById(id1).style.display = '';
		document.getElementById(id2).style.display = 'none';
	}
}

function copyElement(id1, id2) {
	var basic_text = document.getElementById("i_text_basic");
	if (document.getElementById(id1).style.display == '') {
		basic_text.value = document.getElementById(id1).innerHTML;
	} else {
		basic_text.value = document.getElementById(id2).innerHTML;
	}
	basic_text.style = '';
	basic_text.select();
	document.execCommand('copy');
	basic_text.style = 'display: none;';
}
