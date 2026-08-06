const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.post('/', verifyToken, async (req, res) =>
{
  const connection = await db.getConnection();

  try
  {
    const { name, description, focusType } = req.body;
    const userId = req.user.userId;

    if (!name)
    {
      return res.status(400).json({ error: 'name is required' });
    }

    await connection.beginTransaction();

    const [clubResult] = await connection.query(
      'INSERT INTO clubs (name, description, focus_type, created_by) VALUES (?, ?, ?, ?)',
      [name, description || null, focusType || 'both', userId]
    );

    const clubId = clubResult.insertId;

    await connection.query(
      'INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)',
      [clubId, userId, 'owner']
    );

    await connection.commit();

    res.status(201).json({ message: 'Club created', clubId });
  }
  catch (err)
  {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
  finally
  {
    connection.release();
  }
});

router.get('/', async (req, res) =>
{
  try
  {
    const { focusType, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, description, focus_type, created_by, created_at FROM clubs';
    let countQuery = 'SELECT COUNT(*) AS total FROM clubs';
    let params = [];

    if (focusType)
    {
      query += ' WHERE focus_type = ?';
      countQuery += ' WHERE focus_type = ?';
      params.push(focusType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const [clubs] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    const [countResult] = await db.query(countQuery, params);

    res.json(
    {
      clubs,
      pagination:
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) =>
{
  try
  {
    const { id } = req.params;

    const [clubRows] = await db.query('SELECT * FROM clubs WHERE id = ?', [id]);

    if (clubRows.length === 0)
    {
      return res.status(404).json({ error: 'Club not found' });
    }

    const [members] = await db.query(
      `SELECT u.id, u.username, cm.role, cm.joined_at
       FROM club_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.club_id = ?
       ORDER BY cm.joined_at`,
      [id]
    );

    res.json({ ...clubRows[0], members });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:userId', async (req, res) =>
{
  try
  {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [clubs] = await db.query(
      `SELECT c.id, c.name, c.description, c.focus_type, cm.role
       FROM club_members cm
       JOIN clubs c ON cm.club_id = c.id
       WHERE cm.user_id = ?
       ORDER BY cm.joined_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) AS total FROM club_members WHERE user_id = ?',
      [userId]
    );

    res.json(
    {
      clubs,
      pagination:
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/join', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const userId = req.user.userId;

    const [clubRows] = await db.query('SELECT * FROM clubs WHERE id = ?', [id]);

    if (clubRows.length === 0)
    {
      return res.status(404).json({ error: 'Club not found' });
    }

    await db.query(
      'INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)',
      [id, userId, 'member']
    );

    res.status(201).json({ message: 'Joined club' });
  }
  catch (err)
  {
    if (err.code === 'ER_DUP_ENTRY')
    {
      return res.status(409).json({ error: 'You are already a member of this club' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/leave', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const userId = req.user.userId;

    const [membership] = await db.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ?',
      [id, userId]
    );

    if (membership.length === 0)
    {
      return res.status(404).json({ error: 'You are not a member of this club' });
    }

    if (membership[0].role === 'owner')
    {
      return res.status(403).json({ error: 'Owners cannot leave their own club. Transfer ownership or delete the club instead.' });
    }

    await db.query('DELETE FROM club_members WHERE club_id = ? AND user_id = ?', [id, userId]);

    res.json({ message: 'Left club' });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a club (protected — owner only)
router.delete('/:id', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const userId = req.user.userId;

    const [membership] = await db.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ?',
      [id, userId]
    );

    if (membership.length === 0 || membership[0].role !== 'owner')
    {
      return res.status(403).json({ error: 'Only the club owner can delete this club' });
    }

    await db.query('DELETE FROM clubs WHERE id = ?', [id]);

    res.json({ message: 'Club deleted' });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) =>
{
  try
  {
    const { type, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = 'SELECT id, type, title, added_by, created_at FROM media_items';
    let countQuery = 'SELECT COUNT(*) AS total FROM media_items';
    let params = [];

    if (type)
    {
      query += ' WHERE type = ?';
      countQuery += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const [items] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    const [countResult] = await db.query(countQuery, params);

    res.json(
    {
      items,
      pagination:
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/meetings', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const { mediaId, meetingDate, notes } = req.body;
    const userId = req.user.userId;

    if (!meetingDate)
    {
      return res.status(400).json({ error: 'meetingDate is required' });
    }

    const [membership] = await db.query(
      'SELECT * FROM club_members WHERE club_id = ? AND user_id = ?',
      [id, userId]
    );

    if (membership.length === 0 || membership[0].role !== 'owner')
    {
      return res.status(403).json({ error: 'Only the club owner can schedule meetings' });
    }

    const [result] = await db.query(
      'INSERT INTO meetings (club_id, media_id, meeting_date, notes, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, mediaId || null, meetingDate, notes || null, userId]
    );

    res.status(201).json({ message: 'Meeting scheduled', meetingId: result.insertId });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/meetings', async (req, res) =>
{
  try
  {
    const { id } = req.params;

    const [meetings] = await db.query(
      `SELECT m.id, m.meeting_date, m.notes, mi.title AS media_title, mi.type AS media_type
       FROM meetings m
       LEFT JOIN media_items mi ON m.media_id = mi.id
       WHERE m.club_id = ?
       ORDER BY m.meeting_date DESC`,
      [id]
    );

    res.json({ meetings });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;