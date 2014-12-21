/*** GLOBALS ***/
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
var centerX = canvas.width / 2;
var centerY = canvas.height / 2;

var WIDTH = canvas.width;
var HEIGHT = canvas.height;
var deg = 0;

var DEBUG = false;
var BOID_COUNT = 50;
/*** END GLOBALS ***/

/*** Mouse class definition ***/
function Mouse() {
    this.x = 0;
    this.y = 0;
    this.radius = 150;
    this.clicked = false;
}

Mouse.prototype.wasClicked = function() {
    return this.clicked;
}

Mouse.prototype.draw = function() {
    if(this.wasClicked()) {
        circle(this.x, this.y, this.radius,'blue');
    }
}
/*** END OF MOUSE CLASS ***/

/*** Boid class definition ***/
function Boid() {
    // location
    this.x = 0;
    this.y = 0;
    // direction
    this.dx = 0;
    this.dy = 0;
    this.speed = 0;
    // size
    this.radius = 10;
    // what's visible (currently circle)
    this.view = 100;
    // radius of collision, this is where they move away from each other
    this.personalSpace = 30;
    this.color = 'black';
}

Boid.prototype.draw = function() {
    circleFilled(this.x, this.y, this.radius, this.color);
    
    context.save();
    context.translate(this.x,this.y);
    
    deg = Math.atan2(this.dy , this.dx);
    context.rotate(deg);
    
    rectFilled(-5,-5,25,10,this.color);
    
    context.restore();
}

// Normalize 
Boid.prototype.normalize = function() {
    var length = Math.sqrt((this.dx * this.dx) + (this.dy * this.dy));
    
    this.dx = this.dx / length;
    this.dy = this.dy / length;
}

Boid.prototype.move = function() {
    // Move to mouse
    if(mouse.wasClicked() &&
      Math.pow(this.x-mouse.x, 2) + Math.pow(this.y-mouse.y, 2) <= Math.pow(mouse.radius, 2)) {
        var X = mouse.x - this.x;
        var Y = mouse.y - this.y;
        
        var mouseX = X / Math.sqrt((X*X)+(Y*Y));
        var mouseY = Y / Math.sqrt((X*X)+(Y*Y));
        
        this.dx += mouseX * .3;
        this.dy += mouseY * .3;
    }
    
    // Add random direction movement
    var randDir = randomDirection();
    
    this.dx += (randDir[0]*.01);
    this.dy += (randDir[1]*.01);
}
/*** END BALL CLASS ***/

/*** SWARM CLASS ***/
function Swarm() {
    // Hold each of the moving objects
    this.boids = [];
    
    for(var i = 0; i < BOID_COUNT; i++) {
        var boid = new Boid();
        boid.x = Math.random() * WIDTH;
        boid.y = Math.random() * HEIGHT;
        boid.dx = .5 - Math.random();
        boid.dy = .5 - Math.random();
        boid.speed = 5;
        boid.color = 'green';
        
        this.boids.push(boid);
    }
    // var fruits = [];
    // fruits.push("banana", "apple", "peach");
    // fruits.length
    // use splice to remove a single element at index
    // http://stackoverflow.com/questions/7142890/js-remove-an-array-element-by-value-in-javascript
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
}

// Returns the sum of all positions of swarm objects
Swarm.prototype.centerOfSwarm = function() {
    var centerX = 0;
    var centerY = 0;
    var count = 0;
    // move to center of close objects
    for(var j = 0; j < this.boids.length; j++) {        
        // (x2-x1)^2 + (y1-y2)^2 <= (r1+r2)^2        
        centerX += this.boids[j].x;
        centerY += this.boids[j].y;
        count++;
    }
    
    return new Array(centerX, centerY );
}

