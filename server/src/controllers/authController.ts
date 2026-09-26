import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDatabase } from '../config/database.js';
import { config } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = registerSchema.parse(req.body);
      const db = await getDatabase();

      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await db.query(
        'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
        [userId, name, email, passwordHash]
      );

      // Log audit
      await db.query(
        'INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuidv4(), userId, 'AUTH', userId, 'USER_REGISTERED', JSON.stringify({ email })]
      );

      const token = jwt.sign({ id: userId, name, email }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn as any,
      });

      return res.status(201).json({
        user: { id: userId, name, email },
        token,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Registration failed' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const db = await getDatabase();

      const result = await db.query(
        'SELECT id, name, email, password_hash FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      // Audit log
      await db.query(
        'INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuidv4(), user.id, 'AUTH', user.id, 'USER_LOGIN', JSON.stringify({ email })]
      );

      return res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Login failed' });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const db = await getDatabase();
      const result = await db.query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [req.user!.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  async logout(_req: Request, res: Response) {
    return res.json({ message: 'Logged out successfully' });
  },
};
