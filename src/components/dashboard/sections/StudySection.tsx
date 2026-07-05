// src/components/dashboard/sections/StudySection.tsx
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '../../common/Button';

export default function StudySection() {
    return (
        <div className="space-y-6 dir-rtl text-right">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <BookOpen className="w-12 h-12 text-indigo-600" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800">مدیریت جلسات مطالعه</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    برای ثبت جلسات مطالعه جدید، مشاهدهٔ جلسات امروز، انجام چک‌این روزانه و دسترسی به تاریخچه،
                    به صفحهٔ اختصاصی مطالعات بروید.
                </p>
                <div className="mt-6">
                    <Link to="/study">
                        <Button variant="primary" size="md" className="gap-2">
                            رفتن به صفحهٔ مطالعات
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}