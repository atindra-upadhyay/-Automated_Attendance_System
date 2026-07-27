// Utility functions for localStorage management

export function getSavedUser() {
  try {
    const user = localStorage.getItem('ea_user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting saved user:', error);
    return null;
  }
}

export function saveUser(user) {
  try {
    localStorage.setItem('ea_user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

export function logoutUser() {
  try {
    localStorage.removeItem('ea_user');
  } catch (error) {
    console.error('Error logging out user:', error);
  }
}

export function getToken() {
  try {
    const user = getSavedUser();
    return user ? user.token : null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}
