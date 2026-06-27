// src/utils/storage.js
export function getSavedUser() {
  const user = localStorage.getItem("ea_user");
  return user ? JSON.parse(user) : null;
}

export function logoutUser() {
  localStorage.removeItem("ea_user");
}
