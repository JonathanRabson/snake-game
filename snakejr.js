//JavaScript for Snake Game
//Jonathan Rabson
//April 28, 2014

//Objects for shapes
var standardBox = new boxObject;
var defaultMotion = new motionObject;
var food = {};
var snake = {};

////DEFAULT SETTINGS////////////////
var canvasWidth = 400;
var pointIncrement = 5; //Points for eating the thing.
standardBox.squareWidth = 5; //5
standardBox.edge = 2; //2
standardBox.posX = standardBox.edge;
standardBox.posY = standardBox.edge;
defaultMotion.moveX = 1;
defaultMotion.moveY = 0;
defaultMotion.moveYLast = 0;
defaultMotion.moveXLast = 0;
defaultMotion.pace = .1; // .1 good for for slow; .2 nice also... Will be pixels per milliseconds.
defaultMotion.tailAmount = 36; //Controls length of the tail and of clearing
//Colors defined in initializeGame()
////////////////////////////////////

//Other globals
var points = 0;
var timeLast, timeNow;
var canvas;
var context;
var colors = {};	
var togglePlayOrPause = true;
var gameOver = false;
var elemPoints;
		
//Set up the shape objects:	
_.extend(snake, standardBox, defaultMotion); //Snake combines static and dynamic properties.
_.extend(food, standardBox); //Food uses just static properties.


//Additional methods for "food object"//

//placeFood: Implements brute-force algorithm to find unoccupied space. Doing it based on "knowing" may require iterating through all spaces, which may be slower.
//This will be implemented within the redrawing loop, so that if it did take a lot of time, it would not restrict movement.
//For that reason, it does not try to do a hash map of places already found.
food.placeFood = function () {
	var effectiveWidth = canvasWidth - ((3 * this.edge) + this.squareWidth); //To the left of the leftmost posX is a border, and then when one goes rightmost, there's a square with two borders.
	var arrCheckArray;
	var checkTaken;
				
	if(!this.foodPlaced) {
		//Even if these locations are rejected, it doesn't matter if they're not drawn, so no need to create a "candidate" placeholder.
		this.posX = Math.random() * effectiveWidth;
		this.posY = Math.random() * effectiveWidth;
		
		//See if the four corners of the space are okay.
		arrCheckArray = context.checkCornerPixels(this.posX,this.posY, this.fullWidth(), this.fullWidth());
		
		checkTaken = _.reduce(arrCheckArray, function(memo, num){ return memo + num; }, 0);
						
		if(checkTaken === 0) {
			context
				.color(colors.food)
				.borderColor(colors.food)
				.borderWidth(this.edge*2)
				.draw(this.posX,this.posY, this.squareWidth, this.squareWidth)
			;
			context.draw
			this.foodPlaced = true;
		}
		//If not found, caller will just call again next time....
	}		
}

food.disappear = function() {
	context.clear(this.posX - (this.edge + 1),this.posY - (this.edge + 1), this.fullWidth() + 2, this.fullWidth() + 2);
	this.foodPlaced = false;
}

//Additional methods for "snake" object

//Function to determine the "leading edge" when detecting what it's about to hit.
//Pass X or Y as a string to get data for X or Y. (Anything but X is assumed Y.)
//To get starting coordinates, pass in false.  To get the dimensions of the edge (width), pass true.

snake.leadingXorY = function(strXorY, bEdgeWidth) {
	var move;
	var pos;

	//Determine if this is for horizontal or vertical.
	if(strXorY === 'X') {
		move = this.moveX;
		pos = this.posX;
	} else {
		move = this.moveY;
		pos = this.posY;			
	
	}

	if(bEdgeWidth) {
		if(move === 0) {
			return this.squareWidth + this.edge;//adding edge helps prevent it from eating only a piece of the thing without getting it.
		} else {
			return 2;
		}
	}
	//Happens only if not bEdgeWidth:
	switch(move){
		case 1:
			return (pos + this.edge + this.squareWidth + 1);
			break;
		case -1:
			return (pos - (this.edge + 1));
			break;
		case 0:
			return pos - this.edge;//subtracting edge helps prevent it from eating only a piece of the thing without getting it.
			break;
	}

}

//Event-related functions//

function canvasClicked(event)
{
	togglePlayOrPause = true;
	if(gameOver) {
		refreshGame();
	}
	restartTimer();
} 