Swarm.prototype.move = function() {
    // used as center for all objects in the swarm
    var center = this.centerOfSwarm();
    
    for(var i = 0; i < this.boids.length; i++) {
        // move current boid (this adds mouse and random to direction)
        this.boids[i].move();        
        
        var avgX = 0;
        var avgY = 0;
        var count = 0;
        // Match moving direction of other objects
        for(var j = 0; j < this.boids.length; j++) {
            if(i === j) {
                continue;
            }
            // (x2-x1)^2 + (y1-y2)^2 <= (r1+r2)^2
            if(Math.pow(this.boids[i].x-this.boids[j].x, 2) + Math.pow(this.boids[i].y-this.boids[j].y, 2) > Math.pow(this.boids[i].view, 2)) {
                continue;
            }
            
            avgX += this.boids[j].dx;
            avgY += this.boids[j].dy;
            count++;
        }
        
        if(count > 0) {
            //avgX += this.boids[i].dx;
            //avgY += this.boids[i].dy;
            avgX /= (count);//+1);
            avgY /= (count);//+1);
            
            this.boids[i].dx += (avgX) * .05;
            this.boids[i].dy += (avgY) * .05;
        }
            
        var centerX = center[0];
        var centerY = center[1];
        
        // remove current from sum
        centerX -= this.boids[i].x;
        centerY -= this.boids[i].y;
        
        // find average without counting current
        centerX /= (this.boids.length-1);
        centerY /= (this.boids.length-1);
        
        // determine the offset to the center
        var chX = centerX - this.boids[i].x;
        var chY = centerY - this.boids[i].y;
        
        var length = Math.sqrt((chX*chX)+(chY*chY));
        
        // find a vector to the center
        this.boids[i].dx += (chX / length) * .01;
        this.boids[i].dy += (chY / length) * .01;
        
        this.boids[i].normalize();
        
        var lastX = this.boids[i].x;
        var lastY = this.boids[i].y;
        
        this.boids[i].x += this.boids[i].dx * this.boids[i].speed;
        
        if(this.boids[i].x < 0) {
            this.boids[i].x = WIDTH;
        }
        if(this.boids[i].x > WIDTH) {
            this.boids[i].x = 0;
        }
        
        this.boids[i].y += this.boids[i].dy * this.boids[i].speed;
        
        if(this.boids[i].y < 0) {
            this.boids[i].y = HEIGHT;
        }
        if(this.boids[i].y > HEIGHT) {
            this.boids[i].y = 0;
        }
        
        // Check for collision
        for(var j = 0; j < this.boids.length; j++) {
            if(j === i) {
                continue;
            }
            
            // if objects collide
            // (x2-x1)^2 + (y1-y2)^2 <= (r1+r2)^2
            if(Math.pow(this.boids[i].x-this.boids[j].x, 2) + Math.pow(this.boids[i].y-this.boids[j].y, 2) < Math.pow(this.boids[i].personalSpace, 2)) {
                var X = this.boids[j].x - this.boids[i].x;
                var Y = this.boids[j].y - this.boids[i].y;
                var length = Math.sqrt((X*X)+(Y*Y));
                     
                if(length == 0) {
                    continue;
                }
                
                var deltaX = X / length;
                var deltaY = Y / length;
                
                // try to move out of the collision area
                // TODO fix error with everyone disappearing happens with many boids
                this.boids[i].dx += deltaX * -.15;
                this.boids[i].dy += deltaY * -.15;
            }
        }
    }
}

Swarm.prototype.draw = function() {
    for(var i = 0; i < this.boids.length; i++) {
        this.boids[i].draw();
        
        if(DEBUG) {
            // draw debugging circles to see boids view and personal space
            circle(this.boids[i].x, this.boids[i].y, this.boids[i].view, 'red');
            circle(this.boids[i].x, this.boids[i].y, this.boids[i].personalSpace, 'red');
            
            // draw the components of the boids movement * 50 to be visible
            line(this.boids[i].x, this.boids[i].y, this.boids[i].x + this.boids[i].dx*50, this.boids[i].y, 'red');
            line(this.boids[i].x, this.boids[i].y, this.boids[i].x, this.boids[i].y + this.boids[i].dy*50,'red');
            
            // draw the center
            var center = this.centerOfSwarm();
            circleFilled(center[0]/this.boids.length, center[1]/this.boids.length, 20, 'grey');
        }
    }
}
/*** END SWARM CLASS ***/

var mouse = new Mouse();
var swarm = new Swarm();
var swarm2 = new Swarm();

