import { supabase } from '@/lib/supabaseClient';
import LandingPageClient from './LandingPageClient';

async function getPublishedModules() {
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, description, category')
    .eq('is_published', true)
    .order('order_index');

  if (!modules?.length) return [];

  const { data: lessons } = await supabase
    .from('lessons')
    .select('module_id');

  return modules.map(m => ({
    ...m,
    lessonCount: lessons?.filter((l: any) => l.module_id === m.id).length ?? 0,
  }));
}

export default async function LandingPage() {
  const modules = await getPublishedModules();
  return <LandingPageClient modules={modules} />;
}