function checkKey(e) {
	e = e || window.event;
				
	if(togglePlayOrPause && !gameOver) {
		if (e.keyCode === 38) {
			// up arrow
			snake.moveY = newPos(snake.moveY,-1);
			snake.moveXLast = snake.moveX;
			snake.moveX = 0; //whether or not Y changed, this true.
		}
		else if (e.keyCode === 40) {
			// down arrow
			snake.moveY = newPos(snake.moveY,1);
			snake.moveXLast = snake.moveX;
			snake.moveX = 0;				
		}
		if (e.keyCode === 37) {
			// left arrow
			snake.moveX = newPos(snake.moveX,-1);
			snake.moveYLast = snake.moveY;
			snake.moveY = 0;				
		}
		else if (e.keyCode === 39) {
			// right arrow
			snake.moveX = newPos(snake.moveX,1);
			snake.moveYLast = snake.moveY;
			snake.moveY = 0;
		}
		else if (e.keyCode === 32) {
		// spacebar - pause playing			
			togglePlayOrPause = false;
		}
	}

			    
}

//Disallow 180-degree turns (utility function used by checkKey)
function newPos(old,newone) {
	if(old + newone != 0) {
		snake.newDirFlag = 1; //Ready to turn
		return newone;
	} else {
		return old;
	}
}

//Main global functions//

//initialize and start timer.
function initializeGame() {
	//initialization tasks
	canvas = document.getElementById('snakeBoard');
	context = new canvasHandler(canvas);
	elemPoints = document.getElementById('points');
	
	//Set up events
	document.onkeydown = checkKey;
	canvas.addEventListener("mousedown", canvasClicked, false);
	
	colors['textshadow'] = '#AA5555';
	colors['snakehead'] = '#DDDDDD';
	colors['snakeborder'] = '#000000'; //Other border colors may trigger false alarms for self-interesection
	colors['tail'] = 'rgba(180, 180, 180, .1)'; //Semi-transparent shading of tail.  Must be different from food, and not 0.
	colors['food'] = 'rgba(255,0,0,1)'; //This color is currently hard-coded elsewhere for detection of food.
	colors['atetail'] = 'rgba(180,50,50,1)';
	
	
	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	//Now do it...
	restartTimer();
					
}

//start timer...appropriate for restart
function restartTimer() {
	var objTime = new Date();
	timeNow = objTime;
	requestAnimationFrame(function() {redrawCanvas(false);});
}

//function to restart after game is over
function refreshGame() {
	location.reload();
}

//Get rid of array entries that are no longer needed
function collectGarbage() {
	//Only goes up to the penultimate one; the max to be dynamic, so it doesn't run out of bounds if it has been "shifted."
	for (var i=0; i < snake.arrWhereItHasBeen.length - 1; i++){
		if(snake.arrWhereItHasBeen[i].segmentLength() == 0) {
			snake.arrWhereItHasBeen.shift();
		} else {
			break;
		}
	}

}

//Test if it's at a wall.
function atEdge(bMakeIt) {
	var result = true;
	var fullDistance = canvasWidth-(snake.squareWidth + snake.edge);
	if(snake.moveX > 0) {
		if(bMakeIt) {snake.posX = fullDistance;} else {
		result = (snake.posX >= fullDistance);}
	} else if (snake.moveX < 0) {
		if(bMakeIt) {snake.posX = snake.edge;} else {
		result = (snake.posX <= snake.edge);}
	} else if (snake.moveY > 0) {
		if(bMakeIt) {snake.posY = fullDistance;} else {
		result = (snake.posY >= fullDistance);}
	} else if (snake.moveY < 0) {
		if(bMakeIt) {snake.posY = snake.edge;} else {
		result = (snake.posY <= snake.edge);}
	}
	return result;
}

