import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const registration = credentials.extend({
  name: z.string().trim().min(1).max(100),
});

function setSession(res: Response, userId: string) {
  const token = jwt.sign(
    { userId },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('session', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response) {
  const p = registration.safeParse(req.body);

  if (!p.success) {
    return res.status(400).json({
      message: 'Invalid registration data.',
    });
  }

  const email = p.data.email.toLowerCase();

  if (await User.exists({ email })) {
    return res.status(409).json({
      message: 'An account with this email already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(p.data.password, 12);

  const user = await User.create({
    name: p.data.name,
    email,
    passwordHash,
  });

  setSession(res, user.id);

  return res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}

export async function login(req: Request, res: Response) {
  const p = credentials.safeParse(req.body);

  if (!p.success) {
    return res.status(400).json({
      message: 'Invalid credentials.',
    });
  }

  const user = await User.findOne({
    email: p.data.email.toLowerCase(),
  });

  if (
    !user ||
    !(await bcrypt.compare(p.data.password, user.passwordHash))
  ) {
    return res.status(401).json({
      message: 'Invalid email or password.',
    });
  }

  setSession(res, user.id);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}

export function logout(_req: Request, res: Response) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('session', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });

  return res.status(204).send();
}

export async function me(req: any, res: Response) {
  const user = await User.findById(req.userId)
    .select('_id name email');

  if (!user) {
    return res.status(401).json({
      message: 'Session expired.',
    });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}