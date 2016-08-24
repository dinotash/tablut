// round to the nearest whatever
function roundto(inputnum, precision) {
	return precision * Math.round(inputnum / precision);
}

// classes we'll be using
function boardsquare(row, col) {
	var newsquare = document.createElement('div');
	newsquare.setAttribute('id', 'r' + row + 'c' + col);
	newsquare.setAttribute('class', 'tablutsquare');
	newsquare.filler = null;
	newsquare.base = false;
	newsquare.style.zIndex = 2;
	return newsquare;
}

function gamepiece(id, swedish, location, src, alt, startfirst) {
	var newtile = document.createElement('img');
	newtile.setAttribute('id', id);
	gamepieces.push(id);
	newtile.swedish = swedish;
	findpos(location, newtile);
	newtile.setAttribute('src', src);
	newtile.setAttribute('alt', alt);
	newtile.basecamp = !swedish;
	if (startfirst) {
		newtile.style.zIndex = 4;
	}
	else {
		newtile.style.zIndex = 1;
	}
	Drag.init(newtile);
	snapto(newtile);
	return newtile;
}

// when we need to be rid of a piece
function deletepiece(object) {
	var gamepieceindex = gamepieces.join().indexOf(object.id);
	var commacount = 0;
	var j = 0;
	for (j = 0; j < gamepieceindex; j++) {
		if (gamepieces.join().charAt(j) == ',') {
			commacount++;
		}
	}
	document.getElementById(object.location).filler = null;
	gamepieces.splice(commacount, 1);
	object.parentNode.removeChild(object);
}

// turn square reference into pixel position
function findpos(square, object) {
	object.style.top = startheight + (52 * parseInt(square.charAt(1))) + 'px';
	object.style.left = startwidth + (52 * parseInt(square.charAt(3))) + 'px';
	object.location = square;
	document.getElementById(square).filler = object.id;
	return true;
}

function checkjumps(object, newrow, newcol) {
	// find which way it moved and then look at the squares in between - are they full or base?
	var oldrow = parseInt(object.location.charAt(1));
	var oldcol = parseInt(object.location.charAt(3));
	var rdiff = newrow - oldrow;
	var cdiff = newcol - oldcol;
	var rstep = 0;
	var cstep = 0;
	if (rdiff != 0) {
		rstep = Math.abs(rdiff) / rdiff;
	}
	if (cdiff != 0) {
		cstep = Math.abs(cdiff) / cdiff;
	}
	for (i = 0; i < Math.abs(rdiff + cdiff); i++) {
		var thissquare = document.getElementById('r' + (oldrow + ((i + 1) * rstep)) + 'c' + (oldcol + ((i + 1) * cstep)));
		if (thissquare.id == 'r4c4') {
			alert("Pieces cannot jump over the castle square");
			findpos(object.location, object);
			return false;
		}
		if (thissquare.filler != null) {
			alert("Pieces cannot jump over others");
			findpos(object.location, object);
			return false;
		}
		if ((thissquare.base) && (!object.basecamp)) {
			alert("Pieces cannot jump over the Muscovite base camps");
			findpos(object.location, object);
			return false;
		}
		if ((document.getElementById(object.location).base) && (document.getElementById('r' + newrow + 'c' + newcol).base) && ((rdiff > 7) || (cdiff > 7))) {
			alert("Muscovite pieces cannot return to their base camps after leaving them");
			findpos(object.location, object);
			return false;
		}
	}
	return true;
}

