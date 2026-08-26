// import React from 'react';
// import { render, screen, act, waitFor } from '@testing-library/react';
// import { AuthProvider, AuthContext } from './AuthContext';
// import * as firebaseAuth from 'firebase/auth';
// import API from '../api';

// // Mock Firebase
// jest.mock('firebase/auth', () => ({
//   signOut: jest.fn(),
// }));

// // Mock API
// jest.mock('../api', () => ({
//   get: jest.fn(),
// }));

// describe('AuthProvider', () => { 
//   const mockUnsubscribe = jest.fn(); 
//   const mockFirebaseUser = {
//     getIdToken: jest.fn().mockResolvedValue('mock-token'), 
//   };

//   beforeEach(() => {
//     jest.clearAllMocks();
//     // Mock CustomerAuth.onAuthStateChanged
//     CustomerAuth = {
//       onAuthStateChanged: jest.fn((callback) => {
//         // Call callback immediately with mock user
//         callback(mockFirebaseUser);
//         return mockUnsubscribe;
//       }),
//       currentUser: mockFirebaseUser,
//     };
//     firebaseAuth.signOut.mockResolvedValue(undefined);
//     API.get.mockResolvedValue({ data: { customer: { id: '123', name: 'Test User' } } });
//   });

//   test('provides auth context with initial loading state', async () => {
//     render(
//       <AuthProvider>
//         <AuthContext.Consumer>
//           {(value) => (
//             <>
//               <div>Loading: {value.loading.toString()}</div>
//               <div>Syncing: {value.syncingProfile.toString()}</div>
//             </>
//           )}
//         </AuthContext.Consumer>
//       </AuthProvider>
//     );

//     expect(screen.getByText('Loading: true')).toBeInTheDocument();
//     expect(screen.getByText('Syncing: true')).toBeInTheDocument();

//     await waitFor(() => {
//       expect(screen.getByText('Loading: false')).toBeInTheDocument();
//       expect(screen.getByText('Syncing: false')).toBeInTheDocument();
//     });
//   });

//   test('sets current user when Firebase auth and API succeed', async () => {
//     render(
//       <AuthProvider>
//         <AuthContext.Consumer>
//           {(value) => (
//             <div>
//               {value.currentUser && <div>User: {value.currentUser.name}</div>}
//             </div>
//           )}
//         </AuthContext.Consumer>
//       </AuthProvider>
//     );

//     await waitFor(() => {
//       expect(screen.getByText('User: Test User')).toBeInTheDocument();
//     });

//     expect(API.get).toHaveBeenCalledWith('/api/customers/me');
//     expect(mockFirebaseUser.getIdToken).toHaveBeenCalledWith(true);
//   });

//   test('handles API error by setting current user to null', async () => {
//     API.get.mockRejectedValue(new Error('API Error'));
//     const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

//     render(
//       <AuthProvider>
//         <AuthContext.Consumer>
//           {(value) => <div>User: {value.currentUser ? 'exists' : 'null'}</div>}
//         </AuthContext.Consumer>
//       </AuthProvider>
//     );

//     await waitFor(() => {
//       expect(screen.getByText('User: null')).toBeInTheDocument();
//     });

//     expect(consoleSpy).toHaveBeenCalledWith('AuthContext /me error:', expect.any(Error));
//     consoleSpy.mockRestore();
//   });

//   test('handles no Firebase user', async () => {
//     CustomerAuth.onAuthStateChanged.mockImplementation((callback) => {
//       callback(null);
//       return mockUnsubscribe;
//     });

//     render(
//       <AuthProvider>
//         <AuthContext.Consumer>
//           {(value) => <div>User: {value.currentUser ? 'exists' : 'null'}</div>}
//         </AuthContext.Consumer>
//       </AuthProvider>
//     );

//     await waitFor(() => {
//       expect(screen.getByText('User: null')).toBeInTheDocument();
//     });

//     expect(API.get).not.toHaveBeenCalled();
//   });

//   test('logout function works correctly', async () => {
//     const TestComponent = () => {
//       const { logout, currentUser } = React.useContext(AuthContext);
//       return (
//         <div>
//           <button onClick={logout}>Logout</button>
//           <div>User: {currentUser ? 'exists' : 'null'}</div>
//         </div>
//       );
//     };

//     render(
//       <AuthProvider>
//         <TestComponent />
//       </AuthProvider>
//     );

//     await waitFor(() => {
//       expect(screen.getByText('User: exists')).toBeInTheDocument();
//     });

//     act(() => {
//       screen.getByText('Logout').click();
//     });

//     await waitFor(() => {
//       expect(screen.getByText('User: null')).toBeInTheDocument();
//     });

//     expect(firebaseAuth.signOut).toHaveBeenCalledWith(CustomerAuth);
//   });

//   test('refreshUser function works correctly', async () => {
//     const TestComponent = () => {
//       const { refreshUser, currentUser } = React.useContext(AuthContext);
//       return (
//         <div>
//           <button onClick={refreshUser}>Refresh</button>
//           <div>User: {currentUser?.name || 'null'}</div>
//         </div>
//       );
//     };

//     render(
//       <AuthProvider>
//         <TestComponent />
//       </AuthProvider>
//     );

//     await waitFor(() => {
//       expect(screen.getByText('User: Test User')).toBeInTheDocument();
//     });

//     API.get.mockResolvedValue({ data: { customer: { id: '123', name: 'Updated User' } } });

//     act(() => {
//       screen.getByText('Refresh').click();
//     });

//     await waitFor(() => {
//       expect(screen.getByText('User: Updated User')).toBeInTheDocument();
//     });

//     expect(mockFirebaseUser.getIdToken).toHaveBeenCalledWith(true);
//     expect(API.get).toHaveBeenCalledWith('/api/customers/me');
//   });

//   test('cleans up Firebase listener on unmount', () => {
//     const { unmount } = render(
//       <AuthProvider>
//         <div>Test</div>
//       </AuthProvider>
//     );

//     unmount();
//     expect(mockUnsubscribe).toHaveBeenCalled();
//   });

//   test('blocks rendering while loading', () => {
//     CustomerAuth.onAuthStateChanged.mockImplementation(() => mockUnsubscribe);

//     const { container } = render(
//       <AuthProvider>
//         <div>Protected Content</div>
//       </AuthProvider>
//     );

//     expect(container.textContent).not.toContain('Protected Content');
//   });

//   test('shows content after loading completes', async () => {
//     const { container } = render(
//       <AuthProvider>
//         <div>Protected Content</div>
//       </AuthProvider>
//     );

//     await waitFor(() => {
//       expect(container.textContent).toContain('Protected Content');
//     });
//   });
// });
