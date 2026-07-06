// Simple Tabs component – copied from DashboardTabs pattern but generic
import React, { useState } from 'react';

interface TabsProps {
    defaultIndex?: number;
    children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ defaultIndex = 0, children }) => {
    const [activeIndex, setActiveIndex] = useState(defaultIndex);
    const childrenArray = React.Children.toArray(children);
    const tabList = childrenArray.find((child: any) => child.type === TabList);
    const tabPanels = childrenArray.find((child: any) => child.type === TabPanels);

    return (
        <div>
            {tabList && React.cloneElement(tabList as any, { activeIndex, setActiveIndex })}
            {tabPanels && React.cloneElement(tabPanels as any, { activeIndex })}
        </div>
    );
};

export const TabList: React.FC<{ children: React.ReactNode; activeIndex?: number; setActiveIndex?: (i: number) => void }> =
    ({ children, activeIndex, setActiveIndex }) => {
        const tabs = React.Children.map(children, (child, i) =>
            React.cloneElement(child as any, { isActive: i === activeIndex, onClick: () => setActiveIndex?.(i) })
        );
        return <div className="flex gap-2 border-b border-border pb-2 mb-4">{tabs}</div>;
    };

export const Tab: React.FC<{ children: React.ReactNode; isActive?: boolean; onClick?: () => void }> =
    ({ children, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-accent-muted text-accent-hover shadow-sm' : 'text-text-secondary hover:bg-surface-2 hover:text-text-secondary'
                }`}
        >
            {children}
        </button>
    );

export const TabPanels: React.FC<{ children: React.ReactNode; activeIndex?: number }> = ({ children, activeIndex }) => {
    const panels = React.Children.toArray(children);
    return <div>{panels[activeIndex ?? 0]}</div>;
};

export const TabPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
