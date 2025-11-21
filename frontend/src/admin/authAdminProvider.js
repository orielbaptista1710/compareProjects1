// import API from '../api';

// const authAdminProvider = {
//   login: async ({ email, password }) => {
//     await API.post('/api/auth/login', { email, password }, { withCredentials: true });
//   },
//   logout: async () => {
//     await API.post('/api/auth/logout', {}, { withCredentials: true });
//   },
//   checkAuth: async () => {
//     try {
//       await API.get('/api/auth/check', { withCredentials: true });
//       return Promise.resolve();
//     } catch {
//       return Promise.reject();
//     }
//   },
//   getPermissions: () => Promise.resolve(),
// };

// export default authAdminProvider;