// has the object just completed a trap and captured a pawn?
function checkcaptures(object) {
	var startrow = parseInt(object.location.charAt(1));
	var startcol = parseInt(object.location.charAt(3));
	var tocheck = new Array(0, 2, 0, -2, 2, 0, -2, 0); // horizontal, then distance
	var i = 0;
	for (i = 0; i < tocheck.length; i += 2) {
		var newrow = startrow + tocheck[i];
		var newcol = startcol + tocheck[i + 1];
		if ((newrow < 0) || (newrow > 8) || (newcol < 0) || (newcol > 8)) {
			continue;
		}
		var comradesq = document.getElementById('r' + newrow + 'c' + newcol);
		var comrade = document.getElementById(comradesq.filler);
		var mrow = startrow + (tocheck[i] / 2);
		var mcol = startcol + (tocheck[i + 1] / 2);
		var middlesquare = document.getElementById('r' + mrow + 'c' + mcol);
		var middleman = document.getElementById(middlesquare.filler);
		if (((comrade) && (comrade.swedish == object.swedish)) || ((comradesq.base) && (!comradesq.filler)) || ((comradesq.id == 'r4c4') && (!comradesq.filler))) {
			if (middlesquare.id != 'r4c4') {
				if ((middleman) && (middleman.swedish != object.swedish)) {
					if (middleman.id == 'king') {
						if ((!comradesq.base) || ((comradesq.base) && (comradesq.filler))) {
							document.getElementById('tablutstatus').firstChild.nodeValue = "Muscovy wins: the Swedish king has been captured";
							endgame();
							return false;
						}
					}
					else {
						deletepiece(middleman);
					}
				}
			}
		}
		else { // time to look at trapping a pawn next to the king
			if ((newrow < 1) || (newrow > 7) || (newcol < 1) || (newcol > 7)) {
				continue;
			}
			if ((comrade) && (middleman) && ((comrade.id == 'king') || (middleman.id == 'king'))) {
				var thirdrow = startrow + (3 * (tocheck[i] / 2));
				var thirdcol = startcol + (3 * (tocheck[i + 1] / 2));
				var thirdsq = document.getElementById('r' + thirdrow + 'c' + thirdcol);
				var thirdman = document.getElementById(thirdsq.filler);
				if (((thirdman) && (thirdman.swedish == object.swedish)) || ((thirdsq.base) && (!thirdsq.filler))) {
					if (middlesquare.id != 'r4c4') {
						if ((comrade.swedish != object.swedish) && (middleman.swedish != object.swedish)) {
							if (comrade.id == 'king') {
								deletepiece(middleman);
							}
							else {
								deletepiece(comrade);
							}
						}
					}
				}
			}
		}
	}
	return true;
}

// let's reuse this code for checking escape routes
function checkroute(howmany, startr, startc, rdiff, cdiff) {
	var empty = 0;
	var m = 0;
	for (m = 0; m < howmany; m++) {
		var squaretocheck = document.getElementById('r' + (startr + (m * rdiff)) + 'c' + (startc + (m * cdiff)));
		if ((!squaretocheck.filler) && (!squaretocheck.base)) {
			empty++;
		}
	}
	if (((rdiff > 0) && (empty == howmany)) || ((cdiff > 0) && (empty == howmany))) {
		return 1;
	}
	return 0;
}

// vikings were polite enough to warn each other before the king absconded
function checkescaperoute() {
	var escapecount = 0;
	var kingsq = document.getElementById('king').location;
	var kingr = parseInt(kingsq.charAt(1));
	var kingc = parseInt(kingsq.charAt(3));
	if ((kingr > 2) && (kingr < 6) && (kingc > 2) && (kingc < 6)) {
		return false;
	}
	if ((kingr < 3) || (kingr > 5)) {
		escapecount += checkroute(kingc, kingr, 0, 0, 1);
		escapecount += checkroute((8 - kingc), kingr, (kingc + 1), 0, 1);
	}
	if ((kingc < 3) || (kingc > 5)) {
		escapecount += checkroute(kingr, 0, kingc, 1, 0);
		escapecount += checkroute((8 - kingr), (kingr + 1), kingc, 1, 0);
	}
	raicki = false;
	tuicku = false; //default to not being true
	if (escapecount == 1) {
		raicki = true;
	}
	if (escapecount > 1) {
		tuicku = true;
	}
	return true;
}

