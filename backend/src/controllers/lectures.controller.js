import { query } from '../config/db.js';

export const createLecture = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      overview = '',
      duration_sec = 0,
      engine_used = 'whisper-large-v3',
      language = 'en',
      file_name = '',
      transcript = '',
      key_concepts = [],
      main_arguments = [],
      important_terms = [],
      study_notes = [],
      key_takeaways = [],
      revision_questions = [],
      notes_markdown = '',
      tutor_history = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TITLE',
        message: 'Lecture title is required.',
      });
    }

    const sql = `
      INSERT INTO lectures (
        user_id, title, overview, duration_sec, engine_used, language, file_name,
        transcript, key_concepts, main_arguments, important_terms, study_notes,
        key_takeaways, revision_questions, notes_markdown, tutor_history
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16::jsonb
      ) RETURNING *
    `;

    const values = [
      userId,
      title,
      overview,
      duration_sec,
      engine_used,
      language,
      file_name,
      transcript,
      JSON.stringify(key_concepts),
      JSON.stringify(main_arguments),
      JSON.stringify(important_terms),
      JSON.stringify(study_notes),
      JSON.stringify(key_takeaways),
      JSON.stringify(revision_questions),
      notes_markdown,
      JSON.stringify(tutor_history),
    ];

    const result = await query(sql, values);

    res.status(201).json({
      success: true,
      lecture: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

export const getLectures = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT id, title, overview, duration_sec, engine_used, language, file_name, created_at, updated_at FROM lectures WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json({
      success: true,
      lectures: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

export const getLectureById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query('SELECT * FROM lectures WHERE id = $1 AND user_id = $2', [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'LECTURE_NOT_FOUND',
        message: 'Lecture record not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      lecture: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

export const updateLecture = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, overview, study_notes, notes_markdown } = req.body;

    const fetchRes = await query('SELECT * FROM lectures WHERE id = $1 AND user_id = $2', [id, userId]);
    if (fetchRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'LECTURE_NOT_FOUND',
        message: 'Lecture record not found or access denied.',
      });
    }

    const current = fetchRes.rows[0];

    const updatedTitle = title !== undefined ? title : current.title;
    const updatedOverview = overview !== undefined ? overview : current.overview;
    const updatedStudyNotes = study_notes !== undefined ? JSON.stringify(study_notes) : JSON.stringify(current.study_notes);
    const updatedMarkdown = notes_markdown !== undefined ? notes_markdown : current.notes_markdown;

    const sql = `
      UPDATE lectures
      SET title = $1, overview = $2, study_notes = $3::jsonb, notes_markdown = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `;

    const updateRes = await query(sql, [updatedTitle, updatedOverview, updatedStudyNotes, updatedMarkdown, id, userId]);

    res.status(200).json({
      success: true,
      lecture: updateRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

export const deleteLecture = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query('DELETE FROM lectures WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'LECTURE_NOT_FOUND',
        message: 'Lecture record not found or access denied.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lecture record deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const appendTutorHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { message, reply, turn } = req.body;

    const fetchRes = await query('SELECT tutor_history FROM lectures WHERE id = $1 AND user_id = $2', [id, userId]);
    if (fetchRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'LECTURE_NOT_FOUND',
        message: 'Lecture record not found or access denied.',
      });
    }

    const currentHistory = fetchRes.rows[0].tutor_history || [];
    const newTurns = turn ? [turn] : [
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
    ];

    const updatedHistory = [...currentHistory, ...newTurns];

    const updateRes = await query(
      'UPDATE lectures SET tutor_history = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING tutor_history',
      [JSON.stringify(updatedHistory), id, userId]
    );

    res.status(200).json({
      success: true,
      tutor_history: updateRes.rows[0].tutor_history,
    });
  } catch (err) {
    next(err);
  }
};
