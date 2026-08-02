import React from 'react';
import { ChevronRight, Award } from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';

interface OlympiadLeaderboardProps {
    olympiads: { olympiad: string; count: number }[];
    onOlympiadClick: (olympiad: string) => void;
}

export const OlympiadLeaderboard: React.FC<OlympiadLeaderboardProps> = ({ olympiads, onOlympiadClick }) => {
    return (
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    المپیادهای برتر
                </h3>
                <button className="text-xs text-accent hover:text-accent-hover">مشاهده همه</button>
            </div>
            {olympiads.length === 0 ? (
                <p className="text-center text-text-tertiary text-sm py-8">داده‌ای موجود نیست</p>
            ) : (
                <div className="space-y-2">
                    {olympiads.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 hover:bg-surface-2 rounded-xl transition-colors cursor-pointer"
                            onClick={() => onOlympiadClick(item.olympiad)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-text-tertiary w-6">{toPersianDigits(idx + 1)}</span>
                                <span className="text-sm font-medium text-text-primary">{item.olympiad}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-secondary">{toPersianDigits(item.count)} دانش‌آموز</span>
                                <ChevronRight className="w-4 h-4 text-text-tertiary" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};