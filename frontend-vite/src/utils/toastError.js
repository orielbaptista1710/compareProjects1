import toast from 'react-hot-toast';

const toastError = (err, fallback = 'Something went wrong. Please try again.') => {
  const status = err.response?.status;
  const serverMsg = err.response?.data?.message;

  if (status === 403) return toast.error('Your account has been deactivated. Contact admin.');
  if (status === 429) return toast.error('Too many requests. Please slow down.');
  if (status === 401) return toast.error('Session expired. Please log in again.');
  if (status === 404) return toast.error('Resource not found.');
  if (status === 500) return toast.error('Server error. Please try again shortly.');
  if (!err.response)  return toast.error('Server unreachable. Try again in 30 seconds.');

  toast.error(serverMsg || fallback);
};

export default toastError;