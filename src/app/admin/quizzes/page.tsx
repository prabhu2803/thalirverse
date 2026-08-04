'use client';
import { useEffect } from 'react';

export default function AdminQuizzesRedirect() {
  useEffect(() => { window.location.href = '/admin/modules'; }, []);
  return null;
}
