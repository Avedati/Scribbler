// TODO: multiplayer
// TODO: improve ui
// TODO: add more features
// https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function lineCollision(a,b,c,d,p,q,r,s) {
	var det, gamma, lambda;
	det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	} else {
		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
};

const StickyNoteColor = [236, 228, 183]; // declared so that sticky note colors can be more diverse in the future if wanted
function StickyNote(x, y) {
	const MAX_CHARS_PER_LINE = 7;
	const MAX_LINES = 4;
	this.x = x;
	this.y = y;
	this.width = 0.1;
	this.height = 0.1;
	this.color = StickyNoteColor;
	this.textContent = '';

	this.boundingBox = function(canvas, player) {
		var width = this.width * Math.min(canvas.width, canvas.height);
		var height = this.height * Math.min(canvas.width, canvas.height);
		return {
			'x': (this.x + 0.5 - player.x) * canvas.width - width / 2,
			'y': (this.y + 0.5 - player.y) * canvas.height - height / 2,
			'width': width,
			'height': height
		};
	}

	this.full = function() {
		var n = 0;
		for(var i=0;i<this.textContent.length;i++) {
			if(this.textContent[i] === '\n') {
				n = Math.ceil(n / MAX_CHARS_PER_LINE) * MAX_CHARS_PER_LINE;
			}
			else {
				n++;
			}
		}
		return n >= MAX_CHARS_PER_LINE * MAX_LINES;
	};

	this.render = function(canvas, context, player, selected) {
		var boundingBox = this.boundingBox(canvas, player);
		if(selected) {
			context.fillStyle = 'rgb(50, 50, 50)';
			context.fillRect(boundingBox.x + boundingBox.width, boundingBox.y, 2, boundingBox.height + 2);
			context.fillRect(boundingBox.x, boundingBox.y + boundingBox.height, boundingBox.width, 2);
		}
		context.fillStyle = 'rgb(' + this.color[0].toString() + ',' + this.color[1].toString() + ',' + this.color[2].toString() + ')';
		context.fillRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
		context.font = '14px Monospace';
		context.fillStyle = 'black';
		// https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
		var textWidth = context.measureText('M').width;
		var textHeight = context.measureText('M').width + 5;
		var maxCharsOnOneLine = (boundingBox.width / textWidth) | 0;
		var x = 0;
		var y = 1;
		for(var i=0;i<this.textContent.length;i++) {
			if(++x >= maxCharsOnOneLine) { x = 1; y++; }
			if(this.textContent[i] === '\n') {
				x = 0; y++;
				continue;
			}
			else {
				context.fillText(this.textContent[i], boundingBox.x + 3 + textWidth * (x - 1), boundingBox.y + 3 + textHeight * y);
			}
		}
	};
}

