/* ---------------
	Set up the canvas
	--------------*/

var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");
context.fillStyle = "#ffffff";
context.strokeStyle = "#ffffff";
context.lineWidth = 1;

// size of the spider
var spiderRadius = 5;

// info about the web we are on
var currentWeb = null;
var currentSlope = 0;
var currentAngle = 0;

// movement speed
var xSpeed = 4;
var ySpeed = 4;

var jumping = false;
var falling = false;
var maxJumpHeight = 80;
var currentJumpHeight = 0;

var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;

var disappearanceSpeed = .01;
var gameHeight = canvas.height;
var currentBottom = 0;

var highestWebHeight = 0;

// begin at the center & bottom
var spiderX = canvas.width/2;
var spiderY = spiderRadius;

var score = 0;

// x1 y1 x2 y2 strength id
var webs = [
	[0, 0, canvas.width, 0, 1, "floor"]
];

/**
* Converts a y-coordinate in the game to its position on the canvas
* @param {number} [y] the y-coordinate in the game
* @return {number} the y-coordinate on the canvas
*/
function gameYToCanvasY(y){
	// 0 in game = canvas.height
	// 100 in game = canvas.height - 100
	// canvas.height - x
	return currentBottom + (canvas.height - y);
}

/**
* Returns the angle of a web
* @param {Array} [web] the web
* @return {number} the angle of the web
*/
function findAngle(web){
	slope = (web[3] - web[1])/(web[2]-web[0]);
	tan = Math.atan(slope);
	return -tan;
}

/**
* Determines whether a given web has been worn down fully or not
* @param {Array} [web] the web
* @param {boolean} whether the web exists
*/
function isWebGone(web){
	if(web[4] - disappearanceSpeed < 0){
		return true;
	}
	return false;
}

/**
* Draws the spider on the canvas
*/
function drawSpider(){
	var drawY = gameYToCanvasY(spiderY);

	// translate so that we are centered on the spider
	context.translate(spiderX, drawY);

	// Draw the boySpeed
	context.beginPath();
	context.arc(0, 0, spiderRadius, 0, Math.PI*2);
	context.fill();
	context.closePath();

	// Draw the legs
	for(var i = 0; i <4; i ++){
		// right leg

		// segment 1
		context.beginPath();
		context.rotate(currentAngle);
		context.moveTo(spiderRadius/2,-spiderRadius/2);
		context.lineTo(spiderRadius*4,-2*spiderRadius);
		context.stroke();
		context.rotate(-currentAngle);
		context.closePath();
		
		// segment 2
		context.beginPath();
		context.rotate(currentAngle);
		context.moveTo(spiderRadius*4,-2*spiderRadius);
		context.lineTo(spiderRadius*8,-spiderRadius/2);
		context.stroke();
		context.rotate(-currentAngle);
		context.closePath();
		
		// left leg

		// segment 1
		context.beginPath();
		context.rotate(currentAngle);
		context.moveTo(-spiderRadius/2,-spiderRadius/2);
		context.lineTo(-spiderRadius*4,-2*spiderRadius);
		context.stroke();
		context.rotate(-currentAngle);
		context.closePath();
		
		// segment 2
		context.beginPath();
		context.rotate(currentAngle);
		context.moveTo(-spiderRadius*4,-2*spiderRadius);
		context.lineTo(-spiderRadius*8,-spiderRadius/2);
		context.stroke();
		context.rotate(-currentAngle);
		context.closePath();
		
		context.translate(0,spiderRadius/2);
	}
	context.translate(0,-2*spiderRadius);
	context.translate(- spiderX, -drawY);
}

/**
* Determines whether the spider is still jumping
* @return {boolean}
*/
function isStillJumping(){
	if(currentJumpHeight >= maxJumpHeight){
		return false;
	}
	return true;
}

/**
* Determines whether the spider is falling
* @return {boolean}
*/
function isFalling(){
	if(spiderY > spiderRadius && !jumping && !touchingWebs(spiderX,spiderY)){
		return true;
	}
	return false;
}

