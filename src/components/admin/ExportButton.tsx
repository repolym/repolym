import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ExportButtonProps {
    data: any;
    filters: any;
    label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, filters, label = 'خروجی' }) => {
    const [exporting, setExporting] = useState(false);
    const { showToast } = useToast();

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        setExporting(true);
        try {
            // Simulate export - in real implementation, generate file
            await new Promise(resolve => setTimeout(resolve, 1000));
            showToast(`خروجی ${format} با موفقیت دانلود شد`, 'success');
        } catch (error) {
            showToast('خطا در خروجی', 'error');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="relative inline-block">
            <Button
                variant="primary"
                onClick={() => handleExport('csv')}
                loading={exporting}
                disabled={!data}
            >
                <Download className="w-4 h-4" />
                {label}
            </Button>
            {/* Dropdown for format selection can be added here */}
        </div>
    );
};