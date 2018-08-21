const socket = io('http://' + document.domain + ':' + location.port);
// verify our websocket connection is established
socket.on('connect', function() {
	console.log('Websocket connected!');
});

var username = prompt("Username");
socket.on('game-created', function(room_id, player_id) {
	window.room_id = room_id;
	window.player_id = player_id;
	console.log(room_id);
	console.log(player_id);
	fetchlobby(true)
	.then(function(){
		document.getElementById("room-id-display").innerHTML = room_id;
		let node = document.createElement("LI");                 
		let textnode = document.createTextNode(player_id+" "+username);       
		node.appendChild(textnode);                              
		document.getElementById("player-list").appendChild(node);
	})
	.then(function(){
		socket.on('room-update', updatePlayerLobby);
	});
});

socket.on('game-joined', function(player_id, players){
	window.player_id = player_id;
	fetchlobby(false)
	.then(function(){
		document.getElementById("room-id-display").innerHTML = window.room_id;
		updatePlayerLobby(players)
	})
	.then(function(){
		socket.on('room-update', updatePlayerLobby);		
	});
});

socket.on('invalid-game-room', function(){
	alert('invalid game room');
})

socket.on('position-update', function(players){
	console.log(players);
})

function joinGame(){
	var room = document.getElementById('room_id').value;
	window.room_id = room;
	socket.emit('join-game', room, username);
}

function createGame(){
	socket.emit('create-game', username);
}

function fetchlobby(owner){
	return fetch('/lobby')
		.then(function(response){
			return response.text();
		})
		.then(function(html){
			document.getElementById("app").innerHTML = html;
			if(!owner){
				document.getElementById("owner-privileges").style.visibility = "hidden";
			}
		});
}

function updatePlayerLobby(players){
	var players = JSON.parse(players);
	document.getElementById("player-list").innerHTML = "";                
	for(let i = 0; i<players.length; i++){
		let node = document.createElement("LI");
		if(players[i] == null || players[i] == undefined)
			continue;                 
		let textnode = document.createTextNode(players[i]['id']+" "+players[i]['name']);       
		node.appendChild(textnode);                              
		document.getElementById("player-list").appendChild(node);	
	}
	console.log(players);
}	

function startGame(){
	socket.emit('start-game');
}

socket.on('game-started', function(playerpos){
	document.getElementById("app").innerHTML = "<h1>"+window.room_id+"</h1>"+"<canvas id='game-canvas' width='500' height='500' style='border:5px solid black;'>";
	console.log(playerpos);
	var canvas = document.getElementById('game-canvas');
	if(canvas.getContext){
		var ctx = canvas.getContext('2d');
		/*
		for(let i = 0; i < playerpos.length; i++){
			ctx.fillRect(playerpos[i][25, 50, 50);
		}*/
	}
});