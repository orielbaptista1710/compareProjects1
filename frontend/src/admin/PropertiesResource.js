// import React from 'react';
// import { List, Datagrid, TextField, FunctionField, useNotify, useRefresh } from 'react-admin';
// import API from '../api';
// import image1 from "../images/image1.jpg";

// const renderMedia = (media) => {
//     if (!media) return null;
//     return Array.isArray(media) ? (
//         <div className="media-grid">
//             {media.map((item, index) => {
//                 const src = typeof item === 'object' ? item.src : item;
//                 return (
//                     <img
//                         key={index}
//                         src={`${process.env.REACT_APP_API_BASE_URL}${src}`}
//                         alt=""
//                         width={100}
//                         height={80}
//                         onError={(e) => e.target.src = image1}
//                         style={{ objectFit: 'cover', marginRight: 5 }}
//                     />
//                 );
//             })}
//         </div>
//     ) : null;
// };

// export const PendingPropertiesList = () => {
//     const notify = useNotify();
//     const refresh = useRefresh();

//     const handleApprove = async (id) => {
//         try {
//             await API.put(`/api/admin/approve/${id}`);
//             notify('Property approved', { type: 'success' });
//             refresh();
//         } catch (err) {
//             notify('Approval failed', { type: 'error' });
//         }
//     };

//     const handleReject = async (id) => {
//         const reason = prompt('Enter rejection reason:');
//         if (!reason) return;
//         try {
//             await API.put(`/api/admin/reject/${id}`, { rejectionReason: reason });
//             notify('Property rejected', { type: 'warning' });
//             refresh();
//         } catch (err) {
//             notify('Rejection failed', { type: 'error' });
//         }
//     };

//     return (
//         <List resource="pending-properties" perPage={10}>
//             <Datagrid rowClick="edit">
//                 <TextField source="title" />
//                 <FunctionField label="Media" render={record => renderMedia(record.galleryImages || [])} />
//                 <TextField source="state" />
//                 <TextField source="city" />
//                 <TextField source="locality" />
//                 <FunctionField label="Actions" render={record => (
//                     <>
//                         <button onClick={() => handleApprove(record._id)}>Approve</button>
//                         <button onClick={() => handleReject(record._id)}>Reject</button>
//                     </>
//                 )} />
//             </Datagrid>
//         </List>
//     );
// };

// // All Properties List
// export const AllPropertiesList = () => {
//     return (
//         <List resource="all-properties" perPage={10}>
//             <Datagrid rowClick="edit">
//                 <TextField source="title" />
//                 <TextField source="developerName" label="Developer" />
//                 <TextField source="state" />
//                 <TextField source="city" />
//                 <TextField source="locality" />
//                 <TextField source="status" />
//                 <FunctionField label="Media" render={record => renderMedia(record.galleryImages || [])} />
//             </Datagrid>
//         </List>
//     );
// };
