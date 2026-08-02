import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ExportButtonProps {
    data: any;
    label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, label = 'خروجی' }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        if (!data) {
            showToast('داده‌ای برای خروجی وجود ندارد', 'error');
            return;
        }
        setLoading(true);
        try {
            // Simulate export - in production, this would call a service
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast(`خروجی ${format === 'csv' ? 'CSV' : format === 'excel' ? 'Excel' : 'PDF'} با موفقیت ایجاد شد`, 'success');
        } catch (err) {
            showToast('خطا در ایجاد خروجی', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative inline-block">
            <Button variant="secondary" loading={loading} onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4" />
                {label}
            </Button>
            {/* In a real implementation, we'd have a dropdown for format selection */}
        </div>
    );
};