function init() {
    for(var i = 0; i < swarm2.boids.length; i++) {
        swarm2.boids[i].color = 'red';
    }
    
    //mousemove
    canvas.addEventListener("mousemove", mouseMove, false);
    //canvas.addEventListener("click", getClickPosition, false);
    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    
    document.addEventListener("keydown", keyDown, false);
    
    /* sets function to run again */
    /* should call a function that calls both update objects and draw objects to screen */
    return setInterval(update, 1000/30);
}

/*** EVENT HANDLERS ***/
function mouseMove(e) {
    if(mouse.wasClicked()) {
        var parentPosition = getPosition(e.currentTarget);
        var xPosition = e.clientX - parentPosition.x;
        var yPosition = e.clientY - parentPosition.y;
        
        mouse.clicked = true;
        mouse.x = xPosition;
        mouse.y = yPosition;
    }
}

function getClickPosition(e) {
    var parentPosition = getPosition(e.currentTarget);
    var xPosition = e.clientX - parentPosition.x;
    var yPosition = e.clientY - parentPosition.y;
    
    mouse.clicked = true;
    mouse.x = xPosition;
    mouse.y = yPosition; 
}

function mouseDown(e) {
    var parentPosition = getPosition(e.currentTarget);
    var xPosition = e.clientX - parentPosition.x;
    var yPosition = e.clientY - parentPosition.y;
    
    mouse.clicked = true;
    mouse.x = xPosition;
    mouse.y = yPosition; 
}
 
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;
      
    while (element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }
    return { x: xPosition, y: yPosition };
}

function mouseUp(e) {
    mouse.clicked = false;
}

function keyDown(e) {
    var key = String.fromCharCode(e.which);
    switch(key) {
        case 'D':
            //alert(key);
            DEBUG = !DEBUG;
            break;
        default:
            //alert(String.fromCharCode(e.which));
            break;
    }
}
/*** END EVENT HANDLERS ***/

/*** GRAPHICS FUNCTIONS ***/
/* Clears the screen for animation */
function clear() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
}

/* draw a line */
function line(x,y,x2,y2,color) {
    color = (typeof color === "undefined") ? "black" : color;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x2, y2);
    context.strokeStyle=color;
    context.stroke();   
}

/* draw a rectangle */
function rect(x,y,w,h,color) {
    color = (typeof color === "undefined") ? "black" : color;
    context.strokeRect(x,y,w,h);
    context.strokeStyle = color;
    context.stroke();
}

function rectFilled(x,y,w,h,color) {
    color = (typeof color === "undefined") ? "black" : color;
    context.fillRect(x,y,w,h);
    context.fillStyle=color;
    context.fill();
}

function circle(x,y,r,color) {
    color = (typeof color === "undefined") ? "black" : color;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI*2, true);
      context.closePath();
      context.strokeStyle = color;
      context.stroke();
}

function circleFilled(x,y,r,color) {
    color = (typeof color === "undefined") ? "black" : color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI*2, true);
    context.fillStyle = color;
    context.closePath();
    context.fill();
}

function printStats() {
    /*
    //context.fillStyle = "blue";
    context.font = "bold 12px Arial";
    context.fillText("x: " + ball.x, 10, 10);  
    context.fillText("y: " + ball.y, 10, 20);  
    context.fillText("dx: " + ball.dx, 10, 30);  
    context.fillText("dy: " + ball.dy, 10, 40);      
    context.fillText("y-speed: " + ball.dy * ball.speed, 10, 50);  
    //context.fillText("deg: " + Math.atan2(ball.dy , ball.dx), 10, 50);  
    //Math.asin(ball.dx / ball.dy);
    */
}
/*** END GRAPHICS FUNCTIONS ***/

/* Move the animation objects */
function move() {
    swarm.move();
    swarm2.move();
}

/* Draw objects */
function draw() {
    clear();
    mouse.draw();
    
    swarm.draw();
    swarm2.draw();
    
    //printStats();
}

/* Update the screen by moving and redrawing objects */
function update() {
    move();
    draw();
}

function randomDirection() {
    var delta = [];
    
    for(var i = 0; i < 2; i++) {
        delta[i] = Math.random();
        
        if(Math.random() > .5) {
            delta[i] = -delta[i];
        }
    }
    
    return delta;
}
 
/* calls the starting function */
init();