//Function to manage snake's clearing and tail by adding its location to an array
function addToWhereItHasBeen(left,top,width,height) {
	var objRectangle;
	var xStart, yStart, xLength, yLength;

	if((snake.arrWhereItHasBeen.length === 0) || (snake.newDirFlag === 2)) {
		if(snake.newDirFlag === 2) {
			
			if(snake.moveX > 0) {
				//It's going right from having been vertical.
				xStart = _.last(snake.arrWhereItHasBeen).xStart() + snake.edge;
				yStart = top;
				xLength = (left + width) - xStart;
				yLength = height;
			} else if(snake.moveX < 0) {
				//It's going left from having been vertical.
				xStart = left + (4*snake.edge); //(6*snake.edge if it was from going up)
				if(snake.moveYLast < 0) {
					xStart += (snake.squareWidth - snake.edge/2);
				}
				yStart = top;
				xLength = _.last(snake.arrWhereItHasBeen).xStart() - left;
				yLength = height;			
			} else if(snake.moveY < 0) {
				//It's going up from having been horizontal.
				xStart = left;
				yStart = top;
				xLength = width;
				yLength = Math.abs(top - _.last(snake.arrWhereItHasBeen).yEnd());	
			} else if (snake.moveY > 0) {
				//It's going down from having been horizontal.
				xStart = left;
				yStart = top;
				
				if(snake.moveXLast < 0) {
					yStart -= (snake.squareWidth - (snake.edge/2));
				}
				
				xLength = width;
				yLength = top - _.last(snake.arrWhereItHasBeen).yStart(); 	
				
				/*
				xStart = left;
				yStart = _.last(snake.arrWhereItHasBeen).yEnd();
				xLength = width;
				yLength = (top + height) - yStart; 
				*/
			}					
			objRectangle = new rectangle(xStart, yStart, xLength, yLength);
			snake.newDirFlag = 0;	
		} else {			
			objRectangle = new rectangle(left,top,width,height);
		}
		snake.arrWhereItHasBeen.push(objRectangle);
	} else {			
		//Update the potential tail within this direction segment.
		_.last(snake.arrWhereItHasBeen).newExtent(left,top,width,height);
	}
}

//Main function to draw items on the canvas
function redrawCanvas(bLastTime) {
	var moveXTimed = 0;		//Unless otherwise calculated, don't move it in this direction
	var moveYTimed = 0;
	
				
	var deltaTime;			//Time elapsed from last screen redraw
	var objTime = new Date();	//Grab new time
	var arrCheckArray;
	var bFoodEaten;
	var bAteTail;
	
	if(togglePlayOrPause && !gameOver) {
		timeLast = timeNow;		//Archive previous time to find delta
						
		//Try to place food
		food.placeFood();
		
		timeNow = objTime;		//Current time
		
				
		deltaTime = timeNow-timeLast;	//Calculate change in time
						
		//Based on if direction is flagged, schedule the move based on a ".pace" constant times the time change.
		if(snake.moveX != 0) {
			moveXTimed = Math.ceil(snake.moveX * deltaTime * snake.pace);
		}
		if(snake.moveY != 0) {
			moveYTimed = Math.ceil(snake.moveY * deltaTime * snake.pace);
		}		
		
		//We will do two checks - One that can tell both if the food is eaten and if the snake has run into itself,
		//and the other an additional check on the food to see if it has been partially eaten beyond a certain amount.
		
		//First check - regular check:  Determine if the snake is about to go into the food or itself:
		arrCheckArray = context.checkCornerPixels(snake.leadingXorY('X', false),snake.leadingXorY('Y',false),snake.leadingXorY('X', true),snake.leadingXorY('Y',true));
		
		bFoodEaten = false;
		
		//Note - This check hard-codes some values that are configurable regarding colors and behavior of food.
		for(var i=0;i<arrCheckArray.length;i++) {
			if((i%4 == 0) && food.foodPlaced && (arrCheckArray[i] == 255)) {
				bFoodEaten = true; //conditionally...
			} else if((i+1)%4 == 0) {
				//This is the opacity.
				if(arrCheckArray[i] < 30) {
					//At high speeds, a low opacity reading may indicate a false alarm.
					bAteTail = false;
				}
			} else if (arrCheckArray[i] != 0){
				bAteTail = true;					
			}
		}
		
		if(bAteTail) {
			//Show where it self-intersected.
			context
				.color('rgba(0,255,0,1)')
				.borderColor(colors.atetail)
				.borderWidth(0)
				.draw(snake.leadingXorY('X', false),snake.leadingXorY('Y',false),snake.leadingXorY('X', true),snake.leadingXorY('Y',true))
			;
			console.log("self intersection" + arrCheckArray);
	
		
		} else if(!bFoodEaten) {
			//Second check:  See if the food is "substantially eaten."  This is necessary because of a high probability when the game speeds up
			//of "skipping over" the food and thereby erasing it without triggering food-eaten logic

			//Check four points interior to the food
			arrCheckArray = context.checkCornerPixels(food.posX + food.edge, food.posY + food.edge, food.squareWidth, food.squareWidth);
			
			//Loop test: If one of those four points is red, the food is not yet eaten.
			if(food.foodPlaced) {
				bFoodEaten = true; //conditionally
				for(var i=0;i<arrCheckArray.length;i+=4) {
					if(arrCheckArray[i] == 255) {
						bFoodEaten = false; 					
					}
				}	
			}		
		}
						
		if(bFoodEaten) {
			food.disappear();
			//Add points
			points += pointIncrement;
			elemPoints.innerHTML = points;
			
			//Lengthen tail and speed up pace.
			snake.tailAmount += food.fullWidth();
			snake.pace = 1.1 * snake.pace;					
		}
					
		//Set up what object should look like, draw it.
		context
			.handleTail(snake.posX,snake.posY,snake.squareWidth,snake.squareWidth)
			.color(colors.snakehead)
			.borderColor(colors.snakeborder)
			.borderWidth(snake.edge*2)
			.draw(snake.posX,snake.posY,snake.squareWidth,snake.squareWidth)
		;
		addToWhereItHasBeen(snake.posX,snake.posY,snake.squareWidth,snake.squareWidth);
		
		 //Get positions ready for next time.
		snake.posX += moveXTimed;
		snake.posY += moveYTimed;
						
		//It's ready to turn; so on the next round it turns.
		if(snake.newDirFlag === 1) {
			snake.newDirFlag = 2;
		}
									
		if(atEdge(false) || bAteTail) {
			if(bLastTime) {
				context.message('Game over. Click screen to restart.');
				gameOver = true;
			} else {
				if(!bAteTail) {
					atEdge(true);
				}
				requestAnimationFrame(function() {redrawCanvas(true);});			
			}
		} else {
			requestAnimationFrame(function() {redrawCanvas(false);});
		}
	}
		
}