// put the team that just moved under the boardcover, and lift the others out.
function swapsides() {
	var i = 0;
	for (i = 0; i < gamepieces.length; i++) {
		var thispiece = document.getElementById(gamepieces[i]);
		thispiece.style.zIndex = 1;
		if (oneup == 'true') {
			if (thispiece.swedish == nextturn) {
				thispiece.style.zIndex = 4;
			}
		}
	}
    if (oneup == 'true') {
        if (nextturn == true) {
            document.getElementById('tablutstatus').firstChild.nodeValue = "Sweden's turn";
        }
        else {
            document.getElementById('tablutstatus').firstChild.nodeValue = "Muscovy's turn";
        }

        if (raicki) {
        	document.getElementById('tablutstatus').firstChild.nodeValue += ' – Raicki: the Swedish king has one escape route';
        }
        if (tuicku) {
        	document.getElementById('tablutstatus').firstChild.nodeValue += ' – Tuicku: the Swedish king has two or more one escape routes';;
        }
    }
	if (oneup == 'false') {
		statusp.firstChild.nodeValue = 'Please wait while ' + oppname + ' makes their move.';
		notyourgo();
	}
	else {
		nextturn ^= 1;
	}
	return true;
}

// what to do when it's not your go
function notyourgo() {
	for (k = 0; k < gamepieces.length; k++) {
		document.getElementById(gamepieces[k]).style.zIndex = 1;
	}
	boardmask.style.visibility = 'visible';
	setTimeout('findoutmove()', 5000);
	return true;
}

// separate function so we can have an interval
function findoutmove() {
	var moveinfo = GetXMLFile('http://www.dinosaursandmoustaches.com/gettablut.php?game=' + game).split('~');
	if (moveinfo.length != 5) {
		return false;
	}
	if (svenska.charAt(0) == 't') {
		oppnum = 1;
	}
	else {
		oppnum = 0;
	}
	if ((oppname == 'your opponent') && (moveinfo[oppnum].length > 0)) {
		oppname = moveinfo[oppnum];
	}
	if ((moveinfo[2].length > 0) && (moveinfo[2].charAt(0) == 'a')) {
		alert('Sorry but your opponent has left the game. There\'s no point continuing.');
		endgame();
	}
	else if ((moveinfo[2].length > 0) && (moveinfo[2].charAt(0) != svenska.charAt(0))) {
		statusp.firstChild.nodeValue = 'It\'s your turn.';
		boardmask.style.visibility = 'hidden';
		if (moveinfo[3].length > 0) {
			var piece = document.getElementById(moveinfo[3]);
			var newloc = (moveinfo[4].substr(0,4));
			document.getElementById(piece.location).filler = null;
			findpos(newloc, piece);
			// has the dastardly muscovite moved out of the base camp?
			if ((piece.basecamp) && (!document.getElementById(newloc).base)) {
				piece.basecamp = false;
			}
			// has the king escaped?
			if (moveinfo[3] == 'king') {
				if ((parseInt(newloc.charAt(1)) == 0) || (parseInt(newloc.charAt(1)) == 8) || (parseInt(newloc.charAt(3)) == 0) || (parseInt(newloc.charAt(3)) == 8)) {
					document.getElementById('tablutstatus').firstChild.nodeValue = 'Sweden wins: the Swedish king has escaped!';
					endgame();
					return false;
				}
			}
			checkescaperoute();
			checkcaptures(piece);
		}
		var i;
		for (i = 0; i < gamepieces.length; i++) {
			var piecei = document.getElementById(gamepieces[i]);
			if (String(piecei.swedish) == svenska) {
				piecei.style.zIndex = 4;
			}
		}
	}
	else {
		setTimeout('findoutmove()', 5000);
	}
	return true;
}

// vital - does the going off and loading
function GetXMLFile(sourceURL) {
	var xmlhttp = null;
	var doc = null;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	}
	else {
		xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
	}
	if (xmlhttp) {
		xmlhttp.open('GET', sourceURL, false);
		xmlhttp.send(null);
		doc = xmlhttp.responseText;
	}
	return doc;
}

