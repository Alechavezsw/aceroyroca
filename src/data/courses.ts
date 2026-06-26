import { MINING_COURSE, type CourseStage } from './miningCourse';

export interface Course {
  id: string;
  title: string;
  description: string;
  stages: CourseStage[];
  isBuiltIn?: boolean;
  createdAt: string;
}

export const BUILT_IN_COURSE_ID = 'course-mineria-fundamentos';

export const BUILT_IN_COURSE: Course = {
  id: BUILT_IN_COURSE_ID,
  title: 'Fundamentos de Minería',
  description: 'Formación completa en geología, procesos, economía y periodismo minero para columnistas.',
  stages: MINING_COURSE,
  isBuiltIn: true,
  createdAt: '2024-01-01T00:00:00.000Z'
};

export function getCourseModuleCount(course: Course): number {
  return course.stages.reduce((sum, s) => sum + s.modules.length, 0);
}

export function findModuleInCourse(course: Course, moduleId: string) {
  for (const stage of course.stages) {
    const module = stage.modules.find(m => m.id === moduleId);
    if (module) return { stage, module };
  }
  return null;
}