function Motor(points) {
	this.points = points;
	this.point = 0;
	this.velocity = 0;

	this.render = function(canvas, context, player) {
		context.fillStyle = 'rgb(200, 0, 0)';
		context.strokeStyle = 'rgb(200, 0, 0)';
		context.lineWidth = 10;
		var flg = false;
		for(var i=0;i<this.points.length;i++) {
			context.beginPath();
			if(Math.abs(this.points[i][0] - player.x) <= 0.5 &&
			   Math.abs(this.points[i][1] - player.y) <= 0.5) {
				flg = true;
				context.arc((this.points[i][0] + 0.5 - player.x) * canvas.width, (this.points[i][1] + 0.5 - player.y) * canvas.height, 5, 0, 2 * Math.PI);
			}
			context.closePath();
			context.fill();
		}
		if(this.points.length === 3) {
			context.beginPath();
			context.moveTo((this.points[0][0] + 0.5 - player.x) * canvas.width, (this.points[0][1] + 0.5 - player.y) * canvas.height);
			var dx = this.points[2][0] - this.points[1][0];
			var dy = this.points[2][1] - this.points[1][1];
			context.lineTo(((this.points[1][0] + dx * this.point) + 0.5 - player.x) * canvas.width, ((this.points[1][1] + dy * this.point) + 0.5 - player.y) * canvas.height);
			context.closePath();
			context.stroke();
		}
		context.lineWidth = 1;
	};

	this.update = function() {
		this.point += this.velocity;
		if(this.point <= 0) { this.point = 0; this.velocity = 0; }
		if(this.point >= 1) { this.point = 1; this.velocity = 0; }
	};

	this.clicked = function(mx, my, canvas, context, player) {
		for(var i=0;i<this.points.length;i++) {
			var x = (this.points[i][0] + 0.5 - player.x) * canvas.width;
			var y = (this.points[i][1] + 0.5 - player.y) * canvas.height;
			var dx = mx - x;
			var dy = my - y;
			if(Math.sqrt(dx * dx + dy * dy) <= 10) {
				return true;
			}
		}
		return false;
	};

	this.collision = function(canvas, player) {
		var x1 = this.points[0][0];
		var y1 = this.points[0][1];
		var dx = this.points[2][0] - this.points[1][0];
		var dy = this.points[2][1] - this.points[1][1];
		var x2 = this.points[1][0] + dx * this.point;
		var y2 = this.points[1][1] + dy * this.point;
		var boundingBox = player.boundingBox(canvas);
		return lineCollision(x1, y1, x2, y2, boundingBox.x, boundingBox.y, boundingBox.x + boundingBox.width, boundingBox.y) ||
		       lineCollision(x1, y1, x2, y2, boundingBox.x, boundingBox.y, boundingBox.x, boundingBox.y + boundingBox.height) || 
		       lineCollision(x1, y1, x2, y2, boundingBox.x, boundingBox.y + boundingBox.height, boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height) || 
		       lineCollision(x1, y1, x2, y2, boundingBox.x + boundingBox.width, boundingBox.y, boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height);
	};
}

function Player(x, y) {
	this.x = x;
	this.y = y;
	this.animationIndex = 0;
	this.totalAnimations = 4;

	this.render = function(canvas, context) {
		context.strokeStyle = 'black';
		context.fillStyle = 'black';

		// head
		context.beginPath();
		context.arc(0.5 * canvas.width, 0.5 * canvas.height, 15, 0, 2 * Math.PI);
		context.closePath();
		context.stroke();

		// torso
		context.beginPath();
		context.moveTo(0.5 * canvas.width, 0.5 * canvas.height + 15);
		context.lineTo(0.5 * canvas.width, 0.5 * canvas.height + 45);
		context.closePath();
		context.stroke();

		// left leg
		context.beginPath();
		context.moveTo(0.5 * canvas.width, 0.5 * canvas.height + 45);
		context.lineTo(0.5 * canvas.width - 10 + 2.5 * this.animationIndex, 0.5 * canvas.height + 60);
		context.closePath();
		context.stroke();

		// right leg
		context.beginPath();
		context.moveTo(0.5 * canvas.width, 0.5 * canvas.height + 45);
		context.lineTo(0.5 * canvas.width + 10 - 2.5 * this.animationIndex, 0.5 * canvas.height + 60);
		context.closePath();
		context.stroke();

		// left arm
		context.beginPath();
		context.moveTo(0.5 * canvas.width, 0.5 * canvas.height + 30);
		context.lineTo(0.5 * canvas.width - 10, 0.5 * canvas.height + 30);
		context.closePath();
		context.stroke();

		// right arm
		context.beginPath();
		context.moveTo(0.5 * canvas.width, 0.5 * canvas.height + 30);
		context.lineTo(0.5 * canvas.width + 10, 0.5 * canvas.height + 30);
		context.closePath();
		context.stroke();

		// left eye
		context.beginPath();
		context.arc(0.5 * canvas.width - 5, 0.5 * canvas.height - 2, 3, 0, 2 * Math.PI);
		context.closePath();
		context.fill();

		// right eye
		context.beginPath();
		context.arc(0.5 * canvas.width + 5, 0.5 * canvas.height - 2, 3, 0, 2 * Math.PI);
		context.closePath();
		context.fill();

		// smile
		context.beginPath();
		context.arc(0.5 * canvas.width, 0.5 * canvas.height, 10, 0.25 * Math.PI, 0.75 * Math.PI);
		context.stroke();
	};

	this.boundingBox = function(canvas) {
		return {
			'x': (this.x * canvas.width - 15) / canvas.width,
			'y': (this.y * canvas.height - 15) / canvas.height,
			'width': 30 / canvas.width,
			'height': 75 / canvas.height
		};
	};

	this.collision = function(canvas, x1, y1, x2, y2) {
		var boundingBox = this.boundingBox(canvas);
		return lineCollision(x1, y1, x2, y2, boundingBox.x, boundingBox.y, boundingBox.x + boundingBox.width, boundingBox.y) ||
		       lineCollision(x1, y1, x2, y2, boundingBox.x, boundingBox.y, boundingBox.x, boundingBox.y + boundingBox.height) || 
		       lineCollision(x1, y1, x2, y2, boundingBox.x, boundingBox.y + boundingBox.height, boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height) || 
		       lineCollision(x1, y1, x2, y2, boundingBox.x + boundingBox.width, boundingBox.y, boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height);
	}
}

