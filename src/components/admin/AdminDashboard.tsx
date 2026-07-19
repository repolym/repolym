// src/components/admin/AdminDashboard.tsx
import React from 'react';
import { AiAssistantSection } from '../dashboard/sections/AiAssistantSection';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="p-4 md:p-6 max-w-full mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">دستیار هوش مصنوعی مدیریت</h1>
      <p className="text-text-secondary mb-6">
        از این دستیار برای تحلیل عملکرد دانش‌آموزان، دریافت بینش‌های مدیریتی و پاسخ به سوالات خود استفاده کنید.
      </p>
      <AiAssistantSection />
    </div>
  );
};

export default AdminDashboard;