/**
* Draws all of the webs
*/
function drawWebs(){
	for(var i = 0; i < webs.length; i ++){
		// the strength of the web determines how brightly
		// the line is drawn
		context.strokeStyle = `rgba(255, 255, 255, ${webs[i][4]})`;
		context.beginPath();
		context.moveTo(webs[i][0], gameYToCanvasY(webs[i][1]));
		context.lineTo(webs[i][2], gameYToCanvasY(webs[i][3]));
		context.stroke();
		context.closePath();     
		context.strokeStyle = "#ffffff";		
	}
}

/**
* Determines whether the given x,y coordinates are on a web
* @param {number} [x]
* @param {number} [y]
* @return {boolean}
*/
function touchingWebs(x,y){
	for(var i = 0; i < webs.length; i ++){
		if(touching(webs[i],x,y)){
			return true;
		}
	}
	return false;
}

/**
* Returns the web that the spider is currently on, or null
* @param {number} [x]
* @param {number} [y]
* @return {Array} the web
*/
function getCurrentWeb(x,y){
	for(var i = 0; i < webs.length; i ++){
		if(touching(webs[i],x,y)){
			return webs[i];
		}
	}
	return null;
}

/**
* Calculates the slope of a given web
* @param {Array} the web
* @return {number} the slope of the web
*/
function getSlope(web){
	if(web[2] - web[0] == 0){
		return 0;
	}
	return (web[3] - web[1])/(web[2] - web[0]);
}

/**
* Returns whether the spider, when centered at the given
* x and y coordinates, would be touching the given web
* @param {number} [x]
* @param {number} [y]
* @return {boolean}
*/
function touching(web,x,y){
	// y = mx + b
	// x = (y-b)/m
	// currently calculating the expected y of the spider
	// if it were located on the line, based on x coordinate
	
	if(isWebGone(web)){
		return false;
	}
	var slope = getSlope(web);
	var yIntercept = web[1] - (slope*web[0]);
	// calculates whether the very middle of the spider
	// is touching the web - probably not optimal
	var Y1 = slope*x + yIntercept;
	var Y2 = slope*x + yIntercept;
	if(y + spiderRadius >= Math.min(Y1,Y2) && y - spiderRadius <= Math.max(Y1,Y2)){
		return true;
	}
	
	return false;
}

/**
* Draws everything. Is called recursively
*/
function draw(){
	
	// have the canvas follow the spider
	currentBottom = spiderY - canvas.height/2;
	
	// clear the canvas
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	currentAngle = 0;

	if(currentWeb != null){
		currentAngle = findAngle(currentWeb);
	}

	if(!jumping && !touchingWebs(spiderX,spiderY)){
		// if you are in the air but not jumping, fall
		falling = true;
		currentWeb = null;
		currentSlope = null;
	}

	if(rightPressed){
		move(xSpeed,xSpeed*currentSlope);
	}
	else if(leftPressed){
		move(-xSpeed,-xSpeed*currentSlope);
	}
	
	if(downPressed && !falling){
		if(currentWeb !=null && currentWeb[5] != "floor"){
			falling = true;
		}
	}
	else if(upPressed){
		if(!jumping && !falling){
			// if we are not falling or already jumping,
			// initiate a jump
			currentJumpHeight = 0;
			jumping = true;
			currentWeb = null;
			currentSlope = 0;
		}
	}

	if(jumping){
		if(isStillJumping()){
			currentJumpHeight += ySpeed;
			move(0,ySpeed);
		}
		else{
			jumping = false;
			falling = true;
			currentJumpHeight = 0;
		}
	}
	else if(falling){
		move(0,-ySpeed);
	}
	
	generateNewWebs();
	
	if(spiderY > score){
		score = spiderY;
	}
	document.getElementById("score").innerHTML = "score: " + Math.floor(score);

	wearDownWeb(currentWeb);
	drawSpider();
	drawWebs();
	requestAnimationFrame(draw);
	removeOldWebs();
}

