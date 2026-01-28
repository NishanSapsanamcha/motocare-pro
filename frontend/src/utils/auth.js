export const getToken = () => localStorage.getItem("token");

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

export const getUser = () => {
  const userStr = localStorage.getItem("user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const getAdminUser = () => {
  const adminStr = localStorage.getItem("admin");
  try {
    return adminStr ? JSON.parse(adminStr) : null;
  } catch {
    return null;
  }
};

export const setAdminUser = (admin) => {
  localStorage.setItem("admin", JSON.stringify(admin));
};

export const removeAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("admin");
};