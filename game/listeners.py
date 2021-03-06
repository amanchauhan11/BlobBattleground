from flask_socketio import emit, join_room, leave_room
from flask import request, current_app
from game import socketio
from game.game_room import rooms, GameRoom
from game.game_loop import game_loop
import json
from game import utilities as ut

sid_map = {}

@socketio.on('create-lobby')
def create(name):
    room = GameRoom()
    rooms[room.id] = room
    join_room(room.id)

    player = room.new_player(name)

    sid_map[request.sid] = (room.id, player.id)

    current_app.logger.debug('Lobby %s created by %s', room.id, player.name)
    emit('lobby-created', (room.id, player.id))


@socketio.on('join-lobby')
def join(room_id, name):
    room = rooms[room_id]
    join_room(room.id)

    player = room.new_player(name)

    sid_map[request.sid] = (room.id, player.id)

    current_app.logger.debug('(%s, %s) joined %s', player.id, player.name, player.id)
    emit('lobby-joined', (player.id, ut.serialize_player(room.players, ['id','name'])) )
    emit('lobby-update', ut.serialize_player(room.players, ['id','name']), room=room.id)

@socketio.on('start-game')
def start():
    room_id, player_id = sid_map[request.sid]
    room = rooms[room_id]
    player = room.players[player_id]
    if player == room.owner and room.state == GameRoom.State.Lobby:
        room.spawn_players()
        emit('game-started', ut.serialize_player(room.players, ['id','posx','posy']), room=room_id)
        current_app.logger.debug('Starting server game loop for %s', room.id)
        socketio.start_background_task(game_loop, room, current_app._get_current_object())
    else:
        current_app.logger.info('Attempt to start game %s by non-owner or a game not in Lobby state', room.id)


@socketio.on('disconnect')
def on_disconnect():
    room = rooms[sid_map[request.sid][0]]
    p_id = sid_map[request.sid][1]
    room.remove_player(p_id)
    leave_room(room.id)
    current_app.logger.info('Player %s left room %s', room.players[p_id].name, room.id)
    emit('lobby-update', ut.serialize_player(room.players, ['id','name']), room=room.id) 