// when stopping dragging, snap to grid
function snapto(object) {
	// make sure the current tile is always on top
	object.onDragStart = function() {
		topzindex++;
		object.style.zIndex = topzindex;
	}

	// snap to the right tile, take note of what's going on
	object.onDragEnd = function(x, y) {
		var roundedrow = (roundto(y - startheight, 52)) / 52;
		var roundedcol = (roundto(x - startwidth, 52)) / 52;
		var oldrow = parseInt(object.location.charAt(1));
		var oldcol = parseInt(object.location.charAt(3));
		var newsq = 'r' + roundedrow + 'c' + roundedcol;
		if ((x <= (startwidth - 20)) || (x >= (startwidth + 440)) || (y <= (startheight - 20)) || (y >= (startheight + 440))) {
			findpos(object.location, object);
			return false;
		}
		else if ((document.getElementById(newsq).filler) && (!(document.getElementById(newsq).filler == object.id))) {
			alert("Tile is already full");
			findpos(object.location, object);
			return false;
		}
		else if (!((roundedrow == oldrow) || (roundedcol == oldcol))) {
			alert("Pieces can only move in straight lines");
			findpos(object.location, object);
			return false;
		}
		else if ((newsq == 'r4c4') && (object.location != 'r4c4')){
			alert("Pieces cannot enter the castle square");
			findpos(object.location, object);
			return false;
		}
		else if ((!object.basecamp) && (document.getElementById(newsq).base)) {
			if (object.swedish) {
				alert("Swedish pieces cannot enter the Muscovite base camps");
			}
			if (!object.swedish) {
				alert("Muscovite pieces cannot return to their base camps after leaving them");
			}
			findpos(object.location, object);
			return false;
		}
		else if (newsq == object.location) {
			findpos(object.location, object);
			return false;
		}
		else {
			// ok, the end square is fine - need to check if the inbetween is clear
			if (checkjumps(object, roundedrow, roundedcol)) {
				// yes, it was a good move so move the piece
				document.getElementById(object.location).filler = null;
				findpos(newsq, object);
				//has the king made it to the edge? if so, victory! (we've already checked for basecamps)
				if (object.getAttribute('id') == 'king') {
					if ((roundedrow == 0) || (roundedrow == 8) || (roundedcol == 0) || (roundedcol == 8)) {
						document.getElementById('tablutstatus').firstChild.nodeValue = "Sweden wins: the Swedish king has escaped!";
						if (oneup == 'false') {
							var infostr = 'game=' + game + '&svenska=true&piece=king&location=' + newsq;
							GetXMLFile('http://www.dinosaursandmoustaches.com/updatetablut.php?' + infostr);						
						}
						endgame();
						return true;
					}
				}
				// has the dastardly muscovite moved out of the base camp?
				if ((object.basecamp) && (!document.getElementById(newsq).base)) {
					object.basecamp = false;
				}
				if (checkcaptures(object)) {
					checkescaperoute();
					if (oneup == 'false') {
						var infostr = 'game=' + game + '&svenska=' + object.swedish + '&piece=' + object.id + '&location=' + newsq;
						GetXMLFile('http://www.dinosaursandmoustaches.com/updatetablut.php?' + infostr);
					}
					swapsides();
				}
			}
		}
	}
	return true;
}

// at the end, immobilise all pieces
function endgame() {
	ended = true;
	var k = 0;
	for (k = 0; k < gamepieces.length; k++) {
		document.getElementById(gamepieces[k]).style.zIndex = 1;
	}
	boardmask.style.visibility = 'hidden';
	statusp.firstChild.nodeValue = 'The game is finished.';
    document.getElementById('tablutstatus').firstChild.nodeValue = "The game is finished";
}

// find out where on the page the grid starts
function newpositions() {
	// where the grid start off
	startheight = document.getElementById('firstparagraph').clientHeight + 44;
	startwidth = 17;
	if (navigator.userAgent.search('Gecko/') != -1) {
		startheight += 0; //4
	}
	if (navigator.appName == 'Opera') {
		startheight += 1;
	}
    if (navigator.vendor == 'Apple Computer, Inc.') {
        startheight -= 3;
    }
    
	//fix the boardmask
	boardmask.style.left = (((document.body.clientWidth - 750) / 2) + 95) + 'px';
	// if there are pieces on the board, set them right
	var n;
	for (n = 0; n < gamepieces.length; n++) {
		var thispiece = document.getElementById(gamepieces[n]);
		findpos(thispiece.location, thispiece);
	}
}

