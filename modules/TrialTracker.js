const Enmap = require("enmap");

class Tracker {
  constructor () {
    this.data = new Enmap("users");
    this.users = [];
  }

  getTrialCount () {
    return 6;
  }

  getCleanTrialPositions () {
    return [...Array(this.getTrialCount()).keys()].map(() => false);
  }

  async load () {
    await this.data.defer;
    if (!this.data.get("users")) {
      return;
    }
    for (const user of this.data.get("users")) {
      this.users.push(user);
    }
  }

  async updateDB () {
    this.data.set("users", this.users);
  }

  async createNewUser (userID) {
    const newUser = {
      id: userID,
      positions: this.getCleanTrialPositions()
    };
    this.users.push(newUser);
    await this.updateDB();
    return newUser.positions;
  }

  async update (userID, trialPosition) {
    if (trialPosition === null || trialPosition === undefined) {
      if (!this.users.length) {
        return await this.createNewUser(userID);
      }
      for (const user of this.users) {
        if (user.id.includes(userID)) {
          return user.positions;
        }
        return await this.createNewUser(userID);
      }
    } else {
      for (const [idx, user] of Object.entries(this.users)) {
        if (user.id.includes(userID)) {
          user.positions[trialPosition] = true;
          this.users[idx]["positions"][trialPosition] = true;
          break;
        }
      }
    }
  }

  async getTracker (userID) {
    for (const user of this.users) {
      if (user.id.includes(userID)) {
        return user.positions;
      }
    }
    return await this.update(userID, null);
  }

  async resetTracker (userID=null) {
    if (!userID) {
      for (const [idx, user] of Object.entries(this.users)) {
        user.positions = this.getCleanTrialPositions();
        this.users[idx]["positions"] = this.getCleanTrialPositions();
      }
      await this.updateDB();
    } else {
      for (const [idx, user] of Object.entries(this.users)) {
        if (user.id.includes(userID)) {
          user.positions = this.getCleanTrialPositions();
          this.users[idx]["positions"] = this.getCleanTrialPositions();
          await this.updateDB();
          break;
        }
      }
    }
  }
}

module.exports = Tracker;
