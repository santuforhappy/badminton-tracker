import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ toasts }) {
    if (!toasts || toasts.length === 0) return null;

    const iconMap = {
        success: <CheckCircle size={18} />,
        error: <AlertCircle size={18} />,
        info: <Info size={18} />,
    };

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    {iconMap[toast.type] || iconMap.info}
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
