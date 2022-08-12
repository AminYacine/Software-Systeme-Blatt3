export class Overview {
    render() {
        return `
        <body>

            <div>
                <input type="text" id="roomName" name="roomName" placeholder="Enter new room name">
        <button type="button" id="newRoomButton">Create new Room</button>
        </div>
        <div> Available canvas rooms:
            <ul id="rooms">
                
        </ul>
        </div>
        </body>
        `;
    }
}