function generateNewWebs(){
	if(highestWebHeight < spiderY + canvas.height/2){
		var lastWeb = webs[webs.length - 1];
		var determine = Math.random();
		var d1 = Math.floor(Math.random()*(maxJumpHeight - spiderRadius*2));
		var d2 = Math.floor(50 + Math.random()*90);
		if(determine < .5){
			var newWeb = [lastWeb[0],lastWeb[1] + d1,lastWeb[2],lastWeb[1] + d1 + d2,1,"normal"];
			webs = webs.concat([newWeb]);
			highestWebHeight = lastWeb[1] + d1 + d2;
		}
		else{
			var newWeb = [lastWeb[0],lastWeb[3] + d1 + d2,lastWeb[2],lastWeb[3] + d1,1,"normal"];
			webs = webs.concat([newWeb]);
			highestWebHeight = lastWeb[3] + d1 + d2;
		}
	}
}

/**
* Reduces the strength of a web
* @param {Array} the web
*/
function wearDownWeb(web){
	if(web!=null) {
		if(web[5] != "floor" && web[5] != "roof"){
			//the floor and roof don't get worn down
			if(web[4] - disappearanceSpeed >= 0){
				web[4] = web[4] - disappearanceSpeed;
			}
		}
	}
}

/**
* Calculates whether the x coordinate can change by the
* requested amount
* @param {number} [x] the amount to change by
* @return {boolean}
*/
function canMoveX(dx){
	if(dx < 0){
		if(spiderX + dx - spiderRadius*8 < 0){
			return false;
		}
	}
	else if(dx > 0){
		if(spiderX + dx + spiderRadius*8 > canvas.width){
			return false;
		}
	}
	// if dx == 0, return true
	return true;
}

/**
* Calculates whether the y coordinate can change by the
* requested amount
* @param {number} [y] the amount to change by
* @return {boolean}
*/
function canMoveY(dy){
	if(dy < 0){
		if(spiderX,spiderY + dy - spiderRadius < 0){
			return false;
		}
	}
	else if(dy>0){
		return true
	}
	// if dy == 0, return true
	return true;
}

/**
* Moves the spider by dy in the y direction, and dx in
* the x direction
* @param {number} [x] the amount to change by
* @return {boolean}
*/
function move(dx,dy){
	if(!falling){
		if(canMoveY(dy)){
			if(canMoveX(dx)){
				spiderX += dx;
				spiderY += dy;
			}
		}
	}
	else{
		fall(dy);
		if(canMoveX(dx)){
			spiderX += dx;
		}
	}
}
/**
* Simulates falling
* @param {number} [fallDistance] how far we want to fall
*/
function fall(fallDistance){
	var currentY = -1;
	while(currentY >= fallDistance){
		// while we have not fallen the full distance and
		// are not touching a web, increment the y coordinate
		// by 1 and check if touching a web
		if(touchingWebs(spiderX,spiderY + currentY)){
			// if touching a web, stop falling
			currentWeb = getCurrentWeb(spiderX,spiderY + currentY);
			currentSlope = getSlope(currentWeb);
			falling = false;
			break;
		}
		currentY -= 1;
	}
	spiderY = spiderY + currentY;
}

function removeOldWebs(){
	for(var i = 0; i < webs.length; i++){
		if(isWebGone(webs[i])){
			// if one web dissappears, get rid of all webs beneath it
			webs = webs.slice(0,i).concat(webs.slice(i +1,webs.length));
			break;
		}
	}
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

/**
* Handles key down events.
* @param {Event}(e)
*/
function keyDownHandler(e){
	// e.keyCode == 37 (left arrow key)
	// e.keyCode == 32 (space bar)
	// e.keyCode == 39 (right arrow key)
	// e.keyCode == 40 (down arrow key)
	
	if(e.keyCode == 37){
		leftPressed = true;
	}
	if(e.keyCode == 32){
		upPressed = true;
	}
	if(e.keyCode == 39){
		rightPressed = true;
	}
	if(e.keyCode == 40){
		downPressed = true;
	}
}

/**
* Handles key up events.
* @param {Event}(e)
*/
function keyUpHandler(e){
	// e.keyCode == 37 (left arrow key)
	// e.keyCode == 32 (space bar)
	// e.keyCode == 39 (right arrow key)
	// e.keyCode == 40 (down arrow key)
	
	if(e.keyCode == 37){
		leftPressed = false;
	}
	if(e.keyCode == 32){
		upPressed = false;
	}
	if(e.keyCode == 39){
		rightPressed = false;
	}
	if(e.keyCode == 40){
		downPressed = false;
	}
}