// reset the board ready for a game
function startgame(oneplayer, playerswedish) {
	ended = false;
	newpositions();
	// remove images from last go, if any
	var i = 0;
	for (i = 0; i < gamepieces.length; i++) {
		var thispiece = document.getElementById(gamepieces[i]);
		document.getElementById(thispiece.location).filler = null;
		thispiece.parentNode.removeChild(thispiece);
	}
	gamepieces.splice(0, gamepieces.length);
	if (oneup == 'true') {
		nextturn = !playerswedish;
	}
	else {
		nextturn = false;
	}
	topzindex = 4;
	// write the pieces in the starting positions	
	var i = 0;
	for (i = 0; i < 25; i++) {
		if (i == 0) {
			var newpiece = new gamepiece('king', true, startpos[i], 'king.gif', 'Swedish king', !nextturn);
		}
		else if ((i > 0) && (i < 9)) {
			var newpiece = new gamepiece('swede' + (i - 1), true, startpos[i], 'swede.gif', 'Swedish pawn', !nextturn);
		}
		else {
			var newpiece = new gamepiece('muscovite' + (i - 9), false, startpos[i], 'muscovite.gif', 'Muscovite pawn', nextturn);
		}
		document.getElementById('tablutboard').appendChild(newpiece);
	}
    document.getElementById('tablutstatus').firstChild.nodeValue = "Sweden's turn";
	return true;
}

// initialise misc global variables
var nextturn = false;
var topzindex = 4;
var gamepieces = new Array();
var startheight = 0;
var startwidth = 0;
var oppname = 'your opponent';
var ended = true;

// here's where the pieces start off. the first is the king, then 8 other Swedes, followed by 16 Muscovites
var startpos = new Array('r4c4', 'r4c2', 'r4c3', 'r4c5', 'r4c6', 'r2c4', 'r3c4', 'r5c4', 'r6c4', 'r0c3', 'r0c4', 'r0c5', 'r1c4', 'r3c0', 'r4c0', 'r4c1', 'r5c0', 'r3c8', 'r4c7', 'r4c8', 'r5c8', 'r7c4', 'r8c3', 'r8c4', 'r8c5');

// draw the board
var r = 0;
for (r = 0; r < 9; r++) {
	newrow = document.createElement('div');
	newrow.setAttribute('id', 'row'+r);
	newrow.setAttribute('class', 'tablutrow');
	document.getElementById('tablutboard').appendChild(newrow);
	var c = 0;
	for (c = 0; c < 9; c++) {
		document.getElementById('row'+r).appendChild(new boardsquare(r, c));
	}
}

//identify which squares are the basecamp
basecampsq = new Array('r0c3', 'r0c4', 'r0c5', 'r1c4', 'r3c0', 'r3c8', 'r4c0', 'r4c1', 'r4c7', 'r4c8', 'r5c0', 'r5c8', 'r7c4', 'r8c3', 'r8c4', 'r8c5');
var i = 0;
for (i = 0; i < basecampsq.length; i++) {
	document.getElementById(basecampsq[i]).base = true;
}

oneup = 'true'

var tuicku = false;
var raicki = false;

// add a cover so that we can hide the tiles behind it, making them undraggable
var boardcover = document.createElement('div');
boardcover.setAttribute('id', 'boardcover');
boardcover.style.width = '470px';
boardcover.style.height = '470px';
boardcover.style.position = 'absolute';
boardcover.style.top  = '119px';
//boardcover.style.left = ((document.body.clientWidth - 750) / 2) + 49;
boardcover.style.zIndex = 3;
document.getElementById('tablutboard').appendChild(boardcover);

// add a mask to bring up when it's not your go
var boardmask = document.createElement('div');
boardmask.setAttribute('id', 'boardmask');
boardmask.style.zIndex = 100;
boardmask.style.visibility = 'hidden';
boardmask.style.position = 'absolute';
boardmask.style.top = '172px';
boardmask.style.left = (((document.body.clientWidth - 750) / 2) + 95) + 'px';
boardmask.style.height = '364px';
boardmask.style.width = '364px';
boardmask.style.backgroundColor = 'white';
boardmask.style.color = 'black';
document.getElementById('tablutboard').appendChild(boardmask);