const UtensilModes = Object.freeze({'PENCIL': 0, 'ERASER': 1, 'STRAIGHT_PENCIL': 2, 'STICKY_NOTE': 3, 'MOTOR': 4});
function Utensil() {
	this.x = 0;
	this.y = 0;
	this.mode = UtensilModes.PENCIL;
	this.straight_line_velocity = undefined;
	this.render = function(canvas, context) {
		if(this.mode == UtensilModes.PENCIL || this.mode == UtensilModes.STRAIGHT_PENCIL) {
			context.strokeStyle = 'black';
			context.fillStyle = 'black';
			context.beginPath();
			context.moveTo(this.x * canvas.width, this.y * canvas.height);
			context.lineTo(this.x * canvas.width - 3, this.y * canvas.height - 10);
			context.lineTo(this.x * canvas.width + 3, this.y * canvas.height - 10);
			context.closePath();
			context.fill();
			context.strokeRect(this.x * canvas.width - 3, this.y * canvas.height - 30, 6, 20);
			context.fillRect(this.x * canvas.width - 3 - context.lineWidth, this.y * canvas.height - 40, 6 + context.lineWidth * 2, 10);
		}
		else if(this.mode == UtensilModes.ERASER) {
			context.strokeStyle = 'black';
			context.fillStyle = 'black';
			context.fillRect(this.x * canvas.width, this.y * canvas.height, 10, 30);
			context.strokeRect(this.x * canvas.width + 10, this.y * canvas.height, 40, 30);
		}
		else if(this.mode == UtensilModes.STICKY_NOTE) {
			context.strokeStyle = 'black';
			context.strokeRect(this.x * canvas.width - 10, this.y * canvas.height - 10, 20, 20);
		}
		else if(this.mode == UtensilModes.MOTOR) {
			context.strokeStyle = 'black';
			context.fillStyle = 'black';
			context.beginPath();
			context.arc(this.x * canvas.width, this.y * canvas.height, 15, 0, 2 * Math.PI);
			context.closePath();
			context.fill();
			context.fillStyle = 'white';
			context.beginPath();
			context.arc(this.x * canvas.width, this.y * canvas.height, 10, 0, 2 * Math.PI);
			context.closePath();
			context.fill();
			context.fillStyle = 'black';
			for(var i=0;i<10;i++) {
				var theta = (i / 5) * Math.PI;
				var t0 = theta - 0.15;
				var t1 = theta + 0.15;
				context.beginPath();
				context.moveTo(this.x * canvas.width + 15 * Math.cos(t0), this.y * canvas.height + 15 * Math.sin(t0));
				context.lineTo(this.x * canvas.width + 20 * Math.cos(t0), this.y * canvas.height + 20 * Math.sin(t0));
				context.lineTo(this.x * canvas.width + 20 * Math.cos(t1), this.y * canvas.height + 20 * Math.sin(t1));
				context.lineTo(this.x * canvas.width + 15 * Math.cos(t1), this.y * canvas.height + 15 * Math.sin(t1));
				context.closePath();
				context.fill();
			}
		}
	};

	this.eraserBoundingBox = function(canvas) {
		return {
			'x': this.x * canvas.width,
			'y': this.y * canvas.height,
			'width': 50,
			'height': 30
		};
	};
}

