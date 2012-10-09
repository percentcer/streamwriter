var canvas = document.getElementById("textarea");
var ctx    = canvas.getContext("2d");

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.font = "bold 200px sans-serif";
    
    // put the clock within the new window
    clock_r = 50;
    clock_x = window.innerWidth - clock_r - 15;
    clock_y = clock_r + 15;

    text_y  = 400;
}

var textWritten;
var textVisible;

// prompt stuff
var externWordList = words;
var promptID;
var lastPromptCharIndex;
var promptTypingSpeed;
var userHasTyped;

// thresholding
var promptThreshHold;
var threshHold;
var userThreshHold;

var charPerSecondWindow;
var avgTimeBetweenKeystrokes;
var targetAvg;

var timeStampOfKeystroke;

var startTime;
var prevTime;
var curTime;
var timeLimit;

var lightness;
var baseHue;
var baseSat;

var fadeTime; // ms

var finalRGB;
var finalRGBString;

var clock_r;
var clock_x;
var clock_y;
var clock_arc;

var text_y;


function init() {
    textWritten = '';
    textVisible = '';
    
    // prompt stuff
    promptID = getPromptID(externWordList);
    lastPromptCharIndex = 0;
    promptTypingSpeed = 80; // ms per char
    userHasTyped = false;
    
    // thresholding
    promptThreshHold = externWordList[promptID].length + 2;
    threshHold = promptThreshHold;
    userThreshHold = 7;
    
    charPerSecondWindow = 10; // looks at the last ten characters typed to get the cps
    avgTimeBetweenKeystrokes = 0; // ms
    targetAvg = 60; // ms between keys, really cruising.
    
    timeStampOfKeystroke = []; // maps the n-th character typed to the elapsed time when it was typed (indexed by nth char)
    
    startTime = new Date().getTime();
    prevTime = startTime;
    curTime  = startTime;
    timeLimit = 5000.0; // three minutes
    
    lightness = 0;
    baseHue = Math.random();
    baseSat = 1;
    
    fadeTime = 1000; // ms
    
    finalRGB = [0,0,0];
    finalRGBString = '';

    clock_arc = (Math.PI * 2) * ( (curTime - startTime) / timeLimit) - (Math.PI / 2);
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

function getPromptID(wordArray) {
	return Math.floor(Math.random() * wordArray.length) ;
}

function printPromptChar(charIndex, id) {
	var theWord = '"' + externWordList[id] + '"';
	if (charIndex < theWord.length) {
		printChar(theWord.charAt(charIndex));
	}
	return ++charIndex;
}

function componentsToRGBString(components) {
    return "rgb(" + parseInt(components[0]) + "," + parseInt(components[1]) + "," + parseInt(components[2]) + ")"; 
}

function loop () {
	if (!userHasTyped) {
		if ((curTime - startTime) / (promptTypingSpeed) >= lastPromptCharIndex) {
			lastPromptCharIndex = printPromptChar(lastPromptCharIndex, promptID);
		}
	}
	
    prevTime = curTime;
    curTime = new Date().getTime();

    var dt = curTime - prevTime;

    clock_arc = (Math.PI * 2) * ( (curTime - startTime) / timeLimit) - (Math.PI / 2);

    if (clock_arc >= (Math.PI * 2 - Math.PI / 2)) {
        init();
    }
	
	draw(dt);
	
	setTimeout(loop,0);
}

function preventBackspaceHandler(evt) {
    evt = evt || window.event;
    if (evt.keyCode == 8 || evt.keyCode == 27) {
		canvas.onkeypress(evt);
        return false;
    }
}

function calcCharPerSecond() {
	if (timeStampOfKeystroke.length == 0) {
		return;
	}

    var sample;
	if (timeStampOfKeystroke.length < charPerSecondWindow) {
        sample = timeStampOfKeystroke;	
	} else {
        sample = timeStampOfKeystroke.slice(timeStampOfKeystroke.length - charPerSecondWindow);	
	}
    
    var gapSum = 0;
    for (var i = 0; i < sample.length - 1; i++) {
        // Go through each 'gap' in the timestamps, add it up, set average to average of gaps
        gapSum += (sample[i+1] - sample[i]);
    }
    avgTimeBetweenKeystrokes = gapSum / sample.length;
}

function printChar(charStr) {	
	timeStampOfKeystroke.push(curTime);
	calcCharPerSecond();
	
	textWritten += charStr;
}

function keypressHandler(evt) {
	if (!userHasTyped) {
		textWritten = '';
		timeStampOfKeystroke = [];
		threshHold = userThreshHold;
		userHasTyped = true;
	}
	
	if (evt.keyCode == 8) {
		// delete
		textWritten = textWritten.slice(0,-1);
		timeStampOfKeystroke.pop();
		// don't recalc average, dude is just a slowpoke
		return;
	} 

    if (evt.keyCode == 27) {
        // escape
        init();
        return;
    }
	
	var charCode = evt.which;
	var charStr = String.fromCharCode(charCode);
	
	printChar(charStr);
}

function draw(dt) {
	textVisible = textWritten.substring(textWritten.length - threshHold);
	
	ctx.fillStyle = '#222';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	var offset = 0;
	for (var i = 0; i < textVisible.length; i++) {
		var character = textVisible.charAt(i);
		var timeStampOffset = 0;
		if (timeStampOfKeystroke.length > threshHold) {
			timeStampOffset = timeStampOfKeystroke.length - threshHold;
		}
		var characterTimeStamp = timeStampOfKeystroke[i + timeStampOffset];
		var elapsedTime = curTime - characterTimeStamp;
		var charPerSecondModifier = targetAvg / avgTimeBetweenKeystrokes;
		
		lightness = (charPerSecondModifier > 1 ? 1 : charPerSecondModifier) * 1 - (elapsedTime / fadeTime);
		var cappedLightness = lightness > 0 ? lightness : 0;
		var components = hslToRgb(baseHue, baseSat, cappedLightness);
		
		ctx.fillStyle = componentsToRGBString(components);
		ctx.fillText(character,offset,text_y);
		offset += ctx.measureText(character).width;
	}
    
    ctx.fillStyle = componentsToRGBString(hslToRgb(baseHue, baseSat, 0.5));
    ctx.beginPath();
    ctx.moveTo(clock_x, clock_y);
    ctx.lineTo(clock_x, clock_y + clock_r);
    ctx.arc(clock_x, clock_y, clock_r, -(Math.PI / 2), clock_arc, false);
    ctx.lineTo(clock_x, clock_y);
    ctx.closePath();
    ctx.fill();
}

/////////////////////////////////////////////
resizeCanvas();
canvas.focus();
document.onkeydown = preventBackspaceHandler;
canvas.onkeypress  = keypressHandler;

init();
loop();
