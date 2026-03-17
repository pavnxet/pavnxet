import { NextResponse } from 'next/server';
import { getProjects, saveProjects, Project } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const projects = getProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const { name, url, icon } = await request.json();
    if (!name || !url) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
    }

    const projects = getProjects();
    const newProject: Project = {
      id: uuidv4(),
      name,
      url,
      icon: icon || '/favicon.ico',
    };

    projects.push(newProject);
    saveProjects(projects);

    return NextResponse.json(newProject);
  } catch {
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}
