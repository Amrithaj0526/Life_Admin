import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database.js';

export const vaultController = {
  // 1. List vaults for user
  async list(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const db = await getDatabase();

      const result = await db.query(
        `SELECT v.*, vm.role
         FROM vaults v
         JOIN vault_members vm ON v.id = vm.vault_id
         WHERE vm.user_id = $1`,
        [userId]
      );

      return res.json({ vaults: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. Create family vault
  async create(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { name, description } = req.body;
      const db = await getDatabase();
      const vaultId = uuidv4();

      await db.query(
        `INSERT INTO vaults (id, owner_id, name, description, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [vaultId, userId, name, description || null]
      );

      // Add creator as OWNER
      await db.query(
        `INSERT INTO vault_members (id, vault_id, user_id, role, created_at)
         VALUES ($1, $2, $3, 'OWNER', CURRENT_TIMESTAMP)`,
        [uuidv4(), vaultId, userId]
      );

      return res.status(201).json({ id: vaultId, name, role: 'OWNER' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. Add vault member
  async addMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      const db = await getDatabase();

      const userRes = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User with provided email not found.' });
      }

      const targetUserId = userRes.rows[0].id;
      await db.query(
        `INSERT INTO vault_members (id, vault_id, user_id, role, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [uuidv4(), id, targetUserId, role || 'VIEWER']
      );

      return res.status(201).json({ message: 'Family member added to vault successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
};