const GameStates = Object.freeze({'MAINMENU':0, 'RULES':1, 'GAME': 2});
window.onload = function() {
	var
	state = GameStates.MAINMENU;
	canvas = document.getElementById('canvas'),
	context = canvas.getContext('2d'),
	fps = 30,
	player = new Player(0.5, 0.5),
	utensil = new Utensil(),
	keys = {
		'left': false,
		'right': false,
		'up': false,
		'down': false
	},
	mouserightdown = false,
	points = [],
	stickyNotes = [],
	selectedStickyNoteIndex = -1,
	motors = [],
	firstButtonHover = false,
	secondButtonHover = false
	;

	function keydown(ev) {
		if(state == GameStates.GAME) {
			if(selectedStickyNoteIndex == -1) {
				switch(ev.keyCode) {
					case 37: // left arrow key
					case 65: // a key
						keys.left = true;
						break;
					case 38: // up arrow key
					case 87: // w key
						keys.up = true;
						break;
					case 39: // right arrow key
					case 68: // d key
						keys.right = true;
						break;
					case 40: // down arrow key
					case 83: // s key
						keys.down = true;
						break;
					default:
						{
							var num_modes = Object.keys(UtensilModes).length;
							if(49 <= ev.keyCode && ev.keyCode < 49 + num_modes) {
								utensil.mode = UtensilModes[Object.keys(UtensilModes)[ev.keyCode - 49]];
							}
							break;
						}
				}
			}
			else {
				if((65 <= ev.keyCode && ev.keyCode <= 90) || (48 <= ev.keyCode && ev.keyCode <= 57) || ev.keyCode === 187 || ev.keyCode === 189 || (219 <= ev.keyCode && ev.keyCode <= 221) || ev.keyCode === 186 || ev.keyCode === 222 || ev.keyCode === 188 || ev.keyCode === 190 || ev.keyCode === 191 || ev.keyCode === 192 || ev.keyCode === 32) { // a-z, 0-9, =, -, [, ], \, ;, ', ",", ., /, `, and SPACE keys
					if(!stickyNotes[selectedStickyNoteIndex].full()) {
						stickyNotes[selectedStickyNoteIndex].textContent += ev.key; // this also covers capital letters / characters reached with the shift modifier
					}
				}
				else if(ev.keyCode === 13) { // RETURN key
					if(!stickyNotes[selectedStickyNoteIndex].full()) {
						stickyNotes[selectedStickyNoteIndex].textContent += '\n';
					}
				}
				else if(ev.keyCode === 8) { // DELETE key
					var text = stickyNotes[selectedStickyNoteIndex].textContent;
					if(text.length > 0) {
						stickyNotes[selectedStickyNoteIndex].textContent = text.substring(0, text.length - 1);
					}
				}
			}
		}
	}

	function keyup(ev) {
		if(state == GameStates.GAME) {
			switch(ev.keyCode) {
				case 37: // left arrow key
				case 65: // a key
					keys.left = false;
					break;
				case 38: // up arrow key
				case 87: // w key
					keys.up = false;
					break;
				case 39: // right arrow key
				case 68: // d key
					keys.right = false;
					break;
				case 40: // down arrow key
				case 83: // s key
					keys.down = false;
					break;
				default:
					break;
			}
		}
	}

	function mousedown(ev) {
		if(state == GameStates.MAINMENU) {
			var width = context.measureText('Play').width;
			var height = 30;
			var x = canvas.width / 2 - width / 2;
			var y = canvas.height / 2 - height;
			if(x <= ev.pageX && ev.pageX <= x + width &&
			   y <= ev.pageY && ev.pageY <= y + height) {
				state = GameStates.GAME;
			}
			width = context.measureText('Rules').width;
			x = canvas.width / 2 - width / 2;
			y = canvas.height * 3 / 5 - height;
			if(x <= ev.pageX && ev.pageX <= x + width &&
			   y <= ev.pageY && ev.pageY <= y + height) {
				state = GameStates.RULES;
			}
		}
		if(state == GameStates.GAME) {
			utensil.x = ev.pageX / window.innerWidth;
			utensil.y = ev.pageY / window.innerHeight;
			mouserightdown = true;
			if(utensil.mode == UtensilModes.PENCIL) {
				var flag = false;
				for(var i=0;i<stickyNotes.length;i++) {
					if(stickyNotes[i].boundingBox(canvas, player).x <= ev.pageX && ev.pageX <= stickyNotes[i].boundingBox(canvas, player).x + stickyNotes[i].boundingBox(canvas, player).width &&
					   stickyNotes[i].boundingBox(canvas, player).y <= ev.pageY && ev.pageY <= stickyNotes[i].boundingBox(canvas, player).y + stickyNotes[i].boundingBox(canvas, player).height) {
						selectedStickyNoteIndex = (selectedStickyNoteIndex === i) ? -1 : i;
						flag = true;
						break;
					}
				}
				if(!flag && selectedStickyNoteIndex === -1) {
					points.push([[utensil.x + player.x - 0.5, utensil.y + player.y - 0.5]]);
				}
			}
			else if(utensil.mode == UtensilModes.ERASER) {
				boundingBox = utensil.eraserBoundingBox(canvas);
				for(var i=0;i<points.length;i++) {
					for(var j=0;j<points[i].length;j++) {
						if(boundingBox.x <= (points[i][j][0] + 0.5 - player.x) * canvas.width && (points[i][j][0] + 0.5 - player.x) * canvas.width <= boundingBox.x + boundingBox.width &&
						   boundingBox.y <= (points[i][j][1] + 0.5 - player.y) * canvas.height && (points[i][j][1] + 0.5 - player.y) * canvas.height <= boundingBox.y + boundingBox.height) {
							points[i].splice(j--, 1);
						}
					}
				}
				for(var i=0;i<motors.length;i++) {
					for(var j=0;j<motors[i].points.length;j++) {
						if(boundingBox.x <= (motors[i].points[j][0] + 0.5 - player.x) * canvas.width && (motors[i].points[j][0] + 0.5 - player.x) * canvas.width <= boundingBox.x + boundingBox.width &&
						   boundingBox.y <= (motors[i].points[j][1] + 0.5 - player.y) * canvas.height && (motors[i].points[j][1] + 0.5 - player.y) * canvas.height <= boundingBox.y + boundingBox.height) {
							motors.splice(i--, 1);
						}
					}
				}
				for(var i=0;i<stickyNotes.length;i++) {
					var boundingBox = stickyNotes[i].boundingBox(canvas, player);
					if(boundingBox.x <= ev.pageX && ev.pageX <= boundingBox.x + boundingBox.width) {
						if(boundingBox.y <= ev.pageY && ev.pageY <= boundingBox.y + boundingBox.height) {
							stickyNotes.splice(i--, 1);
						}
					}
				}
			}
			else if(utensil.mode == UtensilModes.STRAIGHT_PENCIL) {
				if(points.length >= 1 && points[points.length - 1].length >= 1) {
					var x0 = points[points.length - 1][points[points.length - 1].length - 1][0];
					var y0 = points[points.length - 1][points[points.length - 1].length - 1][1];
					var x = utensil.x + player.x - 0.5;
					var y = utensil.y + player.y - 0.5;
					var dx = Math.abs(x - x0);
					var dy = Math.abs(y - y0);
					if(dx > dy) { points[points.length - 1].push([x, y0]); }
					else        { points[points.length - 1].push([x0, y]); }
				}
				else {
					points.push([[utensil.x + player.x - 0.5, utensil.y + player.y - 0.5]]);
				}
			}
			else if(utensil.mode == UtensilModes.STICKY_NOTE) {
				stickyNotes.push(new StickyNote(utensil.x + player.x - 0.5, utensil.y + player.y - 0.5));
			}
			else if(utensil.mode == UtensilModes.MOTOR) {
				var flg = false;
				for(var i=0;i<motors.length;i++) {
					if(motors[i].clicked(ev.pageX, ev.pageY, canvas, context, player)) {
						flg = true;
						motors[i].velocity = (motors[i].point === 0) ? 0.005 : -0.005;
					}
				}
				if(!flg) {
					if(motors.length > 0 && motors[motors.length - 1].points.length < 3) {
						motors[motors.length - 1].points.push([utensil.x + player.x - 0.5, utensil.y + player.y - 0.5]);
					}
					else {
						motors.push(new Motor([[utensil.x + player.x - 0.5, utensil.y + player.y - 0.5]]));
					}
				}
			}
		}
	}

	function mousemove(ev) {
		if(state == GameStates.MAINMENU) {
			var width = context.measureText('Play').width;
			var height = 30;
			var x = canvas.width / 2 - width / 2;
			var y = canvas.height / 2 - height;
			firstButtonHover = secondButtonHover = false;
			if(x <= ev.pageX && ev.pageX <= x + width &&
			   y <= ev.pageY && ev.pageY <= y + height) {
				firstButtonHover = true;
			}
			width = context.measureText('Rules').width;
			x = canvas.width / 2 - width / 2;
			y = canvas.height * 3 / 5 - height;
			if(x <= ev.pageX && ev.pageX <= x + width &&
			   y <= ev.pageY && ev.pageY <= y + height) {
				secondButtonHover = true;
			}
		}
		else if(state == GameStates.GAME) {
			utensil.x = ev.pageX / window.innerWidth;
			utensil.y = ev.pageY / window.innerHeight;
			if(mouserightdown) {
				if(utensil.mode == UtensilModes.PENCIL) {
					if(points.length >= 1 && selectedStickyNoteIndex === -1) {
						points[points.length - 1].push([utensil.x + player.x - 0.5, utensil.y + player.y - 0.5]);
					}
				}
				else if(utensil.mode == UtensilModes.ERASER) {
					boundingBox = utensil.eraserBoundingBox(canvas);
					for(var i=0;i<points.length;i++) {
						for(var j=0;j<points[i].length;j++) {
							if(boundingBox.x <= (points[i][j][0] + 0.5 - player.x) * canvas.width && (points[i][j][0] + 0.5 - player.x) * canvas.width <= boundingBox.x + boundingBox.width &&
							   boundingBox.y <= (points[i][j][1] + 0.5 - player.y) * canvas.height && (points[i][j][1] + 0.5 - player.y) * canvas.height <= boundingBox.y + boundingBox.height) {
								points[i].splice(j--, 1);
							}
						}
					}
					for(var i=0;i<motors.length;i++) {
						for(var j=0;j<motors[i].points.length;j++) {
							if(boundingBox.x <= (motors[i].points[j][0] + 0.5 - player.x) * canvas.width && (motors[i].points[j][0] + 0.5 - player.x) * canvas.width <= boundingBox.x + boundingBox.width &&
							   boundingBox.y <= (motors[i].points[j][1] + 0.5 - player.y) * canvas.height && (motors[i].points[j][1] + 0.5 - player.y) * canvas.height <= boundingBox.y + boundingBox.height) {
								motors.splice(i--, 1);
							}
						}
					}
					for(var i=0;i<stickyNotes.length;i++) {
						var boundingBox = stickyNotes[i].boundingBox(canvas, player);
						if(boundingBox.x <= ev.pageX && ev.pageX <= boundingBox.x + boundingBox.width) {
							if(boundingBox.y <= ev.pageY && ev.pageY <= boundingBox.y + boundingBox.height) {
								stickyNotes.splice(i--, 1);
							}
						}
					}
				}
			}
		}
	}

	function mouseup(ev) {
		if(state == GameStates.GAME) {
			utensil.x = ev.pageX / window.innerWidth;
			utensil.y = ev.pageY / window.innerHeight;
			mouserightdown = false;
			if(utensil.mode == UtensilModes.PENCIL) {
				if(points.length >= 1 && selectedStickyNoteIndex === -1) {
					points[points.length - 1].push([utensil.x + player.x - 0.5, utensil.y + player.y - 0.5]);
				}
			}
			else if(utensil.mode == UtensilModes.ERASER) {
				boundingBox = utensil.eraserBoundingBox(canvas);
				for(var i=0;i<points.length;i++) {
					for(var j=0;j<points[i].length;j++) {
						if(boundingBox.x <= (points[i][j][0] + 0.5 - player.x) * canvas.width && (points[i][j][0] + 0.5 - player.x) * canvas.width <= boundingBox.x + boundingBox.width &&
						   boundingBox.y <= (points[i][j][1] + 0.5 - player.y) * canvas.height && (points[i][j][1] + 0.5 - player.y) * canvas.height <= boundingBox.y + boundingBox.height) {
							points[i].splice(j--, 1);
						}
					}
				}
				for(var i=0;i<motors.length;i++) {
					for(var j=0;j<motors[i].points.length;j++) {
						if(boundingBox.x <= (motors[i].points[j][0] + 0.5 - player.x) * canvas.width && (motors[i].points[j][0] + 0.5 - player.x) * canvas.width <= boundingBox.x + boundingBox.width &&
						   boundingBox.y <= (motors[i].points[j][1] + 0.5 - player.y) * canvas.height && (motors[i].points[j][1] + 0.5 - player.y) * canvas.height <= boundingBox.y + boundingBox.height) {
							motors.splice(i--, 1);
						}
					}
				}
				for(var i=0;i<stickyNotes.length;i++) {
					var boundingBox = stickyNotes[i].boundingBox(canvas, player);
					if(boundingBox.x <= ev.pageX && ev.pageX <= boundingBox.x + boundingBox.width) {
						if(boundingBox.y <= ev.pageY && ev.pageY <= boundingBox.y + boundingBox.height) {
							stickyNotes.splice(i--, 1);
						}
					}
				}
			}
		}
	}

	function render() {
		/* DRAWING THE NOTEBOOK */
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = 'red';
		context.fillRect(canvas.width / 12 - 1, 0, 2, canvas.height);
		context.fillStyle = 'lightblue';
		for(var i=3;i<20;i++) {
			context.fillRect(0, canvas.height * i / 20 - 1, canvas.width, 2);
		}
		context.fillStyle = 'black';
		for(var i=0;i<3;i++) {
			context.beginPath();
			context.arc(canvas.width / 24, canvas.height * (3 + i * 7) / 20 + canvas.height / 40, 20, 0, 2 * Math.PI);
			context.closePath();
			context.fill();
		}

		if(state == GameStates.MAINMENU) {
			context.font = '48px Shadows Into Light';
			context.fillStyle = 'black';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText('Scribbler', canvas.width / 2, canvas.height / 4 - 15);
			context.font = '30px Shadows Into Light';
			context.fillStyle = firstButtonHover ? 'rgb(200, 0, 0)' : 'black';
			context.fillText('Play', canvas.width / 2, canvas.height / 2 - 15);
			context.fillStyle = secondButtonHover ? 'rgb(200, 0, 0)' : 'black';
			context.fillText('Rules', canvas.width / 2, canvas.height * 3 / 5 - 15);
		}

		else if(state == GameStates.GAME) {
			/* DRAWING PLAYER'S LINES */
			context.strokeStyle = 'black';
			for(var i=0;i<points.length;i++) {
				var flg = false;
				for(var j=0;j<points[i].length;j++) {
					if(Math.abs(points[i][j][0] - player.x) <= 0.5 &&
					   Math.abs(points[i][j][1] - player.y) <= 0.5) {
						flg = true;
						context.beginPath();
						context.arc((points[i][j][0] + 0.5 - player.x) * canvas.width, (points[i][j][1] + 0.5 - player.y) * canvas.height, 1, 0, 2 * Math.PI);
						context.closePath();
						context.fill();
					}
				}
				if(!flg) { continue; }
				if(points[i].length >= 2) {
					context.beginPath();
					context.moveTo((points[i][0][0] + 0.5 - player.x) * canvas.width, (points[i][0][1] + 0.5 - player.y) * canvas.height);
					for(var j=0;j<points[i].length;j++) {
						context.lineTo((points[i][j][0] + 0.5 - player.x) * canvas.width, (points[i][j][1] + 0.5 - player.y) * canvas.height);
					}
					context.stroke();
				}
			};

			/* DRAWING THE GAME OBJECTS */
			for(var i=0;i<stickyNotes.length;i++) {
				stickyNotes[i].render(canvas, context, player, selected=(i === selectedStickyNoteIndex));
			}
			for(var i=0;i<motors.length;i++) {
				motors[i].render(canvas, context, player);
			}
			player.render(canvas, context);
			utensil.render(canvas, context);

			/* DRAWING THE PLAYER'S POSITION */
			context.textAlign = 'left';
			context.font = '24px Shadows Into Light';
			context.fillStyle = 'black';
			context.fillText('(' + (player.x * 100 | 0).toString() + ', ' + (player.y * 100 | 0).toString() + ')', 5, 25);
			context.fillText('Current tool:', 5, 75);
			context.fillText(Object.keys(UtensilModes)[utensil.mode].toLowerCase().replace('_', ' '), 5, 100)
		}
	}

	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	function start() {
		resize();
		window.onkeydown = keydown;
		window.onkeyup = keyup;
		window.onmousedown = mousedown;
		window.onmousemove = mousemove;
		window.onmouseup = mouseup;
		window.onresize = resize;
		setInterval(function() {
			update();
			render();
		}, 1000/fps);
	}

	function update() {
		if(state == GameStates.GAME) {
			var moved = false;
			if(keys.left) {
				moved = true;
				player.x -= 0.001;
				var flg = false;
				for(var j=0;j<motors.length;j++) {
					if(motors[j].collision(canvas, player)) {
						player.x += 0.001;
						flg = true;
					}
				}
				if(!flg) {
					outer: for(var i=0;i<points.length;i++) {
						for(var j=0;j<points[i].length-1;j++) {
							if(player.collision(canvas, points[i][j][0], points[i][j][1], points[i][j+1][0], points[i][j+1][1])) {
								player.x += 0.001;
								break outer;
							}
						}
					}
				}
			}	
			if(keys.right) {
				moved = true;
				player.x += 0.001;
				var flg = false;
				for(var j=0;j<motors.length;j++) {
					if(motors[j].collision(canvas, player)) {
						player.x -= 0.001;
						flg = true;
					}
				}
				if(!flg) {
					outer: for(var i=0;i<points.length;i++) {
						for(var j=0;j<points[i].length-1;j++) {
							if(player.collision(canvas, points[i][j][0], points[i][j][1], points[i][j+1][0], points[i][j+1][1])) {
								player.x -= 0.001;
								break outer;
							}
						}
					}
				}
			}
			if(keys.up) {
				moved = true;
				player.y -= 0.001;
				var flg = false;
				for(var j=0;j<motors.length;j++) {
					if(motors[j].collision(canvas, player)) {
						player.y += 0.001;
						flg = true;
					}
				}
				if(!flg) {
					outer: for(var i=0;i<points.length;i++) {
						for(var j=0;j<points[i].length-1;j++) {
							if(player.collision(canvas, points[i][j][0], points[i][j][1], points[i][j+1][0], points[i][j+1][1])) {
								player.y += 0.001;
								break outer;
							}
						}
					}
				}
			}	
			if(keys.down) {
				moved = true;
				player.y += 0.001;
				var flg = false;
				for(var j=0;j<motors.length;j++) {
					if(motors[j].collision(canvas, player)) {
						player.y -= 0.001;
						flg = true;
					}
				}
				if(!flg) {
					outer: for(var i=0;i<points.length;i++) {
						for(var j=0;j<points[i].length-1;j++) {
							if(player.collision(canvas, points[i][j][0], points[i][j][1], points[i][j+1][0], points[i][j+1][1])) {
								player.y -= 0.001;
								break outer;
							}
						}
					}
				}
			}
			if(moved) {
				player.animationIndex = (player.animationIndex + 1) % player.totalAnimations;
			}
			for(var i=0;i<motors.length;i++) {
				motors[i].update();
			}
		}
	}

	start();
};