//Constructor functions//

//Constructor for generic box-like object...
function boxObject() {
	var _fullWidth = 0;

	this.squareWidth;
	this.edge;
	this.posX;
	this.posY;
	
	//Convenience function to return width with borders on both sides
	this.fullWidth = function() {
		if(_fullWidth === 0 || isNaN(_fullWidth)) {
			_fullWidth = (this.edge * 2) + this.squareWidth;
		}
		return _fullWidth;
	}
}

//Constructor to set up snake object
function motionObject() {
	this.moveX;
	this.moveY;
	this.moveYLast;
	this.moveXLast;
	this.pace;
	this.tailAmount;
	this.arrWhereItHasBeen = [];
	this.newDirFlag = 0;
}

//Constructor for object to simplify use of canvas
//and handle common related tasks
function canvasHandler(refCanvas) {
	var ctx = refCanvas.getContext('2d');
	
	this.checkCornerPixels = function(x,y, xLength, yLength) {
		var arrFourCorners = [];

		arrFourCorners[0] = ctx.getImageData(x,y,1,1).data;
		arrFourCorners[1] = ctx.getImageData(x + xLength,y,1,1).data;
		arrFourCorners[2] = ctx.getImageData(x,y + yLength,1,1).data;
		arrFourCorners[3] = ctx.getImageData(x + xLength,y + yLength,1,1).data;
		
		arrFourCorners =_.map(arrFourCorners, 	function(arrayLike){
								var arr = [];
								for(var i = 0;i< arrayLike.length; i++) {
									arr[i] = arrayLike[i];
								}
								return arr;
							}
				);
		
		return _.flatten(arrFourCorners);
	}
	
	this.color = function(input) { ctx.fillStyle = input; return this;};
	this.borderColor = function(input) { ctx.strokeStyle = input; return this;};
	this.borderWidth = function(input) { ctx.lineWidth = input; return this;};
	this.draw =  	function(left,top,width,height) {
				ctx.strokeRect(left,top,width,height);
				ctx.fillRect(left,top,width,height);
				return this;
			};
	this.message = function(msg) {
		var gradient=ctx.createLinearGradient(0,0,canvasWidth,0);
		gradient.addColorStop("0",colors.snakeborder);
		gradient.addColorStop(".5",colors.food);
		gradient.addColorStop("1.0",colors.textshadow);
		ctx.fillStyle = gradient;
		ctx.font = "bold 16px Arial";
		ctx.fillText(msg, 0, Math.ceil(canvasWidth/2));
		return this;			
	}		
					
	this.clear =  function(left,top,width,height) {
		ctx.clearRect(left,top,width,height); 
		return this;};
	this.handleTail = function(left,top,width,height) {
		var segmentLength;
		var amountClearing;
		var tailRemaining = snake.tailAmount;
		var clearXStart, clearYStart, clearXLength, clearYLength;
		var fillXStart, fillYStart, fillXLength, fillYLength;
		var arrMax;
	
		//Make this be able to clear everything except the box itself...
		//...and remove from the array any portion that has been cleared.
		
		ctx.fillStyle = colors.tail;

		if(tailRemaining === 0) {
			//Clear everything if there's no tail to draw at all.
			//This only executes if we were to set tail to 0 at the beginning.
			for (var i=0; i < snake.arrWhereItHasBeen.length; i++){
				ctx.clearRect(snake.arrWhereItHasBeen[i].xStart(), snake.arrWhereItHasBeen[i].yStart(), snake.arrWhereItHasBeen[i].xLength(), snake.arrWhereItHasBeen[i].yLength());
				if(i < snake.arrWhereItHasBeen.length - 1) {
					//Can safely remove this element.
					snake.arrWhereItHasBeen.shift();
				}
			}
		} else {
			arrMax = snake.arrWhereItHasBeen.length - 1; //Must store in a variable if we do any pop()
			//Loop down the array since the tail starts at the end of the array; then we can know when it ends.
			for (var i=arrMax;i>=0;i--) {
				if(tailRemaining <= 0) {							
					ctx.clearRect(snake.arrWhereItHasBeen[i].xStart(), snake.arrWhereItHasBeen[i].yStart(), snake.arrWhereItHasBeen[i].xLength(), snake.arrWhereItHasBeen[i].yLength());
					snake.arrWhereItHasBeen[i].clearLength();					
				} else {
			
					segmentLength = snake.arrWhereItHasBeen[i].segmentLength();
					amountClearing = segmentLength - tailRemaining;
					
					if(amountClearing > 0) {
						//Clear the portion of the rectangle, starting from the beginning, whatever the direction...
						
						switch(snake.arrWhereItHasBeen[i].direction()) {
							case 1: //Right										
								//Clear from the left and top, horizontally; the vertical clearing is just the height.
								clearXStart = snake.arrWhereItHasBeen[i].xStart();
								clearYStart = snake.arrWhereItHasBeen[i].yStart();
								clearXLength = amountClearing;
								clearYLength = snake.arrWhereItHasBeen[i].yLength();
								fillXStart = snake.arrWhereItHasBeen[i].xStart() + amountClearing;
								fillYStart = snake.arrWhereItHasBeen[i].yStart();
								fillXLength = snake.arrWhereItHasBeen[i].xLength() - amountClearing;
								fillYLength = snake.arrWhereItHasBeen[i].yLength();
								break;
							case -2: //Up										
								//Clear from the middle and left, vertically; the horizontal clearing is just the width.
								clearXStart = snake.arrWhereItHasBeen[i].xStart();
								clearYStart = snake.arrWhereItHasBeen[i].yStart() + (snake.arrWhereItHasBeen[i].yLength() - amountClearing);
								clearXLength = snake.arrWhereItHasBeen[i].xLength();
								clearYLength = amountClearing;
								fillXStart = snake.arrWhereItHasBeen[i].xStart();
								fillYStart = snake.arrWhereItHasBeen[i].yStart();
								fillXLength = snake.arrWhereItHasBeen[i].xLength();
								fillYLength = snake.arrWhereItHasBeen[i].yLength() - amountClearing;
								break;
							case -1: //Left
								//Clear from the middle and top, horizontally; the vertical clearing is just the height.
								clearXStart = snake.arrWhereItHasBeen[i].xStart() + (snake.arrWhereItHasBeen[i].xLength() - amountClearing);
								clearYStart = snake.arrWhereItHasBeen[i].yStart();
								clearXLength = amountClearing;
								clearYLength = snake.arrWhereItHasBeen[i].yLength();
								fillXStart = snake.arrWhereItHasBeen[i].xStart();
								fillYStart = snake.arrWhereItHasBeen[i].yStart();
								fillXLength = snake.arrWhereItHasBeen[i].xLength() - amountClearing;
								fillYLength = snake.arrWhereItHasBeen[i].yLength();
								break;
							case 2: //Down
								//Clear from the top and left, vertically; the horizontal clearing is just the width.
								clearXStart = snake.arrWhereItHasBeen[i].xStart();
								clearYStart = snake.arrWhereItHasBeen[i].yStart();
								clearXLength = snake.arrWhereItHasBeen[i].xLength();
								clearYLength = amountClearing;
								fillXStart = snake.arrWhereItHasBeen[i].xStart();
								fillYStart = snake.arrWhereItHasBeen[i].yStart() + amountClearing;
								fillXLength = snake.arrWhereItHasBeen[i].xLength();
								fillYLength = snake.arrWhereItHasBeen[i].yLength() - amountClearing;
								break;
						}
						
						if(i === arrMax) {						
							//Fill tail with semi-transparent color.  Nice effect, and help detect self intersection.
							ctx.fillRect(fillXStart, fillYStart, fillXLength, fillYLength);
						}
						
						//Clear wherever the tail isn't anymore.
						ctx.clearRect(clearXStart, clearYStart, clearXLength, clearYLength);
						//Now remove what we have cleared.
						snake.arrWhereItHasBeen[i].newExtentDry(fillXStart, fillYStart, fillXLength, fillYLength);								
					} else {
						//Fill tail when nothing to clear...
						fillXStart = snake.arrWhereItHasBeen[i].xStart();
						fillYStart = snake.arrWhereItHasBeen[i].yStart();
						fillXLength = snake.arrWhereItHasBeen[i].xLength();
						fillYLength = snake.arrWhereItHasBeen[i].yLength();								
						
						switch(snake.arrWhereItHasBeen[i].direction()) {
							case -1:
								fillXStart += snake.squareWidth + snake.edge;
								fillXLength -= (2* (snake.squareWidth + snake.edge - 1));
								break;									
						
							case -2:
								fillYStart += snake.squareWidth + snake.edge;
								fillYLength -= (2* (snake.squareWidth + snake.edge - 1));
								break;
						}
						
													
						ctx.fillRect(fillXStart, fillYStart, fillXLength, fillYLength);
					}
					tailRemaining -= segmentLength;
				}
			}					
		}
		collectGarbage();
		return this;
	}		
}

