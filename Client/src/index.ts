// Export types
export * from './types/auth.types';
export * from './types/api.types';
export * from './types/note.types';
export * from './types/category.types';
export * from './types/tag.types';

// Export services
export { authService } from './services/authService';
export { notesService } from './services/notesService';
export { categoriesService } from './services/categoriesService';
export { tagsService } from './services/tagsService';
export { storageService } from './services/storageService';
export { default as api } from './services/api';

// Export context
export { AuthProvider, useAuth } from './context/AuthContext';
export { NotesProvider, useNotes } from './context/NotesContext';
export { CategoriesProvider, useCategories } from './context/CategoriesContext';
export { TagsProvider, useTags } from './context/TagsContext';

// Export utils
export { validation } from './utils/validation';
export * from './utils/constants';

