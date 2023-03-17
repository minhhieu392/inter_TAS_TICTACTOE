import User from "./user";

class UserManager {
    users: any;

    constructor() {
        this.users = new Map();
    }
    
    add(user: User) {
        this.users.set(user.getSocket(), user);
    }

    get(ws: any) {
        return this.users.get(ws);
    }

    delete(ws: any) {
        this.users.delete(ws);
    }
}

export default UserManager;
