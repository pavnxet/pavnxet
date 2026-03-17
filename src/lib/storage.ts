import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/data/projects.json');

export interface Project {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export const getProjects = (): Project[] => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
};

export const saveProjects = (projects: Project[]) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving projects:', error);
  }
};
