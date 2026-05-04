import catchAsync from '../../utils/catchAsync.js';
import * as authService from './auth.service.js';

/** POST /api/v1/auth/register */
export const registerUser = catchAsync(async (req, res) => {
  const { email, password } = req.body ?? {};
  const { token, user } = await authService.registerUser(email, password);
  res.status(201).json({ message: 'User registered', token, user });
});

/** POST /api/v1/auth/login */
export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body ?? {};
  const { token, user } = await authService.loginUser(email, password);
  res.status(200).json({ message: 'Login successful', token, user });
});