//Constructor for a "where it has been" rectangle object
function rectangle(xStart, yStart, xLength, yLength) {			
	var _xStart = xStart - snake.edge;
	var _yStart = yStart - snake.edge;
	var _xLength = xLength + (snake.edge*2);
	var _yLength = yLength + (snake.edge*2);
	var _direction = snake.moveX + (snake.moveY * 2); //A way to store direction, so from 0 degrees counterclockwise would be:  1, -2, -1, 2.
				
	//Read-only properties.  Use other properties (e.g., newExtent) to set.
	this.xStart = function(){return _xStart;};
	this.yStart = function(){return _yStart;};
	
	this.xLength = function(){
		return _xLength;
	};
	
	
	
	this.yLength = function(){return _yLength;};
	this.direction = function(){return _direction;};
	
	//Now for some convenience methods:
	this.xEnd = function(){return _xStart + _xLength + (snake.edge*2);};
	this.yEnd = function(){return _yStart + _yLength + (snake.edge*2);};
	this.segmentLength = function(){
		if(Math.abs(_direction) == 1) {
			return _xLength;
		} else {
			return _yLength;
		}
	}
	
	this.newExtent =	function(left,top,width,height){
					var newRight, newBottom;							
					
					//If it's moving to the left or up, it must keep changing the starting value!
					if(_direction == -1) {
						_xLength = _xLength + snake.edge + _xStart - left; //Here we reference old _xLength and old _xStart, which changes next line
						_xStart = left - snake.edge;
					} else {
						newRight = left + width + (snake.edge);
						_xLength = newRight - _xStart;
					}
					if(_direction == -2) {
						_yLength = _yLength + snake.edge + _yStart - top;
						_yStart = top - snake.edge;
					} else {
						newBottom = top + width + (snake.edge);
						_yLength = newBottom - _yStart;
					}		
				}
	this.newExtentDry =	function(left,top,width,height){
					//This doesn't adjust for edges; useful to set exact amounts when reducing the rectangle once cleared.
					
					_xLength = width;
					_yLength = height;
												
					_xStart = left;
					_yStart = top;
				}
	this.clearLength =	function() {
		//This function collapses the object without removing it from the array. Useful in cases where we think the object needs to be there for reference.
		
		//Set length to 0. If going forward (e.g., in a positive direction), set the start to the calculated value of the end, in case code needs to refer to where it is now.
		switch(_direction) {
			case 1:
				_xStart = _xStart + _xLength + (snake.edge*2);
				_xLength = 0;
				break;
			case -2:
				_yLength = 0;
				break;
			case -1:
				_xLength = 0;
				break;
			case 2:
				_yStart = _yStart + _yLength + (snake.edge*2); 
				_yLength = 0;
				break;
		}
	
	}
				
}




