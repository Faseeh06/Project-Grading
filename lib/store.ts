interface UserData {
  id: string;
  name: string;
  role: "student" | "teacher";
}

let userData: UserData | null = null;

export const userStore = {
  setUser: (user: UserData) => {
    userData = user;
  },
  getUser: () => userData,
  clearUser: () => {
    userData = null;
  },
  logout: () => {
    userData = null;
    window.location.href = '/login';
  }
};
