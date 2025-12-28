// src/services/syllabusService.js
import { db } from '../db';

export const syllabusService = {
  // --- MASTER DATA ---
  getSettings: async () => {
    return await db.settings.toArray();
  },

  // --- SYLLABUS (MATERI) ---
  getSyllabusWithCounts: async (level, subject) => {
    const syllabus = await db.syllabus
      .where('level').equals(parseInt(level))
      .filter(item => item.subject === subject)
      .sortBy('meetingOrder');

    const templates = await db.assessments_meta
      .where({ classId: 'TEMPLATE', subject: subject })
      .toArray();

    return syllabus.map(item => {
        const count = templates.filter(t => t.syllabusId === item.id).length;
        return { ...item, exerciseCount: count };
    });
  },

  addSyllabus: async (data) => {
    return await db.syllabus.add(data);
  },

  updateSyllabus: async (id, data) => {
    return await db.syllabus.update(id, data);
  },

  deleteSyllabus: async (id) => {
    return await db.transaction('rw', db.syllabus, db.assessments_meta, async () => {
      await db.syllabus.delete(id);
      await db.assessments_meta.where({ syllabusId: id, classId: 'TEMPLATE' }).delete();
    });
  },

  // --- TEMPLATES (LATIHAN) ---
  getTemplatesBySyllabusId: async (syllabusId) => {
    return await db.assessments_meta
      .where({ classId: 'TEMPLATE', syllabusId: syllabusId })
      .toArray();
  },

  addTemplate: async (data) => {
    return await db.assessments_meta.add({
        ...data,
        classId: 'TEMPLATE', 
        date: new Date().toISOString()
    });
  },

  // --- FITUR BARU: UPDATE TEMPLATE ---
  updateTemplate: async (id, data) => {
    return await db.assessments_meta.update(id, data);
  },

  deleteTemplate: async (id) => {
    return await db.assessments_meta.delete(id);
  },

  // --- ASSESSMENTS (NILAI PAGE) ---
  deleteAssessmentAndGrades: async (id) => {
    return await db.transaction('rw', db.assessments_meta, db.grades, async () => {
        await db.assessments_meta.delete(id);
        await db.grades.where({ assessmentMetaId: id }).delete();
    });
  }
};