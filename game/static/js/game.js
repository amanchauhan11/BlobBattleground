class Player {
    constructor(id, view) {
        this.id = id;
        this.view = view;
    }
}

class PlayerView {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}


class KeyboardController {
    constructor(player){
        this.player = player;
    }

    setListener() {
        let view = this.player.view;
        window.addEventListener("keydown", (key)=>{
            switch(key.key){
                case "ArrowDown":
                    view.y+=4;
                    break;
                case "ArrowUp":
                    view.y-=4;
                    break;
                case "ArrowLeft":
                    view.x-=4;
                    break;
                case "ArrowRight":
                    view.x+=4;
                    break;
            }
        });
    }

    stateSnapshot() {
        let state = {
            id: this.player.id,
            posx: this.player.view.x,
            posy: this.player.view.y
        };
        return state;
    }
}

class NetworkController {
    constructor() {
        this.players = {};
    }

    addPlayer(player) {
        this.players[player.id] = player;
    }

    networkUpdate(players) {
        console.log('Network Update');
        console.log(players);
        for(let i = 0; i<players.length; i++){
            if(players[i].id == lobby.self_id)
                continue;
            let view = this.players[players[i].id].view;
            view.x = players[i].posx;
            view.y = players[i].posy;
        }
    }
}

let keyboardController = null;
let networkController = null;

class Game {

    createPlayerView(initial_pos_x, initial_pos_y) {

        return new PlayerView(initial_pos_x, initial_pos_y);
    }

    constructor(config, initialPStates){

        this.canvas = config.canvas;
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.context = this.canvas.getContext("2d");

        this.keyboardController = null;
        this.networkController = new NetworkController();

        for(let i = 0; i<initialPStates.length; i++){
            let self_posx = initialPStates[i].posx;
            let self_posy = initialPStates[i].posy;
            let player = new Player(initialPStates[i].id, this.createPlayerView(self_posx, self_posy));
            if(initialPStates[i].id == lobby.self_id){    
                this.keyboardController = new KeyboardController(player);
            }
            else {
                this.networkController.addPlayer(player);
            }
        }

        this.keyboardController.setListener();

        lobby.socket.on('game-update', (players) => {
            players = JSON.parse(players);
            this.clear();
            this.redraw();
            this.networkController.networkUpdate(players);
            lobby.socket.emit('client-update', JSON.stringify(this.keyboardController.stateSnapshot()));
        });
    }

    clear(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    redraw(){
        let ctx = this.context;
        ctx.fillStyle = "blue";
        let self_x = this.keyboardController.player.view.x;
        let self_y = this.keyboardController.player.view.y;
        ctx.fillRect(self_x, self_y, 30, 30);

        ctx.fillStyle = "red";
        for(let id in this.networkController.players){
            let pos_x = this.networkController.players[id].view.x;
            let pos_y = this.networkController.players[id].view.y;
            ctx.fillRect(pos_x, pos_y, 30, 30);
        }
    }
}


function gameSetup(players) {
    console.log(players);
    players = JSON.parse(players);
    const config = {
        canvas: document.body.appendChild(document.createElement('canvas'))
    }
    let game = new Game(config, players);
    console.log('Created Canvas game');
}
