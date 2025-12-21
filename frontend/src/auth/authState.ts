export const authState = {
  checked: false,
  loggedIn: false,
  username: null as string | null,

  setLoggedIn(username?: string) {
    this.checked = true;
    this.loggedIn = true;
    this.username = username ?? null;
  },

  setLoggedOut() {
    this.checked = true;
    this.loggedIn = false;
    this.username = null;
  },

  reset() {
    this.checked = false;
    this.loggedIn = false;
    this.username = null;
  },
};
