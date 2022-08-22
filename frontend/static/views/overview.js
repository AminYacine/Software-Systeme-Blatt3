export class Overview {
    render() {
        return `
        <body>
<div class="overview">
    <div class="input-area">
        <input type="text" id="roomName" name="roomName" placeholder="Enter new room name">
        <button type="button" id="newRoomButton">Create new Room</button>
    </div>
    <div class="room-list"> Available canvas rooms:
        <ul id="rooms"></ul>
    </div>
</div>
</body>
        `;
    }
}
//# sourceMappingURL=overview.js.map