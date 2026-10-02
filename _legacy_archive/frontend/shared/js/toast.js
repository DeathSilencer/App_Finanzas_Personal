/**
 * toast.js — Sistema de notificaciones toast compartido
 * Exporta: showToast(message, type)
 * type: 'success' | 'warning' | 'error'
 */

function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClasses = {
        success: 'bg-emerald-950 text-emerald-200 border-emerald-800',
        warning: 'bg-amber-950 text-amber-200 border-amber-800',
        error:   'bg-rose-950 text-rose-200 border-rose-800'
    };
    const colors = colorClasses[type] || colorClasses.success;

    toast.className = `px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border transition-all duration-300 transform translate-y-2 pointer-events-auto ${colors}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
