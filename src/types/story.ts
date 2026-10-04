export interface StyleBible {
  id: string;
  projectId: string;
  art_style: string;
  palette: string[];
  lighting_default: string;
  aspect_ratio: '16:9' | '4:3' | '1:1' | '9:16' | '21:9';
  render_medium: string;
  locked_style_prompt_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  age: string;
  appearance: string;
  uniform: string;
  hair: string;
  reference_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  description: string;
  weather: string;
  time_of_day: string;
  reference_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  story_notes: string;
  genre: string;
  historically_grounded: boolean;
  status: 'SETUP' | 'IN_PROGRESS' | 'COMPLETE';
  styleBible: StyleBible;
  characters: Character[];
  environments: Environment[];
  created_at: string;
  updated_at: string;
}

export interface ExtractBiblesResponse {
  art_style: string;
  palette: string[];
  lighting_default: string;
  aspect_ratio: '16:9' | '4:3' | '1:1' | '9:16' | '21:9';
  render_medium: string;
  locked_style_prompt_prefix: string;
  characters: Array<{
    name: string;
    role: string;
    age: string;
    appearance: string;
    uniform: string;
    hair: string;
  }>;
  environments: Array<{
    name: string;
    description: string;
    weather: string;
    time_of_day: string;
  }>;
}
