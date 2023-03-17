import { MATCHING_MMR_RANGE } from "../../utils/constants";
import User from "./user";

class RoomManager {
    rooms: any;

    constructor() {
        this.rooms = new Map();
    }
    
    add(room: any) {
        this.rooms.set(room.getId(), room);
    }

    get(id: String) {
        return this.rooms.get(id);
    }

    pullFirst() {
        const [firstRoom] = this.rooms.values();
        if (!firstRoom)
            return null;
        this.rooms.delete(firstRoom.getId());
        return firstRoom;
    }

    findExistRoom(msg) {
        let room = null;
        const { mmr } = msg;
        let indexMMR = MATCHING_MMR_RANGE.findIndex((ele) => (ele.from <= mmr && ele.to && ele.to >= mmr));
        if (indexMMR < 0) indexMMR = MATCHING_MMR_RANGE.length - 1;
        const rangeMMR =  MATCHING_MMR_RANGE[indexMMR];
        for (const key of this.rooms.keys()) {
            const val = this.rooms.get(key);
            if ((rangeMMR.from <= val.mmr && rangeMMR.to && rangeMMR.to >= val.mmr) || (rangeMMR.from <= val.mmr && !rangeMMR.to)) {
                room = val;
                return room
            }
        };
        return room;
    }

    removeRoom(id: String) {
        this.rooms.delete(id);
    }
    
    isExistRoom(roomId: String) {
        return this.get(roomId) != null;
    }

    userLeaveRoom(user: User) {
        const room = user.getRoom();
        if (!room)
            return false;
        if (!this.isExistRoom(room.getId()))
            return false;
        room.userLeave(user);
        if (room.isUserEmpty())
            this.rooms.delete(room.getId());

        console.log(116, 'RoomManager.userLeaveRoom')
        return true;
    }
    
}

export default RoomManager;
